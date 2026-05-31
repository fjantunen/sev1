/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Menu, BookOpen, Volume2, VolumeX, Home, ArrowUpCircle } from 'lucide-react';
import { Chapter, ReaderSettings, ReaderTheme, MarkdownBlock } from './types';
import { DEFAULT_CHAPTERS } from './chaptersData';
import { parseMarkdown } from './utils/parser';
import TOCDrawer from './components/TOCDrawer';
import BottomPlayer from './components/BottomPlayer';
import ReaderCanvas from './components/ReaderCanvas';

const THEMES: ReaderTheme[] = [
  {
    id: 'paper',
    name: 'Paper Warm',
    bg: '#fbf9f8',
    text: '#1b1c1c',
    variantText: '#594238',
    accent: '#D35400',
    accentText: '#ffffff',
    cardBg: '#e4e2e1',
    borderColor: 'rgba(51,34,24,0.1)',
    isDark: false,
    highlightBg: '#FDEBD0'
  },
  {
    id: 'mint',
    name: 'Mint Fresh',
    bg: '#f0f7f4',
    text: '#1d2c22',
    variantText: '#4f6153',
    accent: '#117c46',
    accentText: '#ffffff',
    cardBg: '#ebf6ef',
    borderColor: 'rgba(17,124,70,0.1)',
    isDark: false,
    highlightBg: '#d0f2df'
  },
  {
    id: 'slate',
    name: 'Slate Midnight',
    bg: '#1b1e22',
    text: '#f1f3f5',
    variantText: '#a0aab4',
    accent: '#ff7a3c',
    accentText: '#ffffff',
    cardBg: '#13161c',
    borderColor: 'rgba(255,124,60,0.25)',
    isDark: true,
    highlightBg: '#353b47'
  },
  {
    id: 'charcoal',
    name: 'Charcoal Dark',
    bg: '#121212',
    text: '#e0e0e0',
    variantText: '#999999',
    accent: '#ff6b6b',
    accentText: '#ffffff',
    cardBg: '#18181b',
    borderColor: 'rgba(255,255,255,0.1)',
    isDark: true,
    highlightBg: '#27272a'
  }
];

const DEFAULT_SETTINGS: ReaderSettings = {
  themeId: 'paper',
  fontStyle: 'serif',
  fontSize: 1.0,
  speed: 1.0,
  autoScroll: true,
  highcontrast: false
};

export default function App() {
  // 1. Core State
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const cached = localStorage.getItem('lumina_chapters');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length === DEFAULT_CHAPTERS.length) {
          const cachedTitlePage = parsed.find((ch: any) => ch.id === 'title-page');
          const defaultTitlePage = DEFAULT_CHAPTERS.find((ch: any) => ch.id === 'title-page');
          if (cachedTitlePage && defaultTitlePage && cachedTitlePage.markdown !== defaultTitlePage.markdown) {
            return DEFAULT_CHAPTERS;
          }
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_CHAPTERS;
  });

  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const cached = localStorage.getItem('lumina_settings');
    return cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
  });

  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    return localStorage.getItem('lumina_active_chapter') || 'title-page';
  });

  const [activeBlockId, setActiveBlockId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showTOC, setShowTOC] = useState<boolean>(true);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [enableTTS, setEnableTTS] = useState<boolean>(() => {
    return localStorage.getItem('lumina_enable_tts') !== 'false';
  });
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('lumina_selected_voice') || '';
  });

  const lastScrollY = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Parse all chapters' markdown content into structured blocks
  const chaptersWithBlocks = React.useMemo(() => {
    return chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      category: ch.category,
      blocks: parseMarkdown(ch.markdown).map((b) => ({
        ...b,
        id: `${ch.id}_${b.id}`, // ensure globally unique block IDs
        chapterId: ch.id
      }))
    }));
  }, [chapters]);

  const parsedBlocks = React.useMemo(() => {
    return chaptersWithBlocks.flatMap((ch) => ch.blocks);
  }, [chaptersWithBlocks]);

  const activeChapter = chapters.find((ch) => ch.id === activeChapterId) || chapters[0];

  // Sync active chapter ID with the playing active block ID
  useEffect(() => {
    if (activeBlockId) {
      const activeBlock = parsedBlocks.find((b) => b.id === activeBlockId);
      if (activeBlock && (activeBlock as any).chapterId && (activeBlock as any).chapterId !== activeChapterId) {
        setActiveChapterId((activeBlock as any).chapterId);
      }
    }
  }, [activeBlockId, parsedBlocks, activeChapterId]);

  // 2. LocalStorage Persistence Sync
  useEffect(() => {
    localStorage.setItem('lumina_chapters', JSON.stringify(chapters));
  }, [chapters]);

  useEffect(() => {
    localStorage.setItem('lumina_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('lumina_active_chapter', activeChapterId);
  }, [activeChapterId]);

  useEffect(() => {
    localStorage.setItem('lumina_selected_voice', selectedVoiceName);
  }, [selectedVoiceName]);

  // Adjust theme color class inside native document body
  const currentTheme = THEMES.find((t) => t.id === settings.themeId) || THEMES[0];
  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.bg;
    if (currentTheme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  // Header fade-on-scroll logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 20) {
        setShowHeader(true);
      } else if (currentScrollY > 105 && currentScrollY > lastScrollY.current) {
        // Scrolling down
        setShowHeader(false);
      } else {
        // Scrolling up
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2.5. IntersectionObserver to detect active chapter during scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry = null;
        let maxRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            bestEntry = entry;
          }
        }
        if (bestEntry) {
          const chapterId = bestEntry.target.getAttribute('data-chapter-id');
          if (chapterId) {
            setActiveChapterId(chapterId);
          }
        }
      },
      {
        rootMargin: '-15% 0px -45% 0px',
        threshold: [0.1, 0.3, 0.5, 0.8]
      }
    );

    chapters.forEach((ch) => {
      const el = document.getElementById(`chapter-container-${ch.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapters]);

  // 3. Audio Speech Synthesis setup & controls
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        // Load clean default voices
        let voices = window.speechSynthesis.getVoices();
        // Filter English or common legible system voices to prevent robotic clicks
        voices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('en-'));
        setVoiceList(voices);
      };

      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // Clear speech synthesizer when active chapter drops or changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveBlockId('');
  }, [activeChapterId]);

  // Perform standard single-block text synthesis
  const speakBlock = (blockId: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // kill any active stream
    const targetBlock = parsedBlocks.find((b) => b.id === blockId);
    if (!targetBlock) return;

    // Filter text for friendly narration
    const cleanSpeechText = targetBlock.text
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]/gu, '') // remove all emojis
      .replace(/\s+/g, ' ') // normalize spaces
      .replace(/[\*_`\-]/g, '') // remove leftovers markdown punctuation
      .trim();

    if (!cleanSpeechText) {
      // Empty text - auto advance block.
      handleNextBlock(blockId);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    
    // Bind specific custom voice preference if selected
    if (selectedVoiceName) {
      const activeVoice = voiceList.find((v) => v.name === selectedVoiceName);
      if (activeVoice) {
        utterance.voice = activeVoice;
      }
    }

    // Connect speed rate parameters
    utterance.rate = settings.speed;

    // Speak event boundary listeners
    utterance.onend = () => {
      if (isPlayingRef.current) {
        handleNextBlock(blockId);
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis feedback or interruption:', e);
      if (e.error !== 'interrupted') {
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);
    setActiveBlockId(blockId);

    // Dynamic scroll logic
    if (settings.autoScroll) {
      setTimeout(() => {
        const el = document.getElementById(`block-node-${blockId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Move playback highlight to following block
  const handleNextBlock = (currentId: string) => {
    const currentIndex = parsedBlocks.findIndex((b) => b.id === currentId);
    if (currentIndex >= 0 && currentIndex < parsedBlocks.length - 1) {
      const nextBlockId = parsedBlocks[currentIndex + 1].id;
      speakBlock(nextBlockId);
    } else {
      // Completed last block of chapter
      isPlayingRef.current = false;
      setIsPlaying(false);
      window.speechSynthesis.cancel();
    }
  };

  // Manual select block highlight/narrative trigger
  const handleSelectBlock = (blockId: string) => {
    if (!enableTTS) return;
    isPlayingRef.current = true;
    speakBlock(blockId);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Toggle master audio player
  const handleTogglePlayback = () => {
    if (isPlayingRef.current) {
      window.speechSynthesis.cancel();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      // Play currently focused block or start from index 0
      const currentId = activeBlockId || (parsedBlocks[0]?.id);
      if (currentId) {
        speakBlock(currentId);
      }
    }
  };

  // Previous Block highlight step back
  const handleSkipPrevious = () => {
    const currentIndex = parsedBlocks.findIndex((b) => b.id === activeBlockId);
    if (currentIndex > 0) {
      const prevBlockId = parsedBlocks[currentIndex - 1].id;
      if (isPlaying) {
        speakBlock(prevBlockId);
      } else {
        setActiveBlockId(prevBlockId);
      }
    } else {
      // Stay on first block
      if (parsedBlocks[0]) {
        if (isPlaying) {
          speakBlock(parsedBlocks[0].id);
        } else {
          setActiveBlockId(parsedBlocks[0].id);
        }
      }
    }
  };

  // Next Block highlight step forward
  const handleSkipNext = () => {
    const currentIndex = parsedBlocks.findIndex((b) => b.id === activeBlockId);
    if (currentIndex >= 0 && currentIndex < parsedBlocks.length - 1) {
      const nextBlockId = parsedBlocks[currentIndex + 1].id;
      if (isPlaying) {
        speakBlock(nextBlockId);
      } else {
        setActiveBlockId(nextBlockId);
      }
    } else if (currentIndex === -1 && parsedBlocks[0]) {
      setActiveBlockId(parsedBlocks[0].id);
    }
  };

  // Toggle active chapter from TOC with smooth scrolling
  const handleSelectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setTimeout(() => {
      const el = document.getElementById(`chapter-container-${chapterId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleSelectSubchapter = (chapterId: string, blockId: string) => {
    setActiveChapterId(chapterId);
    setActiveBlockId(blockId);
    setTimeout(() => {
      const el = document.getElementById(`block-node-${blockId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 55);
  };

  // Configure inline markdown custom updater
  const handleUpdateChapterMarkdown = (chapterId: string, updatedMarkdown: string) => {
    setChapters(
      chapters.map((ch) => (ch.id === chapterId ? { ...ch, markdown: updatedMarkdown } : ch))
    );
  };

  // Reset custom markdown file contents to default state
  const handleResetChapter = (chapterId: string) => {
    const defaults = DEFAULT_CHAPTERS.find((ch) => ch.id === chapterId);
    if (defaults) {
      handleUpdateChapterMarkdown(chapterId, defaults.markdown);
    }
  };

  // Cycle speed settings [1.0, 1.25, 1.5, 1.75, 2.0]
  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    const currentIndex = speeds.indexOf(settings.speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length] || 1.0;
    setSettings((prev) => ({
      ...prev,
      speed: nextSpeed
    }));
  };

  // Toggle TTS enabled state
  const handleToggleTTS = () => {
    const nextVal = !enableTTS;
    setEnableTTS(nextVal);
    localStorage.setItem('lumina_enable_tts', String(nextVal));
    if (!nextVal) {
      window.speechSynthesis.cancel();
      isPlayingRef.current = false;
      setIsPlaying(false);
      setActiveBlockId('');
    }
  };

  // Re-adjust speed rates immediately if altered
  useEffect(() => {
    if (isPlaying && activeBlockId) {
      speakBlock(activeBlockId);
    }
  }, [settings.speed]);

  // Speech percentage progress helper bar calculation
  const getProgressPercentage = () => {
    if (parsedBlocks.length === 0) return 0;
    const currentIndex = parsedBlocks.findIndex((b) => b.id === activeBlockId);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / parsedBlocks.length) * 100;
  };

  return (
    <div
      className={`min-h-screen text-on-surface flex flex-col transition-all duration-300 relative ${
        enableTTS ? 'select-none pb-32' : 'select-text pb-12'
      } ${
        showTOC ? 'md:pl-80' : ''
      }`}
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text
      }}
    >
      {/* Top Floating App Bar */}
      <header
        id="top-nav-bar"
        className={`fixed top-0 left-0 w-full h-16 flex justify-between items-center px-6 md:px-12 z-30 transition-all duration-300 ${
          showHeader
            ? 'opacity-100 backdrop-blur-md bg-transparent'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        } border-b border-neutral-300/10 dark:border-neutral-700/10 ${
          showTOC ? 'md:pl-80' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="header-toc-toggle"
            onClick={() => setShowTOC(!showTOC)}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-500/10 active:scale-90 transition-all text-[#D35400]"
            style={{ color: currentTheme.accent }}
            title="Toggle Table of Contents"
          >
            <Menu className="w-6.5 h-6.5 stroke-[2.5]" />
          </button>
          
          <button
            onClick={() => handleSelectChapter('title-page')}
            className="flex items-center gap-1.5 focus:outline-none"
          >
            <span
              id="top-logo-badge"
              className="font-serif text-lg font-extrabold tracking-tight hidden sm:block hover:opacity-80 transition-opacity"
              style={{ color: currentTheme.text }}
            >
              SEV1.org
            </span>
          </button>
        </div>

        {/* Small screen truncated chapter header subtitle */}
        <div
          id="top-active-title"
          className="font-sans text-xs font-extrabold tracking-wider text-neutral-550 uppercase truncate max-w-[180px] md:max-w-md opacity-80"
          style={{ color: currentTheme.variantText }}
        >
          {activeChapter.title}
        </div>

        {/* Spacer for symmetric header layout */}
        <div className="w-10 h-10" />
      </header>

      {/* Main Chapter Reading Canvas Section */}
      <main className="flex-1 mt-20">
        <ReaderCanvas
          chapters={chaptersWithBlocks}
          activeBlockId={activeBlockId}
          onSelectBlock={handleSelectBlock}
          settings={settings}
          theme={currentTheme}
          enableTTS={enableTTS}
        />
      </main>

      {/* Bottom control audio playback settings and controls bar */}
      {enableTTS && (
        <BottomPlayer
          settings={settings}
          isPlaying={isPlaying}
          onTogglePlayback={handleTogglePlayback}
          onSkipPrevious={handleSkipPrevious}
          onSkipNext={handleSkipNext}
          currentPercentage={getProgressPercentage()}
          onToggleTOC={() => setShowTOC(!showTOC)}
          showTOC={showTOC}
          onCycleSpeed={handleCycleSpeed}
          onCloseTTS={handleToggleTTS}
        />
      )}

      {/* Left drawer menu showing full Table of Contents */}
      <TOCDrawer
        isOpen={showTOC}
        onClose={() => setShowTOC(false)}
        chapters={chaptersWithBlocks}
        activeChapterId={activeChapterId}
        activeBlockId={activeBlockId}
        onSelectChapter={handleSelectChapter}
        onSelectSubchapter={handleSelectSubchapter}
        enableTTS={enableTTS}
        onToggleTTS={handleToggleTTS}
      />
    </div>
  );
}
