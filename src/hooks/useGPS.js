import { useState, useCallback } from 'react';

// Fallback coordinates — NH-44 near Delhi
const FALLBACK_COORDS = { lat: 28.6139, lng: 77.209 };

export function useGPS() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setCoords(FALLBACK_COORDS);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        // Silently fall back to mock coordinates
        setCoords(FALLBACK_COORDS);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  return { coords, loading, error, fetchLocation };
}