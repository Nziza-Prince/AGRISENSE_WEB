import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  buildJsonLd,
  canonicalUrl,
  getSeoForPath,
  SITE_KEYWORDS,
  SITE_NAME,
} from "@/lib/seo";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = extra?.hreflang
    ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
    }
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const Seo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getSeoForPath(pathname);
    const url = canonicalUrl(seo.path);
    const image = seo.image!;

    if (!seo.noIndex) {
      document.title = seo.title;
    }

    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "keywords", seo.keywords || SITE_KEYWORDS);
    upsertMeta("name", "robots", seo.noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");
    upsertMeta("name", "geo.region", "RW");
    upsertMeta("name", "geo.placename", "Nyabihu");
    upsertMeta("name", "language", "English");

    // Always set self-referencing canonical for the current path (never force homepage).
    upsertLink("canonical", url);
    upsertLink("alternate", url, { hreflang: "en" });
    upsertLink("alternate", url, { hreflang: "x-default" });

    upsertMeta("property", "og:type", seo.type === "article" ? "article" : "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", seo.noIndex ? SITE_NAME : seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:alt", "AgriSense team and farmers in Rwanda");
    upsertMeta("property", "og:locale", "en_RW");

    if (seo.publishedTime) {
      upsertMeta("property", "article:published_time", seo.publishedTime);
      upsertMeta("property", "article:author", SITE_NAME);
    }

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.noIndex ? SITE_NAME : seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", image);

    upsertJsonLd("agrisense-jsonld", buildJsonLd(pathname));
  }, [pathname]);

  return null;
};

export default Seo;
