import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Book, FileText, Award, Volume2, VolumeX } from 'lucide-react';
import { Chapter } from '../types';

interface TOCDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  activeChapterId: string;
  activeBlockId: string;
  onSelectChapter: (id: string) => void;
  onSelectSubchapter: (chapterId: string, blockId: string) => void;
  enableTTS: boolean;
  onToggleTTS: () => void;
}

export default function TOCDrawer({
  isOpen,
  onClose,
  chapters,
  activeChapterId,
  activeBlockId,
  onSelectChapter,
  onSelectSubchapter,
  enableTTS,
  onToggleTTS
}: TOCDrawerProps) {
  // Group chapters by category
  const categories = chapters.reduce((acc, ch) => {
    if (!acc[ch.category]) {
      acc[ch.category] = [];
    }
    acc[ch.category].push(ch);
    return acc;
  }, {} as Record<string, Chapter[]>);

  // Determine elegant category ordering
  const categoryOrder = [
    'Front Matter',
    'Part I: Before the Incident',
    'Part II: During the Incident',
    'Part III: After the Incident',
    'Back Matter'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            id="toc-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Table of Contents Drawer */}
          <motion.aside
            id="toc-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed left-0 top-0 h-full w-80 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Table of Contents
                </h2>
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wide font-semibold">
                  SEV1 Incident Guide
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  id="toc-tts-toggle"
                  onClick={onToggleTTS}
                  className={`p-2 rounded-full hover:bg-neutral-150 dark:hover:bg-neutral-800 active:scale-95 transition-all ${
                    enableTTS ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                  }`}
                  title={enableTTS ? "Turn Text-To-Speech OFF" : "Turn Text-To-Speech ON"}
                >
                  {enableTTS ? (
                    <Volume2 className="w-5 h-5 stroke-[2.2]" />
                  ) : (
                    <VolumeX className="w-5 h-5 stroke-[2.2]" />
                  )}
                </button>
                <button
                  id="close-toc-btn"
                  onClick={onClose}
                  className="p-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-full hover:bg-neutral-150 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Close Table of Contents"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Body */}
            <nav className="flex-1 overflow-y-auto p-5 space-y-6">
              {categoryOrder.map((category) => {
                const catChapters = categories[category];
                if (!catChapters || catChapters.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h3 className="px-2 font-sans text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-bold">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {catChapters.map((ch) => {
                        const isActive = ch.id === activeChapterId;
                        const subheaders = ch.blocks?.filter(b => b.type === 'header' && b.meta?.level === 2) || [];
                        return (
                          <div key={ch.id} className="space-y-1">
                            <button
                              id={`toc-ch-${ch.id}`}
                              onClick={() => {
                                onSelectChapter(ch.id);
                              }}
                              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                                isActive
                                  ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              <span className={`mt-0.5 shrink-0 ${isActive ? 'text-[#D35400]' : 'text-neutral-400'}`}>
                                {ch.category.includes('Front') ? (
                                  <Book className="w-4.5 h-4.5" />
                                ) : (
                                  <FileText className="w-4.5 h-4.5" />
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-sans text-sm font-medium leading-snug truncate">
                                  {ch.title}
                                </p>
                                {ch.subtitle && ch.subtitle !== ch.title && (
                                  <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 leading-normal truncate mt-0.5">
                                    {ch.subtitle.replace(/🤔|🧠|🗣️|🚀/g, '').trim()}
                                  </p>
                                )}
                              </div>
                            </button>

                            {/* Subheadings accordion */}
                            {isActive && subheaders.length > 0 && (
                              <div className="ml-8 pl-3 border-l border-neutral-250 dark:border-neutral-800 space-y-0.5">
                                {subheaders.map((sub) => {
                                  const isSubActive = activeBlockId === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      id={`toc-subch-${sub.id}`}
                                      onClick={() => onSelectSubchapter(ch.id, sub.id)}
                                      className={`w-full text-left py-1.5 px-2 rounded-lg text-xs transition-all leading-normal ${
                                        isSubActive
                                          ? 'text-[#D35400] font-semibold bg-amber-500/10'
                                          : 'text-neutral-600 dark:text-neutral-450 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-850/60'
                                      }`}
                                    >
                                      {sub.text}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950/20">
              <div className="flex items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                <Award className="w-4 h-4 text-[#D35400]" />
                <span>Second Edition – August 2025</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
