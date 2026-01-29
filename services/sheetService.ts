import { StationData } from "../types";

/**
 * Since we are a client-side only app, we cannot securely use the Google Sheets API directly
 * without exposing credentials or using a proxy.
 * 
 * The standard pattern for this is to use a Google Apps Script Web App acting as a webhook.
 */

export const exportToCSV = (stations: StationData[]) => {
  const headers = ['ID', 'Name', 'Address', 'Latitude', 'Longitude', 'Description', 'Timestamp'];
  const rows = stations.map(s => [
    s.id,
    `"${s.name.replace(/"/g, '""')}"`, // Escape quotes
    `"${s.address.replace(/"/g, '""')}"`,
    s.location.lat,
    s.location.lng,
    `"${s.description.replace(/"/g, '""')}"`,
    new Date(s.timestamp).toISOString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `stations_export_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const saveToGoogleSheetScript = async (station: StationData, scriptUrl: string): Promise<boolean> => {
  if (!scriptUrl) return false;

  try {
    // Send data to Google Apps Script Web App
    // Note: The Script must be deployed as "Anyone" and handle CORS or use 'no-cors' (opaque response)
    const payload = new FormData();
    payload.append('id', station.id);
    payload.append('name', station.name);
    payload.append('address', station.address);
    payload.append('lat', station.location.lat.toString());
    payload.append('lng', station.location.lng.toString());
    payload.append('description', station.description);
    // Images are too large for simple POST usually, sending count or first link if uploaded elsewhere
    payload.append('imageCount', station.images.length.toString());

    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Essential for Google Apps Script Web Apps called from client
      body: payload
    });
    
    return true;
  } catch (e) {
    console.error("Failed to sync to sheet", e);
    return false;
  }
};