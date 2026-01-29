import React, { useEffect, useRef, useState } from 'react';
import { Location, StationData } from '../types';

interface MapContainerProps {
  apiKey: string;
  center: Location;
  zoom: number;
  stations: StationData[];
  onMapClick: (loc: Location) => void;
  onMarkerClick: (station: StationData) => void;
  selectedLocation: Location | null;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    L: any; // Leaflet global
  }
}

const MapContainer: React.FC<MapContainerProps> = ({
  apiKey,
  center,
  zoom,
  stations,
  onMapClick,
  onMarkerClick,
  selectedLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Google Maps Refs
  const googleMapRef = useRef<any>(null);
  const googleMarkersRef = useRef<any[]>([]);
  const googleTempMarkerRef = useRef<any>(null);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  // Leaflet Refs
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const leafletTempMarkerRef = useRef<any>(null);

  // --- Google Maps Logic ---

  // Load Google Maps Script (Only if API Key exists)
  useEffect(() => {
    if (!apiKey) return;
    
    if (window.google?.maps) {
      setGoogleScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  // Init Google Map
  useEffect(() => {
    if (apiKey && googleScriptLoaded && mapRef.current && !googleMapRef.current) {
      // Destroy Leaflet if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        disableDefaultUI: false,
        zoomControl: true,
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "off" }] 
            }
        ]
      });

      googleMapRef.current.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onMapClick({ lat, lng });
      });
    }
  }, [apiKey, googleScriptLoaded, onMapClick]);

  // Update Google Map Center
  useEffect(() => {
    if (apiKey && googleMapRef.current) {
      googleMapRef.current.panTo(center);
      googleMapRef.current.setZoom(zoom);
    }
  }, [center, zoom, apiKey]);

  // Render Google Markers
  useEffect(() => {
    if (apiKey && googleMapRef.current) {
      googleMarkersRef.current.forEach((marker) => marker.setMap(null));
      googleMarkersRef.current = [];

      stations.forEach((station) => {
        const marker = new window.google.maps.Marker({
          position: station.location,
          map: googleMapRef.current,
          title: station.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          },
        });
        marker.addListener('click', () => onMarkerClick(station));
        googleMarkersRef.current.push(marker);
      });
    }
  }, [stations, apiKey, onMarkerClick]);

  // Render Google Temp Marker
  useEffect(() => {
    if (apiKey && googleMapRef.current) {
      if (googleTempMarkerRef.current) googleTempMarkerRef.current.setMap(null);
      if (selectedLocation) {
        googleTempMarkerRef.current = new window.google.maps.Marker({
          position: selectedLocation,
          map: googleMapRef.current,
          animation: window.google.maps.Animation.DROP,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#EF4444",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#FFFFFF",
          }
        });
      }
    }
  }, [selectedLocation, apiKey]);


  // --- Leaflet Logic (Fallback) ---

  // Init Leaflet Map
  useEffect(() => {
    if (!apiKey && mapRef.current && !leafletMapRef.current && window.L) {
      // Destroy Google Map if exists (just in case)
      if (googleMapRef.current) {
        // No explicit destroy method for Google Maps v3, just removing reference and clearing container contents by Leaflet
        googleMapRef.current = null;
      }

      const map = window.L.map(mapRef.current).setView([center.lat, center.lng], zoom);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      map.on('click', (e: any) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      leafletMapRef.current = map;
    }
  }, [apiKey, onMapClick]);

  // Update Leaflet Center
  useEffect(() => {
    if (!apiKey && leafletMapRef.current) {
      leafletMapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, apiKey]);

  // Render Leaflet Markers
  useEffect(() => {
    if (!apiKey && leafletMapRef.current && window.L) {
      leafletMarkersRef.current.forEach(m => leafletMapRef.current.removeLayer(m));
      leafletMarkersRef.current = [];

      stations.forEach(station => {
        const marker = window.L.circleMarker([station.location.lat, station.location.lng], {
          color: 'white',
          fillColor: '#3B82F6',
          fillOpacity: 1,
          radius: 8,
          weight: 2
        }).addTo(leafletMapRef.current);
        
        // Bind click
        marker.on('click', (e: any) => {
            window.L.DomEvent.stopPropagation(e);
            onMarkerClick(station)
        });
        marker.bindTooltip(station.name);
        
        leafletMarkersRef.current.push(marker);
      });
    }
  }, [stations, apiKey, onMarkerClick]);

  // Render Leaflet Temp Marker
  useEffect(() => {
    if (!apiKey && leafletMapRef.current && window.L) {
      if (leafletTempMarkerRef.current) {
        leafletMapRef.current.removeLayer(leafletTempMarkerRef.current);
        leafletTempMarkerRef.current = null;
      }

      if (selectedLocation) {
        // Simple red circle marker for temp, or use a custom icon if needed
         const redIcon = window.L.icon({
             iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
             shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
             iconSize: [25, 41],
             iconAnchor: [12, 41],
             popupAnchor: [1, -34],
             shadowSize: [41, 41]
         });

         leafletTempMarkerRef.current = window.L.marker(
             [selectedLocation.lat, selectedLocation.lng],
             { icon: redIcon }
         ).addTo(leafletMapRef.current);
      }
    }
  }, [selectedLocation, apiKey]);

  return (
    <div className="w-full h-full relative group">
       <div ref={mapRef} className="w-full h-full z-0" />
       {!apiKey && (
           <div className="absolute bottom-1 right-1 bg-white/80 px-2 py-1 text-[10px] text-gray-500 z-[400] rounded pointer-events-none">
               No API Key - Using OpenStreetMap
           </div>
       )}
    </div>
  );
};

export default MapContainer;