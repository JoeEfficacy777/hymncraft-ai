import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = \"HymnCraft AI - Multi-Harmony Edition\"
    VERSION: str = \"2.0.0\"
    API_V1_STR: str = \"/api/v1\"

    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / \"storage\"
    SOUNDFONT_PATH: str = os.getenv(\"SOUNDFONT_PATH\", str(BASE_DIR / \"soundfonts\" / \"FluidR3_GM.sf2\"))
    MUSESCORE_PATH: str = os.getenv(\"MUSESCORE_PATH\", \"musescore3\")

    # Supabase (Optional for cloud sync)
    SUPABASE_URL: str = os.getenv(\"SUPABASE_URL\", \"\")
    SUPABASE_KEY: str = os.getenv(\"SUPABASE_KEY\", \"\")

    # WhatsApp Cloud API
    WHATSAPP_TOKEN: str = os.getenv(\"WHATSAPP_TOKEN\", \"\")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv(\"WHATSAPP_PHONE_NUMBER_ID\", \"\")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv(\"WHATSAPP_VERIFY_TOKEN\", \"hymncraft_secret\")

    # Paystack
    PAYSTACK_SECRET_KEY: str = os.getenv(\"PAYSTACK_SECRET_KEY\", \"\")

    class Config:
        env_file = \".env\"
        extra = \"ignore\"


settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
