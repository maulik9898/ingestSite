import type { CheerioRoot } from "@crawlee/utils";

// Constants for tag exclusion/inclusion
export const EXCLUDE_NON_MAIN_TAGS = [
  "footer",
  "nav",
  "aside",
  ".header",
  ".top",
  "#navbar",
  "navbar",
  ".navbar",
  "#sidebar",
  "sidebar",
  ".sidebar",
  ".footer",
  ".bottom",
  "#footer",
  ".side",
  ".aside",
  ".overlay",
  ".ad",
  ".ads",
  ".advert",
  "#ad",
  ".lang-selector",
  ".language",
  "#language-selector",
  ".social",
  ".social-media",
  ".social-links",
  "#social",
  ".menu",
  ".navigation",
  "#nav",
  ".breadcrumbs",
  "#breadcrumbs",
  ".share",
  "#share",
  ".widget",
  "#widget",
  ".cookie",
  "#cookie",
  "img",
  "svg",
  "head",
];

export const FORCE_INCLUDE_MAIN_TAGS = ["#main"];

export interface ScrapeOptions {
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
}

const defaultOptions: ScrapeOptions = {
  excludeTags: EXCLUDE_NON_MAIN_TAGS,
  onlyMainContent: true,
};

export function cleanHtml(
  $: CheerioRoot,
  options: ScrapeOptions = defaultOptions,
): string {
  // If includeTags are provided, only clone those elements under a new container
  if (options.includeTags?.length) {
    const $new = $("<div></div>");
    for (const tag of options.includeTags) {
      $(tag).each((_, el) => {
        $new.append($(el).clone());
      });
    }
    // Replace the body content with the newly included tags
    $("body").empty().append($new);
  }

  // Remove unwanted elements
  $("script, style, noscript, meta").remove();

  // Process excludeTags (supporting wildcard notation)
  if (options.excludeTags?.length) {
    for (const tag of options.excludeTags) {
      if (tag.startsWith("*") && tag.endsWith("*")) {
        // Remove any element with a tagname that matches the pattern
        const pattern = new RegExp(tag.slice(1, -1), "i");
        $("*").each((_, el) => {
          const $el = $(el);
          const tagName = $el.prop("tagName")?.toLowerCase() || "";
          if (pattern.test(tagName)) {
            $el.remove();
          }
        });
      } else if (tag.startsWith("*.")) {
        // Remove any element with the specified class
        const className = tag.slice(2);
        $(`.${className}`).remove();
      } else {
        $(tag).remove();
      }
    }
  }

  // Only keep main content by removing elements that are not forced
  if (options.onlyMainContent) {
    for (const tag of EXCLUDE_NON_MAIN_TAGS) {
      $(tag).each((_, el) => {
        const $el = $(el);
        // Only keep element if it contains any force include tag
        const hasForceInclude = FORCE_INCLUDE_MAIN_TAGS.some(
          (includeTag) => $el.find(includeTag).length > 0,
        );
        if (!hasForceInclude) {
          $el.remove();
        }
      });
    }
  }

  // Handle images with srcset: choose the image with the highest resolution indicator
  $("img[srcset]").each((_, el) => {
    const $img = $(el);
    const srcset = $img.attr("srcset");
    if (!srcset) return;

    const sizes: Array<{ url: string; size: number }> = [];
    for (const srcStr of srcset.split(",")) {
      const parts = srcStr.trim().split(/\s+/);
      if (parts.length >= 2) {
        const urlPart = parts[0];
        const sizePart = parts[1];
        if (sizePart.endsWith("x")) {
          const size = Number.parseInt(sizePart.slice(0, -1)) || 1;
          sizes.push({ url: urlPart, size });
        }
      }
    }
    if (sizes.length) {
      // Also include the fallback src if available
      const currentSrc = $img.attr("src");
      if (currentSrc) {
        sizes.push({ url: currentSrc, size: 1 });
      }
      sizes.sort((a, b) => b.size - a.size);
      $img.attr("src", sizes[0].url);
    }
  });

  // Remove all "class" attributes from all elements to reduce token count.
  $("*").each((_, el) => {
    $(el).removeAttr("class");
  });

  // Optionally, if you want to preserve only a set of attributes, you could loop
  // over each element and remove every attribute that is not in KEEP_ATTRIBUTES.
  // For example:
  // $("*").each((_, el) => {
  //   const attribs = el.attribs;
  //   Object.keys(attribs).forEach((attrName) => {
  //     if (!KEEP_ATTRIBUTES.has(attrName)) {
  //       $(el).removeAttr(attrName);
  //     }
  //   });
  // });

  return $.html();
}
