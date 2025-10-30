// Main application logic

import { generateToolsJSON, validateSchema, formatJSON } from './schema.js';
import { parseToolsJSON } from './import.js';
import { renderFunctions, renderAdvancedModal } from './render.js';

// Application state
let state = {
  functions: []
};

// Current advanced edit context
let advancedEditContext = null;

/**
 * Initialize the app
 */
function init() {
  // Try to load from URL hash first
  if (window.location.hash) {
    try {
      const encoded = window.location.hash.slice(1);
      const decoded = atob(encoded);
      const loaded = JSON.parse(decoded);
      state.functions = loaded.functions || [];
      showToast('Configuration loaded from URL');
    } catch (e) {
      console.error('Failed to load from URL:', e);
    }
  } else {
    // Load from localStorage
    loadState();
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Initial render
  render();
}

/**
 * Save state to localStorage
 */
function saveState() {
  try {
    localStorage.setItem('tool-schema-state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

/**
 * Load state from localStorage
 */
function loadState() {
  try {
    const saved = localStorage.getItem('tool-schema-state');
    if (saved) {
      state = JSON.parse(saved);
      if (!state.functions) {
        state.functions = [];
      }
    }
  } catch (e) {
    console.error('Failed to load state:', e);
    state = { functions: [] };
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add function
  document.getElementById('add-function-btn').addEventListener('click', addFunction);
  
  // Import
  document.getElementById('import-btn').addEventListener('click', showImportModal);
  document.getElementById('import-confirm-btn').addEventListener('click', confirmImport);
  document.getElementById('import-cancel-btn').addEventListener('click', hideImportModal);
  
  // Reset
  document.getElementById('reset-btn').addEventListener('click', resetAll);
  
  // Copy
  document.getElementById('copy-btn').addEventListener('click', copyJSON);
  
  // Download
  document.getElementById('download-btn').addEventListener('click', downloadJSON);
  
  // Test
  document.getElementById('test-btn').addEventListener('click', testJSON);
  
  // Share
  document.getElementById('share-btn').addEventListener('click', showShareModal);
  document.getElementById('copy-share-url-btn').addEventListener('click', copyShareURL);
  
  // Advanced modal
  document.getElementById('advanced-close-btn').addEventListener('click', hideAdvancedModal);
  
  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.hidden = true;
      }
    });
  });
  
  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.hidden = true;
      }
    });
  });
}

/**
 * Add new function
 */
function addFunction() {
  state.functions.push({
    name: '',
    description: '',
    params: []
  });
  saveState();
  render();
}

/**
 * Delete function
 */
function deleteFunction(funcId) {
  if (confirm('Delete this function?')) {
    state.functions.splice(funcId, 1);
    saveState();
    render();
  }
}

/**
 * Duplicate function
 */
function duplicateFunction(funcId) {
  const func = state.functions[funcId];
  const duplicate = JSON.parse(JSON.stringify(func));
  duplicate.name = func.name ? `${func.name}_copy` : '';
  state.functions.splice(funcId + 1, 0, duplicate);
  saveState();
  render();
}

/**
 * Update function property
 */
function updateFunction(funcId, field, value) {
  state.functions[funcId][field] = value;
  saveState();
  render();
}

/**
 * Add parameter to function
 */
function addParameter(funcId) {
  if (!state.functions[funcId].params) {
    state.functions[funcId].params = [];
  }
  state.functions[funcId].params.push({
    key: '',
    type: 'string',
    description: '',
    required: false
  });
  saveState();
  render();
}

/**
 * Update parameter
 */
function updateParameter(funcId, paramId, field, value) {
  state.functions[funcId].params[paramId][field] = value;
  saveState();
  render();
}

/**
 * Delete parameter
 */
function deleteParameter(funcId, paramId) {
  state.functions[funcId].params.splice(paramId, 1);
  saveState();
  render();
}

/**
 * Show advanced options for parameter
 */
function showAdvancedOptions(funcId, paramId) {
  advancedEditContext = { funcId, paramId };
  const param = state.functions[funcId].params[paramId];
  
  renderAdvancedModal(param, (field, value) => {
    state.functions[funcId].params[paramId][field] = value;
    saveState();
    render();
    // Re-render the advanced modal with updated values
    renderAdvancedModal(state.functions[funcId].params[paramId], (f, v) => {
      state.functions[funcId].params[paramId][f] = v;
      saveState();
      render();
      renderAdvancedModal(state.functions[funcId].params[paramId], arguments.callee);
    });
  });
  
  const modal = document.getElementById('advanced-modal');
  modal.hidden = false;
}

/**
 * Hide advanced modal
 */
function hideAdvancedModal() {
  document.getElementById('advanced-modal').hidden = true;
  advancedEditContext = null;
}

/**
 * Show import modal
 */
function showImportModal() {
  document.getElementById('import-modal').hidden = false;
  document.getElementById('import-textarea').focus();
}

/**
 * Hide import modal
 */
function hideImportModal() {
  document.getElementById('import-modal').hidden = true;
  document.getElementById('import-textarea').value = '';
}

/**
 * Confirm import
 */
function confirmImport() {
  const textarea = document.getElementById('import-textarea');
  const json = textarea.value.trim();
  
  if (!json) {
    showToast('Please paste JSON to import', 'error');
    return;
  }
  
  try {
    const functions = parseToolsJSON(json);
    state.functions = functions;
    saveState();
    render();
    hideImportModal();
    showToast('Successfully imported!');
  } catch (e) {
    showToast(`Import error: ${e.message}`, 'error');
  }
}

/**
 * Reset all
 */
function resetAll() {
  if (confirm('Reset all functions? This cannot be undone.')) {
    state.functions = [];
    saveState();
    render();
    showToast('Reset complete');
  }
}

/**
 * Copy JSON to clipboard
 */
async function copyJSON() {
  try {
    const json = generateToolsJSON(state.functions);
    const text = formatJSON(json);
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (e) {
    showToast('Failed to copy', 'error');
  }
}

/**
 * Download JSON file
 */
function downloadJSON() {
  try {
    const json = generateToolsJSON(state.functions);
    const text = formatJSON(json);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tools.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
  } catch (e) {
    showToast('Failed to download', 'error');
  }
}

/**
 * Test JSON validity
 */
function testJSON() {
  const validation = validateSchema(state.functions);
  
  if (validation.valid) {
    try {
      const json = generateToolsJSON(state.functions);
      JSON.stringify(json);
      showToast('✓ Valid JSON schema!', 'success');
    } catch (e) {
      showToast(`✗ Invalid: ${e.message}`, 'error');
    }
  } else {
    showToast(`✗ Validation errors found`, 'error');
  }
}

/**
 * Show share modal
 */
function showShareModal() {
  try {
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    document.getElementById('share-url').value = url;
    document.getElementById('share-modal').hidden = false;
    document.getElementById('share-url').select();
  } catch (e) {
    showToast('Failed to create share URL', 'error');
  }
}

/**
 * Copy share URL
 */
async function copyShareURL() {
  const input = document.getElementById('share-url');
  try {
    await navigator.clipboard.writeText(input.value);
    showToast('Share URL copied!');
  } catch (e) {
    input.select();
    document.execCommand('copy');
    showToast('Share URL copied!');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} toast-show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

/**
 * Render everything
 */
function render() {
  // Render functions
  renderFunctions(state.functions, {
    onFunctionUpdate: updateFunction,
    onFunctionDelete: deleteFunction,
    onFunctionDuplicate: duplicateFunction,
    onParamAdd: addParameter,
    onParamUpdate: updateParameter,
    onParamDelete: deleteParameter,
    onParamAdvanced: showAdvancedOptions
  });
  
  // Render schema preview
  renderSchemaPreview();
  
  // Render validation status
  renderValidationStatus();
}

/**
 * Render schema preview
 */
function renderSchemaPreview() {
  const preview = document.getElementById('schema-preview');
  
  try {
    const json = generateToolsJSON(state.functions);
    const formatted = formatJSON(json);
    preview.innerHTML = `<code>${escapeHtml(formatted)}</code>`;
  } catch (e) {
    preview.innerHTML = `<code class="error">Error generating JSON: ${escapeHtml(e.message)}</code>`;
  }
}

/**
 * Render validation status
 */
function renderValidationStatus() {
  const statusDiv = document.getElementById('validation-status');
  const validation = validateSchema(state.functions);
  
  if (state.functions.length === 0) {
    statusDiv.innerHTML = '';
    return;
  }
  
  if (validation.valid) {
    statusDiv.innerHTML = '<span class="status-success">✓ Valid schema</span>';
  } else {
    const errorList = validation.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('');
    statusDiv.innerHTML = `<div class="status-error"><strong>Validation errors:</strong><ul>${errorList}</ul></div>`;
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

