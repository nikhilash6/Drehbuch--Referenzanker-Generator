# 🎬 Single-Line Video Prompt Engine & Screenplay Generator

> **Professional Dramaturgical Screenplay Studio & Single-Line Prompt Engine**  
> Optimized for **MiniMax H3**, **Maestro 2.1.6**, **Kling AI**, and **Runway Gen-3**.

---

## 🌟 Overview

The **Single-Line Video Prompt Engine** is a high-precision, production-grade application designed for filmmakers, real estate marketers, architects, and content creators. It turns raw bullet points, concept ideas, and reference images into dramaturgically structured video screenplays broken down into contiguous timecoded windows (e.g. **14.000 seconds per window**).

It features a strict **Single-Line Prompt Presser** (0 line breaks per window) to guarantee compatibility with video generation models that fail or corrupt state when receiving multi-line inputs.

---

## 🚀 Key Features

### 1. 📐 Strict Single-Line Window Pressing (0 Line Breaks)
- Every generated window prompt is formatted into **exactly 1 line** of text (0 line breaks).
- Includes character limits, line count validation indicators, and real-time syntax checking.
- Integrates contiguous timecodes (e.g. `TIMECODE 00:00.000 to 00:14.000`).

### 2. 🧠 Local LM Studio Integration (Private Vision & Text AI)
- Connects directly to local **LM Studio** instances (`http://localhost:1234/v1/chat/completions`) via server proxy.
- Fully private: No cloud API keys required for local processing.
- Executes multi-task visual reference analysis for uploaded images (persons, companion pets, architectural facades, floorplans, props).

### 3. 🗺️ Multimodal Floorplan & Architectural Layout Analysis
- Reads architectural blueprints and floorplan drawings (`PNG`, `JPG`, `WebP`).
- Extracts room axes, entrance foyers, kitchen island locations, and sightlines.
- Translates spatial directions (*"walk from the foyer along the sightline into the kitchen"*) into continuous camera moves (`Steadicam dolly-in along sightline...`).

### 4. 🏷️ Identity & Character Anchoring (`compactPromptAnchor`)
- Locks character features (hair, eyes, age, clothing, facial structure) and prop details using **Maestro 2.1.6** binding tags (`@Subject1_...`, `@Building1_...`, `@Object1_...`, `@Logo1_...`).
- Prevents identity cross-bleeding and character cloning across multi-window video sequences.
- Supports custom outfits and specific role assignments (e.g., custom costumes, real estate agents, resilience coaches with companion dogs).

### 5. 👆 Interactive 1-Click Reference Chips & Bullet-Point Clicker
- Readily extracts all active project references and offers **1-click insert chips** directly above the screenplay text editor.
- Click to insert formatted references into bullet points (e.g. `+ Bauherrin (<Subject 1>)`, `+ Musterhaus (<Building 1>)`).
- Built-in scenario presets (e.g. *Resilience Coaching in the Mountain Forest*, *Floorplan-Guided Kitchen Walkthrough*, *Yacht & Pier Voyage*, *Penthouse Smart Home*).

### 6. 🌐 Human-Readable German Prompt Breakdown ("Verständliches Deutsch")
- Provides a **1-click German breakdown box** for every technical single-line English prompt.
- Clearly details scene action, camera motion, spoken dialogue, 100mm macro close-ups, acoustic soundscapes, and Call-to-Action claims.

### 7. 🌍 Bilingual GUI (German & English)
- Full internationalization with persistent language switcher (`DE` / `EN`) in the sidebar.
- Dynamically translates all UI tabs, buttons, inspectors, and prompt templates.

---

## 👥 Supporters & Sponsors

We proudly highlight our project supporters and vision partners:

- 🧙‍♂️ **AI Wizards**: [https://ai-wizards.de/](https://ai-wizards.de/)  
  *Pioneering AI automation, workflow optimization, and generative AI solutions.*

- 👨‍💻 **Johannes Wobus**: [https://johannes-wobus.de/](https://johannes-wobus.de/)  
  *Digital strategy, software architecture, and innovative media engineering.*

---

## 🛠️ Architecture & Project Structure

```text
├── src/
│   ├── components/
│   │   ├── DrehbuchKonfigurator.tsx  # Main Screenplay Studio & 1-Click Reference Clicker
│   │   ├── ReferenceManager.tsx      # Multimodal Reference & LM Studio Task Manager
│   │   ├── ScreenplayGenerator.tsx   # Card-Based Shot Breakdown & Prompt Exporter
│   │   ├── Sidebar.tsx               # Navigation, Sponsor Links & Language Switcher
│   │   ├── Header.tsx                # App Header & System Status Bar
│   │   └── drehbuch/                 # Target Audience & Reference sub-components
│   ├── utils/
│   │   ├── windowPromptFormatter.ts  # Single-Line Prompt Presser & German Prompt Translator
│   │   ├── anchorParser.ts           # Multimodal Anchor Parser (Persons, Buildings, Floorplans)
│   │   ├── i18n.ts                   # Internationalization (DE / EN) Translation System
│   │   ├── targetAudienceCatalog.ts  # Target Audience Color & Sound Profiles
│   │   └── promptCatalog.ts          # Prompt Template Library & LocalStorage Persistence
│   ├── App.tsx                       # Main Application Shell & Task Runner
│   └── types.ts                      # Shared TypeScript Interfaces & Enums
├── server.ts                         # Express Backend Server & LM Studio Proxy Gateway
├── metadata.json                     # Applet Metadata & Capabilities
└── package.json                      # Project Dependencies & Scripts
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js (v18+ recommended)
- Optional: Local [LM Studio](https://lmstudio.ai/) running with local server enabled on port `1234`.

### 2. Development Setup
```bash
# Install dependencies
npm install

# Start the dev server (runs on port 3000)
npm run dev
```

### 3. Production Build
```bash
# Build static assets & bundle server
npm run build

# Start production server
npm start
```

---

## 📋 Recommended Workflow

1. **Upload References (Step 1)**:
   - Drag & drop images of people, companion pets, buildings, architectural floorplans, or props into the **Reference Manager**.
   - Click **"Send All Tasks to LM Studio"** to extract vision anchors automatically.

2. **Configure Story & Target Audience (Step 2)**:
   - Choose your target audience (e.g., *Familien & Bauherren*, *Luxus-Architektur*, *Wellness & Resilienz*).
   - Use the **1-Click Reference Chips** to insert your references into the Stichpunkte editor.

3. **Generate & Press Single-Line Windows (Step 3)**:
   - Click **"In Single-Line Windows pressen"**.
   - Review each 1-line prompt, verify line-break count (strictly 0), and expand the **"Verständliches Deutsch"** card to verify scene content.
   - Copy prompts directly into **MiniMax H3** or **Maestro**.

---

## 🗺️ Roadmap & TODOs

- [x] **Strict Single-Line Prompt Pressing (0 line breaks per window)**
- [x] **LM Studio Multimodal Vision Proxy & Task Pipeline**
- [x] **Floorplan & Architectural Sightline Analysis (`floorplan` category)**
- [x] **1-Click Reference Insertion Chips in Stichpunkte Editor**
- [x] **Human-Readable German Prompt Breakdown ("Verständliches Deutsch")**
- [x] **Bilingual GUI (German / English) with Persistent Toggle**
- [x] **Sponsor & Supporter Integration (AI Wizards & Johannes Wobus)**
- [ ] **Direct API Integration**: One-click batch submission to MiniMax H3 / Kling API endpoints.
- [ ] **Audio & Voiceover Generator**: Automatic TTS dialogue generation per window.
- [ ] **DaVinci Resolve / Final Cut Pro XML Export**: Export timeline markers and timecode windows.
- [ ] **3D Floorplan Visualizer**: Interactive 2D/3D preview of room camera paths.

---

## Samples
https://www.instagram.com/mo_ment_e/reel/DdJA7X-iwLU/
https://www.instagram.com/mo_ment_e/reel/DdFBT2BCR8O/
https://civitai.red/posts/31028429

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
