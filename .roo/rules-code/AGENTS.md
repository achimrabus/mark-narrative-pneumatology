# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Coding Rules (Non-Obvious Only)

### Component Architecture
- All components must follow the constructor pattern: `(containerId, data)`
- Update method signature is always `update(chapterNumber)` - never deviate
- Components export to both module and window global for flexibility
- Use singleton pattern for global objects: `window.conllParser`, `window.apiClient`, `window.narratologyApp`

### Data Processing Rules
- Character name variants are mapped in `js/data/conll-parser.js` (lines 136-159)
- Always use `getBaseCharacterName()` method for character name resolution
- Holy Spirit has multiple variants: 'Πνευμα', 'Πνευματος', 'Αγιον', 'Αγιου'
- CONLL parsing requires specific field order: id, form, lemma, upos, xpos, feats, head, deprel, deps, misc

### Greek Text Handling
- Use Unicode polytonic Greek - never ASCII transliteration for storage
- Transliteration mapping in `text-viewer.js` (lines 371-384) is for display only
- Character detection uses variant matching, not exact string comparison
- Always check `token.form.includes(variant)` not `token.form === variant`

### API Integration
- User-provided API keys stored in localStorage under 'openwebui_api_key'
- App must work without API - implement graceful degradation
- Error handling must show user-friendly notifications, not console errors
- API endpoint is configurable in `js/utils/api-client.js` (line 12)

### Script Loading Order
Critical dependency order in index.html:
1. Constants (`js/utils/constants.js`)
2. Helpers (`js/utils/helpers.js`) 
3. API Client (`js/utils/api-client.js`)
4. CONLL Parser (`js/data/conll-parser.js`)
5. Enhanced Components
6. Visualization Components
7. Main App (`js/app.js`)

### D3.js Visualization Rules
- Always create SVG with viewBox for responsiveness
- Use force simulation for network graphs with specific parameters
- Implement zoom/pan behavior for complex visualizations
- Color schemes defined in constants.js - never hardcode colors

### Event Handling
- Use arrow functions for event handlers to maintain `this` context
- Component cleanup must remove event listeners to prevent memory leaks
- Keyboard shortcuts follow pattern: Ctrl/Cmd + number for navigation, Ctrl/Cmd + E for export

### Error Handling Patterns
- Always wrap async operations in try/catch
- Use `showNotification()` helper for user feedback
- Console errors should include context for debugging
- API failures must not break core functionality

### Performance Considerations
- Debounce resize events and search input
- Use D3.js general update pattern for efficient DOM updates
- Cache DOM queries in component constructors
- Lazy load visualization data when possible