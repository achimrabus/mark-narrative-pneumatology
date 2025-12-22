# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Debug Rules (Non-Obvious Only)

### API Connection Testing
- Use `test-api.html` file to verify OpenWebUI API connectivity
- API endpoint: `https://openwebui.uni-freiburg.de/api/v1/chat/completions` (confirmed working)
- Check browser Network tab for API request/response details
- API key stored in localStorage under 'openwebui_api_key'
- CMD test: `powershell -Command "Invoke-RestMethod -Uri 'https://openwebui.uni-freiburg.de/api/v1/chat/completions' -Method Post -ContentType 'application/json' -InFile 'test-api-cmd.json'"`
- API returns "Not authenticated" (401) without API key - expected behavior, confirms endpoint is working
- No 400 errors encountered - endpoint and request format are correct

### Secure API Key Usage
- **Browser Method**: Use app's "API Setup" button to securely store key in localStorage
- **CMD Method**: Set environment variable `OPENWEBUI_API_KEY` and use: `powershell -Command "$headers = @{'Authorization'='Bearer $env:OPENWEBUI_API_KEY'; 'Content-Type'='application/json'}; Invoke-RestMethod -Uri 'https://openwebui.uni-freiburg.de/api/v1/chat/completions' -Method Post -Headers $headers -InFile 'test-api-cmd.json'"`
- **Security Notes**: Never hardcode API keys in files; use environment variables or browser localStorage
- **Testing**: After setting key, test with `test-api.html` or reload main app to check API status indicator

### Common Debugging Locations
- Global objects exposed on window: `window.conllParser`, `window.apiClient`, `window.narratologyApp`
- CONLL data structure: check `window.conllParser.data` after loading
- Character mappings: `window.conllParser.characters` Map object
- Attentional cues: `window.conllParser.data.cues` array

### Script Loading Issues
- Script loading order is critical in index.html (lines 148-168)
- Missing dependencies cause undefined object errors
- Check browser console for "Cannot read property of undefined" errors
- Verify all scripts load before `js/app.js` initializes

### Data Loading Problems
- CONLL file must be accessible at `./greek-nt.conll`
- 404 errors for CONLL file appear in Network tab
- Parser throws "Failed to load CONLL file" if file missing
- Check `conllParser.loadFromFile()` promise rejection

### Component Initialization
- Components require container elements to exist in DOM
- Missing containers cause "Container not found" console errors
- Check component constructors for null container references
- Verify HTML structure matches component expectations

### Greek Text Display Issues
- Unicode polytonic Greek requires proper font loading
- Check CSS for font-family: 'Gentium Plus', 'Noto Serif'
- Missing fonts show as boxes or question marks
- Verify UTF-8 encoding in HTML meta tag

### Visualization Rendering
- D3.js visualizations need container dimensions
- Zero-height containers cause no rendering
- Check browser DevTools for SVG element dimensions
- Force simulation may need restart on data updates

### API Error Patterns
- API failures show user notifications, not console errors
- Check `apiClient.checkAvailability()` for connectivity
- Graceful degradation maintains core functionality without API
- Network errors logged to console with context

### Performance Debugging
- Large CONLL files cause slow initial parsing
- Check `conllParser.parse()` performance with console.time
- D3 force simulation may lag with many nodes
- Use browser Performance tab for profiling

### Browser Compatibility
- Application tested in modern browsers with ES6 support
- IE11 not supported (uses ES6 classes, arrow functions)
- Check for unsupported JavaScript features in older browsers
- Polyfills not included - keep to modern browser features