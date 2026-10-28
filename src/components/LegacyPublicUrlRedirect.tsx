import { Navigate, useLocation } from "react-router-dom";
import { renamedPublicUrl } from "@/lib/public-url-renames";

export default function LegacyPublicUrlRedirect() {
  const { pathname, search, hash } = useLocation();
  const destination = renamedPublicUrl(pathname, search, hash);
  return destination ? <Navigate to={destination} replace /> : null;
}