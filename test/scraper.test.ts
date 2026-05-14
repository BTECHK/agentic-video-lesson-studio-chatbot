import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canScrape, scrapeUrl } from '../scripts/ingest/scraper';
import { extractFromHtml, sanitizeExtracted } from '../scripts/ingest/extractor';

// --- Helpers ---

function mockFetchResponse(body: string, init?: ResponseInit): Response {
  return new Response(body, init);
}

// --- canScrape tests ---

describe('canScrape', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when robots.txt allows the URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse('User-agent: *\nAllow: /', { status: 200 }),
      ),
    );

    const result = await canScrape('https://example.com/page', 'edu-bot');
    expect(result).toBe(true);
  });

  it('returns true on network error (fail-open)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const result = await canScrape('https://example.com/page', 'edu-bot');
    expect(result).toBe(true);
  });

  it('returns false when robots.txt disallows the URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse('User-agent: *\nDisallow: /', { status: 200 }),
      ),
    );

    const result = await canScrape('https://example.com/page', 'edu-bot');
    expect(result).toBe(false);
  });

  it('returns true when robots.txt returns 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse('Not Found', { status: 404 }),
      ),
    );

    const result = await canScrape('https://example.com/page', 'edu-bot');
    expect(result).toBe(true);
  });
});

// --- scrapeUrl tests ---

describe('scrapeUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns HTML on successful response', async () => {
    const html = '<html><body>Hello</body></html>';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockFetchResponse(html, { status: 200 })),
    );

    const result = await scrapeUrl('https://example.com', {
      userAgent: 'edu-bot',
      timeoutMs: 5000,
    });
    expect(result).toBe(html);
  });

  it('throws on HTTP 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse('Forbidden', { status: 403 }),
      ),
    );

    await expect(
      scrapeUrl('https://example.com', {
        userAgent: 'edu-bot',
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('HTTP 403');
  });

  it('throws on HTTP 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse('Server Error', { status: 500 }),
      ),
    );

    await expect(
      scrapeUrl('https://example.com', {
        userAgent: 'edu-bot',
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('HTTP 500');
  });
});

// --- extractFromHtml tests ---

describe('extractFromHtml', () => {
  it('extracts text from CSS selectors', () => {
    const html = `
      <html>
        <body>
          <h1>Page Title</h1>
          <p class="desc">Description here</p>
          <ul><li>Item 1</li><li>Item 2</li></ul>
        </body>
      </html>
    `;

    const result = extractFromHtml(html, {
      title: 'h1',
      description: '.desc',
      items: 'li',
    });

    expect(result.title).toBe('Page Title');
    expect(result.description).toBe('Description here');
    expect(result.items).toContain('Item 1');
    expect(result.items).toContain('Item 2');
  });

  it('strips HTML tags from extracted text (T-04-01)', () => {
    const html = `
      <html>
        <body>
          <div class="content">
            <p>Hello <strong>world</strong> and <em>universe</em></p>
          </div>
        </body>
      </html>
    `;

    const result = extractFromHtml(html, { content: '.content p' });
    // cheerio .text() returns text without HTML tags
    expect(result.content).not.toContain('<strong>');
    expect(result.content).not.toContain('<em>');
    expect(result.content).toContain('Hello');
    expect(result.content).toContain('world');
  });

  it('handles SelectorConfig with attr value', () => {
    const html = '<a href="https://example.com" class="link">Click</a>';

    const result = extractFromHtml(html, {
      url: { selector: '.link', value: 'attr', attr: 'href' },
    });

    expect(result.url).toBe('https://example.com');
  });

  it('returns empty string for non-matching selectors', () => {
    const html = '<html><body><p>Text</p></body></html>';

    const result = extractFromHtml(html, { missing: '.nonexistent' });
    expect(result.missing).toBe('');
  });
});

// --- sanitizeExtracted tests ---

describe('sanitizeExtracted', () => {
  it('removes script tags from string values', () => {
    const data = {
      content: 'Hello <script>alert("xss")</script> World',
    };

    const result = sanitizeExtracted(data);
    expect(result.content).not.toContain('<script>');
    expect(result.content).not.toContain('</script>');
    expect(result.content).toContain('Hello');
    expect(result.content).toContain('World');
  });

  it('trims whitespace from values', () => {
    const data = { title: '  Hello World  ' };

    const result = sanitizeExtracted(data);
    expect(result.title).toBe('Hello World');
  });

  it('removes all HTML tags from values', () => {
    const data = {
      html: '<div><p>Text</p><br/><img src="x"/></div>',
    };

    const result = sanitizeExtracted(data);
    expect(result.html).not.toContain('<');
    expect(result.html).not.toContain('>');
    expect(result.html).toContain('Text');
  });

  it('handles empty strings', () => {
    const data = { empty: '' };
    const result = sanitizeExtracted(data);
    expect(result.empty).toBe('');
  });
});
