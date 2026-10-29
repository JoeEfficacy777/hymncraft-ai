import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, CheckCircle2, Sparkles, Play, Pause, Trash2, Volume2 } from 'lucide-react';

interface AudioInputZoneProps {
  audioFile: File | null;
  audioUrl: string | null;
  isRecordingExternal?: boolean;
  onAudioChange: (file: File | null, url: string | null) => void;
  onRecordingStateChange?: (recording: boolean) => void;
}

export const AudioInputZone: React.FC<AudioInputZoneProps> = ({
  audioFile,
  audioUrl,
  onAudioChange,
  onRecordingStateChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
      onRecordingStateChange?.(true);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      onRecordingStateChange?.(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, onRecordingStateChange]);

  const startRecording = async () => {
    try {
      setRecordedBlobUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMime = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        const ext = actualMime.includes('mp4') ? 'm4a' : actualMime.includes('webm') ? 'webm' : 'wav';
        const file = new File([audioBlob], `recorded_hymn_${Date.now()}.${ext}`, { type: actualMime });
        
        const blobUrl = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(blobUrl);
        onAudioChange(file, blobUrl);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Request data every 250ms to ensure chunks are recorded continuously
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Microphone access was denied or is not available. You can use sample hymn audio below!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePreviewPlayback = () => {
    if (!previewAudioRef.current && recordedBlobUrl) {
      const audio = new Audio(recordedBlobUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const clearRecording = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setRecordedBlobUrl(null);
    setIsPlayingPreview(false);
    setRecordDuration(0);
    onAudioChange(null, null);
  };

  const loadDemoHymn = (name: string) => {
    clearRecording();
    const dummyBlob = new Blob(['DEMO_HYMN_AUDIO'], { type: 'audio/wav' });
    const file = new File([dummyBlob], `${name.toLowerCase().replace(/ /g, '_')}.wav`, { type: 'audio/wav' });
    onAudioChange(file, name);
  };

  return (
    <div className="glass-panel p-8 rounded-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
          <h3 className="text-lg font-bold text-white">Input Hymn Audio</h3>
        </div>
        <span className="text-xs text-slate-400">Record Live Voice or Upload</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Mic Recording Card */}
        <div className="border border-dashed border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/50">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-500 animate-pulse ring-8 ring-rose-500/20'
                : recordedBlobUrl
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-600/30 text-indigo-400'
            }`}
          >
            {isRecording ? (
              <Square className="w-7 h-7 text-white fill-white cursor-pointer" onClick={stopRecording} />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </div>

          <div>
            <h4 className="font-bold text-white">
              {isRecording
                ? 'Recording in progress...'
                : recordedBlobUrl
                ? 'Voice Note Ready'
                : 'Record Humming Directly'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {isRecording
                ? `Recording: ${recordDuration}s — Sing clearly into your mic`
                : recordedBlobUrl
                ? `Recorded successfully (${recordDuration}s). Listen or click Generate below!`
                : 'Click below to sing or hum the hymn verse'}
            </p>
          </div>

          {/* Action buttons for recording */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop & Save Recording</span>
            </button>
          ) : recordedBlobUrl ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={togglePreviewPlayback}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingPreview ? 'Pause' : 'Play Voice'}</span>
              </button>
              <button
                type="button"
                onClick={clearRecording}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1 transition cursor-pointer"
                title="Discard & Re-record"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Discard</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Start Voice Recording</span>
            </button>
          )}

          {recordedBlobUrl && (
            <div className="w-full flex items-center justify-center space-x-1.5 text-emerald-400 text-xs font-semibold pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for 7-Style Harmonization!</span>
            </div>
          )}
        </div>

        {/* Drag & Drop File Upload */}
        <div className="border border-dashed border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/50 relative">
          <Upload className="w-12 h-12 text-slate-400" />
          <div>
            <h4 className="font-bold text-white">Upload Audio File</h4>
            <p className="text-xs text-slate-400 mt-1">Drag and drop MP3, WAV, or M4A</p>
          </div>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setRecordedBlobUrl(null);
                onAudioChange(file, URL.createObjectURL(file));
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {audioFile && !recordedBlobUrl && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Loaded: {audioFile.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Demo Songs */}
      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-400 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Or test immediately with demo melodies:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {['Amazing Grace', 'Holy Holy Holy', 'Great Is Thy Faithfulness'].map((hymn) => (
            <button
              key={hymn}
              type="button"
              onClick={() => loadDemoHymn(hymn)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                audioUrl === hymn
                  ? 'bg-amber-400 text-slate-950 font-bold border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-white/10 hover:border-amber-400/50'
              }`}
            >
              {hymn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};