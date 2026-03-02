/**
 * FormulaParser - Parses and evaluates mathematical expressions
 * 
 * Supports:
 * - Basic operators: +, -, *, /
 * - Parentheses: (a + b) * c
 * - Functions: min(a, b), max(a, b)
 * - Variables: substituted from provided context
 */

export interface FormulaContext {
    [key: string]: number;
}

export interface ParseResult {
    success: boolean;
    value?: number;
    error?: string;
    variables?: string[];
}

type TokenType = 'number' | 'operator' | 'lparen' | 'rparen' | 'variable' | 'function' | 'comma';

interface Token {
    type: TokenType;
    value: string | number;
}

export class FormulaParser {
    private tokens: Token[] = [];
    private position: number = 0;
    private context: FormulaContext = {};

    /**
     * Parse and evaluate a formula string
     */
    evaluate(formula: string, context: FormulaContext): ParseResult {
        try {
            this.context = context;
            this.tokens = this.tokenize(formula);
            this.position = 0;

            if (this.tokens.length === 0) {
                return { success: false, error: 'Empty formula' };
            }

            const value = this.parseExpression();

            if (this.position < this.tokens.length) {
                return { success: false, error: `Unexpected token: ${this.tokens[this.position].value}` };
            }

            return {
                success: true,
                value,
                variables: this.extractVariables(formula),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Validate a formula without evaluating
     */
    validate(formula: string, availableVariables: string[]): ParseResult {
        try {
            this.tokens = this.tokenize(formula);
            const variables = this.extractVariables(formula);

            // Check all variables are available
            const missingVars = variables.filter(v => !availableVariables.includes(v));
            if (missingVars.length > 0) {
                return {
                    success: false,
                    error: `Unknown variables: ${missingVars.join(', ')}`,
                    variables,
                };
            }

            // Create mock context for validation
            const mockContext: FormulaContext = {};
            availableVariables.forEach(v => mockContext[v] = 1);

            return this.evaluate(formula, mockContext);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Invalid formula syntax',
            };
        }
    }

    /**
     * Extract variable names from formula
     */
    extractVariables(formula: string): string[] {
        const variableRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
        const matches = formula.match(variableRegex) || [];
        const functions = ['min', 'max', 'abs', 'sqrt', 'pow'];
        return [...new Set(matches.filter(m => !functions.includes(m)))];
    }

    /**
     * Tokenize the formula string
     */
    private tokenize(formula: string): Token[] {
        const tokens: Token[] = [];
        let i = 0;

        while (i < formula.length) {
            const char = formula[i];

            // Skip whitespace
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // Number (including decimals)
            if (/[0-9.]/.test(char)) {
                let num = '';
                while (i < formula.length && /[0-9.]/.test(formula[i])) {
                    num += formula[i];
                    i++;
                }
                tokens.push({ type: 'number', value: parseFloat(num) });
                continue;
            }

            // Operators
            if (['+', '-', '*', '/'].includes(char)) {
                tokens.push({ type: 'operator', value: char });
                i++;
                continue;
            }

            // Parentheses
            if (char === '(') {
                tokens.push({ type: 'lparen', value: '(' });
                i++;
                continue;
            }
            if (char === ')') {
                tokens.push({ type: 'rparen', value: ')' });
                i++;
                continue;
            }

            // Comma (for function arguments)
            if (char === ',') {
                tokens.push({ type: 'comma', value: ',' });
                i++;
                continue;
            }

            // Variable or function name
            if (/[a-zA-Z_]/.test(char)) {
                let name = '';
                while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
                    name += formula[i];
                    i++;
                }

                // Check if it's a function (followed by parenthesis)
                if (formula[i] === '(') {
                    tokens.push({ type: 'function', value: name });
                } else {
                    tokens.push({ type: 'variable', value: name });
                }
                continue;
            }

            throw new Error(`Unexpected character: ${char}`);
        }

        return tokens;
    }

    /**
     * Parse expression (handles + and -)
     */
    private parseExpression(): number {
        let left = this.parseTerm();

        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
                this.position++;
                const right = this.parseTerm();
                left = token.value === '+' ? left + right : left - right;
            } else {
                break;
            }
        }

        return left;
    }

    /**
     * Parse term (handles * and /)
     */
    private parseTerm(): number {
        let left = this.parseFactor();

        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token.type === 'operator' && (token.value === '*' || token.value === '/')) {
                this.position++;
                const right = this.parseFactor();
                left = token.value === '*' ? left * right : left / right;
            } else {
                break;
            }
        }

        return left;
    }

    /**
     * Parse factor (handles parentheses, numbers, variables, functions)
     */
    private parseFactor(): number {
        const token = this.tokens[this.position];

        if (!token) {
            throw new Error('Unexpected end of expression');
        }

        // Unary minus
        if (token.type === 'operator' && token.value === '-') {
            this.position++;
            return -this.parseFactor();
        }

        // Number
        if (token.type === 'number') {
            this.position++;
            return token.value as number;
        }

        // Variable
        if (token.type === 'variable') {
            this.position++;
            const varName = token.value as string;
            if (!(varName in this.context)) {
                throw new Error(`Unknown variable: ${varName}`);
            }
            return this.context[varName];
        }

        // Function
        if (token.type === 'function') {
            return this.parseFunction();
        }

        // Parentheses
        if (token.type === 'lparen') {
            this.position++; // consume '('
            const value = this.parseExpression();
            if (this.tokens[this.position]?.type !== 'rparen') {
                throw new Error('Missing closing parenthesis');
            }
            this.position++; // consume ')'
            return value;
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }

    /**
     * Parse function call
     */
    private parseFunction(): number {
        const funcName = this.tokens[this.position].value as string;
        this.position++; // consume function name

        if (this.tokens[this.position]?.type !== 'lparen') {
            throw new Error(`Expected '(' after function ${funcName}`);
        }
        this.position++; // consume '('

        const args: number[] = [];

        // Parse arguments
        while (this.position < this.tokens.length && this.tokens[this.position].type !== 'rparen') {
            args.push(this.parseExpression());
            if (this.tokens[this.position]?.type === 'comma') {
                this.position++; // consume ','
            }
        }

        if (this.tokens[this.position]?.type !== 'rparen') {
            throw new Error(`Missing ')' for function ${funcName}`);
        }
        this.position++; // consume ')'

        // Execute function
        switch (funcName.toLowerCase()) {
            case 'min':
                return Math.min(...args);
            case 'max':
                return Math.max(...args);
            case 'abs':
                return Math.abs(args[0]);
            case 'sqrt':
                return Math.sqrt(args[0]);
            case 'pow':
                return Math.pow(args[0], args[1]);
            default:
                throw new Error(`Unknown function: ${funcName}`);
        }
    }
}

// Export singleton instance
export const formulaParser = new FormulaParser();
