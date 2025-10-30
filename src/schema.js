// JSON Schema assembly and validation

/**
 * Validate function name (snake_case pattern)
 */
export function validateFunctionName(name) {
  const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return pattern.test(name);
}

/**
 * Build JSON Schema property from parameter
 */
function buildPropertySchema(param) {
  const schema = { type: param.type };
  
  if (param.description) {
    schema.description = param.description;
  }
  
  // Handle advanced options
  if (param.enum && param.enum.length > 0) {
    schema.enum = param.enum;
  }
  
  if (param.default !== undefined && param.default !== '') {
    schema.default = param.default;
  }
  
  // Numeric constraints
  if (param.minimum !== undefined && param.minimum !== '') {
    schema.minimum = Number(param.minimum);
  }
  if (param.maximum !== undefined && param.maximum !== '') {
    schema.maximum = Number(param.maximum);
  }
  
  // String constraints
  if (param.pattern) {
    schema.pattern = param.pattern;
  }
  if (param.minLength !== undefined && param.minLength !== '') {
    schema.minLength = Number(param.minLength);
  }
  if (param.maxLength !== undefined && param.maxLength !== '') {
    schema.maxLength = Number(param.maxLength);
  }
  
  // Array constraints
  if (param.type === 'array') {
    if (param.items && param.items.type) {
      schema.items = { type: param.items.type };
    }
    if (param.minItems !== undefined && param.minItems !== '') {
      schema.minItems = Number(param.minItems);
    }
    if (param.maxItems !== undefined && param.maxItems !== '') {
      schema.maxItems = Number(param.maxItems);
    }
  }
  
  // Object constraints (single nesting level)
  if (param.type === 'object' && param.properties) {
    schema.properties = {};
    for (const [key, prop] of Object.entries(param.properties)) {
      schema.properties[key] = buildPropertySchema(prop);
    }
    const requiredProps = Object.entries(param.properties)
      .filter(([_, prop]) => prop.required)
      .map(([key]) => key);
    if (requiredProps.length > 0) {
      schema.required = requiredProps;
    }
  }
  
  return schema;
}

/**
 * Generate OpenAI tools JSON from functions array
 */
export function generateToolsJSON(functions) {
  return functions.map(func => {
    const tool = {
      type: 'function',
      function: {
        name: func.name
      }
    };
    
    if (func.description) {
      tool.function.description = func.description;
    }
    
    // Build parameters schema
    if (func.params && func.params.length > 0) {
      const properties = {};
      const required = [];
      
      func.params.forEach(param => {
        properties[param.key] = buildPropertySchema(param);
        if (param.required) {
          required.push(param.key);
        }
      });
      
      tool.function.parameters = {
        type: 'object',
        properties
      };
      
      if (required.length > 0) {
        tool.function.parameters.required = required;
      }
    }
    
    return tool;
  });
}

/**
 * Validate the entire schema
 */
export function validateSchema(functions) {
  const errors = [];
  const warnings = [];
  
  // Check for duplicate function names
  const names = functions.map(f => f.name).filter(n => n);
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate function names: ${[...new Set(duplicateNames)].join(', ')}`);
  }
  
  // Validate each function
  functions.forEach((func, idx) => {
    if (!func.name) {
      errors.push(`Function ${idx + 1}: name is required`);
    } else if (!validateFunctionName(func.name)) {
      errors.push(`Function "${func.name}": invalid name (use snake_case: letters, numbers, underscores only, cannot start with number)`);
    }
    
    // Check for duplicate parameter keys
    if (func.params) {
      const keys = func.params.map(p => p.key).filter(k => k);
      const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
      if (duplicateKeys.length > 0) {
        errors.push(`Function "${func.name}": duplicate parameter keys: ${[...new Set(duplicateKeys)].join(', ')}`);
      }
      
      // Check that required parameters exist in properties
      func.params.forEach(param => {
        if (!param.key) {
          errors.push(`Function "${func.name}": parameter missing key`);
        }
      });
    }
  });
  
  // Try to generate JSON to check for other issues
  try {
    const json = generateToolsJSON(functions);
    JSON.stringify(json); // Ensure it's valid JSON
  } catch (e) {
    errors.push(`JSON generation error: ${e.message}`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Format JSON for display
 */
export function formatJSON(json) {
  return JSON.stringify(json, null, 2);
}

