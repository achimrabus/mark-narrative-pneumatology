// Greek Polytonic Virtual Keyboard
// On-screen keyboard for Greek text input with polytonic accents

/**
 * Greek Polytonic Virtual Keyboard
 */
class GreekKeyboard {
    constructor() {
        this.isVisible = false;
        this.currentTarget = null;
        this.keyboardLayout = this.createKeyboardLayout();
        
        this.createKeyboard();
        this.setupEventListeners();
    }

    /**
     * Create keyboard layout with polytonic Greek
     * @returns {Object} Keyboard layout
     */
    createKeyboardLayout() {
        return {
            // First row - vowels with accents
            row1: [
                { key: 'ά', shift: 'Ά', alt: 'ἀ', altShift: 'Ἀ' },
                { key: 'έ', shift: 'Έ', alt: 'ἐ', altShift: 'Ἐ' },
                { key: 'ή', shift: 'Ή', alt: 'ἠ', altShift: 'Ἠ' },
                { key: 'ί', shift: 'Ί', alt: 'ἰ', altShift: 'Ἰ' },
                { key: 'ό', shift: 'Ό', alt: 'ὀ', altShift: 'Ὀ' },
                { key: 'ύ', shift: 'Ύ', alt: 'ὐ', altShift: 'ὐ' },
                { key: 'ώ', shift: 'Ώ', alt: 'ὠ', altShift: 'Ὠ' }
            ],
            // Second row - breathing marks
            row2: [
                { key: 'ἁ', shift: 'Ἁ', alt: 'ἂ', altShift: 'Ἂ' },
                { key: 'ἃ', shift: 'Ἃ', alt: 'ἄ', altShift: 'Ἄ' },
                { key: 'ἅ', shift: 'Ἅ', alt: 'ἆ', altShift: 'Ἆ' },
                { key: 'ἇ', shift: 'Ἇ', alt: 'ἁ', altShift: 'Ἁ' },
                { key: 'ἑ', shift: 'Ἑ', alt: 'ἒ', altShift: 'Ἒ' },
                { key: 'ἓ', shift: 'Ἓ', alt: 'ἔ', altShift: 'Ἔ' },
                { key: 'ἕ', shift: 'Ἕ', alt: 'ἓ', altShift: 'Ἓ' }
            ],
            // Third row - consonants
            row3: [
                { key: 'α', shift: 'Α', alt: 'β', altShift: 'Β' },
                { key: 'γ', shift: 'Γ', alt: 'δ', altShift: 'Δ' },
                { key: 'ε', shift: 'Ε', alt: 'ζ', altShift: 'Ζ' },
                { key: 'η', shift: 'Η', alt: 'θ', altShift: 'Θ' },
                { key: 'ι', shift: 'Ι', alt: 'κ', altShift: 'Κ' },
                { key: 'λ', shift: 'Λ', alt: 'μ', altShift: 'Μ' }
            ],
            // Fourth row - more consonants
            row4: [
                { key: 'ν', shift: 'Ν', alt: 'ξ', altShift: 'Ξ' },
                { key: 'ο', shift: 'Ο', alt: 'π', altShift: 'Π' },
                { key: 'ρ', shift: 'Ρ', alt: 'σ', altShift: 'Σ' },
                { key: 'τ', shift: 'Τ', alt: 'υ', altShift: 'Υ' },
                { key: 'φ', shift: 'Φ', alt: 'χ', altShift: 'Χ' },
                { key: 'ψ', shift: 'Ψ', alt: 'ω', altShift: 'Ω' }
            ],
            // Fifth row - special characters and space
            row5: [
                { key: ';', shift: ':', alt: '·', altShift: '•' },
                { key: 'ς', shift: 'Σ', alt: '\u2019', altShift: '\u2019' },
                { key: '«', shift: '»', alt: '(', altShift: ')' },
                { key: 'Space', shift: 'Space', alt: 'Space', altShift: 'Space', special: 'space' },
                { key: 'Backspace', shift: 'Backspace', alt: 'Backspace', altShift: 'Backspace', special: 'backspace' },
                { key: 'Clear', shift: 'Clear', alt: 'Clear', altShift: 'Clear', special: 'clear' }
            ]
        };
    }

    /**
     * Create virtual keyboard UI
     */
    createKeyboard() {
        // Create keyboard container
        const keyboard = document.createElement('div');
        keyboard.id = 'greek-keyboard';
        keyboard.className = 'greek-keyboard';
        keyboard.style.display = 'none';

        // Create keyboard header
        const header = document.createElement('div');
        header.className = 'keyboard-header';
        header.innerHTML = `
            <span class="keyboard-title">Greek Polytonic Keyboard</span>
            <button class="keyboard-close" id="close-keyboard">×</button>
        `;
        keyboard.appendChild(header);

        // Create modifier indicators
        const modifiers = document.createElement('div');
        modifiers.className = 'keyboard-modifiers';
        modifiers.innerHTML = `
            <label><input type="checkbox" id="shift-mod"> Shift</label>
            <label><input type="checkbox" id="alt-mod"> Alt</label>
            <label><input type="checkbox" id="accent-mode"> Accent Mode</label>
        `;
        keyboard.appendChild(modifiers);

        // Create keyboard rows
        const layout = this.keyboardLayout;
        Object.keys(layout).forEach(rowName => {
            const row = document.createElement('div');
            row.className = 'keyboard-row';

            layout[rowName].forEach(keyData => {
                const key = this.createKey(keyData);
                row.appendChild(key);
            });

            keyboard.appendChild(row);
        });

        // Add to document
        document.body.appendChild(keyboard);
    }

    /**
     * Create individual key
     * @param {Object} keyData - Key data
     * @returns {Element} Key element
     */
    createKey(keyData) {
        const key = document.createElement('button');
        key.className = 'keyboard-key';
        
        if (keyData.special) {
            key.classList.add(keyData.special);
            key.innerHTML = this.getSpecialKeyLabel(keyData.special);
        } else {
            key.innerHTML = `
                <span class="key-main">${keyData.key}</span>
                <span class="key-shift">${keyData.shift}</span>
                <span class="key-alt">${keyData.alt}</span>
            `;
        }

        // Add click handler
        key.addEventListener('click', () => {
            this.handleKeyClick(keyData);
        });

        return key;
    }

    /**
     * Get special key label
     * @param {string} special - Special key type
     * @returns {string} Label
     */
    getSpecialKeyLabel(special) {
        const labels = {
            'space': '␣',
            'backspace': '⌫',
            'clear': 'Clear'
        };
        return labels[special] || special;
    }

    /**
     * Handle key click
     * @param {Object} keyData - Key data
     */
    handleKeyClick(keyData) {
        if (!this.currentTarget) return;

        const shift = document.getElementById('shift-mod').checked;
        const alt = document.getElementById('alt-mod').checked;

        let char;
        if (keyData.special === 'space') {
            char = ' ';
        } else if (keyData.special === 'backspace') {
            this.backspace();
            return;
        } else if (keyData.special === 'clear') {
            this.clear();
            return;
        } else {
            char = shift ? (alt ? keyData.altShift : keyData.shift) : 
                         (alt ? keyData.alt : keyData.key);
        }

        this.insertCharacter(char);
    }

    /**
     * Insert character at cursor
     * @param {string} char - Character to insert
     */
    insertCharacter(char) {
        if (!this.currentTarget) return;

        const start = this.currentTarget.selectionStart;
        const end = this.currentTarget.selectionEnd;
        const value = this.currentTarget.value;

        this.currentTarget.value = value.substring(0, start) + char + value.substring(end);
        this.currentTarget.selectionStart = this.currentTarget.selectionEnd = start + char.length;

        // Trigger input event
        this.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Backspace functionality
     */
    backspace() {
        if (!this.currentTarget) return;

        const start = this.currentTarget.selectionStart;
        const end = this.currentTarget.selectionEnd;
        const value = this.currentTarget.value;

        if (start === end && start > 0) {
            this.currentTarget.value = value.substring(0, start - 1) + value.substring(end);
            this.currentTarget.selectionStart = this.currentTarget.selectionEnd = start - 1;
        } else {
            this.currentTarget.value = value.substring(0, start) + value.substring(end);
            this.currentTarget.selectionStart = this.currentTarget.selectionEnd = start;
        }

        this.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Clear all text
     */
    clear() {
        if (!this.currentTarget) return;
        
        this.currentTarget.value = '';
        this.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        document.getElementById('close-keyboard').addEventListener('click', () => {
            this.hide();
        });

        // Modifier keys
        document.getElementById('shift-mod').addEventListener('change', () => {
            this.updateKeyDisplay();
        });

        document.getElementById('alt-mod').addEventListener('change', () => {
            this.updateKeyDisplay();
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isVisible && !e.target.closest('#greek-keyboard') && !e.target.closest('.greek-keyboard-trigger')) {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Update key display based on modifiers
     */
    updateKeyDisplay() {
        const shift = document.getElementById('shift-mod').checked;
        const alt = document.getElementById('alt-mod').checked;

        document.querySelectorAll('.keyboard-key').forEach(key => {
            const main = key.querySelector('.key-main');
            const shiftEl = key.querySelector('.key-shift');
            const altEl = key.querySelector('.key-alt');

            if (main && shiftEl && altEl) {
                if (shift && alt) {
                    main.style.display = 'none';
                    shiftEl.style.display = 'none';
                    altEl.style.display = 'inline';
                } else if (shift) {
                    main.style.display = 'none';
                    shiftEl.style.display = 'inline';
                    altEl.style.display = 'none';
                } else if (alt) {
                    main.style.display = 'none';
                    shiftEl.style.display = 'none';
                    altEl.style.display = 'inline';
                } else {
                    main.style.display = 'inline';
                    shiftEl.style.display = 'none';
                    altEl.style.display = 'none';
                }
            }
        });
    }

    /**
     * Show keyboard for target input
     * @param {HTMLElement} target - Target input element
     */
    show(target) {
        this.currentTarget = target;
        this.isVisible = true;

        const keyboard = document.getElementById('greek-keyboard');
        keyboard.style.display = 'block';

        // Position keyboard
        const rect = target.getBoundingClientRect();
        keyboard.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        keyboard.style.left = rect.left + 'px';

        // Add trigger class to target
        target.classList.add('greek-keyboard-active');
    }

    /**
     * Hide keyboard
     */
    hide() {
        this.isVisible = false;
        this.currentTarget = null;

        const keyboard = document.getElementById('greek-keyboard');
        keyboard.style.display = 'none';

        // Remove active class
        document.querySelectorAll('.greek-keyboard-active').forEach(el => {
            el.classList.remove('greek-keyboard-active');
        });

        // Reset modifiers
        document.getElementById('shift-mod').checked = false;
        document.getElementById('alt-mod').checked = false;
    }

    /**
     * Toggle keyboard visibility
     * @param {HTMLElement} target - Target input element
     */
    toggle(target) {
        if (this.isVisible && this.currentTarget === target) {
            this.hide();
        } else {
            this.show(target);
        }
    }

    /**
     * Add keyboard trigger to input elements
     * @param {string} selector - CSS selector for inputs
     */
    addKeyboardTrigger(selector = 'input[type="text"], textarea') {
        document.querySelectorAll(selector).forEach(input => {
            // Add keyboard button
            const button = document.createElement('button');
            button.className = 'greek-keyboard-trigger';
            button.innerHTML = '🇬🇷';
            button.title = 'Greek Keyboard';
            button.type = 'button';

            // Position button
            button.style.cssText = `
                position: absolute;
                right: 5px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                font-size: 14px;
                padding: 2px;
            `;

            // Wrap input in container if needed
            if (!input.parentNode.classList.contains('input-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'input-wrapper';
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
            }

            // Add button after input
            input.parentNode.appendChild(button);

            // Add click handler
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle(input);
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GreekKeyboard;
} else {
    window.GreekKeyboard = GreekKeyboard;
}