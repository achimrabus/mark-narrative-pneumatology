// Enhanced Search Component
// Provides advanced search functionality with fuzzy matching and syntax support

/**
 * Enhanced Search for Greek text and linguistic data
 */
class EnhancedSearch {
    constructor() {
        this.searchIndex = null;
        this.fuseOptions = {
            keys: ['form', 'lemma', 'transliteration'],
            threshold: 0.3,
            includeScore: true,
            includeMatches: true
        };
        this.init();
    }

    /**
     * Initialize enhanced search
     */
    init() {
        // Wait for data to be loaded
        if (window.conllParser && window.conllParser.data) {
            this.buildSearchIndex();
        } else {
            // Listen for data load event
            document.addEventListener('dataLoaded', () => {
                this.buildSearchIndex();
            });
        }
    }

    /**
     * Build search index from CONLL data
     */
    buildSearchIndex() {
        if (!window.conllParser || !window.conllParser.data) {
            console.warn('No data available for search indexing');
            return;
        }

        const searchData = [];
        
        // Index all tokens from the CONLL data
        for (const sentence of window.conllParser.data.sentences) {
            for (const token of sentence.tokens) {
                const transliteration = this.transliterate(token.form);
                
                searchData.push({
                    id: `${sentence.id}-${token.id}`,
                    form: token.form,
                    lemma: token.lemma,
                    transliteration: transliteration,
                    upos: token.upos,
                    chapter: sentence.chapter,
                    verse: sentence.verse,
                    sentence: sentence.id,
                    text: `${token.form} (${token.lemma})`
                });
            }
        }

        this.searchIndex = searchData;
    }

    /**
     * Perform enhanced search
     * @param {string} query - Search query with syntax
     * @returns {Array} Search results
     */
    search(query) {
        if (!this.searchIndex) {
            return [];
        }

        // Parse search syntax
        const parsedQuery = this.parseSearchQuery(query);
        
        // Perform search based on query type
        let results;
        if (parsedQuery.type === 'fuzzy') {
            results = this.fuzzySearch(parsedQuery.term);
        } else if (parsedQuery.type === 'exact') {
            results = this.exactSearch(parsedQuery.term);
        } else if (parsedQuery.type === 'transliteration') {
            results = this.transliterationSearch(parsedQuery.term);
        } else {
            results = this.basicSearch(parsedQuery.term);
        }

        return results;
    }

    /**
     * Parse search query for special syntax
     * @param {string} query - Raw query
     * @returns {Object} Parsed query object
     */
    parseSearchQuery(query) {
        const trimmed = query.trim();
        
        // Check for fuzzy modifier
        if (trimmed.startsWith('~')) {
            return {
                type: 'fuzzy',
                term: trimmed.substring(1).trim()
            };
        }
        
        // Check for transliteration modifier
        if (trimmed.startsWith('latin:')) {
            return {
                type: 'transliteration',
                term: trimmed.substring(6).trim()
            };
        }
        
        // Check for exact match (quotes)
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return {
                type: 'exact',
                term: trimmed.slice(1, -1)
            };
        }
        
        // Basic search
        return {
            type: 'basic',
            term: trimmed
        };
    }

    /**
     * Fuzzy search using Fuse.js
     * @param {string} term - Search term
     * @returns {Array} Results
     */
    fuzzySearch(term) {
        if (!window.Fuse) {
            console.warn('Fuse.js not loaded, falling back to basic search');
            return this.basicSearch(term);
        }

        const fuse = new Fuse(this.searchIndex, this.fuseOptions);
        return fuse.search(term).map(result => ({
            ...result.item,
            score: result.score,
            matches: result.matches
        }));
    }

    /**
     * Exact search
     * @param {string} term - Search term
     * @returns {Array} Results
     */
    exactSearch(term) {
        return this.searchIndex.filter(item => 
            item.form === term || 
            item.lemma === term || 
            item.transliteration === term
        );
    }

    /**
     * Transliteration search
     * @param {string} term - Latin transliteration term
     * @returns {Array} Results
     */
    transliterationSearch(term) {
        return this.searchIndex.filter(item => 
            item.transliteration.toLowerCase().includes(term.toLowerCase())
        );
    }

    /**
     * Basic search with wildcards
     * @param {string} term - Search term
     * @returns {Array} Results
     */
    basicSearch(term) {
        // Convert wildcards to regex
        const regexPattern = term
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
            .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape special chars
        
        const regex = new RegExp(regexPattern, 'i');
        
        return this.searchIndex.filter(item => 
            regex.test(item.form) || 
            regex.test(item.lemma) || 
            regex.test(item.transliteration)
        );
    }

    /**
     * Transliterate Greek text to Latin
     * @param {string} greek - Greek text
     * @returns {string} Transliterated text
     */
    transliterate(greek) {
        const translitMap = {
            'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
            'η': 'ē', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
            'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
            'τ': 't', 'υ': 'u', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps', 'ω': 'ō',
            'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z',
            'Η': 'Ē', 'Θ': 'Th', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M',
            'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S',
            'Τ': 'T', 'Υ': 'U', 'Φ': 'Ph', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'Ō'
        };

        return greek.split('').map(char => translitMap[char] || char).join('');
    }

    /**
     * Get search help text
     * @returns {string} Help text
     */
    getHelpText() {
        return `
Enhanced Search Syntax:
• Basic: θεος (matches θεος, θεου, etc.)
• Wildcard: θε* (matches θεος, θεου, θεον, etc.)
• Single char: θε?ς (matches θεος, θεας, etc.)
• Fuzzy: ~θεος (finds similar words)
• Exact: "θεος" (exact match only)
• Transliteration: latin:theos (search in Latin script)
        `;
    }
}

// Create singleton instance
const enhancedSearch = new EnhancedSearch();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedSearch;
} else {
    window.EnhancedSearch = EnhancedSearch;
    window.enhancedSearch = enhancedSearch;
}