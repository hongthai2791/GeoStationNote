import React, { useState } from 'react';
import { AppConfig } from '../types';
import { Save, Key, FileSpreadsheet } from 'lucide-react';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave, onClose }) => {
  const [mapsKey, setMapsKey] = useState(config.googleMapsApiKey);
  const [scriptUrl, setScriptUrl] = useState(config.googleSheetScriptUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      googleMapsApiKey: mapsKey,
      googleSheetScriptUrl: scriptUrl
    });
    onClose();
  };

  return (
    <div className="p-6 bg-white h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Application Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Key className="w-4 h-4" /> Google Maps API Key
          </label>
          <input 
            type="password"
            value={mapsKey}
            onChange={(e) => setMapsKey(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="AIzaSy..."
          />
          <p className="text-xs text-gray-500">
            Required for the map to load. Must have Maps JavaScript API enabled.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Google Apps Script Web App URL
          </label>
          <input 
            type="text"
            value={scriptUrl}
            onChange={(e) => setScriptUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="https://script.google.com/macros/s/.../exec"
          />
          <p className="text-xs text-gray-500">
            Deployment URL for your Apps Script to save data to Sheets. 
            <br />
            1. Create Sheet -> Extensions -> Apps Script.
            <br />
            2. Implement <code>doPost(e)</code>.
            <br />
            3. Deploy as Web App (Execute as: Me, Access: Anyone).
          </p>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;