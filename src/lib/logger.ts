/**
 * Shared structured logger + error-handling harness for the lesson pipeline.
 *
 * Every call produces a structured JSON record (for machine-readable logs under
 * logs/pipeline/) AND a colored human line on the console. Stages adopt it via
 * `runMain`, which wraps a script's main() so any thrown error is logged
 * structurally and turned into a clean exit code instead of an opaque stack.
 *
 * The ingest pipeline keeps its own scrape-specific logger (scripts/ingest/
 * logger.ts); this module covers the generate-script → render lesson stages.
 */
import { mkdirSync, appendFileSync, statSync, renameSync } from 'node:fs';
import { join } from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  ts: string;
  level: LogLevel;
  channel: string;
  msg: string;
  [key: string]: unknown;
}

export interface LoggerSink {
  /** Persist the structured record (e.g. append a JSON line). */
  record(rec: LogRecord): void;
  /** Emit a human-readable line for the console. */
  print(level: LogLevel, line: string): void;
}

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// --- ANSI ---
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const COLOR: Record<LogLevel, string> = {
  debug: '\x1b[2m', // dim
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};

export function serializeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { name: 'NonError', message: String(err) };
}

export function formatConsoleLine(rec: LogRecord): string {
  const tag = `${COLOR[rec.level]}${rec.level.toUpperCase().padEnd(5)}${RESET}`;
  const extras = Object.entries(rec)
    .filter(([k]) => !['ts', 'level', 'channel', 'msg'].includes(k))
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
  const suffix = extras.length ? ` ${DIM}${extras.join(' ')}${RESET}` : '';
  return `${tag} ${DIM}[${rec.channel}]${RESET} ${rec.msg}${suffix}`;
}

export interface ConsoleStreams {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
}

/** A sink that only prints to the console, routing warn/error to stderr. */
export function consoleSink(streams?: Partial<ConsoleStreams>): LoggerSink {
  const stdout = streams?.stdout ?? ((l: string) => process.stdout.write(l + '\n'));
  const stderr = streams?.stderr ?? ((l: string) => process.stderr.write(l + '\n'));
  return {
    record: () => {},
    print: (level, line) => {
      if (level === 'warn' || level === 'error') stderr(line);
      else stdout(line);
    },
  };
}

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/** A sink that appends JSON lines to logs/pipeline/<channel>-YYYY-MM-DD.jsonl with size rotation. */
export function fileSink(channel: string): LoggerSink {
  const dir = join(process.cwd(), 'logs', 'pipeline');
  return {
    record: (rec) => {
      mkdirSync(dir, { recursive: true });
      const path = join(dir, `${channel}-${rec.ts.slice(0, 10)}.jsonl`);
      try {
        if (statSync(path).size >= MAX_LOG_SIZE_BYTES) {
          renameSync(path, path.replace('.jsonl', `-${Date.now()}.jsonl`));
        }
      } catch {
        // file does not exist yet — fine
      }
      appendFileSync(path, JSON.stringify(rec) + '\n', 'utf-8');
    },
    print: () => {},
  };
}

/** Compose multiple sinks into one. */
export function multiSink(...sinks: LoggerSink[]): LoggerSink {
  return {
    record: (rec) => sinks.forEach((s) => s.record(rec)),
    print: (level, line) => sinks.forEach((s) => s.print(level, line)),
  };
}

export interface LoggerOptions {
  channel: string;
  sink?: LoggerSink;
  now?: () => Date;
  minLevel?: LogLevel;
}

export function createLogger(opts: LoggerOptions): Logger {
  const sink = opts.sink ?? multiSink(fileSink(opts.channel), consoleSink());
  const now = opts.now ?? (() => new Date());
  const minLevel = opts.minLevel ?? 'info';

  const emit = (level: LogLevel, msg: string, fields?: Record<string, unknown>) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const extras = fields ? { ...fields } : {};
    if ('err' in extras) extras.err = serializeError(extras.err);
    const rec: LogRecord = { ts: now().toISOString(), level, channel: opts.channel, msg, ...extras };
    sink.record(rec);
    sink.print(level, formatConsoleLine(rec));
  };

  return {
    debug: (msg, fields) => emit('debug', msg, fields),
    info: (msg, fields) => emit('info', msg, fields),
    warn: (msg, fields) => emit('warn', msg, fields),
    error: (msg, fields) => emit('error', msg, fields),
  };
}

/** Build the standard pipeline logger for a stage (file + console). */
export function pipelineLogger(channel: string): Logger {
  const minLevel: LogLevel = process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info';
  return createLogger({ channel, minLevel });
}

export interface RunMainOptions {
  logger?: Logger;
  exit?: (code: number) => void;
}

/**
 * Run a pipeline stage's main(), standardizing error handling: a returned
 * numeric code becomes the process exit code; any thrown error is logged
 * structurally and exits 1.
 */
export async function runMain(
  channel: string,
  fn: (log: Logger) => number | Promise<number>,
  opts: RunMainOptions = {},
): Promise<void> {
  const log = opts.logger ?? pipelineLogger(channel);
  const exit = opts.exit ?? ((code: number) => process.exit(code));
  try {
    const code = await fn(log);
    exit(code);
  } catch (err) {
    log.error('unhandled error', { err });
    exit(1);
  }
}
