# SEV1: The Art of Incident Command – E-Reader Framework

Welcome to the interactive web companion for **"SEV1: The Art of Incident Command"**, a comprehensive guide to mastering incident management, operations, and technical leadership during high-pressure outages.

This project is built as a premium e-reader framework using React, Vite, TypeScript, and Tailwind CSS. It is equipped with advanced reading aids, modern typography, responsive sidebars, and an integrated **Text-To-Speech (TTS)** engine.

---

## 📖 About the Book

**"SEV1: The Art of Incident Command"** details key principles, workflows, and reality checks for incident commanders and engineers. It covers:
- **Part I: Before the Incident** – Building observability, creating runbooks, and preparing the organization.
- **Part II: During the Incident** – Declaring severity, setting up coordination channels, managing communication loops, and applying the incident command structure.
- **Part III: After the Incident** – Conducting blameless post-mortems, tracking follow-up actions, and preventing recurrence.

---

## ✨ Features of the E-Reader

This e-reader has been refined to provide an immersive, state-of-the-art reading experience:

- **Premium Typography & Dark Mode:** Curated typography (Literata serif, Hanken Grotesk sans, JetBrains Mono) with automatic dark mode matching system preferences, high-contrast, and adjustable font styling.
- **Responsive Table of Contents Sidebar:** A persistent table of contents drawer on mobile and tablet screens that converts into a native desktop sidebar (`md:pl-80`) for seamless multi-chapter navigation.
- **Text-To-Speech (TTS) Narration Engine:**
  - **Dynamic Audio Progress:** A pinned bottom player bar showing playback controls, a scrub-progress indicator, and cycling speed adjustment buttons (`1.0x` to `2.0x`).
  - **Context-Aware Highlights:** Active block tracking automatically highlights the current paragraph being read and scrolls it into view.
  - **Smart Filtering:** Emojis are skipped during reading, preventing voice synthesis systems from reading out pictorial descriptions.
- **Dual Reading/Selection Mode:**
  - **TTS Disabled Mode:** Toggling the reader's voice button hides the audio interface, removes interactive visual overlays, and enables standard browser text selection/copying across all chapters.
  - **TTS Enabled Mode:** Employs a custom click-to-narrate overlay on paragraphs and blocks with `select-none` to prevent accidental text highlights while selecting what to read.
- **1:1 Markdown Rendering:** Handles complex markdown tables, inline links, nested bullet lists (with GitHub-standard spacing/indentation), code blocks, blockquotes, and specialized layout components.

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM**

### Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Using this Framework for Other Works

You can adapt this framework to package and read other books, technical docs, or manuals. The engine relies on a single source markdown file and automatically handles the parsing and compilation during development and build.

### 1. The Book Source file
Write your content in the **`book/index.md`** file.
- The file starts with a standard Jekyll frontmatter header (bounded by `---` lines).
- The **Title Page** is defined as the block of content between the frontmatter block and the first `### ` header.
- Each **Chapter** is defined by a `### ` level header. Subheadings inside chapters should be written using `###`, `####`, or `#####` hashes (which are automatically translated to `##` and `###` headers in the reader to avoid layout clashes).
- Chapters are grouped under **Categories** (such as Part I, II, III, Front Matter, or Back Matter) by placing a `## PART ...` separator in the markdown before those chapters.

### 2. Specialized Components
The parser translates custom markdown block constructs into rich layout components:

#### A. Warning / Key Principle Boxes
To render a styled block highlighting a warning, trap, or equation, wrap it in a warning block starting with `!!!warning "Title"` and ending with `!!!`:
```markdown
!!!warning "Observed Failure Trap"
D = M * C^2
Observability is a square of your team's familiarity with the codebase.
!!!
```

#### B. Multi-Column Grids
To display side-by-side columns (such as comparison lists or "Trigger Points vs. Reality Check" sidebars), wrap them in a grid block:
```markdown
:::grid
:::trigger-points "Trigger Points"
* Outage exceeds 15 minutes of user disruption.
* Core payment service returns >5% HTTP 500 errors.
:::
:::reality-check "Reality Check"
Engineers often delay declaring a SEV1 due to fear of false alarms, wasting precious containment time.
:::
:::grid-end
```

#### C. Embedded Images
To embed full-width figures or illustrations, use the custom bracket format:
```markdown
[image "/book/assets/observability-matrix.png" "Observability Matrix Diagram"]
```
*(Store images in the `/public/book/assets/` directory so they are served correctly).*

### 3. Automatic Compilation
The build system is set up to automatically compile your book during Vite loading:
- `scripts/parse-book-vite.ts` parses `book/index.md` and generates `src/chaptersData.ts` on file changes.
- The React application imports `src/chaptersData.ts` to hydrate the reading canvas and table of contents automatically.
- To trigger a manual rebuild of the book database:
  ```bash
  npx tsx scripts/parse-book.ts
  ```

Latest deployment: 2026-05-30T19:26:31-04:00
