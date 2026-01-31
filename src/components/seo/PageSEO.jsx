import React, { useEffect } from "react";
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  buildAbsoluteUrl,
} from "../../utils/seoConfig";

const ensureElement = (selector, create) => {
  if (typeof document === "undefined") return null;
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return null;
  let el = head.querySelector(selector);
  if (!el) {
    el = create();
    if (el) head.appendChild(el);
  }
  return el;
};

const PageSEO = ({
  title,
  description,
  keywords,
  canonicalPath = "/",
  ogType = "website",
  ogImage,
  ogImageAlt,
  twitterCard = "summary_large_image",
  structuredData,
}) => {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const canonicalUrl = buildAbsoluteUrl(canonicalPath || "/");
    const imageUrl = ogImage || DEFAULT_OG_IMAGE;
    const imageAlt = ogImageAlt || DEFAULT_OG_IMAGE_ALT;

    // Description
    if (description) {
      const metaDescription = ensureElement('meta[name="description"]', () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "description");
        el.setAttribute("data-qrfolio-seo", "true");
        return el;
      });
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }
    }

    // Keywords
    if (keywords) {
      const metaKeywords = ensureElement('meta[name="keywords"]', () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "keywords");
        el.setAttribute("data-qrfolio-seo", "true");
        return el;
      });
      if (metaKeywords) {
        metaKeywords.setAttribute(
          "content",
          Array.isArray(keywords) ? keywords.join(", ") : String(keywords)
        );
      }
    }

    // Canonical
    const canonicalLink = ensureElement("link[rel=canonical]", () => {
      const el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      el.setAttribute("data-qrfolio-seo", "true");
      return el;
    });
    if (canonicalLink) {
      canonicalLink.setAttribute("href", canonicalUrl);
    }

    // Open Graph
    const setOg = (property, value) => {
      if (!value) return;
      const meta = ensureElement(`meta[property=\"${property}\"]`, () => {
        const el = document.createElement("meta");
        el.setAttribute("property", property);
        el.setAttribute("data-qrfolio-seo", "true");
        return el;
      });
      if (meta) meta.setAttribute("content", value);
    };

    setOg("og:title", fullTitle);
    setOg("og:description", description || "");
    setOg("og:type", ogType);
    setOg("og:url", canonicalUrl);
    setOg("og:image", imageUrl);
    setOg("og:image:alt", imageAlt);

    // Twitter
    const setTw = (name, value) => {
      if (!value) return;
      const meta = ensureElement(`meta[name=\"${name}\"]`, () => {
        const el = document.createElement("meta");
        el.setAttribute("name", name);
        el.setAttribute("data-qrfolio-seo", "true");
        return el;
      });
      if (meta) meta.setAttribute("content", value);
    };

    setTw("twitter:card", twitterCard);
    setTw("twitter:title", fullTitle);
    setTw("twitter:description", description || "");
    setTw("twitter:image", imageUrl);

    // JSON-LD structured data
    const head = document.head || document.getElementsByTagName("head")[0];
    let cleanupScripts = [];

    if (head && structuredData) {
      const dataArray = Array.isArray(structuredData)
        ? structuredData.filter(Boolean)
        : [structuredData];

      const existingLd = head.querySelectorAll(
        'script[data-qrfolio-ld="true"]'
      );
      existingLd.forEach(
        (node) => node.parentNode && node.parentNode.removeChild(node)
      );

      cleanupScripts = dataArray.map((schema) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-qrfolio-ld", "true");
        script.text = JSON.stringify(schema);
        head.appendChild(script);
        return script;
      });
    }

    return () => {
      if (!cleanupScripts.length) return;
      cleanupScripts.forEach((script) => {
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [
    title,
    description,
    keywords,
    canonicalPath,
    ogType,
    ogImage,
    ogImageAlt,
    twitterCard,
  ]);

  return null;
};

export default PageSEO;
