import os
import re
from dotenv import load_dotenv
from openai import OpenAI
from scenarios import Scenario

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)

DEEPSEEK_MODEL = "deepseek-chat"

# Appended to every patient system prompt regardless of scenario source
_END_INSTRUCTION = """

СПЕЦИАЛЬНАЯ ИНСТРУКЦИЯ О ЗАВЕРШЕНИИ СЕССИИ:
Когда разговор подходит к логическому завершению — добавь в КОНЕЦ своей реплики один из тегов:
• [КОНЕЦ:записался] — пациент согласился записаться на приём и прощается
• [КОНЕЦ:ушёл] — пациент решил уйти: куратор нагрубил, оказал давление, не вызвал доверия,
  или пациент сказал «я подумаю» / «перезвоню» и явно завершает разговор
Тег ставится ТОЛЬКО один раз, строго в конце реплики, после основного текста.
Не используй тег раньше времени — только когда диалог действительно завершён.
Формат: просто текст реплики[КОНЕЦ:записался] — без пробела перед тегом."""

_END_PATTERN = re.compile(r'\s*\[КОНЕЦ:(записался|ушёл)\]')
_ACTION_PATTERN = re.compile(r'\([^)]*\)')

# In-memory session store: session_id -> {scenario, history}
sessions: dict[str, dict] = {}

MAX_HISTORY = 20


def create_session(session_id: str, scenario: Scenario) -> None:
    sessions[session_id] = {
        "scenario": scenario,
        "history": [],
    }


def get_patient_response(session_id: str, user_message: str) -> tuple[str, bool, str]:
    """Returns (patient_text, session_ended, end_reason)."""
    session = sessions[session_id]
    scenario = session["scenario"]
    history = session["history"]

    history.append({"role": "user", "content": user_message})

    if len(history) > MAX_HISTORY:
        history = history[-MAX_HISTORY:]
        session["history"] = history

    full_system = scenario["patient"]["system_prompt"] + _END_INSTRUCTION

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        max_tokens=200,
        temperature=0.8,
        messages=[
            {"role": "system", "content": full_system},
            *history,
        ],
    )

    raw = response.choices[0].message.content or ""

    match = _END_PATTERN.search(raw)
    session_ended = bool(match)
    end_reason = match.group(1) if match else ""
    patient_text = _END_PATTERN.sub("", raw)
    patient_text = _ACTION_PATTERN.sub("", patient_text).strip()

    history.append({"role": "assistant", "content": patient_text})

    return patient_text, session_ended, end_reason


def get_full_history(session_id: str) -> list[dict]:
    return sessions.get(session_id, {}).get("history", [])


def session_exists(session_id: str) -> bool:
    return session_id in sessions


def delete_session(session_id: str) -> None:
    sessions.pop(session_id, None)
