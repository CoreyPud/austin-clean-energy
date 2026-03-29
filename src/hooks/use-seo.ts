import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description: string;
}

const DEFAULT_TITLE = "Austin Clean Energy Opportunity Dashboard";

export function useSeo({ title, description }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title === DEFAULT_TITLE ? title : `${title} | Austin Clean Energy`;
    document.title = fullTitle;

    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    } else {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      meta.setAttribute("content", description);
      document.head.appendChild(meta);
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description]);
}
