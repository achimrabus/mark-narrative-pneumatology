// Application Constants

// Character types
const CHARACTER_TYPES = {
    EXPLICIT: 'explicit',
    IMPLICIT: 'implicit'
};

// Character groups
const CHARACTER_GROUPS = {
    SPIRIT: 'spirit',
    HUMAN: 'human',
    DIVINE: 'divine'
};

// Attentional cue types
const CUE_TYPES = {
    PRIMACY: 'primacy',
    CAUSAL: 'causal',
    FOCALIZATION: 'focalization',
    ABSENCE: 'absence',
    PROLEPSIS: 'prolepsis'
};

// Cue type colors
const CUE_COLORS = {
    primacy: '#f39c12',
    causal: '#9b59b6',
    focalization: '#3498db',
    absence: '#e74c3c',
    prolepsis: '#1abc9c'
};

// Character colors
const CHARACTER_COLORS = {
    spirit: '#ff6b6b',
    human: '#4ecdc4',
    divine: '#f39c12'
};

// View types
const VIEWS = {
    NETWORK: 'network',
    FLOW: 'flow',
    TEXT: 'text',
    ABOUT: 'about'
};

// API endpoints
const API_ENDPOINTS = {
    CUE_DETECTION: '/detect-cues',
    CHARACTER_ANALYSIS: '/analyze-characters',
    PATTERN_RECOGNITION: '/recognize-patterns'
};

// File paths
const FILE_PATHS = {
    CONLL: 'data/greek-nt.conll',
    CHARACTERS: 'data/processed/characters.json',
    SEGMENTS: 'data/processed/segments.json',
    CUES: 'data/processed/cues.json'
};

// Greek character names mapping
const GREEK_CHARACTER_NAMES = {
    'Ἰησοῦς': 'Jesus',
    'Πέτρος': 'Peter',
    'Ἰωάννης': 'John',
    'Ἰάκωβος': 'James',
    'Ἀνδρέας': 'Andrew',
    'Φίλιππος': 'Philip',
    'Βαρθολομαῖος': 'Bartholomew',
    'Μαθθαῖος': 'Matthew',
    'Θωμᾶς': 'Thomas',
    'Ἰάκωβος': 'James',
    'Θαδδαῖος': 'Thaddaeus',
    'Σίμων': 'Simon',
    'Ἰούδας': 'Judas',
    'πνεῦμα': 'Spirit',
    'θεός': 'God',
    'διάβολος': 'Satan',
    'Ἰωσήφ': 'Joseph',
    'Μαρία': 'Mary',
    'Ἡρῴδης': 'Herod',
    'Βαπτιστής': 'Baptist',
    'Φαρισαῖος': 'Pharisee',
    'Σαδδουκαῖος': 'Sadducee'
};

// Part of speech tags (simplified)
const POS_TAGS = {
    NOUN: 'N',
    VERB: 'V',
    ADJECTIVE: 'A',
    ADVERB: 'D',
    CONJUNCTION: 'C',
    PREPOSITION: 'R',
    PRONOUN: 'P',
    PARTICLE: 'I',
    NUMERAL: 'M',
    INTERJECTION: 'G'
};

// Morphological features
const MORPH_FEATURES = {
    PERSON: 'PERS',
    NUMBER: 'NUMB',
    TENSE: 'TENS',
    MOOD: 'MOOD',
    VOICE: 'VOIC',
    GENDER: 'GEND',
    CASE: 'CASE',
    DEGREE: 'DEGR'
};

// Animation durations
const ANIMATION_DURATIONS = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
};

// Breakpoints for responsive design
const BREAKPOINTS = {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1200
};

// Error messages
const ERROR_MESSAGES = {
    FILE_NOT_FOUND: 'The requested file could not be found.',
    API_ERROR: 'Error communicating with the analysis service.',
    NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
    PARSE_ERROR: 'Error parsing the data file.',
    VALIDATION_ERROR: 'Invalid data format.',
    PERMISSION_DENIED: 'You do not have permission to access this resource.'
};

// Success messages
const SUCCESS_MESSAGES = {
    DATA_LOADED: 'Data loaded successfully.',
    ANALYSIS_COMPLETE: 'Analysis completed successfully.',
    ANNOTATION_SAVED: 'Annotation saved successfully.',
    EXPORT_COMPLETE: 'Data exported successfully.'
};

// Validation patterns
const VALIDATION_PATTERNS = {
    GREEK_WORD: /[α-ωΑ-Ωἀ-ᾼἂ-ᾇἐ-ἕἠ-ὅὐ-ὗὀ-ὼ]/,
    REFERENCE: /\d+:\d+(-\d+)?/,
    CHAPTER: /^\d+$/,
    VERSE: /^\d+$/
};

// Export constants for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CHARACTER_TYPES,
        CHARACTER_GROUPS,
        CUE_TYPES,
        CUE_COLORS,
        CHARACTER_COLORS,
        VIEWS,
        API_ENDPOINTS,
        FILE_PATHS,
        GREEK_CHARACTER_NAMES,
        POS_TAGS,
        MORPH_FEATURES,
        ANIMATION_DURATIONS,
        BREAKPOINTS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        VALIDATION_PATTERNS
    };
} else {
    // Browser environment - attach to window
    window.CONSTANTS = {
        CHARACTER_TYPES,
        CHARACTER_GROUPS,
        CUE_TYPES,
        CUE_COLORS,
        CHARACTER_COLORS,
        VIEWS,
        API_ENDPOINTS,
        FILE_PATHS,
        GREEK_CHARACTER_NAMES,
        POS_TAGS,
        MORPH_FEATURES,
        ANIMATION_DURATIONS,
        BREAKPOINTS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        VALIDATION_PATTERNS
    };
}