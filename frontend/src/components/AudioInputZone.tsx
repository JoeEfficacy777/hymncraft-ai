import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, CheckCircle2, Sparkles } from 'lucide-react';

interface AudioInputZoneProps {
  audioFile: File | null;
  audioUrl: string | null;
  onAudioChange: (file: File | null, url: string | null) => void;
}

export const AudioInputZone: React.FC<AudioInputZoneProps> = ({
  audioFile,
  audioUrl,
  onAudioChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], 'hummed_hymn.wav', { type: 'audio/wav' });
        onAudioChange(file, URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      alert('Microphone access denied or unavailable. You can use the sample demo hymns below!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const loadDemoHymn = (name: string) => {
    const dummyBlob = new Blob(['RIFF....WAVE'], { type: 'audio/wav' });
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
        <span className="text-xs text-slate-400">MP3, WAV, or Live Voice Humming</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Mic Recording */}
        <div className="border border-dashed border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/50">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-rose-500 animate-pulse ring-8 ring-rose-500/20' : 'bg-indigo-600/30 text-indigo-400'
            }`}
          >
            <Mic className="w-8 h-8 text-white" />
          </div>

          <div>
            <h4 className="font-bold text-white">
              {isRecording ? 'Recording humming...' : 'Record Humming Directly'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {isRecording ? `Recording: ${recordDuration}s (Sing clearly into mic)` : 'Click to sing or hum the melody verse'}
            </p>
          </div>

          {isRecording ? (
            <button
              onClick={stopRecording}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-rose-600/30"
            >
              <Square className="w-4 h-4" />
              <span>Stop & Save Recording</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-indigo-600/30"
            >
              <Mic className="w-4 h-4" />
              <span>Start Voice Recording</span>
            </button>
          )}
        </div>

        {/* Drag and Drop File Upload */}
        <div className="border border-dashed border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/50 relative">
          <Upload className="w-12 h-12 text-slate-400" />
          <div>
            <h4 className="font-bold text-white">Upload Audio File</h4>
            <p className="text-xs text-slate-400 mt-1">Drag and drop voice note, MP3 or WAV file</p>
          </div>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                onAudioChange(file, URL.createObjectURL(file));
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {audioFile && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Loaded: {audioFile.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Demo Melodies */}
      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-400 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Or test with instant demo hymns:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {['Amazing Grace', 'Holy Holy Holy', 'Great Is Thy Faithfulness'].map((hymn) => (
            <button
              key={hymn}
              onClick={() => loadDemoHymn(hymn)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
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