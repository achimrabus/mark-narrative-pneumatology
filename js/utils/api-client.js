// API Client for multi-provider LLM communication
// Supports OpenWebUI, Claude, GPT, Gemini with dynamic model fetching

/**
 * API Client for communicating with analysis services
 * Supports multiple providers with dynamic model discovery
 */
class APIClient {
    constructor() {
        // Provider configurations with current models (Jan 2025)
        this.providers = {
            openwebui: {
                name: 'OpenWebUI',
                endpoint: 'https://openwebui.uni-freiburg.de/api/v1/chat/completions',
                modelsEndpoint: 'https://openwebui.uni-freiburg.de/api/v1/models',
                defaultModel: 'llama-3.1-8b',
                fallbackModels: ['llama-3.1-8b', 'qwen2.5-14b-instruct', 'mistral-7b'],
                format: 'openai',
                storageKey: 'openwebui_api_key',
                modelsStorageKey: 'openwebui_models',
                supportsModelFetch: true
            },
            claude: {
                name: 'Claude (Anthropic)',
                endpoint: 'https://api.anthropic.com/v1/messages',
                modelsEndpoint: 'https://api.anthropic.com/v1/models',
                defaultModel: 'claude-sonnet-4-20250514',
                fallbackModels: [
                    'claude-sonnet-4-20250514',
                    'claude-opus-4-20250514',
                    'claude-3-5-sonnet-20241022',
                    'claude-3-5-haiku-20241022',
                    'claude-3-opus-20240229'
                ],
                format: 'anthropic',
                storageKey: 'claude_api_key',
                modelsStorageKey: 'claude_models',
                supportsModelFetch: true
            },
            openai: {
                name: 'OpenAI ChatGPT',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                modelsEndpoint: 'https://api.openai.com/v1/models',
                defaultModel: 'gpt-4o',
                fallbackModels: [
                    'gpt-4o',
                    'gpt-4o-mini',
                    'gpt-4-turbo',
                    'gpt-4',
                    'gpt-3.5-turbo'
                ],
                format: 'openai',
                storageKey: 'openai_api_key',
                modelsStorageKey: 'openai_models',
                supportsModelFetch: true
            },
            gemini: {
                name: 'Google Gemini',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                defaultModel: 'gemini-2.0-flash',
                fallbackModels: [
                    'gemini-2.0-flash',
                    'gemini-2.0-flash-lite',
                    'gemini-1.5-pro',
                    'gemini-1.5-flash'
                ],
                format: 'gemini',
                storageKey: 'gemini_api_key',
                modelsStorageKey: 'gemini_models',
                supportsModelFetch: true
            }
        };

        // Default to OpenWebUI
        this.currentProvider = localStorage.getItem('selected_provider') || 'openwebui';
        this.currentModel = localStorage.getItem('selected_model') || this.providers[this.currentProvider].defaultModel;

        // Load cached models from localStorage
        this.loadCachedModels();

        // Check if API key is available
        this.apiKey = this.getApiKey();
    }

    /**
     * Load cached models from localStorage
     */
    loadCachedModels() {
        for (const [providerId, provider] of Object.entries(this.providers)) {
            const cached = localStorage.getItem(provider.modelsStorageKey);
            if (cached) {
                try {
                    const models = JSON.parse(cached);
                    if (Array.isArray(models) && models.length > 0) {
                        provider.models = models;
                    } else {
                        provider.models = [...provider.fallbackModels];
                    }
                } catch (e) {
                    provider.models = [...provider.fallbackModels];
                }
            } else {
                provider.models = [...provider.fallbackModels];
            }
        }
    }

    /**
     * Get API key from localStorage for current provider
     * @returns {string|null} API key or null if not found
     */
    getApiKey() {
        const provider = this.providers[this.currentProvider];
        if (!provider) return null;

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
     * Set API key for a specific provider
     * @param {string} apiKey - API key to store
     * @param {string} providerId - Provider ID (optional, defaults to current)
     */
    setApiKey(apiKey, providerId = null) {
        const id = providerId || this.currentProvider;
        const provider = this.providers[id];
        if (provider) {
            localStorage.setItem(provider.storageKey, apiKey);
            if (id === this.currentProvider) {
                this.apiKey = apiKey;
            }
        }
    }

    /**
     * Set provider and update configuration
     * @param {string} providerId - Provider ID
     */
    setProvider(providerId) {
        if (this.providers[providerId]) {
            this.currentProvider = providerId;
            localStorage.setItem('selected_provider', providerId);

            // Reset to default model for this provider
            const provider = this.providers[providerId];
            if (provider.models && provider.models.length > 0) {
                this.currentModel = provider.models[0];
            } else {
                this.currentModel = provider.defaultModel;
            }
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
        this.currentModel = model;
        localStorage.setItem('selected_model', model);
    }

    /**
     * Get current provider configuration
     * @returns {Object} Provider config
     */
    getProviderConfig() {
        return this.providers[this.currentProvider];
    }

    /**
     * Fetch available models from API provider
     * @param {string} providerId - Provider ID
     * @param {string} apiKey - API key to use (optional)
     * @returns {Promise<Object>} Result with models array and status
     */
    async fetchAvailableModels(providerId, apiKey = null) {
        const provider = this.providers[providerId];
        if (!provider) {
            return { success: false, models: [], error: 'Unknown provider' };
        }

        const key = apiKey || localStorage.getItem(provider.storageKey);
        if (!key) {
            return {
                success: false,
                models: provider.fallbackModels,
                error: 'No API key provided'
            };
        }

        try {
            let endpoint, headers, response, data, models = [];

            switch (providerId) {
                case 'openwebui':
                    // OpenWebUI uses OpenAI-compatible API
                    endpoint = provider.modelsEndpoint;
                    headers = { 'Authorization': `Bearer ${key}` };
                    response = await fetch(endpoint, { headers });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    data = await response.json();
                    models = (data.data || data.models || [])
                        .map(m => m.id || m.name)
                        .filter(m => m && !m.includes('embed'));
                    break;

                case 'openai':
                    endpoint = provider.modelsEndpoint;
                    headers = { 'Authorization': `Bearer ${key}` };
                    response = await fetch(endpoint, { headers });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    data = await response.json();
                    // Filter for chat models only
                    models = (data.data || [])
                        .map(m => m.id)
                        .filter(m => m && (
                            m.includes('gpt-4') ||
                            m.includes('gpt-3.5') ||
                            m.includes('o1') ||
                            m.includes('o3')
                        ))
                        .filter(m => !m.includes('instruct') && !m.includes('vision'))
                        .sort((a, b) => {
                            // Sort newest models first
                            if (a.includes('gpt-4o') && !b.includes('gpt-4o')) return -1;
                            if (b.includes('gpt-4o') && !a.includes('gpt-4o')) return 1;
                            return a.localeCompare(b);
                        });
                    break;

                case 'claude':
                    // Anthropic models endpoint
                    endpoint = provider.modelsEndpoint;
                    headers = {
                        'x-api-key': key,
                        'anthropic-version': '2023-06-01'
                    };
                    response = await fetch(endpoint, { headers });

                    if (!response.ok) {
                        // Anthropic may not allow models listing, use fallback
                        console.log('[API] Anthropic models endpoint not accessible, using known models');
                        models = provider.fallbackModels;
                    } else {
                        data = await response.json();
                        models = (data.data || [])
                            .map(m => m.id)
                            .filter(m => m && m.includes('claude'))
                            .sort((a, b) => b.localeCompare(a)); // Newest first
                    }
                    break;

                case 'gemini':
                    endpoint = `${provider.modelsEndpoint}?key=${key}`;
                    response = await fetch(endpoint);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    data = await response.json();
                    models = (data.models || [])
                        .filter(m => m.supportedGenerationMethods &&
                                    m.supportedGenerationMethods.includes('generateContent'))
                        .map(m => m.name.replace('models/', ''))
                        .filter(m => m.includes('gemini'))
                        .sort((a, b) => {
                            // Sort by version (2.0 > 1.5 > 1.0)
                            const vA = a.match(/(\d+\.\d+)/)?.[1] || '0';
                            const vB = b.match(/(\d+\.\d+)/)?.[1] || '0';
                            return parseFloat(vB) - parseFloat(vA);
                        });
                    break;

                default:
                    return {
                        success: false,
                        models: provider.fallbackModels,
                        error: 'Provider not supported for model fetching'
                    };
            }

            // Ensure we have models
            if (models.length === 0) {
                models = provider.fallbackModels;
            }

            // Cache the models
            localStorage.setItem(provider.modelsStorageKey, JSON.stringify(models));
            provider.models = models;

            console.log(`[API] Found ${models.length} models for ${provider.name}:`, models.slice(0, 10));

            return { success: true, models, error: null };

        } catch (error) {
            console.error(`[API] Error fetching models for ${provider.name}:`, error);
            return {
                success: false,
                models: provider.fallbackModels,
                error: error.message
            };
        }
    }

    /**
     * Validate API key by attempting to fetch models
     * @param {string} providerId - Provider ID
     * @param {string} apiKey - API key to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateApiKey(providerId, apiKey) {
        if (!apiKey || apiKey.trim() === '') {
            return { valid: false, error: 'API key is empty' };
        }

        const result = await this.fetchAvailableModels(providerId, apiKey);

        if (result.success) {
            return { valid: true, models: result.models };
        } else if (result.error && result.error.includes('401')) {
            return { valid: false, error: 'Invalid API key' };
        } else if (result.error && result.error.includes('403')) {
            return { valid: false, error: 'API key does not have permission' };
        } else {
            // If we can't verify but have fallback models, assume valid
            return { valid: true, models: result.models, warning: result.error };
        }
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

        switch (provider.format) {
            case 'openai':
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
            console.log(`[API] Making request to ${provider.name} (${this.currentModel})`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                console.error(`[API] Request failed:`, {
                    provider: provider.name,
                    model: this.currentModel,
                    status: response.status,
                    error: errorText
                });
                throw new Error(`${provider.name} API error (${response.status}): ${errorText || response.statusText}`);
            }

            const result = await response.json();
            console.log(`[API] Request successful to ${provider.name}`);
            return this.normalizeResponse(result, provider.format);
        } catch (error) {
            console.error('[API] Request failed:', error);
            if (error.message.includes('404')) {
                throw new Error(`Model "${this.currentModel}" not found. Try refreshing the model list.`);
            } else if (error.message.includes('401') || error.message.includes('403')) {
                throw new Error(`Authentication failed for ${provider.name}. Please check your API key.`);
            } else if (error.message.includes('429')) {
                throw new Error(`Rate limit exceeded for ${provider.name}. Please try again later.`);
            }
            throw new Error(`${provider.name} error: ${error.message}`);
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
            choices: [{ message: { content: content } }],
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
            let content;
            if (response.choices && response.choices[0]) {
                content = response.choices[0].message.content;
            } else if (response.content) {
                content = response.content;
            } else {
                content = response;
            }

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
            const currentProvider = this.providers[this.currentProvider];

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
                        <label for="api-key-input">API Key:</label>
                        <div class="api-key-row">
                            <input type="password" id="api-key-input"
                                   placeholder="Enter your API key"
                                   value="${this.apiKey || ''}" />
                            <button id="validate-key-btn" class="btn btn-small" title="Validate key and fetch models">
                                Validate
                            </button>
                        </div>
                        <small id="api-key-status" class="help-text"></small>
                    </div>

                    <div class="config-section">
                        <label for="model-select">Model:</label>
                        <div class="model-select-row">
                            <select id="model-select">
                                ${(currentProvider.models || currentProvider.fallbackModels).map(model =>
                                    `<option value="${model}" ${model === this.currentModel ? 'selected' : ''}>${model}</option>`
                                ).join('')}
                            </select>
                            <button id="refresh-models-btn" class="btn btn-small" title="Refresh model list">
                                ↻
                            </button>
                        </div>
                        <small id="model-status" class="help-text">
                            ${currentProvider.models ? `${currentProvider.models.length} models available` : 'Using default models'}
                        </small>
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
            const validateBtn = document.getElementById('validate-key-btn');
            const refreshBtn = document.getElementById('refresh-models-btn');
            const saveBtn = document.getElementById('save-api-config');
            const cancelBtn = document.getElementById('cancel-api-config');
            const keyStatus = document.getElementById('api-key-status');
            const modelStatus = document.getElementById('model-status');

            // Update model dropdown
            const updateModelDropdown = (models, selectedModel = null) => {
                modelSelect.innerHTML = models.map(model =>
                    `<option value="${model}" ${model === selectedModel ? 'selected' : ''}>${model}</option>`
                ).join('');
                modelStatus.textContent = `${models.length} models available`;
                modelStatus.className = 'help-text success';
            };

            // Handle provider change
            providerSelect.addEventListener('change', async (e) => {
                const newProviderId = e.target.value;
                const newProvider = this.providers[newProviderId];

                // Load existing API key for this provider
                const existingKey = localStorage.getItem(newProvider.storageKey);
                input.value = existingKey || '';
                input.placeholder = `Enter your ${newProvider.name} API key`;

                // Update model dropdown with cached or fallback models
                const models = newProvider.models || newProvider.fallbackModels;
                updateModelDropdown(models, newProvider.defaultModel);

                // Clear status
                keyStatus.textContent = '';
                keyStatus.className = 'help-text';
            });

            // Validate API key and fetch models
            const validateAndFetchModels = async () => {
                const providerId = providerSelect.value;
                const apiKey = input.value.trim();

                if (!apiKey) {
                    keyStatus.textContent = 'Please enter an API key';
                    keyStatus.className = 'help-text error';
                    return;
                }

                validateBtn.disabled = true;
                validateBtn.textContent = '...';
                keyStatus.textContent = 'Validating...';
                keyStatus.className = 'help-text';
                modelStatus.textContent = 'Fetching models...';

                const result = await this.validateApiKey(providerId, apiKey);

                validateBtn.disabled = false;
                validateBtn.textContent = 'Validate';

                if (result.valid) {
                    keyStatus.textContent = result.warning ?
                        `Valid (${result.warning})` : 'API key is valid';
                    keyStatus.className = 'help-text success';

                    if (result.models && result.models.length > 0) {
                        updateModelDropdown(result.models, result.models[0]);
                        // Save the key since it's valid
                        this.setApiKey(apiKey, providerId);
                    }
                } else {
                    keyStatus.textContent = result.error || 'Invalid API key';
                    keyStatus.className = 'help-text error';
                    modelStatus.textContent = 'Using default models';
                    modelStatus.className = 'help-text';
                }
            };

            validateBtn.addEventListener('click', validateAndFetchModels);

            // Also validate on Enter key in input
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    validateAndFetchModels();
                }
            });

            // Refresh models button
            refreshBtn.addEventListener('click', async () => {
                const providerId = providerSelect.value;
                const apiKey = input.value.trim();

                if (!apiKey) {
                    modelStatus.textContent = 'Enter API key first';
                    modelStatus.className = 'help-text error';
                    return;
                }

                refreshBtn.disabled = true;
                refreshBtn.textContent = '...';
                modelStatus.textContent = 'Refreshing...';

                const result = await this.fetchAvailableModels(providerId, apiKey);

                refreshBtn.disabled = false;
                refreshBtn.textContent = '↻';

                if (result.success) {
                    updateModelDropdown(result.models, result.models[0]);
                } else {
                    modelStatus.textContent = `Error: ${result.error}. Using defaults.`;
                    modelStatus.className = 'help-text error';
                }
            });

            saveBtn.addEventListener('click', () => {
                const selectedProvider = providerSelect.value;
                const selectedModel = modelSelect.value;
                const key = input.value.trim();

                if (key) {
                    this.setProvider(selectedProvider);
                    this.setApiKey(key, selectedProvider);
                    this.setModel(selectedModel);

                    document.body.removeChild(modal);
                    resolve({ provider: selectedProvider, model: selectedModel, key: key });
                } else {
                    keyStatus.textContent = 'Please enter an API key';
                    keyStatus.className = 'help-text error';
                    input.focus();
                }
            });

            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });

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
