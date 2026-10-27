import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HarmonyType, HarmonyOption } from '@/types/harmony';

export const HARMONY_OPTIONS: HarmonyOption[] = [
  {
    id: 'SATB',
    number: 1,
    title: 'SATB 4-Part Bach Chorale',
    tagline: 'Traditional Hymn & Full Church Sound',
    description: 'Classical 4-part voice leading rules. Rich, solemn, balanced church acoustics.',
    voices: ['S', 'A', 'T', 'B'],
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    iconName: 'church'
  },
  {
    id: 'SAB',
    number: 2,
    title: 'SAB 3-Part Small Choir',
    tagline: 'For Choirs Without Tenors',
    description: 'Blends Tenor into Alto for a punchy middle voice without requiring tenor section.',
    voices: ['S', 'A', 'B'],
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    iconName: 'users'
  },
  {
    id: 'TWO_PART',
    number: 3,
    title: 'Two-Part Duet',
    tagline: 'Soprano Lead + Harmony in 3rds',
    description: 'Pure, lyrical two-voice counterpoint flowing in diatonic 3rds and 6ths.',
    voices: ['S', 'A'],
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    iconName: 'music'
  },
  {
    id: 'CLOSE',
    number: 4,
    title: 'Close Harmony',
    tagline: 'Sweet Barbershop & Acapella',
    description: 'All 4 vocal parts voiced tightly within 1 octave of the lead melody. Warm & intimate.',
    voices: ['S', 'A', 'T', 'B (Close)'],
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    iconName: 'sparkles'
  },
  {
    id: 'OPEN',
    number: 5,
    title: 'Open Cathedral Harmony',
    tagline: 'Spacious Wide Voicing',
    description: 'Expansive choir arrangement with Bass 2 octaves below. Grand sanctuary reverberation.',
    voices: ['S', 'A', 'T', 'B (Wide)'],
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    iconName: 'layers'
  },
  {
    id: 'PARALLEL_THIRDS',
    number: 6,
    title: 'Parallel 3rds & 6ths',
    tagline: 'Simple Praise & Worship',
    description: 'Second voice diatonically mirrors the melody in sweet thirds. Perfect for praise teams.',
    voices: ['S', 'A (3rd Below)'],
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    iconName: 'radio'
  },
  {
    id: 'GOSPEL',
    number: 7,
    title: 'Gospel Contemporary',
    tagline: '7ths, Passing Chords & Walking Bass',
    description: 'Modern soulful harmony loaded with secondary dominants, 7th/9th tensions, and walking bass.',
    voices: ['S', 'A (7ths)', 'T (Color)', 'B (Walk)'],
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    iconName: 'sparkles'
  }
];

interface HarmonySelectorProps {
  selected: HarmonyType;
  onSelect: (type: HarmonyType) => void;
}

export const HarmonySelector: React.FC<HarmonySelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
          <h3 className="text-lg font-bold text-white">Choose Harmony Style (Required)</h3>
        </div>
        <span className="text-xs text-slate-400">7 Specialized Church Voicings</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {HARMONY_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 glass-card group hover:scale-[1.02] border ${
                isSelected
                  ? 'border-amber-400/80 bg-slate-800/90 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-slate-400">#{opt.number}</span>
                <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${opt.badgeColor}`}>
                  {opt.id}
                </div>
              </div>

              <h4 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                {opt.title}
              </h4>
              <p className="text-xs text-amber-400/90 font-medium mt-0.5">{opt.tagline}</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{opt.description}</p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Voices:</span>
                <div className="flex space-x-1">
                  {opt.voices.map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 font-mono text-[10px]">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};