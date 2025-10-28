import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapTokenLoaderProps {
  children: React.ReactNode;
}

const MapTokenLoader = ({ children }: MapTokenLoaderProps) => {
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Mapbox token error:', error);
          setError(true);
          return;
        }
        
        if (data?.token) {
          (window as any).MAPBOX_TOKEN = data.token;
          console.log('Mapbox token loaded successfully');
          setTokenLoaded(true);
        } else {
          console.error('No token in response');
          setError(true);
        }
      } catch (error) {
        console.error('Failed to load Mapbox token:', error);
        setError(true);
      }
    };

    loadToken();
  }, []);

  if (error) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Unable to load map. Please try again later.</p>
      </div>
    );
  }

  if (!tokenLoaded) {
    return (
      <div className="h-[500px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default MapTokenLoader;
