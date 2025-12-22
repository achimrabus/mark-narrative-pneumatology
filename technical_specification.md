# Technical Specification: Mark's Narrative Pneumatology Web Application

## Project Overview
This web application will serve as a digital humanities tool for investigating the Holy Spirit as a background character in Mark's Gospel. The application will visualize narrative structures, character relationships, and attentional cues that contribute to the construction of the Holy Spirit's character model.

## Core Features

### 1. Data Processing Layer
- **CONLL Parser**: Process the Greek New Testament CONLL file to extract:
  - Character entities and their attributes
  - Grammatical relationships and dependencies
  - Text segments and their metadata
- **Character Mapping**: Identify and categorize characters (explicit and implicit)
- **Narrative Segmentation**: Divide text into narrative units and scenes

### 2. Visualization Components

#### 2.1 Character Network Graph
- **Interactive node-link diagram** showing character relationships
- **Holy Spirit nodes** highlighted with special styling
- **Implicit connections** shown with dashed lines
- **Filtering options** by character type, chapter, or scene
- **Hover information** showing relationship details

#### 2.2 Narrative Flow Visualization
- **Chapter-by-chapter timeline** of Mark's Gospel
- **Spirit mentions** (explicit and implicit) marked on timeline
- **Attentional cues** highlighted (primacy effect, causal implication, etc.)
- **Scene transitions** and narrative breaks
- **Zoom and pan** functionality for detailed exploration

#### 2.3 Interactive Text Viewer
- **Greek text display** with morphological information
- **Annotation system** for marking narrative techniques
- **Attentional cue highlighting** with color coding
- **Character reference tracking** with cross-references
- **Commentary panel** for scholarly notes

### 3. AI-Powered Analysis
- **OpenWebUI API Integration** for automated detection of:
  - Primacy/prolepsis markers
  - Causal implication patterns
  - Focalization shifts
  - Conspicuous absence indicators
  - Other attention-directing markers
- **Pattern recognition** for narrative techniques
- **Confidence scoring** for AI detections

### 4. User Interface
- **Responsive design** for desktop and tablet use
- **Mode switching** between visualization types
- **Advanced filtering** and search capabilities
- **Export functionality** for visualizations and annotations
- **Help system** with methodology explanations

## Technical Architecture

### Frontend Stack
- **HTML5/CSS3/JavaScript (ES6+)**
- **Visualization Libraries**:
  - D3.js for network graphs and custom visualizations
  - Vis.js for timeline components
  - Highlight.js for text annotation
- **UI Framework**: Custom CSS with CSS Grid/Flexbox
- **Data Management**: Native JavaScript with JSON storage

### Data Structures
```javascript
// Character entity structure
const Character = {
  id: string,
  name: string,
  type: "explicit" | "implicit",
  references: Reference[],
  attributes: Object
};

// Narrative segment structure
const Segment = {
  id: string,
  chapter: number,
  verses: [number, number],
  text: string,
  characters: string[],
  attentionalCues: Cue[],
  annotations: Annotation[]
};

// Attentional cue structure
const Cue = {
  type: "primacy" | "causal" | "focalization" | "absence",
  confidence: number,
  location: {
    chapter: number,
    verse: number,
    word: string
  },
  explanation: string
};
```

### File Structure
```
mark-narrative-app/
├── index.html
├── css/
│   ├── main.css
│   ├── visualizations.css
│   └── components.css
├── js/
│   ├── app.js
│   ├── data/
│   │   ├── conll-parser.js
│   │   └── character-mapper.js
│   ├── visualizations/
│   │   ├── network-graph.js
│   │   ├── narrative-flow.js
│   │   └── text-viewer.js
│   ├── analysis/
│   │   ├── cue-detector.js
│   │   └── api-client.js
│   └── utils/
│       ├── helpers.js
│       └── constants.js
├── mark_complete.conllu      # Gospel of Mark CONLL-U data (PROIEL)
├── data/
│   └── processed/
│       ├── characters.json
│       ├── segments.json
│       └── cues.json
└── assets/
    └── fonts/
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up project structure
- Implement CONLL parser
- Create basic UI framework
- Process initial data structures

### Phase 2: Core Visualizations (Week 3-4)
- Build character network graph
- Implement narrative flow timeline
- Create interactive text viewer
- Add navigation between views

### Phase 3: AI Integration (Week 5-6)
- Integrate OpenWebUI API
- Implement attentional cue detection
- Add AI-powered annotations
- Create confidence visualization

### Phase 4: Polish & Testing (Week 7-8)
- Responsive design implementation
- Accessibility features
- Performance optimization
- User testing and refinement

## Success Metrics
- **Usability**: Intuitive navigation between visualization modes
- **Scholarly Value**: Ability to identify and analyze subtle narrative patterns
- **Technical Performance**: Smooth rendering of complex visualizations
- **Extensibility**: Framework for adding new texts and analysis methods

## Future Enhancements
- Support for other Gospel texts
- Comparative analysis tools
- Collaborative annotation features
- Export to academic formats
- Integration with digital humanities repositories