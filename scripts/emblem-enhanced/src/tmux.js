/**
 * Optional tmux Integration
 * Provides session detection, pane splitting, and output routing for multi-pane layouts.
 * ESM module — requires Node.js >= 18.
 */

import { execFileSync } from 'child_process';

/**
 * Run a tmux command with arguments using execFileSync (no shell interpolation).
 * @param {string[]} args
 * @returns {string}
 */
function tmux(args) {
  return execFileSync('tmux', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Check whether we are running inside a tmux session.
 * @returns {boolean}
 */
export function detectTmux() {
  return !!process.env.TMUX;
}

/**
 * Get info about the current tmux environment.
 * @returns {{ active: boolean, session?: string, window?: string, pane?: string }}
 */
export function getTmuxInfo() {
  if (!detectTmux()) {
    return { active: false };
  }

  try {
    const session = tmux(['display-message', '-p', '#S']);
    const window = tmux(['display-message', '-p', '#W']);
    const pane = tmux(['display-message', '-p', '#P']);
    return { active: true, session, window, pane };
  } catch {
    return { active: true };
  }
}

// ---------------------------------------------------------------------------
// Layout Presets
// ---------------------------------------------------------------------------

/**
 * Apply a named split-pane layout.
 *
 * Presets:
 *   default  — 70/30 horizontal split (main | event log)
 *   trading  — 3-pane: main + portfolio sidebar + bottom status
 *   debug    — 3-pane: main + debug log + network log
 *   monitor  — 4-pane: main + logs + status + portfolio
 *
 * @param {'default' | 'trading' | 'debug' | 'monitor'} preset
 * @returns {{ success: boolean, preset?: string, panes?: number, message?: string }}
 */
export function splitLayout(preset = 'default') {
  if (!detectTmux()) {
    return { success: false, message: 'Not running inside tmux' };
  }

  try {
    switch (preset) {
      case 'default':
        // Right pane (30%) for event log
        tmux(['split-window', '-h', '-p', '30', '-d']);
        tmux(['select-pane', '-L']);
        return { success: true, preset, panes: 2 };

      case 'trading':
        // Right pane (35%) for portfolio
        tmux(['split-window', '-h', '-p', '35', '-d']);
        // Bottom-left pane (20%) for status bar
        tmux(['split-window', '-v', '-p', '20', '-d']);
        tmux(['select-pane', '-t', '0']);
        return { success: true, preset, panes: 3 };

      case 'debug':
        // Right pane (40%) for debug log
        tmux(['split-window', '-h', '-p', '40', '-d']);
        // Bottom-right pane (50%) for network log
        tmux(['select-pane', '-R']);
        tmux(['split-window', '-v', '-p', '50', '-d']);
        tmux(['select-pane', '-t', '0']);
        return { success: true, preset, panes: 3 };

      case 'monitor':
        // Right pane (35%) for portfolio
        tmux(['split-window', '-h', '-p', '35', '-d']);
        // Bottom-left (25%) for status
        tmux(['split-window', '-v', '-p', '25', '-d']);
        // Bottom-right (50%) for logs
        tmux(['select-pane', '-R']);
        tmux(['split-window', '-v', '-p', '50', '-d']);
        tmux(['select-pane', '-t', '0']);
        return { success: true, preset, panes: 4 };

      default:
        return { success: false, message: `Unknown layout preset: ${preset}. Available: default, trading, debug, monitor` };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ---------------------------------------------------------------------------
// Pane Communication
// ---------------------------------------------------------------------------

/**
 * Send text to a specific tmux pane by index.
 * @param {number} paneIndex - Target pane (0-based)
 * @param {string} text - Text to send
 * @returns {{ success: boolean, message?: string }}
 */
export function sendToPane(paneIndex, text) {
  if (!detectTmux()) {
    return { success: false, message: 'Not running inside tmux' };
  }

  try {
    const target = String(paneIndex);
    // Clear current input line in the target pane
    tmux(['send-keys', '-t', target, '', 'C-u']);
    // Send text literally (no key interpretation)
    tmux(['send-keys', '-t', target, '-l', text]);
    tmux(['send-keys', '-t', target, 'Enter']);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Update the content of a pane (clear + write).
 * Useful for dashboard-style panes that refresh periodically.
 * @param {number} paneIndex - Target pane (0-based)
 * @param {string} content - Content to display
 * @returns {{ success: boolean, message?: string }}
 */
export function updatePane(paneIndex, content) {
  if (!detectTmux()) {
    return { success: false, message: 'Not running inside tmux' };
  }

  try {
    const target = String(paneIndex);
    tmux(['send-keys', '-t', target, '-l', 'clear']);
    tmux(['send-keys', '-t', target, 'Enter']);
    const lines = content.split('\n');
    for (const line of lines) {
      tmux(['send-keys', '-t', target, '-l', 'echo ' + line]);
      tmux(['send-keys', '-t', target, 'Enter']);
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Close all panes except the main one (pane 0).
 * @returns {{ success: boolean, message?: string }}
 */
export function closeExtraPanes() {
  if (!detectTmux()) {
    return { success: false, message: 'Not running inside tmux' };
  }

  try {
    const output = tmux(['list-panes', '-F', '#{pane_index}']);
    const indices = output.split('\n').map(Number).filter(n => !isNaN(n));
    // Kill panes from highest index down to 1 (keep pane 0)
    for (let i = indices.length - 1; i >= 0; i--) {
      if (indices[i] === 0) continue;
      try { tmux(['kill-pane', '-t', String(indices[i])]); } catch {}
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Set the tmux pane title (requires tmux >= 2.3).
 * @param {number} paneIndex
 * @param {string} title
 * @returns {{ success: boolean, message?: string }}
 */
export function setPaneTitle(paneIndex, title) {
  if (!detectTmux()) {
    return { success: false, message: 'Not running inside tmux' };
  }

  try {
    tmux(['select-pane', '-t', String(paneIndex), '-T', title]);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
