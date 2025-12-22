# System Architecture Diagram

```mermaid
graph TB
    subgraph "Data Layer"
        CONLL[mark_complete.conllu<br/>Gospel of Mark (PROIEL)]
        Parser[CONLL Parser]
        Characters[Character Mapping]
        Segments[Narrative Segments]
    end
    
    subgraph "Analysis Layer"
        CueDetector[Attentional Cue<br/>Detection Algorithm]
        OpenWebUI[OpenWebUI API<br/>AI Analysis]
        PatternRecognition[Pattern<br/>Recognition]
    end
    
    subgraph "Visualization Layer"
        NetworkGraph[Character Network<br/>Graph Visualization]
        NarrativeFlow[Narrative Flow<br/>Timeline Visualization]
        TextViewer[Interactive Text<br/>Viewer with Annotations]
    end
    
    subgraph "UI Layer"
        MainUI[Main Application Interface]
        Navigation[Navigation &<br/>Mode Switching]
        Filters[Filters &<br/>Search System]
        Export[Export<br/>Functionality]
    end
    
    CONLL --> Parser
    Parser --> Characters
    Parser --> Segments
    
    Characters --> CueDetector
    Segments --> CueDetector
    CueDetector --> OpenWebUI
    OpenWebUI --> PatternRecognition
    
    Characters --> NetworkGraph
    Segments --> NarrativeFlow
    PatternRecognition --> TextViewer
    
    NetworkGraph --> MainUI
    NarrativeFlow --> MainUI
    TextViewer --> MainUI
    
    MainUI --> Navigation
    MainUI --> Filters
    MainUI --> Export
    
    style CONLL fill:#f9f,stroke:#333,stroke-width:2px
    style OpenWebUI fill:#bbf,stroke:#333,stroke-width:2px
    style NetworkGraph fill:#bfb,stroke:#333,stroke-width:2px
    style NarrativeFlow fill:#bfb,stroke:#333,stroke-width:2px
    style TextViewer fill:#bfb,stroke:#333,stroke-width:2px
```

## Component Interactions

### Data Flow
1. **CONLL File** → **Parser**: Raw Greek text is parsed into structured data
2. **Parser** → **Characters/Segments**: Extract character entities and narrative segments
3. **Characters/Segments** → **Cue Detector**: Identify potential attentional cues
4. **Cue Detector** → **OpenWebUI API**: Send text segments for AI analysis
5. **OpenWebUI API** → **Pattern Recognition**: Process AI responses for patterns
6. **All Data** → **Visualizations**: Feed into three main visualization components

### User Interaction Flow
1. User selects visualization mode via **Navigation**
2. **Filters** allow refinement of displayed data
3. **Visualizations** update based on user selections
4. **Export** functionality saves current view or analysis

## Key Technologies

### Data Processing
- **CONLL Parsing**: Custom JavaScript parser for linguistic annotations
- **Character Mapping**: Algorithm to identify explicit/implicit character references
- **Segmentation**: Text division into narrative units

### Visualization
- **D3.js**: For network graphs and custom visualizations
- **Vis.js**: For timeline components
- **Custom SVG**: For specialized narrative visualizations

### AI Integration
- **OpenWebUI API**: OpenAI-compatible endpoint for text analysis
- **Prompt Engineering**: Specific prompts for attentional cue detection
- **Confidence Scoring**: Visualization of AI detection reliability

### User Interface
- **Responsive Design**: CSS Grid/Flexbox for adaptive layouts
- **Progressive Enhancement**: Core functionality without JavaScript
- **Accessibility**: ARIA labels and keyboard navigation