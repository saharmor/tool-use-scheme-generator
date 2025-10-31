// Google Analytics utility for vanilla JavaScript
// Inspired by React GA4 implementation

// Configuration - set your GA4 measurement ID here
const GOOGLE_ANALYTICS_ID = 'G-LB83NK9ZKE'; // Replace with your actual GA4 measurement ID
const DIAGNOSTIC_INSIGHTS_ENABLED = false; // Set to true to bypass consent

let gaInitialized = false;

/**
 * Check if analytics consent has been granted
 */
export const hasAnalyticsConsent = () => {
  // Check diagnostic insights flag first - bypasses user consent
  if (DIAGNOSTIC_INSIGHTS_ENABLED) return true;
  
  const v = localStorage.getItem('analytics_consent');
  if (v === 'granted') return true;
  if (v === 'denied') return false;
  // Default to true - analytics enabled by default (opt-out model)
  return true;
};

/**
 * Set analytics consent preference
 */
export const setAnalyticsConsent = (granted) => {
  // Only store consent if diagnostic insights is not enabled
  if (!DIAGNOSTIC_INSIGHTS_ENABLED) {
    localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied');
  }
  
  if (GOOGLE_ANALYTICS_ID && gaInitialized && window.gtag) {
    try {
      // If diagnostic insights enabled, always grant; otherwise use user preference
      const finalConsent = DIAGNOSTIC_INSIGHTS_ENABLED || granted;
      window.gtag('consent', 'update', {
        analytics_storage: finalConsent ? 'granted' : 'denied',
      });
    } catch (e) {
      console.error('Error updating consent:', e);
    }
  }
};

/**
 * Initialize Google Analytics
 */
export const initializeAnalytics = () => {
  if (!GOOGLE_ANALYTICS_ID || GOOGLE_ANALYTICS_ID === 'G-XXXXXXXXXX') {
    console.warn('Google Analytics ID not configured');
    return false;
  }

  const consent = hasAnalyticsConsent();
  if (consent !== true) {
    console.log('Analytics consent not granted');
    return false;
  }

  if (gaInitialized) {
    return true;
  }

  try {
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    // Set initial consent
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ANALYTICS_ID, {
      send_page_view: true
    });
    window.gtag('consent', 'update', { 
      analytics_storage: 'granted' 
    });

    gaInitialized = true;
    return true;
  } catch (e) {
    console.error('Error initializing Google Analytics:', e);
    return false;
  }
};

/**
 * Track page views
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (!GOOGLE_ANALYTICS_ID || !gaInitialized || !window.gtag) return;

  try {
    window.gtag('event', 'page_view', {
      page_path: pagePath || window.location.pathname + window.location.search,
      page_title: pageTitle || document.title
    });
  } catch (e) {
    console.error('Error tracking page view:', e);
  }
};

/**
 * Track custom events
 */
export const trackEvent = (eventName, parameters = {}) => {
  if (!GOOGLE_ANALYTICS_ID || !gaInitialized || !window.gtag) return;

  try {
    window.gtag('event', eventName, parameters);
  } catch (e) {
    console.error('Error tracking event:', e);
  }
};

/**
 * Track user interactions with specific elements
 */
export const trackClick = (elementName, additionalData = {}) => {
  trackEvent('click', {
    element_name: elementName,
    ...additionalData
  });
};

/**
 * Track button clicks
 */
export const trackButton = (buttonName, additionalData = {}) => {
  trackEvent('button_click', {
    button_name: buttonName,
    ...additionalData
  });
};

/**
 * Track feature usage
 */
export const trackFeature = (featureName, action, additionalData = {}) => {
  trackEvent('feature_use', {
    feature_name: featureName,
    action: action,
    ...additionalData
  });
};

/**
 * Track errors
 */
export const trackError = (errorType, errorMessage, additionalData = {}) => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    ...additionalData
  });
};

/**
 * Retrieve GA4 client and session identifiers if available
 */
export const getGAIdentifiers = async () => {
  if (!GOOGLE_ANALYTICS_ID || !gaInitialized || !window.gtag) {
    return {};
  }

  const getValue = (field) =>
    new Promise((resolve) => {
      try {
        window.gtag('get', GOOGLE_ANALYTICS_ID, field, (value) => {
          resolve(value || undefined);
        });
      } catch (e) {
        console.error(`Error getting GA ${field}:`, e);
        resolve(undefined);
      }
    });

  try {
    const [clientId, sessionId] = await Promise.all([
      getValue('client_id'),
      getValue('session_id'),
    ]);

    const result = {};
    if (clientId) result.clientId = clientId;
    if (sessionId) result.sessionId = sessionId;
    return result;
  } catch (e) {
    console.error('Error getting GA identifiers:', e);
    return {};
  }
};

/**
 * Check if analytics is enabled and ready
 */
export const isAnalyticsReady = () => {
  return gaInitialized && window.gtag && GOOGLE_ANALYTICS_ID !== 'G-XXXXXXXXXX';
};

export default {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  trackClick,
  trackButton,
  trackFeature,
  trackError,
  hasAnalyticsConsent,
  setAnalyticsConsent,
  getGAIdentifiers,
  isAnalyticsReady
};

