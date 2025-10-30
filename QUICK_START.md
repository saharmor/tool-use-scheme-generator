# Quick Start Guide

## 🚀 For Users

Visit the live app: **https://saharmor.github.io/tool-use-scheme-generator/**

### Basic Usage

1. **Add a Function**
   - Click "+ Add Function"
   - Enter function name (snake_case, e.g., `get_weather`)
   - Add description

2. **Add Parameters**
   - Click "+ Add Parameter"
   - Fill in: key, type, description
   - Check "Required" if mandatory
   - Click "Advanced" for more options

3. **Export Your Schema**
   - **Copy**: Click "Copy" to clipboard
   - **Download**: Click "Download" for `tools.json`
   - **Share**: Click "Share" for a shareable URL

### Import Existing Schema

1. Click "Import"
2. Paste your OpenAI tools JSON array
3. Click "Import"
4. Edit as needed

### Sample Schemas

Try importing these sample schemas:
- `samples/weather.json` - Basic function with enum
- `samples/array.json` - Array parameters
- `samples/nested-object.json` - Nested objects
- `samples/multi-tools.json` - Multiple functions

---

## 🛠️ For Developers

### Run Locally

```bash
# Clone the repository
git clone https://github.com/saharmor/tool-use-scheme-generator.git
cd tool-use-scheme-generator

# Start local server
python3 -m http.server 8000
# or
npx serve

# Open browser
open http://localhost:8000
```

### Project Structure

```
/
├── index.html          # Main page
├── src/
│   ├── app.js         # State & events
│   ├── render.js      # DOM rendering
│   ├── schema.js      # JSON assembly
│   └── import.js      # JSON parsing
├── styles/main.css    # All styles
└── samples/           # Example schemas
```

### Deployment

Automatic deployment to GitHub Pages on every push to `main`.

See `DEPLOYMENT.md` for details.

---

## 📝 Use with OpenAI API

```javascript
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Paste your generated schema here
const tools = [ /* ... */ ];

const response = await client.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Your prompt here" }],
  tools: tools
});

if (response.choices[0].message.tool_calls) {
  // Handle tool calls
  console.log(response.choices[0].message.tool_calls);
}
```

---

## ❓ Common Issues

### Schema Won't Copy
- Check validation errors in the preview panel
- Ensure all required fields are filled
- Test the schema with the "Test" button

### Import Fails
- Verify JSON is a valid array: `[{...}]`
- Each tool must have `type: "function"`
- Check browser console for detailed error

### Page Not Loading
- Clear browser cache
- Check browser console for errors
- Verify all files are present

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

## 📄 License

MIT License - See `LICENSE` file

