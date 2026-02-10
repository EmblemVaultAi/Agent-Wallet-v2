# EmblemAI Command Reference

## Slash Commands

All commands are prefixed with `/`. Type them in the input bar and press Enter.

### General

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/settings` | Show current configuration (vault ID, model, streaming, debug, tools) |
| `/exit` | Exit the CLI (also: `/quit`, or type `exit`/`quit` without slash) |

### Chat and History

| Command | Description |
|---------|-------------|
| `/reset` | Clear conversation history and start fresh |
| `/clear` | Alias for `/reset` |
| `/history on` | Enable history retention between messages |
| `/history off` | Disable history retention (stateless mode) |
| `/history` | Show history status and recent messages |

### Streaming and Debug

| Command | Description |
|---------|-------------|
| `/stream on` | Enable streaming mode (tokens appear as generated) |
| `/stream off` | Disable streaming mode (wait for full response) |
| `/stream` | Show current streaming status |
| `/debug on` | Enable debug mode (shows tool args, intent context) |
| `/debug off` | Disable debug mode |
| `/debug` | Show current debug status |

### Model Selection

| Command | Description |
|---------|-------------|
| `/models` | List all available AI models |
| `/model <id>` | Set the active model by ID |
| `/model clear` | Reset to API default model |
| `/model` | Show currently selected model |

### Tool Management

| Command | Description |
|---------|-------------|
| `/tools` | List all tool categories with selection status |
| `/tools add <id>` | Add a tool category to the active set |
| `/tools remove <id>` | Remove a tool category from the active set |
| `/tools clear` | Clear tool selection (enable auto-tools mode) |

When no tools are selected, the AI operates in **auto-tools mode**, dynamically choosing appropriate tools based on conversation context and intent.

### Authentication

| Command | Description |
|---------|-------------|
| `/auth` | Open the authentication menu |

The auth menu provides:

| Option | Description |
|--------|-------------|
| 1. Get API Key | Retrieve your vault's API key |
| 2. Get Vault Info | Show vault ID, addresses, creation date |
| 3. Get Session Info | Show auth token, expiry, app ID |
| 4. Refresh Session | Refresh the authentication session |
| 5. Get EVM Address | Show your Ethereum/EVM address |
| 6. Get Solana Address | Show your Solana address |
| 7. Get BTC Addresses | Show P2PKH, P2WPKH (SegWit), P2TR (Taproot) |
| 8. Logout | Clear session and exit |
| 9. Back to chat | Return to the main interface |

### Payment (PAYG Billing)

| Command | Description |
|---------|-------------|
| `/payment` | Show PAYG billing status (enabled, mode, debt, tokens) |
| `/payment enable` | Enable pay-as-you-go billing |
| `/payment disable` | Disable pay-as-you-go billing |
| `/payment token <TOKEN>` | Set payment token (SOL, ETH, HUSTLE, etc.) |
| `/payment mode <MODE>` | Set payment mode: `pay_per_request` or `debt_accumulation` |

### Plugin Management

| Command | Description |
|---------|-------------|
| `/plugins` | List all plugins and their status (5 protocol + custom) |
| `/plugins enable <name>` | Enable a plugin (bankr, a2a, acp, elizaos, bridge) |
| `/plugins disable <name>` | Disable a plugin |
| `/plugins info <name>` | Show plugin details, version, and tools |

### God Mode

| Command | Description |
|---------|-------------|
| `/god` | Toggle god mode (JS executor + plugin builder) |
| `/capture start` | Start capturing terminal output |
| `/capture stop` | Stop capturing and save to file |
| `/capture status` | Show capture status and file path |

See [GOD-MODE.md](./GOD-MODE.md) for full documentation.

## Keyboard Shortcuts

### TUI Mode

| Key | Action |
|-----|--------|
| `Tab` | Cycle focus between panels (sidebar, chat, input, log) |
| `Enter` | Send message / confirm selection |
| `Ctrl+C` | Exit the application |
| `Escape` | Cancel current operation / close menu |
| `Up/Down` | Scroll through chat history or panel content |
| `Page Up/Page Down` | Fast scroll through content |
| `Home/End` | Jump to top/bottom of scrollable content |

### Input Bar

| Key | Action |
|-----|--------|
| `Enter` | Send the current message |
| `Up` | Recall previous message from input history |
| `Down` | Navigate forward in input history |
| `Ctrl+C` | Clear input / exit |
| `Ctrl+U` | Clear the input line |
| `Backspace` | Delete character before cursor |

### Simple Mode

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Ctrl+C` | Exit |
| `Ctrl+D` | Exit (EOF) |

## Command Examples

### Basic chat

```
You: What are my wallet addresses?
You: Show all my balances across all chains
You: What's the price of ETH right now?
```

### Trading

```
You: Buy $50 worth of SOL on Solana
You: Swap 0.1 ETH to USDC on Base
You: Sell 50% of my PEPE on Ethereum
```

### Tool and model management

```
/tools add bankr
/tools add a2a
/model gpt-4
/stream off
/debug on
```

### Agent interaction (A2A v0.3.0)

```
You: Discover the A2A agent at https://google-a2a-demo.web.app
You: Send "hello" to the agent at https://defi-agent.example.com
You: List all known A2A agents
You: Start an A2A server on port 3000
```

### Agent commerce (ACP / Virtuals)

```
You: Browse ACP marketplace for analytics agents
You: Browse agents that can do trading on acpx.virtuals.io
You: Register as a DeFi agent on the ACP marketplace
You: Start autonomous mode to accept incoming jobs
```

### Cross-protocol (Bridge)

```
You: Discover all agents across all protocols that do portfolio analysis
You: Route a message to any agent that can do swaps
You: Translate this A2A message to ElizaOS format
```

### Session management

```
/reset
/settings
/auth
/payment
```
