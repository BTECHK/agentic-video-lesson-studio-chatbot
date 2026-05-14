import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, parseCliOverrides, type IngestConfig, type CliOverrides } from './ingest/config';
import { scrapeVendorSources } from './ingest/scraper';
import { extractFromHtml, sanitizeExtracted, DEFAULT_EXTRACTION_MAPS } from './ingest/extractor';
import { diffToolData, applyDiff } from './ingest/differ';
import { createVendorPR } from './ingest/pr-workflow';
import { log, rotateLogs, printSummary } from './ingest/logger';
import { generateExtractionPrompt, writePendingPrompt } from './ingest/llm-extract';

// --- Types ---

export interface VendorResult {
  vendor: string;
  status: 'success' | 'skipped' | 'error';
  prUrl?: string;
  error?: string;
}

export interface IngestResult {
  mode: string;
  vendorsProcessed: number;
  changesFound: number;
  prsCreated: number;
  errors: number;
  results: VendorResult[];
}

// --- Helpers ---

function getSourcesDir(): string {
  return join(import.meta.dirname!, '..', 'content', 'sources');
}

function getToolsDir(): string {
  return join(import.meta.dirname!, '..', 'content', 'tools');
}

function getEnabledVendors(config: IngestConfig, vendorFilter?: string): string[] {
  const vendors = Object.entries(config.vendors)
    .filter(([, v]) => v.enabled)
    .map(([id]) => id);

  if (vendorFilter) {
    return vendors.filter((v) => v === vendorFilter);
  }
  return vendors;
}

function getToolIdsForVendor(vendor: string): string[] {
  const toolsDir = getToolsDir();
  const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
  const ids: string[] = [];

  for (const file of toolFiles) {
    try {
      const data = JSON.parse(readFileSync(join(toolsDir, file), 'utf-8'));
      if (data.vendor?.toLowerCase() === vendor.toLowerCase()) {
        ids.push(data.id);
      }
    } catch {
      // Skip malformed tool files
    }
  }

  return ids;
}

// --- Scrape + diff + PR pipeline for a single vendor ---

async function processVendor(
  vendorId: string,
  config: IngestConfig,
  dryRun: boolean,
): Promise<{ result: VendorResult; changesFound: boolean; prCreated: boolean }> {
  const sourcesDir = getSourcesDir();
  const sourceFile = join(sourcesDir, `${vendorId}.json`);

  try {
    // 1. Scrape all active sources for this vendor
    const scrapeResults = await scrapeVendorSources(vendorId, sourceFile, config);
    printSummary(scrapeResults);

    log({ event: 'scrape_complete', vendor: vendorId, results: scrapeResults.length });

    // 2. Extract structured data from successful scrapes
    const successfulScrapes = scrapeResults.filter((r) => r.status === 'success' && r.data);
    if (successfulScrapes.length === 0) {
      return {
        result: { vendor: vendorId, status: 'skipped', error: 'no successful scrapes' },
        changesFound: false,
        prCreated: false,
      };
    }

    // 3. Extract and sanitize HTML content
    const extractionMap = DEFAULT_EXTRACTION_MAPS.changelog;
    const extractedData: Record<string, string> = {};
    for (const scrape of successfulScrapes) {
      const raw = extractFromHtml(scrape.data!, extractionMap);
      const clean = sanitizeExtracted(raw);
      Object.assign(extractedData, clean);
    }

    // 4. Diff against existing tool files for this vendor
    const toolIds = getToolIdsForVendor(vendorId);
    let hasChanges = false;
    const changedFiles: string[] = [];

    for (const toolId of toolIds) {
      const diff = diffToolData(toolId, extractedData as Record<string, unknown>);
      if (diff.hasChanges) {
        hasChanges = true;
        const applied = applyDiff(toolId, extractedData as Record<string, unknown>, dryRun);
        if (applied.applied) {
          changedFiles.push(join('content', 'tools', `${toolId}.json`));
        }
        log({ event: 'diff_applied', vendor: vendorId, toolId, changedFields: diff.changedFields, dryRun });
      }
    }

    // 5. Create PR if changes found and not dry-run
    let prUrl: string | undefined;
    if (hasChanges && !dryRun && changedFiles.length > 0) {
      try {
        const prResult = createVendorPR(vendorId, changedFiles);
        prUrl = prResult.prUrl;
        log({ event: 'pr_created', vendor: vendorId, prUrl, branch: prResult.branch });
      } catch (err) {
        log({ event: 'pr_failed', vendor: vendorId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return {
      result: { vendor: vendorId, status: 'success', prUrl },
      changesFound: hasChanges,
      prCreated: !!prUrl,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    log({ event: 'vendor_error', vendor: vendorId, error });
    return {
      result: { vendor: vendorId, status: 'error', error },
      changesFound: false,
      prCreated: false,
    };
  }
}

// --- Main orchestrator ---

export async function runIngest(
  mode: string,
  config: IngestConfig,
  overrides: CliOverrides,
): Promise<IngestResult> {
  const result: IngestResult = {
    mode,
    vendorsProcessed: 0,
    changesFound: 0,
    prsCreated: 0,
    errors: 0,
    results: [],
  };

  const dryRun = overrides.dryRun ?? false;

  switch (mode) {
    case 'poll': {
      // All enabled vendors — full pipeline
      const vendors = getEnabledVendors(config);
      console.log(`[ingest] Poll mode: processing ${vendors.length} vendors${dryRun ? ' (dry-run)' : ''}`);

      for (const vendor of vendors) {
        const { result: vendorResult, changesFound, prCreated } = await processVendor(vendor, config, dryRun);
        result.results.push(vendorResult);
        result.vendorsProcessed++;
        if (changesFound) result.changesFound++;
        if (prCreated) result.prsCreated++;
        if (vendorResult.status === 'error') result.errors++;
      }
      break;
    }

    case 'search': {
      // Single vendor filtered by --vendor flag
      if (!overrides.vendor) {
        console.error('[ingest] Search mode requires --vendor flag');
        result.errors++;
        return result;
      }

      const vendors = getEnabledVendors(config, overrides.vendor);
      if (vendors.length === 0) {
        console.error(`[ingest] Vendor "${overrides.vendor}" not found or not enabled`);
        result.errors++;
        return result;
      }

      console.log(`[ingest] Search mode: processing vendor "${overrides.vendor}"${dryRun ? ' (dry-run)' : ''}`);

      for (const vendor of vendors) {
        const { result: vendorResult, changesFound, prCreated } = await processVendor(vendor, config, dryRun);
        result.results.push(vendorResult);
        result.vendorsProcessed++;
        if (changesFound) result.changesFound++;
        if (prCreated) result.prsCreated++;
        if (vendorResult.status === 'error') result.errors++;
      }
      break;
    }

    case 'scheduled': {
      // Same as poll but: traditional scraper only (NO LLM — Pitfall 6), rotate logs first
      console.log(`[ingest] Scheduled mode: rotating logs and processing all vendors${dryRun ? ' (dry-run)' : ''}`);
      const deleted = rotateLogs();
      if (deleted > 0) {
        console.log(`[ingest] Rotated ${deleted} old log files`);
      }

      const vendors = getEnabledVendors(config);
      for (const vendor of vendors) {
        // Scheduled mode uses processVendor which is traditional scraper only — no LLM extraction
        const { result: vendorResult, changesFound, prCreated } = await processVendor(vendor, config, dryRun);
        result.results.push(vendorResult);
        result.vendorsProcessed++;
        if (changesFound) result.changesFound++;
        if (prCreated) result.prsCreated++;
        if (vendorResult.status === 'error') result.errors++;
      }
      break;
    }

    case 'llm-extract': {
      // Generate LLM extraction prompts for --vendor (Claude Code passthrough)
      if (!overrides.vendor) {
        console.error('[ingest] LLM-extract mode requires --vendor flag');
        result.errors++;
        return result;
      }

      console.log(`[ingest] LLM-extract mode: generating prompts for "${overrides.vendor}"`);

      const toolIds = getToolIdsForVendor(overrides.vendor);
      if (toolIds.length === 0) {
        console.error(`[ingest] No tools found for vendor "${overrides.vendor}"`);
        result.errors++;
        return result;
      }

      // Load source file to get URLs
      const sourcesDir = getSourcesDir();
      const sourceFile = join(sourcesDir, `${overrides.vendor}.json`);
      let sourceUrls: Array<{ id: string; url: string }> = [];
      try {
        const raw = JSON.parse(readFileSync(sourceFile, 'utf-8'));
        sourceUrls = raw.sources ?? [];
      } catch {
        console.error(`[ingest] Cannot read source file for "${overrides.vendor}"`);
        result.errors++;
        return result;
      }

      for (const toolId of toolIds) {
        const toolsDir = getToolsDir();
        const toolData = JSON.parse(readFileSync(join(toolsDir, `${toolId}.json`), 'utf-8'));
        const url = sourceUrls[0]?.url ?? '';
        const prompt = generateExtractionPrompt(url, toolId, toolData);
        const filePath = writePendingPrompt(toolId, prompt);
        console.log(`[ingest] Wrote prompt: ${filePath}`);

        result.results.push({ vendor: overrides.vendor, status: 'success' });
        result.vendorsProcessed++;
      }
      break;
    }

    default:
      console.error(`[ingest] Unknown mode: "${mode}". Use: poll, search, scheduled, llm-extract`);
      result.errors++;
  }

  log({ event: 'ingest_complete', mode, ...result });
  return result;
}

// --- CLI entry point ---

function parseMode(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && i + 1 < args.length) {
      return args[i + 1];
    }
  }
  return 'poll'; // default mode
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/')) ||
    process.argv[1]?.endsWith('ingest.ts')) {
  const args = process.argv.slice(2);
  const mode = parseMode(args);
  const overrides = parseCliOverrides(args);
  const config = loadConfig(overrides);

  runIngest(mode, config, overrides)
    .then((result) => {
      console.log(`\n[ingest] Done: ${result.vendorsProcessed} vendors, ${result.changesFound} changes, ${result.prsCreated} PRs, ${result.errors} errors`);
      if (result.errors > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('[ingest] Fatal error:', err);
      process.exit(1);
    });
}
