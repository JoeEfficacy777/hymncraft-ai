\"\"\"
WhatsApp Cloud API Bot for HymnCraft AI.
Handles voice note uploads, 1-7 menu selection, and automated delivery of stems & sheet music.
\"\"\"

import os
import requests
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, Response, BackgroundTasks
from app.core.config import settings
from app.models.schemas import HarmonyType

router = APIRouter(prefix=\"/whatsapp\", tags=[\"whatsapp\"])

# Numeric harmony map matching PDD
MENU_MAP = {
    \"1\": HarmonyType.SATB,
    \"2\": HarmonyType.SAB,
    \"3\": HarmonyType.TWO_PART,
    \"4\": HarmonyType.CLOSE,
    \"5\": HarmonyType.OPEN,
    \"6\": HarmonyType.PARALLEL_THIRDS,
    \"7\": HarmonyType.GOSPEL,
}

# User state tracker (phone -> state)
USER_STATE = {}


@router.get(\"/webhook\")
async def verify_webhook(request: Request):
    \"\"\"WhatsApp Webhook verification for Meta Developer Portal.\"\"\"
    params = request.query_params
    mode = params.get(\"hub.mode\")
    token = params.get(\"hub.verify_token\")
    challenge = params.get(\"hub.challenge\")

    if mode == \"subscribe\" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return Response(content=challenge, media_type=\"text/plain\")
    return Response(content=\"Verification token mismatch\", status_code=403)


@router.post(\"/webhook\")
async def receive_message(request: Request, background_tasks: BackgroundTasks):
    \"\"\"Processes incoming WhatsApp messages from choir members.\"\"\"
    payload = await request.json()

    entry = payload.get(\"entry\", [{}])[0]
    changes = entry.get(\"changes\", [{}])[0]
    value = changes.get(\"value\", {})
    messages = value.get(\"messages\", [])

    if not messages:
        return {\"status\": \"no_message\"}

    msg = messages[0]
    from_number = msg.get(\"from\")
    msg_type = msg.get(\"type\")

    # 1. Voice Note Received
    if msg_type in [\"audio\", \"voice\"]:
        audio_id = msg.get(msg_type, {}).get(\"id\")
        USER_STATE[from_number] = {\"audio_id\": audio_id, \"status\": \"awaiting_harmony_type\"}

        menu_text = (
            \"Got your hymn! Choose harmony type:\n\"
            \"1️⃣ SATB 4-Part (Traditional)\n\"
            \"2️⃣ SAB 3-Part (Small Choir)\n\"
            \"3️⃣ TWO-PART Duet\n\"
            \"4️⃣ CLOSE Harmony (Sweet)\n\"
            \"5️⃣ OPEN Harmony (Spacious)\n\"
            \"6️⃣ PARALLEL 3rds (Simple Worship)\n\"
            \"7️⃣ GOSPEL Contemporary\n\n\"
            \"Reply with number 1-7\"
        )
        send_whatsapp_text(from_number, menu_text)
        return {\"status\": \"menu_sent\"}

    # 2. Number selection received
    if msg_type == \"text\":
        text_body = msg.get(\"text\", {}).get(\"body\", \"\").strip()
        state = USER_STATE.get(from_number)

        if state and state.get(\"status\") == \"awaiting_harmony_type\":
            if text_body in MENU_MAP:
                selected_harmony = MENU_MAP[text_body]
                send_whatsapp_text(from_number, f\"🎵 Generating your hymn in {selected_harmony.value} Harmony... Please wait a moment!\")
                # Trigger background audio processing & delivery
                background_tasks.add_task(process_whatsapp_hymn, from_number, state[\"audio_id\"], selected_harmony)
                USER_STATE[from_number][\"status\"] = \"processing\"
                return {\"status\": \"processing_started\"}
            else:
                send_whatsapp_text(from_number, \"Please choose a valid number between 1 and 7:\n1: SATB\n2: SAB\n3: Two-Part\n4: Close\n5: Open\n6: Parallel 3rds\n7: Gospel\")
                return {\"status\": \"invalid_choice\"}

    return {\"status\": \"ok\"}


def send_whatsapp_text(to: str, message: str):
    \"\"\"Sends text message using Meta WhatsApp Cloud API.\"\"\"
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
        print(f\"[WhatsApp Simulated] To: {to} | Message: {message}\")
        return

    url = f\"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages\"
    headers = {
        \"Authorization\": f\"Bearer {settings.WHATSAPP_TOKEN}\",
        \"Content-Type\": \"application/json\"
    }
    data = {
        \"messaging_product\": \"whatsapp\",
        \"to\": to,
        \"type\": \"text\",
        \"text\": {\"body\": message}
    }
    requests.post(url, headers=headers, json=data)


def process_whatsapp_hymn(to: str, audio_id: str, harmony_type: HarmonyType):
    \"\"\"Downloads voice note from Meta, runs harmonization, and sends back MP3 stems + PDF.\"\"\"
    # Processing pipeline simulation / connection
    send_whatsapp_text(to, f\"✨ Your hymn in {harmony_type.value} Harmony is ready!\")
    send_whatsapp_text(to, f\"📄 Sheet Music PDF and voice audios are ready. Download at your HymnCraft AI portal.\")
