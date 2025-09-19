import * as vscode from 'vscode';
import * as path from 'path';

// Delimiter detection for CSV and other delimited files
function detectDelimiter(text: string): string {
    const lines = text.split('\n').slice(0, 5); // Check first 5 lines
    const possibleDelimiters = [',', '\t', '|', ';', ':', ' '];
    const delimiterCounts: { [key: string]: number } = {};
    
    // Count occurrences of each delimiter
    for (const delimiter of possibleDelimiters) {
        delimiterCounts[delimiter] = 0;
        for (const line of lines) {
            if (line.trim()) {
                // Don't count delimiters inside quoted strings
                let inQuotes = false;
                let quoteChar = '';
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if ((char === '"' || char === "'") && !inQuotes) {
                        inQuotes = true;
                        quoteChar = char;
                    } else if (char === quoteChar && inQuotes) {
                        inQuotes = false;
                        quoteChar = '';
                    } else if (!inQuotes && char === delimiter) {
                        delimiterCounts[delimiter]++;
                    }
                }
            }
        }
    }
    
    // Find the delimiter with the highest count
    let maxCount = 0;
    let bestDelimiter = ','; // Default to comma
    
    for (const [delimiter, count] of Object.entries(delimiterCounts)) {
        if (count > maxCount) {
            maxCount = count;
            bestDelimiter = delimiter;
        }
    }
    
    return bestDelimiter;
}

function getDelimiterName(delimiter: string): string {
    const delimiterNames: { [key: string]: string } = {
        ',': 'CSV (Comma-Separated)',
        '\t': 'TSV (Tab-Separated)', 
        '|': 'PSV (Pipe-Separated)',
        ';': 'SSV (Semicolon-Separated)',
        ':': 'CSV (Colon-Separated)',
        ' ': 'SSV (Space-Separated)'
    };
    return delimiterNames[delimiter] || 'Delimited';
}

// Color coding functions
function getLanguageColors(language: string): { [key: string]: string } {
    // Basic syntax highlighting color schemes
    const colorSchemes: { [key: string]: { [key: string]: string } } = {
        javascript: {
            keyword: '#569CD6',      // Blue
            string: '#CE9178',       // Orange
            comment: '#6A9955',      // Green
            function: '#DCDCAA',     // Yellow
            number: '#B5CEA8',       // Light green
            operator: '#D4D4D4'      // Light gray
        },
        typescript: {
            keyword: '#569CD6',
            string: '#CE9178', 
            comment: '#6A9955',
            function: '#DCDCAA',
            number: '#B5CEA8',
            operator: '#D4D4D4',
            type: '#4EC9B0'          // Teal for types
        },
        python: {
            keyword: '#569CD6',
            string: '#CE9178',
            comment: '#6A9955', 
            function: '#DCDCAA',
            number: '#B5CEA8',
            operator: '#D4D4D4'
        },
        csharp: {
            keyword: '#569CD6',      // Blue for keywords
            string: '#D69D85',       // Orange for strings
            comment: '#57A64A',      // Green for comments
            function: '#DCDCAA',     // Yellow for methods
            number: '#B5CEA8',       // Light green for numbers
            type: '#4EC9B0',         // Teal for types/classes
            attribute: '#9CDCFE',    // Light blue for attributes
            operator: '#D4D4D4'      // Light gray for operators
        },
        xml: {
            tag: '#569CD6',          // Blue for tags
            attribute: '#9CDCFE',    // Light blue for attributes
            attributeValue: '#CE9178', // Orange for attribute values
            text: '#D4D4D4',         // Light gray for text content
            comment: '#6A9955',      // Green for comments
            cdata: '#D7BA7D',        // Yellow for CDATA
            doctype: '#C586C0'       // Purple for DOCTYPE
        },
        html: {
            tag: '#569CD6',          // Blue for HTML tags
            attribute: '#9CDCFE',    // Light blue for attributes
            attributeValue: '#CE9178', // Orange for attribute values
            text: '#D4D4D4',         // Light gray for text content
            comment: '#6A9955',      // Green for comments
            doctype: '#C586C0'       // Purple for DOCTYPE
        },
        yaml: {
            key: '#9CDCFE',          // Light blue for keys
            string: '#CE9178',       // Orange for strings
            number: '#B5CEA8',       // Light green for numbers
            boolean: '#569CD6',      // Blue for true/false
            null: '#569CD6',         // Blue for null
            comment: '#6A9955',      // Green for comments
            operator: '#D4D4D4',     // Light gray for : - |
            anchor: '#DCDCAA'        // Yellow for anchors &refs
        },
        css: {
            selector: '#D7BA7D',        // Yellow for selectors
            property: '#9CDCFE',        // Light blue for properties
            value: '#CE9178',           // Orange for values
            comment: '#6A9955',         // Green for comments
            string: '#CE9178',          // Orange for strings
            number: '#B5CEA8',          // Light green for numbers
            unit: '#B5CEA8',            // Light green for units (px, em, etc.)
            atRule: '#C586C0',          // Purple for @media, @import, etc.
            pseudoClass: '#DCDCAA',     // Yellow for :hover, ::before, etc.
            important: '#F44747',       // Red for !important
            function: '#DCDCAA'         // Yellow for CSS functions
        },
        delimited: {
            header: '#9CDCFE',       // Light blue for headers (first row)
            string: '#CE9178',       // Orange for quoted strings
            number: '#B5CEA8',       // Light green for numbers
            separator: '#D4D4D4',    // Light gray for delimiters
            quote: '#569CD6'         // Blue for quotes
        },
        json: {
            key: '#9CDCFE',          // Light blue
            string: '#CE9178',       // Orange
            number: '#B5CEA8',       // Light green
            boolean: '#569CD6',      // Blue
            null: '#569CD6'          // Blue
        },
        default: {
            keyword: '#569CD6',
            string: '#CE9178',
            comment: '#6A9955',
            function: '#DCDCAA',
            number: '#B5CEA8',
            operator: '#D4D4D4'
        }
    };
    
    return colorSchemes[language] || colorSchemes.default;
}

function addBasicSyntaxHighlighting(code: string, language: string): string {
    const colors = getLanguageColors(language);
    let highlightedCode = code;
    
    // Basic highlighting patterns
    const patterns: { [key: string]: RegExp } = {
        // JavaScript/TypeScript keywords
        keyword: /\b(function|const|let|var|if|else|for|while|return|class|import|export|async|await|try|catch|throw|new|this|super|extends|implements|interface|type|enum|namespace|public|private|protected|static|readonly)\b/g,
        // Strings
        string: /(["'`])((?:(?!\1)[^\\]|\\.)*)(\1)/g,
        // Single line comments
        comment: /(\/\/.*$|#.*$)/gm,
        // Multi-line comments
        multiComment: /(\/\*[\s\S]*?\*\/)/g,
        // Numbers
        number: /\b\d+\.?\d*\b/g,
        // Functions (basic pattern)
        function: /\b(\w+)(?=\s*\()/g
    };
    
    // Apply highlighting based on language
    switch (language) {
        case 'javascript':
        case 'typescript':
            highlightedCode = highlightedCode
                .replace(patterns.multiComment, `<span style="color: ${colors.comment}">$1</span>`)
                .replace(patterns.comment, `<span style="color: ${colors.comment}">$1</span>`)
                .replace(patterns.string, `<span style="color: ${colors.string}">$1$2$3</span>`)
                .replace(patterns.keyword, `<span style="color: ${colors.keyword}">$1</span>`)
                .replace(patterns.number, `<span style="color: ${colors.number}">// Context detection functions</span>`)
                .replace(patterns.function, `<span style="color: ${colors.function}">$1</span>`);
            break;
            
        case 'python':
            const pythonKeywords = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|and|or|not|in|is|None|True|False|pass|break|continue|global|nonlocal|assert|del|yield|raise)\b/g;
            highlightedCode = highlightedCode
                .replace(patterns.comment, `<span style="color: ${colors.comment}">$1</span>`)
                .replace(patterns.string, `<span style="color: ${colors.string}">$1$2$3</span>`)
                .replace(pythonKeywords, `<span style="color: ${colors.keyword}">$1</span>`)
                .replace(patterns.number, `<span style="color: ${colors.number}">// Context detection functions</span>`)
                .replace(patterns.function, `<span style="color: ${colors.function}">$1</span>`);
            break;
            
        case 'json':
            const jsonPatterns = {
                key: /"([^"]+)"\s*:/g,
                string: /"([^"]*)"/g,
                number: /:\s*(-?\d+\.?\d*)/g,
                boolean: /\b(true|false)\b/g,
                null: /\bnull\b/g
            };
            highlightedCode = highlightedCode
                .replace(jsonPatterns.key, `<span style="color: ${colors.key}">"$1"</span>:`)
                .replace(jsonPatterns.string, `<span style="color: ${colors.string}">"$1"</span>`)
                .replace(jsonPatterns.number, `: <span style="color: ${colors.number}">$1</span>`)
                .replace(jsonPatterns.boolean, `<span style="color: ${colors.boolean}">$1</span>`)
                .replace(jsonPatterns.null, `<span style="color: ${colors.null}">$1</span>`);
            break;
    }
    
    return highlightedCode;
}

function generateAnsiColoredText(code: string, language: string): string {
    // ANSI color codes for terminal output
    const ansiColors = {
        reset: '\x1b[0m',
        keyword: '\x1b[34m',      // Blue
        string: '\x1b[33m',       // Yellow  
        comment: '\x1b[32m',      // Green
        function: '\x1b[35m',     // Magenta
        number: '\x1b[36m',       // Cyan
        operator: '\x1b[37m'      // White
    };
    
    let coloredCode = code;
    
    // Basic ANSI coloring (simplified)
    switch (language) {
        case 'javascript':
        case 'typescript':
            coloredCode = coloredCode
                .replace(/\b(function|const|let|var|if|else|for|while|return|class)\b/g, 
                         `${ansiColors.keyword}$1${ansiColors.reset}`)
                .replace(/(["'`])((?:(?!\1)[^\\]|\\.)*)(\1)/g, 
                         `${ansiColors.string}$1$2$3${ansiColors.reset}`)
                .replace(/(\/\/.*$)/gm, 
                         `${ansiColors.comment}$1${ansiColors.reset}`)
                .replace(/\b\d+\.?\d*\b/g, 
                         `${ansiColors.number}// Context detection functions${ansiColors.reset}`);
            break;
    }
    
    return coloredCode;
}
function getJsonPath(document: vscode.TextDocument, position: vscode.Position): string | null {
    try {
        const text = document.getText();
        const offset = document.offsetAt(position);
        
        // Find the JSON path by parsing and tracking position
        const jsonObj = JSON.parse(text);
        return findJsonPath(text, offset);
    } catch (error) {
        return null;
    }
}

function findJsonPath(jsonText: string, targetOffset: number): string | null {
    try {
        const path: string[] = [];
        let currentOffset = 0;
        let inString = false;
        let inKey = false;
        let currentKey = '';
        let arrayIndex = 0;
        const bracketStack: { type: 'object' | 'array', key?: string, index?: number }[] = [];
        
        for (let i = 0; i < jsonText.length && i <= targetOffset; i++) {
            const char = jsonText[i];
            const prevChar = i > 0 ? jsonText[i - 1] : '';
            
            if (char === '"' && prevChar !== '\\') {
                inString = !inString;
                if (!inString && inKey) {
                    currentKey = jsonText.substring(currentOffset + 1, i);
                    inKey = false;
                }
                if (inString) {
                    currentOffset = i;
                    // Check if this might be a key (followed by :)
                    let j = i + 1;
                    while (j < jsonText.length && /\s/.test(jsonText[j])) j++;
                    if (j < jsonText.length && jsonText[j] === ':') {
                        inKey = true;
                    }
                }
            } else if (!inString) {
                if (char === '{') {
                    bracketStack.push({ type: 'object', key: currentKey });
                    if (currentKey) {
                        path.push(currentKey);
                        currentKey = '';
                    }
                } else if (char === '[') {
                    bracketStack.push({ type: 'array', index: 0 });
                    if (currentKey) {
                        path.push(currentKey);
                        currentKey = '';
                    }
                } else if (char === '}' || char === ']') {
                    const popped = bracketStack.pop();
                    if (popped && path.length > 0) {
                        path.pop();
                    }
                } else if (char === ',' && bracketStack.length > 0) {
                    const top = bracketStack[bracketStack.length - 1];
                    if (top.type === 'array') {
                        top.index = (top.index || 0) + 1;
                    }
                }
            }
            
            if (i >= targetOffset) {
                // Build the final path
                const finalPath = [...path];
                const top = bracketStack[bracketStack.length - 1];
                if (top) {
                    if (top.type === 'array' && typeof top.index === 'number') {
                        finalPath.push(`[${top.index}]`);
                    } else if (currentKey) {
                        finalPath.push(currentKey);
                    }
                }
                return finalPath.length > 0 ? finalPath.join('.').replace(/\.\[/g, '[') : null;
            }
        }
        
        return path.length > 0 ? path.join('.') : null;
    } catch (error) {
        return null;
    }
}

function getXmlPath(document: vscode.TextDocument, position: vscode.Position): string | null {
    try {
        const text = document.getText();
        const lines = text.split('\n');
        const currentLine = position.line;
        
        const path: string[] = [];
        const tagStack: string[] = [];
        
        // Parse from beginning to current position to build XML path
        for (let i = 0; i <= currentLine; i++) {
            const line = lines[i];
            const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-_]*)[^>]*>/g;
            let match;
            
            while ((match = tagRegex.exec(line)) !== null) {
                if (i === currentLine && match.index > position.character) {
                    break;
                }
                
                const fullTag = match[0];
                const tagName = match[1];
                
                if (fullTag.startsWith('</')) {
                    // Closing tag
                    tagStack.pop();
                } else if (!fullTag.endsWith('/>')) {
                    // Opening tag (not self-closing)
                    tagStack.push(tagName);
                }
            }
        }
        
        return tagStack.length > 0 ? tagStack.join(' > ') : null;
    } catch (error) {
        return null;
    }
}

function getDelimitedContext(document: vscode.TextDocument, position: vscode.Position): string | null {
    try {
        const text = document.getText();
        const delimiter = detectDelimiter(text);
        const delimiterName = getDelimiterName(delimiter);
        const lines = text.split('\n');
        
        if (lines.length === 0) return null;
        
        // Get column information if possible
        const firstLine = lines[0];
        if (firstLine) {
            const headers = firstLine.split(delimiter);
            const currentColumn = position.character;
            
            // Find which column we're in
            let columnIndex = 0;
            let charCount = 0;
            
            for (let i = 0; i < headers.length; i++) {
                charCount += headers[i].length;
                if (currentColumn <= charCount) {
                    columnIndex = i;
                    break;
                }
                charCount += delimiter.length; // Account for delimiter
            }
            
            if (columnIndex < headers.length) {
                const columnName = headers[columnIndex].trim().replace(/["']/g, '');
                return `${delimiterName} > Column: ${columnName}`;
            }
        }
        
        return delimiterName;
    } catch (error) {
        return null;
    }
}

function getCssContext(document: vscode.TextDocument, position: vscode.Position): string | null {
    try {
        const text = document.getText();
        const lines = text.split('\n');
        const currentLine = position.line;
        
        const context: string[] = [];
        let braceDepth = 0;
        
        // Parse from beginning to current position to build CSS context
        for (let i = 0; i <= currentLine; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and full-line comments
            if (!line || line.startsWith('/*')) {
                continue;
            }
            
            // Check for media queries and other at-rules
            const atRuleMatch = line.match(/^(@[\w-]+)(?:\s+([^{]+))?/);
            if (atRuleMatch) {
                const atRule = atRuleMatch[1];
                const condition = atRuleMatch[2];
                if (condition) {
                    context.push(`${atRule} ${condition.trim()}`);
                } else {
                    context.push(atRule);
                }
                if (line.includes('{')) {
                    braceDepth++;
                }
                continue;
            }
            
            // Check for CSS selectors
            const selectorMatch = line.match(/^([^{]+)\s*{/);
            if (selectorMatch) {
                let selector = selectorMatch[1].trim();
                // Clean up selector for readability
                selector = selector.replace(/\s+/g, ' ');
                context.push(selector);
                braceDepth++;
                continue;
            }
            
            // Count braces to track nesting level
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            
            for (let j = 0; j < closeBraces; j++) {
                if (braceDepth > 0) {
                    braceDepth--;
                    if (context.length > braceDepth) {
                        context.pop();
                    }
                }
            }
            
            braceDepth += openBraces;
            
            // Stop if we've gone too far back
            if (i < currentLine - 50) {
                break;
            }
        }
        
        return context.length > 0 ? context.join(' > ') : null;
    } catch (error) {
        return null;
    }
}

function getProgrammingContext(document: vscode.TextDocument, position: vscode.Position): string | null {
    const text = document.getText();
    const lines = text.split('\n');
    const currentLine = position.line;
    const language = document.languageId;
    
    const context: string[] = [];
    
    try {
        // Look backwards from current position to find enclosing scopes
        for (let i = currentLine; i >= 0; i--) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
                continue;
            }
            
            let match;
            
            // Language-specific patterns
            switch (language) {
                case 'javascript':
                case 'typescript':
                case 'java':
                case 'csharp':
                case 'cs':
                    // Function patterns
                    match = line.match(/(?:function\s+(\w+)|(\w+)\s*\(.*\)\s*{|(\w+)\s*:\s*function|(\w+)\s*=\s*\(.*\)\s*=>|(\w+)\s*=\s*function)/);
                    if (match) {
                        const funcName = match[1] || match[2] || match[3] || match[4] || match[5];
                        if (!context.includes(funcName)) {
                            context.unshift(funcName);
                        }
                    }
                    
                    // Class patterns
                    match = line.match(/class\s+(\w+)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    
                    // C# specific patterns
                    if (language === 'csharp' || language === 'cs') {
                        // Method patterns
                        match = line.match(/(?:public|private|protected|internal|static)?\s*(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*{/);
                        if (match && i !== currentLine) {
                            const methodName = match[1];
                            if (!context.includes(methodName) && !['if', 'for', 'while', 'switch', 'catch', 'using'].includes(methodName)) {
                                context.unshift(methodName);
                            }
                        }
                        
                        // Namespace patterns
                        match = line.match(/namespace\s+([\w\.]+)/);
                        if (match && !context.includes(match[1])) {
                            context.unshift(match[1]);
                        }
                        
                        // Interface patterns
                        match = line.match(/interface\s+(\w+)/);
                        if (match && !context.includes(match[1])) {
                            context.unshift(match[1]);
                        }
                        
                        // Struct patterns
                        match = line.match(/struct\s+(\w+)/);
                        if (match && !context.includes(match[1])) {
                            context.unshift(match[1]);
                        }
                    } else {
                        // Method patterns in classes for JS/TS/Java
                        match = line.match(/(\w+)\s*\([^)]*\)\s*{/);
                        if (match && i !== currentLine) {
                            const methodName = match[1];
                            if (!context.includes(methodName) && !['if', 'for', 'while', 'switch', 'catch'].includes(methodName)) {
                                context.unshift(methodName);
                            }
                        }
                    }
                    break;
                    
                case 'python':
                    // Function/method patterns
                    match = line.match(/def\s+(\w+)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    
                    // Class patterns
                    match = line.match(/class\s+(\w+)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    break;
                    
                case 'cpp':
                case 'c':
                    // Function patterns
                    match = line.match(/(?:[\w:]+\s+)?(\w+)\s*\([^)]*\)\s*{/);
                    if (match && !context.includes(match[1])) {
                        const funcName = match[1];
                        if (!['if', 'for', 'while', 'switch', 'catch'].includes(funcName)) {
                            context.unshift(funcName);
                        }
                    }
                    
                    // Class patterns
                    match = line.match(/class\s+(\w+)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    break;
                    
                case 'go':
                    // Function patterns
                    match = line.match(/func(?:\s+\([^)]+\))?\s+(\w+)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    
                    // Struct/interface patterns
                    match = line.match(/type\s+(\w+)\s+(?:struct|interface)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    break;
                    
                case 'rust':
                    // Function patterns
                    match = line.match(/fn\s+(\w+)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    
                    // Impl/struct patterns
                    match = line.match(/(?:struct|impl|enum)\s+(\w+)/);
                    if (match && !context.includes(match[1])) {
                        context.unshift(match[1]);
                    }
                    break;
            }
            
            // Stop if we've found enough context or gone too far back
            if (context.length >= 3 || i < currentLine - 100) {
                break;
            }
        }
        
        return context.length > 0 ? context.join(' > ') : null;
    } catch (error) {
        return null;
    }
}

function getDocumentContext(document: vscode.TextDocument, position: vscode.Position): string | null {
    const language = document.languageId;
    const filename = document.fileName.toLowerCase();
    
    switch (language) {
        case 'json':
        case 'jsonc':
            return getJsonPath(document, position);
        case 'xml':
        case 'html':
        case 'xhtml':
        case 'htm':
            return getXmlPath(document, position);
        case 'javascript':
        case 'typescript':
        case 'python':
        case 'java':
        case 'csharp':
        case 'cs':
        case 'cpp':
        case 'c':
        case 'go':
        case 'rust':
            return getProgrammingContext(document, position);
        case 'css':
        case 'scss':
        case 'sass':
        case 'less':
            return getCssContext(document, position);
        case 'csv':
        case 'tsv':
        case 'psv':
        case 'ssv':
        case 'dsv':
            return getDelimitedContext(document, position);
        case 'yaml':
        case 'yml':
            // For YAML, we could implement a path detector similar to JSON
            // For now, return null but this could be extended
            return null;
        default:
            // Check by file extension for files VS Code might not recognize
            if (filename.endsWith('.csv') || filename.endsWith('.tsv') || 
                filename.endsWith('.psv') || filename.endsWith('.ssv') ||
                filename.endsWith('.dsv') || filename.endsWith('.txt')) {
                return getDelimitedContext(document, position);
            }
            return null;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Copy with Context extension is now active!');

    // Register the copy with context command
    let disposable = vscode.commands.registerCommand('copyWithContext.copySelection', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        
        // Get filename - handle unsaved files
        const fileName = document.fileName;
        const displayName = document.isUntitled 
            ? 'Untitled' 
            : path.basename(fileName);

        let selectedText: string;
        let startLine: number;
        let endLine: number;

        if (selection.isEmpty) {
            // If no selection, copy the current line
            const currentLine = selection.active.line;
            selectedText = document.lineAt(currentLine).text;
            startLine = currentLine + 1; // VS Code uses 0-based, but display 1-based
            endLine = startLine;
        } else {
            // Copy the selected text
            selectedText = document.getText(selection);
            startLine = selection.start.line + 1;
            endLine = selection.end.line + 1;
        }

        // Get configuration settings
        const config = vscode.workspace.getConfiguration('copyWithContext');
        const showLineNumbers = config.get<boolean>('showLineNumbers', true);
        const useLineNumberPadding = config.get<boolean>('lineNumberPadding', false);
        const showContextPath = config.get<boolean>('showContextPath', true);
        const enableColorCoding = config.get<boolean>('enableColorCoding', false);

        // Get contextual information
        const contextPath = showContextPath ? getDocumentContext(document, selection.start) : null;
        
        // Format the output with optional line numbers on each line
        let output = '';
        
        // Add file context
        if (startLine === endLine) {
            output += `// ${displayName}:${startLine}`;
        } else {
            output += `// ${displayName}:${startLine}-${endLine}`;
        }
        
        // Add contextual path if available
        if (contextPath) {
            output += ` (${contextPath})`;
        }
        output += '\n';
        
        if (enableColorCoding) {
            // Generate HTML formatted output with syntax highlighting
            let codeContent: string;
            if (showLineNumbers) {
                const lines = selectedText.split('\n');
                const maxLineNumber = startLine + lines.length - 1;
                const padding = useLineNumberPadding ? maxLineNumber.toString().length : 0;
                
                const numberedLines = lines.map((line, index) => {
                    const lineNumber = startLine + index;
                    const paddedLineNumber = useLineNumberPadding 
                        ? lineNumber.toString().padStart(padding, ' ')
                        : lineNumber.toString();
                    return `${paddedLineNumber}: ${line}`;
                });
                codeContent = numberedLines.join('\n');
            } else {
                codeContent = selectedText;
            }
            
            const language = document.languageId;
            const highlightedCode = addBasicSyntaxHighlighting(codeContent, language);
            const displayInfo = `${displayName}:${startLine === endLine ? startLine : `${startLine}-${endLine}`}${contextPath ? ` (${contextPath})` : ''}`;
            
            output = `<div style="font-family: 'Consolas', 'Monaco', monospace; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px;">
<div style="color: #6a9955; margin-bottom: 8px;">// ${displayInfo}</div>
<pre style="margin: 0; white-space: pre-wrap;">${highlightedCode}</pre>
</div>`;
        } else {
            // Regular plain text format
            if (showLineNumbers) {
                const lines = selectedText.split('\n');
                const maxLineNumber = startLine + lines.length - 1;
                const padding = useLineNumberPadding ? maxLineNumber.toString().length : 0;
                
                const numberedLines = lines.map((line, index) => {
                    const lineNumber = startLine + index;
                    const paddedLineNumber = useLineNumberPadding 
                        ? lineNumber.toString().padStart(padding, ' ')
                        : lineNumber.toString();
                    return `${paddedLineNumber}: ${line}`;
                });
                
                output += numberedLines.join('\n');
            } else {
                output += selectedText;
            }
        }

        // Copy to clipboard
        try {
            await vscode.env.clipboard.writeText(output);
            
            // Show success message
            const lineInfo = startLine === endLine 
                ? `line ${startLine}` 
                : `lines ${startLine}-${endLine}`;
            
            vscode.window.showInformationMessage(
                `Copied code from ${displayName} (${lineInfo}) to clipboard`
            );
        } catch (error) {
            vscode.window.showErrorMessage('Failed to copy to clipboard');
            console.error('Copy failed:', error);
        }
    });

    context.subscriptions.push(disposable);

    // Register a command for copying with custom format
    let customDisposable = vscode.commands.registerCommand('copyWithContext.copySelectionCustom', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        // Show input box for custom format
        const format = await vscode.window.showQuickPick([
            { 
                label: 'Comment Style', 
                description: '// filename:line',
                value: 'comment'
            },
            { 
                label: 'Markdown Style', 
                description: '```language\n// filename:line\ncode\n```',
                value: 'markdown'
            },
            { 
                label: 'HTML with Syntax Highlighting', 
                description: 'Colored HTML format',
                value: 'html'
            },
            { 
                label: 'ANSI Colored (Terminal)', 
                description: 'Colored text for terminal/console',
                value: 'ansi'
            },
            { 
                label: 'Full Path', 
                description: 'Include full file path',
                value: 'fullpath'
            }
        ], {
            placeHolder: 'Choose output format'
        });

        if (!format) {
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        
        // Get filename
        const fileName = document.fileName;
        const displayName = format.value === 'fullpath' 
            ? (document.isUntitled ? 'Untitled' : fileName)
            : (document.isUntitled ? 'Untitled' : path.basename(fileName));

        let selectedText: string;
        let startLine: number;
        let endLine: number;

        if (selection.isEmpty) {
            const currentLine = selection.active.line;
            selectedText = document.lineAt(currentLine).text;
            startLine = currentLine + 1;
            endLine = startLine;
        } else {
            selectedText = document.getText(selection);
            startLine = selection.start.line + 1;
            endLine = selection.end.line + 1;
        }

        // Get configuration settings
        const config = vscode.workspace.getConfiguration('copyWithContext');
        const showLineNumbers = config.get<boolean>('showLineNumbers', true);
        const useLineNumberPadding = config.get<boolean>('lineNumberPadding', false);
        const showContextPath = config.get<boolean>('showContextPath', true);

        // Get contextual information
        const contextPath = showContextPath ? getDocumentContext(document, selection.start) : null;

        let output = '';
        const lineInfo = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
        
        // Create display name with context
        let displayInfo = format.value === 'fullpath' 
            ? (document.isUntitled ? 'Untitled' : fileName)
            : (document.isUntitled ? 'Untitled' : path.basename(fileName));
        
        displayInfo += `:${lineInfo}`;
        if (contextPath) {
            displayInfo += ` (${contextPath})`;
        }
        
        let codeContent: string;
        if (showLineNumbers) {
            // Split the selected text into lines and add line numbers
            const lines = selectedText.split('\n');
            const maxLineNumber = startLine + lines.length - 1;
            const padding = useLineNumberPadding ? maxLineNumber.toString().length : 0;
            
            const numberedLines = lines.map((line, index) => {
                const lineNumber = startLine + index;
                const paddedLineNumber = useLineNumberPadding 
                    ? lineNumber.toString().padStart(padding, ' ')
                    : lineNumber.toString();
                return `${paddedLineNumber}: ${line}`;
            });
            codeContent = numberedLines.join('\n');
        } else {
            codeContent = selectedText;
        }

        switch (format.value) {
            case 'comment':
                output = `// ${displayInfo}\n${codeContent}`;
                break;
            case 'markdown':
                const language = document.languageId;
                output = `\`\`\`${language}\n// ${displayInfo}\n${codeContent}\n\`\`\``;
                break;
            case 'html':
                const htmlLanguage = document.languageId;
                const highlightedCode = addBasicSyntaxHighlighting(codeContent, htmlLanguage);
                output = `<div style="font-family: 'Consolas', 'Monaco', monospace; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px;">
<div style="color: #6a9955; margin-bottom: 8px;">// ${displayInfo}</div>
<pre style="margin: 0; white-space: pre-wrap;">${highlightedCode}</pre>
</div>`;
                break;
            case 'ansi':
                const ansiLanguage = document.languageId;
                const ansiColoredCode = generateAnsiColoredText(codeContent, ansiLanguage);
                output = `\x1b[32m// ${displayInfo}\x1b[0m\n${ansiColoredCode}`;
                break;
            case 'fullpath':
                output = `// ${displayInfo}\n${codeContent}`;
                break;
        }

        try {
            await vscode.env.clipboard.writeText(output);
            vscode.window.showInformationMessage(`Copied with ${format.label} format`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to copy to clipboard');
        }
    });

    context.subscriptions.push(customDisposable);

    // Register a command for copying with colored HTML format
    let htmlDisposable = vscode.commands.registerCommand('copyWithContext.copySelectionHTML', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        
        // Get filename
        const fileName = document.fileName;
        const displayName = document.isUntitled 
            ? 'Untitled' 
            : path.basename(fileName);

        let selectedText: string;
        let startLine: number;
        let endLine: number;

        if (selection.isEmpty) {
            const currentLine = selection.active.line;
            selectedText = document.lineAt(currentLine).text;
            startLine = currentLine + 1;
            endLine = startLine;
        } else {
            selectedText = document.getText(selection);
            startLine = selection.start.line + 1;
            endLine = selection.end.line + 1;
        }

        // Get configuration settings
        const config = vscode.workspace.getConfiguration('copyWithContext');
        const showLineNumbers = config.get<boolean>('showLineNumbers', true);
        const useLineNumberPadding = config.get<boolean>('lineNumberPadding', false);
        const showContextPath = config.get<boolean>('showContextPath', true);

        // Get contextual information
        const contextPath = showContextPath ? getDocumentContext(document, selection.start) : null;

        const lineInfo = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
        let displayInfo = `${displayName}:${lineInfo}`;
        if (contextPath) {
            displayInfo += ` (${contextPath})`;
        }
        
        // Generate line-numbered content
        let codeContent: string;
        if (showLineNumbers) {
            const lines = selectedText.split('\n');
            const maxLineNumber = startLine + lines.length - 1;
            const padding = useLineNumberPadding ? maxLineNumber.toString().length : 0;
            
            const numberedLines = lines.map((line, index) => {
                const lineNumber = startLine + index;
                const paddedLineNumber = useLineNumberPadding 
                    ? lineNumber.toString().padStart(padding, ' ')
                    : lineNumber.toString();
                return `${paddedLineNumber}: ${line}`;
            });
            codeContent = numberedLines.join('\n');
        } else {
            codeContent = selectedText;
        }

        // Generate HTML with syntax highlighting
        const language = document.languageId;
        const highlightedCode = addBasicSyntaxHighlighting(codeContent, language);
        
        const htmlOutput = `<div style="font-family: 'Consolas', 'Monaco', monospace; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px;">
<div style="color: #6a9955; margin-bottom: 8px;">// ${displayInfo}</div>
<pre style="margin: 0; white-space: pre-wrap;">${highlightedCode}</pre>
</div>`;

        try {
            await vscode.env.clipboard.writeText(htmlOutput);
            vscode.window.showInformationMessage(`Copied colored HTML code from ${displayName} (${lineInfo}) to clipboard`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to copy to clipboard');
            console.error('Copy failed:', error);
        }
    });

    context.subscriptions.push(htmlDisposable);
}

export function deactivate() {}
