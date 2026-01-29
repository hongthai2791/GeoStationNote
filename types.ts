export interface Location {
  lat: number;
  lng: number;
}

export interface StationData {
  id: string;
  name: string;
  address: string;
  location: Location;
  description: string;
  images: string[]; // Base64 strings
  timestamp: number;
}

export enum AppView {
  MAP = 'MAP',
  LIST = 'LIST',
  SETTINGS = 'SETTINGS'
}

export interface AppConfig {
  googleMapsApiKey: string;
  googleSheetScriptUrl: string; // URL for Google Apps Script Web App
}