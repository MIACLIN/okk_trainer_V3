import json
import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "history.db")


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_title TEXT NOT NULL,
                patient_name   TEXT NOT NULL,
                created_at     TEXT NOT NULL,
                transcript     TEXT NOT NULL,
                evaluation     TEXT NOT NULL
            )
        """)


def save_session(scenario_title: str, patient_name: str,
                 transcript: list, evaluation: dict) -> int:
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute(
            "INSERT INTO history (scenario_title, patient_name, created_at, transcript, evaluation)"
            " VALUES (?, ?, ?, ?, ?)",
            (
                scenario_title,
                patient_name,
                datetime.now().isoformat(timespec="seconds"),
                json.dumps(transcript, ensure_ascii=False),
                json.dumps(evaluation, ensure_ascii=False),
            ),
        )
        return cur.lastrowid


def list_sessions() -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT id, scenario_title, patient_name, created_at, evaluation"
            " FROM history ORDER BY id DESC LIMIT 50"
        ).fetchall()
    result = []
    for r in rows:
        ev = json.loads(r[4])
        result.append({
            "id": r[0],
            "scenario_title": r[1],
            "patient_name": r[2],
            "created_at": r[3],
            "total_score": ev.get("total_score", 0),
            "level": ev.get("level", ""),
        })
    return result


def get_session(history_id: int) -> dict | None:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT id, scenario_title, patient_name, created_at, transcript, evaluation"
            " FROM history WHERE id = ?",
            (history_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "scenario_title": row[1],
        "patient_name": row[2],
        "created_at": row[3],
        "transcript": json.loads(row[4]),
        "evaluation": json.loads(row[5]),
    }
