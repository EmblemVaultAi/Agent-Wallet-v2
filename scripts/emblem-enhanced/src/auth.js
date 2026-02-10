/**
 * auth.js - Authentication flow for emblem-enhanced TUI
 *
 * Extracted from emblemai.js. Handles password retrieval,
 * EmblemAuthSDK authentication, and the interactive auth menu.
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Prompt for a password with hidden input (shows * per character).
 * Falls back to plain text prompt when stdin is not a TTY.
 *
 * @param {string} question - Prompt text to display
 * @returns {Promise<string>} The entered password
 */
export function promptPassword(question) {
  if (process.stdin.isTTY) {
    process.stdout.write(question);
    return new Promise((resolve) => {
      let password = '';
      const onData = (char) => {
        char = char.toString();
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.removeListener('data', onData);
            process.stdin.setRawMode(false);
            process.stdout.write('\n');
            resolve(password);
            break;
          case '\u0003':
            process.stdout.write('\n');
            process.exit();
            break;
          case '\u007F':
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            password += char;
            process.stdout.write('*');
        }
      };
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    });
  }

  // Non-TTY fallback: plain readline prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Read and parse the ~/.emblem-vault credential file.
 *
 * Supports two formats:
 *   - **JSON** (preferred): `{ "password": "...", "bankrApiKey": "...", "secrets": { ... } }`
 *   - **Plain text** (legacy): file contents treated as the password
 *
 * @returns {{ password?: string, bankrApiKey?: string, secrets?: Record<string, { ciphertext: string, dataToEncryptHash: string }> } | null}
 */
export function readCredentialFile() {
  const credFile = path.join(os.homedir(), '.emblem-vault');
  if (!fs.existsSync(credFile)) return null;

  const raw = fs.readFileSync(credFile, 'utf8').trim();
  if (!raw) return null;

  // Try JSON first
  if (raw.startsWith('{')) {
    try {
      return JSON.parse(raw);
    } catch {
      // Malformed JSON — fall through to plain-text
    }
  }

  // Plain text (legacy): migrate to JSON format
  const creds = { password: raw };
  try {
    fs.writeFileSync(credFile, JSON.stringify(creds, null, 2) + '\n', 'utf8');
    fs.chmodSync(credFile, 0o600);
  } catch {
    // Write failed (permissions, read-only fs) — still return the parsed creds
  }
  return creds;
}

/**
 * Merge data into the ~/.emblem-vault credential file and write it back.
 * Creates the file if it doesn't exist. Sets chmod 600.
 *
 * @param {Record<string, unknown>} data - Fields to merge into the credential file
 */
export function writeCredentialFile(data) {
  const credFile = path.join(os.homedir(), '.emblem-vault');
  let existing = {};
  try {
    if (fs.existsSync(credFile)) {
      const raw = fs.readFileSync(credFile, 'utf8').trim();
      if (raw.startsWith('{')) {
        existing = JSON.parse(raw);
      }
    }
  } catch {
    // Start fresh
  }
  const merged = { ...existing, ...data };
  fs.writeFileSync(credFile, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  fs.chmodSync(credFile, 0o600);
}

/**
 * Get password from multiple sources in priority order:
 * 1. args.password (explicit)
 * 2. process.env.EMBLEM_PASSWORD
 * 3. process.env.AGENT_PASSWORD
 * 4. ~/.emblem-vault credential file (JSON or plain text)
 * 5. Interactive prompt (errors in agent mode)
 *
 * @param {{ password?: string, isAgentMode?: boolean }} args
 * @returns {Promise<string>} The resolved password
 */
export async function getPassword(args = {}) {
  // 1. Explicit argument
  if (args.password) return args.password;

  // 2-3. Environment variables
  if (process.env.EMBLEM_PASSWORD) return process.env.EMBLEM_PASSWORD;
  if (process.env.AGENT_PASSWORD) return process.env.AGENT_PASSWORD;

  // 4. Credential file
  const creds = readCredentialFile();
  if (creds?.password) return creds.password;

  // 5. Interactive prompt (or error in agent mode)
  if (args.isAgentMode) {
    throw new Error(
      'Password required in agent mode. Use -p or set EMBLEM_PASSWORD'
    );
  }

  return promptPassword('Enter your EmblemVault password (min 16 chars): ');
}

/**
 * Authenticate with EmblemAuthSDK using a password.
 *
 * @param {string} password - The user's password
 * @param {{ authUrl?: string, apiUrl?: string }} config - Optional SDK config overrides
 * @returns {Promise<{ authSdk: object, session: object }>}
 */
export async function authenticate(password, config = {}) {
  const { EmblemAuthSDK } = await import('@emblemvault/auth-sdk');

  const sdkConfig = {
    appId: 'emblem-agent-wallet',
    persistSession: false,
  };
  if (config.authUrl) sdkConfig.authUrl = config.authUrl;
  if (config.apiUrl) sdkConfig.apiUrl = config.apiUrl;

  const authSdk = new EmblemAuthSDK(sdkConfig);
  const session = await authSdk.authenticatePassword({ password });

  if (!session) {
    throw new Error('Authentication failed');
  }

  return { authSdk, session };
}

/**
 * Interactive authentication menu.
 * Displays options for key/address retrieval, session management, and logout.
 *
 * @param {object} authSdk - Authenticated EmblemAuthSDK instance
 * @param {(question: string) => Promise<string>} promptFn - Function to prompt for user input
 */
export async function authMenu(authSdk, promptFn) {
  console.log('\n========================================');
  console.log('         Authentication Menu');
  console.log('========================================');
  console.log('');
  console.log('  1. Get API Key');
  console.log('  2. Get Vault Info');
  console.log('  3. Session Info');
  console.log('  4. Refresh Session');
  console.log('  5. EVM Address');
  console.log('  6. Solana Address');
  console.log('  7. BTC Addresses');
  console.log('  8. Logout');
  console.log('  9. Back');
  console.log('');

  const choice = await promptFn('Select option (1-9): ');

  switch (choice.trim()) {
    case '1':
      await _getApiKey(authSdk);
      break;
    case '2':
      await _getVaultInfo(authSdk);
      break;
    case '3':
      _showSessionInfo(authSdk);
      break;
    case '4':
      await _refreshSession(authSdk);
      break;
    case '5':
      await _getEvmAddress(authSdk);
      break;
    case '6':
      await _getSolanaAddress(authSdk);
      break;
    case '7':
      await _getBtcAddresses(authSdk);
      break;
    case '8':
      _doLogout(authSdk);
      return; // exit menu after logout
    case '9':
      return;
    default:
      console.log('Invalid option');
  }

  // Recurse back to menu after handling an option
  await authMenu(authSdk, promptFn);
}

// ---- Internal helpers ----

async function _getApiKey(authSdk) {
  console.log('\nFetching API key...');
  try {
    const apiKey = await authSdk.getVaultApiKey();
    console.log('\n========================================');
    console.log('           YOUR API KEY');
    console.log('========================================');
    console.log('');
    console.log(`  ${apiKey}`);
    console.log('');
    console.log('========================================');
    console.log('');
    console.log('IMPORTANT: Store this key securely!');
  } catch (error) {
    console.error('Error fetching API key:', error.message);
  }
}

async function _getVaultInfo(authSdk) {
  console.log('\nFetching vault info...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    console.log('\n========================================');
    console.log('           VAULT INFO');
    console.log('========================================');
    console.log('');
    console.log(`  Vault ID:        ${vaultInfo.vaultId || 'N/A'}`);
    console.log(
      `  Token ID:        ${vaultInfo.tokenId || vaultInfo.vaultId || 'N/A'}`
    );
    console.log(`  EVM Address:     ${vaultInfo.evmAddress || 'N/A'}`);
    console.log(
      `  Solana Address:  ${vaultInfo.solanaAddress || vaultInfo.address || 'N/A'}`
    );
    console.log(`  Hedera Account:  ${vaultInfo.hederaAccountId || 'N/A'}`);
    if (vaultInfo.btcPubkey) {
      console.log(
        `  BTC Pubkey:      ${vaultInfo.btcPubkey.substring(0, 20)}...`
      );
    }
    if (vaultInfo.btcAddresses) {
      console.log('  BTC Addresses:');
      if (vaultInfo.btcAddresses.p2pkh)
        console.log(`    P2PKH:         ${vaultInfo.btcAddresses.p2pkh}`);
      if (vaultInfo.btcAddresses.p2wpkh)
        console.log(`    P2WPKH:        ${vaultInfo.btcAddresses.p2wpkh}`);
      if (vaultInfo.btcAddresses.p2tr)
        console.log(`    P2TR:          ${vaultInfo.btcAddresses.p2tr}`);
    }
    if (vaultInfo.createdAt)
      console.log(`  Created At:      ${vaultInfo.createdAt}`);
    console.log('');
    console.log('========================================');
  } catch (error) {
    console.error('Error fetching vault info:', error.message);
  }
}

function _showSessionInfo(authSdk) {
  const sess = authSdk.getSession();
  console.log('\n========================================');
  console.log('           SESSION INFO');
  console.log('========================================');
  console.log('');
  if (sess) {
    console.log(`  Identifier:   ${sess.user?.identifier || 'N/A'}`);
    console.log(`  Vault ID:     ${sess.user?.vaultId || 'N/A'}`);
    console.log(`  App ID:       ${sess.appId || 'N/A'}`);
    console.log(`  Auth Type:    ${sess.authType || 'N/A'}`);
    console.log(
      `  Expires At:   ${sess.expiresAt ? new Date(sess.expiresAt).toISOString() : 'N/A'}`
    );
    console.log(
      `  Auth Token:   ${sess.authToken ? sess.authToken.substring(0, 20) + '...' : 'N/A'}`
    );
  } else {
    console.log('  No active session');
  }
  console.log('');
  console.log('========================================');
}

async function _refreshSession(authSdk) {
  console.log('\nRefreshing session...');
  try {
    const newSession = await authSdk.refreshSession();
    if (newSession) {
      console.log('Session refreshed successfully!');
      console.log(
        `New expiry: ${new Date(newSession.expiresAt).toISOString()}`
      );
    } else {
      console.log('Failed to refresh session.');
    }
  } catch (error) {
    console.error('Error refreshing session:', error.message);
  }
}

async function _getEvmAddress(authSdk) {
  console.log('\nFetching EVM address...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    if (vaultInfo.evmAddress) {
      console.log('\n========================================');
      console.log('           EVM ADDRESS');
      console.log('========================================');
      console.log('');
      console.log(`  ${vaultInfo.evmAddress}`);
      console.log('');
      console.log('========================================');
    } else {
      console.log('No EVM address available for this vault.');
    }
  } catch (error) {
    console.error('Error fetching EVM address:', error.message);
  }
}

async function _getSolanaAddress(authSdk) {
  console.log('\nFetching Solana address...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    const solanaAddr = vaultInfo.solanaAddress || vaultInfo.address;
    if (solanaAddr) {
      console.log('\n========================================');
      console.log('         SOLANA ADDRESS');
      console.log('========================================');
      console.log('');
      console.log(`  ${solanaAddr}`);
      console.log('');
      console.log('========================================');
    } else {
      console.log('No Solana address available for this vault.');
    }
  } catch (error) {
    console.error('Error fetching Solana address:', error.message);
  }
}

async function _getBtcAddresses(authSdk) {
  console.log('\nFetching BTC addresses...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    if (vaultInfo.btcAddresses || vaultInfo.btcPubkey) {
      console.log('\n========================================');
      console.log('         BTC ADDRESSES');
      console.log('========================================');
      console.log('');
      if (vaultInfo.btcPubkey) {
        console.log(`  Pubkey:  ${vaultInfo.btcPubkey}`);
        console.log('');
      }
      if (vaultInfo.btcAddresses) {
        if (vaultInfo.btcAddresses.p2pkh)
          console.log(
            `  P2PKH (Legacy):     ${vaultInfo.btcAddresses.p2pkh}`
          );
        if (vaultInfo.btcAddresses.p2wpkh)
          console.log(
            `  P2WPKH (SegWit):    ${vaultInfo.btcAddresses.p2wpkh}`
          );
        if (vaultInfo.btcAddresses.p2tr)
          console.log(
            `  P2TR (Taproot):     ${vaultInfo.btcAddresses.p2tr}`
          );
      }
      console.log('');
      console.log('========================================');
    } else {
      console.log('No BTC addresses available for this vault.');
    }
  } catch (error) {
    console.error('Error fetching BTC addresses:', error.message);
  }
}

function _doLogout(authSdk) {
  console.log('\nLogging out...');
  try {
    authSdk.logout();
    console.log('Logged out successfully.');
    console.log('Session cleared.');
  } catch (error) {
    console.error('Error during logout:', error.message);
  }
}

export default { getPassword, authenticate, promptPassword, authMenu, readCredentialFile, writeCredentialFile };
