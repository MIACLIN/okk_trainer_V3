# OKK Voice Trainer

Голосовой тренажёр для сотрудников медицинских клиник — практика консультационных скриптов с ИИ-пациентом.

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Python FastAPI |
| STT | OpenAI Whisper API (`whisper-1`) |
| LLM | Anthropic Claude (`claude-sonnet-4-20250514`) |
| TTS | OpenAI TTS API (voice: `nova`) |

---

## Быстрый старт

### 1. Клонируйте / скопируйте проект

Убедитесь, что структура каталогов такая:
```
trainer_okk/
├── backend/
└── frontend/
```

### 2. Настройте переменные окружения

```bash
cd backend
cp .env.example .env
```

Откройте `.env` и заполните ключи:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 3. Запустите бэкенд

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API будет доступно на `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### 4. Запустите фронтенд

```bash
cd frontend
npm install
npm run dev
```

Откройте `http://localhost:5173`

---

## Сценарии (MVP)

| ID | Название | Пациент |
|----|---------|---------|
| `toothache_first_call` | Первичный звонок: острая боль | Марина, 34 года |
| `implant_upsell` | Апсейл: предложение имплантации | Андрей, 45 лет |
| `anxiety_new_patient` | Тревожный новый пациент | Ольга, 28 лет |

---

## API Endpoints

### `GET /scenarios`
Список доступных сценариев.

### `POST /session/start`
```json
{ "scenario_id": "toothache_first_call" }
```
Ответ: `session_id`, приветственный текст пациента и аудио (base64 MP3).

### `POST /session/message`
```json
{ "session_id": "...", "audio_base64": "..." }
```
Принимает аудио-запись пользователя (WebM), возвращает транскрипт, ответ пациента и аудио.

### `POST /session/evaluate`
```json
{ "session_id": "..." }
```
Запускает оценку всей беседы по чеклисту. Сессия удаляется после оценки.

---

## Управление

| Действие | Способ |
|---------|--------|
| Начать запись | Удерживать **Пробел** или кнопку микрофона |
| Остановить запись | Отпустить |
| Завершить и получить оценку | Кнопка «Завершить и получить оценку» |

---

## Структура проекта

```
backend/
├── main.py          # FastAPI приложение, CORS, endpoints
├── scenarios.py     # 3 сценария с карточками пациентов и чеклистами
├── patient_agent.py # Claude-агент пациента, хранение истории
├── evaluator.py     # Оценка беседы по чеклисту
└── requirements.txt

frontend/src/
├── App.tsx                        # Главный оркестратор состояния
├── api.ts                         # HTTP-клиент + аудио-утилиты
├── components/
│   ├── ScenarioSelector.tsx       # Экран выбора сценария
│   ├── VoiceRecorder.tsx          # Push-to-talk (Space / кнопка)
│   ├── ConversationView.tsx       # Транскрипт беседы
│   ├── PatientAvatar.tsx          # Статус пациента (анимация)
│   └── EvaluationReport.tsx      # Оценка + чеклист с комментариями
```
