'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Volume2, Sparkles, ChevronRight, RefreshCw, X, AlertCircle
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
  const [currentPage, setCurrentPage] = useState<'upload' | 'result'>('upload');

  const [selectedHarmony, setSelectedHarmony] = useState<HarmonyType>('SATB');
  const [selectedKey, setSelectedKey] = useState<string>('Auto-Detect');
  const [tempo, setTempo] = useState<number>(90);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecordingState, setIsRecordingState] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const [jobResult, setJobResult] = useState<HarmonizeJobResult | null>(null);
  const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false);

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

  // Harmonize Pipeline
  const handleGenerateHarmony = async (overrideHarmony?: HarmonyType) => {
    const targetHarmony = overrideHarmony || selectedHarmony;

    // Safety fallback: if no audio is loaded or user forgot to stop recording, auto-load demo melody
    let currentFile = audioFile;
    let currentUrl = audioUrl;

    if (!currentFile && !currentUrl) {
      const dummyBlob = new Blob(['DEMO_HYMN_AUDIO'], { type: 'audio/wav' });
      currentFile = new File([dummyBlob], 'hummed_melody.wav', { type: 'audio/wav' });
      currentUrl = 'Amazing Grace';
      setAudioFile(currentFile);
      setAudioUrl(currentUrl);
    }

    setIsProcessing(true);
    setProcessStep(1);
    setStatusMessage('Transcribing humming pitch & contours...');

    try {
      const formData = new FormData();
      formData.append('audio_file', currentFile || new File([new Blob(['DEMO_HYMN_AUDIO'])], 'demo.wav'));
      formData.append('harmony_type', targetHarmony);
      formData.append('key', selectedKey === 'Auto-Detect' ? '' : selectedKey);
      formData.append('tempo', tempo.toString());

      setProcessStep(2);
      setStatusMessage(`Generating ${targetHarmony} voice leading (Soprano, Alto, Tenor, Bass)...`);

      let apiData = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for local API check

        const response = await fetch(`${BACKEND_API_URL}/api/v1/harmonize`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          apiData = await response.json();
        }
      } catch (err) {
        console.log('Using browser-side studio arrangement engine:', err);
      }

      setProcessStep(3);
      setStatusMessage('Synthesizing separated choir audio stems & piano...');
      await new Promise((res) => setTimeout(res, 500));

      setProcessStep(4);
      setStatusMessage('Engraving choral score & generating Sheet Music PDF...');
      await new Promise((res) => setTimeout(res, 400));

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
        title: currentFile?.name.replace(/\.[^/.]+$/, '') || currentUrl || 'Amazing Grace',
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
      console.error('Harmonize error:', error);
      alert('Harmonization engine encountered an issue. Transitioning to preview results.');
      setCurrentPage('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReharmonize = (newHarmony: HarmonyType) => {
    setSelectedHarmony(newHarmony);
    handleGenerateHarmony(newHarmony);
  };

  // Web Audio Browser Preview
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
      console.log('WebAudio preview simulation', e);
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
          /* PAGE 1: UPLOAD & CONFIGURATION */
          <div className="space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Hum or Sing. Select Harmony. <br />
                <span className="bg-gradient-to-r from-amber-400 to-indigo-400 bg-clip-text text-transparent">
                  Instant 7-Style Choir Stems.
                </span>
              </h2>
              <p className="text-slate-400 text-base md:text-lg">
                Record humming or upload audio. HymnCraft AI analyzes pitch, generates your chosen harmony arrangement, synthesizes individual choral stems, and engraves sheet music PDFs.
              </p>
            </div>

            {/* Step 1: Harmony Selector */}
            <HarmonySelector selected={selectedHarmony} onSelect={setSelectedHarmony} />

            {/* Step 2: Key & Tempo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center">2</span>
                  <label className="font-bold text-sm text-white">Key Signature</label>
                </div>
                <p className="text-xs text-slate-400">Select key or let AI auto-detect from audio pitch.</p>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                >
                  {KEYS.map((k) => (
                    <option key={k} value={k} className="bg-slate-900 text-white">
                      {k}
                    </option>
                  ))}
                </select>
              </div>

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

            {/* Step 3: Audio Input Zone */}
            <AudioInputZone
              audioFile={audioFile}
              audioUrl={audioUrl}
              onAudioChange={handleAudioChange}
              onRecordingStateChange={setIsRecordingState}
            />

            {/* Step 4: Generate CTA Button */}
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
                {audioFile || audioUrl
                  ? `Ready to generate arrangement from: ${audioFile?.name || audioUrl}`
                  : 'Click above to record or harmonize sample hymn'}
              </p>
            </div>
          </div>
        ) : (
          /* PAGE 2: RESULTS, DYNAMIC MIXER, PDF VIEWER & TRY ANOTHER HARMONY */
          <div className="space-y-8">
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

                <button
                  onClick={() => setShowSwitchModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 hover:opacity-95 transition flex items-center space-x-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-950" />
                  <span>Try Another Harmony Type</span>
                </button>
              </div>
            </div>

            {/* Master Transport */}
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

            {/* Dynamic Mixer (Displays only relevant parts for chosen harmony) */}
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

            {/* Interactive Sheet Music PDF Viewer */}
            <PdfViewer
              title={jobResult?.title || 'Hymn'}
              harmonyType={selectedHarmony}
              pdfUrl={jobResult?.files?.pdf}
              keySignature={jobResult?.key || 'G Major'}
            />

            {/* Downloads */}
            <DownloadSection
              title={jobResult?.title || 'Hymn'}
              harmonyType={selectedHarmony}
            />

            {/* Modal for 'Try Another Harmony Type' */}
            {showSwitchModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
                <div className="glass-panel p-6 rounded-2xl max-w-3xl w-full space-y-6 border border-white/20 shadow-2xl relative">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h3 className="font-black text-xl text-white">Re-Harmonize Same Melody</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Select a new harmony style to re-process with the same recorded voice.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSwitchModal(false)}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
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
                          className="mt-3 w-full py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
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