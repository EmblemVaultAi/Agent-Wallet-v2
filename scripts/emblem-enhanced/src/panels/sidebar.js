/**
 * Sidebar Panel — plugins, wallet addresses, status indicators
 */

// Module-level state
let sidebarState = {
  plugins: [],
  wallet: null,
  status: null,
};

/**
 * Initialize the sidebar.
 * @param {object} sidebarBox - blessed box
 */
export function initSidebar(sidebarBox) {
  sidebarState = { plugins: [], wallet: null, status: null };
  rebuildContent(sidebarBox, sidebarState);
}

/**
 * Update the plugins section.
 * @param {object} sidebarBox
 * @param {Array<{name: string, enabled: boolean}>} plugins
 */
export function updatePlugins(sidebarBox, plugins) {
  sidebarState.plugins = plugins || [];
  rebuildContent(sidebarBox, sidebarState);
}

/**
 * Update the wallet section.
 * @param {object} sidebarBox
 * @param {object} info
 * @param {string} [info.evm] - Full EVM address
 * @param {string} [info.sol] - Full Solana address
 */
export function updateWallet(sidebarBox, info) {
  sidebarState.wallet = info || null;
  rebuildContent(sidebarBox, sidebarState);
}

/**
 * Update the status section.
 * @param {object} sidebarBox
 * @param {object} info
 * @param {boolean} [info.streaming]
 * @param {boolean} [info.autoTools]
 * @param {boolean} [info.payg]
 * @param {string}  [info.model]
 */
export function updateSidebarStatus(sidebarBox, info) {
  sidebarState.status = info || null;
  rebuildContent(sidebarBox, sidebarState);
}

// ── Internal ────────────────────────────────────────────────────────────────

/**
 * Truncate an address for display: first 4 + last 4 chars.
 */
function truncAddr(addr) {
  if (!addr || addr.length < 12) return addr || '---';
  return addr.slice(0, 6) + '..' + addr.slice(-4);
}

/**
 * Rebuild the full sidebar content from state.
 */
function rebuildContent(sidebarBox, state) {
  const sections = [];

  // ── Plugins ──
  sections.push('{cyan-fg}{bold}\u25B6 Plugins{/}');
  if (state.plugins.length === 0) {
    sections.push('  {gray-fg}No plugins loaded{/}');
  } else {
    for (const p of state.plugins) {
      if (p.enabled) {
        sections.push(`  {green-fg}\u2611{/} {white-fg}${esc(p.name)}{/}`);
      } else {
        sections.push(`  {gray-fg}\u2610 ${esc(p.name)}{/}`);
      }
    }
  }
  sections.push('');

  // ── Wallet ──
  sections.push('{cyan-fg}{bold}\u25B6 Wallet{/}');
  if (state.wallet) {
    if (state.wallet.evm) {
      sections.push(`  {white-fg}EVM:{/} {cyan-fg}${truncAddr(state.wallet.evm)}{/}`);
    }
    if (state.wallet.sol) {
      sections.push(`  {white-fg}SOL:{/} {cyan-fg}${truncAddr(state.wallet.sol)}{/}`);
    }
    if (!state.wallet.evm && !state.wallet.sol) {
      sections.push('  {gray-fg}No addresses{/}');
    }
  } else {
    sections.push('  {gray-fg}Not connected{/}');
  }
  sections.push('');

  // ── Status ──
  sections.push('{cyan-fg}{bold}\u25B6 Status{/}');
  if (state.status) {
    const s = state.status;
    if (s.streaming !== undefined) {
      const val = s.streaming ? '{green-fg}ON{/}' : '{gray-fg}OFF{/}';
      sections.push(`  {white-fg}Stream:{/} ${val}`);
    }
    if (s.autoTools !== undefined) {
      const val = s.autoTools ? '{green-fg}ON{/}' : '{gray-fg}OFF{/}';
      sections.push(`  {white-fg}Auto-tools:{/} ${val}`);
    }
    if (s.payg !== undefined) {
      const val = s.payg ? '{green-fg}PAYG{/}' : '{gray-fg}Free{/}';
      sections.push(`  {white-fg}Billing:{/} ${val}`);
    }
    if (s.model) {
      sections.push(`  {white-fg}Model:{/} {cyan-fg}${esc(s.model)}{/}`);
    }
  } else {
    sections.push('  {gray-fg}---{/}');
  }

  sidebarBox.setContent(sections.join('\n'));
  sidebarBox.screen.render();
}

/**
 * Escape blessed tags in dynamic text.
 */
function esc(str) {
  return String(str).replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}
