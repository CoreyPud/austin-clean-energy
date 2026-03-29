import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Redirects URLs with trailing slashes to their non-trailing-slash equivalents.
 * e.g. /guides/ → /guides
 */
const TrailingSlashRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== "/" && location.pathname.endsWith("/")) {
      navigate(
        location.pathname.slice(0, -1) + location.search + location.hash,
        { replace: true }
      );
    }
  }, [location, navigate]);

  return null;
};

export default TrailingSlashRedirect;
