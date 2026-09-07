import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapTokenLoaderProps {
  children: React.ReactNode;
  /** Sizes the loading/error placeholder to match whatever the map will actually render at
   *  (e.g. "h-full w-full" for a full-screen map) so swapping from placeholder to real map
   *  doesn't resize/reflow the page. Defaults to a fixed height, matching every caller before
   *  this prop existed. */
  className?: string;
}

const MapTokenLoader = ({ children, className = "h-[500px]" }: MapTokenLoaderProps) => {
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      if ((window as any).MAPBOX_TOKEN) { setTokenLoaded(true); return; }
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
      <div className={`${className} flex items-center justify-center bg-muted rounded-lg`}>
        <p className="text-muted-foreground">Unable to load map. Please try again later.</p>
      </div>
    );
  }

  if (!tokenLoaded) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center gap-3`}>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default MapTokenLoader;
