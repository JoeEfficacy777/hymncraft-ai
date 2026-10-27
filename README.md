# 🎵 HymnCraft AI - Multi-Harmony Edition (v2.0)

[![GitHub Repo](https://img.shields.io/badge/GitHub-JoeEfficacy777%2Fhymncraft--ai-blue.svg)](https://github.com/JoeEfficacy777/hymncraft-ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **AI-Powered Hymn Harmonizer & Choir Assistant** that transforms hummed or sung audio into 7 distinct choir harmony styles, multi-track audio stems, piano accompaniment, and printable sheet music PDFs.

---

## 🌟 7 Harmony Styles Supported

1. **SATB (Traditional Bach Chorale)** – Classic 4-part church choir harmony (Soprano, Alto, Tenor, Bass).
2. **SAB (Three-Part Small Choir)** – Balanced 3-part voicing tailored for choirs without tenors.
3. **TWO_PART (Duet)** – Crisp Soprano lead with harmonious Alto diatonic 3rds/6ths.
4. **CLOSE (Barbershop / Acapella)** – Tight 4-part voicing spanning within a single octave.
5. **OPEN (Cathedral Spacious)** – Grand choir acoustic spacing with deep rooted bass 2 octaves below.
6. **PARALLEL_THIRDS (Praise & Worship)** – Melodic flowing 3rds companion for modern worship bands.
7. **GOSPEL (Contemporary Gospel)** – Rich jazz and gospel colorings, 7th & 9th tension chords, passing tones, and walking bass.

---

## 🏗️ Architecture & Modules

\\\
hymncraft-ai/
├── backend/                  # FastAPI Core Harmony Engine
│   ├── app/
│   │   ├── api/v1/           # REST endpoints (/api/v1/harmonize)
│   │   ├── core/             # Configuration & environments
│   │   ├── harmonizers/      # 7-voice music21 algorithmic & neural engine
│   │   ├── models/           # Pydantic schemas & enums
│   │   ├── services/         # Audio stem synthesis & PDF generation
│   │   ├── whatsapp/         # Meta WhatsApp Cloud API bot integration
│   │   └── main.py           # Application entrypoint
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # Next.js 14 Web Studio
│   ├── src/
│   │   ├── components/       # Harmony selector, multi-track mixer, audio player
│   │   └── app/              # Studio upload & results interface
│   └── package.json
└── docs/                     # Product Development Documents & Specs
    └── PDD.md
\\\

---

## 🚀 Quick Start

### Backend (FastAPI)
\\\ash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\\\

### Frontend (Next.js 14)
\\\ash
cd frontend
npm install
npm run dev
\\\

---

## 📜 Documentation
Full specification available in [\docs/PDD.md\](./docs/PDD.md).
