import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SeoOptions {
  title: string;
  description: string;
  type?: string; // og:type, defaults to "website"
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_TITLE = "Austin Clean Energy Opportunity Dashboard";
const SITE_NAME = "Austin Clean Energy";
const BASE_URL = "https://austin-clean-energy.lovable.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function setMetaTag(property: string, content: string, isOg = false) {
  const attr = isOg ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (el) {
    el.setAttribute("content", content);
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    el.setAttribute("content", content);
    document.head.appendChild(el);
  }
}

function setLinkTag(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (el) {
    el.href = href;
  } else {
    el = document.createElement("link");
    el.rel = rel;
    el.href = href;
    document.head.appendChild(el);
  }
}

function setJsonLd(data: Record<string, unknown>) {
  let el = document.querySelector('script[data-seo="json-ld"]') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo", "json-ld");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  document.querySelector('script[data-seo="json-ld"]')?.remove();
}

export function useSeo({ title, description, type = "website", jsonLd }: SeoOptions) {
  const location = useLocation();

  useEffect(() => {
    const fullTitle = title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;
    const canonicalUrl = `${BASE_URL}${location.pathname}`;

    // Title
    document.title = fullTitle;

    // Meta description
    setMetaTag("description", description);

    // Canonical
    setLinkTag("canonical", canonicalUrl);

    // Open Graph
    setMetaTag("og:title", fullTitle, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:type", type, true);
    setMetaTag("og:url", canonicalUrl, true);
    setMetaTag("og:site_name", SITE_NAME, true);
    setMetaTag("og:image", DEFAULT_OG_IMAGE, true);

    // Twitter Card
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", DEFAULT_OG_IMAGE);

    // JSON-LD
    const ldData = jsonLd ?? {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: fullTitle,
      description,
      url: canonicalUrl,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: BASE_URL,
      },
    };
    setJsonLd(ldData);

    return () => {
      document.title = DEFAULT_TITLE;
      removeJsonLd();
    };
  }, [title, description, type, jsonLd, location.pathname]);
}
