<div align="center">

# ✨ Tool Calls Schema Generator

A lightweight, static web app for generating valid OpenAI "tools" JSON schemas. Define functions and parameters with advanced validation options, then copy, download, import, or share your configurations.

<p>
<a href="https://www.linkedin.com/in/sahar-mor/" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-Connect-blue" alt="LinkedIn"></a>
<a href="https://x.com/theaievangelist" target="_blank"><img src="https://img.shields.io/twitter/follow/:theaievangelist" alt="X"></a>
<a href="http://aitidbits.ai/" target="_blank"><img src="https://github.com/saharmor/saharmor.github.io/blob/main/images/ai%20tidbits%20logo.png?raw=true" alt="Stay updated on AI" width="20" height="20" style="vertical-align: middle;"> Stay updated on AI</a>
</p>

![Demo](demo.gif)

</div>

## 🚀 Live App

**[Launch the Generator →](http://saharmor.me/tool-use-scheme-generator/)**

Also available at: https://saharmor.github.io/tool-use-scheme-generator/

## ✨ Features

- **Function Management**: Add, duplicate, and delete functions with ease
- **Parameter Editor**: Define parameters with types (string, number, integer, boolean, array, object)
- **Advanced Options**:
  - Enumerations for allowed values
  - Default values
  - Numeric constraints (min/max)
  - String constraints (pattern, minLength, maxLength)
  - Array constraints (items type, minItems, maxItems)
  - Nested object properties (single level)
- **Live JSON Preview**: Real-time visualization of your schema
- **Validation**: Inline validation with helpful error messages
- **Actions**:
  - Copy JSON to clipboard
  - Download as `tools.json`
  - Import existing JSON schemas
  - Share via URL (base64-encoded state)
  - Reset all
- **Persistence**: Auto-save to localStorage
- **Accessibility**: Keyboard navigable with ARIA labels
- **Privacy-First**: No tracking, no ads, entirely client-side

## 📖 How to Use

### Creating a Function

1. Click **"+ Add Function"**
2. Enter a function name (use snake_case: `get_weather`, `search_products`)
3. Add a brief description
4. Click **"+ Add Parameter"** to define inputs

### Defining Parameters

For each parameter, specify:
- **Key**: Parameter name (required)
- **Type**: string, number, integer, boolean, array, or object
- **Description**: What this parameter does
- **Required**: Check if mandatory

Click **"Advanced"** for additional constraints like enum values, min/max, patterns, etc.

### Working with the Schema

- **Copy**: Click "Copy" to copy the JSON to your clipboard
- **Download**: Save as `tools.json`
- **Import**: Paste an existing tools JSON array to edit
- **Share**: Generate a shareable URL with your configuration
- **Test**: Validate your schema for errors

### Using with OpenAI

```javascript
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  {
    "type": "function",
    "function": {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"]
          }
        },
        "required": ["location"]
      }
    }
  }
];

const response = await client.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "What's the weather in Boston?" }],
  tools: tools
});
```

## 📁 Sample Schemas

Check the `/samples` directory for example schemas:
- `weather.json` - Simple function with enum
- `array.json` - Array parameters with constraints
- `nested-object.json` - Object with nested properties
- `multi-tools.json` - Multiple functions in one schema

## 🛠️ Development

This is a vanilla JavaScript project with no build step required.

```bash
# Clone the repository
git clone https://github.com/saharmor/tool-use-scheme-generator.git
cd tool-use-scheme-generator

# Serve locally (any static server works)
python -m http.server 8000
# or
npx serve

# Open http://localhost:8000
```

## 📂 Project Structure

```
/
├── index.html           # Main HTML page
├── /src
│   ├── app.js          # State management and event handlers
│   ├── render.js       # DOM rendering helpers
│   ├── schema.js       # JSON schema assembly and validation
│   └── import.js       # Import/parse tools JSON
├── /styles
│   └── main.css        # All styles
├── /samples
│   ├── weather.json
│   ├── array.json
│   ├── nested-object.json
│   └── multi-tools.json
└── /.github/workflows
    └── pages.yml       # GitHub Pages deployment
```

## ⚠️ Limitations

- Nested object properties are supported to **one level only**
- Objects cannot contain array or nested object types (only primitive types)
- Large schemas (100+ parameters) may impact browser performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 💡 Inspiration

Inspired by the general idea of public tool-schema generators. This project is an independent re-implementation with a focus on simplicity, privacy, and modern web standards.

---

**No tracking. No ads. Just tools.**
