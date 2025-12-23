# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Digital Humanities web application for investigating the Holy Spirit as a background character in Mark's Gospel through attentional cue detection and character network analysis. It's a research prototype combining narratology, computational linguistics, and AI-powered text analysis.

## Development Commands

### Local Development Server
```bash
# Using Python (recommended)
python -m http.server 8000

# Using Node.js
npx serve .

# Then open http://localhost:8000
```

### Testing the Parser
```bash
node test-parser.js
```

No build process or compilation required - this is a vanilla JavaScript application served as static files.

## Architecture Overview

### Data Flow
1. **Data Source**: `mark_complete.conllu` (PROIEL Greek New Testament data for Mark's Gospel)
2. **Parser**: `js/data/conll-parser.js` parses CONLL-U format into structured JavaScript objects
3. **Main Controller**: `js/app.js` (NarratologyApp class) orchestrates all components
4. **Views**: Network, Timeline, Text Viewer, and Analysis Panel components
5. **API Integration**: Optional AI analysis via configurable API endpoints (OpenWebUI, Claude, GPT, Gemini)

### Component Architecture

The application uses a modular class-based architecture with singleton patterns:

- **NarratologyApp** (`js/app.js`): Main controller managing view switching, chapter navigation, and component lifecycle
- **CONLLParser** (`js/data/conll-parser.js`): Singleton parser that loads and processes linguistic data
  - Extracts chapters, verses, characters, and attentional cues
  - Maintains character mappings with Greek name variants
  - Provides methods like `getTextRange()`, `getChapterSummary()`, `getCuesInChapter()`
- **NetworkVisualization** (`js/components/network-visualization.js`): D3.js character relationship graph
- **TimelineVisualization** (`js/components/timeline-visualization.js`): D3.js narrative flow timeline
- **TextViewer** (`js/components/text-viewer.js`): Interactive Greek text display with morphological annotations
- **AnalysisPanel** (`js/components/analysis-panel.js`): AI-powered attentional cue detection interface
- **APIClient** (`js/utils/api-client.js`): Handles communication with LLM APIs for text analysis

### Data Structure

#### CONLL-U File Format
The `mark_complete.conllu` file uses standard CONLL-U format:
- Comment lines starting with `#` contain metadata (source, chapter, verse, sentence text)
- Tab-separated fields: ID, Form, Lemma, UPOS, XPOS, Features, Head, DepRel, Deps, Misc
- Chapter/verse info is in `Ref=MARK_X.Y` format in the Misc field
- Blank lines separate sentences

#### Parsed Data Structure
```javascript
{
  sentences: [{
    id: number,
    tokens: [{ id, form, lemma, upos, xpos, feats, head, deprel, deps, misc }],
    book: "Mark",
    chapter: number,
    verse: number,
    text: string
  }],
  characters: Map<characterName, {
    name: string,
    variants: string[],
    occurrences: [{ sentence, chapter, verse, token, form, lemma, role }],
    totalMentions: number
  }>,
  cues: [{ type, keyword, sentence, chapter, verse, text, description }]
}
```

### Character Name Resolution

The parser maps Greek name variants to canonical English names using:
- Nominative, genitive, accusative, dative forms
- Multiple spelling variants (with/without accents)
- Key mappings in `getBaseCharacterName()` method in conll-parser.js

Critical character mappings:
- 'Πνευμα', 'Πνευματος' → 'Holy Spirit'
- 'Ιησους', 'Ιησου', 'Ιησουν' → 'Jesus'
- Character detection happens during `extractCharacters()` processing

### Attentional Cue Detection

The system identifies five types of narrative cues in `identifyNarrativeElements()`:
1. **Primacy effect**: Keywords like 'αρχη', 'αρχομαι', 'πρωτος'
2. **Causal implication**: Prepositions like 'δια', 'εκ', 'απο', 'κατα', 'εν'
3. **Focalization shifts**: Verbs of perception like 'ειδον', 'ειδεν', 'οραω', 'βλεπω'
4. **Conspicuous absence**: Negations like 'ου', 'μη', 'ουκ', 'μηδεις'
5. **Prolepsis**: Future-oriented verbs like 'μελλω', 'εσομαι', 'ηξει', 'ερχομαι'

## Critical Implementation Details

### Chapter Organization Bug
The parser uses **TWO** methods to determine chapter/verse:
1. From `# source` comment lines (regex: `/Mark\s+(\d+)/`)
2. From token `Ref=MARK_X.Y` fields in the Misc column

The parser must check **BOTH** to handle edge cases. Currently prioritizes token-level refs over comment-level refs.

### Text Retrieval Pattern
When getting chapter text, components use a fallback strategy:
```javascript
let text = conllParser.getTextRange(chapter, 1, 50);
if (!text || text.trim() === '') {
  // Fall back to sentence filtering
  const sentences = conllParser.data.sentences.filter(s => s.chapter === chapter);
  text = sentences.map(s => s.tokens.map(t => t.form).join(' ')).join(' ');
}
```

This pattern appears in both `app.js` (runAnalysis) and `analysis-panel.js` (runAnalysis).

### API Client Architecture
The APIClient supports multiple providers but currently defaults to OpenWebUI:
- API key stored in `localStorage` under key 'openwebui_api_key'
- Endpoint and model configurable in `this.config`
- Response parsing handles multiple API response formats
- Future enhancement needed: multi-provider selector UI

### View Switching
Navigation between views uses a class-based activation pattern:
- All `.view-container` elements hidden by removing `.active` class
- Selected view shown by adding `.active` class
- Navigation buttons synchronized with same pattern
- Current view tracked in `this.currentView` state

## Common Issues and Solutions

### Chapter Display Not Working
**Symptom**: Chapter selector shows only "Chapter 1" or wrong chapter count
**Cause**: Parser not correctly extracting chapter metadata from CONLL-U comments
**Solution**: Verify both `# source` regex and `Ref=MARK_X.Y` parsing in conll-parser.js lines 36-95

### Analysis Returning No Text
**Symptom**: "No text available for analysis" error
**Cause**: Chapter/verse organization not matching retrieval query
**Solution**: Use the fallback pattern shown above, filter sentences by chapter number directly

### Character Names Not Recognized
**Symptom**: Characters not appearing in visualizations
**Cause**: Name variant not in character extraction patterns
**Solution**: Add variants to `characterNames` array in conll-parser.js:165-188 AND to `getBaseCharacterName()` mapping

### Visualization Not Updating
**Symptom**: D3 visualization shows old data after chapter change
**Solution**: Check that `update(chapter)` is called and D3 data joins are using proper key functions

## API Integration

### Current Setup (Multi-Provider Support)
The application now supports multiple AI providers:

**Supported Providers:**
- **OpenWebUI** (default): `https://openwebui.uni-freiburg.de/api/v1/chat/completions`
  - Models: glm-4.6-llmlb, qwen2.5-14b-instruct, llama-3.1-8b
- **Claude (Anthropic)**: `https://api.anthropic.com/v1/messages`
  - Models: claude-opus-4.5, claude-sonnet-4.5, claude-haiku-4.5
- **OpenAI ChatGPT**: `https://api.openai.com/v1/chat/completions`
  - Models: gpt-5.2, gpt-5.2-mini, gpt-4o, gpt-4o-mini
- **Google Gemini**: `https://generativelanguage.googleapis.com/v1beta/models`
  - Models: gemini-3-ultra, gemini-3-pro, gemini-3-flash

**Note**: Model lists are configured in `js/utils/api-client.js` lines 20-56 and can be easily updated as new models become available.

**Configuration UI:**
- Click "Configure API" button in header
- Select provider from dropdown
- Select model for that provider
- Enter API key
- Configuration persists in localStorage per provider

**API Key Storage:**
Each provider stores its API key separately in localStorage:
- `openwebui_api_key`
- `claude_api_key`
- `openai_api_key`
- `gemini_api_key`

**Provider Selection:**
Current provider and model are stored in:
- `selected_provider` (localStorage)
- `selected_model` (localStorage)
- Default: OpenWebUI with glm-4.6-llmlb

### Response Format Handling
The `normalizeResponse()` method in api-client.js handles different API formats:
- **OpenAI format**: `response.choices[0].message.content`
- **Anthropic format**: `response.content[0].text`
- **Gemini format**: `response.candidates[0].content.parts[0].text`

All responses are normalized to a common format with both `choices` and `content` properties.

## File Locations

### Core Application
- `index.html` - Main HTML structure with view containers
- `js/app.js` - Application controller (NarratologyApp)
- `js/data/conll-parser.js` - CONLL-U parser (CONLLParser singleton)
- `js/utils/api-client.js` - API client (APIClient singleton)
- `js/utils/constants.js` - Application constants and configurations
- `js/utils/helpers.js` - Utility functions

### Components
- `js/components/network-visualization.js` - Character network graph (D3.js)
- `js/components/timeline-visualization.js` - Narrative flow timeline (D3.js)
- `js/components/text-viewer.js` - Interactive Greek text viewer
- `js/components/analysis-panel.js` - AI analysis interface
- `js/components/enhanced-search.js` - Text search functionality
- `js/components/search-integration.js` - Search integration utilities
- `js/components/greek-keyboard.js` - Virtual Greek keyboard

### Data
- `mark_complete.conllu` - Gospel of Mark PROIEL CONLL-U data
- `greek-nt.conll` - Legacy data file (replaced by mark_complete.conllu)

### Styles
- `css/main.css` - Core layout and typography
- `css/components.css` - Component-specific styles
- `css/visualizations.css` - D3 visualization styles

## Key Design Patterns

### Singleton Pattern
Parser and API client are singletons exposed on window object:
```javascript
const conllParser = new CONLLParser();
window.conllParser = conllParser;
```

### Module Pattern
Each component class checks for module.exports and falls back to window:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComponentName;
} else {
  window.ComponentName = ComponentName;
}
```

### Component Lifecycle
1. Constructor receives containerId and data
2. `init()` sets up DOM structure and event listeners
3. `update(chapter)` refreshes component for new chapter
4. Components maintain internal state (currentChapter, etc.)

## Deployment

The application is deployed to GitHub Pages:
- Static file hosting, no server-side processing
- All computation happens client-side
- API calls go directly to configured LLM endpoints (CORS must be enabled on API side)
- No build/deploy scripts needed - just push to repository
- GitHub Actions workflow can automate deployment (see .github/ folder)

## Research Context

This tool supports narratological analysis focusing on:
- How readers construct mental models of background characters
- Attentional cues that direct reader attention to off-stage characters
- The Holy Spirit as a test case for background character construction
- Computational approaches to narratological analysis of biblical texts

The theoretical framework combines:
- Narratology (character construction, attentional theory)
- Digital Humanities (computational text analysis, visualization)
- Biblical Studies (Greek NT linguistics)
- Cognitive Literary Studies (reader response theory)

## Project Documentation Files

This repository contains extensive documentation:
- **CLAUDE.md** (this file) - Guidance for Claude Code
- **AGENTS.md** - Guidance for other AI agents
- **README.md** - Project overview and user-facing documentation
- **implementation_guide.md** - Detailed code examples and implementation patterns
- **project_summary.md** - Research context and project goals
- **technical_specification.md** - Technical requirements and architecture
- **system_architecture.md** - Component architecture diagram (Mermaid)
- **ROO.md** - Lessons learned and best practices
- **DEPLOYMENT.md** - Deployment instructions
- **.roo/** folder - Additional agent-specific rules and guidance

## Recently Fixed Issues

### ✅ Fixed in Latest Update
1. **Character Extraction** - Now uses lemma-based matching instead of form-based
   - Properly handles Greek polytonic text with accents and breathing marks
   - Successfully extracts 25 unique characters including Jesus, Holy Spirit, Peter, etc.
   - Test shows 80 mentions of Jesus, 23 mentions of Holy Spirit across all chapters

2. **Multi-Provider API Support** - Added support for 4 major AI providers
   - OpenWebUI (default), Claude (Anthropic), OpenAI GPT, Google Gemini
   - Provider selector UI with model dropdown
   - Separate API key storage for each provider
   - Format normalization for different API response types

3. **Data Source Migration** - Successfully migrated to PROIEL data
   - `mark_complete.conllu` properly parsed with all 16 chapters
   - 1,135 sentences correctly organized by chapter and verse
   - Chapter/verse metadata extraction working correctly

## Known Issues and Planned Enhancements

### Current Issues
1. **Visualization Testing Needed**: Need to verify all three visualization modes work with actual data
   - Network visualization with character relationships
   - Timeline visualization with attentional cues
   - Text viewer with Greek text and annotations

2. **Search Features**: Not yet implemented
   - Wildcard search functionality
   - Latin transliteration search
   - These are noted for future enhancement

### Planned Enhancements
1. Wildcard and Latin search functionality for text viewer
2. Enhanced error handling and user feedback
3. Performance optimizations for large datasets
4. Additional visualization modes
5. Export enhancements for research data
