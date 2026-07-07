'use client';

import { useState } from 'react';

interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  fullAddress?: string;
}

interface LocationDetectorProps {
  onAddressFound: (address: AddressData) => void;
}

export default function LocationDetector({ onAddressFound }: LocationDetectorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
          );

          if (!response.ok) throw new Error('Failed to fetch address');

          const data = await response.json();
          const addr = data.address;

          const formattedAddress: AddressData = {
            street: addr.road || addr.pedestrian || addr.suburb || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            state: addr.state || '',
            country: addr.country || '',
            postalCode: addr.postcode || '',
            fullAddress: data.display_name,
          };

          onAddressFound(formattedAddress);
        } catch (err) {
          setError('Could not get address from location.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location permission denied. Please enter address manually.');
            break;
          default:
            setError('Failed to get location.');
        }
        setLoading(false);
      }
    );
  };

  return (
    <div className="w-full mb-6">
      <button
        type="button"
        onClick={detectLocation}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-indigo-600 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
      >
        {loading ? 'Locating...' : '📍 Use My Current Location'}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}