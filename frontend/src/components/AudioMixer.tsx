import React from 'react';
import { Sliders, Volume2 } from 'lucide-react';
import { HarmonyType } from '@/types/harmony';

interface AudioMixerProps {
  voices: string[];
  harmonyType: HarmonyType;
  trackVolumes: { [key: string]: number };
  trackMutes: { [key: string]: boolean };
  soloTrack: string | null;
  isPlaying: boolean;
  onVolumeChange: (track: string, val: number) => void;
  onToggleMute: (track: string) => void;
  onToggleSolo: (track: string) => void;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({
  voices,
  harmonyType,
  trackVolumes,
  trackMutes,
  soloTrack,
  isPlaying,
  onVolumeChange,
  onToggleMute,
  onToggleSolo
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Choir Stem Mixer</h3>
        </div>
        <span className="text-xs text-slate-400">
          Showing {voices.length} Active Choir Stems + Piano Accompaniment
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {voices.map((voice) => {
          const isMuted = trackMutes[voice];
          const isSolo = soloTrack === voice;
          const vol = trackVolumes[voice] ?? 0.85;

          const voiceInfo = {
            soprano: { label: 'Soprano (Melody)', range: 'C4 – A5', color: 'from-amber-400 to-orange-500' },
            alto: {
              label: harmonyType === 'SAB' ? 'Alto (Merged Middle)' : 'Alto (Harmony)',
              range: 'G3 – D5',
              color: 'from-emerald-400 to-teal-500'
            },
            tenor: { label: 'Tenor (Harmonic Lead)', range: 'C3 – G4', color: 'from-sky-400 to-indigo-500' },
            bass: {
              label: harmonyType === 'OPEN' ? 'Bass (2 Octaves Below)' : 'Bass (Root)',
              range: 'E2 – C4',
              color: 'from-purple-400 to-rose-500'
            }
          }[voice] || { label: voice, range: 'Vocal', color: 'from-indigo-400 to-purple-500' };

          return (
            <div
              key={voice}
              className={`glass-card p-5 rounded-2xl border transition-all ${
                isSolo
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : isMuted
                  ? 'opacity-40 border-white/5'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm text-white capitalize">{voiceInfo.label}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-white/5">
                  {voiceInfo.range}
                </span>
              </div>

              {/* VU Meter Visualizer */}
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden my-3">
                <div
                  className={`h-full bg-gradient-to-r ${voiceInfo.color} transition-all duration-150`}
                  style={{
                    width: isPlaying && !isMuted ? `${Math.min(100, vol * 100 * (0.6 + Math.random() * 0.4))}%` : '0%'
                  }}
                />
              </div>

              {/* Track Volume Slider */}
              <div className="space-y-1 my-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Fader</span>
                  <span className="font-mono">{Math.round(vol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vol}
                  onChange={(e) => onVolumeChange(voice, Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Solo & Mute Buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => onToggleSolo(voice)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition ${
                    isSolo ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  SOLO
                </button>
                <button
                  onClick={() => onToggleMute(voice)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition ${
                    isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  MUTE
                </button>
              </div>
            </div>
          );
        })}

        {/* Piano Accompaniment Fader */}
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-white">Piano Accompaniment</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-white/5">
              Grand Piano
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-gradient-to-r from-amber-200 to-amber-500 transition-all duration-150"
              style={{
                width: isPlaying && !trackMutes['piano'] ? `${Math.min(100, (trackVolumes['piano'] ?? 0.7) * 100 * (0.5 + Math.random() * 0.5))}%` : '0%'
              }}
            />
          </div>

          <div className="space-y-1 my-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Fader</span>
              <span className="font-mono">{Math.round((trackVolumes['piano'] ?? 0.7) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={trackVolumes['piano'] ?? 0.7}
              onChange={(e) => onVolumeChange('piano', Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
            <button
              onClick={() => onToggleSolo('piano')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition ${
                soloTrack === 'piano' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              SOLO
            </button>
            <button
              onClick={() => onToggleMute('piano')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition ${
                trackMutes['piano'] ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              MUTE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};