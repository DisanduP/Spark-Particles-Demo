import React from 'react';

export const ConfigManagement = ({ configManager }) => {
  const handleExport = () => {
    if (configManager) {
      const json = configManager.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `particle-config-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file && configManager) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = configManager.loadFromJSON(e.target.result);
        if (!success) {
          alert('Failed to load configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (configManager && confirm('Reset all settings to defaults?')) {
      configManager.resetToDefaults();
    }
  };

  return (
    <section>
      <h4>Configuration</h4>
      
      <div className="config-buttons">
        <button onClick={handleExport}>Export Config</button>
        <label className="file-input-label">
          Import Config
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
        <button onClick={handleReset} className="reset-button">Reset to Defaults</button>
      </div>
    </section>
  );
};
