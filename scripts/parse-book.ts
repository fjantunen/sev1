import * as fs from 'fs';
import * as path from 'path';

const BOOK_PATH = path.resolve('book/index.md');
const OUTPUT_PATH = path.resolve('src/chaptersData.ts');

function cleanEmojis(str: string): string {
  return str.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
}

interface Chapter {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  category: string;
  markdown: string;
}

function parseBook() {
  const content = fs.readFileSync(BOOK_PATH, 'utf-8');
  const lines = content.split('\n');

  // Find Jekyll frontmatter and locate where content starts
  let startIndex = 0;
  let yamlDelimCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      yamlDelimCount++;
      if (yamlDelimCount === 2) {
        startIndex = i + 1;
        break;
      }
    }
  }

  // First, isolate Title Page content (everything from startIndex until first ### header)
  let firstHeaderIndex = -1;
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].trim().startsWith('### ')) {
      firstHeaderIndex = i;
      break;
    }
  }

  if (firstHeaderIndex === -1) {
    throw new Error('Could not find first ### header in index.md');
  }

  // Extract Title Page markdown
  const titlePageLines = lines.slice(startIndex, firstHeaderIndex)
    .map(line => {
      const trimmed = line.trim();
      // Remove Jekyll-specific lines
      if (trimmed.includes('Download the PDF version') || 
          trimmed.includes('Recommended for Safari iOS users') ||
          trimmed.startsWith('<link')) {
        return '';
      }
      // Replace img tag with [image "url" "caption"]
      if (trimmed.startsWith('<img') && trimmed.includes('src=')) {
        const srcMatch = trimmed.match(/src=['"]([^'"]+)['"]/);
        const altMatch = trimmed.match(/alt=['"]([^'"]+)['"]/);
        const src = srcMatch ? srcMatch[1] : '';
        const alt = altMatch ? altMatch[1] : 'SEV1 Cover';
        // Prefix with book/ if it is relative
        const cleanSrc = src.startsWith('assets/') ? `book/${src}` : src;
        return `[image "${cleanSrc}" "${alt}"]`;
      }
      // Convert subheading hashes for e-reader layout
      if (trimmed.startsWith('### ')) {
        return line.replace(/^\s*###\s+/, '## ');
      } else if (trimmed.startsWith('#### ')) {
        return line.replace(/^\s*####\s+/, '## ');
      } else if (trimmed.startsWith('##### ')) {
        return line.replace(/^\s*#####\s+/, '### ');
      }
      return line;
    });

  const titlePageMarkdown = titlePageLines
    .filter(line => line.trim() !== '')
    .join('\n\n')
    .trim();

  const chapters: Chapter[] = [
    {
      id: 'title-page',
      num: '',
      title: 'Title Page',
      subtitle: 'The Art of Incident Command',
      category: 'Front Matter',
      markdown: titlePageMarkdown
    }
  ];

  let currentCategory = 'Front Matter';
  let currentChapter: {
    id: string;
    num: string;
    title: string;
    subtitle: string;
    category: string;
    lines: string[];
  } | null = null;

  for (let i = firstHeaderIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for category transitions (## PART ...)
    if (trimmed.startsWith('## ')) {
      const partText = trimmed.replace(/^##\s+/, '').trim();
      if (partText.toUpperCase().includes('PART I:')) {
        currentCategory = 'Part I: Before the Incident';
      } else if (partText.toUpperCase().includes('PART II:')) {
        currentCategory = 'Part II: During the Incident';
      } else if (partText.toUpperCase().includes('PART III:')) {
        currentCategory = 'Part III: After the Incident';
      }
      // Skip pushing part header lines to chapter markdown, as category heading is rendered by ReaderCanvas
      continue;
    }

    // Check if line represents a true chapter boundary
    let isChapterHeader = false;
    let isNumbered = false;
    let num = '';
    let restText = '';
    let isUnnumbered = false;
    let headerText = '';

    if (trimmed.startsWith('### ')) {
      headerText = trimmed.replace(/^###\s+/, '').trim();
      const numMatch = headerText.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        isChapterHeader = true;
        isNumbered = true;
        num = numMatch[1];
        restText = numMatch[2].trim();
      } else {
        const lowerText = headerText.toLowerCase();
        if (lowerText.includes('acknowledgement') ||
            lowerText.includes('foreword') ||
            lowerText === 'conclusion' ||
            lowerText.includes('the journey continues') ||
            lowerText.includes('why this book') ||
            lowerText.includes('legal disclaimer') ||
            lowerText.includes('copyright page') ||
            lowerText.includes('table of contents')) {
          isChapterHeader = true;
          isUnnumbered = true;
        }
      }
    }

    if (isChapterHeader) {
      // Save active chapter if we have one
      if (currentChapter) {
        chapters.push({
          id: currentChapter.id,
          num: currentChapter.num,
          title: currentChapter.title,
          subtitle: currentChapter.subtitle,
          category: currentChapter.category,
          markdown: currentChapter.lines.join('\n').trim()
        });
      }

      if (isNumbered) {
        const subtitle = restText;
        const title = `${num}. ${cleanEmojis(restText)}`;
        currentChapter = {
          id: `chapter-${num}`,
          num,
          title,
          subtitle,
          category: currentCategory,
          lines: []
        };
      } else if (isUnnumbered) {
        // Special unnumbered sections
        let id = '';
        let title = '';
        let subtitle = '';
        let category = currentCategory;

        if (headerText.toLowerCase().includes('acknowledgement')) {
          id = 'acknowledgements';
          title = 'Acknowledgements';
          subtitle = headerText;
          category = 'Front Matter';
        } else if (headerText.toLowerCase().includes('foreword')) {
          id = 'foreword';
          title = 'Foreword';
          subtitle = headerText;
          category = 'Front Matter';
        } else if (headerText.toLowerCase() === 'conclusion') {
          id = 'conclusion';
          title = 'Conclusion';
          subtitle = headerText;
          category = 'Back Matter';
        } else if (headerText.toLowerCase().includes('the journey continues')) {
          id = 'journey-continues';
          title = 'The Journey Continues';
          const subMatch = headerText.match(/The Journey Continues:\s*(.*)/i);
          subtitle = subMatch ? subMatch[1] : headerText;
          category = 'Back Matter';
        } else if (headerText.toLowerCase().includes('why this book')) {
          id = 'why-this-book';
          title = 'Why This Book?';
          subtitle = 'Why This Book?';
          category = 'Front Matter';
        } else if (headerText.toLowerCase().includes('legal disclaimer')) {
          id = 'legal-disclaimer';
          title = 'Legal Disclaimer';
          subtitle = 'Legal Disclaimer';
          category = 'Front Matter';
        } else if (headerText.toLowerCase().includes('copyright page')) {
          id = 'copyright-page';
          title = 'Copyright Page';
          subtitle = 'Copyright Page';
          category = 'Front Matter';
        } else if (headerText.toLowerCase().includes('table of contents')) {
          currentChapter = null;
          continue;
        }

        if (id) {
          currentChapter = {
            id,
            num: '',
            title,
            subtitle,
            category,
            lines: []
          };
        }
      }
      continue;
    }

    // Process heading levels within chapters to format subheadings cleanly as ##
    let processedLine = line;
    if (trimmed.startsWith('### ')) {
      processedLine = line.replace(/^\s*###\s+/, '## ');
    } else if (trimmed.startsWith('#### ')) {
      processedLine = line.replace(/^\s*####\s+/, '## ');
    } else if (trimmed.startsWith('##### ')) {
      processedLine = line.replace(/^\s*#####\s+/, '### ');
    }

    // Accumulate lines for current chapter if one is active
    if (currentChapter) {
      currentChapter.lines.push(processedLine);
    }
  }

  // Save the final chapter
  if (currentChapter) {
    chapters.push({
      id: currentChapter.id,
      num: currentChapter.num,
      title: currentChapter.title,
      subtitle: currentChapter.subtitle,
      category: currentChapter.category,
      markdown: currentChapter.lines.join('\n').trim()
    });
  }

  // Write to src/chaptersData.ts
  const outputContent = `import { Chapter } from './types';

export const DEFAULT_CHAPTERS: Chapter[] = ${JSON.stringify(chapters, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, outputContent, 'utf-8');
  console.log(`Parsed ${chapters.length} chapters successfully and wrote to ${OUTPUT_PATH}`);
}

parseBook();
