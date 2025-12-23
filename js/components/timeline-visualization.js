// Timeline Visualization Component
// Chapter-by-chapter narrative flow visualization

/**
 * Timeline Visualization for narrative flow
 */
class TimelineVisualization {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.container = document.getElementById(containerId);
        this.currentChapter = 1;
        this.svg = null;
        this.timelineData = [];
        
        this.init();
    }

    /**
     * Initialize timeline visualization
     */
    init() {
        if (!this.container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Create SVG element
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%');

        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'timeline-tooltip')
            .style('opacity', 0);

        // Load initial data
        this.update(1);
    }

    /**
     * Update visualization for specific chapter
     * @param {number} chapter - Chapter number
     */
    update(chapter) {
        this.currentChapter = chapter;
        this.processData(chapter);
        this.render();
    }

    /**
     * Process data for timeline visualization
     * @param {number} chapter - Chapter number
     */
    processData(chapter) {
        this.timelineData = [];
        
        // Get chapter summary
        const chapterSummary = conllParser.getChapterSummary(chapter);
        if (!chapterSummary) return;

        // Process each verse in the chapter
        for (const verse in conllParser.chapters[chapter]) {
            const verseData = this.processVerse(chapter, parseInt(verse));
            if (verseData) {
                this.timelineData.push(verseData);
            }
        }

        // Sort by verse number
        this.timelineData.sort((a, b) => a.verse - b.verse);
    }

    /**
     * Process individual verse
     * @param {number} chapter - Chapter number
     * @param {number} verse - Verse number
     * @returns {Object} Verse data
     */
    processVerse(chapter, verse) {
        const verseSentences = conllParser.chapters[chapter][verse];
        if (!verseSentences || verseSentences.length === 0) return null;

        const verseText = verseSentences.map(s => 
            s.tokens.map(t => t.form).join(' ')
        ).join(' ');

        // Identify characters in verse (using lemma-based matching)
        const characters = new Set();
        const characterDetails = [];

        for (const sentence of verseSentences) {
            for (const token of sentence.tokens) {
                for (const [charName, charData] of conllParser.characters) {
                    // Check if this character's occurrences include this lemma
                    if (charData.occurrences.some(occ => occ.lemma === token.lemma)) {
                        characters.add(charName);
                        characterDetails.push({
                            name: charName,
                            token: token.form,
                            lemma: token.lemma,
                            role: token.deprel,
                            position: token.id
                        });
                        break; // Found match, move to next token
                    }
                }
            }
        }

        // Identify attentional cues in verse
        const cues = conllParser.getCuesInChapter(chapter).filter(cue => 
            cue.verse === verse
        );

        // Calculate narrative intensity
        const intensity = this.calculateNarrativeIntensity(characters, cues, verseText);

        return {
            chapter,
            verse,
            text: verseText,
            characters: Array.from(characters),
            characterDetails,
            cues,
            intensity,
            sentenceCount: verseSentences.length
        };
    }

    /**
     * Calculate narrative intensity for verse
     * @param {Set} characters - Characters present
     * @param {Array} cues - Attentional cues
     * @param {string} text - Verse text
     * @returns {number} Intensity score
     */
    calculateNarrativeIntensity(characters, cues, text) {
        let intensity = 0;

        // Base intensity from character count
        intensity += Math.min(characters.size / 5, 1) * 0.3;

        // Intensity from cues
        const cueWeights = {
            primacy: 0.8,
            causal: 0.9,
            focalization: 0.7,
            absence: 0.6,
            prolepsis: 0.5
        };

        for (const cue of cues) {
            intensity += (cueWeights[cue.type] || 0.5) * 0.4;
        }

        // Intensity from text length (longer verses may be more significant)
        intensity += Math.min(text.length / 100, 1) * 0.2;

        // Special boost for Holy Spirit mentions
        if (text.includes('Πνευμα') || text.includes('Πνευματος')) {
            intensity += 0.3;
        }

        return Math.min(intensity, 1);
    }

    /**
     * Render the timeline visualization
     */
    render() {
        // Clear existing elements
        this.svg.selectAll('*').remove();

        if (this.timelineData.length === 0) {
            this.renderEmptyState();
            return;
        }

        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const width = this.container.clientWidth - margin.left - margin.right;
        const height = this.container.clientHeight - margin.top - margin.bottom;

        const g = this.svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(this.timelineData, d => d.verse))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([height, 0]);

        // Create color scale for intensity
        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 1]);

        // Create axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => `v${d}`);

        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d3.format('.0%'));

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);

        // Add axis labels
        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Narrative Intensity');

        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
            .style('text-anchor', 'middle')
            .text('Verse Number');

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.verse))
            .y(d => yScale(d.intensity))
            .curve(d3.curveMonotoneX);

        // Add intensity line
        g.append('path')
            .datum(this.timelineData)
            .attr('class', 'intensity-line')
            .attr('d', line);

        // Add area under line
        const area = d3.area()
            .x(d => xScale(d.verse))
            .y0(height)
            .y1(d => yScale(d.intensity))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(this.timelineData)
            .attr('class', 'intensity-area')
            .attr('d', area);

        // Add verse points
        const versePoints = g.selectAll('.verse-point')
            .data(this.timelineData)
            .enter().append('g')
            .attr('class', 'verse-point')
            .attr('transform', d => `translate(${xScale(d.verse)}, ${yScale(d.intensity)})`);

        versePoints.append('circle')
            .attr('r', 6)
            .attr('fill', d => colorScale(d.intensity))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('mouseover', (event, d) => {
                this.showVerseTooltip(event, d);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            })
            .on('click', (event, d) => {
                this.onVerseClick(d);
            });

        // Add special markers for Holy Spirit verses
        const holySpiritVerses = this.timelineData.filter(d => 
            d.text.includes('Πνευμα') || d.text.includes('Πνευματος')
        );

        g.selectAll('.holy-spirit-marker')
            .data(holySpiritVerses)
            .enter().append('g')
            .attr('class', 'holy-spirit-marker')
            .attr('transform', d => `translate(${xScale(d.verse)}, ${yScale(d.intensity)})`)
            .append('path')
            .attr('d', d3.symbol().type(d3.symbolTriangle).size(100))
            .attr('fill', '#ff6b6b')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('mouseover', (event, d) => {
                this.showVerseTooltip(event, d);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            });

        // Add cue markers
        this.addCueMarkers(g, xScale, yScale);

        // Add legend
        this.addLegend(g, width, height);

        // Add title
        g.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .text(`Chapter ${this.currentChapter} Narrative Flow`);
    }

    /**
     * Add cue markers to timeline
     * @param {Selection} g - SVG group
     * @param {Scale} xScale - X scale
     * @param {Scale} yScale - Y scale
     */
    addCueMarkers(g, xScale, yScale) {
        const cueTypes = ['primacy', 'causal', 'focalization', 'absence', 'prolepsis'];
        const cueColors = {
            primacy: '#4e79a7',
            causal: '#f28e2c',
            focalization: '#e15759',
            absence: '#76b7b2',
            prolepsis: '#59a14f'
        };

        cueTypes.forEach(cueType => {
            const cueVerses = this.timelineData.filter(d => 
                d.cues.some(cue => cue.type === cueType)
            );

            g.selectAll(`.cue-marker-${cueType}`)
                .data(cueVerses)
                .enter().append('rect')
                .attr('class', `cue-marker cue-marker-${cueType}`)
                .attr('x', d => xScale(d.verse) - 2)
                .attr('y', yScale(1) - 10)
                .attr('width', 4)
                .attr('height', 10)
                .attr('fill', cueColors[cueType])
                .on('mouseover', (event, d) => {
                    const cue = d.cues.find(c => c.type === cueType);
                    this.showCueTooltip(event, cue);
                })
                .on('mouseout', () => {
                    this.hideTooltip();
                });
        });
    }

    /**
     * Add legend to timeline
     * @param {Selection} g - SVG group
     * @param {number} width - Width
     * @param {number} height - Height
     */
    addLegend(g, width, height) {
        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 150}, 20)`);

        // Intensity scale
        legend.append('text')
            .attr('class', 'legend-title')
            .attr('x', 0)
            .attr('y', 0)
            .text('Intensity');

        const intensityScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, 100]);

        const intensityGradient = legend.append('defs')
            .append('linearGradient')
            .attr('id', 'intensity-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

        intensityGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', d3.interpolateViridis(0));

        intensityGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', d3.interpolateViridis(1));

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 10)
            .attr('width', 100)
            .attr('height', 10)
            .attr('fill', 'url(#intensity-gradient)');

        legend.append('text')
            .attr('x', 0)
            .attr('y', 30)
            .text('Low');

        legend.append('text')
            .attr('x', 85)
            .attr('y', 30)
            .text('High');

        // Cue types
        const cueTypes = [
            { type: 'primacy', label: 'Primacy' },
            { type: 'causal', label: 'Causal' },
            { type: 'holy-spirit', label: 'Holy Spirit' }
        ];

        cueTypes.forEach((cue, i) => {
            const cueLegend = legend.append('g')
                .attr('transform', `translate(0, ${50 + i * 20})`);

            if (cue.type === 'holy-spirit') {
                cueLegend.append('path')
                    .attr('d', d3.symbol().type(d3.symbolTriangle).size(50))
                    .attr('fill', '#ff6b6b')
                    .attr('transform', 'translate(5, 0)');
            } else {
                cueLegend.append('rect')
                    .attr('x', 0)
                    .attr('y', -5)
                    .attr('width', 10)
                    .attr('height', 10)
                    .attr('fill', '#4e79a7');
            }

            cueLegend.append('text')
                .attr('x', 15)
                .attr('y', 4)
                .text(cue.label);
        });
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.svg.append('text')
            .attr('class', 'empty-state')
            .attr('x', '50%')
            .attr('y', '50%')
            .attr('text-anchor', 'middle')
            .text('No data available for this chapter');
    }

    /**
     * Show verse tooltip
     * @param {Event} event - Mouse event
     * @param {Object} d - Verse data
     */
    showVerseTooltip(event, d) {
        const tooltip = this.tooltip;
        
        let content = `<strong>Chapter ${d.chapter}:${d.verse}</strong><br>`;
        content += `Text: ${d.text.substring(0, 100)}${d.text.length > 100 ? '...' : ''}<br>`;
        content += `Characters: ${d.characters.join(', ') || 'None'}<br>`;
        content += `Intensity: ${(d.intensity * 100).toFixed(1)}%<br>`;
        content += `Cues: ${d.cues.length}`;

        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        
        tooltip.html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    }

    /**
     * Show cue tooltip
     * @param {Event} event - Mouse event
     * @param {Object} cue - Cue data
     */
    showCueTooltip(event, cue) {
        const tooltip = this.tooltip;
        
        let content = `<strong>${cue.type.charAt(0).toUpperCase() + cue.type.slice(1)} Cue</strong><br>`;
        content += `Location: ${cue.location}<br>`;
        content += `Description: ${cue.description}`;

        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        
        tooltip.html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }

    /**
     * Handle verse click
     * @param {Object} d - Verse data
     */
    onVerseClick(d) {
        // Switch to text view and highlight verse
        if (window.narratologyApp) {
            window.narratologyApp.loadView('text');
            if (window.narratologyApp.textView) {
                window.narratologyApp.textView.highlightVerse(d.chapter, d.verse);
            }
        }
    }

    /**
     * Export timeline data
     * @returns {Object} Timeline data
     */
    exportData() {
        return {
            timelineData: this.timelineData,
            chapter: this.currentChapter
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineVisualization;
} else {
    window.TimelineVisualization = TimelineVisualization;
}