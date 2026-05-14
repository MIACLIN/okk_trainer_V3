import base64
import io
import os
import tempfile
import uuid

from dotenv import load_dotenv
from gtts import gTTS
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from pydantic import BaseModel

import database
import evaluator
import patient_agent
from scenarios import SCENARIOS, get_scenario, list_scenarios

load_dotenv()

app = FastAPI(title="OKK Voice Trainer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

database.init_db()

TTS_VOICE = "ru-RU-SvetlanaNeural"


# ---------- helpers ----------

async def text_to_audio_base64(text: str) -> str:
    yandex_key = os.environ.get("YANDEX_TTS_KEY")
    yandex_folder = os.environ.get("YANDEX_FOLDER_ID")

    if yandex_key and yandex_folder:
        try:
            import asyncio
            def _yandex():
                import requests as req
                r = req.post(
                    "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
                    headers={"Authorization": f"Api-Key {yandex_key}"},
                    data={
                        "text": text,
                        "lang": "ru-RU",
                        "voice": "alena",
                        "folderId": yandex_folder,
                        "format": "mp3",
                        "sampleRateHertz": "48000",
                    },
                    timeout=10,
                )
                r.raise_for_status()
                return r.content
            data = await asyncio.to_thread(_yandex)
            print(f"[TTS] Yandex OK ({len(data)} bytes)")
            return base64.b64encode(data).decode("utf-8")
        except Exception as e:
            print(f"[TTS] Yandex failed: {e}, falling back to gTTS")

    # fallback to gTTS
    def _gtts():
        tts = gTTS(text=text, lang="ru", slow=False)
        b = io.BytesIO()
        tts.write_to_fp(b)
        b.seek(0)
        return base64.b64encode(b.read()).decode("utf-8")
    import asyncio
    return await asyncio.to_thread(_gtts)


def audio_base64_to_text(audio_b64: str) -> str:
    audio_bytes = base64.b64decode(audio_b64)
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        segments, _ = whisper_model.transcribe(tmp_path, language="ru")
        return " ".join(s.text for s in segments).strip()
    finally:
        os.unlink(tmp_path)


# ---------- schemas ----------

class StartSessionRequest(BaseModel):
    scenario_id: str


class MessageRequest(BaseModel):
    session_id: str
    audio_base64: str


class EvaluateRequest(BaseModel):
    session_id: str


class CreatePatientRequest(BaseModel):
    name: str
    gender: str
    disc_type: str
    reason: str
    hidden_need: str
    opening_line: str


# ---------- endpoints ----------

@app.get("/scenarios")
def get_scenarios():
    return list_scenarios()


@app.delete("/patient/{scenario_id}")
def delete_patient(scenario_id: str):
    if scenario_id not in SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")
    del SCENARIOS[scenario_id]
    return {"ok": True}


@app.post("/patient/create")
def create_patient(req: CreatePatientRequest):
    scenario_id = f"custom_{uuid.uuid4().hex[:8]}"

    disc_desc = {
        "D": "Ты решительный и напористый. Хочешь быстро получить результат, не терпишь промедлений.",
        "I": "Ты общительный и позитивный. Идёшь на контакт, любишь когда тебя слушают.",
        "S": "Ты терпеливый, немного тревожный. Ценишь заботу и мягкий подход.",
        "C": "Ты аналитичный и дотошный. Задаёшь уточняющие вопросы, хочешь понять всё до деталей.",
    }.get(req.disc_type, "")

    gender_word = "пациентка" if req.gender == "female" else "пациент"

    system_prompt = (
        f"Ты {gender_word} по имени {req.name}. "
        f"Причина обращения: {req.reason}. "
        f"Твоя внутренняя потребность (веди себя соответственно, но не говори об этом прямо): {req.hidden_need}. "
        f"{disc_desc} "
        f"Отвечай как живой человек, 1-3 предложения максимум. Говори на русском языке."
    )

    SCENARIOS[scenario_id] = {
        "id": scenario_id,
        "title": req.name,
        "description": req.reason,
        "patient": {
            "name": req.name,
            "age": 35,
            "profession": "",
            "disc_type": req.disc_type,
            "photo_id": 0,
            "system_prompt": system_prompt,
        },
        "context": req.reason,
        "tips": [
            "Выслушайте пациента внимательно с первых секунд",
            "Задавайте открытые вопросы, чтобы выявить скрытую потребность",
            "Предложите конкретное решение с обоснованием",
        ],
        "skill_focus": req.reason[:40],
        "checklist": [
            "Установил контакт и представился",
            "Выявил запрос пациента",
            "Проявил эмпатию",
            "Предложил решение",
            "Завершил разговор",
        ],
        "opening_line": req.opening_line,
    }

    return {"scenario_id": scenario_id}


@app.post("/session/start")
async def start_session(req: StartSessionRequest):
    scenario = get_scenario(req.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{req.scenario_id}' not found")

    session_id = str(uuid.uuid4())
    patient_agent.create_session(session_id, scenario)

    opening_text = scenario["opening_line"]
    patient_agent.sessions[session_id]["history"].append(
        {"role": "assistant", "content": opening_text}
    )

    audio_b64 = await text_to_audio_base64(opening_text)

    return {
        "session_id": session_id,
        "patient_greeting_text": opening_text,
        "patient_greeting_audio_base64": audio_b64,
        "scenario": {
            "id": scenario["id"],
            "title": scenario["title"],
            "patient_name": scenario["patient"]["name"],
            "patient_disc_type": scenario["patient"]["disc_type"],
            "patient_photo_id": scenario["patient"]["photo_id"],
            "context": scenario["context"],
            "checklist": scenario["checklist"],
        },
    }


@app.post("/session/message")
async def send_message(req: MessageRequest):
    if not patient_agent.session_exists(req.session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    user_text = audio_base64_to_text(req.audio_base64)

    if not user_text:
        raise HTTPException(status_code=422, detail="Не удалось распознать речь — говорите чётче")

    patient_text, session_ended, end_reason = patient_agent.get_patient_response(req.session_id, user_text)
    audio_b64 = await text_to_audio_base64(patient_text)

    return {
        "user_transcript": user_text,
        "patient_response_text": patient_text,
        "patient_response_audio_base64": audio_b64,
        "session_ended": session_ended,
        "end_reason": end_reason,
    }


@app.post("/session/evaluate")
def evaluate(req: EvaluateRequest):
    if not patient_agent.session_exists(req.session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    session = patient_agent.sessions[req.session_id]
    history = patient_agent.get_full_history(req.session_id)

    if len(history) < 2:
        raise HTTPException(status_code=422, detail="Разговор слишком короткий для оценки")

    result = evaluator.evaluate_session(session["scenario"], history)

    database.save_session(
        scenario_title=session["scenario"]["title"],
        patient_name=session["scenario"]["patient"]["name"],
        transcript=history,
        evaluation=result,
    )

    patient_agent.delete_session(req.session_id)

    return result


@app.get("/history")
def get_history():
    return database.list_sessions()


@app.get("/history/{history_id}")
def get_history_item(history_id: int):
    item = database.get_session(history_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@app.get("/health")
def health():
    return {"status": "ok"}
