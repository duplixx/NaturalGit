# Webviews Explained

Webviews allow you to create custom HTML/CSS/JavaScript UI inside VS Code. This tutorial explains how to use them.

## What are Webviews?

Webviews are isolated HTML environments that run in VS Code. Think of them as mini web pages inside the editor.

### Types of Webviews

1. **WebviewPanel**: Modal panel (like a dialog)
2. **WebviewView**: Sidebar view (like our extension uses)

## WebviewView Implementation

### Step 1: Implement WebviewViewProvider

```typescript
import * as vscode from 'vscode';

export default class MyWebviewProvider implements vscode.WebviewViewProvider {
    private webView?: vscode.WebviewView;

    constructor(private context: vscode.ExtensionContext) {}

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this.webView = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml(webviewView.webview);
    }

    private getHtml(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body>
                <h1>Hello from Webview!</h1>
            </body>
            </html>`;
    }
}
```

**Key Points:**
- `implements vscode.WebviewViewProvider`: Required interface
- `resolveWebviewView`: Called when view is created
- `enableScripts: true`: Allows JavaScript execution
- `webview.html`: Sets HTML content

### Step 2: Register the Provider

```typescript
// In extension.ts
vscode.window.registerWebviewViewProvider(
    "myExtension.view",
    new MyWebviewProvider(context),
    { webviewOptions: { retainContextWhenHidden: true } }
);
```

**Options:**
- `retainContextWhenHidden`: Keep state when hidden

## Message Passing

Webviews communicate with the extension via messages.

### Extension → Webview

```typescript
// In extension code
webviewView.webview.postMessage({
    type: 'update',
    value: 'Hello from extension!'
});
```

### Webview → Extension

```typescript
// In webview JavaScript
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'userAction', value: 'button clicked' });
```

### Handling Messages

**In Extension:**
```typescript
webviewView.webview.onDidReceiveMessage((message) => {
    if (message.type === 'userAction') {
        vscode.window.showInformationMessage(message.value);
    }
});
```

**In Webview:**
```typescript
window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'update') {
        document.getElementById('content').textContent = message.value;
    }
});
```

## Real Example: Git Command Generator

Let's examine `src/git-command-generator.ts`:

```typescript
export default class GitCommandGenerator implements vscode.WebviewViewProvider {
    private webView?: vscode.WebviewView;
    
    resolveWebviewView(webviewView: vscode.WebviewView) {
        this.webView = webviewView;
        
        // Enable scripts for interactivity
        webviewView.webview.options = { enableScripts: true };
        
        // Set HTML content
        webviewView.webview.html = this.getHtml(webviewView.webview);
        
        // Listen for messages from webview
        webviewView.webview.onDidReceiveMessage((data) => {
            if (data.type === "userMessage") {
                this.handleUserMessage(data.value);
            }
        });
    }
    
    private getHtml(webview: vscode.Webview): string {
        // Load JavaScript file
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.file(
                path.join(this.context.extensionPath, "media", "main.js")
            )
        );
        
        return `<!DOCTYPE html>
            <html>
            <head>
                <script src="${scriptUri}"></script>
            </head>
            <body>
                <div id="chat-container"></div>
                <input id="user-input" />
                <button id="send-button">Send</button>
            </body>
            </html>`;
    }
}
```

## Loading External Resources

### Problem: Security
VS Code webviews are isolated for security. You can't directly load local files.

### Solution: Use `asWebviewUri()`

```typescript
const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "media", "main.js"))
);
```

This creates a special URI that VS Code allows.

### Example: Loading CSS and JS

```typescript
const scriptUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "media", "main.js"))
);
const styleUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "media", "main.css"))
);

return `<!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="${styleUri}">
        <script src="${scriptUri}"></script>
    </head>
    <body>...</body>
    </html>`;
```

## Webview Best Practices

### 1. Use VS Code Theme Colors

```css
body {
    background: var(--vscode-editor-background);
    color: var(--vscode-foreground);
}
```

**Available Variables:**
- `--vscode-editor-background`
- `--vscode-foreground`
- `--vscode-button-background`
- `--vscode-input-background`

### 2. Handle State

```typescript
const vscode = acquireVsCodeApi();

// Get state
const state = vscode.getState() || { messages: [] };

// Update state
vscode.setState({ messages: [...state.messages, newMessage] });
```

### 3. Error Handling

```typescript
window.addEventListener('message', event => {
    try {
        handleMessage(event.data);
    } catch (error) {
        console.error('Error handling message:', error);
    }
});
```

## Practice Exercise

### Exercise: Create a Counter Webview

1. Create a webview with a counter button
2. Send increment message to extension
3. Extension updates counter and sends back
4. Display updated count

**Solution Structure:**

```typescript
// Extension
webviewView.webview.onDidReceiveMessage((message) => {
    if (message.type === 'increment') {
        const newCount = (currentCount || 0) + 1;
        webviewView.webview.postMessage({ 
            type: 'count', 
            value: newCount 
        });
    }
});
```

```javascript
// Webview
const vscode = acquireVsCodeApi();
let count = 0;

document.getElementById('increment').onclick = () => {
    vscode.postMessage({ type: 'increment' });
};

window.addEventListener('message', event => {
    if (event.data.type === 'count') {
        count = event.data.value;
        document.getElementById('display').textContent = count;
    }
});
```

## Next Steps

- [Message Passing](./05-message-passing.md) - Deep dive into communication
- [Workspace API](./06-workspace-api.md) - Access workspace data

## Key Takeaways

✅ Webviews are isolated HTML environments  
✅ Use `WebviewViewProvider` for sidebar views  
✅ Message passing for extension ↔ webview communication  
✅ Use `asWebviewUri()` for loading resources  
✅ Use VS Code theme colors for consistency  
✅ Handle state with `getState()` and `setState()`

