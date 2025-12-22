// Search Integration Component
// Integrates enhanced search capabilities with the text viewer

/**
 * Search Integration for enhanced text search
 */
class SearchIntegration {
    constructor(textViewer) {
        this.textViewer = textViewer;
        this.searchEngine = new EnhancedSearch();
        this.searchResults = [];
        this.currentResultIndex = 0;
        
        this.initializeSearch();
    }

    /**
     * Initialize search functionality
     */
    initializeSearch() {
        // Initialize search index when data is available
        if (window.conllParser && window.conllParser.data) {
            this.searchEngine.initializeIndex(window.conllParser.data);
        }

        // Enhanced search UI
        this.createSearchInterface();
    }

    /**
     * Create enhanced search interface
     */
    createSearchInterface() {
        const searchContainer = document.querySelector('.text-search');
        if (!searchContainer) return;

        searchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <input type="text" id="enhanced-search" placeholder="Enhanced search (use *, ?, ~, latin:)" />
                <div class="search-controls">
                    <button id="search-btn" title="Search">🔍</button>
                    <button id="clear-search-btn" title="Clear">✕</button>
                    <button id="search-options-btn" title="Search options">⚙</button>
                </div>
            </div>
            <div class="search-options" id="search-options" style="display: none;">
                <label>
                    <input type="checkbox" id="fuzzy-search"> Fuzzy search
                </label>
                <label>
                    <input type="checkbox" id="latin-search"> Latin transliteration
                </label>
                <label>
                    <input type="checkbox" id="wildcard-search"> Wildcards (*,?)
                </label>
            </div>
            <div class="search-results" id="search-results"></div>
            <div class="search-navigation" id="search-navigation" style="display: none;">
                <button id="prev-result">← Previous</button>
                <span id="result-counter">0 / 0</span>
                <button id="next-result">Next →</button>
            </div>
        `;

        this.setupSearchEventListeners();
    }

    /**
     * Setup search event listeners
     */
    setupSearchEventListeners() {
        const searchInput = document.getElementById('enhanced-search');
        const searchBtn = document.getElementById('search-btn');
        const clearBtn = document.getElementById('clear-search-btn');
        const optionsBtn = document.getElementById('search-options-btn');
        const prevBtn = document.getElementById('prev-result');
        const nextBtn = document.getElementById('next-result');

        // Search on input
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.length >= 2) {
                this.performSearch(e.target.value);
            } else {
                this.clearResults();
            }
        });

        // Search button
        searchBtn.addEventListener('click', () => {
            this.performSearch(searchInput.value);
        });

        // Clear button
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.clearResults();
        });

        // Options toggle
        optionsBtn.addEventListener('click', () => {
            const options = document.getElementById('search-options');
            options.style.display = options.style.display === 'none' ? 'block' : 'none';
        });

        // Navigation
        prevBtn.addEventListener('click', () => {
            this.navigateResult(-1);
        });

        nextBtn.addEventListener('click', () => {
            this.navigateResult(1);
        });

        // Keyboard shortcuts
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            } else if (e.key === 'Escape') {
                this.clearResults();
            }
        });
    }

    /**
     * Perform enhanced search
     * @param {string} query - Search query
     */
    performSearch(query) {
        if (!query.trim()) {
            this.clearResults();
            return;
        }

        try {
            this.searchResults = this.searchEngine.search(query);
            this.displayResults();
            this.updateNavigation();
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('Search failed: ' + error.message);
        }
    }

    /**
     * Display search results
     */
    displayResults() {
        const resultsContainer = document.getElementById('search-results');
        const navigation = document.getElementById('search-navigation');

        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No matches found</div>';
            navigation.style.display = 'none';
            return;
        }

        let html = `<div class="results-summary">Found ${this.searchResults.length} results:</div>`;
        
        this.searchResults.forEach((result, index) => {
            const matchType = result.matchType || 'exact';
            const score = result.score ? (result.score * 100).toFixed(1) : '100';
            
            html += `
                <div class="search-result ${matchType}" data-index="${index}">
                    <div class="result-header">
                        <span class="result-text">${result.text}</span>
                        <span class="result-meta">
                            ${result.chapter}:${result.verse} 
                            (${matchType}, ${score}%)
                        </span>
                    </div>
                    <div class="result-details">
                        Lemma: ${result.lemma} | 
                        POS: ${result.pos} | 
                        Transliteration: ${this.searchEngine.transliterate(result.text)}
                    </div>
                </div>
            `;
        });

        resultsContainer.innerHTML = html;
        navigation.style.display = 'flex';

        // Add click handlers
        resultsContainer.querySelectorAll('.search-result').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.goToResult(index);
            });
        });
    }

    /**
     * Update navigation controls
     */
    updateNavigation() {
        const counter = document.getElementById('result-counter');
        const prevBtn = document.getElementById('prev-result');
        const nextBtn = document.getElementById('next-result');

        if (this.searchResults.length === 0) {
            counter.textContent = '0 / 0';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        counter.textContent = `${this.currentResultIndex + 1} / ${this.searchResults.length}`;
        prevBtn.disabled = this.currentResultIndex === 0;
        nextBtn.disabled = this.currentResultIndex === this.searchResults.length - 1;
    }

    /**
     * Navigate to specific result
     * @param {number} index - Result index
     */
    goToResult(index) {
        if (index < 0 || index >= this.searchResults.length) return;
        
        this.currentResultIndex = index;
        const result = this.searchResults[index];
        
        // Highlight in text viewer
        this.textViewer.highlightVerse(result.chapter, result.verse);
        
        // Highlight specific token
        const token = document.querySelector(`.token[data-token="${result.token}"]`);
        if (token) {
            token.classList.add('search-highlight');
            token.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        this.updateNavigation();
    }

    /**
     * Navigate results
     * @param {number} direction - Direction (-1 or 1)
     */
    navigateResult(direction) {
        const newIndex = this.currentResultIndex + direction;
        this.goToResult(newIndex);
    }

    /**
     * Clear search results
     */
    clearResults() {
        this.searchResults = [];
        this.currentResultIndex = 0;
        
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-navigation').style.display = 'none';
        
        // Remove highlights
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
    }

    /**
     * Show search error
     * @param {string} message - Error message
     */
    showSearchError(message) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = `<div class="search-error">${message}</div>`;
    }

    /**
     * Get search suggestions
     * @param {string} query - Partial query
     * @returns {Array} Suggestions
     */
    getSuggestions(query) {
        return this.searchEngine.getSuggestions(query);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchIntegration;
} else {
    window.SearchIntegration = SearchIntegration;
}