# EmblemAI Plugin Reference

EmblemAI integrates 5 protocol plugins plus a god mode plugin system. Each plugin exposes tools that the AI can use during conversations, or that you can invoke directly.

**Test coverage**: 1143 tests across 45 files, all passing. Includes live protocol tests against production APIs.

---

## 1. Bankr -- AI-Powered Crypto Trading

**Package**: `@hustle/plugin-bankr`
**Tools**: 12
**Description**: Full-featured crypto trading across Base, Ethereum, Polygon, Unichain, and Solana. Includes AI-powered trade execution, portfolio management, transfers, market research, NFTs, prediction markets, leverage trading, automation, token deployment, and raw transaction submission.

### Configuration

```js
createBankrPlugin({
  apiKey: 'your-bankr-api-key',         // X-API-Key header
  walletMode: 'auth-sdk',               // 'bankr' | 'auth-sdk' | 'custom'
  authSdkConfig: { sdk: authSdk },      // For auth-sdk wallet mode
  debug: false,
})
```

**Wallet modes**:
- `bankr` -- Server-side wallet managed by Bankr (default)
- `auth-sdk` -- Local wallet via @emblemvault/auth-sdk signers (EVM + Solana)
- `custom` -- Provide your own WalletProvider implementation

**API model**: Async job-based. `POST /agent/prompt` returns a job ID, then poll `GET /agent/job/{jobId}` every 2s (max 5 min timeout).

### Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `bankr_trade` | Buy, sell, or swap tokens | `action` (buy/sell/swap), `toToken`, `amount`, `chain` |
| `bankr_portfolio` | Check wallet balances and portfolio value | `view` (full/chain/token/total_value), `chain` |
| `bankr_transfer` | Send crypto to addresses, ENS, or social handles | `token`, `amount`, `to`, `chain` |
| `bankr_market` | Token prices, technical analysis, sentiment, trending | `action` (price/analysis/sentiment/trending/compare/chart), `token` |
| `bankr_nft` | Browse, buy, sell, and transfer NFTs | `action` (browse/floor_price/buy/my_nfts/transfer), `collection` |
| `bankr_polymarket` | Prediction markets: search, odds, bet, positions | `action` (search/odds/bet/positions/redeem), `market` |
| `bankr_leverage` | Leveraged trading via Avantis (up to 100x) | `action` (open/close/positions), `pair`, `direction`, `leverage` |
| `bankr_automation` | DCA, limit orders, stop losses, TWAP, scheduling | `action` (dca/limit_order/stop_loss/twap/schedule/list/cancel) |
| `bankr_deploy_token` | Deploy ERC-20 tokens via Clanker | `name`, `symbol`, `chain` (base/unichain) |
| `bankr_raw_tx` | Submit raw EVM transactions with calldata | `to`, `chainId`, `data`, `value` |
| `bankr_prompt` | Natural language prompt to Bankr AI | `prompt` |
| `bankr_wallet_info` | Wallet provider info, addresses, signing capabilities | `showAddresses` |

### Live data tools

`bankr_portfolio`, `bankr_market`, `bankr_trade`, `bankr_transfer`, `bankr_nft`, `bankr_polymarket`, `bankr_leverage` -- all query live Bankr APIs.

### Usage Examples

```
> Swap $50 of ETH to USDC on Base
> Show my full portfolio across all chains
> Send 0.1 ETH to vitalik.eth on Ethereum
> What's the technical analysis for SOL?
> Open a 10x long on ETH with $100
> Set up a daily DCA of $25 into BTC
> Deploy a token called "TestCoin" with symbol "TST" on Base
```

---

## 2. A2A -- Google Agent-to-Agent Protocol (v0.3.0)

**Package**: `@hustle/plugin-a2a`
**Tools**: 7
**Protocol version**: 0.3.0
**Description**: Implements the Google A2A protocol for agent discovery, communication, and task management. Supports MASQ mode where Hustle appears as a native A2A agent with an ERC-8004 on-chain identity.

### Protocol details (v0.3.0)

- **Agent card discovery**: Tries `/.well-known/agent-card.json` first, falls back to `/.well-known/agent.json`
- **Message parts**: Includes both `kind` and `type` fields for backwards compatibility (v0.3.0 uses `kind`, older versions use `type`)
- **Message ID**: All messages include a `messageId` field (v0.3.0 requirement)
- **Security**: Agent cards include `securitySchemes` alongside legacy `authentication`
- **Task states**: `submitted`, `working`, `input-required`, `completed`, `failed`, `canceled`, `rejected`, `auth-required`
- **JSON-RPC methods**: `message/send`, `message/stream`, `tasks/get`, `tasks/cancel`
- **Error codes**: Standard JSON-RPC codes plus A2A-specific -32001 through -32007

### Configuration

```js
createA2APlugin({
  knownAgents: ['https://agent.example.com'],  // Pre-seed known agents
  debug: true,
  port: 3000,                                   // Server port (for MASQ)
  masq: {
    enabled: true,                              // Enable MASQ (native agent) mode
    agentName: 'My Hustle Agent',
    privateKey: '0x...',                        // For ERC-8004 registration
    chain: 'baseSepolia',
  },
})
```

### Tools

| Tool | Direction | Description | Key Parameters |
|------|-----------|-------------|----------------|
| `a2a_discover_agent` | USES | Fetch agent card, validate schema, cache agent | `url` |
| `a2a_send_message` | USES | Send JSON-RPC message, get response or stream | `agentUrl`, `message`, `taskId`, `stream` |
| `a2a_get_task` | USES | Get task status, artifacts, message history | `agentUrl`, `taskId` |
| `a2a_cancel_task` | USES | Cancel a running task via tasks/cancel | `agentUrl`, `taskId` |
| `a2a_list_agents` | Both | List cached agents, filter by keyword/capability | `keyword`, `capability` |
| `a2a_start_server` | MASQ | Start A2A server exposing Hustle as an agent | `port`, `name`, `description` |
| `a2a_register_identity` | MASQ | Register on-chain as ERC-8004 agent | `agentCardUrl`, `chain`, `linkWallet` |

### Live data tools

`a2a_discover_agent` and `a2a_send_message` hit live A2A agent endpoints. `a2a_list_agents` queries the local cache.

### Usage Examples

```
> Discover the agent at https://google-a2a-demo.web.app
> Send "What tokens do you support?" to https://defi-agent.example.com
> List all known A2A agents
> Start an A2A server on port 3000
> Register my identity on-chain on Base Sepolia
```

---

## 3. ACP -- Virtuals Agent Commerce Protocol

**Package**: `@hustle/plugin-acp`
**Tools**: 8
**Description**: Integrates with the Virtuals ACP marketplace for agent-to-agent service commerce. Hustle can act as a buyer (consuming services), seller (providing services), or register as a native Virtuals agent with autonomous job processing.

### Protocol details

- **Production API**: `https://acpx.virtuals.io` (not `acp.virtuals.io` -- that domain is retired)
- **Agent search**: `GET /api/agents/v4/search?search={keyword}&limit={n}` -- returns `{ data: [...] }`
- **Agent detail**: `GET /api/agents/{id}`
- **Jobs API**: `/api/jobs/{id}`, `/api/jobs/{id}/cancel`, `/api/jobs/{id}/respond`, `/api/jobs/{id}/deliver`, `/api/jobs/{id}/evaluate`
- **Marketplace API**: `https://api.virtuals.io/api/virtuals` (alternative discovery with pagination)
- **Payment**: USDC on Base mainnet (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, 6 decimals)
- **ACP V2 contract**: `0xa6C9BA866992cfD7fd6460ba912bfa405adA9df0` (Base mainnet)
- **On-chain phases**: 0 (created) through 6 (completed), mapped to unified task states
- **Agent response shape**: Agents have `jobs` array (not `offerings`) with `id`, `name`, `price`, `priceV2`, `slaMinutes`, `requirement`, `deliverable`

### Configuration

```js
createACPPlugin({
  acpBaseUrl: 'https://acpx.virtuals.io',  // Production URL (default)
  chain: 'base',
  debug: false,
  masq: {
    enabled: true,
    agentName: 'Hustle DeFi Agent',
    autoPoll: true,       // Auto-watch for incoming jobs
    autoAccept: true,     // Auto-accept matching jobs
  },
})
```

### Tools

| Tool | Direction | Description | Key Parameters |
|------|-----------|-------------|----------------|
| `acp_browse_agents` | Buyer | Search the ACP marketplace for agents | `keyword`, `capability`, `category`, `limit` |
| `acp_initiate_job` | Buyer | Create a job request with a seller agent | `sellerAgentId`, `offeringName`, `requirements`, `maxPrice` |
| `acp_respond_to_job` | Seller | Accept or reject an incoming job | `jobId`, `action` (accept/reject), `price`, `reason` |
| `acp_deliver_job` | Seller | Deliver results for an accepted job | `jobId`, `result`, `data`, `artifacts` |
| `acp_evaluate_job` | Buyer | Rate and accept/reject a delivery | `jobId`, `action` (accept/reject), `score`, `feedback` |
| `acp_get_jobs` | Both | List jobs by status, direction, or ID | `jobId`, `direction`, `status`, `limit` |
| `acp_register_agent` | MASQ | Register as a native Virtuals agent on-chain | `name`, `description`, `offerings`, `chain` |
| `acp_start_autonomous` | MASQ | Start autonomous job polling mode | `mode` (auto_accept/require_approval/filter), `pollIntervalMs` |

### Live data tools

`acp_browse_agents` hits the live `acpx.virtuals.io` search API. `acp_get_jobs` queries the jobs API. All other tools make live API calls for their respective operations.

### Usage Examples

```
> Browse ACP agents that offer trading services
> Initiate a job with agent X for portfolio analysis
> Check all my active buyer jobs
> Register as a DeFi agent on the ACP marketplace on Base
> Start autonomous mode to process incoming jobs
```

### Known limitations

- Job lifecycle (create/accept/deliver) uses REST endpoints. The real ACP SDK uses on-chain smart contract calls via Socket.IO. Full on-chain integration is planned.
- Registration ABI is speculative -- function signatures have not been verified against the deployed V2 contract.

---

## 4. ElizaOS -- AI Agent Framework

**Package**: `@hustle/plugin-elizaos`
**Tools**: 6
**Description**: Connects Hustle to the ElizaOS agent framework. Call actions and query data on ElizaOS agents, manage agent memory, or run Hustle as a native ElizaOS-compatible agent with DeFi actions, market data providers, and risk evaluators.

### Protocol details

- **Messaging**: Tries v1.7.x session endpoint first (`POST /api/messaging/sessions/{id}/messages`), falls back to legacy (`POST /api/agents/{id}/message`)
- **Actions**: `POST /api/agents/{id}/actions/{action}`
- **Providers**: `GET /api/agents/{id}/providers/{provider}`
- **Memory**: CRUD via `/api/agents/{id}/memories` and `/api/agents/{id}/rooms`

### Configuration

```js
createElizaOSPlugin({
  elizaApiUrl: 'http://localhost:3000',  // ElizaOS agent URL
  debug: false,
  masq: {
    enabled: true,
    characterName: 'Hustle',
    port: 3001,
  },
})
```

### Tools

| Tool | Direction | Description | Key Parameters |
|------|-----------|-------------|----------------|
| `eliza_call_action` | USES | Execute an action on an ElizaOS agent | `agentId`, `action`, `content`, `params` |
| `eliza_query_provider` | USES | Query a data provider from an ElizaOS agent | `agentId`, `provider`, `context` |
| `eliza_list_plugins` | Both | List plugins, actions, providers, evaluators | `agentId`, `type`, `filter` |
| `eliza_manage_memory` | Both | Read, write, search, delete agent memory | `agentId`, `operation` (read/write/search/delete), `content` |
| `eliza_register_plugin` | MASQ | Register Hustle as an ElizaOS plugin | `categories`, `pluginName`, `targetAgentId` |
| `eliza_start_runtime` | MASQ | Start Hustle as an ElizaOS-compatible runtime | `port`, `characterName`, `categories` |

### Live data tools

`eliza_call_action`, `eliza_query_provider`, `eliza_list_plugins`, and `eliza_manage_memory` all make live HTTP calls to the configured ElizaOS agent URL.

### Usage Examples

```
> List all available plugins on the ElizaOS agent
> Call the GENERATE_IMAGE action on agent "creative-ai"
> Query the wallet provider on agent "defi-bot"
> Search memory for "ETH trading strategy"
> Register Hustle as an ElizaOS plugin with DeFi capabilities
> Start the ElizaOS runtime on port 3001
```

---

## 5. Bridge -- Cross-Protocol Router

**Package**: `@hustle/plugin-bridge`
**Tools**: 4
**Description**: Routes messages between A2A, ACP, and ElizaOS protocols transparently. Provides unified agent discovery across all protocols, message translation (with v0.3.0 `kind`+`type` dual fields and `messageId`), and cross-protocol identity linking for MASQ identities.

### Protocol translation details

- **A2A outgoing**: Message parts include both `kind` and `type` fields, plus `messageId` (v0.3.0)
- **A2A incoming**: Reads `kind` with fallback to `type` for backwards compatibility
- **ACP translation**: Maps message content to job `memo`, structured data to `metadata`
- **ElizaOS translation**: Maps to action content with `PROCESS_MESSAGE` action name

### Configuration

```js
createBridgePlugin({
  protocols: {
    a2a: a2aPlugin,        // Reference to registered A2A plugin
    acp: acpPlugin,        // Reference to registered ACP plugin
    elizaos: elizaPlugin,  // Reference to registered ElizaOS plugin
  },
  debug: false,
})
```

### Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `bridge_route_to_agent` | Route a message to any agent regardless of protocol | `target_agent_id`, `message`, `target_protocol` |
| `bridge_translate_message` | Translate a message between protocol formats | `message`, `from_protocol`, `to_protocol` |
| `bridge_discover_all` | Search for agents across ALL protocols simultaneously | `keyword`, `capability`, `protocols` |
| `bridge_link_identities` | Link Hustle's MASQ identities across protocols | `action` (link/verify/list/unlink), `identity` |

### Usage Examples

```
> Route "What's your portfolio?" to agent 0xABC (auto-detects protocol)
> Discover all agents that can do trading across all protocols
> Translate this A2A message to ACP format
> Link my A2A and ACP identities together
```

---

## 6. God Mode -- JS Executor and Plugin Builder

God mode provides direct control over the Hustle runtime, including arbitrary JavaScript execution and a custom plugin builder. See [GOD-MODE.md](./GOD-MODE.md) for full documentation.

### Capabilities

- **JS Executor**: Run arbitrary Node.js code in the Hustle runtime context
- **Plugin Builder**: Create, install, and manage custom plugins at runtime
- **Terminal Capture**: Capture and replay terminal output
- **Direct Client Access**: Full `HustleIncognitoClient` API including `chat()`, `chatStream()`, `getTools()`, and plugin registration

---

## Live Data Summary

Tools that query live external APIs:

| Plugin | Live Tools | Endpoint |
|--------|-----------|----------|
| Bankr | `bankr_trade`, `bankr_portfolio`, `bankr_market`, `bankr_transfer`, `bankr_nft`, `bankr_polymarket`, `bankr_leverage` | Bankr API |
| A2A | `a2a_discover_agent`, `a2a_send_message` | Any A2A agent URL |
| ACP | `acp_browse_agents`, `acp_get_jobs`, `acp_initiate_job`, `acp_respond_to_job`, `acp_deliver_job`, `acp_evaluate_job` | `acpx.virtuals.io` |
| ElizaOS | `eliza_call_action`, `eliza_query_provider`, `eliza_list_plugins`, `eliza_manage_memory` | Configured ElizaOS URL |
| Bridge | `bridge_route_to_agent`, `bridge_discover_all` | Routes to underlying protocol |

---

## Enabling and Disabling Plugins

### Via commands

```
/plugins                    # List all plugins and their status
/plugins enable bankr       # Enable the Bankr plugin
/plugins disable a2a        # Disable the A2A plugin
/plugins info bridge        # Show plugin details and tools
```

### Via tool selection

```
/tools                      # List all tool categories
/tools add bankr            # Add Bankr tools to active set
/tools remove a2a           # Remove A2A tools
/tools clear                # Clear tool selection (enable auto-tools mode)
```

When no tools are explicitly selected, the AI uses auto-tools mode, which dynamically selects the appropriate tools based on conversation context.
