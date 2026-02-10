# EmblemAI Setup Guide

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Terminal** with 256-color support (iTerm2, Kitty, Windows Terminal, or any xterm-compatible terminal)
- **Optional**: [glow](https://github.com/charmbracelet/glow) for rich markdown rendering (`brew install glow` on macOS)
- **Optional**: [tmux](https://github.com/tmux/tmux) for multi-pane layouts (`brew install tmux` on macOS)

## Installation

### From npm (recommended)

```bash
npm install -g @emblemvault/agentwallet
```

### From source

```bash
git clone https://github.com/EmblemCompany/EmblemAi-AgentWallet.git
cd EmblemAi-AgentWallet
npm install
npm run build
cd publish/scripts/emblem-enhanced
npm install
```

Building from the monorepo root (`npm run build`) compiles all 6 plugin packages. The TUI dynamically imports them at runtime.

## Authentication

EmblemAI uses password-based deterministic wallet authentication via `@emblemvault/auth-sdk`. **Login and signup are the same action** -- the first use of a password creates a vault, and subsequent uses of the same password return the same vault.

### Password requirements

- Minimum 16 characters
- No recovery if lost (treat it like a private key)
- Different passwords produce completely different wallets and identities

### Authentication modes

| Method | How to use |
|--------|-----------|
| CLI argument | `emblemai -p "your-password-16-chars-min"` |
| Environment variable | `export EMBLEM_PASSWORD="your-password-16-chars-min"` |
| Credential file | Save password to `~/.emblem-vault` (plaintext, chmod 600 recommended) |
| Interactive prompt | Run `emblemai` without `-p` and enter password when prompted (masked input) |

Priority order: CLI argument > environment variable (`EMBLEM_PASSWORD` or `AGENT_PASSWORD`) > credential file (`~/.emblem-vault`) > interactive prompt.

### What happens on authentication

1. Password is sent to `EmblemAuthSDK.authenticatePassword()`
2. A deterministic vault is derived -- same password always yields the same vault
3. The session provides wallet addresses across 7 chains: Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin
4. `HustleIncognitoClient` is initialized with the session for AI-powered operations
5. All 5 protocol plugins are loaded and registered with the client

## Plugins Loaded at Startup

EmblemAI loads 5 protocol plugins automatically:

| Plugin | Package | What it does |
|--------|---------|-------------|
| Bankr | `@hustle/plugin-bankr` | AI crypto trading (10 modes, multi-chain) |
| A2A | `@hustle/plugin-a2a` | Google Agent-to-Agent protocol (v0.3.0) |
| ACP | `@hustle/plugin-acp` | Virtuals Agent Commerce Protocol |
| ElizaOS | `@hustle/plugin-elizaos` | ElizaOS agent framework integration |
| Bridge | `@hustle/plugin-bridge` | Cross-protocol message routing |

Plugins load silently -- if a package isn't available, it's skipped without error. Use `/plugins` to see which loaded.

## Running Modes

### Interactive TUI mode (default)

Full blessed-based terminal UI with panels, navigation, and auto-refresh.

```bash
emblemai -p "your-password"
# or just:
emblemai
```

### Simple mode

Lightweight readline-based interface without the blessed TUI. Useful for minimal terminals or piping.

```bash
emblemai --simple -p "your-password"
```

### Agent mode

Single-shot queries for programmatic use by AI agents or scripts. Sends one message, prints the response, and exits.

```bash
emblemai --agent -p "your-password" -m "What are my wallet addresses?"
emblemai --agent -p "your-password" -m "Show all my balances across all chains"
emblemai --agent -p "your-password" -m "Swap $20 worth of SOL to USDC"
```

Agent mode requires both `-p` (password) and `-m` (message). Output is plain text suitable for parsing.

## Command-Line Flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--password <pw>` | `-p` | Authentication password (16+ chars) |
| `--message <msg>` | `-m` | Message for agent mode |
| `--agent` | `-a` | Run in agent mode (single-shot) |
| `--simple` | | Use simple readline mode instead of TUI |
| `--reset` | | Clear conversation history and exit |
| `--debug` | | Start with debug mode enabled |
| `--stream` | | Start with streaming enabled (default: on) |
| `--hustle-url <url>` | | Override Hustle API URL |
| `--auth-url <url>` | | Override auth service URL |
| `--api-url <url>` | | Override API service URL |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EMBLEM_PASSWORD` | Authentication password |
| `AGENT_PASSWORD` | Alternative password variable |
| `HUSTLE_API_URL` | Override Hustle API endpoint |
| `EMBLEM_AUTH_URL` | Override auth service endpoint |
| `EMBLEM_API_URL` | Override API service endpoint |
| `BANKR_API_KEY` | Bankr trading API key (for bankr plugin) |

Environment variables are overridden by CLI arguments when both are provided.

## First Run

1. Install the package: `npm install -g @emblemvault/agentwallet`
2. Run: `emblemai`
3. Enter a password (16+ characters) -- this creates your wallet
4. The TUI loads with your session and wallet addresses
5. Check `/plugins` to see which protocol plugins loaded
6. Type a message in the input bar or use `/help` to see commands
7. Try: "What are my wallet addresses?" to verify authentication

## Conversation History

Chat history is persisted to `~/.emblemai-history.json` between sessions. Use `/reset` to clear it, or `--reset` from the command line.

## Supported Chains

Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin

## Building from Source

```bash
# Build all plugin packages (from monorepo root)
npm run build

# Build a specific plugin
npx tsc --build packages/hustle-plugin-bankr/tsconfig.json

# Run all tests (1143 tests across 45 files)
npx vitest run

# Clean all dist/ folders
npm run clean
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Password must be at least 16 characters" | Use a longer password |
| "Authentication failed" | Check network connectivity to auth service |
| Blank/corrupted TUI | Ensure terminal supports 256 colors; try `--simple` mode |
| glow not rendering | Install glow: `brew install glow` (optional, falls back to plain text) |
| tmux layout broken | Ensure tmux >= 3.0; see [TMUX.md](./TMUX.md) |
| Plugin not loading | Run `npm run build` from monorepo root, then restart emblemai |
| Stale plugin behavior after code change | Rebuild with `npm run build` and restart the process (Node caches modules) |
