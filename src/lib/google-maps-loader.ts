// Shared Google Maps JS SDK loader — loads the script once per page regardless
// of how many components call loadGoogleMapsScript.

declare global {
  interface Window {
    google: any;
    _initGoogleMaps: () => void;
  }
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
