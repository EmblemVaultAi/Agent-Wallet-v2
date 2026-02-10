# tmux Integration

EmblemAI can split your terminal into multiple panes using tmux for enhanced workflow visibility.

## Prerequisites

- **tmux** must be installed and you must be running EmblemAI inside a tmux session
- Install tmux:
  - macOS: `brew install tmux`
  - Ubuntu/Debian: `sudo apt install tmux`
  - Arch: `sudo pacman -S tmux`

## Starting a tmux Session

```bash
# Start a new session
tmux new -s emblem

# Then launch EmblemAI inside it
node emblemai.js -p "your-password"
```

## Layout Presets

Use the `/tmux` command inside EmblemAI to split into panes.

### Default Layout

```
/tmux
```
or
```
/tmux default
```

```
┌──────────────────────┬──────────────┐
│                      │              │
│   EmblemAI TUI       │  Event Log   │
│   (main pane)        │  (30%)       │
│                      │              │
└──────────────────────┴──────────────┘
```

- **Main pane** (70%): The EmblemAI TUI
- **Right pane** (30%): Event log / tail output

### Trading Layout

```
/tmux trading
```

```
┌──────────────────────┬──────────────┐
│                      │              │
│   EmblemAI TUI       │  Portfolio   │
│   (main pane)        │  Monitor     │
│                      │  (35%)       │
├──────────────────────┤              │
│   Status Bar (20%)   │              │
└──────────────────────┴──────────────┘
```

- **Main pane**: The EmblemAI TUI
- **Right pane** (35%): Portfolio monitoring
- **Bottom-left pane** (20%): Status / refresh output

### Debug Layout

```
/tmux debug
```

```
┌──────────────────────┬──────────────┐
│                      │  Debug Log   │
│   EmblemAI TUI       │  (40%)       │
│   (main pane)        ├──────────────┤
│                      │  Network Log │
│                      │  (50%)       │
└──────────────────────┴──────────────┘
```

- **Main pane** (60%): The EmblemAI TUI
- **Top-right pane** (40%): Debug log output
- **Bottom-right pane**: Network request log

## Using the Extra Panes

After splitting, you can use the extra panes for:

```bash
# In the event log pane - watch a log file
tail -f ~/.emblemai-events.log

# In the portfolio pane - run periodic portfolio checks
watch -n 30 'node emblemai.js --agent -p "password" -m "show portfolio summary"'

# In the debug pane - watch debug output
tail -f /tmp/emblemai-debug.log
```

## tmux Key Bindings

Common tmux key bindings (default prefix is `Ctrl+B`):

| Keys | Action |
|------|--------|
| `Ctrl+B` then `o` | Switch between panes |
| `Ctrl+B` then arrow keys | Navigate panes |
| `Ctrl+B` then `z` | Zoom current pane (toggle fullscreen) |
| `Ctrl+B` then `x` | Close current pane |
| `Ctrl+B` then `d` | Detach from session |
| `Ctrl+B` then `[` | Enter scroll mode (q to exit) |

## Custom Configurations

You can create custom tmux layouts by running tmux commands directly in your terminal before or after launching EmblemAI:

```bash
# Custom 3-pane layout
tmux new-session -d -s emblem
tmux split-window -h -p 30
tmux split-window -v -p 40
tmux select-pane -t 0
tmux send-keys 'node emblemai.js -p "password"' Enter
tmux attach -t emblem
```

## Auto-Detection

EmblemAI automatically detects if it's running inside tmux by checking the `TMUX` environment variable. The `/tmux` command will warn you if you're not in a tmux session.
