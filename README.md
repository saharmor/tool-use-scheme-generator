<div align="center">

# ✨ Tool Calls Schema Generator

A lightweight, static web app for generating valid OpenAI "tools" JSON schemas. Define functions and parameters with advanced validation options, then copy, download, import, or share your configurations.

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

- **Live JSON Preview**: Real-time visualization of your schema
- **Validation**: Inline validation with helpful error messages
- **Actions**:
  - Copy JSON to clipboard
  - Download as `tools.json`
  - Import existing JSON schemas
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

## Sample Schemas

Check the `/samples` directory for example schemas:
- `weather.json` - Simple function with enum
- `array.json` - Array parameters with constraints
- `nested-object.json` - Object with nested properties
- `multi-tools.json` - Multiple functions in one schema

---
