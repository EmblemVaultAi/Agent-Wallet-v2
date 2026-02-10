/**
 * Auto-Refresh Status — periodic refresh controller
 */

/**
 * Create an auto-refresh controller that periodically calls a refresh function.
 * @param {function} refreshFn - async or sync function to call on each tick
 * @param {number} intervalMs - interval in milliseconds (default 30000)
 * @returns {{ start: function, stop: function, refresh: function }}
 */
export function createAutoRefresh(refreshFn, intervalMs = 30000) {
  let timer = null;

  function start() {
    stop(); // clear any existing interval
    timer = setInterval(() => {
      try {
        refreshFn();
      } catch (_) {
        // Swallow errors in auto-refresh to avoid crashing the TUI
      }
    }, intervalMs);
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function refresh() {
    try {
      refreshFn();
    } catch (_) {
      // Swallow errors
    }
  }

  return { start, stop, refresh };
}
