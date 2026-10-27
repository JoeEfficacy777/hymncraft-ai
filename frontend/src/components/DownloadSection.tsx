import React from 'react';
import { Download, FileText, Music, Layers } from 'lucide-react';
import { HarmonyType } from '@/types/harmony';

interface DownloadSectionProps {
  title: string;
  harmonyType: HarmonyType;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ title, harmonyType }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <h3 className="font-bold text-white text-base flex items-center space-x-2">
        <Download className="w-4 h-4 text-amber-400" />
        <span>Choir Scores & Audio Deliverables</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PDF Sheet Music */}
        <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Sheet Music PDF</h4>
              <p className="text-[11px] text-slate-400 font-mono">Title: {title} - {harmonyType}</p>
            </div>
          </div>
          <button
            onClick={() => alert(`Downloading Sheet Music PDF for: ${title} (${harmonyType} Harmony)`)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
          >
            Download PDF
          </button>
        </div>

        {/* Full Mix MP3 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Full Choir Mix</h4>
              <p className="text-[11px] text-slate-400 font-mono">High Quality 320kbps MP3</p>
            </div>
          </div>
          <button
            onClick={() => alert(`Downloading Full Choir Mix MP3 (${harmonyType})`)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
          >
            Download Mix
          </button>
        </div>

        {/* Stems ZIP Package */}
        <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">All Stems ZIP</h4>
              <p className="text-[11px] text-slate-400 font-mono">Individual S, A, T, B & Piano</p>
            </div>
          </div>
          <button
            onClick={() => alert(`Downloading Stems ZIP Package for all choir members`)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
          >
            Download ZIP
          </button>
        </div>
      </div>
    </div>
  );
};