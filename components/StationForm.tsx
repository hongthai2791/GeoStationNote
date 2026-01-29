import React, { useState, useRef, useCallback } from 'react';
import { Location, StationData } from '../types';
import { Loader2, Camera, MapPin, Sparkles, Save, X } from 'lucide-react';
import { generateStationDescription } from '../services/geminiService';
import { saveToGoogleSheetScript } from '../services/sheetService';

interface StationFormProps {
  location: Location;
  onSave: (data: StationData) => void;
  onCancel: () => void;
  scriptUrl: string;
}

const StationForm: React.FC<StationFormProps> = ({ location, onSave, onCancel, scriptUrl }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Limit to 4 images total
      const remainingSlots = 4 - images.length;
      const filesToProcess = files.slice(0, remainingSlots);

      filesToProcess.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGeminiAnalysis = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    const desc = await generateStationDescription(images, location);
    setDescription(desc);
    setIsAnalyzing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const newStation: StationData = {
      id: crypto.randomUUID(),
      name,
      address,
      description,
      location,
      images,
      timestamp: Date.now()
    };

    // Attempt to sync to sheet (fire and forget or wait depending on UX preference)
    if (scriptUrl) {
        await saveToGoogleSheetScript(newStation, scriptUrl);
    }

    onSave(newStation);
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-xl overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white sticky top-0 z-10">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5" /> New Station
        </h2>
        <button onClick={onCancel} className="p-1 hover:bg-blue-700 rounded-full transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1">
        
        {/* Coordinates Display */}
        <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-600 flex justify-between">
          <span>Lat: {location.lat.toFixed(5)}</span>
          <span>Lng: {location.lng.toFixed(5)}</span>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Central Power Station A"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. 123 Main St, Hanoi"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos ({images.length}/4)
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                <img src={img} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
        </div>

        {/* Description & AI */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-sm font-medium text-gray-700">Description / Notes</label>
            <button
              type="button"
              onClick={handleGeminiAnalysis}
              disabled={isAnalyzing || images.length === 0}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition ${
                images.length === 0 
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Auto-fill with AI
            </button>
          </div>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="Enter details or use AI to generate from photos..."
          />
        </div>

        {/* Actions */}
        <div className="pt-4 sticky bottom-0 bg-white pb-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Station
          </button>
          {scriptUrl && <p className="text-xs text-gray-400 text-center mt-2">Syncing to Google Sheet enabled</p>}
        </div>
      </form>
    </div>
  );
};

export default StationForm;