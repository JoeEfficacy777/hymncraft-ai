from enum import Enum
from typing import Dict, Optional, List
from pydantic import BaseModel, Field


class HarmonyType(str, Enum):
    SATB = "SATB"
    SAB = "SAB"
    TWO_PART = "TWO_PART"
    CLOSE = "CLOSE"
    OPEN = "OPEN"
    PARALLEL_THIRDS = "PARALLEL_THIRDS"
    GOSPEL = "GOSPEL"


HARMONY_INFO = {
    HarmonyType.SATB: {
        "title": "Four-Part Bach Chorale",
        "description": "Traditional hymn, classical rules, full church sound",
        "voices": ["soprano", "alto", "tenor", "bass"]
    },
    HarmonyType.SAB: {
        "title": "Three-Part Small Choir",
        "description": "For choirs without Tenors; merged Alto/Tenor middle voice",
        "voices": ["soprano", "alto", "bass"]
    },
    HarmonyType.TWO_PART: {
        "title": "Two-Part Duet",
        "description": "Soprano lead + sweet harmony in diatonic 3rds/6ths",
        "voices": ["soprano", "alto"]
    },
    HarmonyType.CLOSE: {
        "title": "Close Harmony",
        "description": "All voices within 1 octave, sweet barbershop/acapella sound",
        "voices": ["soprano", "alto", "tenor", "bass"]
    },
    HarmonyType.OPEN: {
        "title": "Open Cathedral Harmony",
        "description": "Spacious wide voicing, Bass 2 octaves below, grand sanctuary sound",
        "voices": ["soprano", "alto", "tenor", "bass"]
    },
    HarmonyType.PARALLEL_THIRDS: {
        "title": "Parallel Thirds / Sixths",
        "description": "Simple, second voice follows melody in diatonic 3rds for praise & worship",
        "voices": ["soprano", "alto"]
    },
    HarmonyType.GOSPEL: {
        "title": "Contemporary Gospel",
        "description": "Modern rich harmony with 7th/9th chords, passing tones, and walking bass",
        "voices": ["soprano", "alto", "tenor", "bass"]
    }
}


class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AudioFiles(BaseModel):
    soprano: Optional[str] = None
    alto: Optional[str] = None
    tenor: Optional[str] = None
    bass: Optional[str] = None
    full: Optional[str] = None
    piano: Optional[str] = None


class JobFiles(BaseModel):
    midi: Optional[str] = None
    pdf: Optional[str] = None
    audios: AudioFiles = Field(default_factory=AudioFiles)


class HarmonizeResponse(BaseModel):
    job_id: str
    harmony_type: HarmonyType
    key: Optional[str] = None
    tempo: int = 90
    title: Optional[str] = "Hymn"
    voices: List[str]
    status: JobStatus = JobStatus.COMPLETED
    files: JobFiles
    created_at: Optional[str] = None
