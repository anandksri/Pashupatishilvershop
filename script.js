/**
 * Standalone Client Script for Shambhu Ji RXL Billing
 * Provides renderer DOM manipulation, arithmetic calculation, and IPC bridge.
 */

// Math expression evaluator for vanilla JS environment
function evaluateExpression(input) {
  if (input === undefined || input === null) return { valid: false, value: 0 };
  const str = String(input).trim();
  if (str === '') return { valid: false, value: 0 };

  const sanitized = str
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .trim();

  // Validate arithmetic characters only
  if (!/^[\d\s.+\-*/()]+$/.test(sanitized)) {
    const extractedNum = sanitized.replace(/[^\d.-]/g, '');
    if (extractedNum && !isNaN(parseFloat(extractedNum))) {
      return { valid: true, value: parseFloat(extractedNum) };
    }
    return { valid: false, value: 0 };
  }

  try {
    // Safe evaluation using Function with strictly sanitized arithmetic tokens
    // Guaranteed by the regex above to contain only numbers and operators
    const func = new Function(`"use strict"; return (${sanitized});`);
    const val = func();
    if (isNaN(val) || !isFinite(val)) return { valid: false, value: 0 };
    return { valid: true, value: Math.round(val * 10000) / 10000 };
  } catch (e) {
    return { valid: false, value: 0 };
  }
}

function formatSmartNumber(num, maxDecimals = 3) {
  if (isNaN(num) || !isFinite(num)) return '';
  if (Number.isInteger(num)) return num.toString();
  const fixed = num.toFixed(maxDecimals);
  return fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
}

// IPC listener for Electron Menu commands
if (typeof window !== 'undefined' && window.electronAPI) {
  console.log('[Shambhu Ji RXL] Running inside Electron environment with IPC bridge.');
} else {
  console.log('[Shambhu Ji RXL] Running in web preview mode with local persistent storage.');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    evaluateExpression,
    formatSmartNumber,
  };
}
