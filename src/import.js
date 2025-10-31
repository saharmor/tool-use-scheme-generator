// Import and parse tools JSON to editor state

/**
 * Parse property schema to parameter object
 */
function parsePropertySchema(key, schema, required = false) {
  const param = {
    key,
    type: schema.type || 'string',
    required,
    description: schema.description || ''
  };
  
  // Parse advanced options
  if (schema.enum) {
    param.enum = schema.enum;
  }
  
  if (schema.default !== undefined) {
    param.default = schema.default;
  }
  
  // Numeric constraints
  if (schema.minimum !== undefined) {
    param.minimum = schema.minimum;
  }
  if (schema.maximum !== undefined) {
    param.maximum = schema.maximum;
  }
  
  // String constraints
  if (schema.pattern) {
    param.pattern = schema.pattern;
  }
  if (schema.minLength !== undefined) {
    param.minLength = schema.minLength;
  }
  if (schema.maxLength !== undefined) {
    param.maxLength = schema.maxLength;
  }
  
  // Array constraints
  if (schema.type === 'array') {
    if (schema.items) {
      param.items = { type: schema.items.type || 'string' };
    }
    if (schema.minItems !== undefined) {
      param.minItems = schema.minItems;
    }
    if (schema.maxItems !== undefined) {
      param.maxItems = schema.maxItems;
    }
  }
  
  // Object constraints (single nesting level)
  if (schema.type === 'object' && schema.properties) {
    param.properties = {};
    const requiredProps = schema.required || [];
    
    for (const [propKey, propSchema] of Object.entries(schema.properties)) {
      param.properties[propKey] = parsePropertySchema(
        propKey,
        propSchema,
        requiredProps.includes(propKey)
      );
    }
  }
  
  return param;
}

/**
 * Detect format of tools JSON (OpenAI or Claude/Anthropic)
 */
function detectFormat(tools) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return 'unknown';
  }
  
  const firstTool = tools[0];
  
  // Check for OpenAI format: {type: "function", function: {...}}
  if (firstTool.type === 'function' && firstTool.function) {
    return 'openai';
  }
  
  // Check for Claude format: {name: "...", description: "...", input_schema: {...}}
  if (firstTool.name && firstTool.input_schema) {
    return 'claude';
  }
  
  return 'unknown';
}

/**
 * Parse OpenAI format tools JSON to internal state
 */
function parseOpenAIFormat(tools) {
  return tools.map((tool, idx) => {
    if (tool.type !== 'function') {
      throw new Error(`Tool ${idx}: type must be "function"`);
    }
    
    if (!tool.function) {
      throw new Error(`Tool ${idx}: missing "function" property`);
    }
    
    const func = {
      name: tool.function.name || '',
      description: tool.function.description || '',
      params: []
    };
    
    // Parse parameters
    if (tool.function.parameters) {
      const params = tool.function.parameters;
      const required = params.required || [];
      
      if (params.properties) {
        for (const [key, schema] of Object.entries(params.properties)) {
          func.params.push(parsePropertySchema(key, schema, required.includes(key)));
        }
      }
    }
    
    return func;
  });
}

/**
 * Parse Claude/Anthropic format tools JSON to internal state
 */
function parseClaudeFormat(tools) {
  return tools.map((tool, idx) => {
    if (!tool.name) {
      throw new Error(`Tool ${idx}: missing "name" property`);
    }
    
    const func = {
      name: tool.name || '',
      description: tool.description || '',
      params: []
    };
    
    // Parse input_schema
    if (tool.input_schema) {
      const schema = tool.input_schema;
      const required = schema.required || [];
      
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          func.params.push(parsePropertySchema(key, propSchema, required.includes(key)));
        }
      }
    }
    
    return func;
  });
}

/**
 * Parse tools JSON (auto-detects OpenAI or Claude format)
 */
export function parseToolsJSON(toolsJSON) {
  let tools;
  
  // Parse JSON if it's a string
  if (typeof toolsJSON === 'string') {
    tools = JSON.parse(toolsJSON);
  } else {
    tools = toolsJSON;
  }
  
  // Ensure it's an array
  if (!Array.isArray(tools)) {
    throw new Error('Tools must be an array');
  }
  
  // Detect format
  const format = detectFormat(tools);
  
  // Parse based on format
  if (format === 'openai') {
    return parseOpenAIFormat(tools);
  } else if (format === 'claude') {
    return parseClaudeFormat(tools);
  } else {
    throw new Error('Unknown tool format. Expected OpenAI or Claude/Anthropic format.');
  }
}

/**
 * Validate imported JSON structure
 */
export function validateImportJSON(json) {
  try {
    parseToolsJSON(json);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

