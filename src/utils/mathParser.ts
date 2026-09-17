/**
 * Safe Mathematical Expression Evaluator
 * Supports +, -, *, /, (, ), ×, ÷
 * Parses numbers with decimals and commas.
 * Does NOT use eval() or Function() constructor.
 */

export interface EvaluationResult {
  valid: boolean;
  value: number;
  formatted: string;
}

/**
 * Normalizes arithmetic string (replaces unicode operators, strips commas in numbers)
 */
export function sanitizeExpression(expr: string): string {
  if (!expr) return '';
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .trim();
}

/**
 * Checks if a string contains safe arithmetic characters only
 */
export function isSafeArithmetic(expr: string): boolean {
  const sanitized = sanitizeExpression(expr);
  if (!sanitized) return false;
  // Allowed characters: digits, decimal point, +, -, *, /, (, ), spaces
  return /^[\d\s.+\-*/()]+$/.test(sanitized);
}

/**
 * Tokenize mathematical expression
 */
type Token =
  | { type: 'NUMBER'; value: number }
  | { type: 'OP'; value: '+' | '-' | '*' | '/' }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' };

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  const s = sanitizeExpression(expr);

  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      // Check for unary minus / plus at start or after operator / lparen
      const prevToken = tokens[tokens.length - 1];
      const isUnary =
        (ch === '-' || ch === '+') &&
        (!prevToken || prevToken.type === 'OP' || prevToken.type === 'LPAREN');

      if (isUnary) {
        // Read the number following the unary sign
        let numStr = ch;
        i++;
        let hasDot = false;
        while (i < s.length && (/[\d.]/.test(s[i]))) {
          if (s[i] === '.') {
            if (hasDot) return null;
            hasDot = true;
          }
          numStr += s[i];
          i++;
        }
        if (numStr === '-' || numStr === '+') return null;
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }

    if (/[\d.]/.test(ch)) {
      let numStr = '';
      let hasDot = false;
      while (i < s.length && /[\d.]/.test(s[i])) {
        if (s[i] === '.') {
          if (hasDot) return null;
          hasDot = true;
        }
        numStr += s[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    // Invalid character
    return null;
  }

  return tokens;
}

/**
 * Evaluates tokens using standard recursive descent / precedence parsing
 */
class ExpressionParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  // expr = term (( '+' | '-' ) term)*
  parseExpression(): number {
    let result = this.parseTerm();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token && token.type === 'OP' && (token.value === '+' || token.value === '-')) {
        this.consume();
        const nextTerm = this.parseTerm();
        if (token.value === '+') {
          result += nextTerm;
        } else {
          result -= nextTerm;
        }
      } else {
        break;
      }
    }

    return result;
  }

  // term = factor (( '*' | '/' ) factor)*
  private parseTerm(): number {
    let result = this.parseFactor();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token && token.type === 'OP' && (token.value === '*' || token.value === '/')) {
        this.consume();
        const nextFactor = this.parseFactor();
        if (token.value === '*') {
          result *= nextFactor;
        } else {
          if (nextFactor === 0) throw new Error('Division by zero');
          result /= nextFactor;
        }
      } else {
        break;
      }
    }

    return result;
  }

  // factor = NUMBER | '(' expr ')'
  private parseFactor(): number {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token.type === 'NUMBER') {
      this.consume();
      return token.value;
    }

    if (token.type === 'LPAREN') {
      this.consume();
      const value = this.parseExpression();
      const next = this.peek();
      if (!next || next.type !== 'RPAREN') {
        throw new Error('Mismatched parenthesis');
      }
      this.consume();
      return value;
    }

    throw new Error('Unexpected token');
  }

  parse(): number {
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected extra tokens');
    }
    return result;
  }
}

/**
 * Safely evaluates any mathematical expression string
 */
export function evaluateExpression(input: string | number | undefined | null): EvaluationResult {
  if (input === undefined || input === null) {
    return { valid: false, value: 0, formatted: '' };
  }

  if (typeof input === 'number') {
    if (isNaN(input)) return { valid: false, value: 0, formatted: '' };
    return {
      valid: true,
      value: input,
      formatted: formatSmartNumber(input),
    };
  }

  const str = String(input).trim();
  if (str === '') {
    return { valid: false, value: 0, formatted: '' };
  }

  // If input contains arithmetic symbols or is a plain number
  if (!isSafeArithmetic(str)) {
    // Check if it's text containing numbers (e.g. "$2000" or "Old balance 20155")
    const extractedNum = str.replace(/[^\d.-]/g, '');
    if (extractedNum && !isNaN(parseFloat(extractedNum))) {
      const val = parseFloat(extractedNum);
      return { valid: true, value: val, formatted: formatSmartNumber(val) };
    }
    return { valid: false, value: 0, formatted: '' };
  }

  try {
    const tokens = tokenize(str);
    if (!tokens || tokens.length === 0) {
      return { valid: false, value: 0, formatted: '' };
    }

    const parser = new ExpressionParser(tokens);
    const value = parser.parse();

    if (isNaN(value) || !isFinite(value)) {
      return { valid: false, value: 0, formatted: '' };
    }

    // Round to avoid floating point weirdness like 0.30000000000000004
    const rounded = Math.round(value * 10000) / 10000;

    return {
      valid: true,
      value: rounded,
      formatted: formatSmartNumber(rounded),
    };
  } catch {
    return { valid: false, value: 0, formatted: '' };
  }
}

/**
 * Format numbers cleanly without trailing zeroes
 */
export function formatSmartNumber(num: number, maxDecimals: number = 3): string {
  if (isNaN(num) || !isFinite(num)) return '';
  if (Number.isInteger(num)) return num.toString();
  const fixed = num.toFixed(maxDecimals);
  // Remove trailing zeroes after decimal
  return fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
}

/**
 * Rounding rule for Fine (whole number by default, or specific decimal places)
 */
export function roundFine(fine: number, precision: number = 0): number {
  if (isNaN(fine) || !isFinite(fine)) return 0;
  if (precision <= 0) {
    return Math.round(fine);
  }
  const factor = Math.pow(10, precision);
  return Math.round(fine * factor) / factor;
}
