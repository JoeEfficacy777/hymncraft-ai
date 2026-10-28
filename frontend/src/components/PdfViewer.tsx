import React, { useState } from 'react';
import { FileText, ZoomIn, ZoomOut, Maximize2, Download, Printer } from 'lucide-react';
import { HarmonyType } from '@/types/harmony';

interface PdfViewerProps {
  title: string;
  harmonyType: HarmonyType;
  pdfUrl?: string;
  keySignature: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  title,
  harmonyType,
  pdfUrl,
  keySignature
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden border border-white/10 transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 bg-slate-950/95 flex flex-col p-6' : 'p-6 space-y-4'
    }`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <span>Interactive Sheet Music Viewer</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PDF Score
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {title} — <span className="text-amber-300 font-semibold">{harmonyType} Harmony</span> ({keySignature})
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-900 rounded-xl border border-white/10 p-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span
              onClick={handleResetZoom}
              className="px-2 text-xs font-mono text-slate-400 cursor-pointer hover:text-white"
            >
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-white/10 text-slate-300 transition"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <a
            href={pdfUrl || '#'}
            download={`${title}_${harmonyType}_Score.pdf`}
            onClick={(e) => {
              if (!pdfUrl || pdfUrl === '#') {
                e.preventDefault();
                alert(`Downloading Printable PDF score for ${title} (${harmonyType} Voicing)`);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-600/30 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* PDF / MusicXML Visualizer Viewport */}
      <div className={`overflow-auto flex justify-center bg-slate-950/60 rounded-xl p-4 border border-white/5 ${
        isFullscreen ? 'flex-1' : 'max-h-[500px]'
      }`}>
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="bg-white text-slate-900 p-8 rounded-lg shadow-2xl w-full max-w-3xl min-h-[600px] transition-transform duration-150 flex flex-col justify-between font-serif select-none"
        >
          {/* Header */}
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
            <p className="text-sm italic font-sans font-medium text-slate-600 mt-1">
              Arranged in <span className="font-bold text-indigo-700">{harmonyType} Harmony</span> for Church Choir
            </p>
            <div className="flex justify-between items-center text-xs font-sans text-slate-500 mt-4 px-2">
              <span>Key: <strong>{keySignature}</strong></span>
              <span>Tempo: <strong>Moderato (90 BPM)</strong></span>
              <span>Engraved by: <strong>HymnCraft AI</strong></span>
            </div>
          </div>

          {/* Staves Engraving Simulation */}
          <div className="space-y-8 flex-1 py-2">
            {/* System 1: Soprano & Alto (Treble Clef) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-700 px-1">
                <span>Soprano & Alto</span>
                <span className="font-mono text-[11px] text-slate-400">Measure 1 - 4</span>
              </div>
              <div className="relative h-16 border-y-2 border-slate-800 flex flex-col justify-between py-1 bg-amber-50/20 px-4">
                <div className="border-b border-slate-400 h-0 w-full" />
                <div className="border-b border-slate-400 h-0 w-full" />
                <div className="border-b border-slate-400 h-0 w-full" />
                {/* Notes overlay */}
                <div className="absolute inset-0 flex items-center justify-around px-8 font-mono text-2xl font-bold text-slate-900">
                  <span className="text-3xl font-serif">𝄞</span>
                  <span>𝅘𝅥</span>
                  <span>𝅘𝅥𝅯</span>
                  <span>𝅘𝅥</span>
                  <div className="h-full w-[2px] bg-slate-400" />
                  <span>𝅘𝅥</span>
                  <span>𝅘𝅥𝅯</span>
                  <span>𝅗𝅥</span>
                  <div className="h-full w-[2px] bg-slate-800" />
                </div>
              </div>
            </div>

            {/* System 2: Tenor & Bass (Bass Clef) if harmony has 3 or 4 parts */}
            {harmonyType !== 'TWO_PART' && harmonyType !== 'PARALLEL_THIRDS' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-sans font-bold text-slate-700 px-1">
                  <span>{harmonyType === 'SAB' ? 'Bass Choir Voice' : 'Tenor & Bass'}</span>
                  <span className="font-mono text-[11px] text-slate-400">Measure 1 - 4</span>
                </div>
                <div className="relative h-16 border-y-2 border-slate-800 flex flex-col justify-between py-1 bg-amber-50/20 px-4">
                  <div className="border-b border-slate-400 h-0 w-full" />
                  <div className="border-b border-slate-400 h-0 w-full" />
                  <div className="border-b border-slate-400 h-0 w-full" />
                  {/* Notes overlay */}
                  <div className="absolute inset-0 flex items-center justify-around px-8 font-mono text-2xl font-bold text-slate-900">
                    <span className="text-3xl font-serif">𝄢</span>
                    <span>𝅘𝅥</span>
                    <span>𝅘𝅥</span>
                    <span>𝅘𝅥𝅯</span>
                    <div className="h-full w-[2px] bg-slate-400" />
                    <span>𝅘𝅥</span>
                    <span>𝅗𝅥</span>
                    <span>𝅘𝅥</span>
                    <div className="h-full w-[2px] bg-slate-800" />
                  </div>
                </div>
              </div>
            )}

            {/* Lyrics bar */}
            <div className="flex justify-around text-xs italic font-serif text-slate-700 px-10 pt-1">
              <span>A - maz - ing</span>
              <span>grace!</span>
              <span>how</span>
              <span>sweet</span>
              <span>the</span>
              <span>sound...</span>
            </div>
          </div>

          {/* Footer note on sheet */}
          <div className="text-center text-[10px] text-slate-500 border-t pt-3 mt-4 font-sans">
            Copyright © 2026 HymnCraft AI Multi-Harmony Edition. Formatted for Choral Distribution.
          </div>
        </div>
      </div>
    </div>
  );
};