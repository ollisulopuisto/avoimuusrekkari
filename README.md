# AvoimuusExplorer

A standalone Mac application to explore the Finnish Transparency Register (**Avoimuusrekisteri**).

**Version**: 0.3.0  
**Release**: Alpha

## Overview

This application provides a user-friendly interface to browse organizations and lobbying activities from the Finnish Transparency Register. It is fully self-contained — no external server required.

## Features

- **Browse Organizations**: View registered entities and their details.
- **Activity Feed**: Explore lobbying activity notifications with search and filtering.
- **Native Mac App**: Runs as a standalone application with embedded API proxy.
- **Offline-capable**: The app fetches data directly from the official API, no server setup needed.

## Download

Download the latest `.dmg` from [Releases](https://github.com/ollisulopuisto/avoimuusrekkari/releases).

> **Note**: The app is not notarized by Apple. To open it, Right-Click the app and select "Open" to bypass the security warning.

## For Developers

### Prerequisites
- Node.js (v20+)
- Rust (for compiling the native shell)

### Running Locally

```bash
npm install
npm run tauri dev
```

This launches the native application window with hot-reloading enabled. In dev mode, the Vite proxy handles API requests.

### Building for Release

```bash
npm run tauri build
```

Output files:
- `src-tauri/target/release/bundle/macos/avoimuus-app.app`
- `src-tauri/target/release/bundle/dmg/avoimuus-app_0.3.0_x64.dmg`

### Architecture

The app uses **Tauri** with an embedded Rust backend that proxies requests to the official API (`public.api.avoimuusrekisteri.fi`). This allows distribution as a single binary without requiring users to set up any backend services.

```
┌─────────────────────────────────────────┐
│           Tauri Application             │
├─────────────────────────────────────────┤
│  React Frontend (TypeScript)            │
│    └── invoke() ──────────────────┐     │
├───────────────────────────────────┼─────┤
│  Rust Backend (reqwest)           │     │
│    └── HTTP GET ──────────────────┼──►  │ public.api.avoimuusrekisteri.fi
└─────────────────────────────────────────┘
```
