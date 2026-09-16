# 🎬 Single-Line Video Prompt Engine & Screenplay Generator `v1.0.0`

> **Version 1.0.0 (Release 1.0)**  
> **Professional Dramaturgical Screenplay Studio & Single-Line Prompt Engine**  
> Optimized for **MiniMax H3**, **Maestro 2.1.6**, **Kling AI**, and **Runway Gen-3**.

---

## 🌟 Overview & Reference / Video Inquiries

The **Single-Line Video Prompt Engine (v1.0.0)** is a high-precision production environment designed for filmmakers, content creators, architects, and AI video producers. It transforms raw bullet points, dramaturgical concepts, and visual references into contiguous, timecoded video windows (e.g. **14.000 seconds per window**, exactly 56s across 4 windows) with zero line breaks.

### 📸 Video Showcase & Direct Contact
- 🎥 **Instagram Showcase & Portfolio**: [https://www.instagram.com/mo_ment_e](https://www.instagram.com/mo_ment_e) (`@mo_ment_e`)
- 💬 **Video Inquiries & Collaborations**:  
  *Need custom AI video productions, architectural spatial-axis walkthroughs, or prompt engineering for your projects? Feel free to send a **Direct Message (DM) on Instagram** anytime to [@mo_ment_e](https://www.instagram.com/mo_ment_e)!*

---

## 🏷️ Versioning

- **`v1.0.0` (Current Release - 1.0)**
  - Full Single-Line Prompt Engine featuring a strict zero-line-break presser.
  - Multi-Task LM Studio Vision Pipeline (Port 1234) for private local reference and blueprint analysis.
  - Floorplan & Spatial Axis Director with 4-station tour choreography ($W_1$ to $W_4$), optical lens profiles, and timecode sync.
  - Synchronized Reference Manager with identity anchors (`<Subject 1..n>`, `<Building 1..n>`, `<Object 1..n>`, `<Logo 1>`).
  - Multi-format timeline exports (.edl, .fcpxml, .csv, .md) for DaVinci Resolve and Final Cut Pro.
  - Complete bilingual user interface (English & German).

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
- Click to insert formatted references into bullet points (e.g. `+ Client (<Subject 1>)`, `+ Model Home (<Building 1>)`).
- Built-in scenario presets (e.g. *Resilience Coaching in the Mountain Forest*, *Floorplan-Guided Kitchen Walkthrough*, *Yacht & Pier Voyage*, *Penthouse Smart Home*).

### 6. 🌐 Human-Readable Prompt Breakdown ("Plain Explanations")
- Provides a **1-click German / English breakdown box** for every technical single-line prompt.
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
│   │   ├── FloorplanDirectorView.tsx # Floorplan & 4-Station Spatial Axis Director
│   │   ├── ReferenceManager.tsx      # Multimodal Reference & LM Studio Task Manager
│   │   ├── ScreenplayGenerator.tsx   # Card-Based Shot Breakdown & Prompt Exporter
│   │   ├── Sidebar.tsx               # Navigation, Sponsor Links & Language Switcher
│   │   ├── Header.tsx                # App Header & System Status Bar
│   │   └── drehbuch/                 # Target Audience, Timeline Export & Reference sub-components
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
   - Choose your target audience (e.g., *Families & Builders*, *Luxury Architecture*, *Wellness & Resilience*).
   - Use the **1-Click Reference Chips** to insert your references into the bullet points editor.

3. **Generate & Press Single-Line Windows (Step 3)**:
   - Click **"Press into Single-Line Windows"**.
   - Review each 1-line prompt, verify line-break count (strictly 0), and expand the prompt breakdown card to verify scene content.
   - Copy prompts directly into **MiniMax H3**, **Maestro**, or **Kling AI**.

---

## 🗺️ Roadmap & Implemented Milestones

- [x] **Strict Single-Line Prompt Pressing (0 line breaks per window)**
- [x] **LM Studio Multimodal Vision Proxy & Task Pipeline**
- [x] **Floorplan & Architectural Sightline Analysis (`floorplan` category)**
- [x] **1-Click Reference Insertion Chips in Bullet Points Editor**
- [x] **Human-Readable Prompt Breakdown Card**
- [x] **Bilingual GUI (German / English) with Persistent Toggle**
- [x] **Sponsor & Supporter Integration (AI Wizards & Johannes Wobus)**
- [x] **DaVinci Resolve / Final Cut Pro XML Export**: Export timeline markers and timecode windows (.edl, .fcpxml, .csv, .md).
- [x] **Floorplan & Spatial Axis Director**: Interactive 2D layout with 4 room stations, camera sightlines, target audience styling, and 1-click sync to screenplay.
- [ ] **Direct API Integration**: One-click batch submission to MiniMax H3 / Kling API endpoints.
- [ ] **Audio & Voiceover Generator**: Automatic TTS dialogue generation per window.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
