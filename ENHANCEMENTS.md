# Planned Enhancements

This document tracks functionality improvements for the Mark's Gospel Narratological Analysis Tool, organized by priority tier.

---

## Tier 1: High Priority (Bug Fixes & Core Features)

### ✅ Completed

1. **Fix Attentional Cue Pattern Matching** *(Completed)*
   - Added `normalizeGreek()` for diacritic-insensitive matching
   - Implemented lemma-based matching as primary method
   - Added context-aware filtering for common prepositions

2. **Complete Pattern Recognition Tab Display** *(Completed)*
   - Parse both JSON and raw text API responses
   - Add markdown-to-HTML formatting
   - Render structured pattern categories

3. **Add Inline Cue Type Explanations** *(Completed)*
   - Added `CUE_EXPLANATIONS` with full descriptions and examples
   - Help icon tooltips in analysis panel
   - Cue type badges with descriptions in text viewer

4. **Add Chapter-Level Cue Statistics Summary** *(Completed)*
   - New "Chapter Overview" tab in Analysis Panel
   - Summary cards for totals (verses, sentences, Holy Spirit, cues)
   - Full 16-chapter statistics table with cue distribution
   - Clickable rows for chapter navigation

5. **Fix Modal Keyboard Handling** *(Completed)*
   - Escape key closes modal
   - Tab key trapping within modal
   - Body scroll lock when modal open
   - Click outside to close

### Pending

6. **Fix Character Matching in TextViewer Component**
   - **Issue**: `getCharacterName()` in `text-viewer.js` has fragile matching logic
   - **Solution**: Implement lemma-based matching consistently with proper diacritic normalization
   - **Files**: `js/components/text-viewer.js`

7. **Add Search Result Navigation**
   - **Issue**: `performSearch()` adds highlights but no navigation between results
   - **Solution**: Add "Next/Previous" buttons, display result count, auto-scroll to first result
   - **Files**: `js/components/text-viewer.js`, `css/components.css`

8. **Implement Loading State Error Recovery**
   - **Issue**: No retry mechanism if CONLL file fails to load
   - **Solution**: Add retry button with exponential backoff, clear error messages, option to load alternate file
   - **Files**: `js/app.js`

9. **Implement Duplicate Cue Deduplication**
   - **Issue**: Cue detection may show duplicates when switching views
   - **Solution**: Add global cue cache with unique key, visual indicator for already-shown cues
   - **Files**: `js/data/conll-parser.js`, `js/components/analysis-panel.js`

10. **Fix Potential XSS in Tooltip Display**
    - **Issue**: Not all DOM insertions use `escapeHtml()`
    - **Solution**: Consistently sanitize user-controlled data before HTML insertion
    - **Files**: `js/components/analysis-panel.js`, `js/components/text-viewer.js`

---

## Tier 2: Medium Priority (Feature Enhancements)

1. **Add Export Format Options**
   - **Current**: Only JSON export available
   - **Enhancement**: Add CSV and plain text export formats
   - **CSV**: One row per cue with columns for type, location, chapter, verse, confidence
   - **Text**: Formatted summary for academic papers
   - **Files**: `js/components/analysis-panel.js`

2. **Implement Verse-Level Filtering**
   - **Current**: Only chapter-level navigation
   - **Enhancement**: Add verse range selector (start-end)
   - Update all visualization components to respect verse filter
   - Remember last selected range in localStorage
   - **Files**: `js/app.js`, all component files

3. **Add Cue Confidence Scores for Parser Cues**
   - **Current**: Only AI-detected cues show confidence
   - **Enhancement**: Calculate confidence for parser cues based on pattern strength and position
   - Display as percentage alongside description
   - **Files**: `js/data/conll-parser.js`, `js/components/analysis-panel.js`

4. **Wildcard Search Functionality**
   - **Enhancement**: Support `*` and `?` wildcards in text search
   - Handle Greek morphological variations
   - **Files**: `js/components/text-viewer.js`, `js/components/enhanced-search.js`

5. **Latin Transliteration Search**
   - **Enhancement**: Allow searching Greek text using Latin characters
   - Use transliteration mapping from text-viewer
   - **Files**: `js/components/text-viewer.js`, `js/components/enhanced-search.js`

6. **Character Relationship Visualization Enhancement**
   - **Enhancement**: Add edge labels for relationship types
   - Show relationship strength based on co-occurrence frequency
   - Filter by relationship type
   - **Files**: `js/components/network-visualization.js`

7. **Timeline Zoom and Pan**
   - **Enhancement**: Add zoom controls for timeline view
   - Enable panning for large datasets
   - Add minimap for navigation
   - **Files**: `js/components/timeline-visualization.js`

---

## Tier 3: Lower Priority (Nice to Have)

1. **Annotation Persistence**
   - Save user annotations to localStorage
   - Export/import annotation sets
   - Share annotations via URL parameters

2. **Comparative Chapter Analysis**
   - Select multiple chapters for side-by-side comparison
   - Highlight differences in cue patterns
   - Show character appearance overlap

3. **Print/PDF Export**
   - Generate printer-friendly report
   - Include visualizations as static images
   - Format for academic publication

4. **Keyboard Shortcuts**
   - Add hotkeys for common actions (next/prev chapter, run analysis, etc.)
   - Display shortcut hints in UI
   - Allow customization

5. **Dark Mode**
   - Add theme toggle
   - Persist preference in localStorage
   - Update all CSS variables

6. **Undo/Redo for Annotations**
   - Track annotation history
   - Allow reverting changes
   - Show history panel

7. **API Usage Dashboard**
   - Track API calls and token usage
   - Show remaining quota (if available from provider)
   - Warn when approaching limits

8. **Collaborative Features**
   - Real-time annotation sharing (would require backend)
   - Comments on specific verses
   - User authentication

---

## Implementation Notes

### File Locations
- **Core App**: `js/app.js`
- **Parser**: `js/data/conll-parser.js`
- **API Client**: `js/utils/api-client.js`
- **Components**: `js/components/*.js`
- **Styles**: `css/*.css`
- **Constants**: `js/utils/constants.js`

### Testing
Run parser tests with:
```bash
node test-parser.js
```

### Data
- Primary data source: `mark_complete.conllu` (PROIEL Greek NT)
- 16 chapters, 1135 sentences, 25 characters detected
- 3060 attentional cues identified

---

## Changelog

### 2025-01-05
- ✅ Tier 1 #1-3: Cue pattern matching, pattern display, cue explanations
- ✅ Tier 1 #4: Chapter Overview tab with statistics
- ✅ Tier 1 #5: Modal keyboard accessibility
- ✅ Dynamic model fetching for all API providers
- ✅ Updated fallback models to Jan 2025 versions
