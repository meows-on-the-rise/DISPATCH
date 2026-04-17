import { useState, useEffect, useRef } from "react";

export interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useGeolocation(watch = false) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const opts: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 3000,
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    if (watch) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (e) => setError(e.message),
        opts
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (e) => setError(e.message),
        opts
      );
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [watch]);

  return { coords, error };
}
