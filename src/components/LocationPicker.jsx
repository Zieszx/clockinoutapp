import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const KL_CENTER = [3.139, 101.687];

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapFlyTo({ flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (!flyTo) return;
    map.flyTo([flyTo.lat, flyTo.lng], 15, { animate: true, duration: 1 });
  }, [flyTo, map]);
  return null;
}

function MapInitializer() {
  const map = useMap();
  useEffect(() => {
    // Fixes tile rendering when map is inside a Dialog (initially hidden)
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function LocationPicker({ lat, lng, flyTo, onPick }) {
  const position = lat && lng ? [lat, lng] : null;

  return (
    <MapContainer center={position || KL_CENTER} zoom={position ? 15 : 11} style={{ height: '280px', width: '100%', borderRadius: '0.75rem', cursor: 'crosshair' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <MapClickHandler onPick={onPick} />
      <MapFlyTo flyTo={flyTo} />
      <MapInitializer />
      {position && <Marker position={position} />}
    </MapContainer>
  );
}
