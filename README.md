# 🕌 Ilm Studio (عِلم ستوديو)

An advanced Islamic lecture study desktop application for Linux.

Built with **Electron**, **React**, **TypeScript**, **Chakra UI**, **SQLite** (`better-sqlite3`), **pdf.js**, **Howler.js**, and **TipTap**.

---

## ✨ Features (Phase 1 Implemented)

- **📄 PDF Viewer**: Integrated `pdf.js` with offline worker support, zoom controls, fit-to-width, and page navigation.
- **🎧 Audio Player**: `Howler.js` engine supporting variable speeds (`0.5x`–`2.0x`), 10s back/forward skip, volume slider, progress seeking, and timestamp bookmarking.
- **📚 Lecture Series & Pacing**: Organize lectures into structured series, track completion status, order, and progress.
- **✍️ Note-Taking**: TipTap rich text editor with headings, bold, italic, lists, and direct persistence linked to lectures.
- **💾 Local SQLite Database**: 100% offline database storing series, lectures, notes, tags, bookmarks, study sessions, and user settings.
- **📂 Hybrid File Import**: Support for importing MP3/WAV/OGG/M4A/FLAC audio and PDF files, with option to copy to managed library or reference directly.
- **🌙 Islamic Aesthetic & Theming**: Dark theme default with deep navy surface (`#16213e`, `#1a1a2e`), Islamic green (`#2d6a4f`), and gold accents (`#d4a843`), with Arabic font support (Amiri).

---

## 🚀 Getting Started

### Development Mode

To start the app in live development mode with hot reload:

```bash
npm start
```

### Packaging for Linux

To package the standalone Linux binary:

```bash
npm run package
```

The output will be generated in `out/ilm-studio-linux-x64/ilm-studio`.

To build distribution installers (`.deb`, `.rpm`, `.zip`):

```bash
npm run make
```

---

## 📁 Project Structure

```text
lecture-study/
├── assets/                  # App icons and graphics
├── src/
│   ├── main/                # Electron Main Process
│   │   ├── database/        # SQLite setup, tables, and CRUD operations
│   │   ├── ipc/             # IPC handlers for DB and file operations
│   │   ├── index.ts         # Main window creation and lifecycle
│   │   └── preload.ts       # Secure contextBridge API for the renderer
│   ├── renderer/            # React Renderer Process
│   │   ├── components/
│   │   │   ├── AudioPlayer/ # Howler-powered lecture audio player
│   │   │   ├── Layout/      # Sidebar, Main Content, View Switcher
│   │   │   ├── Library/     # Import Dialog (Audio/PDF)
│   │   │   ├── NoteEditor/  # TipTap rich text editor
│   │   │   └── PdfViewer/   # pdf.js PDF viewer
│   │   ├── stores/          # Zustand state management (app & player)
│   │   ├── theme/           # Chakra UI Islamic dark/light theme
│   │   ├── App.tsx          # Main application layout
│   │   └── index.tsx        # React entry point
│   └── shared/              # Shared TypeScript types & IPC contracts
├── forge.config.ts          # Electron Forge build & packaging configuration
├── webpack.main.config.ts   # Webpack configuration for Electron main
├── webpack.renderer.config.ts # Webpack configuration for Electron renderer
└── package.json
```

---

## 🔒 100% Offline & Private

Ilm Studio is designed to function entirely offline. No cloud account, no telemetry, and all lecture notes and media stay locally on your device.
