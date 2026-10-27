import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks

from app.core.config import settings
from app.models.schemas import HarmonyType, HarmonizeResponse, JobStatus, JobFiles, AudioFiles, HARMONY_INFO
from app.harmonizers.harmony_engine import HarmonyEngine
from app.harmonizers.audio_to_midi import convert_audio_to_midi
from app.harmonizers.audio_synthesizer import AudioSynthesizer
from app.harmonizers.sheet_music import SheetMusicGenerator

router = APIRouter()

# In-memory job registry (can sync with Supabase)
JOBS_STORE = {}


@router.post(\"/harmonize\", response_model=HarmonizeResponse)
async def harmonize_audio(
    audio_file: UploadFile = File(...),
    harmony_type: HarmonyType = Form(HarmonyType.SATB),
    key: Optional[str] = Form(None),
    tempo: int = Form(90)
):
    \"\"\"
    Main Harmonization Endpoint:
    Accepts humming/singing audio, generates 7 harmony styles, produces individual vocal stems,
    piano accompaniment, and sheet music PDF.
    \"\"\"
    job_id = str(uuid.uuid4())
    job_dir = settings.STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # 1. Save uploaded audio
    input_audio_path = job_dir / f\"input_{audio_file.filename}\"
    with open(input_audio_path, \"wb\") as buffer:
        shutil.copyfileobj(audio_file.file, buffer)

    # 2. Convert Audio to MIDI
    melody_midi = job_dir / \"melody.mid\"
    convert_audio_to_midi(str(input_audio_path), str(melody_midi))

    # 3. Process harmony arrangement
    return execute_harmonization(job_id, melody_midi, harmony_type, key, tempo)


@router.post(\"/harmonize/{job_id}/reharmonize\", response_model=HarmonizeResponse)
async def reharmonize_job(
    job_id: str,
    harmony_type: HarmonyType = Form(...),
    key: Optional[str] = Form(None),
    tempo: int = Form(90)
):
    \"\"\"
    Re-processes an existing melody with a new harmony style without re-uploading.
    \"\"\"
    job_dir = settings.STORAGE_DIR / job_id
    melody_midi = job_dir / \"melody.mid\"

    if not melody_midi.exists():
        raise HTTPException(status_code=404, detail=\"Original job melody not found\")

    return execute_harmonization(job_id, melody_midi, harmony_type, key, tempo)


def execute_harmonization(job_id: str, melody_midi_path: Path, harmony_type: HarmonyType, key: Optional[str], tempo: int) -> HarmonizeResponse:
    job_dir = settings.STORAGE_DIR / job_id
    output_dir = job_dir / harmony_type.value.lower()
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Harmony Engine: Generate parts
    parts = HarmonyEngine.generate(
        melody_path_or_part=str(melody_midi_path),
        harmony_type=harmony_type,
        key_str=key,
        tempo_bpm=tempo
    )

    # 2. Synthesize Audio
    midis = AudioSynthesizer.parts_to_midis(parts, output_dir)
    audio_paths = AudioSynthesizer.render_audio_stems(midis, settings.SOUNDFONT_PATH)

    # 3. Sheet Music PDF
    score = SheetMusicGenerator.create_score(parts, title=\"Hymn arrangement\", harmony_type=harmony_type)
    pdf_path = output_dir / f\"sheet_music_{harmony_type.value}.pdf\"
    SheetMusicGenerator.export_pdf(score, pdf_path, settings.MUSESCORE_PATH)

    # 4. Construct file URLs (relative to /static/ or base API)
    base_url = f\"/storage/{job_id}/{harmony_type.value.lower()}\"
    audio_files = AudioFiles(
        soprano=f\"{base_url}/soprano.mp3\" if 'soprano' in audio_paths else None,
        alto=f\"{base_url}/alto.mp3\" if 'alto' in audio_paths else None,
        tenor=f\"{base_url}/tenor.mp3\" if 'tenor' in audio_paths else None,
        bass=f\"{base_url}/bass.mp3\" if 'bass' in audio_paths else None,
        full=f\"{base_url}/full.mp3\" if 'full' in audio_paths else None,
        piano=f\"{base_url}/piano.mp3\" if 'piano' in audio_paths else None,
    )

    job_files = JobFiles(
        midi=f\"{base_url}/full_score.mid\",
        pdf=f\"{base_url}/sheet_music_{harmony_type.value}.pdf\",
        audios=audio_files
    )

    response = HarmonizeResponse(
        job_id=job_id,
        harmony_type=harmony_type,
        key=key or \"Auto-Detected\",
        tempo=tempo,
        title=f\"Hymn Arrangement - {harmony_type.value}\",
        voices=list(parts.keys()),
        status=JobStatus.COMPLETED,
        files=job_files
    )

    JOBS_STORE[job_id] = response.model_dump()
    return response


@router.get(\"/harmonize/{job_id}\")
async def get_job_status(job_id: str):
    if job_id not in JOBS_STORE:
        raise HTTPException(status_code=404, detail=\"Job not found\")
    return JOBS_STORE[job_id]
