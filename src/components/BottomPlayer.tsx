import React from 'react';
import { Play, Pause, SkipBack, SkipForward, List, X } from 'lucide-react';
import { ReaderSettings } from '../types';

interface BottomPlayerProps {
  settings: ReaderSettings;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onSkipPrevious: () => void;
  onSkipNext: () => void;
  currentPercentage: number;
  onToggleTOC: () => void;
  showTOC?: boolean;
  onCycleSpeed: () => void;
  onCloseTTS: () => void;
}

export default function BottomPlayer({
  settings,
  isPlaying,
  onTogglePlayback,
  onSkipPrevious,
  onSkipNext,
  currentPercentage,
  onToggleTOC,
  showTOC,
  onCycleSpeed,
  onCloseTTS
}: BottomPlayerProps) {
  return (
    <>
      {/* Floating Panel Container */}
      <nav
        id="bottom-player-bar"
        className={`fixed bottom-0 left-0 w-full z-40 flex flex-col justify-center items-center px-6 pb-6 pt-2 pointer-events-none transition-all duration-300 ${
          showTOC ? 'md:pl-80' : ''
        }`}
      >
        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200/60 dark:border-neutral-800/80 shadow-2xl rounded-full px-6 py-3 flex items-center justify-between max-w-lg w-full pointer-events-auto relative">
          
          {/* Speed Control Button */}
          <div className="flex items-center">
            <button
              id="bottom-speed-btn"
              onClick={onCycleSpeed}
              className="flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-100 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-full transition-transform active:scale-95"
              title={`Playback speed: ${settings.speed}x`}
            >
              <span className="font-sans text-sm font-extrabold text-neutral-600 dark:text-neutral-350 leading-none h-5 flex items-center justify-center">
                {settings.speed}x
              </span>
              <span className="font-sans text-[10px] uppercase tracking-wider font-bold mt-1">
                Speed
              </span>
            </button>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-5">
            {/* Skip Previous Block */}
            <button
              id="skip-prev-btn"
              onClick={onSkipPrevious}
              className="flex items-center justify-center text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-100 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-full transition-all active:scale-90"
              title="Previous paragraph"
            >
              <SkipBack className="w-6.5 h-6.5" />
            </button>

            {/* Huge Play/Pause primary action button */}
            <button
              id="play-pause-btn"
              onClick={onTogglePlayback}
              className="flex items-center justify-center bg-[#D35400] text-white rounded-full p-4.5 shadow-lg shadow-[#D35400]/25 transition-all hover:scale-105 active:scale-95 text-white"
              title={isPlaying ? 'Pause narration' : 'Play narration'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current text-white stroke-[2.5]" />
              ) : (
                <Play className="w-8 h-8 fill-current translate-x-0.5 text-white stroke-[2.5]" />
              )}
            </button>

            {/* Skip Next Block */}
            <button
              id="skip-next-btn"
              onClick={onSkipNext}
              className="flex items-center justify-center text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-100 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-full transition-all active:scale-90"
              title="Next paragraph"
            >
              <SkipForward className="w-6.5 h-6.5" />
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Table of Contents Trigger */}
            <button
              id="bottom-toc-toggle"
              onClick={onToggleTOC}
              className="flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-100 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-full transition-transform active:scale-95 cursor-pointer"
              title="Table of Contents"
            >
              <List className="w-5 h-5 text-neutral-600 dark:text-neutral-350" />
              <span className="font-sans text-[10px] uppercase tracking-wider font-bold mt-1">
                TOC
              </span>
            </button>

            {/* Close / Disable TTS Button */}
            <button
              id="bottom-tts-close-btn"
              onClick={onCloseTTS}
              className="flex flex-col items-center justify-center text-neutral-500 hover:text-[#D35400] dark:text-neutral-400 dark:hover:text-[#ff7a3c] p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-full transition-transform active:scale-95 cursor-pointer"
              title="Close TTS Reader"
            >
              <X className="w-5 h-5" />
              <span className="font-sans text-[10px] uppercase tracking-wider font-bold mt-1">
                Close
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* TTS Progress Bar (Pinned to the absolute bottom of the viewport) */}
      <div className={`fixed bottom-0 left-0 w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 z-50 transition-all duration-300 ${
        showTOC ? 'md:pl-80' : ''
      }`}>
        <div
          id="tts-progress-slider"
          className="h-full bg-[#D35400] transition-all duration-300 shadow-md shadow-[#D35400]/40"
          style={{ width: `${currentPercentage}%` }}
        />
      </div>
    </>
  );
}
