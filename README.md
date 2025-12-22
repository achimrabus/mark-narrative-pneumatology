# Mark's Gospel Narratological Analysis

A digital humanities web application for investigating the Holy Spirit as a background character in Mark's Gospel through attentional cue detection and character network analysis.

## Overview

This application implements a narratological investigation of Mark's Gospel, focusing on how readers construct character models for background figures, particularly the Holy Spirit. It combines computational linguistics, network analysis, and AI-powered text analysis to identify attentional cues that direct reader attention to off-stage characters.

## Features

### 🕸️ Character Network Visualization
- Interactive D3.js-based network graphs showing character relationships
- Visual representation of co-occurrence and causal relationships
- Special highlighting for the Holy Spirit and other key characters
- Chapter-by-chapter network evolution

### 📈 Narrative Flow Timeline
- Chapter-by-chapter visualization of narrative intensity
- Identification of attentional cues and their distribution
- Holy Spirit mention tracking with special markers
- Interactive verse exploration

### 📖 Interactive Text Viewer
- Greek text display with morphological analysis
- Character and attentional cue highlighting
- Transliteration and annotation support
- Search functionality with lemma matching
- Verse-by-verse navigation

### 🤖 AI-Powered Analysis
- Integration with OpenWebUI API for automated cue detection
- Analysis of five types of attentional cues:
  - **Primacy effect**: Early mentions establishing importance
  - **Causal implication**: Events attributed to off-stage characters
  - **Focalization shifts**: Narrative perspective changes
  - **Conspicuous absence**: Notable omissions or gaps
  - **Prolepsis**: Forward references anticipating action

## Technical Implementation

### Architecture
- **Frontend**: Vanilla JavaScript with modular ES6 classes
- **Visualization**: D3.js for network graphs and timelines
- **Data Processing**: CONLL file parser for Greek New Testament linguistic data
- **API Integration**: OpenWebUI OpenAI-compatible API for text analysis
- **Deployment**: GitHub Pages with static file hosting

### Data Sources
- **Greek New Testament**: CONLL format linguistic annotations
- **Character Mapping**: Comprehensive character name variants in Greek
- **Attentional Cue Patterns**: Linguistic patterns for narrative analysis

## Installation and Setup

### Prerequisites
- Modern web browser with JavaScript support
- OpenWebUI API key (optional, for AI analysis features)

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/achimrabus/mark-narrative-pneumatology.git
   cd mark-narrative-pneumatology
   ```

2. Start local server:
   ```bash
   # Using Python (recommended)
   python -m http.server 8000
   
   # Or using Node.js
   npx serve .
   ```

3. Open browser:
   ```
   http://localhost:8000
   ```

### API Configuration
For AI analysis features, configure your OpenWebUI API key:

1. Click the API key button in the application
2. Enter your OpenWebUI API key
3. The key will be stored locally in your browser

## Usage Guide

### Navigation
- **Network View**: Explore character relationships and interactions
- **Timeline View**: Analyze narrative flow and attentional cues
- **Text View**: Read and annotate the Greek text
- **Analysis View**: Run AI-powered narratological analysis

### Keyboard Shortcuts
- `Ctrl+1-4`: Switch between views
- `Ctrl+R`: Run analysis
- `Ctrl+E`: Export data
- `←/→`: Navigate between chapters

### Data Export
Export analysis results in JSON format including:
- Character network data
- Attentional cue detections
- Narrative patterns
- Chapter summaries

## Research Background

This application supports research into narratological construction of background characters in biblical texts. It implements methodologies from:

- **Narratology**: Character construction and attentional theory
- **Digital Humanities**: Computational text analysis and visualization
- **Biblical Studies**: Linguistic analysis of New Testament Greek
- **Cognitive Literary Studies**: Reader response and character modeling

### Theoretical Framework

The investigation focuses on how readers construct mental models of characters who are present but not foregrounded in the narrative. The Holy Spirit serves as a case study for understanding how attentional cues guide readers to build coherent character representations for figures who operate primarily "off-stage" in the narrative.

## File Structure

```
mark-narrative-pneumatology/
├── index.html                 # Main application page
├── css/
│   ├── main.css              # Core styles and layout
│   ├── components.css        # Component-specific styles
│   └── visualizations.css    # Visualization styles
├── js/
│   ├── app.js                # Main application controller
│   ├── data/
│   │   └── conll-parser.js   # CONLL file parser
│   ├── utils/
│   │   ├── constants.js      # Application constants
│   │   ├── helpers.js        # Utility functions
│   │   └── api-client.js     # API client for OpenWebUI
│   └── components/
│       ├── network-visualization.js    # Character network graph
│       ├── timeline-visualization.js   # Narrative flow timeline
│       ├── text-viewer.js              # Interactive text display
│       └── analysis-panel.js           # AI analysis results
├── data/
│   └── greek-nt.conll        # Greek New Testament CONLL data
├── docs/                     # Documentation files
├── config.template.js        # API configuration template
└── README.md                 # This file
```

## Contributing

This is a research prototype. Contributions are welcome in the following areas:

- Additional visualization types
- Enhanced linguistic analysis
- Performance optimization
- Accessibility improvements
- Documentation and examples

## License

MIT License - see LICENSE file for details.

## Academic Citation

If you use this application in research, please cite:

```
Rüggemeier, Achim. Mark's Gospel Narratological Analysis. 
Digital Humanities tool for investigating background character construction. 
2024. https://achimrabus.github.io/mark-narrative-pneumatology
```

## Acknowledgments

- Greek New Testament CONLL data from linguistic annotation projects
- D3.js for data visualization
- OpenWebUI for AI analysis capabilities
- Digital humanities research community

## Contact

For questions about this research project:
- GitHub Issues: [Repository Issues](https://github.com/achimrabus/mark-narrative-pneumatology/issues)
- Academic inquiries: Through appropriate academic channels

---

**Note**: This is a research prototype designed for scholarly investigation of biblical narratives. The AI analysis features require an API key and are optional for core functionality.