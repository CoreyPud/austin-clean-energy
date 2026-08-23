// Shared Google Maps JS SDK loader — loads the script once per page regardless
// of how many components call loadGoogleMapsScript.

import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    google: any;
    _initGoogleMaps: () => void;
  }
}

let apiKeyPromise: Promise<string> | null = null;

/** Fetches the (public, referrer-restricted) Google Maps API key once per page load and
 *  caches it, regardless of how many components call this. */
export function getGoogleMapsApiKey(): Promise<string> {
  if (!apiKeyPromise) {
    apiKeyPromise = supabase.functions.invoke("get-maps-config").then(({ data, error }) => {
      if (error || !data?.apiKey) {
        apiKeyPromise = null; // allow retry on next call
        throw new Error(error?.message ?? "Maps API key unavailable");
      }
      return data.apiKey as string;
    });
  }
  return apiKeyPromise;
}

let state: "idle" | "loading" | "ready" | "error" = "idle";
const callbacks: Array<() => void> = [];

export function loadGoogleMapsScript(apiKey: string, onReady: () => void) {
  if (state === "ready") { onReady(); return; }
  callbacks.push(onReady);
  if (state === "loading") return;

  state = "loading";
  window._initGoogleMaps = () => {
    state = "ready";
    callbacks.forEach((cb) => cb());
    callbacks.length = 0;
  };

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=_initGoogleMaps`;
  script.async = true;
  script.defer = true;
  script.onerror = () => { state = "error"; };
  document.head.appendChild(script);
}

export function isGoogleMapsReady() {
  return state === "ready";
}
