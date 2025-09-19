# Change Log

All notable changes to the "Copy with Context" extension will be documented in this file.

## [1.0.0] - 2025-09-19

### 🚀 **Major Features**
- 📋 **Smart code copying** with filename, line numbers, and contextual information
- 📍 **Line numbers on each line** for easy reference and navigation
- 🗂️ **Advanced contextual path detection** - JSON paths, XML paths, function/class names, CSS selectors, delimited file columns
- 🎨 **Comprehensive syntax highlighting** - 10+ languages with professional color coding
- 📊 **Intelligent delimited file support** - Auto-detects CSV, TSV, PSV, SSV and custom formats

### ⌨️ **Keyboard Shortcuts**
- **`Ctrl+Alt+C`** (Windows/Linux) or **`Cmd+Alt+C`** (Mac) - Copy with context (configurable format)
- **`Ctrl+Alt+H`** (Windows/Linux) or **`Cmd+Alt+H`** (Mac) - Copy with colored HTML format

### 🎨 **Output Formats**
- **Plain Text** - Clean monospace with context header
- **HTML with Syntax Highlighting** - Rich colored HTML for email, Slack, documentation
- **Markdown** - Code blocks with language specification for GitHub, documentation
- **ANSI Colored** - Terminal-friendly colored output
- **Custom Format Selection** - Choose format via Command Palette

### 🌈 **Syntax Highlighting Support**
- **JavaScript/TypeScript** - Keywords, strings, comments, functions, numbers, operators, types
- **Python** - Keywords, strings, comments, functions, numbers, decorators
- **C#** - Keywords, strings, comments, methods, types, attributes, namespaces, operators
- **CSS/SCSS/SASS/LESS** - Selectors, properties, values, colors, units, at-rules, pseudo-classes, !important, functions
- **JSON** - Keys, strings, numbers, booleans, null values
- **XML** - Tags, attributes, attribute values, comments, CDATA, DOCTYPE declarations  
- **HTML** - Tags, attributes, attribute values, comments, DOCTYPE declarations
- **YAML** - Keys, strings, numbers, booleans, null values, comments, anchors, operators
- **Delimited Files** - Auto-detects CSV, TSV, PSV, SSV with headers, quoted strings, numbers, separators

### 🗂️ **Context Detection**
- **JSON/JSONC** - Full path to selected value (e.g., `database.connection.port`)
- **XML/HTML/XHTML** - Element hierarchy (e.g., `root > config > database > connection`)
- **JavaScript/TypeScript** - Class and function context (e.g., `UserService > validateUser`)
- **Python** - Class and method context (e.g., `DatabaseManager > connect`)
- **Java** - Class and method context
- **C#** - Namespace, class, interface, struct, and method context (e.g., `MyApp.Services > UserService > ValidateUserAsync`)
- **C/C++** - Function and class context
- **Go** - Function and struct context
- **Rust** - Function and impl context  
- **CSS/SCSS/SASS/LESS** - Selector and media query context (e.g., `@media screen > .container > .button:hover`)
- **Delimited Files** - File type and current column (e.g., `TSV (Tab-Separated) > Column: Email`)

### 📊 **Delimited File Auto-Detection**
- **CSV** (`,`) - Comma-separated values
- **TSV** (`\t`) - Tab-separated values
- **PSV** (`|`) - Pipe-separated values  
- **SSV** (`;`) - Semicolon-separated values (European format)
- **Custom Delimiters** - Colon (`:`), space, and other formats
- **Smart Detection Algorithm** - Analyzes first 5 lines to identify most likely delimiter
- **Context Information** - Shows file format and current column name

### ⚙️ **Configurable Settings**
- **`copyWithContext.showLineNumbers`** (boolean, default: `true`) - Show line numbers on each line
- **`copyWithContext.lineNumberPadding`** (boolean, default: `false`) - Add padding for consistent alignment
- **`copyWithContext.showContextPath`** (boolean, default: `true`) - Show contextual path information
- **`copyWithContext.enableColorCoding`** (boolean, default: `false`) - Enable syntax highlighting in default copy
- **`copyWithContext.colorTheme`** (string, default: `"dark"`) - Color theme for syntax highlighting (`"dark"` or `"light"`)

### 🖱️ **Right-Click Context Menu**
- **Copy with Context** - Default format based on settings
- **Copy with Context (Colored HTML)** - Always HTML with syntax highlighting
- **Copy with Context (Custom Format)** - Format selection dialog

### 🎯 **Use Cases**
- **📧 Professional Emails** - Rich HTML format for bug reports and code reviews
- **💬 Team Chat** - Colored output for Slack, Microsoft Teams, Discord
- **📝 Documentation** - Markdown format for README files, wikis, GitHub
- **🐛 Bug Reports** - Context + colors = clear communication
- **📚 Tutorials & Presentations** - Professional syntax highlighting
- **🔧 Terminal/Console** - ANSI colored output for command line tools
- **📊 Data Analysis** - Smart support for CSV, TSV, and other data formats

### 🔧 **Technical Features**
- **Built with TypeScript** - Type-safe, maintainable codebase
- **VS Code 1.74.0+ Support** - Compatible with modern VS Code versions
- **Efficient Parsing Algorithms** - Fast context detection for large files
- **Comprehensive Error Handling** - Graceful handling of edge cases
- **Memory Efficient** - No browser storage dependencies (Claude.ai compatible)
- **Extensible Architecture** - Easy to add new languages and formats

### 🚀 **Advanced Capabilities**
- **Mixed Content Support** - Handles files with multiple languages (HTML + CSS + JS)
- **Unsaved File Handling** - Works with new, unsaved documents
- **Large File Performance** - Optimized for files with thousands of lines
- **Unicode Support** - Handles international characters and symbols
- **Nested Context Detection** - Deep hierarchy support (classes > methods > nested functions)
- **Format Preservation** - Maintains original indentation and spacing

### 📈 **Performance & Reliability**
- **Fast Context Detection** - Analyzes context in milliseconds
- **Robust Delimiter Detection** - Handles complex delimited files reliably
- **Memory Efficient** - Minimal resource usage
- **Error Recovery** - Continues working even with malformed files
- **Cross-Platform** - Consistent behavior on Windows, Mac, and Linux

This release represents a comprehensive solution for copying and sharing code with professional context and syntax highlighting across 10+ programming languages and data formats. Perfect for developers, data analysts, technical writers, and anyone who shares code regularly.