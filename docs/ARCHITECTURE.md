# Architecture Overview

This document explains the architecture of the NaturalGit extension.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌─────────────────────────┐   │
│  │ extension.ts │──────│  WebviewViewProviders    │   │
│  │ (Entry Point)│      │  - WorkspaceCognitive    │   │
│  └──────────────┘      │  - GitCommandGenerator    │   │
│         │              └─────────────────────────┘   │
│         │                      │                      │
│         │                      │                      │
│  ┌──────▼──────────────┐    ┌──────▼──────────────┐ │
│  │  VS Code API         │    │  Webview UI          │ │
│  │  - Workspace API     │◄───┤  - HTML/CSS/JS       │ │
│  │  - Window API        │    │  - Message Passing   │ │
│  │  - Commands API     │    └──────────────────────┘ │
│  └──────────────────────┘                            │
│         │                                              │
│         ▼                                              │
│  ┌──────────────────────────────────────────────────┐ │
│  │         Google Gemini AI API                      │ │
│  │         - Generate Content                        │ │
│  │         - Natural Language Processing            │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Component Overview

### 1. Extension Entry Point (`src/extension.ts`)

**Responsibility**: Extension lifecycle management

**Key Functions:**
- `activate()`: Called when extension activates
- `deactivate()`: Called when extension deactivates

**Responsibilities:**
- Register commands
- Register webview providers
- Manage subscriptions

### 2. Workspace Cognitive (`src/workspace-cognitive.ts`)

**Responsibility**: AI-powered workspace analysis

**Key Features:**
- Workspace context gathering
- AI integration
- File editing with Accept/Reject
- Workspace file structure analysis

**Key Methods:**
- `resolveWebviewView()`: Creates webview
- `handleUserMessage()`: Processes user queries
- `gatherWorkspaceContext()`: Collects workspace data
- `applyEdit()`: Applies file changes

### 3. Git Command Generator (`src/git-command-generator.ts`)

**Responsibility**: Git command generation from natural language

**Key Features:**
- Natural language to Git commands
- Command execution
- Simple chat interface

**Key Methods:**
- `resolveWebviewView()`: Creates webview
- `handleUserMessage()`: Processes Git questions
- `parseGitCommands()`: Extracts commands from AI response

### 4. Webview UI (`media/main.js`)

**Responsibility**: User interface and interaction

**Key Features:**
- Chat interface
- Message rendering
- Command execution buttons
- File edit UI (Accept/Reject)
- Loading states

## Data Flow

### User Query Flow

```
User Input (Webview)
    │
    ▼
Message to Extension (postMessage)
    │
    ▼
handleUserMessage()
    │
    ▼
Gather Workspace Context (if needed)
    │
    ▼
Call AI API (Google Gemini)
    │
    ▼
Process AI Response
    │
    ▼
Send Response to Webview
    │
    ▼
Render in UI
```

### File Edit Flow

```
AI Suggests File Edit
    │
    ▼
Extract File Edit from Response
    │
    ▼
Show Accept/Reject UI
    │
    ▼
User Clicks Accept
    │
    ▼
Message to Extension (applyEdit)
    │
    ▼
Resolve File Path
    │
    ▼
Apply WorkspaceEdit
    │
    ▼
Show Success/Error
```

## Key Design Patterns

### 1. Provider Pattern

Each feature implements `WebviewViewProvider`:

```typescript
class FeatureProvider implements vscode.WebviewViewProvider {
    resolveWebviewView(webviewView: vscode.WebviewView) {
        // Setup webview
    }
}
```

**Benefits:**
- Separation of concerns
- Reusable pattern
- Easy to test

### 2. Message Passing Pattern

Bidirectional communication:

```typescript
// Extension → Webview
webview.postMessage({ type: 'update', data: ... });

// Webview → Extension
vscode.postMessage({ type: 'action', data: ... });
```

**Benefits:**
- Decoupled communication
- Type-safe messages
- Easy to extend

### 3. Context Gathering Pattern

Collect workspace data before AI call:

```typescript
async function handleUserMessage(message: string) {
    const context = await gatherWorkspaceContext();
    const prompt = `Context: ${context}\nUser: ${message}`;
    // ...
}
```

**Benefits:**
- Context-aware responses
- Better AI results
- Reusable context gathering

## File Structure

```
src/
├── extension.ts              # Entry point, registration
├── workspace-cognitive.ts    # Advanced AI workspace assistant
└── git-command-generator.ts  # Simple Git command generator

media/
├── main.js                   # Webview JavaScript (shared)
└── main.css                  # Webview styles (if needed)

docs/                         # Documentation
├── 01-setup-guide.md
├── 02-extension-basics.md
└── ...

package.json                  # Extension manifest
tsconfig.json                # TypeScript config
webpack.config.js           # Build config
```

## Extension Points

Defined in `package.json`:

1. **Views**: `natural-git.view`, `natural-git.git-view`
2. **Commands**: `natural-git.askGit`
3. **View Container**: `natural-git` (Activity Bar)

## Security Considerations

1. **Webview Isolation**: Webviews run in isolated context
2. **Resource Loading**: Use `asWebviewUri()` for local resources
3. **API Keys**: Should use VS Code configuration (not hardcoded)
4. **Message Validation**: Validate all messages from webview

## Performance Considerations

1. **Lazy Loading**: Features load only when activated
2. **Context Caching**: Cache workspace context when possible
3. **Webview State**: Use `retainContextWhenHidden` to preserve state
4. **Async Operations**: All I/O operations are async

## Extension Lifecycle

```
Install
  │
  ▼
Activate (activate() called)
  │
  ▼
Register Providers
  │
  ▼
User Interaction
  │
  ▼
Deactivate (deactivate() called)
  │
  ▼
Uninstall
```

## Next Steps

- Review [Extension Basics](./02-extension-basics.md)
- Understand [Webviews](./04-webviews-explained.md)
- Learn [AI Integration](./07-ai-integration.md)

