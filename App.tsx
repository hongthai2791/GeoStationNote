import React, { useState, useEffect, useCallback } from 'react';
import MapContainer from './components/MapContainer';
import StationForm from './components/StationForm';
import Settings from './components/Settings';
import { StationData, Location, AppView, AppConfig } from './types';
import { 
  Plus, 
  List, 
  Settings as SettingsIcon, 
  Download, 
  MapPin, 
  Locate, 
  ChevronLeft,
  Trash2
} from 'lucide-react';
import { exportToCSV } from './services/sheetService';

const DEFAULT_CENTER: Location = { lat: 21.0285, lng: 105.8542 }; // Hanoi
const STORAGE_KEY_CONFIG = 'geo_station_config';
const STORAGE_KEY_DATA = 'geo_station_data';

export default function App() {
  // State
  const [config, setConfig] = useState<AppConfig>({
    googleMapsApiKey: '',
    googleSheetScriptUrl: ''
  });
  const [stations, setStations] = useState<StationData[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.MAP);
  const [mapCenter, setMapCenter] = useState<Location>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState<number>(12);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load persisted data
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (savedConfig) setConfig(JSON.parse(savedConfig));

    const savedData = localStorage.getItem(STORAGE_KEY_DATA);
    if (savedData) setStations(JSON.parse(savedData));
  }, []);

  // Save config/data changes
  const updateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
  };

  const addStation = (station: StationData) => {
    const updated = [station, ...stations];
    setStations(updated);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updated));
    setSelectedLocation(null);
    setCurrentView(AppView.LIST);
  };

  const deleteStation = (id: string) => {
    const updated = stations.filter(s => s.id !== id);
    setStations(updated);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updated));
  };

  // Handlers
  const handleMapClick = (loc: Location) => {
    setSelectedLocation(loc);
    if (!isSidebarOpen) setIsSidebarOpen(true);
    setCurrentView(AppView.MAP); // Ensure we are on map view but showing the "Add" prompt
  };

  const handleMarkerClick = (station: StationData) => {
    setMapCenter(station.location);
    setZoom(16);
    // Could open details view here
    setCurrentView(AppView.LIST);
    setIsSidebarOpen(true);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(loc);
          setZoom(15);
          setSelectedLocation(loc); // Auto-select current location for logging
        },
        () => {
          alert("Could not access your location.");
        }
      );
    }
  };

  // Render Sidebar Content
  const renderSidebar = () => {
    if (currentView === AppView.SETTINGS) {
      return (
        <Settings 
          config={config} 
          onSave={updateConfig} 
          onClose={() => setCurrentView(AppView.MAP)} 
        />
      );
    }

    if (selectedLocation && currentView === AppView.MAP) {
      return (
        <StationForm 
          location={selectedLocation}
          onSave={addStation}
          onCancel={() => setSelectedLocation(null)}
          scriptUrl={config.googleSheetScriptUrl}
        />
      );
    }

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h1 className="font-bold text-lg text-gray-800">Saved Stations ({stations.length})</h1>
          <button 
            onClick={() => exportToCSV(stations)}
            className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition"
            title="Export CSV"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {stations.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 space-y-2">
              <MapPin className="w-10 h-10 mx-auto opacity-50" />
              <p>No stations recorded yet.</p>
              <p className="text-sm">Click on the map or use the locate button to start.</p>
            </div>
          ) : (
            stations.map(station => (
              <div key={station.id} className="border rounded-lg p-3 hover:shadow-md transition bg-white group relative">
                 <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{station.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{station.address}</p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteStation(station.id); }}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                
                {station.images.length > 0 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {station.images.map((img, i) => (
                      <img key={i} src={img} className="w-16 h-16 object-cover rounded" alt="station" />
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-2 rounded">{station.description}</p>
                <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                        {new Date(station.timestamp).toLocaleDateString()}
                    </span>
                    <button 
                        onClick={() => {
                            setMapCenter(station.location);
                            setZoom(16);
                        }}
                        className="text-xs text-blue-600 font-medium hover:underline"
                    >
                        View on Map
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 relative">
      
      {/* Sidebar Panel */}
      <div 
        className={`fixed md:relative z-20 h-full bg-white shadow-xl transition-all duration-300 ease-in-out transform 
          ${isSidebarOpen ? 'w-full md:w-96 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}
        `}
      >
        <div className="h-full w-full md:w-96">
            {renderSidebar()}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <MapContainer 
          apiKey={config.googleMapsApiKey}
          center={mapCenter}
          zoom={zoom}
          stations={stations}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          selectedLocation={selectedLocation}
        />

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button 
                onClick={() => setCurrentView(AppView.SETTINGS)}
                className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 text-gray-700 transition"
                title="Settings"
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
            <button 
                onClick={handleLocateMe}
                className="bg-blue-600 p-3 rounded-full shadow-lg hover:bg-blue-700 text-white transition"
                title="My Location"
            >
                <Locate className="w-6 h-6" />
            </button>
        </div>

        {/* Sidebar Toggle (Mobile/Desktop) */}
        {!isSidebarOpen && (
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-lg z-10"
            >
                <List className="w-6 h-6" />
            </button>
        )}
        
        {/* Mobile Close Sidebar */}
        {isSidebarOpen && (
             <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden absolute top-4 left-4 bg-white p-2 rounded-full shadow-lg z-30"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
        )}
        
        {/* Toggle View Mode Button (for desktop convenience to switch back to list) */}
        {isSidebarOpen && currentView !== AppView.LIST && selectedLocation === null && currentView !== AppView.SETTINGS && (
           <div className="absolute top-4 left-4 z-10 hidden md:block">
              <button 
                onClick={() => setCurrentView(AppView.LIST)}
                className="bg-white px-4 py-2 rounded-full shadow font-medium text-sm flex items-center gap-2"
              >
                <List className="w-4 h-4" /> View List
              </button>
           </div>
        )}
      </div>

      {/* Removed the blocking modal for missing API Key to support free usage */}
    </div>
  );
}