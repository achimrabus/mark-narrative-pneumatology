// Main Application Controller
// Coordinates all components and handles user interactions

/**
 * Main application controller for narratological analysis
 */
class NarratologyApp {
    constructor() {
        this.data = null;
        this.currentView = 'network';
        this.currentChapter = 1;
        this.apiAvailable = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading indicator
            this.showLoading('Loading application...');
            
            // Load data
            await this.loadData();
            
            // Initialize UI components
            this.initializeUI();
            
            // Check API availability
            await this.checkAPIAvailability();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial view
            this.loadView('network');
            
            // Hide loading indicator
            this.hideLoading();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    /**
     * Load CONLL data
     */
    async loadData() {
        try {
            this.showLoading('Loading Greek New Testament data...');
            this.data = await conllParser.loadFromFile('./greek-nt.conll');
            console.log('Data loaded:', this.data);
        } catch (error) {
            console.error('Error loading data:', error);
            throw new Error('Failed to load CONLL data. Please ensure greek-nt.conll file is available.');
        }
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Initialize navigation
        this.initializeNavigation();
        
        // Initialize view containers
        this.initializeViews();
        
        // Update chapter selector
        this.updateChapterSelector();
        
        // Initialize tooltips
        this.initializeTooltips();
    }

    /**
     * Initialize navigation
     */
    initializeNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.loadView(view);
            });
        });
    }

    /**
     * Initialize view containers
     */
    initializeViews() {
        // Network view
        this.networkView = new NetworkVisualization('network-view', this.data);
        
        // Timeline view
        this.timelineView = new TimelineVisualization('timeline-view', this.data);
        
        // Text view
        this.textView = new TextViewer('text-view', this.data);
        
        // Analysis view
        this.analysisView = new AnalysisPanel('analysis-view', this.data);
    }

    /**
     * Update chapter selector
     */
    updateChapterSelector() {
        const selector = document.getElementById('chapter-selector');
        if (!selector) return;
        
        selector.innerHTML = '';
        
        // Add chapter options
        for (let i = 1; i <= 16; i++) { // Mark has 16 chapters
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Chapter ${i}`;
            if (i === this.currentChapter) {
                option.selected = true;
            }
            selector.appendChild(option);
        }
    }

    /**
     * Initialize tooltips
     */
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Chapter selector
        const chapterSelector = document.getElementById('chapter-selector');
        if (chapterSelector) {
            chapterSelector.addEventListener('change', (e) => {
                this.currentChapter = parseInt(e.target.value);
                this.updateCurrentView();
            });
        }

        // API key button
        const apiKeyBtn = document.getElementById('api-key-btn');
        if (apiKeyBtn) {
            apiKeyBtn.addEventListener('click', () => {
                this.handleAPIKeySetup();
            });
        }

        // Analysis buttons
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.runAnalysis();
            });
        }

        // Export buttons
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Load specific view
     * @param {string} viewName - View name to load
     */
    loadView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Hide all views
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const selectedView = document.getElementById(`${viewName}-view`);
        if (selectedView) {
            selectedView.classList.add('active');
        }

        this.currentView = viewName;
        this.updateCurrentView();
    }

    /**
     * Update current view with new data
     */
    updateCurrentView() {
        switch (this.currentView) {
            case 'network':
                this.networkView.update(this.currentChapter);
                break;
            case 'timeline':
                this.timelineView.update(this.currentChapter);
                break;
            case 'text':
                this.textView.update(this.currentChapter);
                break;
            case 'analysis':
                this.analysisView.update(this.currentChapter);
                break;
        }
    }

    /**
     * Check API availability
     */
    async checkAPIAvailability() {
        try {
            this.apiAvailable = await apiClient.checkAvailability();
            this.updateAPIStatus();
        } catch (error) {
            console.warn('API check failed:', error);
            this.apiAvailable = false;
            this.updateAPIStatus();
        }
    }

    /**
     * Update API status indicator
     */
    updateAPIStatus() {
        const statusIndicator = document.getElementById('api-status');
        if (!statusIndicator) return;
        
        if (this.apiAvailable) {
            statusIndicator.className = 'status-indicator online';
            statusIndicator.textContent = 'API Online';
        } else {
            statusIndicator.className = 'status-indicator offline';
            statusIndicator.textContent = 'API Offline';
        }
    }

    /**
     * Handle API key setup
     */
    async handleAPIKeySetup() {
        try {
            const apiKey = await apiClient.requestApiKey();
            if (apiKey) {
                await this.checkAPIAvailability();
                this.showNotification('API key saved successfully', 'success');
            }
        } catch (error) {
            console.error('API key setup failed:', error);
            this.showNotification('Failed to set up API key', 'error');
        }
    }

    /**
     * Run analysis
     */
    async runAnalysis() {
        if (!this.apiAvailable) {
            this.showNotification('API not available. Please set up your API key.', 'warning');
            return;
        }

        try {
            this.showLoading('Running narratological analysis...');
            
            // Get current chapter text - try multiple approaches
            let chapterText = conllParser.getTextRange(this.currentChapter, 1, 50);
            
            // If no text from range, try to get any available text
            if (!chapterText || chapterText.trim() === '') {
                if (conllParser.data && conllParser.data.sentences) {
                    const chapterSentences = conllParser.data.sentences.filter(s => s.chapter === this.currentChapter);
                    if (chapterSentences.length > 0) {
                        chapterText = chapterSentences.slice(0, 10).map(s =>
                            s.tokens.map(t => t.form).join(' ')
                        ).join(' ');
                    }
                }
                
                // If still no text, try to get any text at all
                if (!chapterText || chapterText.trim() === '') {
                    if (conllParser.data && conllParser.data.sentences && conllParser.data.sentences.length > 0) {
                        chapterText = conllParser.data.sentences.slice(0, 20).map(s =>
                            s.tokens.map(t => t.form).join(' ')
                        ).join(' ');
                    }
                }
            }
            
            if (!chapterText || chapterText.trim() === '') {
                throw new Error('No text available for analysis. Please check if the CONLL data is properly loaded.');
            }
            
            // Run AI analysis
            const cues = await apiClient.detectCues(chapterText);
            
            // Update analysis view
            this.analysisView.displayResults(cues);
            
            this.hideLoading();
            this.showNotification('Analysis complete', 'success');
        } catch (error) {
            console.error('Analysis failed:', error);
            this.hideLoading();
            this.showNotification('Analysis failed: ' + error.message, 'error');
        }
    }

    /**
     * Export data
     */
    exportData() {
        const exportData = {
            metadata: {
                title: 'Mark\'s Gospel Narratological Analysis',
                date: new Date().toISOString(),
                chapter: this.currentChapter
            },
            characters: Array.from(conllParser.characters.values()),
            cues: conllParser.getCuesInChapter(this.currentChapter),
            summary: conllParser.getChapterSummary(this.currentChapter)
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mark-chapter-${this.currentChapter}-analysis.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully', 'success');
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + number keys for navigation
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const views = ['network', 'timeline', 'text', 'analysis'];
            const viewIndex = parseInt(e.key) - 1;
            this.loadView(views[viewIndex]);
        }

        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.exportData();
        }

        // Ctrl/Cmd + R for analysis
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.runAnalysis();
        }

        // Arrow keys for chapter navigation
        if (e.key === 'ArrowLeft' && this.currentChapter > 1) {
            this.currentChapter--;
            document.getElementById('chapter-selector').value = this.currentChapter;
            this.updateCurrentView();
        } else if (e.key === 'ArrowRight' && this.currentChapter < 16) {
            this.currentChapter++;
            document.getElementById('chapter-selector').value = this.currentChapter;
            this.updateCurrentView();
        }
    }

    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    showLoading(message = 'Loading...') {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.querySelector('.loader-text').textContent = message;
            loader.style.display = 'flex';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Show tooltip
     * @param {Element} target - Target element
     * @param {string} text - Tooltip text
     */
    showTooltip(target, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = target.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.narratologyApp = new NarratologyApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NarratologyApp;
}