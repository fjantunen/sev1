import React from 'react';
import { AlertTriangle, ShieldCheck, CheckSquare, Info } from 'lucide-react';
import { MarkdownBlock, ReaderSettings, ReaderTheme } from '../types';

function formatMarkdownToHTML(rawText: string): string {
  const lines = rawText.split('\n');
  let resultHtml = '';
  let inList = false;
  let listType = ''; // 'ul' or 'ol'
  let inBlockquote = false;
  let inCodeBlock = false;
  let inTable = false;
  let isTableHeader = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trimmed = line.trim();

    // Handle code block fences
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      if (inCodeBlock) {
        resultHtml += '</code></pre>';
        inCodeBlock = false;
      } else {
        if (inList) {
          resultHtml += `</${listType}>`;
          inList = false;
        }
        if (inBlockquote) {
          resultHtml += '</blockquote>';
          inBlockquote = false;
        }
        if (inTable) {
          resultHtml += '</table></div>';
          inTable = false;
        }
        resultHtml += '<pre class="bg-neutral-100 dark:bg-neutral-850 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3 text-neutral-800 dark:text-neutral-200"><code>';
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      const escapedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      resultHtml += escapedLine + '\n';
      continue;
    }

    // Handle blockquote
    if (trimmed.startsWith('>')) {
      if (!inBlockquote) {
        if (inList) {
          resultHtml += `</${listType}>`;
          inList = false;
        }
        if (inTable) {
          resultHtml += '</table></div>';
          inTable = false;
        }
        resultHtml += '<blockquote class="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic my-3 text-neutral-600 dark:text-neutral-350">';
        inBlockquote = true;
      }
      line = trimmed.substring(1).trim();
      trimmed = line;
    } else if (inBlockquote && !trimmed.startsWith('>')) {
      if (trimmed === '' && i < lines.length - 1 && lines[i + 1].trim().startsWith('>')) {
        resultHtml += '<div class="h-2"></div>';
        continue;
      } else {
        resultHtml += '</blockquote>';
        inBlockquote = false;
      }
    }

    // Handle table row
    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');
    if (isTableRow) {
      if (!inTable) {
        if (inList) {
          resultHtml += `</${listType}>`;
          inList = false;
        }
        resultHtml += '<div class="overflow-x-auto my-4 border border-neutral-200 dark:border-neutral-800 rounded-xl"><table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm text-left">';
        inTable = true;
        isTableHeader = true;
      }
      
      const cols = line.split('|').map(c => c.trim());
      const actualCols = cols.slice(1, -1);
      
      const isSeparator = actualCols.every(c => /^:?-+:?$/.test(c));
      if (isSeparator) {
        continue;
      }
      
      resultHtml += '<tr class="even:bg-neutral-50/50 dark:even:bg-neutral-900/30">';
      for (const col of actualCols) {
        if (isTableHeader) {
          resultHtml += `<th class="px-4 py-3 font-sans font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-100/50 dark:bg-neutral-950/40">${col}</th>`;
        } else {
          resultHtml += `<td class="px-4 py-3 text-neutral-750 dark:text-neutral-250 border-t border-neutral-200/50 dark:border-neutral-800/50">${col}</td>`;
        }
      }
      resultHtml += '</tr>';
      isTableHeader = false;
      continue;
    } else if (inTable) {
      resultHtml += '</table></div>';
      inTable = false;
    }

    // Handle subheaders
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || [''])[0].length;
      const cleanText = trimmed.replace(/^#+\s*/, '');
      if (level === 2) {
        resultHtml += `<h3 class="text-lg font-bold mt-4 mb-2">${cleanText}</h3>`;
      } else if (level === 3) {
        resultHtml += `<h4 class="text-md font-bold mt-3 mb-1.5 text-amber-600">${cleanText}</h4>`;
      } else {
        resultHtml += `<h5 class="text-sm font-extrabold uppercase tracking-wide mt-3 mb-1 text-neutral-500">${cleanText}</h5>`;
      }
      continue;
    }

    // Handle list item
    const leadingSpaces = (line.match(/^\s*/) || [''])[0].length;
    const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');
    const isNumbered = /^\d+\.\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      const targetListType = isNumbered ? 'ol' : 'ul';
      if (!inList) {
        resultHtml += targetListType === 'ol'
          ? '<ol class="list-decimal pl-6 space-y-1.5 my-3">'
          : '<ul class="list-disc pl-6 space-y-1.5 my-3">';
        inList = true;
        listType = targetListType;
      } else if (listType !== targetListType) {
        resultHtml += `</${listType}>`;
        resultHtml += targetListType === 'ol'
          ? '<ol class="list-decimal pl-6 space-y-1.5 my-3">'
          : '<ul class="list-disc pl-6 space-y-1.5 my-3">';
        listType = targetListType;
      }
      
      const cleanContent = isBullet
        ? trimmed.replace(/^[\*\-]\s+/, '')
        : trimmed.replace(/^\d+\.\s+/, '');
      
      const indentClass = leadingSpaces >= 4 ? 'ml-8 list-[circle]' : leadingSpaces >= 2 ? 'ml-4 list-[circle]' : '';
      resultHtml += `<li class="break-keep ${indentClass}">${cleanContent}</li>`;
    } else {
      if (inList) {
        resultHtml += `</${listType}>`;
        inList = false;
      }
      if (trimmed) {
        resultHtml += `<p class="my-2 break-keep">${trimmed}</p>`;
      }
    }
  }

  if (inList) {
    resultHtml += `</${listType}>`;
  }
  if (inBlockquote) {
    resultHtml += '</blockquote>';
  }
  if (inTable) {
    resultHtml += '</table></div>';
  }

  return resultHtml
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const cleanUrl = url.startsWith('./') ? `book/${url.substring(2)}` : url;
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-[#D35400] hover:underline font-semibold">${text}</a>`;
    });
}

interface ChapterWithBlocks {
  id: string;
  title: string;
  category: string;
  blocks: MarkdownBlock[];
}

interface ReaderCanvasProps {
  chapters: ChapterWithBlocks[];
  activeBlockId: string;
  onSelectBlock: (id: string) => void;
  settings: ReaderSettings;
  theme: ReaderTheme;
  enableTTS: boolean;
}

export default function ReaderCanvas({
  chapters,
  activeBlockId,
  onSelectBlock,
  settings,
  theme,
  enableTTS
}: ReaderCanvasProps) {

  // Get custom font family class name
  const getFontFamilyClass = () => {
    switch (settings.fontStyle) {
      case 'serif':
        return 'font-serif';
      case 'sans':
        return 'font-sans';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-serif';
    }
  };

  // Get font size multiplier style object
  const getFontSizeStyle = (baseRem: number) => {
    return { fontSize: `${baseRem * settings.fontSize}rem`, lineHeight: `${baseRem * 1.6 * settings.fontSize}rem` };
  };

  return (
    <div className={`w-full max-w-2xl mx-auto px-6 py-10 transition-all ${getFontFamilyClass()}`} style={{ color: theme.text }}>
      {chapters.map((ch) => (
        <article
          key={ch.id}
          id={`chapter-container-${ch.id}`}
          data-chapter-id={ch.id}
          className="mb-20 border-b border-neutral-300/10 dark:border-neutral-700/10 pb-16 last:border-0 last:pb-0"
        >
          {/* Chapter header */}
          {ch.id !== 'title-page' && (
            <header className="mb-8 border-b border-neutral-200/50 dark:border-neutral-800/40 pb-6">
              {ch.category && (
                <span
                  style={{ color: theme.accent }}
                  className="font-sans text-xs font-extrabold tracking-widest uppercase block mb-1"
                >
                  {ch.category}
                </span>
              )}
              <h1
                id={`chapter-title-${ch.id}`}
                className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4"
                style={{ ...getFontSizeStyle(1.8) }}
              >
                {ch.title}
              </h1>
              <div
                className="w-12 h-1 rounded-full"
                style={{ backgroundColor: theme.accent, opacity: 0.3 }}
              />
            </header>
          )}

          {/* Styled text blocks list */}
          <section className="space-y-6 md:space-y-7">
            {ch.blocks.map((block) => {
              const isActive = activeBlockId === block.id;

              // Custom highlight element styles
              const blockStyle: React.CSSProperties = isActive ? {
                backgroundColor: theme.highlightBg,
                borderLeft: `4px solid ${theme.accent}`,
                paddingLeft: '1.25rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                marginLeft: '-1.25rem',
                marginRight: '-0.5rem',
                borderRadius: '0 0.75rem 0.75rem 0'
              } : {};

              // 1. HEADERS IN CONTENT
              if (block.type === 'header') {
                const isH1 = block.meta?.level === 1;
                if (isH1) {
                  if (ch.id !== 'title-page') return null;
                  return (
                    <h1
                      id={`block-node-${block.id}`}
                      key={block.id}
                      onClick={enableTTS ? () => onSelectBlock(block.id) : undefined}
                      className={`text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-center mt-12 mb-6 ${
                        enableTTS ? '' : 'select-text'
                      }`}
                      style={{
                        ...getFontSizeStyle(2.0),
                        ...blockStyle
                      }}
                    >
                      {block.text}
                    </h1>
                  );
                }

                const isH2 = block.meta?.level === 2;
                if (isH2 && ch.id === 'title-page') {
                  return (
                    <h2
                      id={`block-node-${block.id}`}
                      key={block.id}
                      onClick={enableTTS ? () => onSelectBlock(block.id) : undefined}
                      className={`text-xl md:text-2xl font-sans font-medium text-center text-neutral-600 dark:text-neutral-350 tracking-wide mt-4 mb-8 ${
                        enableTTS ? '' : 'select-text'
                      }`}
                      style={{
                        ...getFontSizeStyle(1.2),
                        ...blockStyle
                      }}
                    >
                      {block.text}
                    </h2>
                  );
                }

                return (
                  <h2
                    id={`block-node-${block.id}`}
                    key={block.id}
                    onClick={enableTTS ? () => onSelectBlock(block.id) : undefined}
                    className={`font-extrabold transition-all pt-4 ${
                      enableTTS ? 'cursor-pointer hover:text-[#D35400]' : 'select-text'
                    }`}
                    style={{
                      ...getFontSizeStyle(1.4),
                      ...blockStyle
                    }}
                  >
                    {block.text}
                  </h2>
                );
              }

              // 2. WARNING CALLOUTS (Priority Matrix Trap Box)
              if (block.type === 'warning') {
                return (
                  <div
                    id={`block-node-${block.id}`}
                    key={block.id}
                    onClick={enableTTS ? () => onSelectBlock(block.id) : undefined}
                    className={`my-6 p-5 bg-stone-100 dark:bg-stone-900 border-l-4 border-[#D35400] rounded-r-xl shadow-sm transition-all divide-y divide-neutral-200/50 dark:divide-neutral-800/50 ${
                      enableTTS ? 'cursor-pointer hover:shadow-md' : 'select-text'
                    }`}
                    style={{
                      boxShadow: settings.highcontrast ? '0 0 0 1px #8c7166' : '',
                      borderLeftColor: theme.accent,
                      ...blockStyle
                    }}
                  >
                    <div className="flex items-center gap-2.5 pb-2">
                      <AlertTriangle className="w-5 h-5 text-[#D35400] shrink-0" style={{ color: theme.accent }} />
                      <span className="font-sans text-xs uppercase tracking-wider font-extrabold text-neutral-800 dark:text-neutral-200">
                        {block.meta?.title || 'System Warning'}
                      </span>
                    </div>
                    {block.meta?.formula && (
                      <p className="font-serif italic font-semibold text-neutral-905 dark:text-white py-3 leading-relaxed" style={{ ...getFontSizeStyle(1.1) }}>
                        {block.meta.formula}
                      </p>
                    )}
                    {block.meta?.description && (
                      <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 pt-2 leading-relaxed">
                        {block.meta.description}
                      </p>
                    )}
                  </div>
                );
              }

              // 3. IMAGE MEDIA FIGURES
              if (block.type === 'image') {
                const isTitlePageCover = ch.id === 'title-page';
                return (
                  <figure
                    id={`block-node-${block.id}`}
                    key={block.id}
                    onClick={enableTTS ? () => onSelectBlock(block.id) : undefined}
                    className={`my-6 space-y-2 relative group ${
                      enableTTS ? 'cursor-pointer' : 'select-text'
                    } ${
                      isTitlePageCover ? 'max-w-[420px] mx-auto' : ''
                    }`}
                    style={blockStyle}
                  >
                    <div className={`relative overflow-hidden transition-all ${
                      isTitlePageCover
                        ? 'h-auto bg-transparent'
                        : 'rounded-2xl bg-neutral-200 dark:bg-neutral-850 shadow-md group-hover:shadow-lg h-52 md:h-64'
                    }`}>
                      <img
                        src={block.meta?.url}
                        alt={block.meta?.caption}
                        className={`w-full select-none transition-transform duration-500 group-hover:scale-101 ${
                          isTitlePageCover ? 'h-auto object-contain' : 'h-full object-cover'
                        }`}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback placeholder graphic if external source fails or goes offline
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-400';
                            placeholder.innerHTML = `
                              <svg class="w-12 h-12 mb-2 option-spin text-[#D35400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect width="18" height="18" x="3" y="3" rx="2" viewBox="0 0 24 24"></rect>
                                <circle cx="9" cy="9" r="2"></circle>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                              </svg>
                              <p class="font-sans text-xs font-semibold uppercase tracking-wider text-neutral-550 select-none">${block.meta?.caption || 'Dashboard Illustration'}</p>
                            `;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    </div>
                    {block.meta?.caption && !isTitlePageCover && (
                      <figcaption className="text-center font-sans text-xs text-neutral-500 dark:text-neutral-400 italic opacity-85">
                        {block.meta.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              // 4. COLUMN GRIDS (Trigger Points & Reality Check grids)
              if (block.type === 'grid') {
                return (
                  <div
                    id={`block-node-${block.id}`}
                    key={block.id}
                    onClick={enableTTS ? () => onSelectBlock(block.id) : undefined}
                    className={`grid grid-cols-1 md:grid-cols-2 gap-4 my-6 ${
                      enableTTS ? 'cursor-pointer' : 'select-text'
                    }`}
                    style={blockStyle}
                  >
                    {block.meta?.columns ? (
                      block.meta.columns.map((col: any, idx: number) => {
                        const isTriggerPoints = col.type === 'trigger-points';

                        return (
                          <div
                            key={idx}
                            className={`p-5 rounded-2xl border transition-all ${
                              isTriggerPoints
                                ? 'bg-[#FDF2F0] dark:bg-[#201010] border-[#e0c0b2]/40 dark:border-red-950/40 text-neutral-900 dark:text-neutral-100'
                                : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-150 dark:border-neutral-850 text-neutral-900 dark:text-neutral-100'
                            }`}
                            style={{
                              boxShadow: settings.highcontrast ? '0 0 0 1px #8c7166' : '0 2px 8px -3px rgba(0,0,0,0.04)'
                            }}
                          >
                            <h4 style={{ color: theme.accent }} className="font-sans text-[11px] font-extrabold uppercase tracking-widest block mb-3">
                              {col.title}
                            </h4>

                            {/* If triggering points, render list checklist */}
                            {isTriggerPoints && col.bullets && col.bullets.length > 0 ? (
                              <ul className="space-y-2 text-sm font-semibold text-neutral-805 dark:text-neutral-250 font-sans">
                                {col.bullets.map((b: string, bIdx: number) => (
                                  <li key={bIdx} className="flex items-center gap-2">
                                    <span className="text-amber-500">•</span>
                                    <span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="font-sans text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                {col.body}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="font-sans text-xs italic">Grid Content Configured</p>
                    )}
                  </div>
                );
              }

              // 5. STANDARD PARAGRAPHS
              const isAuthor = ch.id === 'title-page' && block.text.startsWith('By ');
              return (
                <div
                  id={`block-node-${block.id}`}
                  key={block.id}
                  onClick={enableTTS ? () => onSelectBlock(block.id) : undefined}
                  className={`transition-all leading-relaxed break-keep ${
                    enableTTS ? 'cursor-pointer hover:text-[#D35400]' : 'select-text'
                  } ${
                    isAuthor ? 'text-center text-neutral-500 dark:text-neutral-400 font-sans tracking-widest uppercase font-semibold text-sm mt-6 mb-12' : ''
                  }`}
                  style={{
                    ...getFontSizeStyle(isAuthor ? 0.95 : 1.1),
                    ...blockStyle
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdownToHTML(block.raw)
                  }}
                />
              );
            })}
          </section>
        </article>
      ))}
    </div>
  );
}
