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
        // Common character lemmas in Mark's Gospel (using lemma forms from PROIEL data)
        const characterLemmas = [
            'Ἰησοῦς',           // Jesus
            'Πέτρος',           // Peter
            'Ἀνδρέας',          // Andrew
            'Ἰάκωβος',          // James
            'Ἰωάν(ν)ης',        // John (note: PROIEL uses this form)
            'Φίλιππος',         // Philip
            'Βαρθολομαῖος',     // Bartholomew
            'Μαθθαῖος',         // Matthew
            'Θωμᾶς',            // Thomas
            'Θαδδαῖος',         // Thaddaeus
            'Σίμων',            // Simon
            'Ἰούδας',           // Judas
            'πνεῦμα',           // Spirit/Holy Spirit
            'ἅγιος',            // Holy
            'θεός',             // God
            'Ἀβραάμ',           // Abraham
            'Δαυίδ',            // David
            'Μωϋσῆς',           // Moses
            'Ἡρῴδης',           // Herod
            'βαπτιστής',        // Baptist
            'Μαρία',            // Mary
            'Ἰωσήφ',            // Joseph
            'διάβολος',         // Devil/Satan
            'Χριστός',          // Christ
            'Ναζαρηνός',        // Nazarene
            'Γαλιλαῖος'         // Galilean
        ];

        for (const sentence of this.data.sentences) {
            for (const token of sentence.tokens) {
                const lemma = token.lemma;

                // Check if token lemma matches any character name
                for (const characterLemma of characterLemmas) {
                    if (lemma === characterLemma) {
                        const baseName = this.getBaseCharacterName(characterLemma);

                        if (!this.characters.has(baseName)) {
                            this.characters.set(baseName, {
                                name: baseName,
                                variants: new Set([characterLemma]),
                                occurrences: [],
                                totalMentions: 0
                            });
                        }

                        const character = this.characters.get(baseName);
                        character.variants.add(token.form); // Add actual form variant
                        character.occurrences.push({
                            sentence: sentence.id,
                            chapter: sentence.chapter,
                            verse: sentence.verse,
                            token: token.id,
                            form: token.form,
                            lemma: token.lemma,
                            role: token.deprel
                        });
                        character.totalMentions++;
                        break; // Found match, no need to check other lemmas
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
     * Get base character name from lemma
     * @param {string} lemma - Character lemma
     * @returns {string} Base character name
     */
    getBaseCharacterName(lemma) {
        const nameMap = {
            'Ἰησοῦς': 'Jesus',
            'Πέτρος': 'Peter',
            'Ἀνδρέας': 'Andrew',
            'Ἰάκωβος': 'James',
            'Ἰωάν(ν)ης': 'John',
            'Φίλιππος': 'Philip',
            'Βαρθολομαῖος': 'Bartholomew',
            'Μαθθαῖος': 'Matthew',
            'Θωμᾶς': 'Thomas',
            'Θαδδαῖος': 'Thaddaeus',
            'Σίμων': 'Simon',
            'Ἰούδας': 'Judas',
            'πνεῦμα': 'Holy Spirit',
            'ἅγιος': 'Holy',
            'θεός': 'God',
            'Ἀβραάμ': 'Abraham',
            'Δαυίδ': 'David',
            'Μωϋσῆς': 'Moses',
            'Ἡρῴδης': 'Herod',
            'βαπτιστής': 'Baptist',
            'Μαρία': 'Mary',
            'Ἰωσήφ': 'Joseph',
            'διάβολος': 'Satan',
            'Χριστός': 'Christ',
            'Ναζαρηνός': 'Nazarene',
            'Γαλιλαῖος': 'Galilean'
        };

        return nameMap[lemma] || lemma;
    }

    /**
     * Normalize Greek text by removing diacritics/accents for matching
     * @param {string} text - Greek text
     * @returns {string} Normalized text (lowercase, no diacritics)
     */
    normalizeGreek(text) {
        if (!text) return '';
        // NFD decomposition separates base characters from diacritics
        // Then remove combining marks (accents, breathing marks, etc.)
        return text.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // Combining diacritical marks
            .replace(/[\u1FBF\u1FC0\u1FC1\u1FCD\u1FCE\u1FCF\u1FDD\u1FDE\u1FDF\u1FED\u1FEE\u1FEF\u1FFD\u1FFE]/g, '') // Greek-specific
            .toLowerCase();
    }

    /**
     * Check if a lemma matches any of the target lemmas
     * @param {string} lemma - Token lemma to check
     * @param {Array} targetLemmas - Array of lemma patterns to match
     * @returns {boolean} True if matches
     */
    lemmaMatches(lemma, targetLemmas) {
        if (!lemma) return false;
        const normalizedLemma = this.normalizeGreek(lemma);
        return targetLemmas.some(target => {
            const normalizedTarget = this.normalizeGreek(target);
            return normalizedLemma === normalizedTarget || normalizedLemma.startsWith(normalizedTarget);
        });
    }

    /**
     * Identify narrative elements and attentional cues
     * Uses lemma-based matching with Greek text normalization
     */
    identifyNarrativeElements() {
        // Define attentional cue patterns using lemma forms
        // Each pattern includes lemma forms and form patterns for robust matching
        const cuePatterns = {
            primacy: {
                lemmas: ['ἀρχή', 'ἄρχω', 'ἄρχομαι', 'πρῶτος', 'πρότερος'],
                formPatterns: ['αρχ', 'πρωτ', 'προτερ'],
                description: 'Primacy effect - establishing importance through early positioning or explicit first-mention markers'
            },
            causal: {
                lemmas: ['διά', 'ἐκ', 'ἀπό', 'κατά', 'ὑπό', 'παρά', 'πρός', 'αἰτία', 'ποιέω'],
                formPatterns: ['δια', 'εκ', 'απο', 'κατα', 'υπο', 'παρα', 'προς', 'αιτι', 'ποι'],
                description: 'Causal implication - attribution of action or influence to a character',
                // Require context for common prepositions
                contextRequired: ['διά', 'ἐκ', 'ἀπό', 'κατά', 'ὑπό', 'παρά', 'πρός']
            },
            focalization: {
                lemmas: ['ὁράω', 'βλέπω', 'θεωρέω', 'θεάομαι', 'ἐμβλέπω', 'ἀναβλέπω', 'περιβλέπω', 'ἀτενίζω', 'γινώσκω', 'οἶδα'],
                formPatterns: ['ορα', 'οψ', 'βλεπ', 'θεωρ', 'θεα', 'εμβλεπ', 'αναβλεπ', 'περιβλεπ', 'ατενιζ', 'γινωσκ', 'ειδ', 'ιδ'],
                description: 'Focalization shift - change in narrative perspective or viewpoint'
            },
            absence: {
                lemmas: ['οὐ', 'οὐκ', 'οὐχ', 'μή', 'μηδείς', 'οὐδείς', 'οὔτε', 'μήτε', 'οὐδέ', 'μηδέ'],
                formPatterns: ['ου', 'ουκ', 'ουχ', 'μη', 'μηδ', 'ουδ', 'ουτε', 'μητε'],
                description: 'Conspicuous absence - negation or notable omission of expected elements',
                // These are very common, require special context
                contextRequired: ['οὐ', 'οὐκ', 'οὐχ', 'μή']
            },
            prolepsis: {
                lemmas: ['μέλλω', 'ἔρχομαι', 'ἥκω', 'ἔσομαι', 'γίνομαι', 'ἀποκαλύπτω', 'προλέγω', 'προφητεύω'],
                formPatterns: ['μελλ', 'ερχ', 'ελευ', 'ηξ', 'εσ', 'γεν', 'αποκαλυπ', 'προλεγ', 'προφητ'],
                description: 'Prolepsis - forward reference anticipating future action or revelation'
            }
        };

        // Initialize cues array
        this.data.cues = [];

        // Analyze sentences for cues using both lemma and form matching
        for (const sentence of this.data.sentences) {
            for (const [cueType, pattern] of Object.entries(cuePatterns)) {
                // Check each token for lemma match
                for (const token of sentence.tokens) {
                    let matched = false;
                    let matchedKeyword = null;

                    // Primary: Lemma-based matching (most accurate)
                    if (token.lemma && this.lemmaMatches(token.lemma, pattern.lemmas)) {
                        matched = true;
                        matchedKeyword = token.lemma;

                        // For context-required patterns, check if this is a significant usage
                        if (pattern.contextRequired && pattern.contextRequired.some(req =>
                            this.normalizeGreek(token.lemma) === this.normalizeGreek(req))) {
                            // Skip common prepositions unless they're near Holy Spirit or significant context
                            const sentenceText = sentence.tokens.map(t => t.form).join(' ');
                            const hasHolySpirit = sentence.tokens.some(t =>
                                t.lemma === 'πνεῦμα' || this.normalizeGreek(t.form).includes('πνευμα'));
                            const hasSpecialContext = hasHolySpirit ||
                                sentenceText.includes('θεο') || sentenceText.includes('Ἰησοῦ');
                            if (!hasSpecialContext) {
                                matched = false;
                            }
                        }
                    }

                    // Fallback: Form-based matching with normalization (for unrecognized lemmas)
                    if (!matched && token.form) {
                        const normalizedForm = this.normalizeGreek(token.form);
                        for (const formPattern of pattern.formPatterns) {
                            if (normalizedForm.startsWith(formPattern) || normalizedForm.includes(formPattern)) {
                                matched = true;
                                matchedKeyword = token.form;
                                break;
                            }
                        }
                    }

                    if (matched) {
                        // Avoid duplicates for same sentence/type combination
                        const existing = this.data.cues.find(c =>
                            c.sentence === sentence.id &&
                            c.type === cueType &&
                            c.keyword === matchedKeyword
                        );

                        if (!existing) {
                            this.data.cues.push({
                                type: cueType,
                                keyword: matchedKeyword,
                                form: token.form,
                                lemma: token.lemma,
                                sentence: sentence.id,
                                chapter: sentence.chapter,
                                verse: sentence.verse,
                                text: sentence.tokens.map(t => t.form).join(' '),
                                description: pattern.description
                            });
                        }
                    }
                }
            }
        }

        console.log(`Identified ${this.data.cues.length} attentional cues across all chapters`);
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