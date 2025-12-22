# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview
Digital humanities web application for narratological analysis of Mark's Gospel, focusing on the Holy Spirit as a background character. Uses vanilla JavaScript with D3.js visualizations and AI-powered text analysis.

## Development Commands
- **Start development server**: `python -m http.server 8000` or `npm run dev`
- **Build**: No build process needed - static files ready for deployment (`npm run build`)
- **Deploy**: Deploy to GitHub Pages using gh-pages branch (`npm run deploy`)

## Architecture & Data Flow
- **Data Source**: `greek-nt.conll` file with linguistic annotations
- **Parser**: `js/data/conll-parser.js` processes CONLL data into structured format
- **Global State**: Uses singleton pattern - `window.conllParser`, `window.apiClient`, `window.narratologyApp`
- **Component Communication**: Via window object and direct method calls
- **Script Loading Order**: Critical - constants → helpers → api-client → conll-parser → components → app

## Key Non-Obvious Patterns

### Character Name Resolution
- Greek character variants mapped in `js/data/conll-parser.js` (lines 136-159)
- Base names stored in `getBaseCharacterName()` method (lines 207-228)
- Holy Spirit has multiple variants: 'Πνευμα', 'Πνευματος', 'Αγιον', 'Αγιου'

### Attentional Cue Detection
- Five cue types defined in `js/utils/constants.js` (lines 17-23)
- Pattern matching in `identifyNarrativeElements()` (lines 233-283 in conll-parser.js)
- AI-powered detection via OpenWebUI API in `js/utils/api-client.js`

### Component Architecture
- All components follow same constructor pattern: `(containerId, data)`
- Update method signature: `update(chapterNumber)` for all visualizations
- Components export to both module and window global for flexibility

### API Integration
- User-provided API keys stored in localStorage under 'openwebui_api_key'
- Secure setup via app's "API Setup" button or environment variable for CMD testing
- Graceful degradation - app works without API, enhanced with it
- Error handling with user-friendly notifications

## Code Style Conventions
- **ES6 Classes** for all components
- **JSDoc comments** for all public methods
- **Constants** in `UPPER_SNAKE_CASE`
- **Event handlers** use arrow functions for consistent `this` binding
- **Error handling** with try/catch and user notifications

## File Organization
```
js/
├── utils/           # Helper functions and utilities
├── data/            # Data processing (CONLL parser)
├── components/      # UI components (visualizations)
└── app.js          # Main application controller
```

## Critical Dependencies
- **D3.js v7**: For network graphs and timeline visualizations
- **Fuse.js**: For fuzzy search functionality
- **OpenWebUI API**: For AI analysis (user-provided endpoint)

## Greek Text Handling
- Unicode polytonic Greek support required
- Transliteration mapping in `text-viewer.js` (lines 371-384)
- Character detection uses variant matching, not exact strings

## Testing & Debugging
- No formal test framework - manual testing via browser
- Debug using browser console - all major objects exposed on window
- API testing via `test-api.html` file

## Deployment Notes
- Static site deployment (GitHub Pages)
- No build step required - vanilla JavaScript advantage
- Ensure CONLL file is accessible at root level