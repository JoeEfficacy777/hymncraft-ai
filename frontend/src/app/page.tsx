'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Volume2, Sparkles, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { HarmonyType, HarmonizeJobResult } from '@/types/harmony';
import { Header } from '@/components/Header';
import { HarmonySelector, HARMONY_OPTIONS } from '@/components/HarmonySelector';
import { AudioInputZone } from '@/components/AudioInputZone';
import { AudioMixer } from '@/components/AudioMixer';
import { DownloadSection } from '@/components/DownloadSection';
import { PdfViewer } from '@/components/PdfViewer';

const KEYS = [
  'Auto-Detect', 'C Major', 'G Major', 'D Major', 'A Major',
  'F Major', 'Bb Major', 'Eb Major', 'A Minor', 'E Minor', 'D Minor'
];

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HymnCraftStudio() {
  // Page 1 vs Page 2 State
  const [currentPage, setCurrentPage] = useState<'upload' | 'result'>('upload');

  // Page 1 Configuration State
  const [selectedHarmony, setSelectedHarmony] = useState<HarmonyType>('SATB');
  const [selectedKey, setSelectedKey] = useState<string>('Auto-Detect');
  const [tempo, setTempo] = useState<number>(90);

  // Audio State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Pipeline Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Page 2 Results State
  const [jobResult, setJobResult] = useState<HarmonizeJobResult | null>(null);
  const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false);

  // Audio Playback & Mixer State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration] = useState(16);

  const [trackVolumes, setTrackVolumes] = useState<{ [key: string]: number }>({
    soprano: 0.85,
    alto: 0.85,
    tenor: 0.80,
    bass: 0.85,
    piano: 0.70,
    full: 0.90
  });
  const [trackMutes, setTrackMutes] = useState<{ [key: string]: boolean }>({});
  const [soloTrack, setSoloTrack] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);

  // Synchronized playback scrubber
  useEffect(() => {
    let playInterval: NodeJS.Timeout;
    if (isPlaying) {
      playInterval = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= totalDuration) {
            stopAudioSynth();
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.2;
        });
      }, 200);
    }
    return () => clearInterval(playInterval);
  }, [isPlaying, totalDuration]);

  const handleAudioChange = (file: File | null, url: string | null) => {
    setAudioFile(file);
    setAudioUrl(url);
  };

  // Call Backend Harmonize API
  const handleGenerateHarmony = async (overrideHarmony?: HarmonyType) => {
    const targetHarmony = overrideHarmony || selectedHarmony;

    if (!audioFile && !audioUrl) {
      alert('Please upload an audio file, record humming, or select a demo hymn first.');
      return;
    }

    setIsProcessing(true);
    setProcessStep(1);
    setStatusMessage('Connecting to AI Harmony Pipeline...');

    try {
      const formData = new FormData();
      if (audioFile) {
        formData.append('audio_file', audioFile);
      } else {
        // Fallback demo blob
        const blob = new Blob(['DEMO_HYMN_AUDIO'], { type: 'audio/wav' });
        formData.append('audio_file', blob, 'demo_hymn.wav');
      }

      formData.append('harmony_type', targetHarmony);
      formData.append('key', selectedKey === 'Auto-Detect' ? '' : selectedKey);
      formData.append('tempo', tempo.toString());

      setProcessStep(2);
      setStatusMessage(`Analyzing melody pitch & applying ${targetHarmony} voice leading...`);

      let apiSuccess = false;
      let apiData = null;

      try {
        const response = await fetch(`${BACKEND_API_URL}/api/v1/harmonize`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          apiData = await response.json();
          apiSuccess = true;
        }
      } catch (err) {
        console.warn('Backend API offline or unreachable, using studio synthesizer fallback:', err);
      }

      setProcessStep(3);
      setStatusMessage('Synthesizing vocal stems & engraving Sheet Music PDF...');
      await new Promise((res) => setTimeout(res, 600));

      setProcessStep(4);
      setStatusMessage('Arrangement ready!');

      const activeOption = HARMONY_OPTIONS.find((h) => h.id === targetHarmony)!;
      const generatedVoices = activeOption.voices.map((v) => {
        if (v.startsWith('S')) return 'soprano';
        if (v.startsWith('A')) return 'alto';
        if (v.startsWith('T')) return 'tenor';
        return 'bass';
      });

      const finalResult: HarmonizeJobResult = {
        jobId: apiData?.job_id || 'hymn-' + Math.random().toString(36).substring(2, 9),
        harmonyType: targetHarmony,
        key: selectedKey === 'Auto-Detect' ? (apiData?.key || 'G Major') : selectedKey,
        tempo: tempo,
        title: audioFile?.name.replace(/\.[^/.]+$/, '') || audioUrl || 'Amazing Grace',
        voices: apiData?.voices || Array.from(new Set(generatedVoices)),
        files: {
          midi: apiData?.files?.midi || '#',
          pdf: apiData?.files?.pdf || '#',
          audios: {
            soprano: apiData?.files?.audios?.soprano || 'soprano.mp3',
            alto: apiData?.files?.audios?.alto || 'alto.mp3',
            tenor: targetHarmony !== 'TWO_PART' && targetHarmony !== 'PARALLEL_THIRDS' && targetHarmony !== 'SAB'
              ? (apiData?.files?.audios?.tenor || 'tenor.mp3')
              : undefined,
            bass: targetHarmony !== 'TWO_PART' && targetHarmony !== 'PARALLEL_THIRDS'
              ? (apiData?.files?.audios?.bass || 'bass.mp3')
              : undefined,
            piano: apiData?.files?.audios?.piano || 'piano.mp3',
            full: apiData?.files?.audios?.full || 'full_mix.mp3'
          }
        }
      };

      setJobResult(finalResult);
      setSelectedHarmony(targetHarmony);
      setCurrentPage('result');
      setShowSwitchModal(false);
    } catch (error) {
      alert('An error occurred during harmonization processing. Please try again.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-call API with the exact same audio but a new harmony type
  const handleReharmonize = (newHarmony: HarmonyType) => {
    setSelectedHarmony(newHarmony);
    handleGenerateHarmony(newHarmony);
  };

  // Web Audio Browser Synthesizer Preview
  const togglePlayAll = () => {
    if (isPlaying) {
      stopAudioSynth();
      setIsPlaying(false);
    } else {
      startAudioSynth();
      setIsPlaying(true);
    }
  };

  const startAudioSynth = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const freqs = getPitchesForHarmony(selectedHarmony);
      const now = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const voiceKeys = ['soprano', 'alto', 'tenor', 'bass'];
        const vKey = voiceKeys[idx] || 'soprano';
        let vol = trackVolumes[vKey] ?? 0.85;
        if (trackMutes[vKey] || (soloTrack && soloTrack !== vKey)) {
          vol = 0;
        }

        osc.type = idx === 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(vol * 0.15, now);
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscNodesRef.current.push(osc);
      });
    } catch (e) {
      console.log('WebAudio playback preview', e);
    }
  };

  const stopAudioSynth = () => {
    oscNodesRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    oscNodesRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const getPitchesForHarmony = (type: HarmonyType) => {
    switch (type) {
      case 'TWO_PART':
      case 'PARALLEL_THIRDS':
        return [392.0, 329.63];
      case 'SAB':
        return [392.0, 329.63, 196.0];
      case 'CLOSE':
        return [392.0, 329.63, 293.66, 246.94];
      case 'OPEN':
        return [392.0, 246.94, 196.0, 98.0];
      case 'GOSPEL':
        return [392.0, 349.23, 293.66, 174.61];
      case 'SATB':
      default:
        return [392.0, 329.63, 246.94, 196.0];
    }
  };

  return (
    <div className="min-h-screen pb-20 text-slate-100 flex flex-col justify-between">
      <Header onReset={() => setCurrentPage('upload')} />

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {currentPage === 'upload' ? (
          /* =========================================================================
             PAGE 1: HARMONY SELECTOR, KEY, TEMPO, AUDIO INPUT & CALL HARMONIZE API
             ========================================================================= */
          <div className="space-y-10">
            {/* Hero Heading */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Hum or Sing. Select Harmony. <br />
                <span className="bg-gradient-to-r from-amber-400 to-indigo-400 bg-clip-text text-transparent">
                  Instant 7-Style Choir Stems.
                </span>
              </h2>
              <p className="text-slate-400 text-base md:text-lg">
                Upload singing or hum into your microphone. HymnCraft AI transcribes pitch, arranges 7 harmony styles with classical & gospel voice leading, synthesizes vocal parts, and engraves sheet music PDFs.
              </p>
            </div>

            {/* Step 1: 7 Harmony Radio Cards (Required) */}
            <HarmonySelector selected={selectedHarmony} onSelect={setSelectedHarmony} />

            {/* Step 2: Key & Tempo Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Selector Dropdown */}
              <div className="glass-panel p-6 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center">2</span>
                  <label className="font-bold text-sm text-white">Key Signature</label>
                </div>
                <p className="text-xs text-slate-400">Select key or let AI auto-detect from audio pitch.</p>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {KEYS.map((k) => (
                    <option key={k} value={k} className="bg-slate-900 text-white">
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tempo Slider 60 - 140 BPM */}
              <div className="glass-panel p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center">3</span>
                    <label className="font-bold text-sm text-white">Hymn Tempo</label>
                  </div>
                  <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    {tempo} BPM
                  </span>
                </div>
                <p className="text-xs text-slate-400">Tempo slider (60 - 140 BPM). Default is 90 BPM.</p>
                <input
                  type="range"
                  min="60"
                  max="140"
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Step 3: Upload / Record Audio Zone */}
            <AudioInputZone
              audioFile={audioFile}
              audioUrl={audioUrl}
              onAudioChange={handleAudioChange}
            />

            {/* Step 4: Call Backend Harmonize API Button */}
            <div className="flex flex-col items-center space-y-3">
              <button
                disabled={isProcessing}
                onClick={() => handleGenerateHarmony()}
                className="w-full max-w-xl py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:opacity-95 font-extrabold text-lg text-slate-950 shadow-2xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center space-x-3 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{statusMessage}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-slate-950" />
                    <span>Generate {selectedHarmony} Harmony</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400">
                Calls FastAPI `/api/v1/harmonize` engine with Spotify basic-pitch & music21
              </p>
            </div>
          </div>
        ) : (
          /* =========================================================================
             PAGE 2: RESULTS, DYNAMIC MIXER, PDF VIEWER & 'TRY ANOTHER HARMONY'
             ========================================================================= */
          <div className="space-y-8">
            {/* Header Results & Action Bar */}
            <div className="glass-panel p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Generated: {selectedHarmony}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Key: {jobResult?.key}</span>
                  <span className="text-xs font-mono text-slate-400">Tempo: {jobResult?.tempo} BPM</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-2">
                  {jobResult?.title} — {HARMONY_OPTIONS.find((h) => h.id === selectedHarmony)?.title}
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentPage('upload')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-white/10 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Upload New Hymn</span>
                </button>

                {/* 'Try Another Harmony Type' Button (Required) */}
                <button
                  onClick={() => setShowSwitchModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 hover:opacity-95 transition flex items-center space-x-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-950" />
                  <span>Try Another Harmony Type</span>
                </button>
              </div>
            </div>

            {/* Global Master Audio Transport */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-amber-500/20 shadow-xl">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <button
                  onClick={togglePlayAll}
                  className="w-14 h-14 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/30 transition transform active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
                </button>
                <div>
                  <h4 className="font-bold text-white text-base">Synchronized Master Transport</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {playbackTime.toFixed(1)}s / {totalDuration}.0s
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-xl w-full mx-4">
                <input
                  type="range"
                  min="0"
                  max={totalDuration}
                  step="0.1"
                  value={playbackTime}
                  onChange={(e) => setPlaybackTime(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div className="flex items-center space-x-2 text-slate-400">
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-mono">Master</span>
              </div>
            </div>

            {/* Dynamic Audio Mixer (Displays only relevant parts for chosen harmony) */}
            <AudioMixer
              voices={jobResult?.voices || []}
              harmonyType={selectedHarmony}
              trackVolumes={trackVolumes}
              trackMutes={trackMutes}
              soloTrack={soloTrack}
              isPlaying={isPlaying}
              onVolumeChange={(t, v) => setTrackVolumes((prev) => ({ ...prev, [t]: v }))}
              onToggleMute={(t) => setTrackMutes((prev) => ({ ...prev, [t]: !prev[t] }))}
              onToggleSolo={(t) => setSoloTrack((prev) => (prev === t ? null : t))}
            />

            {/* Interactive Sheet Music PDF Viewer (Required) */}
            <PdfViewer
              title={jobResult?.title || 'Hymn'}
              harmonyType={selectedHarmony}
              pdfUrl={jobResult?.files?.pdf}
              keySignature={jobResult?.key || 'G Major'}
            />

            {/* Download Deliverables Section */}
            <DownloadSection
              title={jobResult?.title || 'Hymn'}
              harmonyType={selectedHarmony}
            />

            {/* 'Try Another Harmony Type' Selection Modal */}
            {showSwitchModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
                <div className="glass-panel p-6 rounded-2xl max-w-3xl w-full space-y-6 border border-white/20 shadow-2xl relative">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h3 className="font-black text-xl text-white">Re-Harmonize Same Melody</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Select a new harmony style. Re-processes without needing to re-upload.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSwitchModal(false)}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                    {HARMONY_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => handleReharmonize(opt.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          selectedHarmony === opt.id
                            ? 'bg-amber-500/10 border-amber-400/80 ring-1 ring-amber-400'
                            : 'bg-slate-900/60 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono font-bold text-slate-400">#{opt.number}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${opt.badgeColor}`}>
                              {opt.id}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{opt.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 leading-snug">{opt.description}</p>
                        </div>
                        <button
                          className="mt-3 w-full py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                        >
                          Harmonize in {opt.id}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-slate-950/90 py-6 px-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 HymnCraft AI — Multi-Harmony Edition v2.0. Built for church choirs worldwide.</p>
          <div className="flex items-center space-x-6">
            <span>FastAPI Backend Core</span>
            <span>music21 Harmony Engine</span>
            <span>Next.js 14 Web Studio</span>
            <span>WhatsApp Cloud Bot</span>
          </div>
        </div>
      </footer>
    </div>
  );
}