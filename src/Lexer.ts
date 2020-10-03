import { isAlpha, isNum, isAlphaNum } from './utils/index.ts';
import type { JSONValue } from './index.ts';

export enum Token {
  TOK_EOF = 'EOF',
  TOK_UNQUOTEDIDENTIFIER = 'UnquotedIdentifier',
  TOK_QUOTEDIDENTIFIER = 'QuotedIdentifier',
  TOK_RBRACKET = 'Rbracket',
  TOK_RPAREN = 'Rparen',
  TOK_COMMA = 'Comma',
  TOK_COLON = 'Colon',
  TOK_RBRACE = 'Rbrace',
  TOK_NUMBER = 'Number',
  TOK_CURRENT = 'Current',
  TOK_EXPREF = 'Expref',
  TOK_PIPE = 'Pipe',
  TOK_OR = 'Or',
  TOK_AND = 'And',
  TOK_EQ = 'EQ',
  TOK_GT = 'GT',
  TOK_LT = 'LT',
  TOK_GTE = 'GTE',
  TOK_LTE = 'LTE',
  TOK_NE = 'NE',
  TOK_FLATTEN = 'Flatten',
  TOK_STAR = 'Star',
  TOK_FILTER = 'Filter',
  TOK_DOT = 'Dot',
  TOK_NOT = 'Not',
  TOK_LBRACE = 'Lbrace',
  TOK_LBRACKET = 'Lbracket',
  TOK_LPAREN = 'Lparen',
  TOK_LITERAL = 'Literal',
}

export type LexerTokenValue = string | number | JSONValue;

export interface LexerToken {
  type: Token;
  value: LexerTokenValue;
  start: number;
}

export type ASTNode = SentinelNode
| ValueNode
| IndexNode
| FieldNode
| KeyValuePairNode
| ExpressionNode
| SliceNode
| FunctionNode
| ComparitorNode;

export interface SentinelNode {
  type: 'Identity' | Token.TOK_CURRENT;
}

export interface ValueNode {
  type: 'Literal';
  value: LexerTokenValue;
}

export interface IndexNode {
  type: 'Index';
  value: number | null;
}

export interface FieldNode {
  type: 'Field';
  name: LexerTokenValue;
}

export interface KeyValuePairNode {
  type: 'KeyValuePair';
  name: LexerTokenValue;
  value: ASTNode;
}

export interface ExpressionNode {
  type: "Subexpression" | "IndexExpression"
    | "Projection" | "ValueProjection" | "FilterProjection"
    | Token.TOK_FLATTEN | Token.TOK_PIPE
    | "MultiSelectList" | "MultiSelectHash"
    | "OrExpression" | "AndExpression" | "NotExpression"
    | "ExpressionReference";
  children: ASTNode[];
  jmespathType?: Token;
}

export interface SliceNode {
  type: "Slice";
  children: [number | null, number | null, number | null];
  jmespathType?: Token;
}

export interface FunctionNode<T = ASTNode> {
  type: "Function";
  name: LexerTokenValue;
  children: T[];
  jmespathType?: Token;
}

export interface ComparitorNode<T = ASTNode> {
  type: "Comparator";
  name: Token;
  children: T[];
  jmespathType?: Token;
}

export const basicTokens: {[key: string]: Token} = {
  '(': Token.TOK_LPAREN,
  ')': Token.TOK_RPAREN,
  '*': Token.TOK_STAR,
  ',': Token.TOK_COMMA,
  '.': Token.TOK_DOT,
  ':': Token.TOK_COLON,
  '@': Token.TOK_CURRENT,
  ']': Token.TOK_RBRACKET,
  '{': Token.TOK_LBRACE,
  '}': Token.TOK_RBRACE,
};

const operatorStartToken: {[key: string]: true} = {
  '!': true,
  '<': true,
  '=': true,
  '>': true,
};

const skipChars: {[key: string]: true} = {
  '\t': true,
  '\n': true,
  '\r': true,
  ' ': true,
};

class StreamLexer {
  _current = 0;
  tokenize(stream: string): LexerToken[] {
    const tokens: LexerToken[] = [];
    this._current = 0;

    let start;
    let identifier;
    let token;
    while (this._current < stream.length) {
      if (isAlpha(stream[this._current])) {
        start = this._current;
        identifier = this.consumeUnquotedIdentifier(stream);
        tokens.push({
          start,
          type: Token.TOK_UNQUOTEDIDENTIFIER,
          value: identifier,
        });
      } else if (basicTokens[stream[this._current]] !== undefined) {
        tokens.push({
          start: this._current,
          type: basicTokens[stream[this._current]],
          value: stream[this._current],
        });
        this._current += 1;
      } else if (isNum(stream[this._current])) {
        token = this.consumeNumber(stream);
        tokens.push(token);
      } else if (stream[this._current] === '[') {
        token = this.consumeLBracket(stream);
        tokens.push(token);
      } else if (stream[this._current] === '"') {
        start = this._current;
        identifier = this.consumeQuotedIdentifier(stream);
        tokens.push({
          start,
          type: Token.TOK_QUOTEDIDENTIFIER,
          value: identifier,
        });
      } else if (stream[this._current] === `'`) {
        start = this._current;
        identifier = this.consumeRawStringLiteral(stream);
        tokens.push({
          start,
          type: Token.TOK_LITERAL,
          value: identifier,
        });
      } else if (stream[this._current] === '`') {
        start = this._current;
        const literal = this.consumeLiteral(stream);
        tokens.push({
          start,
          type: Token.TOK_LITERAL,
          value: literal,
        });
      } else if (operatorStartToken[stream[this._current]] !== undefined) {
        token = this.consumeOperator(stream);
        token && tokens.push(token);
      } else if (skipChars[stream[this._current]] !== undefined) {
        this._current += 1;
      } else if (stream[this._current] === '&') {
        start = this._current;
        this._current += 1;
        if (stream[this._current] === '&') {
          this._current += 1;
          tokens.push({ start, type: Token.TOK_AND, value: '&&' });
        } else {
          tokens.push({ start, type: Token.TOK_EXPREF, value: '&' });
        }
      } else if (stream[this._current] === '|') {
        start = this._current;
        this._current += 1;
        if (stream[this._current] === '|') {
          this._current += 1;
          tokens.push({ start, type: Token.TOK_OR, value: '||' });
        } else {
          tokens.push({ start, type: Token.TOK_PIPE, value: '|' });
        }
      } else {
        const error = new Error(`Unknown character: ${stream[this._current]}`);
        error.name = 'LexerError';
        throw error;
      }
    }
    return tokens;
  }

  private consumeUnquotedIdentifier(stream: string): string {
    const start = this._current;
    this._current += 1;
    while (this._current < stream.length && isAlphaNum(stream[this._current])) {
      this._current += 1;
    }
    return stream.slice(start, this._current);
  }

  private consumeQuotedIdentifier(stream: string): string {
    const start = this._current;
    this._current += 1;
    const maxLength = stream.length;
    while (stream[this._current] !== '"' && this._current < maxLength) {
      let current = this._current;
      if (stream[current] === '\\' && (stream[current + 1] === '\\' || stream[current + 1] === '"')) {
        current += 2;
      } else {
        current += 1;
      }
      this._current = current;
    }
    this._current += 1;
    return JSON.parse(stream.slice(start, this._current)) as string;
  }

  private consumeRawStringLiteral(stream: string): string {
    const start = this._current;
    this._current += 1;
    const maxLength = stream.length;
    while (stream[this._current] !== `'` && this._current < maxLength) {
      let current = this._current;
      if (stream[current] === '\\' && (stream[current + 1] === '\\' || stream[current + 1] === `'`)) {
        current += 2;
      } else {
        current += 1;
      }
      this._current = current;
    }
    this._current += 1;
    const literal = stream.slice(start + 1, this._current - 1);
    return literal.replace(`\\'`, `'`);
  }

  private consumeNumber(stream: string): LexerToken {
    const start = this._current;
    this._current += 1;
    const maxLength = stream.length;
    while (isNum(stream[this._current]) && this._current < maxLength) {
      this._current += 1;
    }
    const value = parseInt(stream.slice(start, this._current), 10);
    return { start, value, type: Token.TOK_NUMBER };
  }

  private consumeLBracket(stream: string): LexerToken {
    const start = this._current;
    this._current += 1;
    if (stream[this._current] === '?') {
      this._current += 1;
      return { start, type: Token.TOK_FILTER, value: '[?' };
    }
    if (stream[this._current] === ']') {
      this._current += 1;
      return { start, type: Token.TOK_FLATTEN, value: '[]' };
    }
    return { start, type: Token.TOK_LBRACKET, value: '[' };
  }

  private consumeOperator(stream: string): LexerToken | void {
    const start = this._current;
    const startingChar = stream[start];
    this._current += 1;
    if (startingChar === '!') {
      if (stream[this._current] === '=') {
        this._current += 1;
        return { start, type: Token.TOK_NE, value: '!=' };
      }
      return { start, type: Token.TOK_NOT, value: '!' };
    }
    if (startingChar === '<') {
      if (stream[this._current] === '=') {
        this._current += 1;
        return { start, type: Token.TOK_LTE, value: '<=' };
      }
      return { start, type: Token.TOK_LT, value: '<' };
    }
    if (startingChar === '>') {
      if (stream[this._current] === '=') {
        this._current += 1;
        return { start, type: Token.TOK_GTE, value: '>=' };
      }
      return { start, type: Token.TOK_GT, value: '>' };
    }
    if (startingChar === '=' && stream[this._current] === '=') {
      this._current += 1;
      return { start, type: Token.TOK_EQ, value: '==' };
    }
  }

  private consumeLiteral(stream: string): JSONValue {
    this._current += 1;
    const start = this._current;
    const maxLength = stream.length;

    while (stream[this._current] !== '`' && this._current < maxLength) {
      let current = this._current;
      if (stream[current] === '\\' && (stream[current + 1] === '\\' || stream[current + 1] === '`')) {
        current += 2;
      } else {
        current += 1;
      }
      this._current = current;
    }
    let literalString = stream.slice(start, this._current).trimLeft();
    literalString = literalString.replace('\\`', '`');
    const literal: JSONValue = this.looksLikeJSON(literalString)
      ? (JSON.parse(literalString) as JSONValue)
      : (JSON.parse(`"${literalString}"`) as string);
    this._current += 1;
    return literal;
  }

  private looksLikeJSON(literalString: string): boolean {
    const startingChars = '[{"';
    const jsonLiterals = ['true', 'false', 'null'];
    const numberLooking = '-0123456789';

    if (literalString === '') {
      return false;
    }
    if (startingChars.includes(literalString[0])) {
      return true;
    }
    if (jsonLiterals.includes(literalString)) {
      return true;
    }
    if (numberLooking.includes(literalString[0])) {
      try {
        JSON.parse(literalString);
        return true;
      } catch (ex) {
        return false;
      }
    }
    return false;
  }
}

export const Lexer = new StreamLexer();
export default Lexer;
