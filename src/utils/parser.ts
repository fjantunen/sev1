import { MarkdownBlock } from '../types';

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let blockCounter = 0;

  const lines = markdown.split('\n');
  let currentGroup: string[] = [];

  const flushParagraph = () => {
    if (currentGroup.length === 0) return;
    const content = currentGroup.join('\n').trim();
    currentGroup = [];
    if (!content) return;

    blockCounter++;
    const id = `block-${blockCounter}`;

    // Detect Title (H1)
    if (content.startsWith('# ')) {
      const cleanText = content.replace(/^#\s+/, '').trim();
      blocks.push({
        id,
        type: 'header',
        text: cleanText,
        raw: content,
        meta: { level: 1 }
      });
      return;
    }

    // Detect Subtitle (H2)
    if (content.startsWith('## ')) {
      const cleanText = content.replace(/^##\s+/, '').trim();
      blocks.push({
        id,
        type: 'header',
        text: cleanText,
        raw: content,
        meta: { level: 2 }
      });
      return;
    }

    // Detect Images
    // Pattern: [image "url" "caption"]
    const imgRegex = /^\[image\s+"([^"]+)"\s+"([^"]+)"\]/;
    const imgMatch = content.match(imgRegex);
    if (imgMatch) {
      blocks.push({
        id,
        type: 'image',
        text: `Figure: ${imgMatch[2]}`,
        raw: content,
        meta: { url: imgMatch[1], caption: imgMatch[2] }
      });
      return;
    }

    // Plain Paragraph
    blocks.push({
      id,
      type: 'paragraph',
      text: content.replace(/\*\*|\*|__/g, ''), // clear bold/italic marks for clean speaking
      raw: content
    });
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Warning Block
    if (trimmed.startsWith('!!!warning')) {
      flushParagraph();
      // start of warning block
      const titleMatch = trimmed.match(/!!!warning\s+"([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : 'Attention';
      
      const warningLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('!!!')) {
        warningLines.push(lines[i]);
        i++;
      }
      
      const warningContent = warningLines.join('\n').trim();
      const splitContent = warningContent.split('\n');
      const formula = splitContent[0] || '';
      const description = splitContent.slice(1).join('\n').trim();

      blockCounter++;
      blocks.push({
        id: `block-${blockCounter}`,
        type: 'warning',
        text: `${title}. Formula: ${formula}. Note: ${description}`.replace(/\*\*|\*|__/g, ''),
        raw: line + '\n' + warningContent + '\n!!!',
        meta: { title, formula, description }
      });
      i++;
      continue;
    }

    // 2. Grid Block (Double Column / Trigger Points & Reality Check)
    if (trimmed.startsWith(':::grid')) {
      flushParagraph();
      const gridContentLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::grid-end') && lines[i].trim() !== ':::') {
        gridContentLines.push(lines[i]);
        i++;
      }
      
      const gridText = gridContentLines.join('\n');
      
      // Let's parse columns inside the grid content
      // Columns are delimited with :::classname "Title" and terminated with :::
      const colMatches = [...gridText.matchAll(/:::([a-zA-Z0-9-]+)\s+"([^"]+)"([\s\S]*?):::/g)];
      const columns = colMatches.map(m => {
        const type = m[1];
        const title = m[2];
        const body = m[3].trim();
        
        // Parse bullets
        const bullets = body.split('\n')
          .map(b => b.trim())
          .filter(b => b.startsWith('*') || b.startsWith('-'))
          .map(b => b.replace(/^[\*\-\s]+/, '').trim());

        return { type, title, body, bullets };
      });

      // If no regex match found, parse columns manually fallback
      if (columns.length === 0) {
        // Fallback or simple parse
      }

      // Assemble speech text
      let speechText = '';
      columns.forEach(col => {
        if (col.bullets && col.bullets.length > 0) {
          speechText += `${col.title}. ${col.bullets.join(', ')}. `;
        } else {
          speechText += `${col.title}: ${col.body}. `;
        }
      });

      blockCounter++;
      blocks.push({
        id: `block-${blockCounter}`,
        type: 'grid',
        text: speechText.replace(/\*\*|\*|__/g, '').trim(),
        raw: ':::grid\n' + gridText + '\n:::',
        meta: { columns }
      });
      i++;
      continue;
    }

    // Standard lines
    if (trimmed === '') {
      flushParagraph();
    } else {
      currentGroup.push(line);
    }
    i++;
  }
  flushParagraph();

  return blocks;
}
