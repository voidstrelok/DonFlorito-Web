'use client';

import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { VENUE } from '@/lib/utils/constants';

const containerStyle = {
  width: '100%',
  height: '420px',
  borderRadius: '1rem',
};

export function VenueMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'don-florito-map',
    googleMapsApiKey: apiKey ?? '',
  });

  if (!apiKey) {
    return (
      <div className="map-fallback">
        Configura <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para habilitar Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="map-fallback">Cargando mapa...</div>;
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={VENUE.mapCenter} zoom={18} mapTypeId="hybrid">
      <MarkerF position={VENUE.marker} />
    </GoogleMap>
  );
}
