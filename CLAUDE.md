# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run deploy` - Build and deploy to GitHub Pages

## Architecture Overview

This is a React-based canvas image creation application built with TypeScript, Vite, and state management via Jotai atoms. The app enables users to manipulate image and webcam blocks on a zoomable canvas with real-time streaming capabilities.

### Core Architecture Patterns

**State Management**: Uses Jotai atoms for global state, with a central `StateRefAtom` containing camera position, block data, selection state, and active streams. Block data is split between `BlockIdsAtom` (array of IDs) and `BlockMapAtom` (ID-to-block mapping).

**Block System**: Two main block types (`ImageBlockType` and `WebcamBlockType`) inherit from `BaseBlockType`. Blocks have position, size, rotation, z-index, crop settings, and blend modes. The rendering pipeline separates visual rendering (`BlockRender`) from UI interactions (`BlockUI`).

**Canvas Transformation**: The `Zoom` component implements a nested transform system where camera position and zoom level are applied to a container that holds all blocks. Camera state controls pan/zoom via CSS transforms.

**Input Handling**: Pointer events are handled through custom hooks in the `input/` directory, supporting block dragging, selection, cropping, and canvas panning. Uses a unified pointer event system with `useHandlePointerEvents`.

**Stream Management**: Webcam streams are managed through `activeStreamsAtom` with lifecycle management in `useStream`. Each stream has associated video elements and size tracking.

### Key Directories

- `src/input/` - All interaction handlers (drag, resize, crop, wheel, pointer events)
- `src/streams/` - WebRTC stream management and device handling
- `src/history/` - Undo/redo functionality
- `src/assets/fonts/` - Custom font files (DepartureMono)

### TypeScript Configuration

Uses strict TypeScript with separate configs for app (`tsconfig.app.json`) and Node.js (`tsconfig.node.json`). Vite handles bundling with React plugin support.

### Styling

TailwindCSS for styling with custom font integration. Uses CSS transforms for canvas manipulation and pointer-events control for interaction layers.