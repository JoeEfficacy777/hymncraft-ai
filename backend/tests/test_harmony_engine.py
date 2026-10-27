import pytest
from music21 import stream, note, pitch
from app.models.schemas import HarmonyType
from app.harmonizers.harmony_engine import HarmonyEngine


@pytest.fixture
def sample_melody():
    part = stream.Part(id='soprano')
    part.partName = 'Soprano'
    # G major phrase: G4, A4, B4, C5, D5
    pitches = ['G4', 'A4', 'B4', 'C5', 'D5']
    for p in pitches:
        part.append(note.Note(p, quarterLength=1.0))
    return part


def test_satb_generation(sample_melody):
    result = HarmonyEngine.generate(sample_melody, harmony_type=HarmonyType.SATB, key_str=\"G Major\")
    assert 'soprano' in result
    assert 'alto' in result
    assert 'tenor' in result
    assert 'bass' in result
    assert len(result['alto'].notes) == len(sample_melody.notes)


def test_sab_generation(sample_melody):
    result = HarmonyEngine.generate(sample_melody, harmony_type=HarmonyType.SAB, key_str=\"G Major\")
    assert 'soprano' in result
    assert 'alto' in result
    assert 'bass' in result
    assert 'tenor' not in result


def test_two_part_generation(sample_melody):
    result = HarmonyEngine.generate(sample_melody, harmony_type=HarmonyType.TWO_PART, key_str=\"G Major\")
    assert 'soprano' in result
    assert 'alto' in result
    assert len(result) == 2


def test_close_harmony(sample_melody):
    result = HarmonyEngine.generate(sample_melody, harmony_type=HarmonyType.CLOSE, key_str=\"G Major\")
    assert len(result) == 4
    # Verify all notes within 12 semitones of soprano
    sop_note = result['soprano'].notes[0]
    bass_note = result['bass'].notes[0]
    assert (sop_note.pitch.midi - bass_note.pitch.midi) <= 12


def test_all_seven_types(sample_melody):
    for h_type in HarmonyType:
        res = HarmonyEngine.generate(sample_melody, harmony_type=h_type, key_str=\"G Major\")
        assert 'soprano' in res
        assert len(res) >= 2
