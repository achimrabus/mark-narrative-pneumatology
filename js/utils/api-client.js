// API Client for multi-provider LLM communication
// Supports OpenWebUI, Claude, GPT, Gemini with dynamic model fetching

/**
 * API Client for communicating with analysis services
 * Supports multiple providers with dynamic model discovery
 */
class APIClient {
    constructor() {
        // Analysis settings (can be tweaked per model)
        this.analysisSettings = this.loadAnalysisSettings();

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
     * Load analysis settings from localStorage
     * @returns {Object} Analysis settings
     */
    loadAnalysisSettings() {
        const defaults = {
            maxInputChars: 2000,      // Max characters to send to model
            maxTokens: 2000,          // Max output tokens
            temperature: 0.3,         // Lower = more deterministic
            promptStyle: 'concise',   // 'concise' or 'detailed'
            retryOnEmpty: true,       // Retry with shorter input on empty response
            stripThinking: true       // Remove <think> blocks from response
        };

        try {
            const saved = localStorage.getItem('analysis_settings');
            if (saved) {
                return { ...defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('[API] Failed to load analysis settings:', e);
        }
        return defaults;
    }

    /**
     * Save analysis settings to localStorage
     * @param {Object} settings - Settings to save
     */
    saveAnalysisSettings(settings) {
        this.analysisSettings = { ...this.analysisSettings, ...settings };
        localStorage.setItem('analysis_settings', JSON.stringify(this.analysisSettings));
        console.log('[API] Saved analysis settings:', this.analysisSettings);
    }

    /**
     * Get current analysis settings
     * @returns {Object} Current settings
     */
    getAnalysisSettings() {
        return { ...this.analysisSettings };
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
     * @param {boolean} isRetry - Whether this is a retry attempt
     * @returns {Promise<Array>} Detected cues
     */
    async detectCues(text, isRetry = false) {
        const settings = this.analysisSettings;
        console.log('[API] detectCues called with text length:', text?.length || 0);
        console.log('[API] Settings:', JSON.stringify(settings));

        // Limit text length based on settings (use smaller limit on retry)
        const maxTextLength = isRetry ? Math.floor(settings.maxInputChars / 2) : settings.maxInputChars;
        const truncatedText = text.length > maxTextLength
            ? text.substring(0, maxTextLength) + '...'
            : text;

        console.log('[API] Using text length:', truncatedText.length, '(truncated:', text.length > maxTextLength, ', retry:', isRetry, ')');

        // Build prompt based on style setting
        let prompt;
        if (settings.promptStyle === 'detailed') {
            prompt = `You are a biblical narratology expert. Analyze this Ancient Greek text from Mark's Gospel for attentional cues that direct readers to construct character models.

Text: "${truncatedText}"

Identify these types of attentional cues:
1. primacy: Early mentions that establish character importance
2. causal: Events attributed to off-stage characters (cause implied but actor not present)
3. focalization: Shifts in narrative perspective or viewpoint
4. absence: Notable omissions or gaps where something expected is missing
5. prolepsis: Forward references that anticipate future action

For each cue found, provide:
- type: One of the five cue types above
- location: The specific Greek word or phrase
- explanation: How this cue functions narratively
- confidence: A score from 0 to 1

Respond with valid JSON only. Do not include any reasoning, thinking, or explanation outside the JSON:
{"cues":[{"type":"primacy","location":"Greek text","explanation":"narrative function","confidence":0.8}]}`;
        } else {
            // Concise prompt (default) - less likely to trigger extended thinking
            prompt = `Attentional cues in this Greek Gospel text:

"${truncatedText}"

Types: primacy (early importance), causal (off-stage attribution), focalization (perspective shift), absence (notable gap), prolepsis (forward reference).

JSON only, no explanation:
{"cues":[{"type":"TYPE","location":"GREEK","explanation":"FUNCTION","confidence":0.8}]}`;
        }

        console.log('[API] Sending cue detection request (prompt length:', prompt.length, ', maxTokens:', settings.maxTokens, ')...');

        const response = await this.makeRequest(prompt, {
            maxTokens: settings.maxTokens,
            temperature: settings.temperature
        });
        console.log('[API] Raw response received:', JSON.stringify(response).substring(0, 500));

        // Check for empty response
        const content = response?.content || response?.choices?.[0]?.message?.content || '';
        if (!content || content.trim() === '') {
            if (settings.retryOnEmpty && !isRetry) {
                console.warn('[API] Empty response, retrying with shorter input...');
                return this.detectCues(text, true);
            }
            console.error('[API] Model returned empty response. Try adjusting settings or using a different model.');
            throw new Error('Model returned empty response. Try adjusting Advanced Settings or using a different model.');
        }

        const cues = this.parseCueResponse(response);

        // If parsing failed and we haven't retried, try with shorter input
        if (cues.length === 0 && settings.retryOnEmpty && !isRetry) {
            console.warn('[API] No cues parsed, retrying with shorter input...');
            return this.detectCues(text, true);
        }

        return cues;
    }

    /**
     * Analyze character relationships
     * @param {Array} characters - Character list
     * @param {string} text - Text context
     * @returns {Promise<Object>} Character analysis
     */
    async analyzeCharacters(characters, text) {
        const characterList = characters.map(c => c.name).join(', ');
        // Limit text length
        const truncatedText = text.length > 1500 ? text.substring(0, 1500) + '...' : text;

        const prompt = `Analyze character relationships in this Gospel of Mark passage.

Characters: ${characterList}
Text: "${truncatedText}"

Identify: interactions, relationships, power dynamics, narrative roles.

Return JSON only (no thinking/reasoning):
{"relationships":[{"characters":["A","B"],"type":"interaction/implicit","description":"..."}],"roles":{"Jesus":"protagonist"}}`;

        return await this.makeRequest(prompt, { maxTokens: 2000 });
    }

    /**
     * Recognize narrative patterns
     * @param {Array} segments - Text segments
     * @returns {Promise<Array>} Pattern analysis
     */
    async recognizePatterns(segments) {
        console.log('[API] recognizePatterns called with', segments?.length || 0, 'segments');

        // Limit to first 5 segments to reduce token count
        const limitedSegments = segments.slice(0, 5);
        const segmentText = limitedSegments.map(s => s.text).join(' | ');
        const truncatedText = segmentText.length > 1500 ? segmentText.substring(0, 1500) + '...' : segmentText;

        const prompt = `Identify narrative patterns in these Gospel of Mark segments:

"${truncatedText}"

Patterns to find: character introductions, scene transitions, attentional cues, narrative rhythm.

Return JSON only (no thinking/reasoning):
{"character_introduction":["pattern"],"scene_transitions":["pattern"],"attentional_cues":["observation"],"narrative_rhythm":["observation"]}`;

        return await this.makeRequest(prompt, { maxTokens: 2000 });
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
            } else if (typeof response === 'string') {
                content = response;
            } else {
                content = JSON.stringify(response);
            }

            console.log('[API] Parsing cue response, content length:', content?.length || 0);
            console.log('[API] Response preview:', content?.substring(0, 800));

            if (!content || content.trim() === '') {
                console.warn('[API] Empty response content');
                return [];
            }

            // Remove markdown code blocks if present (LLMs often wrap JSON in ```json ... ```)
            // Also remove <think>...</think> reasoning blocks (used by GLM and other models)
            let cleanContent = content
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .replace(/<think>[\s\S]*?<\/think>/gi, '')  // Remove complete thinking blocks
                .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')  // Remove reasoning blocks
                .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')  // Remove analysis blocks
                .trim();

            // Handle incomplete thinking blocks (model ran out of tokens before closing tag)
            // Look for JSON that might appear after an unclosed <think> tag
            if (cleanContent.includes('<think>') && !cleanContent.includes('</think>')) {
                console.log('[API] Detected incomplete <think> block, looking for JSON after it');
                // Try to find JSON anywhere in the original content
                const jsonInContent = content.match(/\{"cues"\s*:\s*\[[\s\S]*?\]\s*\}/);
                if (jsonInContent) {
                    cleanContent = jsonInContent[0];
                    console.log('[API] Found JSON in incomplete response:', cleanContent.substring(0, 200));
                } else {
                    // No JSON found - model probably ran out of tokens during thinking
                    console.warn('[API] Model appears to have run out of tokens during thinking phase');
                    cleanContent = '';
                }
            }

            console.log('[API] Clean content preview:', cleanContent.substring(0, 500));
            console.log('[API] Content length after cleaning:', cleanContent.length);

            // Try to find JSON object in the response
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('[API] Parsed JSON object:', JSON.stringify(parsed).substring(0, 500));

                    // Handle different response structures
                    if (parsed.cues && Array.isArray(parsed.cues)) {
                        console.log('[API] Found', parsed.cues.length, 'cues in "cues" key');
                        return parsed.cues;
                    }
                    if (Array.isArray(parsed)) {
                        console.log('[API] Response is array with', parsed.length, 'items');
                        return parsed;
                    }
                    // Maybe cues are nested differently
                    if (parsed.results || parsed.data || parsed.attentional_cues || parsed.analysis) {
                        const cues = parsed.results || parsed.data || parsed.attentional_cues || parsed.analysis;
                        if (Array.isArray(cues)) {
                            console.log('[API] Found cues in alternate key:', cues.length);
                            return cues;
                        }
                    }
                    // Check if the parsed object itself has cue-like properties
                    if (parsed.type && (parsed.location || parsed.explanation)) {
                        console.log('[API] Single cue object detected');
                        return [parsed];
                    }
                    // Return empty array if parsed but no cues found
                    console.warn('[API] JSON parsed but no cues array found. Keys:', Object.keys(parsed));
                    return [];
                } catch (jsonError) {
                    console.warn('[API] JSON object parse failed:', jsonError.message);
                    console.warn('[API] Attempted to parse:', jsonMatch[0].substring(0, 300));
                }
            }

            // Try to find JSON array directly
            const arrayMatch = cleanContent.match(/\[[\s\S]*?\]/);
            if (arrayMatch) {
                try {
                    const parsed = JSON.parse(arrayMatch[0]);
                    if (Array.isArray(parsed)) {
                        console.log('[API] Found array directly with', parsed.length, 'items');
                        return parsed;
                    }
                } catch (e) {
                    console.warn('[API] Array parse failed:', e.message);
                }
            }

            console.warn('[API] Could not parse cues from response. Raw content type:', typeof content);
            return [];
        } catch (error) {
            console.error('[API] Error parsing cue response:', error);
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
     * Show Advanced Settings dialog for tuning analysis parameters
     * @returns {Promise<Object|null>} Updated settings or null if cancelled
     */
    async showAdvancedSettings() {
        return new Promise((resolve) => {
            const settings = this.getAnalysisSettings();

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content api-config-modal">
                    <h3>Advanced Analysis Settings</h3>
                    <p class="help-text">Tune these parameters if analysis fails or produces inconsistent results.</p>

                    <div class="config-section">
                        <label for="max-input-chars">Max Input Characters:</label>
                        <input type="number" id="max-input-chars" value="${settings.maxInputChars}" min="500" max="10000" step="500" />
                        <small class="help-text">Reduce if model runs out of tokens during "thinking"</small>
                    </div>

                    <div class="config-section">
                        <label for="max-tokens">Max Output Tokens:</label>
                        <input type="number" id="max-tokens" value="${settings.maxTokens}" min="500" max="8000" step="500" />
                        <small class="help-text">Increase if model runs out of tokens before producing JSON</small>
                    </div>

                    <div class="config-section">
                        <label for="temperature">Temperature:</label>
                        <input type="number" id="temperature" value="${settings.temperature}" min="0" max="1" step="0.1" />
                        <small class="help-text">Lower = more consistent, Higher = more creative</small>
                    </div>

                    <div class="config-section">
                        <label for="prompt-style">Prompt Style:</label>
                        <select id="prompt-style">
                            <option value="concise" ${settings.promptStyle === 'concise' ? 'selected' : ''}>Concise (faster, less thinking)</option>
                            <option value="detailed" ${settings.promptStyle === 'detailed' ? 'selected' : ''}>Detailed (more context, may trigger thinking)</option>
                        </select>
                        <small class="help-text">Concise works better with models that use &lt;think&gt; blocks</small>
                    </div>

                    <div class="config-section">
                        <label class="checkbox-label">
                            <input type="checkbox" id="retry-on-empty" ${settings.retryOnEmpty ? 'checked' : ''} />
                            Retry with shorter input on failure
                        </label>
                    </div>

                    <div class="config-section">
                        <label class="checkbox-label">
                            <input type="checkbox" id="strip-thinking" ${settings.stripThinking ? 'checked' : ''} />
                            Strip &lt;think&gt; blocks from response
                        </label>
                    </div>

                    <div class="modal-buttons">
                        <button id="save-advanced-settings" class="btn btn-primary">Save Settings</button>
                        <button id="reset-advanced-settings" class="btn btn-secondary">Reset to Defaults</button>
                        <button id="cancel-advanced-settings" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            const closeModal = (result = null) => {
                document.body.style.overflow = '';
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
                resolve(result);
            };

            document.getElementById('save-advanced-settings').addEventListener('click', () => {
                const newSettings = {
                    maxInputChars: parseInt(document.getElementById('max-input-chars').value) || 2000,
                    maxTokens: parseInt(document.getElementById('max-tokens').value) || 2000,
                    temperature: parseFloat(document.getElementById('temperature').value) || 0.3,
                    promptStyle: document.getElementById('prompt-style').value,
                    retryOnEmpty: document.getElementById('retry-on-empty').checked,
                    stripThinking: document.getElementById('strip-thinking').checked
                };
                this.saveAnalysisSettings(newSettings);
                closeModal(newSettings);
            });

            document.getElementById('reset-advanced-settings').addEventListener('click', () => {
                document.getElementById('max-input-chars').value = 2000;
                document.getElementById('max-tokens').value = 2000;
                document.getElementById('temperature').value = 0.3;
                document.getElementById('prompt-style').value = 'concise';
                document.getElementById('retry-on-empty').checked = true;
                document.getElementById('strip-thinking').checked = true;
            });

            document.getElementById('cancel-advanced-settings').addEventListener('click', () => {
                closeModal(null);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(null);
            });

            document.addEventListener('keydown', function handler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handler);
                    closeModal(null);
                }
            });
        });
    }

    /**
     * Test API with a simple request to verify model works
     * Call this from browser console: apiClient.testApi()
     * @returns {Promise<Object>} Test result
     */
    async testApi() {
        console.log('[API Test] Testing API with simple request...');
        console.log('[API Test] Provider:', this.currentProvider);
        console.log('[API Test] Model:', this.currentModel);

        try {
            const response = await this.makeRequest('Reply with exactly: {"test":"success"}', { maxTokens: 50 });
            const content = response?.content || response?.choices?.[0]?.message?.content || '';

            console.log('[API Test] Response:', content);

            if (!content || content.trim() === '') {
                console.error('[API Test] FAILED - Model returned empty response');
                console.error('[API Test] This model may not work for analysis. Try a different model.');
                return { success: false, error: 'Empty response', content: '' };
            }

            console.log('[API Test] SUCCESS - Model is responding');
            return { success: true, content };
        } catch (error) {
            console.error('[API Test] FAILED -', error.message);
            return { success: false, error: error.message };
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

            // Prevent body scroll when modal is open
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const providerSelect = document.getElementById('provider-select');
            const modelSelect = document.getElementById('model-select');
            const input = document.getElementById('api-key-input');
            const validateBtn = document.getElementById('validate-key-btn');
            const refreshBtn = document.getElementById('refresh-models-btn');
            const saveBtn = document.getElementById('save-api-config');
            const cancelBtn = document.getElementById('cancel-api-config');
            const keyStatus = document.getElementById('api-key-status');
            const modelStatus = document.getElementById('model-status');

            // Get all focusable elements for tab trapping
            const focusableElements = modal.querySelectorAll(
                'button, select, input, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            // Close modal helper function
            const closeModal = (result = null) => {
                document.body.style.overflow = originalOverflow;
                document.removeEventListener('keydown', handleKeyDown);
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
                resolve(result);
            };

            // Handle keyboard events
            const handleKeyDown = (e) => {
                // Escape key closes modal
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeModal(null);
                    return;
                }

                // Tab key trapping
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        // Shift+Tab: if on first element, go to last
                        if (document.activeElement === firstFocusable) {
                            e.preventDefault();
                            lastFocusable.focus();
                        }
                    } else {
                        // Tab: if on last element, go to first
                        if (document.activeElement === lastFocusable) {
                            e.preventDefault();
                            firstFocusable.focus();
                        }
                    }
                }

                // Enter key on input triggers validation
                if (e.key === 'Enter' && document.activeElement === input) {
                    e.preventDefault();
                    validateAndFetchModels();
                }
            };

            document.addEventListener('keydown', handleKeyDown);

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

                    closeModal({ provider: selectedProvider, model: selectedModel, key: key });
                } else {
                    keyStatus.textContent = 'Please enter an API key';
                    keyStatus.className = 'help-text error';
                    input.focus();
                }
            });

            cancelBtn.addEventListener('click', () => {
                closeModal(null);
            });

            // Also close when clicking outside the modal content
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(null);
                }
            });

            // Focus on first input after modal opens
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
