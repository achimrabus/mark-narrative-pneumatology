// CONLL File Parser for Ancient Greek Gospel of Mark (PROIEL)
// Processes the mark_complete.conllu file for narratological analysis

/**
 * CONLL Parser for processing Greek New Testament linguistic data
 */
class CONLLParser {
    constructor() {
        this.data = null;
        this.chapters = {};
        this.characters = new Map();
        this.verses = {};
    }

    /**
     * Parse CONLL file content
     * @param {string} content - Raw CONLL file content
     * @returns {Object} Parsed data structure
     */
    parse(content) {
        const lines = content.split('\n');
        const sentences = [];
        let currentSentence = [];
        let sentenceId = 0;
        let currentBook = 'Mark';
        let currentChapter = null;
        let currentVerse = null;
        let currentSentenceText = null;

        for (const line of lines) {
            const trimmed = line.trim();

            // Parse comment lines for metadata
            if (trimmed.startsWith('#')) {
                // Extract chapter from source line: "# source = The Greek New Testament, Mark 5"
                if (trimmed.startsWith('# source =')) {
                    const sourceMatch = trimmed.match(/Mark\s+(\d+)/);
                    if (sourceMatch) {
                        currentChapter = parseInt(sourceMatch[1]);
                    }
                }
                // Extract sentence text
                if (trimmed.startsWith('# text =')) {
                    currentSentenceText = trimmed.substring(8).trim();
                }
                continue;
            }

            // Skip empty lines
            if (!trimmed) {
                if (currentSentence.length > 0) {
                    sentences.push({
                        id: sentenceId++,
                        tokens: currentSentence,
                        book: currentBook,
                        chapter: currentChapter,
                        verse: currentVerse,
                        text: currentSentenceText
                    });
                    currentSentence = [];
                    currentSentenceText = null;
                }
                continue;
            }

            // Parse CONLL line (tab-separated values)
            const fields = trimmed.split('\t');
            if (fields.length < 10) continue;

            const token = {
                id: parseInt(fields[0]),
                form: fields[1],        // Greek word form
                lemma: fields[2],       // Lemma
                upos: fields[3],        // Universal POS tag
                xpos: fields[4],        // Language-specific POS tag
                feats: fields[5],       // Morphological features
                head: fields[6],        // Head of dependency
                deprel: fields[7],      // Dependency relation
                deps: fields[8],        // Enhanced dependencies
                misc: fields[9]         // Miscellaneous information
            };

            // Extract chapter and verse from Ref field: "Ref=MARK_5.1"
            if (token.misc && token.misc.includes('Ref=MARK_')) {
                const refMatch = token.misc.match(/Ref=MARK_(\d+)\.(\d+)/);
                if (refMatch) {
                    const chapterFromRef = parseInt(refMatch[1]);
                    const verseFromRef = parseInt(refMatch[2]);

                    // Update current chapter/verse (use first token's reference)
                    if (currentSentence.length === 0) {
                        currentChapter = chapterFromRef;
                        currentVerse = verseFromRef;
                    }
                }
            }

            currentSentence.push(token);
        }

        // Add last sentence if exists
        if (currentSentence.length > 0) {
            sentences.push({
                id: sentenceId++,
                tokens: currentSentence,
                book: currentBook,
                chapter: currentChapter,
                verse: currentVerse,
                text: currentSentenceText
            });
        }

        this.data = {
            sentences,
            book: currentBook,
            totalSentences: sentenceId
        };

        this.processData();
        return this.data;
    }

    /**
     * Process parsed data for analysis
     */
    processData() {
        this.organizeByChapters();
        this.extractCharacters();
        this.identifyNarrativeElements();
    }

    /**
     * Organize sentences by chapters and verses
     */
    organizeByChapters() {
        for (const sentence of this.data.sentences) {
            const chapter = sentence.chapter || 1;
            const verse = sentence.verse || 1;

            if (!this.chapters[chapter]) {
                this.chapters[chapter] = {};
            }

            if (!this.chapters[chapter][verse]) {
                this.chapters[chapter][verse] = [];
            }

            this.chapters[chapter][verse].push(sentence);
        }
        
        // Log chapter organization for debugging
        console.log('Organized sentences by chapters:', Object.keys(this.chapters).length, 'chapters');
        for (const chapter in this.chapters) {
            const verseCount = Object.keys(this.chapters[chapter]).length;
            const sentenceCount = Object.values(this.chapters[chapter]).reduce((sum, verses) => sum + verses.length, 0);
            console.log(`Chapter ${chapter}: ${verseCount} verses, ${sentenceCount} sentences`);
        }
    }

    /**
     * Extract character names and references
     */
    extractCharacters() {
        // Common character names in Mark's Gospel
        const characterNames = [
            'Ιησους', 'Ιησου', 'Ιησουν',  // Jesus (nominative, genitive, accusative)
            'Πετρος', 'Πετρου', 'Πετρον',  // Peter
            'Ανδρεας', 'Ανδρεου',         // Andrew
            'Ιακωβος', 'Ιακωβου',         // James
            'Ιωαννης', 'Ιωαννου',          // John
            'Φιλιππος', 'Φιλιππου',        // Philip
            'Βαρθολομαιος', 'Βαρθολομαιου', // Bartholomew
            'Μαθθαιος', 'Μαθθαιου',        // Matthew
            'Θωμας', 'Θωμου',              // Thomas
            'Ιακωβος', 'Ιακωβου',          // James (son of Alphaeus)
            'Θαδδαιος', 'Θαδδαιου',        // Thaddaeus
            'Σιμων', 'Σιμωνος',            // Simon (the Cananaean)
            'Ιουδας', 'Ιουδα',             // Judas (Iscariot)
            'Πνευμα', 'Πνευματος',         // Spirit/Holy Spirit
            'Αγιον', 'Αγιου',              // Holy
            'Θεος', 'Θεου',                // God
            'Αβρααμ', 'Αβρααμ',            // Abraham
            'Δαυειδ', 'Δαυειδ',            // David
            'Μωυσης', 'Μωυσεως',           // Moses
            'Ηρωδης', 'Ηρωδου',            // Herod
            'Ιωαννης', 'Ιωαννου',          // John the Baptist
            'Βαπτιστης', 'Βαπτιστηου'      // Baptist
        ];

        for (const sentence of this.data.sentences) {
            for (const token of sentence.tokens) {
                const form = token.form;
                
                // Check if token matches any character name
                for (const name of characterNames) {
                    if (form.includes(name)) {
                        const baseName = this.getBaseCharacterName(name);
                        
                        if (!this.characters.has(baseName)) {
                            this.characters.set(baseName, {
                                name: baseName,
                                variants: new Set([name]),
                                occurrences: [],
                                totalMentions: 0
                            });
                        }
                        
                        const character = this.characters.get(baseName);
                        character.variants.add(name);
                        character.occurrences.push({
                            sentence: sentence.id,
                            chapter: sentence.chapter,
                            verse: sentence.verse,
                            token: token.id,
                            form: form,
                            lemma: token.lemma,
                            role: token.deprel
                        });
                        character.totalMentions++;
                    }
                }
            }
        }

        // Convert Sets to Arrays for serialization
        for (const character of this.characters.values()) {
            character.variants = Array.from(character.variants);
        }
    }

    /**
     * Get base character name from variant
     * @param {string} variant - Name variant
     * @returns {string} Base character name
     */
    getBaseCharacterName(variant) {
        const nameMap = {
            'Ιησους': 'Jesus',
            'Ιησου': 'Jesus',
            'Ιησουν': 'Jesus',
            'Πετρος': 'Peter',
            'Πετρου': 'Peter',
            'Πετρον': 'Peter',
            'Πνευμα': 'Holy Spirit',
            'Πνευματος': 'Holy Spirit',
            'Αγιον': 'Holy Spirit',
            'Αγιου': 'Holy Spirit',
            'Θεος': 'God',
            'Θεου': 'God',
            'Ιωαννης': 'John',
            'Ιωαννου': 'John',
            'Βαπτιστης': 'John the Baptist',
            'Βαπτιστηου': 'John the Baptist'
        };

        return nameMap[variant] || variant;
    }

    /**
     * Identify narrative elements and attentional cues
     */
    identifyNarrativeElements() {
        // Define attentional cue patterns
        const cuePatterns = {
            primacy: {
                keywords: ['αρχη', 'αρχομαι', 'πρωτος'],
                description: 'Primacy effect - establishing importance'
            },
            causal: {
                keywords: ['δια', 'εκ', 'απο', 'κατα', 'εν'],
                description: 'Causal implication - attribution'
            },
            focalization: {
                keywords: ['ειδον', 'ειδεν', 'οραω', 'βλεπω'],
                description: 'Focalization shift - perspective change'
            },
            absence: {
                keywords: ['ου', 'μη', 'ουκ', 'μηδεις'],
                description: 'Conspicuous absence - negation'
            },
            prolepsis: {
                keywords: ['μελλω', 'εσομαι', 'ηξει', 'ερχομαι'],
                description: 'Prolepsis - forward reference'
            }
        };

        // Analyze sentences for cues
        for (const sentence of this.data.sentences) {
            const sentenceText = sentence.tokens.map(t => t.form).join(' ');
            
            for (const [cueType, pattern] of Object.entries(cuePatterns)) {
                for (const keyword of pattern.keywords) {
                    if (sentenceText.includes(keyword)) {
                        // Store cue information
                        if (!this.data.cues) {
                            this.data.cues = [];
                        }
                        
                        this.data.cues.push({
                            type: cueType,
                            keyword: keyword,
                            sentence: sentence.id,
                            chapter: sentence.chapter,
                            verse: sentence.verse,
                            text: sentenceText,
                            description: pattern.description
                        });
                    }
                }
            }
        }
    }

    /**
     * Get text for specific chapter and verse range
     * @param {number} chapter - Chapter number
     * @param {number} startVerse - Starting verse
     * @param {number} endVerse - Ending verse
     * @returns {string} Text content
     */
    getTextRange(chapter, startVerse, endVerse) {
        if (!this.chapters[chapter]) return '';
        
        let text = '';
        for (let verse = startVerse; verse <= endVerse; verse++) {
            if (this.chapters[chapter][verse]) {
                for (const sentence of this.chapters[chapter][verse]) {
                    text += sentence.tokens.map(t => t.form).join(' ') + ' ';
                }
            }
        }
        
        return text.trim();
    }

    /**
     * Get character occurrences in chapter
     * @param {string} characterName - Character name
     * @param {number} chapter - Chapter number
     * @returns {Array} Character occurrences
     */
    getCharacterInChapter(characterName, chapter) {
        const character = this.characters.get(characterName);
        if (!character) return [];
        
        return character.occurrences.filter(occ => occ.chapter === chapter);
    }

    /**
     * Get all attentional cues in chapter
     * @param {number} chapter - Chapter number
     * @returns {Array} Cues in chapter
     */
    getCuesInChapter(chapter) {
        if (!this.data.cues) return [];
        
        return this.data.cues.filter(cue => cue.chapter === chapter);
    }

    /**
     * Get chapter summary
     * @param {number} chapter - Chapter number
     * @returns {Object} Chapter summary
     */
    getChapterSummary(chapter) {
        if (!this.chapters[chapter]) return null;
        
        const summary = {
            chapter,
            verses: Object.keys(this.chapters[chapter]).length,
            sentences: 0,
            characters: new Set(),
            cues: []
        };
        
        // Count sentences and collect characters
        for (const verse in this.chapters[chapter]) {
            for (const sentence of this.chapters[chapter][verse]) {
                summary.sentences++;
                
                // Check for character mentions
                for (const token of sentence.tokens) {
                    for (const [charName, charData] of this.characters) {
                        if (charData.variants.some(variant => token.form.includes(variant))) {
                            summary.characters.add(charName);
                        }
                    }
                }
            }
        }
        
        summary.characters = Array.from(summary.characters);
        summary.cues = this.getCuesInChapter(chapter);
        
        return summary;
    }

    /**
     * Load CONLL data from file
     * @param {string} filePath - Path to CONLL file
     * @returns {Promise<Object>} Parsed data
     */
    async loadFromFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load CONLL file: ${response.status}`);
            }
            
            const content = await response.text();
            return this.parse(content);
        } catch (error) {
            console.error('Error loading CONLL file:', error);
            throw error;
        }
    }
}

// Create singleton instance
const conllParser = new CONLLParser();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONLLParser;
} else {
    window.CONLLParser = CONLLParser;
    window.conllParser = conllParser;
}