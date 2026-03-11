import type { QueryNode } from './types'

export type TokenType = 'AND' | 'OR' | 'NOT' | 'LPAREN' | 'RPAREN' | 'TERM'

export interface Token {
    type: TokenType
    value: string
}

export function tokenize(str: string): Token[] {
    const tokens: Token[] = []
    let i = 0

    while (i < str.length) {
        const char = str[i]
        if (/\s/.test(char)) {
            i++
            continue
        }

        if (char === '(') {
            tokens.push({ type: 'LPAREN', value: '(' })
            i++
        } else if (char === ')') {
            tokens.push({ type: 'RPAREN', value: ')' })
            i++
        } else if (char === '"') {
            // String literal
            let val = '"'
            i++
            while (i < str.length && str[i] !== '"') {
                val += str[i]
                i++
            }
            if (i < str.length) {
                val += '"'
                i++
            }
            tokens.push({ type: 'TERM', value: val })
        } else {
            // Find end of token
            let val = ''
            // It can be a term like !React, or AND, OR, NOT
            while (i < str.length && !/\s/.test(str[i]) && str[i] !== '(' && str[i] !== ')') {
                if (str[i] === '"') break; // start of string literal without space
                val += str[i]
                i++
            }

            const upperVal = val.toUpperCase()
            if (upperVal === 'AND') {
                tokens.push({ type: 'AND', value: val })
            } else if (upperVal === 'OR') {
                tokens.push({ type: 'OR', value: val })
            } else if (upperVal === 'NOT') {
                tokens.push({ type: 'NOT', value: val })
            } else if (val) {
                tokens.push({ type: 'TERM', value: val })
            }
        }
    }

    return tokens
}

export function parseQuery(query: string, generateId: () => string): QueryNode[] {
    if (!query || !query.trim()) return []

    const tokens = tokenize(query)
    if (!tokens.length) return []

    let current = 0

    function createLeaf(text: string): QueryNode {
        let exact = false
        let cleanText = text

        if (cleanText.startsWith('!')) {
            exact = true
            cleanText = cleanText.substring(1)
        }

        // strip quotes if they encompass the whole word (and they usually do)
        if (cleanText.startsWith('"') && cleanText.endsWith('"') && cleanText.length >= 2) {
            cleanText = cleanText.substring(1, cleanText.length - 1)
        }

        return {
            key: generateId(),
            type: 'LEAF',
            exact,
            text: cleanText
        }
    }

    // Recursive Descent Parser
    // We want to build an AST that mirrors the structure. 
    // By default, terms separated by spaces or AND are AND-ed. 
    // OR has lower precedence than AND. NOT is unary.

    function parseExpression(): QueryNode {
        const nodes: QueryNode[] = []

        // An expression is a series of OR terms
        const firstTerm = parseAndExpression()
        nodes.push(firstTerm)

        while (current < tokens.length && tokens[current].type === 'OR') {
            current++ // skip OR
            nodes.push(parseAndExpression())
        }

        if (nodes.length === 1) return nodes[0]

        return {
            key: generateId(),
            type: 'GROUP',
            operator: 'OR',
            children: nodes
        }
    }

    function parseAndExpression(): QueryNode {
        const nodes: QueryNode[] = []

        nodes.push(parseNotExpression())

        // Implicit AND (two terms next to each other) or explicit AND
        while (current < tokens.length && (tokens[current].type === 'AND' || tokens[current].type === 'TERM' || tokens[current].type === 'LPAREN' || tokens[current].type === 'NOT')) {
            if (tokens[current].type === 'AND') {
                current++ // skip AND
                if (current >= tokens.length) break
            }
            nodes.push(parseNotExpression())
        }

        if (nodes.length === 1) return nodes[0]

        return {
            key: generateId(),
            type: 'GROUP',
            operator: 'AND',
            children: nodes
        }
    }

    function parseNotExpression(): QueryNode {
        if (current < tokens.length && tokens[current].type === 'NOT') {
            current++ // skip NOT
            const node = parsePrimary()
            return {
                key: generateId(),
                type: 'GROUP',
                operator: 'NOT',
                children: [node]
            }
        }
        return parsePrimary()
    }

    function parsePrimary(): QueryNode {
        if (current >= tokens.length) {
            // Unexpected EOF, return empty leaf
            return createLeaf('')
        }

        const token = tokens[current]

        if (token.type === 'LPAREN') {
            current++ // skip (
            const node = parseExpression()
            if (current < tokens.length && tokens[current].type === 'RPAREN') {
                current++ // skip )
            }
            return node
        }

        if (token.type === 'TERM') {
            current++
            return createLeaf(token.value)
        }

        // Unexpected token, treat as text
        current++
        return createLeaf(token.value)
    }

    const root = parseExpression()

    // HeadHunter syntax might return a single expression, but our Query Builder 
    // inherently expects a ROOT group (usually AND). If root isn't a GROUP, wrap it.
    if (root.type === 'LEAF') {
        return [{
            key: generateId(),
            type: 'GROUP',
            operator: 'AND',
            children: [root]
        }]
    }

    return [root]
}
