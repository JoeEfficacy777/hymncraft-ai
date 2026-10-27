FROM python:3.11-slim

# Install system dependencies: fluidsynth, soundfonts, musescore, ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    fluidsynth \
    fluid-soundfont-gm \
    musescore3 \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV SOUNDFONT_PATH=/usr/share/sounds/sf2/FluidR3_GM.sf2
ENV MUSESCORE_PATH=musescore3

EXPOSE 8000

CMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]
