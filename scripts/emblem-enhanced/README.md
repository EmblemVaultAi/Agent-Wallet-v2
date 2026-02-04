# @emblemvault/agentwallet

CLI tools for **Agent Hustle** - EmblemVault's autonomous crypto AI with 256+ trading tools across 7 blockchains.

## Install

```bash
npm install -g @emblemvault/agentwallet
```

## Commands

### Interactive Chat (Recommended for Humans)
```bash
# Full interactive CLI with streaming, tools, and auth menu
hustle-chat --password "your-password-16-chars-min"

# Or let it prompt for password
hustle-chat
```

### Single-Shot Commands (For AI Agents)
```bash
# Send a single message to Agent Hustle
emblem-hustle -p "your-password-16-chars-min" -m "What are my wallet addresses?"

# Resume with conversation context
emblem-resume -p "your-password" -m "Follow-up question"

# Reset conversation history
emblem-reset
```

## Example Queries

```bash
# Check wallet addresses
emblem-hustle -p "$PASSWORD" -m "What are my wallet addresses?"

# Check balances
emblem-hustle -p "$PASSWORD" -m "Show all my balances across all chains"

# Swap tokens
emblem-hustle -p "$PASSWORD" -m "Swap $20 worth of SOL to USDC"

# Market trends
emblem-hustle -p "$PASSWORD" -m "What's trending on Solana right now?"
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

## Links

- [EmblemVault](https://emblemvault.dev)
- [Hustle AI](https://agenthustle.ai)
- [OpenClaw Skill](https://github.com/EmblemCompany/EmblemAi-AgentWallet)
