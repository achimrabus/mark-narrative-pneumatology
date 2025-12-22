# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Documentation Rules (Non-Obvious Only)

### Research Context
- This is a digital humanities project for biblical narratology research
- Focus: Holy Spirit as background character in Mark's Gospel
- Academic audience: biblical scholars, narratologists, digital humanists
- Research methodology combines computational linguistics with literary analysis

### Data Structure Insights
- CONLL file contains linguistic annotations for Greek New Testament
- Character identification uses variant matching, not exact strings
- Attentional cues are narrative theory concepts, not linguistic features
- Greek text uses polytonic Unicode, not transliterated forms

### Component Organization Logic
- `js/data/` contains data processing, not database connections
- `js/components/` are UI visualizations, not business logic
- `js/utils/` are pure utilities, not component-specific helpers
- Main app coordinates components, doesn't contain domain logic

### Non-Obvious File Relationships
- `index.html` script loading order is critical for dependencies
- `test-api.html` is standalone API testing, not part of main app
- `greek-nt.conll` is linguistic data, not simple text file
- CSS files separated by concern: main, components, visualizations

### API Integration Context
- OpenWebUI API provides AI analysis, not standard web service
- User provides own API key - not hardcoded credentials
- API enhances analysis but isn't required for core functionality
- Error handling prioritizes user experience over technical details

### Visualization Purpose
- Network graph shows character relationships, not social networks
- Timeline displays narrative intensity, not historical events
- Text viewer is for scholarly annotation, not reading
- Analysis panel presents research findings, not raw data

### Greek Language Handling
- All Greek text stored in Unicode polytonic Greek
- Transliteration is display convenience, not storage format
- Character names have multiple grammatical variants
- Morphological data comes from CONLL linguistic annotations

### Research Methodology Notes
- Attentional cues are narratological theory concepts
- Five cue types: primacy, causal, focalization, absence, prolepsis
- Analysis focuses on background character construction
- Holy Spirit is case study for background character analysis

### Development Workflow
- No build process - static files deployed directly
- Python server for development, not production
- GitHub Pages deployment, not traditional web server
- Manual testing approach, not automated test suite