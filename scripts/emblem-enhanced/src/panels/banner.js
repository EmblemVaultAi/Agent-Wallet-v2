/**
 * Banner Panel — ASCII intro splash and persistent status bar.
 * No animated repainting — only updates when status actually changes.
 */

import blessed from 'blessed';

// ── ASCII Art ────────────────────────────────────────────────────────────────

export const ASCII_BANNER = `
{bold}{cyan-fg}
 EMBLEM AI
 Agent Command & Control - God Mode
{/}
{gray-fg}            Powered by Hustle Incognito{/}
`.trim();

// Internal state
let _bannerBaseContent = '';
let _activityLabel = null;

/**
 * Show the ASCII splash overlay for a brief duration, then remove it.
 * @param {object} screen - blessed screen
 * @param {object} bannerBox - the persistent banner bar (1-line)
 * @param {number} durationMs - how long to show the splash (default 2000)
 * @returns {Promise<void>}
 */
export function showBanner(screen, bannerBox, durationMs = 2000) {
  return new Promise((resolve) => {
    const overlay = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: 50,
      height: 8,
      tags: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'cyan' },
        bg: 'black',
      },
      content: ASCII_BANNER,
      align: 'center',
      valign: 'middle',
    });

    screen.render();

    setTimeout(() => {
      overlay.detach();
      screen.render();
      resolve();
    }, durationMs);
  });
}

/**
 * Set the persistent status bar content.
 * @param {object} bannerBox - the 1-line banner box
 */
export function createStatusBar(bannerBox) {
  const content = '{bold}{cyan-fg} EMBLEM AI{/} {white-fg}- Agent Command & Control{/}  {gray-fg}|{/}  {gray-fg}Initializing...{/}';
  _bannerBaseContent = content;
  _activityLabel = null;
  bannerBox.setContent(content);
  bannerBox.screen.render();
}

/**
 * Update the status bar with current session info.
 * @param {object} bannerBox
 * @param {object} info
 */
export function updateStatus(bannerBox, info = {}) {
  const parts = ['{bold}{cyan-fg} EMBLEM AI{/}'];

  if (info.model) {
    parts.push(`{white-fg}[${info.model}]{/}`);
  }

  if (info.vaultId) {
    parts.push(`{gray-fg}vault:${info.vaultId}{/}`);
  }

  if (info.streaming !== undefined) {
    const streamLabel = info.streaming ? '{green-fg}STREAM{/}' : '{gray-fg}stream{/}';
    parts.push(streamLabel);
  }

  if (info.pluginCount !== undefined) {
    parts.push(`{cyan-fg}${info.pluginCount} plugins{/}`);
  }

  _bannerBaseContent = parts.join('  {gray-fg}|{/}  ');
  // Re-apply activity label if active
  _rebuildBanner(bannerBox);
}

/**
 * Show a static activity label in the banner (no animation/repainting).
 * @param {object} bannerBox
 * @param {string} label - e.g. "Streaming" or "Processing"
 */
export function showBannerActivity(bannerBox, label = 'Streaming') {
  _activityLabel = label;
  _rebuildBanner(bannerBox);
}

/**
 * Remove the activity label from the banner.
 * @param {object} bannerBox
 */
export function stopBannerActivity(bannerBox) {
  if (_activityLabel) {
    _activityLabel = null;
    _rebuildBanner(bannerBox);
  }
}

/**
 * Rebuild the banner content from base + optional activity label.
 */
function _rebuildBanner(bannerBox) {
  if (_activityLabel) {
    bannerBox.setContent(
      `${_bannerBaseContent}  {gray-fg}|{/}  {magenta-fg}{bold}${_activityLabel}{/}`
    );
  } else {
    bannerBox.setContent(_bannerBaseContent);
  }
  bannerBox.screen.render();
}
