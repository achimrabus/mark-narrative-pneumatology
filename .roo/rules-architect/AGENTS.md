# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Architecture Rules (Non-Obvious Only)

### System Architecture Constraints
- Vanilla JavaScript architecture - no framework dependencies
- Component-based design with shared global state via window object
- Data flow: CONLL → Parser → Components → Visualizations
- API integration is optional enhancement, not core dependency

### Data Processing Architecture
- Single CONLL parser processes all linguistic data
- Character mapping centralized in parser, not distributed
- Attentional cue detection combines rule-based and AI approaches
- All data transformations happen in parser, not in components

### Component Coupling Patterns
- Components communicate through shared data objects, not events
- Global singletons: `window.conllParser`, `window.apiClient`, `window.narratologyApp`
- No component-to-component direct dependencies
- Main app acts as coordinator, not mediator

### Visualization Architecture
- D3.js for all data visualizations (network, timeline, text)
- Each visualization is self-contained component
- Shared color schemes and interaction patterns
- Responsive design through CSS, not JavaScript

### API Integration Architecture
- API client is singleton with user-provided configuration
- Graceful degradation - core features work without API
- Error handling prevents API failures from breaking app
- Analysis results enhance, don't replace, manual analysis

### Performance Architecture
- No build step - direct browser execution
- Lazy loading of visualization data
- Debounced user interactions (search, resize)
- Efficient DOM updates through D3.js patterns

### Research Architecture
- Separation of scholarly methodology from implementation
- Attentional cue detection combines computational and theoretical approaches
- Data structures support narratological analysis concepts
- Export functionality preserves research data

### Extension Points
- New visualizations follow existing component pattern
- Additional cue types added to constants and parser
- API endpoints configurable for different providers
- Greek text processing extensible for other biblical texts

### Deployment Architecture
- Static site architecture - no server-side processing
- GitHub Pages deployment with no build pipeline
- All client-side processing in browser
- Data files served as static assets

### Security Architecture
- No server-side components - reduced attack surface
- API keys stored in browser localStorage
- No user data collection or persistence
- OpenWebUI API endpoint configurable, not hardcoded