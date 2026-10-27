# PRODUCT DEVELOPMENT DOCUMENT: AI HYMN HARMONIZER & CHOIR ASSISTANT - FINAL V2

**Project Name:** HymnCraft AI - Multi-Harmony Edition  
**Version:** 2.0  
**Repository:** https://github.com/JoeEfficacy777/hymncraft-ai  

---

## 1. EXECUTIVE SUMMARY
Build an AI system that takes humming/singing and generates harmony in 7 different harmony types, plus piano, sheet music PDF, and individual part audios. Deliver via Web App + WhatsApp Bot. Target: Church choirs who need different harmony styles for different songs.

---

## 2. CORE FEATURE: 7 HARMONY TYPES
User MUST be able to select harmony type before processing.

| ID | Type | Description | Voices Generated |
|---|---|---|---|
| 1 | **SATB** | Four-Part Bach Chorale - Traditional hymn, classical rules, full church sound | S, A, T, B |
| 2 | **SAB** | Three-Part Small Choir - For choirs without Tenors | S, A, B |
| 3 | **TWO_PART** | Two-Part Duet - Soprano + Harmony in 3rds | S, A |
| 4 | **CLOSE** | Close Harmony - All voices within 1 octave, sweet barbershop/acapella sound | S, A, T, B close |
| 5 | **OPEN** | Open Harmony - Wide spacing, Bass 2 octaves below, big spacious church sound | S, A, T, B wide |
| 6 | **PARALLEL_THIRDS** | Parallel Thirds/Sixths - Simple, second voice follows melody in 3rds. For praise & worship | S, A (3rd below) |
| 7 | **GOSPEL** | Gospel Contemporary - Modern rich harmony with 7th chords, passing chords, slides | S, A, T, B + 7ths |

---

## 3. SYSTEM ARCHITECTURE

### Stage 1: Backend Core Engine - FastAPI - /backend

**Endpoint:** POST /api/v1/harmonize

**Request Form Data:**
- udio_file: mp3/wav/m4a
- harmony_type: enum [SATB, SAB, TWO_PART, CLOSE, OPEN, PARALLEL_THIRDS, GOSPEL] (Default SATB)
- key: string [optional, e.g., "G Major"] - if empty, auto-detect
- 	empo: int [optional, default 90]

**Processing Pipeline:**
1. **Audio to MIDI:** Spotify basic-pitch (rom basic_pitch.inference import predict) with fallback to librosa.pyin.
2. **Harmony Generation Engine:** /backend/app/harmonizers/harmony_engine.py implementing all 7 harmony types using music21.
3. **Audio Outputs:** Synthesize using soundfonts / MIDI synthesizers into individual stems (S, A, T, B), full mix, and piano accompaniment.
4. **Sheet Music:** MusicXML score generation and PDF export via MuseScore / LilyPond.

---

### Stage 2: Web App - Next.js 14 - /frontend
- **Page 1 (Upload):** Interactive harmony cards (7 options), key selector, tempo slider, drag & drop audio / live mic recording.
- **Page 2 (Results & Studio Mixer):** Dynamic mixer showing only tracks active for the chosen harmony style, mute/solo, Howler.js audio player, multi-format download (PDF, individual stems, full mix), and instant re-harmonization without re-uploading.

---

### Stage 3: WhatsApp Bot - /backend/app/whatsapp
- Meta WhatsApp Cloud API integration for voice notes, interactive numeric selection (1-7), and delivery of audio stems + sheet music.

---

### Stage 4: Monetization & Credits
- 2 free generations, Paystack payment integration (2,000 NGN for 50 hymns).
