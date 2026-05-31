# SEV1 E‑Reader Framework

This repository ships a **premium React/Vite e‑reader** that can be reused to publish any markdown‑based book.

## How to create a new book
1. **Add a source folder**
   ```bash
   mkdir -p book && echo "---\ntitle: My New Book\n---\n" > book/index.md
   ```
   - `book/index.md` is the single markdown entry point.
   - Place any images in `book/assets/` and reference them with `![alt](book/assets/your‑image.png)`.
2. **Run the parser** (the repo ships scripts that convert the markdown into a TypeScript data file used by the app):
   ```bash
   npx tsx scripts/parse-book.ts   # one‑off generation
   # or, during development, the Vite plugin watches `book/` and regenerates automatically.
   ```
3. **Develop locally**
   ```bash
   npm install
   npm run dev    # http://localhost:3000
   ```
4. **Build for deployment**
   ```bash
   npm run build   # outputs to `dist/`
   ```
5. **Deploy to GitHub Pages**
   - The `new` branch already contains a PR that moves the built `dist/` contents to the repository root. Merge that PR and set the **Pages source** to the `new` branch (root).
   - Future releases can be published by pushing a new commit to `new` (the workflow is the same as step 4).

## Removing the example book
The original example book lives in the `book/` directory and its generated assets in `src/`, `dist/`, and `public/`. Those have been removed in this PR so you can start fresh.

---
*This README was generated automatically to help you bootstrap new books using the existing framework.*
