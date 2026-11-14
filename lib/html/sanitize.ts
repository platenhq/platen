import "server-only";
import sanitizeHtml, { type IOptions } from "sanitize-html";

/**
 * Server-side cleaning of document HTML before it is stored. Snapshots are sent by browsers, so
 * a crafted request could carry scripts, event handlers or styles that load remote resources;
 * only the tags, classes and inline styles the editor produces are kept.
 */

// A thumbnail with inline images over this size shows image placeholders instead
const PREVIEW_MAX_LENGTH = 200_000;

// Any value except ones that load resources or break out of the declaration
const SAFE_STYLE_VALUE = /^(?!.*(?:url|expression|image-set|image|var)\s*\()[^;{}<>"\\]*$/i;

const STYLE_PROPERTIES = [
  "color",
  "background-color",
  "text-align",
  "text-decoration",
  "text-indent",
  "text-transform",
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "white-space",
  "vertical-align",
  "width",
  "height",
  "min-width",
  "max-width",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-color",
  "border-width",
  "border-style",
  "border-collapse",
  "padding",
  "padding-left",
  "padding-right",
  "padding-inline-start",
  "margin",
  "margin-left",
  "margin-right",
];

const DATA_IMAGE = /^data:image\/[a-z0-9.+-]+;base64,/i;

const baseOptions: IOptions = {
  allowedTags: [
    "p",
    "br",
    "span",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "sub",
    "sup",
    "small",
    "code",
    "mark",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "pre",
    "hr",
    "ul",
    "ol",
    "li",
    "table",
    "colgroup",
    "col",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "td",
    "th",
    "a",
    "img",
    "div",
    "figure",
    "figcaption",
    "iframe",
  ],
  allowedAttributes: {
    "*": ["class", "style", "dir"],
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    iframe: ["src", "width", "height", "allowfullscreen", "frameborder"],
    pre: ["data-gutter", "data-language", "data-highlight-language"],
    ol: ["start"],
    li: ["value"],
    col: ["span"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedClasses: { "*": ["editor-*", "ltr", "rtl"] },
  allowedStyles: {
    "*": Object.fromEntries(STYLE_PROPERTIES.map((property) => [property, [SAFE_STYLE_VALUE]])),
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https", "data"], iframe: ["https"] },
  allowedIframeHostnames: ["www.youtube-nocookie.com"],
  allowProtocolRelative: false,
  transformTags: {
    // Images load from https or inline image data only
    img: (tagName, attribs) => {
      const { src, ...rest } = attribs;
      const safeSrc = src && (src.startsWith("https://") || DATA_IMAGE.test(src));
      return { tagName, attribs: safeSrc ? { ...attribs } : rest };
    },
  },
};

/** Cleans a document's full HTML, kept for exports. */
export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, baseOptions);
}

const placeholder = (kind: "image" | "embed") => ({
  tagName: "div",
  attribs: { class: `editor-thumbnail-${kind}` },
});

function sanitizeForPreview(html: string, keepImages: boolean): string {
  return sanitizeHtml(html, {
    ...baseOptions,
    transformTags: {
      ...baseOptions.transformTags,
      // The card is the link: links inside a thumbnail are shown, not followed
      a: (_tagName, attribs): sanitizeHtml.Tag => ({
        tagName: "span",
        attribs: attribs.class ? { class: attribs.class } : {},
      }),
      iframe: () => placeholder("embed"),
      ...(keepImages ? {} : { img: () => placeholder("image") }),
    },
  });
}

/**
 * Cleans the HTML of a document's opening blocks for its dashboard thumbnail. Inline images are
 * replaced by placeholders when they would make the thumbnail too large; returns null when even
 * that is too large.
 */
export function sanitizePreviewHtml(html: string): string | null {
  const withImages = sanitizeForPreview(html, true);
  if (withImages.length <= PREVIEW_MAX_LENGTH) return withImages;
  const withoutImages = sanitizeForPreview(html, false);
  return withoutImages.length <= PREVIEW_MAX_LENGTH ? withoutImages : null;
}
