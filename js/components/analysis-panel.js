// Analysis Panel Component
// AI-powered narratological analysis results

/**
 * Analysis Panel for displaying AI analysis results
 */
class AnalysisPanel {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.container = document.getElementById(containerId);
        this.currentChapter = 1;
        this.analysisResults = null;
        
        this.init();
    }

    /**
     * Initialize analysis panel
     */
    init() {
        if (!this.container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Create panel structure
        this.createPanelStructure();
        
        // Load initial data
        this.update(1);
    }

    /**
     * Create panel structure
     */
    createPanelStructure() {
        this.container.innerHTML = `
            <div class="analysis-header">
                <h2>Narratological Analysis</h2>
                <div class="analysis-controls">
                    <button id="run-analysis" class="btn-primary">Run Analysis</button>
                    <button id="export-analysis" class="btn-secondary">Export Results</button>
                    <button id="clear-analysis" class="btn-secondary">Clear</button>
                </div>
            </div>
            <div class="analysis-content">
                <div class="analysis-tabs">
                    <button class="tab-btn active" data-tab="cues">Attentional Cues</button>
                    <button class="tab-btn" data-tab="characters">Character Analysis</button>
                    <button class="tab-btn" data-tab="patterns">Narrative Patterns</button>
                    <button class="tab-btn" data-tab="holy-spirit">Holy Spirit Focus</button>
                </div>
                <div class="analysis-body">
                    <div id="analysis-loading" class="analysis-loading" style="display: none;">
                        <div class="spinner"></div>
                        <p>Running analysis...</p>
                    </div>
                    <div id="analysis-results" class="analysis-results">
                        <div class="tab-content active" id="cues-tab">
                            <div class="analysis-placeholder">
                                <h3>Attentional Cues</h3>
                                <p>Click "Run Analysis" to detect attentional cues in this chapter.</p>
                            </div>
                        </div>
                        <div class="tab-content" id="characters-tab">
                            <div class="analysis-placeholder">
                                <h3>Character Analysis</h3>
                                <p>Character relationships and roles will appear here after analysis.</p>
                            </div>
                        </div>
                        <div class="tab-content" id="patterns-tab">
                            <div class="analysis-placeholder">
                                <h3>Narrative Patterns</h3>
                                <p>Recurring narrative techniques and patterns will be identified here.</p>
                            </div>
                        </div>
                        <div class="tab-content" id="holy-spirit-tab">
                            <div class="analysis-placeholder">
                                <h3>Holy Spirit Analysis</h3>
                                <p>Specific analysis of Holy Spirit as background character.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Analysis controls
        document.getElementById('run-analysis').addEventListener('click', () => {
            this.runAnalysis();
        });

        document.getElementById('export-analysis').addEventListener('click', () => {
            this.exportResults();
        });

        document.getElementById('clear-analysis').addEventListener('click', () => {
            this.clearResults();
        });
    }

    /**
     * Update panel for specific chapter
     * @param {number} chapter - Chapter number
     */
    update(chapter) {
        this.currentChapter = chapter;
        this.updateChapterInfo();
    }

    /**
     * Update chapter information
     */
    updateChapterInfo() {
        const summary = conllParser.getChapterSummary(this.currentChapter);
        if (!summary) return;

        // Update header with chapter info
        const header = this.container.querySelector('.analysis-header h2');
        header.textContent = `Chapter ${this.currentChapter} - Narratological Analysis`;
    }

    /**
     * Switch analysis tab
     * @param {string} tabName - Tab name
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    /**
     * Run AI analysis
     */
    async runAnalysis() {
        if (!window.apiClient) {
            this.showError('API client not available');
            return;
        }

        try {
            this.showLoading(true);

            // Get chapter text - try multiple approaches
            let chapterText = conllParser.getTextRange(this.currentChapter, 1, 50);
            
            // If no text from range, try to get any available text
            if (!chapterText || chapterText.trim() === '') {
                // Try to get text from the first few sentences of the chapter
                if (conllParser.data && conllParser.data.sentences) {
                    const chapterSentences = conllParser.data.sentences.filter(s => s.chapter === this.currentChapter);
                    if (chapterSentences.length > 0) {
                        chapterText = chapterSentences.slice(0, 10).map(s =>
                            s.tokens.map(t => t.form).join(' ')
                        ).join(' ');
                    }
                }
                
                // If still no text, try to get any text at all
                if (!chapterText || chapterText.trim() === '') {
                    if (conllParser.data && conllParser.data.sentences && conllParser.data.sentences.length > 0) {
                        chapterText = conllParser.data.sentences.slice(0, 20).map(s =>
                            s.tokens.map(t => t.form).join(' ')
                        ).join(' ');
                    }
                }
            }
            
            if (!chapterText || chapterText.trim() === '') {
                throw new Error('No text available for analysis. Please check if the CONLL data is properly loaded.');
            }

            // Run different types of analysis
            const [cues, characters, patterns] = await Promise.all([
                this.detectCues(chapterText),
                this.analyzeCharacters(chapterText),
                this.recognizePatterns(chapterText)
            ]);

            // Store results
            this.analysisResults = {
                chapter: this.currentChapter,
                cues,
                characters,
                patterns,
                timestamp: new Date().toISOString()
            };

            // Display results
            this.displayResults();

            this.showLoading(false);
            this.showNotification('Analysis complete', 'success');

        } catch (error) {
            console.error('Analysis failed:', error);
            this.showLoading(false);
            this.showError('Analysis failed: ' + error.message);
        }
    }

    /**
     * Detect attentional cues
     * @param {string} text - Text to analyze
     * @returns {Promise<Array>} Detected cues
     */
    async detectCues(text) {
        try {
            return await apiClient.detectCues(text);
        } catch (error) {
            console.error('Cue detection failed:', error);
            return [];
        }
    }

    /**
     * Analyze characters
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Character analysis
     */
    async analyzeCharacters(text) {
        try {
            const characters = Array.from(conllParser.characters.values());
            return await apiClient.analyzeCharacters(characters, text);
        } catch (error) {
            console.error('Character analysis failed:', error);
            return null;
        }
    }

    /**
     * Recognize narrative patterns
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Pattern analysis
     */
    async recognizePatterns(text) {
        try {
            // Create segments for pattern analysis
            const segments = [];
            
            // Try to get verse-level segments if chapter data exists
            if (conllParser.chapters && conllParser.chapters[this.currentChapter]) {
                for (const verse in conllParser.chapters[this.currentChapter]) {
                    const verseText = conllParser.getTextRange(this.currentChapter, parseInt(verse), parseInt(verse));
                    if (verseText && verseText.trim() !== '') {
                        segments.push({
                            verse: parseInt(verse),
                            text: verseText
                        });
                    }
                }
            }
            
            // If no verse segments, create sentence-level segments
            if (segments.length === 0 && conllParser.data && conllParser.data.sentences) {
                const chapterSentences = conllParser.data.sentences.filter(s => s.chapter === this.currentChapter);
                if (chapterSentences.length > 0) {
                    chapterSentences.forEach((sentence, index) => {
                        const sentenceText = sentence.tokens.map(t => t.form).join(' ');
                        if (sentenceText && sentenceText.trim() !== '') {
                            segments.push({
                                verse: index + 1, // Use sentence index as verse number
                                text: sentenceText
                            });
                        }
                    });
                }
            }
            
            // If still no segments, use the whole text as one segment
            if (segments.length === 0 && text) {
                segments.push({
                    verse: 1,
                    text: text
                });
            }

            return await apiClient.recognizePatterns(segments);
        } catch (error) {
            console.error('Pattern recognition failed:', error);
            return null;
        }
    }

    /**
     * Display analysis results
     */
    displayResults() {
        if (!this.analysisResults) return;

        this.displayCues();
        this.displayCharacterAnalysis();
        this.displayPatterns();
        this.displayHolySpiritAnalysis();
    }

    /**
     * Get cue type display name
     * @param {string} type - Cue type key
     * @returns {string} Display name
     */
    getCueTypeName(type) {
        const names = {
            primacy: 'Primacy Effect',
            causal: 'Causal Implication',
            focalization: 'Focalization Shift',
            absence: 'Conspicuous Absence',
            prolepsis: 'Prolepsis'
        };
        return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Get tooltip HTML for a cue type
     * @param {string} type - Cue type key
     * @returns {string} Tooltip HTML
     */
    getCueTooltipHTML(type) {
        // Use the global function if available
        if (window.CONSTANTS && window.CONSTANTS.getCueTooltipHTML) {
            return window.CONSTANTS.getCueTooltipHTML(type);
        }

        // Fallback explanations
        const explanations = {
            primacy: {
                name: 'Primacy Effect',
                desc: 'Early mention establishing character importance. First impressions influence how readers track and interpret characters throughout the narrative.'
            },
            causal: {
                name: 'Causal Implication',
                desc: 'Attribution of action or influence to a character. Events are explained as caused by a character who may not be physically present.'
            },
            focalization: {
                name: 'Focalization Shift',
                desc: 'Change in narrative perspective. The narrator grants access to a character\'s perception or viewpoint.'
            },
            absence: {
                name: 'Conspicuous Absence',
                desc: 'Notable omission of expected elements. When expected characters or actions are missing, readers notice and construct explanations.'
            },
            prolepsis: {
                name: 'Prolepsis',
                desc: 'Forward reference anticipating future action. Creates expectation and keeps characters in reader awareness.'
            }
        };

        const exp = explanations[type];
        if (!exp) return '';

        return `
            <div class="cue-tooltip-content">
                <div class="cue-tooltip-header"><strong>${exp.name}</strong></div>
                <div class="cue-tooltip-body"><p>${exp.desc}</p></div>
            </div>
        `;
    }

    /**
     * Display attentional cues
     */
    displayCues() {
        const cuesTab = document.getElementById('cues-tab');

        if (!this.analysisResults.cues || this.analysisResults.cues.length === 0) {
            cuesTab.innerHTML = `
                <div class="no-results">
                    <p>No attentional cues detected in this chapter.</p>
                </div>
            `;
            return;
        }

        // Group cues by type
        const cuesByType = {};
        this.analysisResults.cues.forEach(cue => {
            if (!cuesByType[cue.type]) {
                cuesByType[cue.type] = [];
            }
            cuesByType[cue.type].push(cue);
        });

        let html = '<div class="cues-analysis">';

        for (const [type, cues] of Object.entries(cuesByType)) {
            const tooltipHTML = this.getCueTooltipHTML(type);
            const typeName = this.getCueTypeName(type);

            html += `
                <div class="cue-type-section">
                    <h4>
                        <span class="cue-type-header">
                            ${typeName} Cues (${cues.length})
                            <span class="cue-help-icon" title="What is ${typeName}?">?
                                <span class="cue-tooltip">${tooltipHTML}</span>
                            </span>
                        </span>
                    </h4>
                    <div class="cue-list">
            `;

            cues.forEach(cue => {
                // Handle both AI-detected cues and parser-detected cues
                const location = cue.location || `Verse ${cue.verse || 'N/A'}`;
                const confidence = cue.confidence ? `Confidence: ${(cue.confidence * 100).toFixed(1)}%` : '';
                const explanation = cue.explanation || cue.description || 'Detected by pattern matching';

                html += `
                    <div class="cue-item ${type}">
                        <div class="cue-header">
                            <span class="cue-location">${this.escapeHtml(location)}</span>
                            ${confidence ? `<span class="cue-confidence">${confidence}</span>` : ''}
                        </div>
                        <div class="cue-explanation">${this.escapeHtml(explanation)}</div>
                    </div>
                `;
            });

            html += '</div></div>';
        }

        html += '</div>';
        cuesTab.innerHTML = html;
    }

    /**
     * Display character analysis
     */
    displayCharacterAnalysis() {
        const charactersTab = document.getElementById('characters-tab');
        
        if (!this.analysisResults.characters) {
            charactersTab.innerHTML = `
                <div class="no-results">
                    <p>Character analysis not available.</p>
                </div>
            `;
            return;
        }

        // Get character statistics for this chapter
        const chapterChars = new Map();
        for (const [name, character] of conllParser.characters) {
            const chapterOccurrences = character.occurrences.filter(occ => occ.chapter === this.currentChapter);
            if (chapterOccurrences.length > 0) {
                chapterChars.set(name, {
                    name,
                    mentions: chapterOccurrences.length,
                    totalMentions: character.totalMentions,
                    verses: [...new Set(chapterOccurrences.map(occ => occ.verse))].sort((a, b) => a - b)
                });
            }
        }

        let html = '<div class="character-analysis">';
        
        // Sort by mentions
        const sortedChars = Array.from(chapterChars.values()).sort((a, b) => b.mentions - a.mentions);
        
        sortedChars.forEach(char => {
            const importance = (char.mentions / sortedChars[0].mentions).toFixed(2);
            
            html += `
                <div class="character-card ${char.name === 'Holy Spirit' ? 'holy-spirit' : ''}">
                    <h4>${char.name}</h4>
                    <div class="character-stats">
                        <div class="stat">
                            <span class="stat-label">Mentions:</span>
                            <span class="stat-value">${char.mentions}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Total in Mark:</span>
                            <span class="stat-value">${char.totalMentions}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Verses:</span>
                            <span class="stat-value">${char.verses.join(', ')}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Relative Importance:</span>
                            <span class="stat-value">${importance}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        charactersTab.innerHTML = html;
    }

    /**
     * Display narrative patterns
     */
    displayPatterns() {
        const patternsTab = document.getElementById('patterns-tab');

        if (!this.analysisResults.patterns) {
            patternsTab.innerHTML = `
                <div class="no-results">
                    <p>Pattern analysis not available.</p>
                </div>
            `;
            return;
        }

        // Parse the pattern response (it may be raw text or structured)
        const patterns = this.parsePatternResponse(this.analysisResults.patterns);

        let html = '<div class="patterns-analysis">';
        html += '<h4>Identified Narrative Patterns</h4>';

        if (patterns.structured) {
            // Render structured pattern data
            if (patterns.characterIntroduction && patterns.characterIntroduction.length > 0) {
                html += `
                    <div class="pattern-section">
                        <h5>Character Introduction Patterns</h5>
                        <ul class="pattern-list">
                            ${patterns.characterIntroduction.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (patterns.sceneTransitions && patterns.sceneTransitions.length > 0) {
                html += `
                    <div class="pattern-section">
                        <h5>Scene Transition Patterns</h5>
                        <ul class="pattern-list">
                            ${patterns.sceneTransitions.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (patterns.attentionalCues && patterns.attentionalCues.length > 0) {
                html += `
                    <div class="pattern-section">
                        <h5>Attentional Cue Distribution</h5>
                        <ul class="pattern-list">
                            ${patterns.attentionalCues.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (patterns.narrativeRhythm && patterns.narrativeRhythm.length > 0) {
                html += `
                    <div class="pattern-section">
                        <h5>Narrative Rhythm</h5>
                        <ul class="pattern-list">
                            ${patterns.narrativeRhythm.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            if (patterns.other && patterns.other.length > 0) {
                html += `
                    <div class="pattern-section">
                        <h5>Additional Observations</h5>
                        <ul class="pattern-list">
                            ${patterns.other.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        } else {
            // Render raw text response with formatting
            html += `
                <div class="pattern-section raw-analysis">
                    <div class="pattern-text">${this.formatAnalysisText(patterns.raw)}</div>
                </div>
            `;
        }

        html += '</div>';
        patternsTab.innerHTML = html;
    }

    /**
     * Parse pattern recognition API response
     * @param {Object|string} response - API response
     * @returns {Object} Parsed patterns
     */
    parsePatternResponse(response) {
        try {
            // Extract content from normalized response
            let content = '';
            if (response && response.content) {
                content = response.content;
            } else if (response && response.choices && response.choices[0]) {
                content = response.choices[0].message.content;
            } else if (typeof response === 'string') {
                content = response;
            }

            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    structured: true,
                    characterIntroduction: parsed.character_introduction || parsed.characterIntroduction || [],
                    sceneTransitions: parsed.scene_transitions || parsed.sceneTransitions || [],
                    attentionalCues: parsed.attentional_cues || parsed.attentionalCues || [],
                    narrativeRhythm: parsed.narrative_rhythm || parsed.narrativeRhythm || [],
                    other: parsed.other || parsed.observations || []
                };
            }

            // Return raw text if not JSON
            return {
                structured: false,
                raw: content
            };
        } catch (error) {
            console.error('Error parsing pattern response:', error);
            return {
                structured: false,
                raw: typeof response === 'string' ? response : JSON.stringify(response, null, 2)
            };
        }
    }

    /**
     * Format analysis text for display (convert markdown-like formatting)
     * @param {string} text - Raw text
     * @returns {string} Formatted HTML
     */
    formatAnalysisText(text) {
        if (!text) return '<p>No analysis available.</p>';

        // Escape HTML first
        let formatted = this.escapeHtml(text);

        // Convert markdown-style formatting
        formatted = formatted
            // Headers
            .replace(/^### (.+)$/gm, '<h5>$1</h5>')
            .replace(/^## (.+)$/gm, '<h4>$1</h4>')
            .replace(/^# (.+)$/gm, '<h3>$1</h3>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Lists
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // Wrap list items
        formatted = formatted.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');

        return `<p>${formatted}</p>`;
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Raw text
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Display Holy Spirit specific analysis
     */
    displayHolySpiritAnalysis() {
        const holySpiritTab = document.getElementById('holy-spirit-tab');
        
        // Get Holy Spirit specific data
        const holySpiritData = conllParser.characters.get('Holy Spirit');
        const chapterCues = conllParser.getCuesInChapter(this.currentChapter).filter(cue => 
            cue.type === 'causal' && (cue.text.includes('Πνευμα') || cue.text.includes('Πνευματος'))
        );

        let html = '<div class="holy-spirit-analysis">';
        
        if (holySpiritData) {
            const chapterOccurrences = holySpiritData.occurrences.filter(occ => occ.chapter === this.currentChapter);
            
            html += `
                <div class="holy-spirit-summary">
                    <h4>Holy Spirit in Chapter ${this.currentChapter}</h4>
                    <div class="hs-stats">
                        <div class="stat">
                            <span class="stat-label">Mentions:</span>
                            <span class="stat-value">${chapterOccurrences.length}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Total in Mark:</span>
                            <span class="stat-value">${holySpiritData.totalMentions}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Causal Cues:</span>
                            <span class="stat-value">${chapterCues.length}</span>
                        </div>
                    </div>
                </div>
            `;

            if (chapterOccurrences.length > 0) {
                html += '<div class="hs-occurrences"><h5>Occurrences:</h5><ul>';
                chapterOccurrences.forEach(occ => {
                    html += `<li>Verse ${occ.verse}: ${occ.form}</li>`;
                });
                html += '</ul></div>';
            }

            if (chapterCues.length > 0) {
                html += '<div class="hs-cues"><h5>Causal Relationships:</h5><ul>';
                chapterCues.forEach(cue => {
                    html += `<li>${cue.description} (v${cue.verse})</li>`;
                });
                html += '</ul></div>';
            }
        } else {
            html += '<p>Holy Spirit not mentioned in this chapter.</p>';
        }
        
        html += '</div>';
        holySpiritTab.innerHTML = html;
    }

    /**
     * Show/hide loading indicator
     * @param {boolean} show - Show loading
     */
    showLoading(show) {
        const loading = document.getElementById('analysis-loading');
        const results = document.getElementById('analysis-results');
        
        if (show) {
            loading.style.display = 'block';
            results.style.display = 'none';
        } else {
            loading.style.display = 'none';
            results.style.display = 'block';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Clear analysis results
     */
    clearResults() {
        this.analysisResults = null;
        
        // Reset all tabs to placeholder content
        document.getElementById('cues-tab').innerHTML = `
            <div class="analysis-placeholder">
                <h3>Attentional Cues</h3>
                <p>Click "Run Analysis" to detect attentional cues in this chapter.</p>
            </div>
        `;
        
        document.getElementById('characters-tab').innerHTML = `
            <div class="analysis-placeholder">
                <h3>Character Analysis</h3>
                <p>Character relationships and roles will appear here after analysis.</p>
            </div>
        `;
        
        document.getElementById('patterns-tab').innerHTML = `
            <div class="analysis-placeholder">
                <h3>Narrative Patterns</h3>
                <p>Recurring narrative techniques and patterns will be identified here.</p>
            </div>
        `;
        
        document.getElementById('holy-spirit-tab').innerHTML = `
            <div class="analysis-placeholder">
                <h3>Holy Spirit Analysis</h3>
                <p>Specific analysis of Holy Spirit as background character.</p>
            </div>
        `;
    }

    /**
     * Export analysis results
     */
    exportResults() {
        if (!this.analysisResults) {
            this.showNotification('No results to export', 'warning');
            return;
        }

        const exportData = {
            ...this.analysisResults,
            chapterSummary: conllParser.getChapterSummary(this.currentChapter),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chapter-${this.currentChapter}-analysis.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Results exported successfully', 'success');
    }

    /**
     * Get analysis results
     * @returns {Object} Analysis results
     */
    getResults() {
        return this.analysisResults;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisPanel;
} else {
    window.AnalysisPanel = AnalysisPanel;
}