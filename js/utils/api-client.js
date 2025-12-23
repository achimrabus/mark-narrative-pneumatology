// Simple API Client for OpenWebUI communication
// Uses user-provided API key for simplicity

/**
 * API Client for communicating with analysis services
 * Supports multiple providers: OpenWebUI, Claude, GPT, Gemini
 */
class APIClient {
    constructor() {
        // Provider configurations
        this.providers = {
            openwebui: {
                name: 'OpenWebUI',
                endpoint: 'https://openwebui.uni-freiburg.de/api/v1/chat/completions',
                defaultModel: 'glm-4.6-llmlb',
                models: ['glm-4.6-llmlb', 'qwen2.5-14b-instruct', 'llama-3.1-8b'],
                format: 'openai',
                storageKey: 'openwebui_api_key'
            },
            claude: {
                name: 'Claude (Anthropic)',
                endpoint: 'https://api.anthropic.com/v1/messages',
                defaultModel: 'claude-opus-4-20250514',
                models: [
                    'claude-opus-4-20250514',
                    'claude-sonnet-4-20250514',
                    'claude-sonnet-3-5-20241022',
                    'claude-3-5-sonnet-20240620'
                ],
                format: 'anthropic',
                storageKey: 'claude_api_key'
            },
            openai: {
                name: 'OpenAI GPT',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                defaultModel: 'gpt-4o',
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                format: 'openai',
                storageKey: 'openai_api_key'
            },
            gemini: {
                name: 'Google Gemini',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                defaultModel: 'gemini-2.0-flash-exp',
                models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                format: 'gemini',
                storageKey: 'gemini_api_key'
            }
        };

        // Default to OpenWebUI
        this.currentProvider = localStorage.getItem('selected_provider') || 'openwebui';
        this.currentModel = localStorage.getItem('selected_model') || this.providers[this.currentProvider].defaultModel;

        // Check if API key is available
        this.apiKey = this.getApiKey();
    }
    
    /**
     * Get API key from localStorage for current provider
     * @returns {string|null} API key or null if not found
     */
    getApiKey() {
        const provider = this.providers[this.currentProvider];
        if (!provider) return null;

        // Try localStorage first (user input)
        const storedKey = localStorage.getItem(provider.storageKey);
        if (storedKey && storedKey !== 'YOUR_API_KEY_HERE') {
            return storedKey;
        }

        // Fallback to global config (backwards compatibility for OpenWebUI)
        if (this.currentProvider === 'openwebui' && window.API_CONFIG &&
            window.API_CONFIG.apiKey && window.API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
            return window.API_CONFIG.apiKey;
        }

        return null;
    }

    /**
     * Set API key for current provider
     * @param {string} apiKey - API key to store
     */
    setApiKey(apiKey) {
        const provider = this.providers[this.currentProvider];
        if (provider) {
            localStorage.setItem(provider.storageKey, apiKey);
            this.apiKey = apiKey;
        }
    }

    /**
     * Set provider and update configuration
     * @param {string} providerId - Provider ID (openwebui, claude, openai, gemini)
     */
    setProvider(providerId) {
        if (this.providers[providerId]) {
            this.currentProvider = providerId;
            localStorage.setItem('selected_provider', providerId);

            // Reset to default model for this provider
            this.currentModel = this.providers[providerId].defaultModel;
            localStorage.setItem('selected_model', this.currentModel);

            // Update API key
            this.apiKey = this.getApiKey();
        }
    }

    /**
     * Set model for current provider
     * @param {string} model - Model name
     */
    setModel(model) {
        const provider = this.providers[this.currentProvider];
        if (provider && provider.models.includes(model)) {
            this.currentModel = model;
            localStorage.setItem('selected_model', model);
        }
    }

    /**
     * Get current provider configuration
     * @returns {Object} Provider config
     */
    getProviderConfig() {
        return this.providers[this.currentProvider];
    }

    /**
     * Make API request
     * @param {string} prompt - Prompt to send to AI
     * @param {Object} options - Additional options
     * @returns {Promise} API response
     */
    async makeRequest(prompt, options = {}) {
        if (!this.apiKey) {
            const providerName = this.providers[this.currentProvider].name;
            throw new Error(`API key not configured. Please provide your ${providerName} API key.`);
        }

        const provider = this.providers[this.currentProvider];
        const systemMessage = 'You are a biblical scholar specializing in narratology and attentional cue detection in ancient texts.';

        let requestData, headers, endpoint;

        // Format request based on provider
        switch (provider.format) {
            case 'openai':
                // OpenAI format (also used by OpenWebUI)
                requestData = {
                    model: this.currentModel,
                    messages: [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.3
                };
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                };
                endpoint = provider.endpoint;
                break;

            case 'anthropic':
                // Claude/Anthropic format
                requestData = {
                    model: this.currentModel,
                    max_tokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.3,
                    system: systemMessage,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                };
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                };
                endpoint = provider.endpoint;
                break;

            case 'gemini':
                // Google Gemini format
                requestData = {
                    contents: [{
                        parts: [{
                            text: `${systemMessage}\n\n${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.3,
                        maxOutputTokens: options.maxTokens || 1000
                    }
                };
                headers = {
                    'Content-Type': 'application/json'
                };
                endpoint = `${provider.endpoint}/${this.currentModel}:generateContent?key=${this.apiKey}`;
                break;

            default:
                throw new Error(`Unsupported provider format: ${provider.format}`);
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return this.normalizeResponse(result, provider.format);
        } catch (error) {
            console.error('API request failed:', error);
            throw new Error('Failed to communicate with analysis service: ' + error.message);
        }
    }

    /**
     * Normalize API response to common format
     * @param {Object} response - Raw API response
     * @param {string} format - Provider format
     * @returns {Object} Normalized response
     */
    normalizeResponse(response, format) {
        let content;

        switch (format) {
            case 'openai':
                content = response.choices?.[0]?.message?.content || '';
                break;
            case 'anthropic':
                content = response.content?.[0]?.text || '';
                break;
            case 'gemini':
                content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
                break;
            default:
                content = '';
        }

        return {
            choices: [{
                message: {
                    content: content
                }
            }],
            content: content
        };
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
     * Show API configuration dialog with provider and model selection
     * @returns {Promise<Object>} Configuration result
     */
    async requestApiKey() {
        return new Promise((resolve) => {
            const provider = this.providers[this.currentProvider];
            const providerName = provider.name;

            // Create modal dialog
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content api-config-modal">
                    <h3>AI Analysis Configuration</h3>

                    <div class="config-section">
                        <label for="provider-select">AI Provider:</label>
                        <select id="provider-select">
                            ${Object.entries(this.providers).map(([id, p]) =>
                                `<option value="${id}" ${id === this.currentProvider ? 'selected' : ''}>${p.name}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="config-section">
                        <label for="model-select">Model:</label>
                        <select id="model-select">
                            ${provider.models.map(model =>
                                `<option value="${model}" ${model === this.currentModel ? 'selected' : ''}>${model}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="config-section">
                        <label for="api-key-input">API Key:</label>
                        <input type="password" id="api-key-input"
                               placeholder="Enter your ${providerName} API key"
                               value="${this.apiKey || ''}" />
                        <small class="help-text">Get your API key from the ${providerName} dashboard.</small>
                    </div>

                    <div class="modal-buttons">
                        <button id="save-api-config" class="btn btn-primary">Save Configuration</button>
                        <button id="cancel-api-config" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const providerSelect = document.getElementById('provider-select');
            const modelSelect = document.getElementById('model-select');
            const input = document.getElementById('api-key-input');
            const saveBtn = document.getElementById('save-api-config');
            const cancelBtn = document.getElementById('cancel-api-config');

            // Handle provider change
            providerSelect.addEventListener('change', (e) => {
                const newProvider = e.target.value;
                const newProviderConfig = this.providers[newProvider];

                // Update model dropdown
                modelSelect.innerHTML = newProviderConfig.models.map(model =>
                    `<option value="${model}">${model}</option>`
                ).join('');

                // Update API key placeholder
                input.placeholder = `Enter your ${newProviderConfig.name} API key`;

                // Load existing API key for this provider
                const existingKey = localStorage.getItem(newProviderConfig.storageKey);
                input.value = existingKey || '';
            });

            saveBtn.addEventListener('click', () => {
                const selectedProvider = providerSelect.value;
                const selectedModel = modelSelect.value;
                const key = input.value.trim();

                if (key) {
                    // Update provider and model
                    this.setProvider(selectedProvider);
                    this.setModel(selectedModel);
                    this.setApiKey(key);

                    document.body.removeChild(modal);
                    resolve({ provider: selectedProvider, model: selectedModel, key: key });
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