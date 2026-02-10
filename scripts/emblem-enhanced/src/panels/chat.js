/**
 * Chat Panel — message display with streaming support
 * and blessed-native markdown rendering.
 *
 * Glow is NOT used here — glow outputs ANSI escape codes designed for
 * plain terminals. Blessed uses its own {tag} system. Mixing them causes
 * screen artifacts. Instead we convert markdown -> blessed tags directly.
 *
 * No animated repainting — content only renders when it actually changes
 * (new message, new streaming chunk, etc.).
 */

// Left padding applied to every line in the chat
const PAD = ' ';

// Module-level state for streaming accumulation
let streamingBuffer = '';
let isStreaming = false;
let chatLines = [];

const ROLE_LABELS = {
  user: 'You',
  assistant: 'AI',
  tool: 'Tool',
  error: 'Error',
  system: 'System',
};

/**
 * Initialize the chat panel.
 * @param {object} chatBox - blessed box
 */
export function initChat(chatBox) {
  chatLines = [];
  streamingBuffer = '';
  isStreaming = false;
  chatBox.setContent('');
  chatBox.screen.render();
}

/**
 * Show a static thinking indicator (no animation/repainting).
 * @param {object} chatBox
 */
export function startThinking(chatBox) {
  stopThinking(chatBox);
  chatLines.push(`${PAD}{magenta-fg}{bold}[AI]{/} {magenta-fg}Thinking...{/}`);
  renderChat(chatBox);
}

/**
 * Remove the thinking indicator.
 * @param {object} chatBox
 */
export function stopThinking(chatBox) {
  if (chatLines.length > 0 && chatLines[chatLines.length - 1].includes('Thinking...')) {
    chatLines.pop();
    renderChat(chatBox);
  }
}

/**
 * Append a complete message to the chat.
 * @param {object} chatBox
 * @param {'user'|'assistant'|'tool'|'error'|'system'} role
 * @param {string} content
 */
export function appendMessage(chatBox, role, content) {
  if (isStreaming) {
    finishStreaming(chatBox);
  }

  const label = ROLE_LABELS[role] || role;

  if (role === 'assistant') {
    const rendered = markdownToBlessed(String(content));
    const lines = rendered.split('\n');
    chatLines.push(`${PAD}{white-fg}{bold}[${label}]{/} ${lines[0]}`);
    for (let i = 1; i < lines.length; i++) {
      chatLines.push(`${PAD}  ${lines[i]}`);
    }
  } else if (role === 'user') {
    const lines = String(content).split('\n');
    chatLines.push(`${PAD}{cyan-fg}{bold}[${label}]{/} {cyan-fg}${escapeTags(lines[0])}{/}`);
    for (let i = 1; i < lines.length; i++) {
      chatLines.push(`${PAD}  {cyan-fg}${escapeTags(lines[i])}{/}`);
    }
  } else if (role === 'error') {
    const lines = String(content).split('\n');
    chatLines.push(`${PAD}{red-fg}{bold}[${label}]{/} {red-fg}${escapeTags(lines[0])}{/}`);
    for (let i = 1; i < lines.length; i++) {
      chatLines.push(`${PAD}  {red-fg}${escapeTags(lines[i])}{/}`);
    }
  } else {
    const tag = role === 'tool' ? '{yellow-fg}' : '{gray-fg}';
    const lines = String(content).split('\n');
    chatLines.push(`${PAD}${tag}[${label}]{/} ${tag}${escapeTags(lines[0])}{/}`);
    for (let i = 1; i < lines.length; i++) {
      chatLines.push(`${PAD}  ${tag}${escapeTags(lines[i])}{/}`);
    }
  }

  chatLines.push('');
  renderChat(chatBox);
}

/**
 * Append streaming text to the current in-progress message.
 * @param {object} chatBox
 * @param {string} text - incremental text chunk
 */
export function appendStreaming(chatBox, text) {
  if (!isStreaming) {
    stopThinking(chatBox);
    isStreaming = true;
    streamingBuffer = '';
    chatLines.push(`${PAD}{white-fg}{bold}[AI]{/} `);
  }

  streamingBuffer += text;
  rebuildStreamingLines(chatBox);
}

/**
 * Finish the current streaming message.
 * @param {object} chatBox
 */
export function finishStreaming(chatBox) {
  if (!isStreaming) return;

  isStreaming = false;
  rebuildStreamingLines(chatBox);

  streamingBuffer = '';
  chatLines.push('');
  renderChat(chatBox);
}

/**
 * Show a tool call in the chat log.
 * @param {object} chatBox
 * @param {string} name - tool name
 * @param {object} [args] - tool arguments (displayed truncated)
 */
export function showToolCall(chatBox, name, args) {
  let line = `${PAD}{yellow-fg}  > {bold}${escapeTags(name)}{/}`;

  if (args && typeof args === 'object') {
    const keys = Object.keys(args).slice(0, 3);
    if (keys.length > 0) {
      const preview = keys.map((k) => {
        let v = args[k];
        if (typeof v === 'string' && v.length > 24) v = v.slice(0, 21) + '...';
        else if (typeof v === 'object') v = Array.isArray(v) ? `[${v.length}]` : '{...}';
        return `${k}=${v}`;
      }).join(', ');
      line += ` {gray-fg}${escapeTags(preview)}{/}`;
    }
  }

  chatLines.push(line);
  renderChat(chatBox);
}

/**
 * Clear all chat content.
 * @param {object} chatBox
 */
export function clearChat(chatBox) {
  chatLines = [];
  streamingBuffer = '';
  isStreaming = false;
  chatBox.setContent('');
  chatBox.screen.render();
}

// ── Streaming Rebuild ────────────────────────────────────────────────────────

/**
 * Rebuild the streaming content lines from the buffer.
 */
function rebuildStreamingLines(chatBox) {
  // Remove old streaming content lines back to the header
  while (chatLines.length > 0) {
    const last = chatLines[chatLines.length - 1];
    if (last.includes('{white-fg}{bold}[AI]{/}')) break;
    chatLines.pop();
  }

  const rendered = markdownToBlessed(streamingBuffer);
  const lines = rendered.split('\n');

  // First line goes on the header line
  chatLines[chatLines.length - 1] = `${PAD}{white-fg}{bold}[AI]{/} ${lines[0]}`;
  // Remaining lines get padding
  for (let i = 1; i < lines.length; i++) {
    chatLines.push(`${PAD}  ${lines[i]}`);
  }

  renderChat(chatBox);
}

// ── Markdown -> Blessed Tags ─────────────────────────────────────────────────

/**
 * Convert markdown text to blessed-tagged text.
 * Handles: headers, bold, italic, code, lists, horizontal rules, tables.
 * Uses only ASCII characters to avoid Unicode rendering issues in tmux.
 * @param {string} md
 * @returns {string}
 */
function markdownToBlessed(md) {
  const lines = String(md).split('\n');
  const result = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks (``` fences)
    if (/^(`{3,}|~{3,})/.test(line)) {
      inCodeBlock = !inCodeBlock;
      result.push('{gray-fg}--------{/}');
      continue;
    }

    if (inCodeBlock) {
      result.push(`{green-fg}  ${escapeTags(line)}{/}`);
      continue;
    }

    // Horizontal rules
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      result.push('{gray-fg}--------------------{/}');
      continue;
    }

    // Headers
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      result.push(`{cyan-fg}{bold}${escapeTags(h1[1])}{/}`);
      continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      result.push(`{cyan-fg}{bold}> ${escapeTags(h2[1])}{/}`);
      continue;
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      result.push(`{white-fg}{bold}  ${escapeTags(h3[1])}{/}`);
      continue;
    }
    const h4plus = line.match(/^#{4,} (.+)/);
    if (h4plus) {
      result.push(`{white-fg}  ${escapeTags(h4plus[1])}{/}`);
      continue;
    }

    // Unordered list items
    const ul = line.match(/^(\s*)[*\-+] (.+)/);
    if (ul) {
      const indent = ul[1];
      const content = renderInline(ul[2]);
      result.push(`${indent}  * ${content}`);
      continue;
    }

    // Ordered list items
    const ol = line.match(/^(\s*)\d+\. (.+)/);
    if (ol) {
      const indent = ol[1];
      const num = line.match(/^(\s*)(\d+)\./)[2];
      const content = renderInline(ol[2]);
      result.push(`${indent}  ${num}. ${content}`);
      continue;
    }

    // Table rows (pipe-delimited) — render as simple text
    if (line.includes('|') && line.trim().startsWith('|')) {
      // Separator row — skip
      if (/^\|[\s\-:]+\|/.test(line.trim())) {
        continue;
      }
      // Data row
      const cells = line.split('|').filter(c => c.trim() !== '');
      const rendered = cells.map(c => renderInline(c.trim())).join('  ');
      result.push(`  ${rendered}`);
      continue;
    }

    // Blockquote
    const bq = line.match(/^>\s?(.*)/);
    if (bq) {
      result.push(`{gray-fg}  | ${escapeTags(bq[1])}{/}`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      result.push('');
      continue;
    }

    // Regular paragraph
    result.push(renderInline(line));
  }

  return result.join('\n');
}

/**
 * Render inline markdown: **bold**, *italic*, `code`, ~~strikethrough~~
 *
 * Strategy: escape all braces FIRST (so user content like {obj} is safe),
 * then replace markdown patterns. The replacements insert blessed tags
 * with real braces that won't be double-escaped.
 *
 * @param {string} text
 * @returns {string}
 */
function renderInline(text) {
  // 1. Extract code spans before escaping
  const codeParts = [];
  let s = text.replace(/`([^`]+)`/g, (_m, code) => {
    const idx = codeParts.length;
    codeParts.push(`{green-fg}${escapeTags(code)}{/}`);
    return `\x00C${idx}\x00`;
  });

  // 2. Escape all braces
  s = escapeTags(s);

  // 3. Replace markdown patterns
  s = s.replace(/\*{3}(.+?)\*{3}/g, '{bold}{cyan-fg}$1{/}');
  s = s.replace(/\*{2}(.+?)\*{2}/g, '{bold}{white-fg}$1{/}');
  s = s.replace(/\*(.+?)\*/g, '{white-fg}$1{/}');
  s = s.replace(/~~(.+?)~~/g, '{gray-fg}$1{/}');

  // 4. Restore code spans
  for (let i = 0; i < codeParts.length; i++) {
    s = s.replace(`\x00C${i}\x00`, codeParts[i]);
  }

  return `{white-fg}${s}{/}`;
}

// ── Internals ───────────────────────────────────────────────────────────────

/**
 * Render accumulated chat lines into the box and scroll to bottom.
 */
function renderChat(chatBox) {
  chatBox.setContent(chatLines.join('\n'));
  chatBox.setScrollPerc(100);
  chatBox.screen.render();
}

/**
 * Escape blessed tag characters in content.
 */
function escapeTags(str) {
  return String(str).replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}
