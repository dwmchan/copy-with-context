import * as vscode from 'vscode';
import * as path from 'path';

// Safety wrapper for any operation
function safeExecute<T>(operation: () => T, fallback: T, context: string): T {
    try {
        return operation();
    } catch (error) {
        console.error(`${context} failed:`, error);
        return fallback;
    }
}

// File size validation
function validateFileSize(document: vscode.TextDocument): boolean {
    const config = vscode.workspace.getConfiguration('copyWithContext');
    const maxSize = config.get<number>('maxFileSize', 5000000); // 5MB default
    const text = document.getText();
    
    if (text.length > maxSize) {
        const sizeMB = Math.round(text.length / 1024 / 1024);
        vscode.window.showWarningMessage(
            `File is too large (${sizeMB}MB). Select a smaller portion.`
        );
        return false;
    }
    return true;
}

// Safe command executor
async function safeExecuteCommand(commandHandler: () => Promise<void>): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
    }

    if (!validateFileSize(editor.document)) {
        return;
    }

    try {
        await commandHandler();
    } catch (error) {
        console.error('Command execution failed:', error);
        vscode.window.showErrorMessage('Operation failed. Please try again with a smaller selection.');
    }
}

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
                .replace(patterns.number, `<span style="color: ${colors.number}">$1</span>`)
                .replace(patterns.function, `<span style="color: ${colors.function}">$1</span>`);
            break;
            
        case 'python':
            const pythonKeywords = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|and|or|not|in|is|None|True|False|pass|break|continue|global|nonlocal|assert|del|yield|raise)\b/g;
            highlightedCode = highlightedCode
                .replace(patterns.comment, `<span style="color: ${colors.comment}">$1</span>`)
                .replace(patterns.string, `<span style="color: ${colors.string}">$1$2$3</span>`)
                .replace(pythonKeywords, `<span style="color: ${colors.keyword}">$1</span>`)
                .replace(patterns.number, `<span style="color: ${colors.number}">$1</span>`)
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
                         `${ansiColors.number}$1${ansiColors.reset}`);
            break;
    }
    
    return coloredCode;
}

// Context detection functions
function getJsonPath(document: vscode.TextDocument, position: vscode.Position): string | null {
    return safeExecute(() => {
        const text = document.getText();
        
        // First, try to parse the JSON to make sure it's valid
        let jsonObj;
        try {
            jsonObj = JSON.parse(text);
        } catch (parseError) {
            return null;
        }
        
        return findJsonPathByPosition(text, position);
    }, null, 'JSON path detection');
}

function findJsonPathByPosition(jsonText: string, position: vscode.Position): string | null {
    try {
        // Split into lines for easier processing
        const lines = jsonText.split('\n');
        const targetLine = position.line;
        
        // Find the key on the current line or nearby lines
        let currentKey = null;
        
        // Check current line first
        const currentLineText = lines[targetLine] || '';
        let keyMatch = currentLineText.match(/"([^"]+)"\s*:/);
        
        if (keyMatch && keyMatch[1]) {
            currentKey = keyMatch[1];
        } else {
            // Look backwards for the key
            for (let i = targetLine; i >= Math.max(0, targetLine - 3); i--) {
                const lineText = lines[i] || '';
                keyMatch = lineText.match(/"([^"]+)"\s*:/);
                if (keyMatch && keyMatch[1]) {
                    currentKey = keyMatch[1];
                    break;
                }
            }
        }
        
        if (!currentKey) {
            return null;
        }
        
        // Build the path by counting braces/brackets up to the target line
        const path = [];
        let braceDepth = 0;
        let inString = false;
        let currentObjectKey = null;
        
        for (let lineNum = 0; lineNum <= targetLine; lineNum++) {
            const line = lines[lineNum] || '';
            
            for (let charPos = 0; charPos < line.length; charPos++) {
                const char = line[charPos];
                const prevChar = charPos > 0 ? line[charPos - 1] : '';
                
                // Handle strings
                if (char === '"' && prevChar !== '\\') {
                    inString = !inString;
                    
                    if (!inString) {
                        // Just exited a string, check if it's a key
                        const afterString = line.substring(charPos + 1);
                        const colonMatch = afterString.match(/^\s*:/);
                        if (colonMatch) {
                            // This was a key, extract it
                            const beforeQuote = line.lastIndexOf('"', charPos - 1);
                            if (beforeQuote >= 0) {
                                const key = line.substring(beforeQuote + 1, charPos);
                                currentObjectKey = key;
                            }
                        }
                    }
                } else if (!inString) {
                    if (char === '{') {
                        if (currentObjectKey && braceDepth < path.length) {
                            path[braceDepth] = currentObjectKey;
                        } else if (currentObjectKey) {
                            path.push(currentObjectKey);
                        }
                        braceDepth++;
                        currentObjectKey = null;
                    } else if (char === '}') {
                        braceDepth--;
                        if (path.length > braceDepth) {
                            path.length = braceDepth;
                        }
                    }
                }
                
                // If we've reached our target position, stop
                if (lineNum === targetLine) {
                    break;
                }
            }
        }
        
        // Add the current key if we found one
        if (currentKey && (path.length === 0 || path[path.length - 1] !== currentKey)) {
            path.push(currentKey);
        }
        
        return path.length > 0 ? path.join('.') : null;
        
    } catch (error) {
        return null;
    }
}

function getXmlPath(document: vscode.TextDocument, position: vscode.Position): string | null {
    return safeExecute(() => {
        const text = document.getText();
        const lines = text.split('\n');
        const currentLine = position.line;
        
        const tagStack: Array<{name: string, index: number}> = [];
        
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
                    const siblingIndex = countSiblingsBeforePosition(text, tagName, tagStack.length, i, match.index);
                    tagStack.push({
                        name: tagName,
                        index: siblingIndex
                    });
                }
            }
        }
        
        if (tagStack.length === 0) {
            return null;
        }
        
        // Build path with indices for repeated elements
        const pathParts = [];
        for (const tag of tagStack) {
            if (tag.index > 0) {
                pathParts.push(`${tag.name}[${tag.index}]`);
            } else {
                pathParts.push(tag.name);
            }
        }
        
        return pathParts.join(' > ');
    }, null, 'XML path detection');
}

function countSiblingsBeforePosition(xmlText: string, tagName: string, targetDepth: number, lineIndex: number, charIndex: number): number {
    try {
        const lines = xmlText.split('\n');
        let siblingCount = 0;
        let currentDepth = 0;
        
        // Parse from beginning up to the current position
        for (let i = 0; i < lineIndex || (i === lineIndex && charIndex >= 0); i++) {
            const line = lines[i];
            if (!line) continue;
            
            const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-_]*)[^>]*>/g;
            let match;
            
            while ((match = tagRegex.exec(line)) !== null) {
                // Stop if we've reached our target position
                if (i === lineIndex && match.index >= charIndex) {
                    break;
                }
                
                const fullTag = match[0];
                const currentTagName = match[1];
                
                if (fullTag.startsWith('</')) {
                    // Closing tag
                    currentDepth--;
                } else if (!fullTag.endsWith('/>')) {
                    // Opening tag (not self-closing)
                    if (currentDepth === targetDepth && currentTagName === tagName) {
                        // Found a sibling at the same depth with same name
                        siblingCount++;
                    }
                    currentDepth++;
                }
            }
        }
        
        return siblingCount;
    } catch (error) {
        return 0;
    }
}

function getDelimitedContextWithSelection(document: vscode.TextDocument, selection: vscode.Selection): string | null {
    return safeExecute(() => {
        const text = document.getText();
        const delimiter = detectDelimiter(text);
        const delimiterName = getDelimiterName(delimiter);
        const lines = text.split('\n');
        
        if (lines.length === 0) return delimiterName;
        
        // Get column information if possible
        const firstLine = lines[0];
        if (!firstLine) return delimiterName;
        
        // Parse headers properly, considering quoted fields
        const headers = parseDelimitedLine(firstLine, delimiter);
        const currentLine = lines[selection.start.line];
        
        if (!currentLine) return delimiterName;
        
        // Parse the current line to find which columns are selected
        const fields = parseDelimitedLine(currentLine, delimiter);
        
        // Check if first row looks like headers or data
        const hasHeaders = detectHeaders(headers, lines);
        
        // Find which columns are covered by the selection
        const columnRange = getColumnRangeFromSelection(currentLine, selection, delimiter, fields);
        
        if (columnRange) {
            const { startColumn, endColumn } = columnRange;
            
            if (startColumn === endColumn) {
                // Single column
                let columnName;
                if (hasHeaders && startColumn < headers.length) {
                    columnName = headers[startColumn].trim().replace(/^["']|["']$/g, '');
                } else {
                    columnName = `Column ${startColumn + 1}`;
                }
                return `${delimiterName} > ${columnName}`;
            } else {
                // Multiple columns - show all individual column names
                const columnNames = [];
                
                for (let i = startColumn; i <= endColumn; i++) {
                    if (hasHeaders && i < headers.length) {
                        const headerName = headers[i].trim().replace(/^["']|["']$/g, '');
                        columnNames.push(headerName);
                    } else {
                        columnNames.push(`Column ${i + 1}`);
                    }
                }
                
                return `${delimiterName} > ${columnNames.join(', ')}`;
            }
        }
        
        return delimiterName;
    }, null, 'Delimited file context detection');
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (!inQuotes && (char === '"' || char === "'")) {
            // Starting a quoted field
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (inQuotes && char === quoteChar) {
            // Check for escaped quotes (double quotes)
            if (i + 1 < line.length && line[i + 1] === quoteChar) {
                // Escaped quote, add both and skip next
                current += char + char;
                i++;
            } else {
                // End of quoted field
                inQuotes = false;
                current += char;
            }
        } else if (!inQuotes && line.substring(i, i + delimiter.length) === delimiter) {
            // Found delimiter outside quotes
            fields.push(current);
            current = '';
            i += delimiter.length - 1; // Skip delimiter (subtract 1 because loop will increment)
        } else {
            // Regular character
            current += char;
        }
    }
    
    // Add the last field
    fields.push(current);
    
    return fields;
}

function getColumnRangeFromSelection(line: string, selection: vscode.Selection, delimiter: string, fields: string[]): { startColumn: number, endColumn: number } | null {
    try {
        const startChar = selection.start.character;
        const endChar = selection.end.character;
        
        let charCount = 0;
        let startColumn = -1;
        let endColumn = -1;
        
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const fieldStart = charCount;
            const fieldEnd = charCount + field.length; // Exclusive end
            
            // Check if selection start is within this field
            if (startColumn === -1 && startChar >= fieldStart && startChar < fieldEnd) {
                startColumn = i;
            }
            
            // Check if selection end is within this field
            const lastSelectedChar = endChar - 1;
            if (lastSelectedChar >= fieldStart && lastSelectedChar < fieldEnd) {
                endColumn = i;
            }
            
            // Move to next field (add field length + delimiter length)
            charCount = fieldEnd;
            if (i < fields.length - 1) {
                charCount += delimiter.length;
            }
        }
        
        // If we found start but not end, assume single column
        if (startColumn !== -1 && endColumn === -1) {
            endColumn = startColumn;
        }
        
        // If we found end but not start, work backwards
        if (startColumn === -1 && endColumn !== -1) {
            startColumn = endColumn;
        }
        
        // Final fallback
        if (startColumn === -1) {
            return { startColumn: 0, endColumn: 0 };
        }
        
        return { startColumn, endColumn };
        
    } catch (error) {
        return { startColumn: 0, endColumn: 0 };
    }
}

function detectHeaders(firstRowFields: string[], allLines: string[]): boolean {
    try {
        // If there's only one line, assume it's data (no headers)
        if (allLines.length <= 1) {
            return false;
        }
        
        // Get the second line to compare
        const secondLine = allLines[1];
        if (!secondLine.trim()) {
            return false;
        }
        
        // Parse the second row
        const delimiter = detectDelimiter(allLines.join('\n'));
        const secondRowFields = parseDelimitedLine(secondLine, delimiter);
        
        // Heuristics to detect if first row contains headers:
        
        // 1. If first row has significantly different data types than second row
        const firstRowNumbers = firstRowFields.filter(field => {
            const cleaned = field.trim().replace(/^["']|["']$/g, '');
            return !isNaN(Number(cleaned)) && cleaned !== '';
        }).length;
        
        const secondRowNumbers = secondRowFields.filter(field => {
            const cleaned = field.trim().replace(/^["']|["']$/g, '');
            return !isNaN(Number(cleaned)) && cleaned !== '';
        }).length;
        
        // If first row has significantly fewer numbers, it's likely headers
        if (secondRowNumbers > firstRowNumbers + 1 && secondRowNumbers >= firstRowFields.length / 2) {
            return true;
        }
        
        // 2. If first row contains typical header-like words
        const headerIndicators = ['id', 'name', 'email', 'address', 'phone', 'date', 'time', 'status', 'type', 'code', 'number', 'description', 'title', 'category', 'group'];
        const headerWords = firstRowFields.some(field => {
            const cleaned = field.toLowerCase().trim().replace(/^["']|["']$/g, '');
            return headerIndicators.some(indicator => cleaned.includes(indicator));
        });
        
        if (headerWords) {
            return true;
        }
        
        // 3. Default assumption: if we can't tell, assume first row is headers
        return true;
        
    } catch (error) {
        // If detection fails, assume headers exist (safer default)
        return true;
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
        default:
            // Check by file extension for files VS Code might not recognize
            if (filename.endsWith('.csv') || filename.endsWith('.tsv') || 
                filename.endsWith('.psv') || filename.endsWith('.ssv') ||
                filename.endsWith('.dsv') || filename.endsWith('.txt')) {
                // For delimited files, we need selection context which isn't available here
                return null;
            }
            return null;
    }
}

// Command handlers - extracted from the original implementation
async function handleCopyWithContext(): Promise<void> {
    const editor = vscode.window.activeTextEditor!; // We know it exists from validation
    
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
    let contextPath: string | null = null;
    if (showContextPath) {
        const language = document.languageId;
        const filename = document.fileName.toLowerCase();
        
        // For delimited files, use selection-aware context detection
        if (language === 'csv' || language === 'tsv' || language === 'psv' || language === 'ssv' || language === 'dsv' ||
            filename.endsWith('.csv') || filename.endsWith('.tsv') || filename.endsWith('.psv') || 
            filename.endsWith('.ssv') || filename.endsWith('.dsv') || filename.endsWith('.txt')) {
            contextPath = getDelimitedContextWithSelection(document, selection);
        } else {
            // Get base context path
            const baseContext = getDocumentContext(document, selection.start);
            contextPath = baseContext;
        }
    }
    
    // Format the output
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
    await vscode.env.clipboard.writeText(output);
    
    // Show success message
    const lineInfo = startLine === endLine 
        ? `line ${startLine}` 
        : `lines ${startLine}-${endLine}`;
    
    vscode.window.showInformationMessage(
        `Copied code from ${displayName} (${lineInfo}) to clipboard`
    );
}

async function handleCopyWithContextCustom(): Promise<void> {
    const editor = vscode.window.activeTextEditor!;
    
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
    let contextPath: string | null = null;
    if (showContextPath) {
        const language = document.languageId;
        const filename = document.fileName.toLowerCase();
        
        // For delimited files, use selection-aware context detection
        if (language === 'csv' || language === 'tsv' || language === 'psv' || language === 'ssv' || language === 'dsv' ||
            filename.endsWith('.csv') || filename.endsWith('.tsv') || filename.endsWith('.psv') || 
            filename.endsWith('.ssv') || filename.endsWith('.dsv') || filename.endsWith('.txt')) {
            contextPath = getDelimitedContextWithSelection(document, selection);
        } else {
            const baseContext = getDocumentContext(document, selection.start);
            contextPath = baseContext;
        }
    }

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

    await vscode.env.clipboard.writeText(output);
    vscode.window.showInformationMessage(`Copied with ${format.label} format`);
}

async function handleCopyWithContextHTML(): Promise<void> {
    const editor = vscode.window.activeTextEditor!;
    
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
    let contextPath: string | null = null;
    if (showContextPath) {
        const language = document.languageId;
        const filename = document.fileName.toLowerCase();
        
        // For delimited files, use selection-aware context detection
        if (language === 'csv' || language === 'tsv' || language === 'psv' || language === 'ssv' || language === 'dsv' ||
            filename.endsWith('.csv') || filename.endsWith('.tsv') || filename.endsWith('.psv') || 
            filename.endsWith('.ssv') || filename.endsWith('.dsv') || filename.endsWith('.txt')) {
            contextPath = getDelimitedContextWithSelection(document, selection);
        } else {
            const baseContext = getDocumentContext(document, selection.start);
            contextPath = baseContext;
        }
    }

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

    await vscode.env.clipboard.writeText(htmlOutput);
    vscode.window.showInformationMessage(`Copied colored HTML code from ${displayName} (${lineInfo}) to clipboard`);
}

// Extension activation with safety wrappers
export function activate(context: vscode.ExtensionContext) {
    console.log('Copy with Context extension is now active!');

    // Register commands with safety wrappers
    let disposable = vscode.commands.registerCommand('copyWithContext.copySelection', async () => {
        await safeExecuteCommand(handleCopyWithContext);
    });

    let customDisposable = vscode.commands.registerCommand('copyWithContext.copySelectionCustom', async () => {
        await safeExecuteCommand(handleCopyWithContextCustom);
    });

    let htmlDisposable = vscode.commands.registerCommand('copyWithContext.copySelectionHTML', async () => {
        await safeExecuteCommand(handleCopyWithContextHTML);
    });

    context.subscriptions.push(disposable, customDisposable, htmlDisposable);
}

export function deactivate() {}
