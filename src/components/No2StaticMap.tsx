import { useEffect, useState } from "react";

interface Props {
  imageSrc: string;
  opacity?: number;
  height?: number;
}

export function No2StaticMap({ imageSrc, opacity = 0.45, height = 460 }: Props) {
  const [iframeSrc, setIframeSrc] = useState("");

  useEffect(() => {
    const token = (window as any).MAPBOX_TOKEN || "";
    const params = new URLSearchParams({ img: imageSrc, opacity: String(opacity) });
    if (token) params.set("token", token);
    setIframeSrc(`/no2_map.html?${params}`);
  }, [imageSrc, opacity]);

  if (!iframeSrc) return null;

  return (
    <iframe
      src={iframeSrc}
      style={{ height, width: "100%", border: "none" }}
      title="NO₂ pollution map"
    />
  );
}
