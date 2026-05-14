import * as cheerio from 'cheerio';

// --- Types ---

export interface SelectorConfig {
  selector: string;
  value: 'text' | 'attr';
  attr?: string;
}

export interface ExtractionMap {
  [key: string]: string | SelectorConfig;
}

// --- Default extraction maps for common page types ---

export const DEFAULT_EXTRACTION_MAPS: Record<string, ExtractionMap> = {
  changelog: {
    title: 'h1',
    entries: '.changelog-entry, .release-note, article h2',
    dates: '.changelog-entry time, .release-note time, article time',
    descriptions: '.changelog-entry p, .release-note p, article p',
  },
  features: {
    title: 'h1',
    sections: 'h2',
    descriptions: 'h2 + p, h2 + div p',
    highlights: '.feature, .highlight, .card-title, [class*="feature"]',
  },
  pricing: {
    title: 'h1',
    tiers: '.pricing-tier h3, .plan-name, [class*="plan"] h3',
    prices: '.price, .amount, [class*="price"]',
    features: '.pricing-feature, .plan-feature li, [class*="feature"] li',
  },
};

// --- Core extraction ---

export function extractFromHtml(
  html: string,
  extractionMap: ExtractionMap,
): Record<string, string> {
  const $ = cheerio.load(html);
  const result: Record<string, string> = {};

  for (const [key, config] of Object.entries(extractionMap)) {
    if (typeof config === 'string') {
      // Simple selector — extract text (NEVER .html(), T-04-01)
      const elements = $(config);
      const texts: string[] = [];
      elements.each((_, el) => {
        const text = $(el).text().trim();
        if (text) texts.push(text);
      });
      result[key] = texts.join('\n');
    } else {
      // SelectorConfig object
      const elements = $(config.selector);
      const values: string[] = [];
      elements.each((_, el) => {
        let value: string;
        if (config.value === 'attr' && config.attr) {
          value = $(el).attr(config.attr) ?? '';
        } else {
          // Always use .text() for safety (T-04-01)
          value = $(el).text();
        }
        const trimmed = value.trim();
        if (trimmed) values.push(trimmed);
      });
      result[key] = values.join('\n');
    }
  }

  return result;
}

// --- Sanitization (defense-in-depth, T-04-01) ---

const HTML_TAG_PATTERN = /<[^>]*>/g;

export function sanitizeExtracted(
  data: Record<string, string>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(HTML_TAG_PATTERN, '').trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
