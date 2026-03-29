import { marked, type Tokens } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const SAFE_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeHtmlEntities(text: string): string {
  return text.replace(
    /&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z]+));/g,
    (_match, dec, hex, named) => {
      if (dec) {
        return String.fromCodePoint(parseInt(dec, 10));
      }
      if (hex) {
        return String.fromCodePoint(parseInt(hex, 16));
      }
      switch (named.toLowerCase()) {
        case "colon":
          return ":";
        case "tab":
          return "\t";
        case "newline":
          return "\n";
        case "amp":
          return "&";
        default:
          return _match;
      }
    },
  );
}

function isSafeUri(
  uri: string | null | undefined,
  allowedProtocols: ReadonlySet<string>,
): boolean {
  if (!uri) return false;

  const normalized = decodeHtmlEntities(uri.trim())
    .replace(/[\u0000-\u0020\u007f-\u009f]+/g, "")
    .toLowerCase();

  if (!normalized) return false;

  if (
    normalized.startsWith("#") ||
    normalized.startsWith("/") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../") ||
    normalized.startsWith("?") ||
    normalized.startsWith("//")
  ) {
    return true;
  }

  const schemeMatch = normalized.match(/^([a-z][a-z0-9+.-]*:)/);
  if (!schemeMatch) {
    return true;
  }

  return allowedProtocols.has(schemeMatch[1]);
}

const renderer = new marked.Renderer();
const originalLink = renderer.link.bind(renderer);
const originalImage = renderer.image.bind(renderer);

renderer.html = function ({ text }: Tokens.HTML | Tokens.Tag) {
  return escapeHtml(text);
};

renderer.link = function (token: Tokens.Link) {
  if (!isSafeUri(token.href, SAFE_LINK_PROTOCOLS)) {
    return this.parser.parseInline(token.tokens);
  }

  const html = originalLink(token);
  // Inject target="_blank" and security attrs into every <a> tag
  return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
};

renderer.image = function (token: Tokens.Image) {
  if (!isSafeUri(token.href, SAFE_IMAGE_PROTOCOLS)) {
    return escapeHtml(token.text);
  }

  return originalImage(token);
};

marked.setOptions({ gfm: true, breaks: true, renderer });

// ── LaTeX Rendering ──

/**
 * Extract LaTeX formulas from text, replace them with placeholders,
 * and return a restore function that swaps placeholders back with
 * rendered KaTeX HTML.
 */
function processLatex(text: string): { processed: string; restore: (html: string) => string } {
  const placeholders: { id: string; html: string }[] = [];
  let counter = 0;

  function renderFormula(tex: string, displayMode: boolean): string {
    try {
      return katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        output: "html",
      });
    } catch {
      return displayMode ? `$$${tex}$$` : `$${tex}$`;
    }
  }

  // Replace display math ($$...$$) first — must come before inline
  let result = text.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_match, tex) => {
      const id = `%%LATEX_${counter++}%%`;
      placeholders.push({ id, html: renderFormula(tex.trim(), true) });
      return id;
    },
  );

  // Replace inline math ($...$) — avoid matching currency like $5
  result = result.replace(
    /(?<!\$)\$(?!\$)(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/g,
    (_match, tex) => {
      const id = `%%LATEX_${counter++}%%`;
      placeholders.push({ id, html: renderFormula(tex.trim(), false) });
      return id;
    },
  );

  function restore(html: string): string {
    let restored = html;
    for (const { id, html: rendered } of placeholders) {
      // marked may wrap placeholder in <p> tags, handle both raw and wrapped
      restored = restored.replaceAll(id, rendered);
    }
    return restored;
  }

  return { processed: result, restore };
}

// ── Caching Markdown Rendering ──

const markdownCache = new Map<string, string>();

/** Convert file:// URIs in markdown to proxy URLs */
export function rewriteFileUris(text: string): string {
  const base = import.meta.env.VITE_API_BASE ?? "";
  return text.replace(
    /!\[([^\]]*)\]\((file:\/\/[^)]+)\)/g,
    (_match, alt, uri) =>
      `![${alt}](${base}/api/files?uri=${encodeURIComponent(uri)})`,
  );
}

export function renderMarkdown(text: string): string {
  if (markdownCache.has(text)) {
    return markdownCache.get(text)!;
  }

  const rewritten = rewriteFileUris(text);

  // Extract LaTeX before marked processes the text
  const { processed, restore } = processLatex(rewritten);
  const html = marked.parse(processed, { async: false }) as string;
  const final = restore(html);

  // Cap the cache to prevent unbounded growth
  if (markdownCache.size > 500) {
    const firstKey = markdownCache.keys().next().value!;
    markdownCache.delete(firstKey);
  }

  markdownCache.set(text, final);
  return final;
}

