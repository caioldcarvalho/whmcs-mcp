import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { WHMCSConfig } from './types.js';

const WhmcsConfigSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    secret: z.string().trim().min(1).optional(),
    username: z.string().trim().min(1).optional(),
    password: z.string().min(1).optional(),
    apiUrl: z.string().trim().url('apiUrl must be a valid URL'),
  })
  .superRefine((cfg, ctx) => {
    const hasApi = Boolean(cfg.identifier && cfg.secret);
    const hasAdmin = Boolean(cfg.username && cfg.password);

    if (!hasApi && !hasAdmin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Provide either identifier+secret or username+password',
      });
    }
    if (Boolean(cfg.identifier) !== Boolean(cfg.secret)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'identifier and secret must be provided together',
      });
    }
    if (Boolean(cfg.username) !== Boolean(cfg.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'username and password must be provided together',
      });
    }
  });

const McpFileSchema = z.object({ whmcs: WhmcsConfigSchema });

// --- env vars (standard MCP pattern) ---

function loadFromEnv(): WHMCSConfig | undefined {
  const apiUrl = process.env.WHMCS_API_URL;
  if (!apiUrl) return undefined;

  const identifier = process.env.WHMCS_IDENTIFIER;
  const secret = process.env.WHMCS_SECRET;
  const username = process.env.WHMCS_USERNAME;
  const password = process.env.WHMCS_PASSWORD;

  const raw = { apiUrl, identifier, secret, username, password };
  const result = WhmcsConfigSchema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.errors.map((e) => e.message).join('; ');
    throw new Error(`Invalid WHMCS env vars: ${messages}`);
  }
  return result.data;
}

// --- mcp.json file ---

function getCliConfigPath(args: string[]): string | undefined {
  const idx = args.indexOf('--config');
  if (idx === -1) return undefined;
  const val = args[idx + 1];
  if (!val || val.startsWith('--')) {
    throw new Error(
      'Missing value for --config. Usage: node build/index.js --config /path/to/mcp.json',
    );
  }
  return val;
}

function getCandidatePaths(args: string[]): string[] {
  const cli = getCliConfigPath(args);
  if (cli) {
    return [isAbsolute(cli) ? cli : resolve(process.cwd(), cli)];
  }
  const cwd = resolve(process.cwd(), 'mcp.json');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'mcp.json');
  return [...new Set([cwd, root])];
}

function loadFromFile(args: string[]): WHMCSConfig | undefined {
  const candidates = getCandidatePaths(args);
  const found = candidates.find((p) => existsSync(p));
  if (!found) return undefined;

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(found, 'utf8'));
  } catch (err) {
    throw new Error(
      `Invalid JSON in ${found}: ${err instanceof Error ? err.message : err}`,
    );
  }

  const result = McpFileSchema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    throw new Error(`Invalid config in ${found}: ${messages}`);
  }
  return result.data.whmcs;
}

// --- public API ---

export function loadWHMCSConfig(args = process.argv.slice(2)): WHMCSConfig {
  // 1. env vars (standard MCP "env" block)
  const fromEnv = loadFromEnv();
  if (fromEnv) return fromEnv;

  // 2. mcp.json file (--config or default locations)
  const fromFile = loadFromFile(args);
  if (fromFile) return fromFile;

  throw new Error(
    [
      'No WHMCS credentials found.',
      'Set WHMCS_API_URL + WHMCS_IDENTIFIER/WHMCS_SECRET (or WHMCS_USERNAME/WHMCS_PASSWORD) as env vars,',
      'or create a mcp.json file (see mcp.example.json).',
    ].join(' '),
  );
}
