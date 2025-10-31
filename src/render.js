// DOM rendering helpers

/**
 * Create element helper
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else if (key.startsWith('aria-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child) {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Render a single parameter row
 */
export function renderParameter(param, funcId, paramIndex, onUpdate, onDelete, onAdvanced, onVisited) {
  const row = createElement('div', { className: 'param-row', 'data-param-index': paramIndex });
  
  const keyInput = createElement('input', {
    type: 'text',
    className: 'param-key',
    value: param.key || '',
    placeholder: 'key',
    'aria-label': 'Parameter key'
  });
  keyInput.addEventListener('input', (e) => onUpdate(paramIndex, 'key', e.target.value));
  keyInput.addEventListener('blur', () => {
    // Trigger pending render when field loses focus
    if (window.renderPending && typeof window.forceRender === 'function') {
      window.forceRender();
    }
  });
  if (typeof onVisited === 'function') {
    keyInput.addEventListener('focus', () => onVisited(paramIndex, 'key'));
  }
  
  const typeSelect = createElement('select', {
    className: 'param-type',
    'aria-label': 'Parameter type'
  });
  
  const types = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
  types.forEach(type => {
    const option = createElement('option', { value: type }, [type]);
    if (param.type === type) {
      option.selected = true;
    }
    typeSelect.appendChild(option);
  });
  typeSelect.addEventListener('change', (e) => onUpdate(paramIndex, 'type', e.target.value));
  
  const descInput = createElement('input', {
    type: 'text',
    className: 'param-description',
    value: param.description || '',
    placeholder: 'description',
    'aria-label': 'Parameter description'
  });
  descInput.addEventListener('input', (e) => onUpdate(paramIndex, 'description', e.target.value));
  descInput.addEventListener('blur', () => {
    // Trigger pending render when field loses focus
    if (window.renderPending && typeof window.forceRender === 'function') {
      window.forceRender();
    }
  });
  
  const requiredCheckbox = createElement('input', {
    type: 'checkbox',
    className: 'param-required',
    checked: param.required,
    'aria-label': 'Required parameter'
  });
  requiredCheckbox.addEventListener('change', (e) => onUpdate(paramIndex, 'required', e.target.checked));
  
  const requiredLabel = createElement('label', { className: 'checkbox-label' }, [
    requiredCheckbox,
    'Required'
  ]);
  
  const advancedBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-small btn-icon',
    'aria-label': 'Advanced options',
    title: 'Advanced options'
  }, [createElement('i', { 'data-lucide': 'settings' })]);
  advancedBtn.addEventListener('click', () => onAdvanced(funcId, paramIndex));
  
  const deleteBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-danger btn-small btn-icon',
    'aria-label': 'Delete parameter',
    title: 'Delete parameter'
  }, [createElement('i', { 'data-lucide': 'x' })]);
  deleteBtn.addEventListener('click', () => onDelete(paramIndex));
  
  row.appendChild(keyInput);
  row.appendChild(typeSelect);
  row.appendChild(descInput);
  row.appendChild(requiredLabel);
  row.appendChild(advancedBtn);
  row.appendChild(deleteBtn);
  
  return row;
}

/**
 * Render function card
 */
export function renderFunction(func, funcId, onUpdate, onDelete, onDuplicate, onParamAdd, onParamUpdate, onParamDelete, onParamAdvanced, onVisited, onParamVisited) {
  const card = createElement('div', {
    className: 'function-card',
    'data-function-id': funcId
  });
  
  const header = createElement('div', { className: 'function-header' });
  
  const nameInput = createElement('input', {
    type: 'text',
    className: 'function-name',
    value: func.name || '',
    placeholder: 'function_name',
    'aria-label': 'Function name'
  });
  nameInput.addEventListener('input', (e) => onUpdate(funcId, 'name', e.target.value));
  nameInput.addEventListener('blur', () => {
    // Trigger pending render when field loses focus
    if (window.renderPending && typeof window.forceRender === 'function') {
      window.forceRender();
    }
  });
  if (typeof onVisited === 'function') {
    nameInput.addEventListener('focus', () => onVisited(funcId, 'name'));
  }
  
  const actions = createElement('div', { className: 'function-actions' });
  
  const duplicateBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-small btn-icon',
    'aria-label': 'Duplicate function',
    title: 'Duplicate'
  }, [createElement('i', { 'data-lucide': 'copy' })]);
  duplicateBtn.addEventListener('click', () => onDuplicate(funcId));
  
  const deleteBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-danger btn-small btn-icon',
    'aria-label': 'Delete function',
    title: 'Delete'
  }, [createElement('i', { 'data-lucide': 'trash' })]);
  deleteBtn.addEventListener('click', () => onDelete(funcId));
  
  actions.appendChild(duplicateBtn);
  actions.appendChild(deleteBtn);
  
  header.appendChild(nameInput);
  header.appendChild(actions);
  
  const descInput = createElement('textarea', {
    className: 'function-description',
    value: func.description || '',
    placeholder: 'Brief description of what this function does',
    rows: 2,
    'aria-label': 'Function description'
  });
  descInput.addEventListener('input', (e) => onUpdate(funcId, 'description', e.target.value));
  descInput.addEventListener('blur', () => {
    // Trigger pending render when field loses focus
    if (window.renderPending && typeof window.forceRender === 'function') {
      window.forceRender();
    }
  });
  if (typeof onVisited === 'function') {
    descInput.addEventListener('focus', () => onVisited(funcId, 'description'));
  }
  
  const paramsHeader = createElement('div', { className: 'params-header' });
  const paramsTitle = createElement('h4', {}, ['Parameters']);
  const addParamBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-small btn-primary btn-icon',
    'aria-label': 'Add parameter',
    title: 'Add parameter'
  }, [createElement('i', { 'data-lucide': 'plus' })]);
  addParamBtn.addEventListener('click', () => onParamAdd(funcId));
  
  paramsHeader.appendChild(paramsTitle);
  paramsHeader.appendChild(addParamBtn);
  
  const paramsList = createElement('div', { className: 'params-list' });
  
  if (func.params && func.params.length > 0) {
    func.params.forEach((param, idx) => {
      const paramRow = renderParameter(
        param,
        funcId,
        idx,
        (paramIdx, field, value) => onParamUpdate(funcId, paramIdx, field, value),
        (paramIdx) => onParamDelete(funcId, paramIdx),
        onParamAdvanced,
        (paramIdx, field) => {
          if (typeof onParamVisited === 'function') {
            onParamVisited(funcId, paramIdx, field);
          }
        }
      );
      paramsList.appendChild(paramRow);
    });
  } else {
    const emptyMsg = createElement('p', { className: 'empty-message' }, ['No parameters yet']);
    paramsList.appendChild(emptyMsg);
  }
  
  card.appendChild(header);
  card.appendChild(descInput);
  card.appendChild(paramsHeader);
  card.appendChild(paramsList);
  
  return card;
}

/**
 * Render all functions
 */
export function renderFunctions(functions, handlers) {
  const container = document.getElementById('functions-container');
  container.innerHTML = '';
  
  if (functions.length === 0) {
    const emptyMsg = createElement('div', { className: 'empty-state' }, [
      'No functions defined. Click "Add Function" to get started.'
    ]);
    container.appendChild(emptyMsg);
    return;
  }
  
  functions.forEach((func, idx) => {
    const funcCard = renderFunction(
      func,
      idx,
      handlers.onFunctionUpdate,
      handlers.onFunctionDelete,
      handlers.onFunctionDuplicate,
      handlers.onParamAdd,
      handlers.onParamUpdate,
      handlers.onParamDelete,
      handlers.onParamAdvanced,
      handlers.onVisited,
      handlers.onParamVisited
    );
    container.appendChild(funcCard);
  });
}

/**
 * Render advanced options modal
 */
export function renderAdvancedModal(param, onUpdate) {
  const body = document.getElementById('advanced-modal-body');
  body.innerHTML = '';
  
  // Enum
  if (['string', 'number', 'integer'].includes(param.type)) {
    const enumGroup = createElement('div', { className: 'form-group' });
    const enumLabel = createElement('label', {}, ['Allowed values (comma-separated)']);
    const enumInput = createElement('input', {
      type: 'text',
      value: param.enum ? param.enum.join(', ') : '',
      placeholder: 'value1, value2, value3'
    });
    enumInput.addEventListener('input', (e) => {
      const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
      onUpdate('enum', values.length > 0 ? values : undefined);
    });
    enumGroup.appendChild(enumLabel);
    enumGroup.appendChild(enumInput);
    body.appendChild(enumGroup);
  }
  
  // Default value
  const defaultGroup = createElement('div', { className: 'form-group' });
  const defaultLabel = createElement('label', {}, ['Default value']);
  const defaultInput = createElement('input', {
    type: 'text',
    value: param.default !== undefined ? String(param.default) : '',
    placeholder: 'default value'
  });
  defaultInput.addEventListener('input', (e) => {
    onUpdate('default', e.target.value || undefined);
  });
  defaultGroup.appendChild(defaultLabel);
  defaultGroup.appendChild(defaultInput);
  body.appendChild(defaultGroup);
  
  // Numeric constraints
  if (['number', 'integer'].includes(param.type)) {
    const minGroup = createElement('div', { className: 'form-group' });
    const minLabel = createElement('label', {}, ['Minimum']);
    const minInput = createElement('input', {
      type: 'number',
      value: param.minimum !== undefined ? param.minimum : '',
      placeholder: 'min'
    });
    minInput.addEventListener('input', (e) => {
      onUpdate('minimum', e.target.value ? Number(e.target.value) : undefined);
    });
    minGroup.appendChild(minLabel);
    minGroup.appendChild(minInput);
    body.appendChild(minGroup);
    
    const maxGroup = createElement('div', { className: 'form-group' });
    const maxLabel = createElement('label', {}, ['Maximum']);
    const maxInput = createElement('input', {
      type: 'number',
      value: param.maximum !== undefined ? param.maximum : '',
      placeholder: 'max'
    });
    maxInput.addEventListener('input', (e) => {
      onUpdate('maximum', e.target.value ? Number(e.target.value) : undefined);
    });
    maxGroup.appendChild(maxLabel);
    maxGroup.appendChild(maxInput);
    body.appendChild(maxGroup);
  }
  
  // String constraints
  if (param.type === 'string') {
    const patternGroup = createElement('div', { className: 'form-group' });
    const patternLabel = createElement('label', {}, ['Pattern (regex)']);
    const patternInput = createElement('input', {
      type: 'text',
      value: param.pattern || '',
      placeholder: '^[a-z]+$'
    });
    patternInput.addEventListener('input', (e) => {
      onUpdate('pattern', e.target.value || undefined);
    });
    patternGroup.appendChild(patternLabel);
    patternGroup.appendChild(patternInput);
    body.appendChild(patternGroup);
    
    const minLengthGroup = createElement('div', { className: 'form-group' });
    const minLengthLabel = createElement('label', {}, ['Min length']);
    const minLengthInput = createElement('input', {
      type: 'number',
      value: param.minLength !== undefined ? param.minLength : '',
      placeholder: '0'
    });
    minLengthInput.addEventListener('input', (e) => {
      onUpdate('minLength', e.target.value ? Number(e.target.value) : undefined);
    });
    minLengthGroup.appendChild(minLengthLabel);
    minLengthGroup.appendChild(minLengthInput);
    body.appendChild(minLengthGroup);
    
    const maxLengthGroup = createElement('div', { className: 'form-group' });
    const maxLengthLabel = createElement('label', {}, ['Max length']);
    const maxLengthInput = createElement('input', {
      type: 'number',
      value: param.maxLength !== undefined ? param.maxLength : '',
      placeholder: '100'
    });
    maxLengthInput.addEventListener('input', (e) => {
      onUpdate('maxLength', e.target.value ? Number(e.target.value) : undefined);
    });
    maxLengthGroup.appendChild(maxLengthLabel);
    maxLengthGroup.appendChild(maxLengthInput);
    body.appendChild(maxLengthGroup);
  }
  
  // Array constraints
  if (param.type === 'array') {
    const itemsGroup = createElement('div', { className: 'form-group' });
    const itemsLabel = createElement('label', {}, ['Items type']);
    const itemsSelect = createElement('select');
    const itemTypes = ['string', 'number', 'integer', 'boolean'];
    itemTypes.forEach(type => {
      const option = createElement('option', { value: type }, [type]);
      if (param.items && param.items.type === type) {
        option.selected = true;
      }
      itemsSelect.appendChild(option);
    });
    itemsSelect.addEventListener('change', (e) => {
      onUpdate('items', { type: e.target.value });
    });
    itemsGroup.appendChild(itemsLabel);
    itemsGroup.appendChild(itemsSelect);
    body.appendChild(itemsGroup);
    
    const minItemsGroup = createElement('div', { className: 'form-group' });
    const minItemsLabel = createElement('label', {}, ['Min items']);
    const minItemsInput = createElement('input', {
      type: 'number',
      value: param.minItems !== undefined ? param.minItems : '',
      placeholder: '0'
    });
    minItemsInput.addEventListener('input', (e) => {
      onUpdate('minItems', e.target.value ? Number(e.target.value) : undefined);
    });
    minItemsGroup.appendChild(minItemsLabel);
    minItemsGroup.appendChild(minItemsInput);
    body.appendChild(minItemsGroup);
    
    const maxItemsGroup = createElement('div', { className: 'form-group' });
    const maxItemsLabel = createElement('label', {}, ['Max items']);
    const maxItemsInput = createElement('input', {
      type: 'number',
      value: param.maxItems !== undefined ? param.maxItems : '',
      placeholder: '10'
    });
    maxItemsInput.addEventListener('input', (e) => {
      onUpdate('maxItems', e.target.value ? Number(e.target.value) : undefined);
    });
    maxItemsGroup.appendChild(maxItemsLabel);
    maxItemsGroup.appendChild(maxItemsInput);
    body.appendChild(maxItemsGroup);
  }
  
  // Object properties (single nesting level)
  if (param.type === 'object') {
    const note = createElement('p', { className: 'note' }, [
      'Define nested properties (single level supported):'
    ]);
    body.appendChild(note);
    
    // Simple property editor
    const propsContainer = createElement('div', { className: 'nested-props' });
    
    if (param.properties) {
      Object.entries(param.properties).forEach(([key, prop]) => {
        const propRow = createElement('div', { className: 'nested-prop-row' });
        
        const keyInput = createElement('input', {
          type: 'text',
          value: key,
          placeholder: 'key',
          'data-old-key': key
        });
        
        const typeSelect = createElement('select');
        const nestedTypes = ['string', 'number', 'integer', 'boolean'];
        nestedTypes.forEach(type => {
          const option = createElement('option', { value: type }, [type]);
          if (prop.type === type) {
            option.selected = true;
          }
          typeSelect.appendChild(option);
        });
        
        const requiredCheckbox = createElement('input', {
          type: 'checkbox',
          checked: prop.required
        });
        
        const deleteBtn = createElement('button', {
          type: 'button',
          className: 'btn btn-danger btn-small'
        }, ['×']);
        
        deleteBtn.addEventListener('click', () => {
          const props = { ...param.properties };
          delete props[key];
          onUpdate('properties', Object.keys(props).length > 0 ? props : undefined);
        });
        
        keyInput.addEventListener('input', (e) => {
          const oldKey = e.target.getAttribute('data-old-key');
          const newKey = e.target.value;
          if (oldKey && newKey && oldKey !== newKey) {
            const props = { ...param.properties };
            props[newKey] = props[oldKey];
            delete props[oldKey];
            e.target.setAttribute('data-old-key', newKey);
            onUpdate('properties', props);
          }
        });
        
        typeSelect.addEventListener('change', (e) => {
          const props = { ...param.properties };
          props[key] = { ...props[key], type: e.target.value };
          onUpdate('properties', props);
        });
        
        requiredCheckbox.addEventListener('change', (e) => {
          const props = { ...param.properties };
          props[key] = { ...props[key], required: e.target.checked };
          onUpdate('properties', props);
        });
        
        propRow.appendChild(keyInput);
        propRow.appendChild(typeSelect);
        propRow.appendChild(createElement('label', {}, [requiredCheckbox, 'Req']));
        propRow.appendChild(deleteBtn);
        propsContainer.appendChild(propRow);
      });
    }
    
    const addPropBtn = createElement('button', {
      type: 'button',
      className: 'btn btn-small btn-primary btn-icon',
      title: 'Add property',
      'aria-label': 'Add property'
    }, [createElement('i', { 'data-lucide': 'plus' })]);
    
    addPropBtn.addEventListener('click', () => {
      const props = param.properties || {};
      const newKey = `prop${Object.keys(props).length + 1}`;
      props[newKey] = { type: 'string', required: false };
      onUpdate('properties', props);
    });
    
    body.appendChild(propsContainer);
    body.appendChild(addPropBtn);
  }
}

