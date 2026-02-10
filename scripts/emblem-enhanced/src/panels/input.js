/**
 * Input Panel — text entry with submit handling
 */

/**
 * Initialize the input box with key handlers.
 * On Enter: grab value, call onSubmit, clear, refocus.
 * @param {object} inputBox - blessed textarea
 * @param {function} onSubmit - callback(text: string)
 */
export function initInput(inputBox, onSubmit) {
  // Handle Enter key for submission
  inputBox.key('enter', () => {
    const text = inputBox.getValue().trim();

    // Clear the input immediately
    inputBox.clearValue();
    inputBox.screen.render();

    if (!text) return;

    // Call the submit handler
    if (typeof onSubmit === 'function') {
      onSubmit(text);
    }

    // Re-focus the input
    inputBox.focus();
  });

  // Ensure the input is focused and ready
  inputBox.focus();
  inputBox.screen.render();
}
