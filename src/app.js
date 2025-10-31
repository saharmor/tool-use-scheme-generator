// Main application logic

import { generateToolsJSON, validateSchema, formatJSON } from './schema.js';
import { parseToolsJSON } from './import.js';
import { renderFunctions, renderAdvancedModal } from './render.js';
import { 
  initializeAnalytics, 
  trackButton, 
  trackFeature, 
  trackError 
} from './analytics.js';

// Application state
let state = {
  functions: [],
  visited: { functions: [] },
  format: 'claude' // 'claude' or 'openai'
};

// Current advanced edit context
let advancedEditContext = null;

// Debounced auto-test timer
let autoTestTimeoutId = null;

// Debounced render timer
let renderTimeoutId = null;

// Flag to track if render is needed
let renderPending = false;

// Track last input time to detect active typing
let lastInputTime = 0;

function scheduleAutoTest() {
  if (autoTestTimeoutId) {
    clearTimeout(autoTestTimeoutId);
  }
  autoTestTimeoutId = setTimeout(() => {
    try {
      testJSON(true); // silent success
    } catch (_) {
      // no-op
    }
  }, 1000);
}

/**
 * Check if user is currently typing in a text input
 */
function isTypingInTextInput() {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  
  // Check if focused element is a text input field
  const isTextInput = (
    activeElement.tagName === 'INPUT' && activeElement.type === 'text'
  ) || activeElement.tagName === 'TEXTAREA';
  
  return isTextInput && (
    activeElement.classList.contains('function-name') ||
    activeElement.classList.contains('function-description') ||
    activeElement.classList.contains('param-key') ||
    activeElement.classList.contains('param-description')
  );
}

/**
 * Schedule a debounced render
 */
function scheduleRender() {
  renderPending = true;
  lastInputTime = Date.now(); // Track when input happened
  
  if (renderTimeoutId) {
    clearTimeout(renderTimeoutId);
  }
  
  renderTimeoutId = setTimeout(() => {
    // Check if enough time has passed since last input
    const timeSinceLastInput = Date.now() - lastInputTime;
    const debounceDelay = 250; // Centralized debounce delay
    
    if (timeSinceLastInput >= debounceDelay - 10) { // Small buffer for timing
      render();
      renderPending = false;
    } else {
      // Reschedule if user typed again during the wait
      scheduleRender();
    }
  }, 350);
}

/**
 * Force render (for structural changes)
 */
function forceRender() {
  if (renderTimeoutId) {
    clearTimeout(renderTimeoutId);
  }
  renderPending = false;
  render();
}

// Expose to window for blur event handlers
window.forceRender = forceRender;
Object.defineProperty(window, 'renderPending', {
  get: () => renderPending
});

/**
 * Initialize the app
 */
function init() {
  // Initialize Google Analytics
  initializeAnalytics();
  
  let shouldAutoFocus = false;
  
  // Try to load from URL hash first
  if (window.location.hash) {
    try {
      const encoded = window.location.hash.slice(1);
      const decoded = atob(encoded);
      const loaded = JSON.parse(decoded);
      state.functions = loaded.functions || [];
      showToast('Configuration loaded from URL');
      trackFeature('share', 'load_from_url');
    } catch (e) {
      console.error('Failed to load from URL:', e);
      // Fallback to localStorage if URL parsing fails
      loadState();
    }
  } else {
    // Load from localStorage
    loadState();
  }
  
  // If no functions exist, add an empty one for better UX
  if (state.functions.length === 0) {

    state.functions.push({
      name: '',
      description: '',
      params: []
    });
    // Save the initial state
    try {
      localStorage.setItem('tool-schema-state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save initial state:', e);
    }
    shouldAutoFocus = true;
  }
  
  
  // Setup event listeners
  setupEventListeners();
  
  // Set initial format in selector
  const formatSelector = document.getElementById('schema-format-selector');
  if (formatSelector) {
    formatSelector.value = state.format || 'claude';
  }
  
  // Initial render
  render();
  
  // Auto-focus the first function name field if starting fresh
  if (shouldAutoFocus) {
    requestAnimationFrame(() => {
      const firstFunctionNameInput = document.querySelector('.function-name');
      if (firstFunctionNameInput) {
        firstFunctionNameInput.focus();
      }
    });
  }
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
  // Always run validation shortly after changes
  scheduleAutoTest();
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
      if (!state.visited) {
        state.visited = { functions: [] };
      }
      if (!state.format) {
        state.format = 'claude'; // Default to Claude format
      }
      // Ensure visited structure aligns with functions
      state.functions.forEach((func, idx) => {
        if (!state.visited.functions[idx]) {
          state.visited.functions[idx] = { name: false, description: false, params: [] };
        }
        const paramsCount = (func.params || []).length;
        if (!Array.isArray(state.visited.functions[idx].params)) {
          state.visited.functions[idx].params = [];
        }
        // Expand or trim param visited to match count
        state.visited.functions[idx].params = Array.from({ length: paramsCount }, (_, pIdx) => {
          const existing = state.visited.functions[idx].params[pIdx];
          return existing ? existing : { key: false };
        });
      });
    }
  } catch (e) {
    console.error('Failed to load state:', e);
    state = { functions: [], visited: { functions: [] } };
  }
}

/**
 * Show confirmation modal
 */
function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const titleElement = document.getElementById('confirm-title');
  const messageElement = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  
  titleElement.textContent = title;
  messageElement.textContent = message;
  
  // Remove old event listeners by cloning buttons
  const newOkBtn = okBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Add new event listeners
  newOkBtn.addEventListener('click', () => {
    modal.hidden = true;
    onConfirm();
  });
  
  newCancelBtn.addEventListener('click', () => {
    modal.hidden = true;
  });
  
  // Close on modal background click
  const handleBackgroundClick = (e) => {
    if (e.target === modal) {
      modal.hidden = true;
      modal.removeEventListener('click', handleBackgroundClick);
    }
  };
  modal.addEventListener('click', handleBackgroundClick);
  
  modal.hidden = false;
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
  // (Removed Test button; validation now runs automatically.)
  
  // Share
  document.getElementById('share-btn').addEventListener('click', showShareModal);
  document.getElementById('copy-share-url-btn').addEventListener('click', copyShareURL);
  
  // Format selector
  document.getElementById('schema-format-selector').addEventListener('change', onFormatChange);
  
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
  trackButton('add_function');
  state.functions.push({
    name: '',
    description: '',
    params: []
  });
  // Initialize visited for the new function
  if (!state.visited) state.visited = { functions: [] };
  state.visited.functions.push({ name: false, description: false, params: [] });
  saveState();
  forceRender(); // Structural change - render immediately
}

/**
 * Delete function
 */
function deleteFunction(funcId) {
  showConfirmModal(
    'Delete Function',
    'Are you sure you want to delete this function? This action cannot be undone.',
    () => {
      trackButton('delete_function');
      state.functions.splice(funcId, 1);
      if (state.visited && state.visited.functions) {
        state.visited.functions.splice(funcId, 1);
      }
      saveState();
      forceRender(); // Structural change - render immediately
    }
  );
}

/**
 * Duplicate function
 */
function duplicateFunction(funcId) {
  trackButton('duplicate_function');
  const func = state.functions[funcId];
  const duplicate = JSON.parse(JSON.stringify(func));
  duplicate.name = func.name ? `${func.name}_copy` : '';
  state.functions.splice(funcId + 1, 0, duplicate);
  // Initialize visited for duplicate (require user to visit fields)
  if (!state.visited) state.visited = { functions: [] };
  state.visited.functions.splice(funcId + 1, 0, { name: false, description: false, params: (duplicate.params || []).map(() => ({ key: false })) });
  saveState();
  forceRender(); // Structural change - render immediately
}

/**
 * Update function property
 */
function updateFunction(funcId, field, value) {
  state.functions[funcId][field] = value;
  saveState();
  // Debounce render for text input changes to avoid focus flickering
  scheduleRender();
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
  // Initialize visited for new parameter key
  if (!state.visited) state.visited = { functions: [] };
  if (!state.visited.functions[funcId]) {
    state.visited.functions[funcId] = { name: false, description: false, params: [] };
  }
  state.visited.functions[funcId].params.push({ key: false });
  saveState();
  forceRender(); // Structural change - render immediately
}

/**
 * Update parameter
 */
function updateParameter(funcId, paramId, field, value) {
  state.functions[funcId].params[paramId][field] = value;
  saveState();
  // Debounce render for text input changes to avoid focus flickering
  scheduleRender();
}

/**
 * Delete parameter
 */
function deleteParameter(funcId, paramId) {
  state.functions[funcId].params.splice(paramId, 1);
  if (state.visited && state.visited.functions && state.visited.functions[funcId] && state.visited.functions[funcId].params) {
    state.visited.functions[funcId].params.splice(paramId, 1);
  }
  saveState();
  forceRender(); // Structural change - render immediately
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
    scheduleRender();
    // Re-render the advanced modal with updated values
    renderAdvancedModal(state.functions[funcId].params[paramId], (f, v) => {
      state.functions[funcId].params[paramId][f] = v;
      saveState();
      scheduleRender();
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
    trackFeature('import', 'confirm');
    const functions = parseToolsJSON(json);
    state.functions = functions;
    // Mark imported configs as visited so validation runs immediately
    state.visited = {
      functions: (functions || []).map(f => ({
        name: true,
        description: true,
        params: (f.params || []).map(() => ({ key: true }))
      }))
    };
    saveState();
    forceRender(); // Structural change - render immediately
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
  showConfirmModal(
    'Reset All Functions',
    'Are you sure you want to reset all functions? This will delete all your current work and cannot be undone.',
    () => {
      trackButton('reset_all');
      state.functions = [{
        name: '',
        description: '',
        params: []
      }];
      state.visited = { functions: [{ name: false, description: false, params: [] }] };
      saveState();
      forceRender(); // Structural change - render immediately
      showToast('Reset complete');
    }
  );
}

/**
 * Copy JSON to clipboard
 */
async function copyJSON() {
  trackButton('copy_json');
  // Validate schema
  const validation = validateSchema(state.functions);
  
  if (!validation.valid) {
    try {
      markInvalidFields(validation.errors);
    } catch (e) {
      console.error('Error marking invalid fields:', e);
    }
    trackError('validation', 'copy_failed_validation');
    showToast('⚠ Cannot export: Please fix validation errors first', 'error');
    return;
  }
  
  try {
    const json = generateToolsJSON(state.functions, state.format);
    const text = formatJSON(json);
    await navigator.clipboard.writeText(text);
    trackFeature('export', 'copy_success', { functions_count: state.functions.length, format: state.format });
    showToast('Copied to clipboard!');
    triggerConfetti();
  } catch (e) {
    console.error('Copy error:', e);
    trackError('export', 'copy_failed', { error: e.message });
    showToast('Failed to copy', 'error');
  }
}

/**
 * Download JSON file
 */
function downloadJSON() {
  trackButton('download_json');
  // Validate schema
  const validation = validateSchema(state.functions);
  if (!validation.valid) {
    try {
      markInvalidFields(validation.errors);
    } catch (e) {
      console.error('Error marking invalid fields:', e);
    }
    trackError('validation', 'download_failed_validation');
    showToast('⚠ Cannot export: Please fix validation errors first', 'error');
    return;
  }
  
  try {
    const json = generateToolsJSON(state.functions, state.format);
    const text = formatJSON(json);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tools.json';
    a.click();
    URL.revokeObjectURL(url);
    trackFeature('export', 'download_success', { functions_count: state.functions.length, format: state.format });
    showToast('Downloaded!');
    triggerConfetti();
  } catch (e) {
    trackError('export', 'download_failed', { error: e.message });
    showToast('Failed to download', 'error');
  }
}

/**
 * Test JSON validity
 */
function testJSON(silentSuccess = true) {
  // Do not validate until all required fields were visited
  if (!hasVisitedAllRequiredFields()) {
    return;
  }
  const validation = validateSchema(state.functions);
  
  if (validation.valid) {
    try {
      const json = generateToolsJSON(state.functions, state.format);
      JSON.stringify(json);
      if (!silentSuccess) {
        showToast('✓ Valid JSON schema!', 'success');
      }
    } catch (e) {
      showToast(`⚠ Invalid: ${e.message}`, 'error');
    }
  } else {
    showToast(`⚠ Validation errors found`, 'error');
  }
}

/**
 * Show share modal
 */
function showShareModal() {
  trackButton('share');
  // Validate schema
  const validation = validateSchema(state.functions);
  if (!validation.valid) {
    try {
      markInvalidFields(validation.errors);
    } catch (e) {
      console.error('Error marking invalid fields:', e);
    }
    trackError('validation', 'share_failed_validation');
    showToast('⚠ Cannot share: Please fix validation errors first', 'error');
    return;
  }
  
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
  trackFeature('share', 'copy_url');
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
  
  // Show error toasts for longer duration (6 seconds)
  const duration = type === 'error' ? 6000 : 3000;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, duration);
}

/**
 * Trigger confetti celebration effect
 */
function triggerConfetti() {
  if (typeof confetti === 'undefined') return;
  
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Preserve focus state before re-rendering
 */
function preserveFocus() {
  const activeElement = document.activeElement;
  if (!activeElement) return null;
  
  // Check if it's a function description textarea
  if (activeElement.classList.contains('function-description')) {
    const funcCard = activeElement.closest('[data-function-id]');
    if (funcCard) {
      const funcId = parseInt(funcCard.getAttribute('data-function-id'));
      return {
        type: 'function-description',
        funcId: funcId,
        selectionStart: activeElement.selectionStart,
        selectionEnd: activeElement.selectionEnd
      };
    }
  }
  
  // Check if it's a function name input
  if (activeElement.classList.contains('function-name')) {
    const funcCard = activeElement.closest('[data-function-id]');
    if (funcCard) {
      const funcId = parseInt(funcCard.getAttribute('data-function-id'));
      return {
        type: 'function-name',
        funcId: funcId,
        selectionStart: activeElement.selectionStart,
        selectionEnd: activeElement.selectionEnd
      };
    }
  }
  
  // Check if it's a parameter field
  if (activeElement.classList.contains('param-key') || 
      activeElement.classList.contains('param-description')) {
    const paramRow = activeElement.closest('[data-param-index]');
    const funcCard = activeElement.closest('[data-function-id]');
    if (paramRow && funcCard) {
      const paramIndex = parseInt(paramRow.getAttribute('data-param-index'));
      const funcId = parseInt(funcCard.getAttribute('data-function-id'));
      return {
        type: activeElement.classList.contains('param-key') ? 'param-key' : 'param-description',
        funcId: funcId,
        paramIndex: paramIndex,
        selectionStart: activeElement.selectionStart,
        selectionEnd: activeElement.selectionEnd
      };
    }
  }
  
  return null;
}

/**
 * Restore focus state after re-rendering
 */
function restoreFocus(focusState) {
  if (!focusState) return;
  
  // Use double requestAnimationFrame to ensure DOM is fully updated
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const funcCard = document.querySelector(`[data-function-id="${focusState.funcId}"]`);
      if (!funcCard) return;
      
      let element = null;
      
      if (focusState.type === 'function-description') {
        element = funcCard.querySelector('.function-description');
      } else if (focusState.type === 'function-name') {
        element = funcCard.querySelector('.function-name');
      } else if (focusState.type === 'param-key' || focusState.type === 'param-description') {
        const paramRows = funcCard.querySelectorAll('[data-param-index]');
        if (paramRows[focusState.paramIndex]) {
          element = paramRows[focusState.paramIndex].querySelector(`.${focusState.type}`);
        }
      }
      
      if (element && typeof element.focus === 'function') {
        element.focus();
        if (element.setSelectionRange && typeof focusState.selectionStart === 'number') {
          element.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
        }
      }
    });
  });
}

/**
 * Render everything
 */
function render() {
  // Preserve focus before re-rendering
  const focusState = preserveFocus();
  
  // Render functions
  renderFunctions(state.functions, {
    onFunctionUpdate: updateFunction,
    onFunctionDelete: deleteFunction,
    onFunctionDuplicate: duplicateFunction,
    onParamAdd: addParameter,
    onParamUpdate: updateParameter,
    onParamDelete: deleteParameter,
    onParamAdvanced: showAdvancedOptions,
    onVisited: markVisited,
    onParamVisited: markParamVisited
  });
  
  // Render schema preview
  renderSchemaPreview();
  
  // Render validation status
  renderValidationStatus();

  // Restore focus after re-rendering
  restoreFocus(focusState);

  // Refresh icons from icon library (with small delay to ensure DOM updates)
  requestAnimationFrame(() => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  });
}

/**
 * Handle format change
 */
function onFormatChange(e) {
  const newFormat = e.target.value;
  state.format = newFormat;
  saveState();
  trackFeature('format', 'change', { format: newFormat });
  forceRender();
}

/**
 * Render schema preview
 */
function renderSchemaPreview() {
  const preview = document.getElementById('schema-preview');
  
  try {
    const json = generateToolsJSON(state.functions, state.format);
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
  // Hide validation until all required fields were visited
  if (!hasVisitedAllRequiredFields()) {
    statusDiv.innerHTML = '';
    statusDiv.style.display = 'none';
    return;
  }
  const validation = validateSchema(state.functions);
  
  // Only show validation status when there are errors
  if (state.functions.length === 0 || validation.valid) {
    statusDiv.innerHTML = '';
    statusDiv.style.display = 'none';
    return;
  }
  
  // Show errors
  statusDiv.style.display = 'block';
  const errorList = validation.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('');
  statusDiv.innerHTML = `<div class="status-error"><strong>Validation Errors</strong><ul>${errorList}</ul></div>`;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Mark invalid fields based on validation errors
 */
function markInvalidFields(errors) {
  try {
    // First, clear all previous invalid markings
    document.querySelectorAll('.invalid').forEach(el => {
      el.classList.remove('invalid');
    });
    
    // Parse errors and mark corresponding fields
    errors.forEach(error => {
    // Match "Function X: name is required" or "Function 1: name is required"
    const funcIndexMatch = error.match(/Function (\d+):/);
    if (funcIndexMatch) {
      const funcIndex = parseInt(funcIndexMatch[1]) - 1;
      const funcCard = document.querySelector(`[data-function-id="${funcIndex}"]`);
      if (funcCard) {
        if (error.includes('name is required') || error.includes('invalid name')) {
          const nameInput = funcCard.querySelector('.function-name');
          if (nameInput) {
            nameInput.classList.add('invalid');
            // Scroll to first invalid field
            if (!document.querySelector('.invalid-scrolled')) {
              nameInput.classList.add('invalid-scrolled');
              nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
        if (error.includes('parameter missing key')) {
          // Mark all empty parameter keys in this function
          const paramKeys = funcCard.querySelectorAll('.param-key');
          paramKeys.forEach(input => {
            if (!input.value.trim()) {
              input.classList.add('invalid');
            }
          });
        }
        if (error.includes('duplicate parameter keys')) {
          // Mark duplicate parameter keys
          const paramKeys = funcCard.querySelectorAll('.param-key');
          const keyValues = [];
          paramKeys.forEach(input => {
            const value = input.value.trim();
            if (value && keyValues.includes(value)) {
              input.classList.add('invalid');
            }
            if (value) keyValues.push(value);
          });
        }
      }
    }
    
    // Match "Function "function_name": ..." errors
    const funcNameMatch = error.match(/Function "([^"]+)":/);
    if (funcNameMatch) {
      const funcName = funcNameMatch[1];
      // Find the function by name
      const allFuncCards = document.querySelectorAll('[data-function-id]');
      allFuncCards.forEach(funcCard => {
        const nameInput = funcCard.querySelector('.function-name');
        if (nameInput && nameInput.value === funcName) {
          if (error.includes('invalid name')) {
            nameInput.classList.add('invalid');
          }
          if (error.includes('parameter missing key')) {
            const paramKeys = funcCard.querySelectorAll('.param-key');
            paramKeys.forEach(input => {
              if (!input.value.trim()) {
                input.classList.add('invalid');
              }
            });
          }
          if (error.includes('duplicate parameter keys')) {
            const paramKeys = funcCard.querySelectorAll('.param-key');
            const keyValues = [];
            paramKeys.forEach(input => {
              const value = input.value.trim();
              if (value && keyValues.includes(value)) {
                input.classList.add('invalid');
              }
              if (value) keyValues.push(value);
            });
          }
        }
      });
    }
    
    // Match duplicate function names
    if (error.includes('Duplicate function names')) {
      const nameMatch = error.match(/Duplicate function names: (.+)/);
      if (nameMatch) {
        const duplicateNames = nameMatch[1].split(',').map(n => n.trim());
        document.querySelectorAll('.function-name').forEach(input => {
          if (duplicateNames.includes(input.value.trim())) {
            input.classList.add('invalid');
          }
        });
      }
    }
  });
  
  // Remove the scroll marker after a short delay
  setTimeout(() => {
    document.querySelectorAll('.invalid-scrolled').forEach(el => {
      el.classList.remove('invalid-scrolled');
    });
  }, 100);
  
  // Clear invalid markings when user starts typing
  setTimeout(() => {
    document.querySelectorAll('.invalid').forEach(el => {
      const clearInvalid = () => {
        el.classList.remove('invalid');
        el.removeEventListener('input', clearInvalid);
        el.removeEventListener('change', clearInvalid);
      };
      el.addEventListener('input', clearInvalid);
      el.addEventListener('change', clearInvalid);
    });
  }, 100);
  } catch (e) {
    console.error('Error in markInvalidFields:', e);
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Visited tracking utilities
function markVisited(funcId, field) {
  if (!state.visited) state.visited = { functions: [] };
  if (!state.visited.functions[funcId]) {
    state.visited.functions[funcId] = { name: false, description: false, params: [] };
  }
  if (field === 'name' || field === 'description') {
    if (!state.visited.functions[funcId][field]) {
      state.visited.functions[funcId][field] = true;
      saveState();
      renderValidationStatus();
    }
  }
}

function markParamVisited(funcId, paramId, field) {
  if (field !== 'key') return;
  if (!state.visited) state.visited = { functions: [] };
  if (!state.visited.functions[funcId]) {
    state.visited.functions[funcId] = { name: false, description: false, params: [] };
  }
  if (!state.visited.functions[funcId].params) {
    state.visited.functions[funcId].params = [];
  }
  if (!state.visited.functions[funcId].params[paramId]) {
    state.visited.functions[funcId].params[paramId] = { key: false };
  }
  if (!state.visited.functions[funcId].params[paramId].key) {
    state.visited.functions[funcId].params[paramId].key = true;
    saveState();
    renderValidationStatus();
  }
}

function hasVisitedAllRequiredFields() {
  if (!state || !state.functions || state.functions.length === 0) return false;
  const visited = state.visited && Array.isArray(state.visited.functions) ? state.visited.functions : [];
  for (let i = 0; i < state.functions.length; i++) {
    const funcVisited = visited[i] || { name: false, description: false, params: [] };
    if (!funcVisited.name || !funcVisited.description) return false;
    const params = state.functions[i].params || [];
    if (params.length > 0) {
      const paramVisited = Array.isArray(funcVisited.params) ? funcVisited.params : [];
      if (paramVisited.length < params.length) return false;
      for (let p = 0; p < params.length; p++) {
        const pv = paramVisited[p] || { key: false };
        if (!pv.key) return false;
      }
    }
  }
  return true;
}

