import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapTokenLoaderProps {
  children: React.ReactNode;
}

const MapTokenLoader = ({ children }: MapTokenLoaderProps) => {
  const [tokenLoaded, setTokenLoaded] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) throw error;
        
        if (data?.token) {
          (window as any).MAPBOX_TOKEN = data.token;
          setTokenLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Mapbox token:', error);
      }
    };

    loadToken();
  }, []);

  if (!tokenLoaded) {
    return null;
  }

  return <>{children}</>;
};

export default MapTokenLoader;
