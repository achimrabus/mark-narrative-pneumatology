// Network Visualization Component
// D3.js-based character network graph visualization

/**
 * Network Visualization for character relationships
 */
class NetworkVisualization {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.simulation = null;
        this.currentChapter = 1;
        this.nodes = [];
        this.links = [];
        
        this.init();
    }

    /**
     * Initialize network visualization
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

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(zoom);

        // Create main group
        this.g = this.svg.append('g');

        // Create force simulation with dynamic centering
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 600;

        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05));

        // Create tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'network-tooltip')
            .style('opacity', 0);

        // Load initial data
        this.update(1);
    }

    /**
     * Get color for character
     * @param {string} characterName - Character name
     * @returns {string} Color hex code
     */
    getCharacterColor(characterName) {
        if (window.CONSTANTS && window.CONSTANTS.CHARACTER_COLORS) {
            return window.CONSTANTS.CHARACTER_COLORS[characterName] ||
                   window.CONSTANTS.CHARACTER_COLORS.default;
        }
        // Fallback colors
        if (characterName === 'Holy Spirit') return '#ff6b6b';
        if (characterName === 'Jesus') return '#3498db';
        if (characterName === 'God') return '#f39c12';
        return '#95a5a6';
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
     * Process data for network visualization
     * @param {number} chapter - Chapter number
     */
    processData(chapter) {
        // Get characters in this chapter
        const chapterCharacters = new Map();
        
        // Count character mentions in chapter
        for (const [name, character] of conllParser.characters) {
            const chapterOccurrences = character.occurrences.filter(occ => occ.chapter === chapter);
            if (chapterOccurrences.length > 0) {
                chapterCharacters.set(name, {
                    id: name,
                    name: name,
                    mentions: chapterOccurrences.length,
                    occurrences: chapterOccurrences,
                    importance: this.calculateImportance(character, chapter)
                });
            }
        }

        // Create nodes
        this.nodes = Array.from(chapterCharacters.values());

        // Create links based on co-occurrence
        this.links = this.createCooccurrenceLinks(chapterCharacters, chapter);

        // Add Holy Spirit as special node if not present
        if (!chapterCharacters.has('Holy Spirit')) {
            this.nodes.push({
                id: 'Holy Spirit',
                name: 'Holy Spirit',
                mentions: 0,
                occurrences: [],
                importance: 0.5,
                isBackground: true
            });
        }
    }

    /**
     * Calculate character importance score
     * @param {Object} character - Character data
     * @param {number} chapter - Chapter number
     * @returns {number} Importance score
     */
    calculateImportance(character, chapter) {
        const chapterOccurrences = character.occurrences.filter(occ => occ.chapter === chapter);
        const totalOccurrences = character.totalMentions;
        
        // Factors: mentions in chapter, overall importance, narrative role
        const chapterMentionScore = Math.min(chapterOccurrences.length / 10, 1);
        const overallImportance = Math.min(totalOccurrences / 50, 1);
        
        // Special characters get higher scores
        const specialCharacters = ['Jesus', 'Holy Spirit', 'God'];
        const specialBonus = specialCharacters.includes(character.name) ? 0.3 : 0;
        
        return chapterMentionScore * 0.6 + overallImportance * 0.4 + specialBonus;
    }

    /**
     * Create co-occurrence links between characters
     * @param {Map} characters - Character map
     * @param {number} chapter - Chapter number
     * @returns {Array} Links array
     */
    createCooccurrenceLinks(characters, chapter) {
        const links = [];
        const characterNames = Array.from(characters.keys());
        
        // Check for co-occurrence in same verses
        for (let i = 0; i < characterNames.length; i++) {
            for (let j = i + 1; j < characterNames.length; j++) {
                const char1 = characters.get(characterNames[i]);
                const char2 = characters.get(characterNames[j]);
                
                // Find shared verses
                const char1Verses = new Set(char1.occurrences.map(occ => occ.verse));
                const char2Verses = new Set(char2.occurrences.map(occ => occ.verse));
                
                const sharedVerses = [...char1Verses].filter(verse => char2Verses.has(verse));
                
                if (sharedVerses.length > 0) {
                    links.push({
                        source: char1.id,
                        target: char2.id,
                        strength: sharedVerses.length,
                        verses: sharedVerses,
                        type: 'co-occurrence'
                    });
                }
            }
        }

        // Add special links for Holy Spirit (causal relationships)
        const holySpiritCues = conllParser.getCuesInChapter(chapter).filter(cue => 
            cue.type === 'causal' && cue.text.includes('Πνευμα')
        );
        
        if (holySpiritCues.length > 0) {
            // Link Holy Spirit to Jesus
            links.push({
                source: 'Holy Spirit',
                target: 'Jesus',
                strength: holySpiritCues.length,
                type: 'causal',
                cues: holySpiritCues
            });
        }

        return links;
    }

    /**
     * Render the network visualization
     */
    render() {
        // Clear existing elements
        this.g.selectAll('*').remove();

        // Create link elements
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.links)
            .enter().append('line')
            .attr('class', d => `link ${d.type}`)
            .attr('stroke-width', d => Math.sqrt(d.strength) * 2)
            .on('mouseover', (event, d) => {
                this.showLinkTooltip(event, d);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            });

        // Create node elements
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(this.nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', (event, d) => this.dragstarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragended(event, d)));

        // Add circles for nodes
        node.append('circle')
            .attr('r', d => Math.max(5, d.importance * 20))
            .attr('class', d => {
                let classes = 'node-circle';
                if (d.isBackground) classes += ' background';
                if (d.name === 'Holy Spirit') classes += ' holy-spirit';
                if (d.name === 'Jesus') classes += ' jesus';
                return classes;
            })
            .attr('fill', d => this.getCharacterColor(d.name))
            .attr('stroke', '#333')
            .attr('stroke-width', 2)
            .on('mouseover', (event, d) => {
                this.showNodeTooltip(event, d);
            })
            .on('mouseout', () => {
                this.hideTooltip();
            })
            .on('click', (event, d) => {
                this.onNodeClick(d);
            });

        // Add labels for nodes
        node.append('text')
            .attr('dy', -15)
            .attr('text-anchor', 'middle')
            .text(d => d.name)
            .attr('class', 'node-label');

        // Add mention count
        node.append('text')
            .attr('dy', 4)
            .attr('text-anchor', 'middle')
            .text(d => d.mentions)
            .attr('class', 'node-count');

        // Update simulation
        this.simulation.nodes(this.nodes);
        this.simulation.force('link').links(this.links);
        this.simulation.alpha(1).restart();

        // Update positions on tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Add legend
        this.addLegend();
    }

    /**
     * Add legend to visualization
     */
    addLegend() {
        const legend = this.g.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(20, 20)');

        const legendItems = [
            { class: 'jesus', text: 'Jesus' },
            { class: 'holy-spirit', text: 'Holy Spirit' },
            { class: 'background', text: 'Background Character' },
            { class: 'co-occurrence', text: 'Co-occurrence' },
            { class: 'causal', text: 'Causal Relationship' }
        ];

        legendItems.forEach((item, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            if (item.class.includes('co-occurrence') || item.class.includes('causal')) {
                // Line for link types
                legendItem.append('line')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', 15)
                    .attr('y2', 0)
                    .attr('class', `link ${item.class}`);
            } else {
                // Circle for node types
                legendItem.append('circle')
                    .attr('r', 5)
                    .attr('cx', 7.5)
                    .attr('cy', 0)
                    .attr('class', `node-circle ${item.class}`);
            }

            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 4)
                .text(item.text)
                .attr('class', 'legend-text');
        });
    }

    /**
     * Show node tooltip
     * @param {Event} event - Mouse event
     * @param {Object} d - Node data
     */
    showNodeTooltip(event, d) {
        const tooltip = this.tooltip;
        
        let content = `<strong>${d.name}</strong><br>`;
        content += `Mentions: ${d.mentions}<br>`;
        content += `Importance: ${d.importance.toFixed(2)}<br>`;
        
        if (d.occurrences.length > 0) {
            const verses = [...new Set(d.occurrences.map(occ => occ.verse))].sort((a, b) => a - b);
            content += `Verses: ${verses.join(', ')}`;
        }

        tooltip.transition()
            .duration(200)
            .style('opacity', .9);
        
        tooltip.html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    }

    /**
     * Show link tooltip
     * @param {Event} event - Mouse event
     * @param {Object} d - Link data
     */
    showLinkTooltip(event, d) {
        const tooltip = this.tooltip;
        
        let content = `<strong>${d.source.name} - ${d.target.name}</strong><br>`;
        content += `Strength: ${d.strength}<br>`;
        content += `Type: ${d.type}<br>`;
        
        if (d.verses) {
            content += `Shared verses: ${d.verses.join(', ')}`;
        }

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
     * Handle node click
     * @param {Object} d - Node data
     */
    onNodeClick(d) {
        // Highlight character in text view
        if (window.narratologyApp) {
            window.narratologyApp.loadView('text');
            // Pass character info to text viewer
            if (window.narratologyApp.textView) {
                window.narratologyApp.textView.highlightCharacter(d.name);
            }
        }
    }

    /**
     * Drag started
     */
    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    /**
     * Dragged
     */
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    /**
     * Drag ended
     */
    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    /**
     * Reset view to default state
     */
    resetView() {
        // Reset zoom to identity transform
        this.svg.transition()
            .duration(750)
            .call(d3.zoom().transform, d3.zoomIdentity);

        // Clear any character filter
        this.currentFilter = 'all';

        // Re-render with all nodes visible
        this.update(this.currentChapter);
    }

    /**
     * Filter network by character type
     * @param {string} filterValue - Filter value ('all', 'spirit', 'jesus', 'disciples')
     */
    filterByCharacter(filterValue) {
        this.currentFilter = filterValue;

        if (filterValue === 'all') {
            // Show all nodes
            this.g.selectAll('.node').style('opacity', 1);
            this.g.selectAll('.link').style('opacity', 0.6);
            return;
        }

        // Define character groups
        const characterGroups = {
            spirit: ['Holy Spirit'],
            jesus: ['Jesus'],
            disciples: ['Peter', 'Andrew', 'James', 'John', 'Philip', 'Bartholomew',
                       'Matthew', 'Thomas', 'James son of Alphaeus', 'Thaddaeus',
                       'Simon the Zealot', 'Judas', 'Disciples']
        };

        const targetCharacters = characterGroups[filterValue] || [];

        // Fade non-matching nodes
        this.g.selectAll('.node').each(function(d) {
            if (!d) return;
            const matches = targetCharacters.includes(d.name);
            d3.select(this).transition()
                .duration(300)
                .style('opacity', matches ? 1 : 0.2);
        });

        // Fade links not connected to matching nodes
        this.g.selectAll('.link').each(function(d) {
            if (!d || !d.source || !d.target) return;
            // Handle both object references (after simulation) and string IDs (before simulation)
            const sourceName = typeof d.source === 'object' ? d.source.name || d.source.id : d.source;
            const targetName = typeof d.target === 'object' ? d.target.name || d.target.id : d.target;
            const sourceMatches = targetCharacters.includes(sourceName);
            const targetMatches = targetCharacters.includes(targetName);
            d3.select(this).transition()
                .duration(300)
                .style('opacity', (sourceMatches || targetMatches) ? 0.6 : 0.1);
        });
    }

    /**
     * Export network data
     * @returns {Object} Network data
     */
    exportData() {
        return {
            nodes: this.nodes,
            links: this.links,
            chapter: this.currentChapter
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkVisualization;
} else {
    window.NetworkVisualization = NetworkVisualization;
}