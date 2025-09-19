# Copy with Context - VS Code Extension

A VS Code extension that copies code snippets with filename and line number context, perfect for documentation, code reviews, and sharing code with proper attribution.

## Features

- 📋 Copy selected code with filename and line numbers
- 📍 **Line numbers on each line** for easy reference and navigation
- 🗂️ **Contextual path information** - JSON paths, XML paths, function/class names, CSS selectors, delimited file columns
- 🎨 **Comprehensive syntax highlighting** - 10+ languages including CSS/SCSS/SASS/LESS
- 📊 **Smart delimited file support** - Auto-detects CSV, TSV, PSV, SSV and custom delimiter formats
- ⌨️ Keyboard shortcuts: 
  - `Ctrl+Alt+C` - Copy with context (plain text or colored based on settings)
  - `Ctrl+Alt+H` - Copy with colored HTML format
- 🖱️ Right-click context menu options
- 🎨 Multiple output formats (plain, markdown, HTML, ANSI colors, full path)
- 📂 Handles unsaved files gracefully
- ⚙️ Configurable settings for line numbers, context paths, and color coding
- 📐 Optional line number padding for perfect alignment
- 🔍 Smart context detection for different file types
- 🌈 Customizable color themes (dark/light)
- 🎯 Perfect for web development with full CSS/HTML/JS support
- 📈 Data analysis friendly with comprehensive delimited file support

## Output Examples

### Single Line
```
// example.js:42
42: const result = processData(input);
```

### Multiple Lines
```
// utils.ts:15-18
15: function calculateTotal(items) {
16:   return items.reduce((sum, item) => {
17:     return sum + item.price;
18:   }, 0);
19: }
```

### Markdown Format
````
```javascript
// example.js:42-44
42: function greet(name) {
43:   console.log(`Hello, ${name}!`);
44: }
```
````

## Setup Instructions

### 1. Create the Extension Structure
Create a new folder for your extension and set up the following structure:
```
copy-with-context/
├── src/
│   └── extension.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 2. Install Dependencies
Open a terminal in your extension folder and run:
```bash
npm install
```

### 3. Compile the Extension
Compile the TypeScript code:
```bash
npm run compile
```

Or watch for changes during development:
```bash
npm run watch
```

### 4. Test the Extension
1. Open VS Code in your extension folder
2. Press `F5` to open a new Extension Development Host window
3. In the new window, open any code file
4. Select some code and press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
5. Or right-click and select "Copy with Context"

### 5. Package the Extension (Optional)
To create a `.vsix` file for distribution:
```bash
npm install -g vsce
vsce package
```

## Usage

### Basic Copy with Context
1. **Select code** or place cursor on a line
2. **Press `Ctrl+Alt+C`** (or `Cmd+Alt+C` on Mac)
3. **Or right-click** and select "Copy with Context"
4. **Paste** the formatted code with filename, line numbers, and context

### Colored HTML Copy
1. **Select code** you want to copy with syntax highlighting
2. **Press `Ctrl+Alt+H`** (or `Cmd+Alt+H` on Mac) 
3. **Or right-click** and select "Copy with Context (Colored HTML)"
4. **Paste into applications** that support rich text (Word, Gmail, Slack rich text, etc.)

### Custom Format Selection
1. **Select code** you want to copy
2. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **Type "Copy with Context Custom"**
4. **Choose format:**
   - **Comment Style** - Plain text with comment header
   - **Markdown Style** - Code block with language specification
   - **HTML with Syntax Highlighting** - Rich colored HTML
   - **ANSI Colored (Terminal)** - Colored text for console/terminal
   - **Full Path** - Include complete file path instead of filename only

### Settings Configuration
Access settings through:
- **File → Preferences → Settings**
- **Search for "Copy with Context"**
- **Toggle options** like line numbers, color coding, context paths

### Best Practices

**For Documentation:**
- Use **Markdown format** for README files and documentation
- Enable **context paths** to show function/class information

**For Code Reviews:**
- Use **HTML format** for rich text applications (email, Slack)
- Enable **line number padding** for better alignment

**For Terminal/Console:**
- Use **ANSI colored format** for terminal applications
- Disable line numbers if copying large blocks

**For Plain Text Sharing:**
- Use **Comment Style** for simple text sharing
- Keep **line numbers enabled** for easy reference

## Configuration

### Settings
You can customize the extension behavior in VS Code settings:

- **`copyWithContext.showLineNumbers`** (boolean, default: `true`): Show line numbers on each line of copied code
- **`copyWithContext.lineNumberPadding`** (boolean, default: `false`): Add padding to line numbers for consistent alignment  
- **`copyWithContext.showContextPath`** (boolean, default: `true`): Show contextual path information (JSON paths, XML paths, function/class names)

### Context Detection
The extension automatically detects context based on file type:

- **JSON/JSONC**: Shows the path to the selected value (e.g., `database.connection.port`)
- **XML/HTML**: Shows the XML element path (e.g., `root > config > database`)
- **JavaScript/TypeScript**: Shows function and class context (e.g., `UserService > validateUser`)
- **Python**: Shows class and method context (e.g., `DatabaseManager > connect`)  
- **Java/C#**: Shows class and method context
- **C/C++**: Shows function and class context
- **Go**: Shows function and struct context
- **Rust**: Shows function and impl context

### Keyboard Shortcuts
You can customize the keyboard shortcut by:
1. Go to File → Preferences → Keyboard Shortcuts
2. Search for "Copy with Context"
3. Set your preferred keybinding

### Example with Line Number Padding
When `lineNumberPadding` is enabled, line numbers are padded for better alignment:
```
// example.js:8-12 (processItems)
 8: function processItems(items) {
 9:   for (let i = 0; i < items.length; i++) {
10:     console.log(items[i]);
11:   }
12: }

## Development

### Adding New Features
The main logic is in `src/extension.ts`. Key functions:
- `activate()`: Called when extension starts
- `copyWithContext.copySelection`: Main copy command
- `copyWithContext.copySelectionCustom`: Custom format copy

### Modifying Output Format
Edit the output formatting in the command handlers. Current format:
```typescript
// Add file context
if (startLine === endLine) {
    output += `// ${displayName}:${startLine}\n`;
} else {
    output += `// ${displayName}:${startLine}-${endLine}\n`;
}
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to modify and distribute.