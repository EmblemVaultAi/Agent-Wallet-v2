/**
 * Event Log Panel — compact event/tool call log
 */

const MAX_ENTRIES = 50;

// Module-level log entries (newest first)
let entries = [];

// Tag map for log types
const TYPE_TAGS = {
  tool: '{yellow-fg}',
  info: '{cyan-fg}',
  error: '{red-fg}',
  debug: '{gray-fg}',
};

/**
 * Initialize the log panel.
 * @param {object} logBox - blessed box
 */
export function initLog(logBox) {
  entries = [];
  logBox.setContent('{gray-fg}Ready{/}');
  logBox.screen.render();
}

/**
 * Add a log entry. Newest entries appear first.
 * @param {object} logBox - blessed box
 * @param {'tool'|'info'|'error'|'debug'} type
 * @param {string} message
 */
export function addLog(logBox, type, message) {
  const tag = TYPE_TAGS[type] || TYPE_TAGS.info;
  const label = type.toUpperCase().padEnd(5);
  const line = `${tag}[${label}]{/} ${tag}${esc(message)}{/}`;

  entries.unshift(line);

  // Trim old entries
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  // Show only the most recent entries that fit (log is small — 1 visible line)
  logBox.setContent(entries.slice(0, 5).join('\n'));
  logBox.setScrollPerc(0);
  logBox.screen.render();
}

/**
 * Escape blessed tags in dynamic text.
 */
function esc(str) {
  return String(str).replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}
