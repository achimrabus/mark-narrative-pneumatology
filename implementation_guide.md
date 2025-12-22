# Implementation Guide

## 1. CONLL Parser Implementation

### Basic Parser Structure
```javascript
// js/data/conll-parser.js
class CONLLParser {
    constructor() {
        this.characters = new Map();
        this.segments = [];
        this.currentChapter = 1;
        this.currentVerse = 1;
    }

    parseFile(conllText) {
        const lines = conllText.split('\n');
        const tokens = [];
        
        for (const line of lines) {
            if (line.trim() === '') {
                // Empty line indicates sentence boundary
                this.processSentence(tokens);
                tokens.length = 0;
                continue;
            }
            
            const token = this.parseToken(line);
            tokens.push(token);
        }
        
        return {
            characters: Array.from(this.characters.values()),
            segments: this.segments
        };
    }

    parseToken(line) {
        const fields = line.split('\t');
        return {
            id: fields[0],
            form: fields[1], // Greek word
            lemma: fields[2],
            pos: fields[3],
            morph: fields[4],
            head: fields[6],
            relation: fields[7],
            chapter: this.currentChapter,
            verse: this.currentVerse
        };
    }

    processSentence(tokens) {
        // Identify character references
        this.identifyCharacters(tokens);
        
        // Create narrative segment
        this.createSegment(tokens);
    }

    identifyCharacters(tokens) {
        // Known character names in Mark's Gospel
        const characterNames = {
            'Ἰησοῦς': 'Jesus',
            'Πέτρος': 'Peter',
            'Ἰωάννης': 'John',
            'Ἰάκωβος': 'James',
            'πνεῦμα': 'Spirit',
            'θεός': 'God',
            'διάβολος': 'Satan',
            'Ἰωσήφ': 'Joseph',
            'Μαρία': 'Mary'
        };

        for (const token of tokens) {
            const name = characterNames[token.form];
            if (name) {
                if (!this.characters.has(name)) {
                    this.characters.set(name, {
                        id: name,
                        name: name,
                        type: name === 'Spirit' ? 'implicit' : 'explicit',
                        references: []
                    });
                }
                
                this.characters.get(name).references.push({
                    chapter: token.chapter,
                    verse: token.verse,
                    token: token
                });
            }
        }
    }
}
```

## 2. Character Network Graph Visualization

### D3.js Network Implementation
```javascript
// js/visualizations/network-graph.js
class NetworkGraph {
    constructor(containerId, data) {
        this.container = d3.select(containerId);
        this.data = data;
        this.width = 800;
        this.height = 600;
        this.simulation = null;
    }

    init() {
        // Create SVG
        this.svg = this.container.append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(zoom);

        this.g = this.svg.append('g');

        // Prepare data
        this.prepareNetworkData();
        
        // Create force simulation
        this.createSimulation();
        
        // Draw elements
        this.drawLinks();
        this.drawNodes();
        this.drawLabels();
    }

    prepareNetworkData() {
        // Create nodes from characters
        this.nodes = this.data.characters.map(char => ({
            id: char.id,
            name: char.name,
            type: char.type,
            group: char.type === 'implicit' ? 'spirit' : 'human'
        }));

        // Create links based on co-occurrence in segments
        this.links = [];
        const coOccurrences = new Map();

        for (const segment of this.data.segments) {
            const chars = segment.characters;
            for (let i = 0; i < chars.length; i++) {
                for (let j = i + 1; j < chars.length; j++) {
                    const key = [chars[i], chars[j]].sort().join('-');
                    coOccurrences.set(key, (coOccurrences.get(key) || 0) + 1);
                }
            }
        }

        coOccurrences.forEach((count, key) => {
            const [source, target] = key.split('-');
            this.links.push({
                source: source,
                target: target,
                value: count,
                type: source === 'Spirit' || target === 'Spirit' ? 'spirit' : 'human'
            });
        });
    }

    createSimulation() {
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links).id(d => d.id))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(30));
    }

    drawNodes() {
        this.nodeGroups = this.g.append('g')
            .selectAll('g')
            .data(this.nodes)
            .enter().append('g')
            .call(this.drag());

        // Node circles
        this.nodeGroups.append('circle')
            .attr('r', d => d.type === 'implicit' ? 25 : 20)
            .attr('fill', d => d.group === 'spirit' ? '#ff6b6b' : '#4ecdc4')
            .attr('stroke', '#333')
            .attr('stroke-width', 2);

        // Node halos for Spirit
        this.nodeGroups.filter(d => d.group === 'spirit')
            .append('circle')
            .attr('r', 30)
            .attr('fill', 'none')
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('opacity', 0.5);
    }

    drawLinks() {
        this.linkGroups = this.g.append('g')
            .selectAll('line')
            .data(this.links)
            .enter().append('line')
            .attr('stroke', d => d.type === 'spirit' ? '#ff6b6b' : '#999')
            .attr('stroke-width', d => Math.sqrt(d.value))
            .attr('stroke-dasharray', d => d.type === 'spirit' ? '5,5' : null)
            .attr('opacity', 0.6);
    }

    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
}
```

## 3. Attentional Cue Detection

### AI-Powered Cue Detection
```javascript
// js/analysis/cue-detector.js
class CueDetector {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.cueTypes = [
            'primacy',      // Primacy effect
            'causal',       // Causal implication
            'focalization', // Focalization shifts
            'absence',      // Conspicuous absence
            'prolepsis'     // Proleptic references
        ];
    }

    async detectCues(textSegment) {
        const prompt = this.buildPrompt(textSegment);
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            const result = await response.json();
            return this.parseResponse(result.choices[0].text);
        } catch (error) {
            console.error('Error detecting cues:', error);
            return [];
        }
    }

    buildPrompt(segment) {
        return `Analyze this text segment from Mark's Gospel for attentional cues that direct readers to construct character models for background figures, particularly the Holy Spirit.

Text: "${segment.text}"

Look for these types of cues:
1. Primacy effect: Early mentions that establish character importance
2. Causal implication: Events attributed to off-stage characters
3. Focalization shifts: Narrative perspective changes
4. Conspicuous absence: Notable omissions or gaps
5. Prolepsis: Forward references that anticipate character action

For each cue found, provide:
- Type of cue
- Location (word or phrase)
- Explanation of how it functions
- Confidence score (0-1)

Respond in JSON format:
{
  "cues": [
    {
      "type": "cue_type",
      "location": "specific_text",
      "explanation": "how_it_works",
      "confidence": 0.8
    }
  ]
}`;
    }

    parseResponse(responseText) {
        try {
            const parsed = JSON.parse(responseText);
            return parsed.cues || [];
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return [];
        }
    }

    async analyzeAllSegments(segments) {
        const results = [];
        
        for (const segment of segments) {
            const cues = await this.detectCues(segment);
            results.push({
                segmentId: segment.id,
                cues: cues
            });
        }
        
        return results;
    }
}
```

## 4. Interactive Text Viewer

### Annotation System
```javascript
// js/visualizations/text-viewer.js
class TextViewer {
    constructor(containerId, data) {
        this.container = d3.select(containerId);
        this.data = data;
        this.annotations = [];
        this.currentSegment = null;
    }

    init() {
        this.createLayout();
        this.loadSegment(0); // Load first segment
    }

    createLayout() {
        // Main container
        this.viewer = this.container.append('div')
            .attr('class', 'text-viewer');

        // Text display area
        this.textArea = this.viewer.append('div')
            .attr('class', 'text-area');

        // Annotation panel
        this.annotationPanel = this.viewer.append('div')
            .attr('class', 'annotation-panel');

        // Navigation controls
        this.navigation = this.viewer.append('div')
            .attr('class', 'navigation');
    }

    loadSegment(index) {
        this.currentSegment = this.data.segments[index];
        this.displayText();
        this.displayAnnotations();
        this.updateNavigation(index);
    }

    displayText() {
        const segment = this.currentSegment;
        
        // Clear previous content
        this.textArea.selectAll('*').remove();

        // Add chapter/verse header
        this.textArea.append('h3')
            .text(`Mark ${segment.chapter}:${segment.verses[0]}-${segment.verses[1]}`);

        // Add text with annotations
        const textContainer = this.textArea.append('div')
            .attr('class', 'text-content');

        // Split text into words for annotation
        const words = segment.text.split(' ');
        
        const textSpans = textContainer.selectAll('span')
            .data(words)
            .enter().append('span')
            .attr('class', 'word')
            .text(d => d + ' ')
            .on('click', (event, d) => this.addAnnotation(d));

        // Highlight attentional cues
        if (segment.cues) {
            segment.cues.forEach(cue => {
                this.highlightCue(cue);
            });
        }
    }

    highlightCue(cue) {
        const words = this.textArea.selectAll('.word');
        
        words.each(function(d) {
            if (d.includes(cue.location)) {
                d3.select(this)
                    .attr('class', 'word highlighted')
                    .attr('data-cue-type', cue.type)
                    .on('mouseover', function() {
                        // Show tooltip
                        const tooltip = d3.select('body').append('div')
                            .attr('class', 'tooltip')
                            .style('opacity', 0);
                        
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        
                        tooltip.html(`
                            <strong>${cue.type}</strong><br/>
                            ${cue.explanation}<br/>
                            Confidence: ${cue.confidence}
                        `)
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function() {
                        d3.selectAll('.tooltip').remove();
                    });
            }
        });
    }

    addAnnotation(word) {
        const annotation = {
            id: Date.now(),
            word: word,
            note: prompt('Add annotation for "' + word + '":'),
            timestamp: new Date().toISOString()
        };

        if (annotation.note) {
            this.annotations.push(annotation);
            this.displayAnnotations();
        }
    }

    displayAnnotations() {
        // Clear previous annotations
        this.annotationPanel.selectAll('*').remove();

        this.annotationPanel.append('h4')
            .text('Annotations');

        const annotationList = this.annotationPanel.append('ul')
            .attr('class', 'annotation-list');

        const items = annotationList.selectAll('li')
            .data(this.annotations)
            .enter().append('li')
            .attr('class', 'annotation-item');

        items.append('strong')
            .text(d => d.word + ': ');

        items.append('span')
            .text(d => d.note);

        items.append('button')
            .text('×')
            .on('click', (event, d) => {
                this.annotations = this.annotations.filter(a => a.id !== d.id);
                this.displayAnnotations();
            });
    }
}
```

## 5. CSS Styling

### Main Styles
```css
/* css/main.css */
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --accent-color: #e74c3c;
    --spirit-color: #ff6b6b;
    --human-color: #4ecdc4;
    --background-color: #f8f9fa;
    --text-color: #2c3e50;
    --border-color: #dee2e6;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    background-color: var(--background-color);
    color: var(--text-color);
}

/* Header */
header {
    background-color: var(--primary-color);
    color: white;
    padding: 1rem 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
    margin: 0;
    font-size: 1.8rem;
}

/* Navigation */
nav {
    background-color: white;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border-color);
}

nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 2rem;
}

nav button {
    background: none;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;
}

nav button:hover {
    background-color: var(--background-color);
}

nav button.active {
    background-color: var(--secondary-color);
    color: white;
}

/* Main content */
main {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

/* Visualization containers */
.visualization-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.visualization-container h2 {
    margin-top: 0;
    color: var(--primary-color);
}

/* Text viewer */
.text-viewer {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    height: 600px;
}

.text-area {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 1rem;
    overflow-y: auto;
}

.text-content {
    line-height: 1.8;
    font-size: 1.1rem;
}

.word {
    cursor: pointer;
    transition: background-color 0.2s;
}

.word:hover {
    background-color: #f0f0f0;
}

.word.highlighted {
    background-color: var(--accent-color);
    color: white;
    padding: 2px 4px;
    border-radius: 3px;
}

.word.highlighted[data-cue-type="primacy"] {
    background-color: #f39c12;
}

.word.highlighted[data-cue-type="causal"] {
    background-color: #9b59b6;
}

.word.highlighted[data-cue-type="focalization"] {
    background-color: #3498db;
}

.word.highlighted[data-cue-type="absence"] {
    background-color: #e74c3c;
}

.word.highlighted[data-cue-type="prolepsis"] {
    background-color: #1abc9c;
}

/* Annotation panel */
.annotation-panel {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 1rem;
    overflow-y: auto;
}

.annotation-list {
    list-style: none;
    padding: 0;
}

.annotation-item {
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: var(--background-color);
    border-radius: 4px;
}

.annotation-item button {
    background: none;
    border: none;
    color: var(--accent-color);
    cursor: pointer;
    float: right;
}

/* Tooltip */
.tooltip {
    position: absolute;
    padding: 10px;
    font: 12px sans-serif;
    background: lightsteelblue;
    border: 0px;
    border-radius: 8px;
    pointer-events: none;
}

/* Responsive design */
@media (max-width: 768px) {
    .text-viewer {
        grid-template-columns: 1fr;
        height: auto;
    }
    
    nav ul {
        flex-wrap: wrap;
        gap: 1rem;
    }
}
```

This implementation guide provides the core components needed to build the narratological investigation web application. Each component is designed to work together while maintaining modularity for easy maintenance and extension.