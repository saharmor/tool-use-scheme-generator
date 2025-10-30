# Deployment Guide

## GitHub Pages Setup

The repository is already configured with GitHub Actions to automatically deploy to GitHub Pages. Follow these steps to enable it:

### 1. Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/saharmor/tool-use-scheme-generator
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
5. Save the settings

### 2. Trigger Deployment

The GitHub Actions workflow is already set up and will deploy automatically on:
- Every push to the `main` branch
- Manual workflow dispatch (from the Actions tab)

Since you just pushed the code, the workflow should already be running or completed.

### 3. Check Deployment Status

1. Go to the **Actions** tab in your repository
2. Look for the "Deploy to GitHub Pages" workflow
3. Click on the latest run to see the status
4. Once completed successfully, your site will be live

### 4. Access Your Site

Your site will be available at:
```
https://saharmor.github.io/tool-use-scheme-generator/
```

### 5. Verify Deployment

Visit the URL above and test:
- Page loads correctly
- All assets (CSS, JS) load without 404 errors
- JavaScript functionality works
- No console errors

## Troubleshooting

### Workflow Not Running
- Check the Actions tab for any error messages
- Ensure GitHub Pages is enabled in repository settings
- Verify the workflow file exists at `.github/workflows/pages.yml`

### 404 Errors for Assets
- Check that asset paths in `index.html` start with `/` (absolute paths)
- Verify all files were committed and pushed

### JavaScript Not Working
- Open browser DevTools console
- Check for CORS or module loading errors
- Verify the `type="module"` attribute on the script tag

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file to the repository root with your domain
2. Configure DNS settings with your domain provider
3. Update the CNAME record to point to `saharmor.github.io`
4. Wait for DNS propagation (can take up to 48 hours)

## Manual Deployment

If GitHub Actions doesn't work, you can deploy manually:

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Deploy manually
gh workflow run pages.yml
```

## Local Testing

Before deploying, always test locally:

```bash
# Start local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## Post-Deployment

After successful deployment:
1. Update the README with the live URL
2. Test all functionality on the live site
3. Share the URL with users
4. Monitor GitHub Actions for any future deployment issues

