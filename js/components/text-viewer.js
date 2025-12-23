// Text Viewer Component
// Interactive Greek text viewer with annotations

/**
 * Text Viewer for displaying and annotating Greek text
 */
class TextViewer {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.container = document.getElementById(containerId);
        this.currentChapter = 1;
        this.currentVerse = null;
        this.highlightedCharacter = null;
        this.annotations = new Map();
        
        this.init();
    }

    /**
     * Initialize text viewer
     */
    init() {
        if (!this.container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Create text viewer structure
        this.createViewerStructure();
        
        // Load initial data
        this.update(1);
    }

    /**
     * Create viewer structure
     */
    createViewerStructure() {
        this.container.innerHTML = `
            <div class="text-viewer-header">
                <div class="text-controls">
                    <button id="toggle-greek" class="control-btn active">Greek</button>
                    <button id="toggle-transliteration" class="control-btn">Transliteration</button>
                    <button id="toggle-annotations" class="control-btn active">Annotations</button>
                    <button id="toggle-morphology" class="control-btn">Morphology</button>
                </div>
                <div class="text-search">
                    <input type="text" id="text-search" placeholder="Search text..." />
                    <button id="search-btn">Search</button>
                </div>
            </div>
            <div class="text-viewer-content">
                <div class="text-navigation">
                    <div class="verse-list" id="verse-list"></div>
                </div>
                <div class="text-display" id="text-display"></div>
                <div class="text-details" id="text-details"></div>
            </div>
        `;

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Toggle buttons
        document.getElementById('toggle-greek').addEventListener('click', () => {
            this.toggleDisplay('greek');
        });

        document.getElementById('toggle-transliteration').addEventListener('click', () => {
            this.toggleDisplay('transliteration');
        });

        document.getElementById('toggle-annotations').addEventListener('click', () => {
            this.toggleDisplay('annotations');
        });

        document.getElementById('toggle-morphology').addEventListener('click', () => {
            this.toggleDisplay('morphology');
        });

        // Search
        document.getElementById('search-btn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('text-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
    }

    /**
     * Update viewer for specific chapter
     * @param {number} chapter - Chapter number
     */
    update(chapter) {
        this.currentChapter = chapter;
        this.loadChapter(chapter);
    }

    /**
     * Load chapter data
     * @param {number} chapter - Chapter number
     */
    loadChapter(chapter) {
        const chapterData = conllParser.chapters[chapter];
        if (!chapterData) {
            this.showEmptyState();
            return;
        }

        this.displayVerseList(chapterData);
        this.displayChapterText(chapterData);
        this.displayChapterSummary(chapter);
    }

    /**
     * Display verse list navigation
     * @param {Object} chapterData - Chapter data
     */
    displayVerseList(chapterData) {
        const verseList = document.getElementById('verse-list');
        verseList.innerHTML = '';

        const verses = Object.keys(chapterData).sort((a, b) => parseInt(a) - parseInt(b));

        verses.forEach(verse => {
            const verseItem = document.createElement('div');
            verseItem.className = 'verse-item';
            verseItem.textContent = `${this.currentChapter}:${verse}`;
            
            verseItem.addEventListener('click', () => {
                this.highlightVerse(this.currentChapter, parseInt(verse));
            });

            // Highlight if this verse has Holy Spirit mentions
            const verseText = chapterData[verse].map(s => 
                s.tokens.map(t => t.form).join(' ')
            ).join(' ');

            if (verseText.includes('Πνευμα') || verseText.includes('Πνευματος')) {
                verseItem.classList.add('holy-spirit-verse');
            }

            verseList.appendChild(verseItem);
        });
    }

    /**
     * Display chapter text
     * @param {Object} chapterData - Chapter data
     */
    displayChapterText(chapterData) {
        const textDisplay = document.getElementById('text-display');
        textDisplay.innerHTML = '';

        const verses = Object.keys(chapterData).sort((a, b) => parseInt(a) - parseInt(b));

        verses.forEach(verse => {
            const verseContainer = document.createElement('div');
            verseContainer.className = 'verse-container';
            verseContainer.dataset.verse = verse;

            const verseNumber = document.createElement('span');
            verseNumber.className = 'verse-number';
            verseNumber.textContent = `${this.currentChapter}:${verse}`;
            verseContainer.appendChild(verseNumber);

            const verseText = document.createElement('div');
            verseText.className = 'verse-text';

            // Process each sentence in the verse
            chapterData[verse].forEach(sentence => {
                const sentenceElement = document.createElement('span');
                sentenceElement.className = 'sentence';
                sentenceElement.dataset.sentence = sentence.id;

                // Process each token
                sentence.tokens.forEach(token => {
                    const tokenElement = document.createElement('span');
                    tokenElement.className = 'token';
                    tokenElement.dataset.token = token.id;
                    tokenElement.dataset.lemma = token.lemma;
                    tokenElement.dataset.pos = token.upos;
                    tokenElement.dataset.transliteration = this.transliterate(token.form);
                    tokenElement.dataset.morphology = this.parseMorphology(token.feats);
                    tokenElement.textContent = token.form + ' ';

                    // Check for character names (pass token object for lemma-based matching)
                    const characterName = this.getCharacterName(token);
                    if (characterName) {
                        tokenElement.classList.add('character');
                        tokenElement.dataset.character = characterName;

                        // Special styling for Holy Spirit
                        if (characterName === 'Holy Spirit') {
                            tokenElement.classList.add('holy-spirit');
                        }
                    }

                    // Check for attentional cues
                    const cueType = this.getCueType(token.form);
                    if (cueType) {
                        tokenElement.classList.add('cue', cueType);
                        tokenElement.dataset.cue = cueType;
                    }

                    // Add click handler for token details
                    tokenElement.addEventListener('click', () => {
                        this.showTokenDetails(token);
                    });

                    sentenceElement.appendChild(tokenElement);
                });

                verseText.appendChild(sentenceElement);
            });

            verseContainer.appendChild(verseText);
            textDisplay.appendChild(verseContainer);
        });
    }

    /**
     * Display chapter summary
     * @param {number} chapter - Chapter number
     */
    displayChapterSummary(chapter) {
        const summary = conllParser.getChapterSummary(chapter);
        if (!summary) return;

        const details = document.getElementById('text-details');
        details.innerHTML = `
            <h3>Chapter ${chapter} Summary</h3>
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-label">Verses:</span>
                    <span class="stat-value">${summary.verses}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Sentences:</span>
                    <span class="stat-value">${summary.sentences}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Characters:</span>
                    <span class="stat-value">${summary.characters.length}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Cues:</span>
                    <span class="stat-value">${summary.cues.length}</span>
                </div>
            </div>
            <div class="character-list">
                <h4>Characters Mentioned</h4>
                ${summary.characters.map(char => 
                    `<span class="character-tag" data-character="${char}">${char}</span>`
                ).join('')}
            </div>
            <div class="cue-list">
                <h4>Attentional Cues</h4>
                ${summary.cues.map(cue => 
                    `<div class="cue-item ${cue.type}">
                        <strong>${cue.type}:</strong> ${cue.description}
                        <small>(${cue.chapter}:${cue.verse})</small>
                    </div>`
                ).join('')}
            </div>
        `;

        // Add click handlers for character tags
        details.querySelectorAll('.character-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                this.highlightCharacter(tag.dataset.character);
            });
        });
    }

    /**
     * Get character name from token
     * @param {Object} token - Token object with form and lemma
     * @returns {string|null} Character name
     */
    getCharacterName(token) {
        // Check by lemma (primary method)
        const lemma = typeof token === 'object' ? token.lemma : null;
        if (lemma) {
            for (const [name, character] of conllParser.characters) {
                // Check if this character's occurrences include this lemma
                if (character.occurrences.some(occ => occ.lemma === lemma)) {
                    return name;
                }
            }
        }

        // Fallback: check by form
        const form = typeof token === 'object' ? token.form : token;
        for (const [name, character] of conllParser.characters) {
            if (character.variants.some(variant => form.includes(variant) || variant.includes(form))) {
                return name;
            }
        }
        return null;
    }

    /**
     * Get cue type from token
     * @param {string} token - Token text
     * @returns {string|null} Cue type
     */
    getCueType(token) {
        const cuePatterns = {
            primacy: ['αρχη', 'αρχομαι', 'πρωτος'],
            causal: ['δια', 'εκ', 'απο', 'κατα', 'εν'],
            focalization: ['ειδον', 'ειδεν', 'οραω', 'βλεπω'],
            absence: ['ου', 'μη', 'ουκ', 'μηδεις'],
            prolepsis: ['μελλω', 'εσομαι', 'ηξει', 'ερχομαι']
        };

        for (const [type, keywords] of Object.entries(cuePatterns)) {
            if (keywords.some(keyword => token.includes(keyword))) {
                return type;
            }
        }

        return null;
    }

    /**
     * Show token details
     * @param {Object} token - Token data
     */
    showTokenDetails(token) {
        const details = document.getElementById('text-details');
        
        const transliteration = this.transliterate(token.form);
        const morphology = this.parseMorphology(token.feats);
        
        details.innerHTML = `
            <h3>Token Details</h3>
            <div class="token-details">
                <div class="detail-row">
                    <span class="detail-label">Greek:</span>
                    <span class="detail-value">${token.form}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Transliteration:</span>
                    <span class="detail-value">${transliteration}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Lemma:</span>
                    <span class="detail-value">${token.lemma}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">POS:</span>
                    <span class="detail-value">${token.upos} (${token.xpos})</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Morphology:</span>
                    <span class="detail-value">${morphology}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Dependency:</span>
                    <span class="detail-value">${token.deprel} → ${token.head}</span>
                </div>
            </div>
            <button id="back-to-summary" class="control-btn">Back to Summary</button>
        `;

        document.getElementById('back-to-summary').addEventListener('click', () => {
            this.displayChapterSummary(this.currentChapter);
        });
    }

    /**
     * Transliterate Greek text (including polytonic characters)
     * @param {string} greek - Greek text
     * @returns {string} Transliterated text
     */
    transliterate(greek) {
        // Normalize Greek text to remove diacritics while preserving base letters
        const normalized = greek.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const translitMap = {
            // Lowercase
            'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
            'η': 'ē', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
            'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's',
            'τ': 't', 'υ': 'y', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps', 'ω': 'ō',
            // Uppercase
            'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z',
            'Η': 'Ē', 'Θ': 'Th', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M',
            'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S',
            'Τ': 'T', 'Υ': 'Y', 'Φ': 'Ph', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'Ō',
            // Polytonic variations (common ones)
            'ἀ': 'a', 'ἁ': 'ha', 'ἂ': 'a', 'ἃ': 'ha', 'ἄ': 'a', 'ἅ': 'ha',
            'ἆ': 'a', 'ἇ': 'ha', 'ᾀ': 'a', 'ᾁ': 'ha', 'ᾂ': 'a', 'ᾃ': 'ha',
            'ἐ': 'e', 'ἑ': 'he', 'ἒ': 'e', 'ἓ': 'he', 'ἔ': 'e', 'ἕ': 'he',
            'ἠ': 'ē', 'ἡ': 'hē', 'ἢ': 'ē', 'ἣ': 'hē', 'ἤ': 'ē', 'ἥ': 'hē',
            'ἰ': 'i', 'ἱ': 'hi', 'ἲ': 'i', 'ἳ': 'hi', 'ἴ': 'i', 'ἵ': 'hi',
            'ὀ': 'o', 'ὁ': 'ho', 'ὂ': 'o', 'ὃ': 'ho', 'ὄ': 'o', 'ὅ': 'ho',
            'ὐ': 'y', 'ὑ': 'hy', 'ὒ': 'y', 'ὓ': 'hy', 'ὔ': 'y', 'ὕ': 'hy',
            'ὠ': 'ō', 'ὡ': 'hō', 'ὢ': 'ō', 'ὣ': 'hō', 'ὤ': 'ō', 'ὥ': 'hō',
            // Capital polytonic
            'Ἀ': 'A', 'Ἁ': 'Ha', 'Ἐ': 'E', 'Ἑ': 'He', 'Ἠ': 'Ē', 'Ἡ': 'Hē',
            'Ἰ': 'I', 'Ἱ': 'Hi', 'Ὀ': 'O', 'Ὁ': 'Ho', 'Ὑ': 'Hy', 'Ὠ': 'Ō', 'Ὡ': 'Hō'
        };

        return normalized.split('').map(char => translitMap[char] || char).join('');
    }

    /**
     * Parse morphology features
     * @param {string} feats - Features string
     * @returns {string} Parsed morphology
     */
    parseMorphology(feats) {
        if (!feats || feats === '_') return 'N/A';
        
        const featMap = {
            'Case': 'Case',
            'Number': 'Number',
            'Gender': 'Gender',
            'Tense': 'Tense',
            'Voice': 'Voice',
            'Mood': 'Mood',
            'Person': 'Person'
        };

        const features = feats.split('|');
        const parsed = features.map(feat => {
            const [key, value] = feat.split('=');
            return `${key}: ${value}`;
        });

        return parsed.join(', ');
    }

    /**
     * Highlight specific verse
     * @param {number} chapter - Chapter number
     * @param {number} verse - Verse number
     */
    highlightVerse(chapter, verse) {
        // Remove previous highlights
        document.querySelectorAll('.verse-container').forEach(v => {
            v.classList.remove('highlighted');
        });

        // Highlight selected verse
        const verseElement = document.querySelector(`.verse-container[data-verse="${verse}"]`);
        if (verseElement) {
            verseElement.classList.add('highlighted');
            verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        this.currentVerse = verse;
    }

    /**
     * Highlight character mentions
     * @param {string} characterName - Character name
     */
    highlightCharacter(characterName) {
        // Remove previous highlights
        document.querySelectorAll('.token').forEach(token => {
            token.classList.remove('character-highlight');
        });

        // Highlight character mentions
        document.querySelectorAll(`.token[data-character="${characterName}"]`).forEach(token => {
            token.classList.add('character-highlight');
        });

        this.highlightedCharacter = characterName;
    }

    /**
     * Toggle display options
     * @param {string} option - Display option
     */
    toggleDisplay(option) {
        const button = document.getElementById(`toggle-${option}`);
        button.classList.toggle('active');

        switch (option) {
            case 'greek':
                this.container.classList.toggle('show-greek');
                break;
            case 'transliteration':
                this.container.classList.toggle('show-transliteration');
                break;
            case 'annotations':
                this.container.classList.toggle('show-annotations');
                break;
            case 'morphology':
                this.container.classList.toggle('show-morphology');
                break;
        }
    }

    /**
     * Perform text search
     */
    performSearch() {
        const searchTerm = document.getElementById('text-search').value.trim();
        if (!searchTerm) return;

        // Remove previous search highlights
        document.querySelectorAll('.token').forEach(token => {
            token.classList.remove('search-highlight');
        });

        // Search and highlight
        const tokens = document.querySelectorAll('.token');
        let found = false;

        tokens.forEach(token => {
            if (token.textContent.includes(searchTerm) || 
                token.dataset.lemma.includes(searchTerm)) {
                token.classList.add('search-highlight');
                found = true;
            }
        });

        if (found) {
            this.showNotification(`Found ${document.querySelectorAll('.search-highlight').length} matches`, 'success');
        } else {
            this.showNotification('No matches found', 'info');
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const textDisplay = document.getElementById('text-display');
        textDisplay.innerHTML = '<div class="empty-state">No data available for this chapter</div>';
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
     * Export text data
     * @returns {Object} Text data
     */
    exportData() {
        return {
            chapter: this.currentChapter,
            text: this.container.querySelector('.text-display').innerHTML,
            annotations: Array.from(this.annotations.entries())
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextViewer;
} else {
    window.TextViewer = TextViewer;
}