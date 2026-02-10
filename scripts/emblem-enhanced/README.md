# @emblemvault/agentwallet

CLI for **Agent Hustle** — EmblemVault's autonomous crypto AI with 256+ trading tools across 7 blockchains. Features a full terminal UI with fixed panels, plugin system, god mode, and multi-protocol agent support.

## Install

```bash
npm install -g @emblemvault/agentwallet
```

## Quick Start

```bash
# TUI Mode (default) — full terminal UI with panels
emblemai -p "your-password-16-chars-min"

# Simple Mode — classic readline interactive
emblemai --simple -p "your-password-16-chars-min"

# Agent Mode — single query, stdout output, exit
emblemai --agent -p "your-password-16-chars-min" -m "What are my balances?"

# Prompt for password interactively
emblemai
```

## Operating Modes

### TUI Mode (Default)

Full blessed-based terminal UI with fixed panels:

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚡ EMBLEM AI — Agent Command & Control    [model] [vault]      │
├──────────────┬───────────────────────────────────────────────────┤
│ ▶ Plugins    │                                                   │
│   ☑ bankr    │  [AI] Here are your balances...                   │
│   ☑ a2a      │                                                   │
│   ☐ elizaos  │  [tool] wallet_get_balance                        │
│              │                                                   │
│ ▶ Wallet     │                                                   │
│   EVM: 0x74..│                                                   │
│   SOL: So11..│                                                   │
│              │                                                   │
│ ▶ Status     │                                                   │
│   Stream: ON │                                                   │
├──────────────┼───────────────────────────────────────────────────┤
│ [INFO] Ready │ You: ___________________________________          │
└──────────────┴───────────────────────────────────────────────────┘
```

Features:
- Streaming AI responses with inline tool call display
- Sidebar with live plugin status, wallet addresses, and settings
- Event log panel for tool calls and system events
- Auto-refreshing wallet info (every 30s)
- ASCII splash screen on startup
- Mouse support, scrollable panels, Tab to cycle focus

```bash
emblemai -p "your-password"
```

### Simple Mode

Classic readline-based interactive mode (same as v1). Use when blessed isn't available or you prefer a plain terminal:

```bash
emblemai --simple -p "your-password"
```

### Agent Mode

Single-shot queries for scripts and AI agent integrations. Outputs the response to stdout and exits:

```bash
emblemai --agent -p "your-password" -m "Show my balances"
emblemai -a -p "your-password" -m "Swap \$20 of SOL to USDC"
```

### Reset Conversation

```bash
emblemai --reset
```

## CLI Flags

| Flag | Description |
|------|-------------|
| `-p`, `--password <pw>` | EmblemVault password (min 16 chars) |
| `-m`, `--message <msg>` | Message to send (agent mode) |
| `-a`, `--agent` | Agent mode (single message, exit) |
| `--simple` | Simple readline mode (no TUI) |
| `--debug` | Enable debug output |
| `--stream` | Toggle streaming (default: on) |
| `--reset` | Clear conversation history |
| `--hustle-url <url>` | Override Hustle API endpoint |
| `--auth-url <url>` | Override auth endpoint |
| `--api-url <url>` | Override API endpoint |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EMBLEM_PASSWORD` | Password (alternative to `-p`) |
| `AGENT_PASSWORD` | Password (alternative to `-p`) |
| `HUSTLE_API_URL` | Hustle API endpoint override |
| `EMBLEM_AUTH_URL` | Auth endpoint override |
| `EMBLEM_API_URL` | API endpoint override |

Password is also read from `~/.emblem-vault` if the file exists.

## Interactive Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/plugins` | List all plugins with status |
| `/plugin <name> on\|off` | Toggle a plugin |
| `/god` | Toggle god mode (JS executor, plugin builder) |
| `/tools` | List available tools |
| `/tools add\|remove <id>` | Manage tool selection |
| `/tools clear` | Enable auto-tools mode |
| `/auth` | Authentication info / menu |
| `/wallet` | Show wallet addresses |
| `/portfolio` | Show portfolio across chains |
| `/settings` | Show current settings |
| `/model <id>` | Set AI model (or `clear` to reset) |
| `/stream on\|off` | Toggle streaming |
| `/debug on\|off` | Toggle debug mode |
| `/history on\|off` | Toggle history retention |
| `/payment` | PAYG billing status |
| `/payment enable\|disable` | Toggle PAYG billing |
| `/payment token <T>` | Set payment token |
| `/payment mode <M>` | Set payment mode |
| `/tmux [preset]` | Split tmux panes (default, trading, debug) |
| `/glow on\|off` | Toggle glow markdown rendering |
| `/reset` | Clear conversation |
| `/exit` | Exit |

**Keyboard shortcuts (TUI mode):** Tab (cycle focus), Ctrl+C (exit), mouse scroll in panels.

## Plugins

Five protocol plugins are dynamically loaded if available:

| Plugin | Description |
|--------|-------------|
| `@hustle/plugin-bankr` | AI-powered crypto trading (buy/sell/swap, portfolio, NFTs, leverage, automation) |
| `@hustle/plugin-a2a` | Google A2A protocol (agent discovery, messaging, task management) |
| `@hustle/plugin-acp` | Virtuals ACP protocol (marketplace, jobs, autonomous agent mode) |
| `@hustle/plugin-elizaos` | ElizaOS framework (actions, providers, memory, runtime) |
| `@hustle/plugin-bridge` | Cross-protocol router (route messages across A2A/ACP/ElizaOS) |

Plus **god mode** (`/god`) which adds:
- **JS Executor** — run arbitrary Node.js code
- **Plugin Builder** — create and install custom plugins at runtime
- **Terminal Capture** — save screen state to file

See [docs/PLUGINS.md](docs/PLUGINS.md) for detailed tool lists and usage.

## Optional Integrations

### Glow (Markdown Rendering)

Install [glow](https://github.com/charmbracelet/glow) for rich markdown rendering in AI responses:

```bash
# macOS
brew install glow

# Linux
sudo snap install glow
```

Toggle with `/glow on|off`.

### tmux (Multi-Pane Layouts)

Run inside tmux for additional panes:

```bash
tmux new -s emblem
emblemai -p "your-password"
# Then use /tmux to split panes
```

Presets: `default` (2 panes), `trading` (3 panes), `debug` (3 panes), `monitor` (4 panes).

See [docs/TMUX.md](docs/TMUX.md) for details.

## Example Queries

```bash
# Check wallet addresses
emblemai --agent -p "$PASSWORD" -m "What are my wallet addresses?"

# Check balances
emblemai --agent -p "$PASSWORD" -m "Show all my balances across all chains"

# Swap tokens
emblemai --agent -p "$PASSWORD" -m "Swap \$20 worth of SOL to USDC"

# Market trends
emblemai --agent -p "$PASSWORD" -m "What's trending on Solana right now?"

# Deploy a token
emblemai --agent -p "$PASSWORD" -m "Deploy a token called MYTOKEN on Base"
```

## Authentication

**Login and signup are the same action.**

| Scenario | What Happens |
|----------|--------------|
| First time with a password | Creates a new vault with unique addresses |
| Same password again | Returns the same vault (deterministic) |
| Different password | Creates a completely different vault |

- Password must be 16+ characters
- No recovery if lost (treat it like a private key)

## Supported Chains

Solana, Ethereum, Base, BSC, Polygon, Hedera, Bitcoin

## Documentation

- [Setup Guide](docs/SETUP.md) — installation, first run, auth modes
- [Plugins](docs/PLUGINS.md) — all plugins with tool tables and examples
- [Commands](docs/COMMANDS.md) — full command reference
- [God Mode](docs/GOD-MODE.md) — JS executor, plugin builder, advanced usage
- [tmux](docs/TMUX.md) — multi-pane layout guide

## Links

- [EmblemVault](https://emblemvault.dev)
- [Hustle AI](https://agenthustle.ai)
- [GitHub](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
