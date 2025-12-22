# Deployment Guide

## Easy GitHub Pages Deployment

This application is designed for simple deployment to GitHub Pages. No build process required - it's all static files!

### Option 1: Automatic Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Build and deployment", select **GitHub Actions**
   - That's it! The workflow will automatically deploy your site

3. **Visit your site**
   - Your app will be available at: `https://achimrabus.github.io/mark-narrative-pneumatology`

### Option 2: Manual Deployment

If you prefer manual deployment:

1. **Enable GitHub Pages**
   - Go to **Settings** → **Pages**
   - Under "Build and deployment", select **Deploy from a branch**
   - Source: **Deploy from a branch**
   - Branch: **main** and folder: **/ (root)**
   - Click **Save**

2. **Push your code**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

### What Gets Deployed

The deployment includes:
- `index.html` - Main application
- `css/` - Stylesheets
- `js/` - JavaScript modules
- `data/` - CONLL data file
- `greek-nt.conll` - Greek New Testament data

### What's NOT Deployed

Development-only files are excluded:
- `proxy-server.js` - Development proxy
- `config.template.js` - Configuration template
- `docs/` - Documentation files
- `.gitignore` - Git ignore file

### Troubleshooting

**Site not loading?**
- Wait a few minutes for GitHub Pages to process
- Check the Actions tab for deployment status
- Ensure your repository is public

**404 errors?**
- Make sure `greek-nt.conll` is in the repository
- Check file paths in browser console (F12)

**API not working?**
- AI features require OpenWebUI API key
- Users can configure their own key in the app
- Core functionality works without API

### Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file**
   ```bash
   echo "yourdomain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push origin main
   ```

2. **Configure DNS**
   - Follow GitHub's custom domain guide
   - Add DNS records as instructed

### Performance Tips

- The app loads ~2MB of Greek text data
- Consider lazy loading for large datasets
- Use browser caching for repeated visits

---

That's it! Your narratological analysis tool should be live and ready for research use.