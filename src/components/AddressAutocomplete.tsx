import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    _initGoogleMaps: () => void;
  }
}

// Module-level script state so the SDK is only loaded once across re-renders/mounts
let gmapsState: "idle" | "loading" | "ready" | "error" = "idle";
const gmapsCallbacks: Array<() => void> = [];

function loadGoogleMapsScript(apiKey: string, onReady: () => void) {
  if (gmapsState === "ready") {
    onReady();
    return;
  }
  gmapsCallbacks.push(onReady);
  if (gmapsState === "loading") return;

  gmapsState = "loading";
  window._initGoogleMaps = () => {
    gmapsState = "ready";
    gmapsCallbacks.forEach((cb) => cb());
    gmapsCallbacks.length = 0;
  };

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=_initGoogleMaps`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    gmapsState = "error";
  };
  document.head.appendChild(script);
}

const AUSTIN_BOUNDS = {
  sw: { lat: 30.098, lng: -97.978 },
  ne: { lat: 30.516, lng: -97.565 },
};

const AddressAutocomplete = ({ id, value, onChange, onKeyDown, placeholder, className }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [mapsReady, setMapsReady] = useState(false);

  // Fetch the API key from edge function and load the Maps SDK
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-config");
        if (error || !data?.apiKey || cancelled) return;
        loadGoogleMapsScript(data.apiKey, () => {
          if (!cancelled) setMapsReady(true);
        });
      } catch {
        // Falls back to plain text input silently
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Attach Places Autocomplete once the SDK is available
  useEffect(() => {
    if (!mapsReady || !inputRef.current || autocompleteRef.current) return;

    const bounds = new window.google.maps.LatLngBounds(AUSTIN_BOUNDS.sw, AUSTIN_BOUNDS.ne);

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      bounds,
      strictBounds: false,
      fields: ["formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    autocompleteRef.current = ac;
  }, [mapsReady, onChange]);

  // Sync external value changes (e.g. "Start over" reset) into the DOM input
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      id={id}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder ?? "123 Main St, Austin, TX"}
      autoComplete="off"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
};

export default AddressAutocomplete;
