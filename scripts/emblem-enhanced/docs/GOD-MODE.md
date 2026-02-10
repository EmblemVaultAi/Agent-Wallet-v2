# EmblemAI God Mode

God mode provides full programmatic control over the Hustle runtime, including arbitrary JavaScript execution, a custom plugin builder, and direct access to the `HustleIncognitoClient` API with 250+ DeFi tools.

## Overview

God mode consists of two primary systems:

1. **JS Executor** -- Run arbitrary Node.js code with access to the Hustle client, auth SDK, and all registered plugins
2. **Plugin Builder** -- Create, install, test, and manage custom plugins at runtime without restarting

## JS Executor

### Basic usage

The JS executor runs code in the context of the active Hustle session. You have access to:

- `client` -- The `HustleIncognitoClient` instance (chat, streaming, tools, plugins)
- `authSdk` -- The `EmblemAuthSDK` instance (session, vault info, addresses, signing)
- `plugins` -- Map of all registered plugins and their executors

### Examples

#### Query the AI directly

```js
const response = await client.chat([
  { role: 'user', content: 'What are the top 5 trending tokens on Solana?' }
]);
console.log(response.content);
```

#### Stream a response

```js
const stream = client.chatStream({
  messages: [{ role: 'user', content: 'Analyze ETH price action' }],
  processChunks: true,
});
for await (const chunk of stream) {
  if (chunk.type === 'text') process.stdout.write(chunk.value);
}
```

#### Get wallet addresses

```js
const vault = await authSdk.getVaultInfo();
console.log('EVM:', vault.evmAddress);
console.log('Solana:', vault.solanaAddress);
console.log('BTC Taproot:', vault.btcAddresses?.p2tr);
```

#### List all available tools

```js
const tools = await client.getTools();
tools.forEach(t => console.log(`${t.id}: ${t.title} - ${t.description}`));
```

#### Execute a plugin tool directly

```js
// Call a Bankr tool executor directly, bypassing the AI
const result = await plugins.bankr.executors.bankr_portfolio({
  view: 'full',
});
console.log(JSON.stringify(result, null, 2));
```

#### Multi-step operations

```js
// Check balance, then trade if sufficient
const portfolio = await plugins.bankr.executors.bankr_portfolio({ view: 'token', token: 'ETH' });
const ethBalance = portfolio.balance;
if (ethBalance > 0.01) {
  const trade = await plugins.bankr.executors.bankr_trade({
    action: 'swap',
    fromToken: 'ETH',
    toToken: 'USDC',
    amount: '0.01',
    amountType: 'token',
    chain: 'base',
  });
  console.log('Trade result:', trade);
}
```

### Safety considerations

- JS executor runs with full Node.js permissions in the current process
- Code has access to the filesystem, network, and all environment variables
- Wallet operations require the active auth-sdk session -- no additional confirmation prompts
- Be cautious with trade execution code; there is no simulation/dry-run by default
- Errors in executor code are caught and displayed but do not crash the TUI

## Plugin Builder

The plugin builder lets you create custom plugins that integrate with the Hustle tool system. Custom plugins follow the same `HustlePlugin` interface as the built-in protocol plugins.

### Plugin interface

```ts
interface HustlePlugin {
  name: string;           // Unique name, e.g. "my-custom-plugin"
  version: string;        // Semver, e.g. "1.0.0"
  tools: ClientToolDefinition[];   // Tool definitions sent to the AI
  executors: Record<string, ToolExecutor>;  // Tool execution functions
  hooks?: {
    onInit?: () => Promise<void>;
    onDestroy?: () => Promise<void>;
    onToolCall?: (toolName: string, args: any) => Promise<void>;
    onResponse?: (response: any) => Promise<any>;
  };
}
```

### Tool name rules

Tool names must match: `/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/`

- Start with a letter
- Only letters, numbers, and underscores
- Maximum 64 characters

### Step-by-step: Creating a custom plugin

#### Step 1: Define the plugin

```js
const myPlugin = {
  name: 'price-alerts',
  version: '1.0.0',
  tools: [
    {
      name: 'set_price_alert',
      description: 'Set a price alert for a token. Notifies when the target price is reached.',
      parameters: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Token symbol (e.g., "ETH", "SOL")' },
          targetPrice: { type: 'string', description: 'Target price in USD' },
          direction: { type: 'string', enum: ['above', 'below'], description: 'Trigger when price goes above or below target' },
        },
        required: ['token', 'targetPrice', 'direction'],
      },
    },
    {
      name: 'list_price_alerts',
      description: 'List all active price alerts.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  ],
  executors: {},
  hooks: {},
};
```

#### Step 2: Implement executors

```js
const alerts = [];

myPlugin.executors = {
  set_price_alert: async (args) => {
    const alert = {
      id: Date.now().toString(),
      token: args.token,
      targetPrice: parseFloat(args.targetPrice),
      direction: args.direction,
      createdAt: new Date().toISOString(),
    };
    alerts.push(alert);
    return {
      success: true,
      message: `Alert set: notify when ${args.token} goes ${args.direction} $${args.targetPrice}`,
      alertId: alert.id,
    };
  },

  list_price_alerts: async () => {
    return {
      alerts: alerts,
      count: alerts.length,
    };
  },
};
```

#### Step 3: Add hooks (optional)

```js
myPlugin.hooks = {
  onInit: async () => {
    console.log('Price alerts plugin initialized');
  },
  onToolCall: async (toolName, args) => {
    console.log(`[price-alerts] Tool called: ${toolName}`);
  },
};
```

#### Step 4: Install the plugin

```js
client.use(myPlugin);
```

The AI now has access to `set_price_alert` and `list_price_alerts` tools and will use them when relevant to the conversation.

#### Step 5: Test

```
You: Set a price alert for ETH when it goes above $4000
You: List my price alerts
```

### Managing custom plugins

```
/plugins                          # See all plugins including custom ones
/plugins info price-alerts        # Show plugin details
/plugins disable price-alerts     # Temporarily disable
/plugins enable price-alerts      # Re-enable
```

### Advanced: Chaining plugins with built-in tools

Custom plugins can call built-in plugin executors to create powerful workflows:

```js
const analyzeAndAlert = {
  name: 'smart-alerts',
  version: '1.0.0',
  tools: [{
    name: 'analyze_and_set_alerts',
    description: 'Analyze a token and automatically set price alerts based on technical levels',
    parameters: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Token to analyze' },
      },
      required: ['token'],
    },
  }],
  executors: {
    analyze_and_set_alerts: async (args) => {
      // Use Bankr's market tool for technical analysis
      const analysis = await plugins.bankr.executors.bankr_market({
        action: 'analysis',
        token: args.token,
      });

      // Extract support/resistance from the analysis
      // Set alerts at key levels
      const alerts = [];
      if (analysis.resistance) {
        alerts.push({ price: analysis.resistance, direction: 'above' });
      }
      if (analysis.support) {
        alerts.push({ price: analysis.support, direction: 'below' });
      }

      return { token: args.token, alertsCreated: alerts };
    },
  },
};
```

## Terminal Capture

Terminal capture records all output from the TUI session for debugging or replay.

### Usage

```
/capture start           # Start capturing terminal output
/capture stop            # Stop capturing and save to file
/capture status          # Show capture status and file path
```

Capture files are saved to `~/.emblemai-captures/` with timestamps.

## Direct Client API Reference

The `HustleIncognitoClient` (accessible as `client` in god mode) provides:

| Method | Description |
|--------|-------------|
| `client.chat(messages, options?)` | Send messages and get a complete response |
| `client.chatStream(options)` | Stream a response with real-time token delivery |
| `client.getTools()` | List all available tool categories |
| `client.getModels()` | List available AI models |
| `client.use(plugin)` | Register a HustlePlugin |
| `client.getPaygStatus()` | Get PAYG billing status |
| `client.configurePayg(options)` | Configure PAYG settings |

### Chat options

```js
{
  messages: [...],                    // Conversation messages
  model: 'model-id',                 // Override model
  selectedToolCategories: ['bankr'], // Restrict tools
  intentContext: { ... },            // Auto-tools context
  processChunks: true,               // Enable chunk processing for streaming
}
```
