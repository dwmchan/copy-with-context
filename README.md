# Copy with Context - VS Code Extension

> Born from the frustration of constantly copying and pasting code snippets, data, and configuration fragments without any context about where they came from or what they represented.

A VS Code extension that copies code snippets with intelligent contextual information - filename, line numbers, and smart path detection for structured data. Perfect for documentation, code reviews, debugging, and sharing code with proper attribution.

## The Problem This Solves

Have you ever:
- Copied a JSON snippet and forgot which property path it came from?
- Shared XML data without knowing which nested element you were looking at?
- Pasted code in Slack without line numbers, making it impossible to reference?
- Lost track of which file a configuration came from?
- Struggled to explain CSV data without column context?

This extension was created to solve exactly these problems - providing rich context for any code or data you copy.

## Features

### 🔧 Smart Context Detection
- **JSON/JSONC**: Full property paths (e.g., `database.connection.settings`)
- **XML/HTML**: Element hierarchy with array indices (e.g., `root > items[2] > name`)
- **CSV/TSV/PSV**: Intelligent column detection with proper delimiter handling
- **Programming Languages**: Function and class context for JavaScript, TypeScript, Python, C#, and more
- **CSS/SCSS/SASS/LESS**: Selector context and media query detection

### 📝 Multiple Output Formats
- **Plain Text**: Clean monospace with context header
- **HTML with Syntax Highlighting**: Rich colored output for emails, Slack, documentation
- **Markdown**: Code blocks with language specification for GitHub, wikis
- **ANSI Colored**: Terminal-friendly colored output
- **Custom Formats**: Choose your preferred format on-the-fly

### 🎨 Comprehensive Syntax Highlighting
- **10+ Languages**: JavaScript, TypeScript, Python, C#, JSON, XML, HTML, CSS, YAML
- **Smart Color Coding**: Professional color schemes for different themes
- **Delimited Files**: Auto-detects CSV, TSV, PSV, SSV with proper formatting

### ⚡ Performance & Reliability
- **File Size Protection**: Automatic handling of large files (configurable up to 50MB)
- **Error Recovery**: Graceful fallbacks when parsing fails
- **Memory Efficient**: Optimized processing for large codebases
- **Safe Operations**: No crashes, no freezing, always recoverable

### ⌨️ Convenient Usage
- **Keyboard Shortcuts**: 
  - `Ctrl+Alt+C` (Windows/Linux) or `Cmd+Alt+C` (Mac) - Copy with context
  - `Ctrl+Alt+H` (Windows/Linux) or `Cmd+Alt+H` (Mac) - Copy with HTML highlighting
- **Right-Click Menu**: Context menu integration
- **Command Palette**: All features accessible via `Ctrl+Shift+P`

## Installation

1. Open VS Code
2. Press `Ctrl+P` to open Quick Open
3. Type `ext install copy-with-context`
4. Press Enter and reload VS Code

Or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=donald-chan.copy-with-context).

## Usage Examples

### JSON Context Detection
```javascript
// config.json:15 (database.connection.port)
15: "port": 5432
```

### XML with Array Indices
```xml
// users.xml:8-12 (users > user[1] > profile)
8: <profile>
9:   <name>John Doe</name>
10:   <email>john@example.com</email>
11:   <role>admin</role>
12: </profile>
```

### CSV Column Context
```csv
// data.csv:3 (CSV (Comma-Separated) > Email, Phone)
3: john.doe@company.com,+1-555-0123
```

### Function Context
```javascript
// utils.js:42-46 (UserService > validateEmail)
42: function validateEmail(email) {
43:   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
44:   return emailRegex.test(email);
45: }
```

### HTML with Syntax Highlighting
Rich HTML output perfect for emails, Slack, or documentation:

```html
<div style="font-family: 'Consolas', 'Monaco', monospace; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px;">
<div style="color: #6a9955; margin-bottom: 8px;">// config.js:25-30 (exports > database)</div>
<pre style="margin: 0; white-space: pre-wrap;">
<span style="color: #569CD6">const</span> <span style="color: #DCDCAA">database</span> = {
  <span style="color: #9CDCFE">host</span>: <span style="color: #CE9178">'localhost'</span>,
  <span style="color: #9CDCFE">port</span>: <span style="color: #B5CEA8">5432</span>
};
</pre>
</div>
```

## Configuration

Customize the extension through VS Code Settings (`Ctrl+,`):

| Setting | Default | Description |
|---------|---------|-------------|
| `copyWithContext.showLineNumbers` | `true` | Show line numbers on each copied line |
| `copyWithContext.lineNumberPadding` | `false` | Add padding for consistent line number alignment |
| `copyWithContext.showContextPath` | `true` | Show contextual path information |
| `copyWithContext.enableColorCoding` | `false` | Enable syntax highlighting in default copy |
| `copyWithContext.colorTheme` | `"dark"` | Color theme for syntax highlighting |
| `copyWithContext.showArrayIndices` | `true` | Show array indices in context paths |
| `copyWithContext.maxFileSize` | `5000000` | Maximum file size to process (bytes) |

### Example Configuration
```json
{
  "copyWithContext.showLineNumbers": true,
  "copyWithContext.showContextPath": true,
  "copyWithContext.enableColorCoding": false,
  "copyWithContext.maxFileSize": 10000000
}
```

## Advanced Features

### Custom Format Selection
1. Select code or place cursor
2. Open Command Palette (`Ctrl+Shift+P`)
3. Type "Copy with Context Custom"
4. Choose from multiple formats:
   - Comment Style
   - Markdown Style  
   - HTML with Syntax Highlighting
   - ANSI Colored (Terminal)
   - Full Path

### Large File Handling
The extension automatically handles large files:
- **< 5MB**: Full processing with all features
- **5MB - 50MB**: Shows warning, allows user choice
- **> 50MB**: Prevents processing to avoid performance issues

### Intelligent Delimiter Detection
Automatically detects and handles:
- **CSV** (Comma-separated)
- **TSV** (Tab-separated)
- **PSV** (Pipe-separated)
- **SSV** (Semicolon-separated)
- **Custom delimiters** (colon, space, etc.)

## Use Cases

### 📧 Professional Communication
- **Bug Reports**: Include exact line numbers and file context
- **Code Reviews**: Share snippets with clear location references  
- **Documentation**: Rich formatted code blocks with syntax highlighting

### 💬 Team Collaboration
- **Slack/Teams**: Colored code blocks that stand out
- **Email**: Professional HTML formatting
- **GitHub Issues**: Properly formatted code blocks with context

### 📚 Documentation & Tutorials
- **README files**: Consistent code formatting
- **Wikis**: Context-aware code snippets
- **Blog posts**: Professional syntax highlighting

### 🐛 Debugging & Support
- **Stack Overflow**: Clear context and formatting
- **Support tickets**: Exact file and line references
- **Code sharing**: Always know where code came from

## Development

### Building from Source
```bash
git clone https://github.com/dwmchan/copy-with-context.git
cd copy-with-context
npm install
npm run compile
```

### Running Tests
```bash
npm test
```

### Code Quality
```bash
npm run lint
```

## Supported File Types

| Category | Languages/Formats |
|----------|-------------------|
| **Programming** | JavaScript, TypeScript, Python, C#, Java, C/C++, Go, Rust |
| **Data** | JSON, JSONC, XML, HTML, YAML, CSV, TSV, PSV, SSV |
| **Styling** | CSS, SCSS, SASS, LESS |
| **Markup** | HTML, XML, XHTML, Markdown |
| **Configuration** | YAML, JSON, TOML, INI |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+C` (`Cmd+Alt+C` on Mac) | Copy with context (default format) |
| `Ctrl+Alt+H` (`Cmd+Alt+H` on Mac) | Copy with HTML syntax highlighting |

*All shortcuts can be customized in VS Code's Keyboard Shortcuts settings.*

## Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes and updates.

---

**Stop copying code without context. Start copying with intelligence.**