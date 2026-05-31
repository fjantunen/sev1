export interface ReaderTheme {
  id: string;
  name: string;
  bg: string;
  text: string;
  variantText: string;
  accent: string;
  accentText: string;
  cardBg: string;
  borderColor: string;
  isDark: boolean;
  highlightBg: string; // for block/sentence highlight
}

export type FontStyle = 'serif' | 'sans' | 'mono';

export interface Chapter {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  category: string;
  markdown: string;
  blocks?: MarkdownBlock[];
}

export interface ReaderSettings {
  themeId: string;
  fontStyle: FontStyle;
  fontSize: number; // multiplier, e.g., 0.8, 1.0, 1.2, 1.4, 1.6
  speed: number; // speed multiplier, e.g., 0.75, 1.0, 1.25, 1.5, 2.0
  autoScroll: boolean;
  highcontrast: boolean;
}

export interface TableOfContentsSection {
  title: string;
  chapters: {
    id: string;
    num: string;
    title: string;
    subtitle: string;
    icon: string;
  }[];
}

export interface MarkdownBlock {
  id: string;
  type: 'paragraph' | 'header'| 'warning' | 'image' | 'grid' | 'unknown';
  text: string;
  // Specific parsed fields
  raw: string;
  meta?: any; // parsed variables
}
