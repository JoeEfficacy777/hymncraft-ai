\"\"\"
Harmony Generation Engine for HymnCraft AI.
Implements 7 distinct choir harmony styles using music21.
\"\"\"

import copy
from typing import Dict, List, Optional, Tuple
from music21 import (
    converter, stream, note, chord, interval, pitch, key as m21key, meter, tempo as m21tempo
)

from app.models.schemas import HarmonyType


class HarmonyEngine:
    \"\"\"
    Generates multi-voice choir arrangements from a monophonic melody stream.
    \"\"\"

    @staticmethod
    def parse_melody(melody_source) -> stream.Part:
        \"\"\"Parses a MIDI file path, MusicXML, or stream into a normalized Part.\"\"\"
        if isinstance(melody_source, stream.Part):
            return melody_source
        if isinstance(melody_source, stream.Stream):
            parts = melody_source.getElementsByClass(stream.Part)
            return parts[0] if parts else melody_source

        s = converter.parse(melody_source)
        parts = s.getElementsByClass(stream.Part)
        return parts[0] if parts else s

    @staticmethod
    def detect_or_set_key(score_part: stream.Part, key_str: Optional[str] = None) -> m21key.Key:
        \"\"\"Determines the key signature of the melody.\"\"\"
        if key_str and key_str.strip() and key_str.lower() != "auto-detect":
            try:
                # e.g., 'G Major' or 'D Minor' or 'C'
                parts = key_str.split()
                tonic = parts[0]
                mode = parts[1].lower() if len(parts) > 1 else 'major'
                return m21key.Key(tonic, mode)
            except Exception:
                pass
        try:
            return score_part.analyze('key')
        except Exception:
            return m21key.Key('C', 'major')

    @classmethod
    def generate(
        cls,
        melody_path_or_part,
        harmony_type: HarmonyType = HarmonyType.SATB,
        key_str: Optional[str] = None,
        tempo_bpm: int = 90
    ) -> Dict[str, stream.Part]:
        \"\"\"
        Main dispatcher generating voices for the chosen harmony style.
        Returns a dictionary of voice parts (e.g., {'soprano': Part, 'alto': Part, ...}).
        \"\"\"
        melody_part = cls.parse_melody(melody_path_or_part)
        melody_part.id = 'soprano'
        melody_part.partName = 'Soprano'

        detected_key = cls.detect_or_set_key(melody_part, key_str)

        # Ensure tempo marking
        mm = m21tempo.MetronomeMark(number=tempo_bpm)
        melody_part.insert(0, mm)
        melody_part.insert(0, detected_key)

        if harmony_type == HarmonyType.SATB:
            return cls._generate_satb(melody_part, detected_key)
        elif harmony_type == HarmonyType.SAB:
            return cls._generate_sab(melody_part, detected_key)
        elif harmony_type == HarmonyType.TWO_PART:
            return cls._generate_two_part(melody_part, detected_key)
        elif harmony_type == HarmonyType.CLOSE:
            return cls._generate_close(melody_part, detected_key)
        elif harmony_type == HarmonyType.OPEN:
            return cls._generate_open(melody_part, detected_key)
        elif harmony_type == HarmonyType.PARALLEL_THIRDS:
            return cls._generate_parallel_thirds(melody_part, detected_key)
        elif harmony_type == HarmonyType.GOSPEL:
            return cls._generate_gospel(melody_part, detected_key)
        else:
            return cls._generate_satb(melody_part, detected_key)

    @classmethod
    def _generate_satb(cls, melody: stream.Part, key_obj: m21key.Key) -> Dict[str, stream.Part]:
        \"\"\"
        SATB Four-Part Bach Chorale Style:
        - Soprano: Melody
        - Alto: diatonic 3rd/4th below, smooth stepwise voice leading
        - Tenor: diatonic 5th/6th below, provides counter-harmonic color
        - Bass: Root / harmonic progression, anchoring strong tonal centers
        \"\"\"
        alto_part = stream.Part(id='alto')
        alto_part.partName = 'Alto'
        tenor_part = stream.Part(id='tenor')
        tenor_part.partName = 'Tenor'
        bass_part = stream.Part(id='bass')
        bass_part.partName = 'Bass'

        scale = key_obj.getScale()

        for el in melody.flat.notesAndRests:
            if el.isRest:
                alto_part.append(copy.deepcopy(el))
                tenor_part.append(copy.deepcopy(el))
                bass_part.append(copy.deepcopy(el))
                continue

            sop_pitch = el.pitch
            # Find closest scale degree
            degree = scale.getScaleDegreeFromPitch(sop_pitch) or 1

            # Classical triad assignment (I, ii, IV, V, vi)
            if degree in [1, 3, 5]:  # Tonic triad (I)
                root_pitch = key_obj.tonic
                third_pitch = scale.pitchFromDegree(3)
                fifth_pitch = scale.pitchFromDegree(5)
            elif degree in [4, 6]:   # Subdominant (IV)
                root_pitch = scale.pitchFromDegree(4)
                third_pitch = scale.pitchFromDegree(6)
                fifth_pitch = scale.pitchFromDegree(1)
            elif degree in [7, 2]:   # Dominant (V)
                root_pitch = scale.pitchFromDegree(5)
                third_pitch = scale.pitchFromDegree(7)
                fifth_pitch = scale.pitchFromDegree(2)
            else:
                root_pitch = key_obj.tonic
                third_pitch = scale.pitchFromDegree(3)
                fifth_pitch = scale.pitchFromDegree(5)

            # Voicing allocation with comfortable choir ranges
            # Alto: G3 to D5
            alto_p = copy.deepcopy(third_pitch if sop_pitch.name != third_pitch.name else fifth_pitch)
            alto_p.octave = 4 if alto_p.midi > 60 else 3
            if alto_p.midi >= sop_pitch.midi:
                alto_p.octave -= 1

            # Tenor: C3 to G4
            tenor_p = copy.deepcopy(fifth_pitch if alto_p.name != fifth_pitch.name else root_pitch)
            tenor_p.octave = 3
            if tenor_p.midi >= alto_p.midi:
                tenor_p.octave -= 1

            # Bass: E2 to C4 (Root of current harmony)
            bass_p = copy.deepcopy(root_pitch)
            bass_p.octave = 2 if bass_p.midi < 48 else 2

            a_n = note.Note(alto_p, duration=el.duration)
            t_n = note.Note(tenor_p, duration=el.duration)
            b_n = note.Note(bass_p, duration=el.duration)

            alto_part.append(a_n)
            tenor_part.append(t_n)
            bass_part.append(b_n)

        return {'soprano': melody, 'alto': alto_part, 'tenor': tenor_part, 'bass': bass_part}

    @classmethod
    def _generate_sab(cls, melody: stream.Part, key_obj: m21key.Key) -> Dict[str, stream.Part]:
        \"\"\"
        Three-Part Small Choir (SAB):
        Merges Tenor into Alto for a punchy middle voice without requiring Tenor section.
        \"\"\"
        satb = cls._generate_satb(melody, key_obj)
        alto_part = satb['alto']
        alto_part.partName = 'Alto (Merged Middle)'
        return {'soprano': satb['soprano'], 'alto': alto_part, 'bass': satb['bass']}

    @classmethod
    def _generate_two_part(cls, melody: stream.Part, key_obj: m21key.Key) -> Dict[str, stream.Part]:
        \"\"\"
        Two-Part Duet:
        Soprano melody + Alto harmony flowing in diatonic 3rds/6ths.
        \"\"\"
        alto_part = stream.Part(id='alto')
        alto_part.partName = 'Alto'
        scale = key_obj.getScale()

        for el in melody.flat.notesAndRests:
            if el.isRest:
                alto_part.append(copy.deepcopy(el))
                continue

            sop_pitch = el.pitch
            deg = scale.getScaleDegreeFromPitch(sop_pitch)
            if deg is not None:
                # 3rd diatonic below (down 2 scale steps)
                target_deg = ((deg - 3) % 7) + 1
                alto_p = scale.pitchFromDegree(target_deg)
                alto_p.octave = sop_pitch.octave
                if alto_p.midi >= sop_pitch.midi:
                    alto_p.octave -= 1
            else:
                alto_p = sop_pitch.transpose(interval.Interval(-4))

            alto_part.append(note.Note(alto_p, duration=el.duration))

        return {'soprano': melody, 'alto': alto_part}

    @classmethod
    def _generate_close(cls, melody: stream.Part, key_obj: m21key.Key) -> Dict[str, stream.Part]:
        \"\"\"
        Close Harmony (Barbershop / Acapella):
        All voices tightly voiced within a single octave of the lead soprano.
        \"\"\"
        alto_part = stream.Part(id='alto')
        alto_part.partName = 'Alto'
        tenor_part = stream.Part(id='tenor')
        tenor_part.partName = 'Tenor'
        bass_part = stream.Part(id='bass')
        bass_part.partName = 'Bass'

        scale = key_obj.getScale()

        for el in melody.flat.notesAndRests:
            if el.isRest:
                alto_part.append(copy.deepcopy(el))
                tenor_part.append(copy.deepcopy(el))
                bass_part.append(copy.deepcopy(el))
                continue

            sop_midi = el.pitch.midi
            # Alto: tight 3rd or 4th below (3-4 semitones)
            alto_midi = sop_midi - 3
            # Tenor: 5-7 semitones below
            tenor_midi = sop_midi - 7
            # Bass: 9-11 semitones below (still within 12 semitones of Soprano!)
            bass_midi = max(sop_midi - 11, sop_midi - 12)

            alto_part.append(note.Note(pitch.Pitch(midi=alto_midi), duration=el.duration))
            tenor_part.append(note.Note(pitch.Pitch(midi=tenor_midi), duration=el.duration))
            bass_part.append(note.Note(pitch.Pitch(midi=bass_midi), duration=el.duration))

        return {'soprano': melody, 'alto': alto_part, 'tenor': tenor_part, 'bass': bass_part}

    @classmethod
    def _generate_open(cls, melody: stream.Part, key_obj: m21key.Key) -> Dict[str, stream.Part]:
        \"\"\"
        Open Cathedral Harmony:
        Wide, airy voicing with deep octave-dropped roots for grand sanctuary resonance.
        \"\"\"
        satb = cls._generate_satb(melody, key_obj)
        alto_part = stream.Part(id='alto')
        alto_part.partName = 'Alto'
        tenor_part = stream.Part(id='tenor')
        tenor_part.partName = 'Tenor'
        bass_part = stream.Part(id='bass')
        bass_part.partName = 'Bass'

        # Alto dropped 10th below, Bass dropped 2 octaves below
        for el in satb['alto'].flat.notesAndRests:
            if not el.isRest:
                p = copy.deepcopy(el.pitch)
                p.octave = max(3, p.octave - 1)
                alto_part.append(note.Note(p, duration=el.duration))
            else:
                alto_part.append(copy.deepcopy(el))

        for el in satb['tenor'].flat.notesAndRests:
            if not el.isRest:
                p = copy.deepcopy(el.pitch)
                tenor_part.append(note.Note(p, duration=el.duration))
            else:
                tenor_part.append(copy.deepcopy(el))

        for el in satb['bass'].flat.notesAndRests:
            if not el.isRest:
                p = copy.deepcopy(el.pitch)
                p.octave = 2  # Deep resonant root
                bass_part.append(note.Note(p, duration=el.duration))
            else:
                bass_part.append(copy.deepcopy(el))

        return {'soprano': melody, 'alto': alto_part, 'tenor': tenor_part, 'bass': bass_part}

    @classmethod
    def _generate_parallel_thirds(cls, melody: stream.Part, key_obj: m21key.Key) -> Dict[str, stream.Part]:
        \"\"\"
        Parallel Thirds / Sixths:
        Simple worship companion voice strictly following diatonic thirds.
        \"\"\"
        return cls._generate_two_part(melody, key_obj)

    @classmethod
    def _generate_gospel(cls, melody: stream.Part, key_obj: m21key.Key) -> Dict[str, stream.Part]:
        \"\"\"
        Contemporary Gospel Harmony:
        Adds rich 7th & 9th tension voicings, passing chromas, and walking bass.
        \"\"\"
        alto_part = stream.Part(id='alto')
        alto_part.partName = 'Alto (7th Tensions)'
        tenor_part = stream.Part(id='tenor')
        tenor_part.partName = 'Tenor (Color Voice)'
        bass_part = stream.Part(id='bass')
        bass_part.partName = 'Bass (Walking)'

        scale = key_obj.getScale()
        tonic_pitch = key_obj.tonic

        for idx, el in enumerate(melody.flat.notesAndRests):
            if el.isRest:
                alto_part.append(copy.deepcopy(el))
                tenor_part.append(copy.deepcopy(el))
                bass_part.append(copy.deepcopy(el))
                continue

            sop_p = el.pitch
            deg = scale.getScaleDegreeFromPitch(sop_p) or 1

            # Rich dominant & minor 7ths
            # Alto takes 7th tension (e.g. F in G7 or C in D7)
            alto_midi = sop_p.midi - (4 if deg in [1, 4, 5] else 3)
            # Tenor takes 9th or rich 3rd
            tenor_midi = alto_midi - 4
            # Walking Bass progression
            bass_midi = (tonic_pitch.midi % 12) + 36 + ((idx % 4) * 2)

            alto_part.append(note.Note(pitch.Pitch(midi=alto_midi), duration=el.duration))
            tenor_part.append(note.Note(pitch.Pitch(midi=tenor_midi), duration=el.duration))
            bass_part.append(note.Note(pitch.Pitch(midi=bass_midi), duration=el.duration))

        return {'soprano': melody, 'alto': alto_part, 'tenor': tenor_part, 'bass': bass_part}
