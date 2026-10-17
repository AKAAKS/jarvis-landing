# JARVIS — landing page

Clean product landing page for the JARVIS personal assistant. Built with **React + Vite**.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/  (static, deploy anywhere)
```

## Edit

All copy and links live at the top of **`src/App.jsx`**:

- `LINKS` — GitHub + docs URLs (currently `'#'` placeholders; set them when the repo is public)
- `FEATURES`, `STEPS` — the feature cards and the "how it works" steps
- The hero headline / subtext are inline in the `HERO` section

Accent color and light/dark theme are driven by CSS variables at the top of
**`src/styles.css`** (`--accent`).

Deploy `dist/` to Vercel / Netlify / GitHub Pages. For GitHub Pages under a
sub-path, set `base: '/<repo>/'` in `vite.config.js`.
