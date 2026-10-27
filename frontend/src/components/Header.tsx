import React from 'react';
import { Music, Sparkles, ExternalLink } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-amber-200 bg-clip-text text-transparent">
                HymnCraft AI
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0 Multi-Harmony
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Hymn Harmonizer & Choir Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2 Free Hymn Harmonizations</span>
          </div>

          <a
            href="https://github.com/JoeEfficacy777/hymncraft-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition border border-white/5"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
};