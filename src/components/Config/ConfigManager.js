import { DEFAULT_SETTINGS } from './DefaultSettings.js';

export class ConfigManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Update a nested setting path
  updateSetting(path, value) {
    // Create a deep copy of settings to avoid mutation
    this.settings = JSON.parse(JSON.stringify(this.settings));
    
    const keys = path.split('.');
    let current = this.settings;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    current[keys[keys.length - 1]] = value;
    
    // Notify listeners
    this.notifyListeners(path, value);
  }

  // Subscribe to setting changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of changes
  notifyListeners(path, value) {
    this.listeners.forEach(callback => callback(path, value, this.settings));
  }

  // Load settings from JSON
  loadFromJSON(jsonString) {
    try {
      const loadedSettings = JSON.parse(jsonString);
      this.settings = this.mergeSettings(DEFAULT_SETTINGS, loadedSettings);
      this.notifyListeners('*', null); // Notify of complete reload
      return true;
    } catch (error) {
      console.error('Failed to load settings from JSON:', error);
      return false;
    }
  }

  // Export settings to JSON
  exportToJSON() {
    return JSON.stringify({
      ...this.settings,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  // Reset to defaults
  resetToDefaults() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.notifyListeners('*', null);
  }

  // Deep merge settings
  mergeSettings(defaults, overrides) {
    const result = { ...defaults };
    
    for (const key in overrides) {
      if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
        result[key] = this.mergeSettings(defaults[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
    
    return result;
  }

  // Get a specific setting by path
  getSetting(path) {
    const keys = path.split('.');
    let current = this.settings;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  // Validate settings structure
  validateSettings(settings = this.settings) {
    const required = [
      'particles.maxCount',
      'particles.spawnRate',
      'particles.lifetime.min',
      'particles.lifetime.max',
      'mouseInteraction.forceType',
      'theme.mode'
    ];

    for (const path of required) {
      if (this.getSetting(path) === undefined) {
        console.warn(`Missing required setting: ${path}`);
        return false;
      }
    }

    return true;
  }
}
