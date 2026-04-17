import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { WHMCSConfig } from './types.js';

const McpConfigSchema = z.object({
  whmcs: z.object({
    identifier: z
      .string()
      .trim()
      .min(1, 'whmcs.identifier cannot be empty')
      .optional(),
    secret: z
      .string()
      .trim()
      .min(1, 'whmcs.secret cannot be empty')
      .optional(),
    username: z
      .string()
      .trim()
      .min(1, 'whmcs.username cannot be empty')
      .optional(),
    password: z
      .string()
      .min(1, 'whmcs.password cannot be empty')
      .optional(),
    apiUrl: z
      .string({ required_error: 'whmcs.apiUrl is required' })
      .trim()
      .url('whmcs.apiUrl must be a valid URL'),
  }).superRefine((whmcs, ctx) => {
    const hasApiCredentials = Boolean(whmcs.identifier && whmcs.secret);
    const hasAdminCredentials = Boolean(whmcs.username && whmcs.password);

    if (!hasApiCredentials && !hasAdminCredentials) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Provide either whmcs.identifier and whmcs.secret, or whmcs.username and whmcs.password',
        path: ['identifier'],
      });
    }

    if (Boolean(whmcs.identifier) !== Boolean(whmcs.secret)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'whmcs.identifier and whmcs.secret must be provided together',
        path: ['identifier'],
      });
    }

    if (Boolean(whmcs.username) !== Boolean(whmcs.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'whmcs.username and whmcs.password must be provided together',
        path: ['username'],
      });
    }
  }),
});

type McpConfig = z.infer<typeof McpConfigSchema>;

function getCliConfigPath(args: string[]): string | undefined {
  const configIndex = args.indexOf('--config');
  if (configIndex === -1) {
    return undefined;
  }

  const configPath = args[configIndex + 1];
  if (!configPath || configPath.startsWith('--')) {
    throw new Error('Missing value for --config. Usage: node build/index.js --config /path/to/mcp.json');
  }

  return configPath;
}

function getCandidateConfigPaths(args: string[]): string[] {
  const cliConfigPath = getCliConfigPath(args);
  if (cliConfigPath) {
    return [isAbsolute(cliConfigPath) ? cliConfigPath : resolve(process.cwd(), cliConfigPath)];
  }

  const currentDirConfig = resolve(process.cwd(), 'mcp.json');
  const sourceDir = dirname(fileURLToPath(import.meta.url));
  const projectRootConfig = resolve(sourceDir, '..', 'mcp.json');

  return [...new Set([currentDirConfig, projectRootConfig])];
}

function formatZodIssues(error: z.ZodError<McpConfig>): string {
  return error.errors
    .map((issue) => `${issue.path.join('.') || 'mcp.json'}: ${issue.message}`)
    .join('; ');
}

export function loadWHMCSConfig(args = process.argv.slice(2)): WHMCSConfig {
  const candidatePaths = getCandidateConfigPaths(args);
  const configPath = candidatePaths.find((path) => existsSync(path));

  if (!configPath) {
    throw new Error(
      [
        'mcp.json not found.',
        `Looked in: ${candidatePaths.join(', ')}`,
        'Create it from mcp.example.json and fill either API credentials or admin credentials plus whmcs.apiUrl.',
        'You can also pass a custom path with --config /path/to/mcp.json.',
      ].join(' ')
    );
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${configPath}: ${message}`);
  }

  const parsedConfig = McpConfigSchema.safeParse(rawConfig);
  if (!parsedConfig.success) {
    throw new Error(`Invalid configuration in ${configPath}: ${formatZodIssues(parsedConfig.error)}`);
  }

  return parsedConfig.data.whmcs;
}
