# Extension Basics

This tutorial explains the fundamental concepts of VS Code extensions.

## What is a VS Code Extension?

A VS Code extension is a JavaScript/TypeScript program that extends VS Code's functionality. Extensions can:
- Add new features
- Modify existing behavior
- Integrate external tools
- Create custom UI

## Extension Architecture

### 1. Entry Point (`src/extension.ts`)

Every extension has a main entry point that exports an `activate` function:

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Extension activation code
    console.log('Extension activated!');
}
```

**Key Concepts:**
- `activate`: Called when extension is activated
- `context`: Extension context (stores subscriptions)
- `ExtensionContext`: Manages extension lifecycle

### 2. Activation Events

Extensions activate based on events defined in `package.json`:

```json
{
  "activationEvents": [
    "onView:natural-git.view",    // When view is opened
    "onCommand:natural-git.askGit" // When command is executed
  ]
}
```

**Common Activation Events:**
- `onStartupFinished`: After VS Code starts
- `onCommand:commandId`: When command executes
- `onView:viewId`: When view opens
- `onLanguage:languageId`: When file of language opens

### 3. Extension Manifest (`package.json`)

The manifest defines what the extension does:

```json
{
  "name": "natural-git",
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [...],
    "views": [...],
    "viewsContainers": [...]
  }
}
```

**Key Sections:**
- `contributes`: Extension contributions
- `commands`: Commands user can invoke
- `views`: UI components
- `viewsContainers`: Where views appear

## Understanding Our Extension

### Project Structure

```
src/
├── extension.ts                 # Entry point
├── git-command-generator.ts     # Git command feature
└── workspace-cognitive.ts       # Workspace AI feature
```

### Entry Point Analysis

Let's examine `src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import GitCommandGenerator from './git-command-generator';
import WorkspaceCognitive from './workspace-cognitive';

export async function activate(context: vscode.ExtensionContext) {
    // Create feature instances
    const gitCommandGenerator = new GitCommandGenerator(context);
    const workspaceCognitive = new WorkspaceCognitive(context);

    // Register providers
    context.subscriptions.push(
        // Register command
        vscode.commands.registerCommand('natural-git.askGit', askGPTToGitCommands),
        
        // Register webview view providers
        vscode.window.registerWebviewViewProvider(
            "natural-git.view", 
            workspaceCognitive, 
            { webviewOptions: { retainContextWhenHidden: true } }
        ),
        vscode.window.registerWebviewViewProvider(
            "natural-git.git-view", 
            gitCommandGenerator,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );
}
```

**What's Happening:**
1. **Import**: Load VS Code API and feature modules
2. **Create Instances**: Initialize feature classes
3. **Register**: Add commands and views to VS Code
4. **Subscriptions**: Track for cleanup

### Extension Lifecycle

```
Install → Activate → Run → Deactivate → Uninstall
```

1. **Install**: Extension installed in VS Code
2. **Activate**: `activate()` function called
3. **Run**: Extension handles events
4. **Deactivate**: `deactivate()` called (optional)
5. **Uninstall**: Extension removed

## Key Concepts

### 1. ExtensionContext

Manages extension resources:

```typescript
context.subscriptions.push(
    vscode.commands.registerCommand(...),
    vscode.window.createWebviewPanel(...)
);
```

**Why**: Auto-cleanup when extension deactivates

### 2. Commands

User-invokable actions:

```typescript
vscode.commands.registerCommand('my.command', () => {
    vscode.window.showInformationMessage('Hello!');
});
```

**Defined in**: `package.json` → `contributes.commands`

### 3. Webviews

Custom HTML UI in VS Code:

```typescript
const panel = vscode.window.createWebviewPanel(
    'myWebview',
    'My View',
    vscode.ViewColumn.One,
    { enableScripts: true }
);
```

**Types**:
- **WebviewPanel**: Modal panel
- **WebviewView**: Sidebar view

## Practice Exercise

### Exercise: Create a Simple Command

1. Add to `package.json`:
```json
{
  "contributes": {
    "commands": [{
      "command": "myExtension.hello",
      "title": "Say Hello"
    }]
  }
}
```

2. Register in `extension.ts`:
```typescript
vscode.commands.registerCommand('myExtension.hello', () => {
    vscode.window.showInformationMessage('Hello from my extension!');
});
```

3. Test:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type "Say Hello"
   - Execute command

## Next Steps

- [First Extension](./03-first-extension.md) - Build a complete extension
- [Webviews Explained](./04-webviews-explained.md) - Create custom UI

## Key Takeaways

✅ Extensions extend VS Code functionality  
✅ Entry point is `activate()` function  
✅ Manifest (`package.json`) defines capabilities  
✅ ExtensionContext manages lifecycle  
✅ Commands are user-invokable actions  
✅ Webviews provide custom UI

