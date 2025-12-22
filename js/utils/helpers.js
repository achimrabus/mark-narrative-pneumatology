// Helper utility functions

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format Greek text for display
 * @param {string} text - Greek text
 * @returns {string} Formatted text
 */
function formatGreekText(text) {
    if (!text) return '';
    return text.trim();
}

/**
 * Parse biblical reference (e.g., "Mark 1:1-15")
 * @param {string} reference - Biblical reference
 * @returns {Object} Parsed reference with book, chapter, verses
 */
function parseReference(reference) {
    const match = reference.match(/^(\w+)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) return null;
    
    return {
        book: match[1],
        chapter: parseInt(match[2]),
        startVerse: parseInt(match[3]),
        endVerse: match[4] ? parseInt(match[4]) : parseInt(match[3])
    };
}

/**
 * Format biblical reference
 * @param {Object} ref - Reference object
 * @returns {string} Formatted reference
 */
function formatReference(ref) {
    if (!ref) return '';
    
    let formatted = `${ref.book} ${ref.chapter}:${ref.startVerse}`;
    if (ref.endVerse && ref.endVerse !== ref.startVerse) {
        formatted += `-${ref.endVerse}`;
    }
    return formatted;
}

/**
 * Check if a word is Greek
 * @param {string} word - Word to check
 * @returns {boolean} True if Greek
 */
function isGreekWord(word) {
    return window.CONSTANTS.VALIDATION_PATTERNS.GREEK_WORD.test(word);
}

/**
 * Extract character name from Greek word
 * @param {string} greekWord - Greek word
 * @returns {string|null} Character name or null
 */
function getCharacterName(greekWord) {
    return window.CONSTANTS.GREEK_CHARACTER_NAMES[greekWord] || null;
}

/**
 * Calculate text similarity (simple implementation)
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for display
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile
 */
function isMobile() {
    return window.innerWidth <= window.CONSTANTS.BREAKPOINTS.MOBILE;
}

/**
 * Check if device is tablet
 * @returns {boolean} True if tablet
 */
function isTablet() {
    const width = window.innerWidth;
    return width > window.CONSTANTS.BREAKPOINTS.MOBILE && 
           width <= window.CONSTANTS.BREAKPOINTS.TABLET;
}

/**
 * Check if device is desktop
 * @returns {boolean} True if desktop
 */
function isDesktop() {
    return window.innerWidth > window.CONSTANTS.BREAKPOINTS.TABLET;
}

/**
 * Show status message
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showStatusMessage(message, type = 'info', duration = 3000) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `status-message ${type}`;
    messageEl.innerHTML = `
        <span class="status-icon">${getStatusIcon(type)}</span>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Position message
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '1000';
    messageEl.style.maxWidth = '400px';
    
    // Animate in
    messageEl.style.animation = 'slideInRight 0.3s ease-out';
    
    // Remove after duration
    setTimeout(() => {
        messageEl.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => messageEl.remove(), 300);
    }, duration);
}

/**
 * Get status icon for message type
 * @param {string} type - Message type
 * @returns {string} Icon character
 */
function getStatusIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

/**
 * Download data as JSON file
 * @param {Object} data - Data to download
 * @param {string} filename - Filename
 */
function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download data as CSV file
 * @param {Array} data - Array of objects
 * @param {string} filename - Filename
 */
function downloadCSV(data, filename) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of string
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert camelCase to kebab-case
 * @param {string} text - Text to convert
 * @returns {string} kebab-case text
 */
function camelToKebab(text) {
    return text.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * @param {string} text - Text to convert
 * @returns {string} camelCase text
 */
function kebabToCamel(text) {
    return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @returns {boolean} True if in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Smooth scroll to element
 * @param {Element|string} target - Element or selector
 * @param {number} offset - Offset from top
 */
function scrollToElement(target, offset = 0) {
    const element = typeof target === 'string' 
        ? document.querySelector(target) 
        : target;
    
    if (!element) return;
    
    const top = element.offsetTop - offset;
    window.scrollTo({
        top,
        behavior: 'smooth'
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        formatGreekText,
        parseReference,
        formatReference,
        isGreekWord,
        getCharacterName,
        calculateSimilarity,
        levenshteinDistance,
        deepClone,
        generateId,
        formatDate,
        isMobile,
        isTablet,
        isDesktop,
        showStatusMessage,
        downloadJSON,
        downloadCSV,
        escapeHTML,
        truncateText,
        capitalize,
        camelToKebab,
        kebabToCamel,
        isInViewport,
        scrollToElement
    };
} else {
    // Browser environment
    window.Helpers = {
        debounce,
        throttle,
        formatGreekText,
        parseReference,
        formatReference,
        isGreekWord,
        getCharacterName,
        calculateSimilarity,
        levenshteinDistance,
        deepClone,
        generateId,
        formatDate,
        isMobile,
        isTablet,
        isDesktop,
        showStatusMessage,
        downloadJSON,
        downloadCSV,
        escapeHTML,
        truncateText,
        capitalize,
        camelToKebab,
        kebabToCamel,
        isInViewport,
        scrollToElement
    };
}