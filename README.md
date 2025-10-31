<div align="center">

# ✨ Tool Calls Schema Generator

A lightweight, static web app for generating valid tool use JSON schemas for **Claude (Anthropic)** and **OpenAI**. Define functions and parameters with advanced validation options, then copy, download, import, or share your configurations.

<p>
<a href="https://www.linkedin.com/in/sahar-mor/" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-Connect-blue" alt="LinkedIn"></a>
<a href="https://x.com/theaievangelist" target="_blank"><img src="https://img.shields.io/twitter/follow/:theaievangelist" alt="X"></a>
<a href="http://aitidbits.ai/" target="_blank"><img src="https://github.com/saharmor/saharmor.github.io/blob/main/images/ai%20tidbits%20logo.png?raw=true" alt="Stay updated on AI" width="20" height="20" style="vertical-align: middle;"> Stay updated on AI</a>

</p>

<img width="1674" height="1101" alt="Toolsuse" src="https://github.com/user-attachments/assets/c2df9caf-35d0-499a-9500-727a7cd1281a" />


</div>

## Live App

**[Launch the Generator →](https://toolsuse.dev)**


## Features

- **Multi-Format Support**: Generate schemas for both Claude/Anthropic and OpenAI formats
- **Format Selector**: Easily switch between Claude and OpenAI output formats
- **Live JSON Preview**: Real-time visualization of your schema
- **Validation**: Inline validation with helpful error messages
- **Smart Import**: Auto-detects and imports both Claude and OpenAI formats
- **Actions**:
  - Copy JSON to clipboard
  - Download as `tools.json`
  - Import existing JSON schemas (both formats)
  - Share via URL (base64-encoded state)
  - Reset all
- **Persistence**: Auto-save to localStorage

## How to Use

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

- **Format Selection**: Use the dropdown in the preview panel to choose between Claude/Anthropic or OpenAI format
- **Copy**: Click "Copy" to copy the JSON to your clipboard
- **Download**: Save as `tools.json`
- **Import**: Paste an existing tools JSON array (either format) to edit
- **Share**: Generate a shareable URL with your configuration
- **Validation**: Automatic validation with helpful error messages

### Using with Claude (Anthropic)

```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

tools = [
  {
    "name": "get_weather",
    "description": "Get the current weather in a given location",
    "input_schema": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and country, e.g. Berlin, Germany"
        },
        "unit": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"],
          "description": "Temperature unit"
        }
      },
      "required": ["location"]
    }
  }
]

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather in Berlin?"}]
)
```

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

## Sample Schemas

Check the `/samples` directory for example schemas (Claude/Anthropic format):
- `weather.json` - Simple function with enum
- `array.json` - Array parameters with constraints
- `nested-object.json` - Object with nested properties
- `multi-tools.json` - Multiple functions in one schema

All samples use the Claude/Anthropic format. The tool auto-detects format when importing and can export to either format.

## Analytics Setup

This project includes Google Analytics 4 (GA4) integration. To enable analytics tracking:

1. Get your GA4 Measurement ID from Google Analytics
2. Update the ID in `index.html` and `src/analytics.js`
3. See [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md) for detailed configuration instructions

The implementation tracks user interactions (button clicks, exports, imports, errors) while respecting user privacy with opt-out capabilities.

---
