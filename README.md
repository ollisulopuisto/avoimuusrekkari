# AvoimuusApp

A standalone Mac application to explore the Finnish Transparency Register (**Avoimuusrekisteri**).

**Version**: 0.1.0
**Release**: Alpha

## Overview

This application provides a user-friendly interface to browse organizations and activities from the Transparency Register. It is built with React and heavily optimized for the macOS experience using Tauri.

## Features

- **Browse Organizations**: View registered entities and their details.
- **Activity Feed**: Real-time notifications of registry activities.
- **Native Mac App**: Runs as a standalone application, not just a browser tab.

## for Developers

### Prerequisites
- Node.js (v20+)
- Rust (for compiling the native shell)

### Running Locally
To start the development environment:

```bash
npm run tauri dev
```

This will launch the native application window with hot-reloading enabled.

### Building for Release
To build a standalone `.dmg` installer for distribution:

```bash
npm run tauri build
```

The output file will be located at:
`src-tauri/target/release/bundle/dmg/avoimuus-app_0.1.0_x64.dmg`

> **Note**: The app is not notarized by Apple. To open it on another machine, Right-Click the app and select "Open" to bypass the security warning.
