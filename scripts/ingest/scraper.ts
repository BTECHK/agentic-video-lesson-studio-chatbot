import robotsParser from 'robots-parser';
import pLimit from 'p-limit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IngestConfig } from './config';

// --- Types ---

export interface ScrapeResult {
  sourceId: string;
  url: string;
  status: 'success' | 'skipped' | 'error';
  data?: string;
  error?: string;
  timestamp: string;
}

// --- robots.txt compliance ---

export async function canScrape(
  url: string,
  userAgent: string,
): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', url).href;
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': userAgent },
    });

    if (!response.ok) {
      // No robots.txt or error fetching — fail-open (allow scraping)
      return true;
    }

    const robotsTxt = await response.text();
    const robots = robotsParser(robotsUrl, robotsTxt);
    return robots.isAllowed(url, userAgent) ?? true;
  } catch {
    // Network error, timeout, etc. — fail-open
    return true;
  }
}

// --- Single URL scraper ---

export async function scrapeUrl(
  url: string,
  options: { userAgent: string; timeoutMs: number },
): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(options.timeoutMs),
    headers: { 'User-Agent': options.userAgent },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.text();
}

// --- Vendor source scraper ---

export async function scrapeVendorSources(
  vendorId: string,
  sourceFile: string,
  config: IngestConfig,
): Promise<ScrapeResult[]> {
  const vendorConfig = config.vendors[vendorId];
  if (!vendorConfig || !vendorConfig.enabled) {
    return [];
  }

  // Load source file
  const raw = JSON.parse(readFileSync(sourceFile, 'utf-8'));
  const sources: Array<{ id: string; url: string; title: string }> =
    raw.sources ?? [];

  const { concurrency, timeoutMs, delayMs, userAgent } = config.defaults;
  const limit = pLimit(concurrency);

  const results: ScrapeResult[] = [];

  const tasks = sources.map((source) =>
    limit(async () => {
      const timestamp = new Date().toISOString();

      // Check per-source config — skip reference-only sources
      const sourceConfig = vendorConfig.sources[source.id];
      if (sourceConfig?.scrapeMode === 'reference-only') {
        const result: ScrapeResult = {
          sourceId: source.id,
          url: source.url,
          status: 'skipped',
          error: 'reference-only source',
          timestamp,
        };
        results.push(result);
        return;
      }

      // Check robots.txt
      const allowed = await canScrape(source.url, userAgent);
      if (!allowed) {
        const result: ScrapeResult = {
          sourceId: source.id,
          url: source.url,
          status: 'skipped',
          error: 'blocked by robots.txt',
          timestamp,
        };
        results.push(result);
        return;
      }

      // Scrape with skip-and-log on errors (D-04)
      try {
        const html = await scrapeUrl(source.url, { userAgent, timeoutMs });
        results.push({
          sourceId: source.id,
          url: source.url,
          status: 'success',
          data: html,
          timestamp,
        });
      } catch (err) {
        results.push({
          sourceId: source.id,
          url: source.url,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
          timestamp,
        });
      }

      // Polite delay between requests
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }),
  );

  await Promise.all(tasks);
  return results;
}
