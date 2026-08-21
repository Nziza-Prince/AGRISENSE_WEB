/**
 * Early SEO bootstrap for the SPA.
 * Runs in <head> before React so crawlers see the correct canonical/title
 * for /about, /blog, etc. instead of the homepage defaults in index.html.
 */
(function () {
  var SITE = "https://agrisense.rw";
  var path = (location.pathname || "/").replace(/\/+$/, "") || "/";

  var pages = {
    "/": {
      title: "AgriSense Rwanda | AI Smart Farming, Soil Analysis & Weather",
      description:
        "AgriSense is Rwanda’s smart farming platform: AI soil analysis, live farm weather, crop recommendations, and a farmer–supplier marketplace. Built in Nyabihu for farmers, co-ops, NGOs, and government.",
    },
    "/about": {
      title: "About AgriSense | Smart Agriculture Team in Rwanda",
      description:
        "AgriSense was built in Rwanda to give farmers clearer soil, weather, and market decisions. Meet the team in Nyabihu connecting AI with African agriculture.",
    },
    "/services": {
      title: "Smart Farming Services in Rwanda | Soil, Weather, Marketplace",
      description:
        "AgriSense services for Rwandan farms: soil and crop analysis, weather and climate alerts, farm management, supplier pricing, and a farmer marketplace.",
    },
    "/blog": {
      title: "Smart Farming Blog Rwanda | Soil, Weather & Irrigation",
      description:
        "Guides for Rwandan growers: soil fertility, weather and yields, and irrigation that saves water. Written for real fields, not theory.",
    },
    "/contact": {
      title: "Contact AgriSense | Nyabihu, Rwanda (+250 798 963 223)",
      description:
        "Contact AgriSense in Nyabihu, Rwanda. Email agrisense8@gmail.com or call +250 798 963 223 for farmers, partners, NGOs, and enterprise programmes.",
    },
    "/legal/terms": {
      title: "Terms of Service | AgriSense Rwanda",
      description: "Terms that govern use of the AgriSense smart farming platform at agrisense.rw.",
    },
    "/legal/privacy": {
      title: "Privacy Policy | AgriSense Rwanda",
      description:
        "How AgriSense collects and protects farmer, supplier, and partner data on agrisense.rw.",
    },
    "/blog/improve-soil-fertility-rwanda": {
      title: "5 Practical Ways to Improve Soil Fertility on Rwandan Farms | AgriSense Blog",
      description:
        "How Rwandan farmers can improve soil fertility with soil tests, organic matter, crop rotation, and AgriSense crop recommendations.",
      type: "article",
    },
    "/blog/weather-and-crop-yields-rwanda": {
      title: "How Weather Patterns Shape Crop Yields in Rwanda | AgriSense Blog",
      description:
        "Understand rainfall, drought, and frost risk in Rwanda, and how hyperlocal farm weather alerts protect seedlings and harvests.",
      type: "article",
    },
    "/blog/smart-irrigation-save-water": {
      title: "Smart Irrigation: Save Water and Protect Growth | AgriSense Blog",
      description:
        "Irrigation tips for Rwandan farms: water when soil and weather say so, reduce waste, and protect yield with AgriSense scheduling.",
      type: "article",
    },
  };

  var privatePrefixes = ["/app", "/admin", "/supplier", "/ngo", "/auth", "/testCharts"];
  var isPrivate = privatePrefixes.some(function (prefix) {
    return path === prefix || path.indexOf(prefix + "/") === 0;
  });

  var meta = pages[path];
  if (!meta && isPrivate) {
    meta = {
      title: "AgriSense | Account",
      description:
        "AgriSense is Rwanda’s smart farming platform: AI soil analysis, live farm weather, crop recommendations, and a farmer–supplier marketplace.",
      noIndex: true,
    };
  }
  if (!meta) {
    meta = {
      title: "AgriSense Rwanda | AI Smart Farming, Soil Analysis & Weather",
      description:
        "AgriSense is Rwanda’s smart farming platform: AI soil analysis, live farm weather, crop recommendations, and a farmer–supplier marketplace.",
      noIndex: path !== "/",
    };
  }

  var url = SITE + (path === "/" ? "/" : path);

  function setMeta(attr, key, content) {
    var el = document.head.querySelector("meta[" + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function setLink(rel, href) {
    var el = document.head.querySelector('link[rel="' + rel + '"]:not([hreflang])');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  if (!meta.noIndex) {
    document.title = meta.title;
  }

  setMeta("name", "description", meta.description);
  setMeta(
    "name",
    "robots",
    meta.noIndex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1",
  );
  setLink("canonical", url);

  setMeta("property", "og:type", meta.type === "article" ? "article" : "website");
  setMeta("property", "og:title", meta.noIndex ? "AgriSense" : meta.title);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:url", url);

  setMeta("name", "twitter:title", meta.noIndex ? "AgriSense" : meta.title);
  setMeta("name", "twitter:description", meta.description);
})();
