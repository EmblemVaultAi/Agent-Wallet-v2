/**
 * God Mode Plugin
 * Provides execute_javascript, build/install/uninstall plugins, and terminal capture.
 * Adapted from hustle-react god-mode for Node.js runtime.
 * ESM module — requires Node.js >= 18.
 *
 * SECURITY NOTE: This plugin intentionally executes user-authored code at runtime.
 * It is a power-user feature gated behind explicit opt-in (/god-mode command).
 */

import { PLUGIN_NAME_RE } from './loader.js';

/** Tool name regex per HustlePlugin spec */
const TOOL_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

/**
 * Execute arbitrary JavaScript in the Node.js process.
 * Console output is captured and returned alongside the result.
 *
 * This is an intentional god-mode feature — the user explicitly enables it
 * and provides the code to execute. Only user-initiated code runs here.
 *
 * @param {string} code
 * @returns {Promise<{ success: boolean, returnValue?: any, logs: Array<{ type: string, args: any[] }>, error?: string }>}
 */
async function executeJavaScript(code) {
  const logs = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args) => logs.push({ type: 'log', args });
  console.warn = (...args) => logs.push({ type: 'warn', args });
  console.error = (...args) => logs.push({ type: 'error', args });

  try {
    // Wrap in async IIFE so user code can use await and return
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('require', code);

    // Provide a cjs-style require shim for convenience
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);

    const returnValue = await fn(require);
    return { success: true, returnValue, logs };
  } catch (err) {
    return { success: false, error: err.message, logs };
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }
}

/**
 * Compile a serialized executor code string into a function.
 * Used by build_plugin and install_plugin for user-authored tool executors.
 * @param {string} executorCode - String representation of a function expression
 * @returns {Function}
 */
function compileExecutor(executorCode) {
  // indirect eval to compile in global scope
  return (0, eval)('(' + executorCode + ')');
}

/**
 * Build a HustlePlugin definition from user-provided spec.
 * Validates names and structure before returning.
 */
function buildPlugin({ name, version, description, tools }) {
  if (!name || !PLUGIN_NAME_RE.test(name)) {
    return {
      success: false,
      error: `Invalid plugin name "${name}". Must match ${PLUGIN_NAME_RE}.`,
    };
  }

  if (!Array.isArray(tools) || tools.length === 0) {
    return { success: false, error: 'Plugin must have at least one tool.' };
  }

  const validatedTools = [];
  const executors = {};

  for (const tool of tools) {
    if (!tool.name || !TOOL_NAME_RE.test(tool.name)) {
      return {
        success: false,
        error: `Invalid tool name "${tool.name}". Must match ${TOOL_NAME_RE}.`,
      };
    }
    if (!tool.executorCode) {
      return {
        success: false,
        error: `Tool "${tool.name}" is missing executorCode.`,
      };
    }

    // Verify the executor code compiles to a function
    try {
      const fn = compileExecutor(tool.executorCode);
      if (typeof fn !== 'function') {
        return {
          success: false,
          error: `Tool "${tool.name}" executorCode must evaluate to a function.`,
        };
      }
      executors[tool.name] = fn;
    } catch (err) {
      return {
        success: false,
        error: `Tool "${tool.name}" executorCode failed to compile: ${err.message}`,
      };
    }

    validatedTools.push({
      name: tool.name,
      description: tool.description || '',
      parameters: tool.parameters || { type: 'object', properties: {} },
      executorCode: tool.executorCode,
    });
  }

  const plugin = {
    name,
    version: version || '1.0.0',
    description: description || '',
    tools: validatedTools,
    executors,
  };

  return { success: true, plugin };
}

/**
 * Create the god-mode HustlePlugin.
 * @param {{ pluginManager?: import('./loader.js').PluginManager, screen?: object }} config
 * @returns {object} HustlePlugin
 */
export function createGodModePlugin(config = {}) {
  const { pluginManager, screen } = config;

  return {
    name: 'god-mode',
    version: '1.0.0',

    tools: [
      {
        name: 'execute_javascript',
        description: 'Execute JavaScript code in the Node.js process. Has full access to Node APIs (fs, path, net, etc). Console output is captured.',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'JavaScript code to execute. Runs inside an async function body. Use `return` to produce a result.',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'build_plugin',
        description: 'Build a custom HustlePlugin definition. Validates names, structure, and compiles executor code.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Plugin name (lowercase, starts with letter, allows hyphens and digits).',
            },
            version: {
              type: 'string',
              description: 'Semver version string. Defaults to 1.0.0.',
            },
            description: {
              type: 'string',
              description: 'Human-readable description of the plugin.',
            },
            tools: {
              type: 'array',
              description: 'Array of tool definitions.',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Tool name matching /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.' },
                  description: { type: 'string' },
                  parameters: { type: 'object', description: 'JSON Schema for tool parameters.' },
                  executorCode: { type: 'string', description: 'String of a JS function expression, e.g. "(args) => { ... }".' },
                },
                required: ['name', 'executorCode'],
              },
            },
          },
          required: ['name', 'tools'],
        },
      },
      {
        name: 'install_plugin',
        description: 'Install a custom plugin that was built with build_plugin. Registers it with the client and persists to disk.',
        parameters: {
          type: 'object',
          properties: {
            plugin: {
              type: 'object',
              description: 'The plugin object returned by build_plugin.',
            },
          },
          required: ['plugin'],
        },
      },
      {
        name: 'uninstall_plugin',
        description: 'Uninstall a custom plugin by name. Removes it from the client and from disk.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the plugin to uninstall.',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_plugins',
        description: 'List all installed plugins with their status, version, and tool count.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'capture_terminal',
        description: 'Capture the current terminal state. In blessed mode, takes a screenshot to file.',
        parameters: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Output filename. Defaults to terminal-capture-<timestamp>.txt.',
            },
          },
        },
      },
    ],

    executors: {
      async execute_javascript(args) {
        const { code } = args;
        if (!code || typeof code !== 'string') {
          return { success: false, error: 'Missing required parameter: code' };
        }
        return executeJavaScript(code);
      },

      async build_plugin(args) {
        return buildPlugin(args);
      },

      async install_plugin(args) {
        const { plugin } = args;
        if (!plugin || !plugin.name) {
          return { success: false, error: 'Invalid plugin object — missing name.' };
        }
        if (!pluginManager) {
          return { success: false, error: 'Plugin manager not available.' };
        }

        // Reconstitute executors from code strings if needed
        if (!plugin.executors && Array.isArray(plugin.tools)) {
          plugin.executors = {};
          for (const tool of plugin.tools) {
            if (tool.executorCode) {
              try {
                plugin.executors[tool.name] = compileExecutor(tool.executorCode);
              } catch {
                return {
                  success: false,
                  error: `Failed to compile executor for tool "${tool.name}".`,
                };
              }
            }
          }
        }

        await pluginManager.register(plugin);
        pluginManager.saveCustomPlugin({
          name: plugin.name,
          version: plugin.version,
          tools: plugin.tools,
          enabled: true,
        });

        return {
          success: true,
          message: `Plugin "${plugin.name}" installed with ${plugin.tools?.length || 0} tool(s).`,
        };
      },

      async uninstall_plugin(args) {
        const { name } = args;
        if (!name) {
          return { success: false, error: 'Missing required parameter: name' };
        }
        if (!pluginManager) {
          return { success: false, error: 'Plugin manager not available.' };
        }

        await pluginManager.unregister(name);
        pluginManager.removeCustomPlugin(name);

        return {
          success: true,
          message: `Plugin "${name}" uninstalled.`,
        };
      },

      async list_plugins() {
        if (!pluginManager) {
          return { success: false, error: 'Plugin manager not available.' };
        }
        return pluginManager.list();
      },

      async capture_terminal(args) {
        const filename = args.filename || `terminal-capture-${Date.now()}.txt`;

        // If blessed screen is available, dump its content
        if (screen && typeof screen.screenshot === 'function') {
          const { writeFileSync } = await import('fs');
          const content = screen.screenshot();
          writeFileSync(filename, content);
          return {
            success: true,
            path: filename,
            message: `Terminal captured to ${filename}`,
          };
        }

        // Fallback: return terminal info
        return {
          success: true,
          message: 'Terminal capture not available in simple mode.',
          terminal: {
            columns: process.stdout.columns || 80,
            rows: process.stdout.rows || 24,
            colorDepth: process.stdout.getColorDepth?.() || 1,
          },
        };
      },
    },
  };
}
