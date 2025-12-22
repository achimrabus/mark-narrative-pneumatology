// Simple API Client for OpenWebUI communication
// Uses user-provided API key for simplicity

/**
 * API Client for communicating with analysis services
 * Simple approach: user provides their own API key
 */
class APIClient {
    constructor() {
        // API configuration
        this.config = {
            endpoint: 'https://openwebui.uni-freiburg.de/api',
            model: 'glm-4.6-llmlb'
        };
        
        // Check if API key is available
        this.apiKey = this.getApiKey();
    }
    
    /**
     * Get API key from localStorage or config
     * @returns {string|null} API key or null if not found
     */
    getApiKey() {
        // Try localStorage first (user input)
        const storedKey = localStorage.getItem('openwebui_api_key');
        if (storedKey && storedKey !== 'YOUR_API_KEY_HERE') {
            return storedKey;
        }
        
        // Fallback to global config
        if (window.API_CONFIG && window.API_CONFIG.apiKey && 
            window.API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
            return window.API_CONFIG.apiKey;
        }
        
        return null;
    }
    
    /**
     * Set API key (for user input)
     * @param {string} apiKey - API key to store
     */
    setApiKey(apiKey) {
        localStorage.setItem('openwebui_api_key', apiKey);
        this.apiKey = apiKey;
    }

    /**
     * Make API request
     * @param {string} prompt - Prompt to send to AI
     * @param {Object} options - Additional options
     * @returns {Promise} API response
     */
    async makeRequest(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('API key not configured. Please provide your OpenWebUI API key.');
        }
        
        const requestData = {
            model: this.config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a biblical scholar specializing in narratology and attentional cue detection in ancient texts.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.3
        };

        try {
            const response = await fetch(this.config.endpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw new Error('Failed to communicate with analysis service: ' + error.message);
        }
    }

    /**
     * Detect attentional cues in text
     * @param {string} text - Text to analyze
     * @returns {Promise<Array>} Detected cues
     */
    async detectCues(text) {
        const prompt = `Analyze this text segment from Mark's Gospel for attentional cues that direct readers to construct character models for background figures, particularly the Holy Spirit.

Text: "${text}"

Look for these types of cues:
1. Primacy effect: Early mentions that establish character importance
2. Causal implication: Events attributed to off-stage characters
3. Focalization shifts: Narrative perspective changes
4. Conspicuous absence: Notable omissions or gaps
5. Prolepsis: Forward references that anticipate character action

For each cue found, provide:
- Type of cue
- Location (word or phrase)
- Explanation of how it functions
- Confidence score (0-1)

Respond in JSON format:
{
  "cues": [
    {
      "type": "cue_type",
      "location": "specific_text",
      "explanation": "how_it_works",
      "confidence": 0.8
    }
  ]
}`;

        const response = await this.makeRequest(prompt);
        return this.parseCueResponse(response);
    }

    /**
     * Analyze character relationships
     * @param {Array} characters - Character list
     * @param {string} text - Text context
     * @returns {Promise<Object>} Character analysis
     */
    async analyzeCharacters(characters, text) {
        const characterList = characters.map(c => c.name).join(', ');
        const prompt = `Analyze the character relationships in this text segment from Mark's Gospel.

Characters mentioned: ${characterList}

Text: "${text}"

Identify:
1. Direct interactions between characters
2. Implicit relationships
3. Power dynamics
4. Narrative roles (protagonist, antagonist, background, etc.)

Respond in JSON format with relationship analysis.`;

        return await this.makeRequest(prompt);
    }

    /**
     * Recognize narrative patterns
     * @param {Array} segments - Text segments
     * @returns {Promise<Array>} Pattern analysis
     */
    async recognizePatterns(segments) {
        const prompt = `Analyze these narrative segments from Mark's Gospel for recurring patterns and narrative techniques.

Segments: ${segments.map(s => s.text).join('\n\n')}

Identify patterns in:
1. Character introduction
2. Scene transitions
3. Attentional cue distribution
4. Narrative rhythm

Respond in JSON format with pattern analysis.`;

        return await this.makeRequest(prompt);
    }

    /**
     * Parse cue detection response
     * @param {Object} response - API response
     * @returns {Array} Parsed cues
     */
    parseCueResponse(response) {
        try {
            // Handle different response formats
            let content;
            if (response.choices && response.choices[0]) {
                content = response.choices[0].message.content;
            } else if (response.content) {
                content = response.content;
            } else {
                content = response;
            }

            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.cues || [];
            }

            return [];
        } catch (error) {
            console.error('Error parsing cue response:', error);
            return [];
        }
    }

    /**
     * Check if API is available
     * @returns {Promise<boolean>} True if API is available
     */
    async checkAvailability() {
        if (!this.apiKey) {
            return false;
        }
        
        try {
            await this.makeRequest('Test message', { maxTokens: 10 });
            return true;
        } catch (error) {
            console.warn('API not available:', error.message);
            return false;
        }
    }
    
    /**
     * Show API key input dialog
     * @returns {Promise<string>} User-provided API key
     */
    async requestApiKey() {
        return new Promise((resolve) => {
            // Create modal dialog
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>OpenWebUI API Key Required</h3>
                    <p>To use the AI analysis features, please provide your OpenWebUI API key.</p>
                    <p>You can get this from your OpenWebUI account settings.</p>
                    <input type="password" id="api-key-input" placeholder="Enter your API key" />
                    <div class="modal-buttons">
                        <button id="save-api-key">Save</button>
                        <button id="cancel-api-key">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const input = document.getElementById('api-key-input');
            const saveBtn = document.getElementById('save-api-key');
            const cancelBtn = document.getElementById('cancel-api-key');
            
            saveBtn.addEventListener('click', () => {
                const key = input.value.trim();
                if (key) {
                    this.setApiKey(key);
                    document.body.removeChild(modal);
                    resolve(key);
                } else {
                    input.style.borderColor = 'red';
                    input.placeholder = 'Please enter a valid API key';
                }
            });
            
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            
            // Focus on input
            setTimeout(() => input.focus(), 100);
        });
    }
}

// Create singleton instance
const apiClient = new APIClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
} else {
    window.APIClient = APIClient;
    window.apiClient = apiClient;
}