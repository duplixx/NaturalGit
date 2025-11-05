![NaturalGit](./images/icon.png)

# NaturalGit - VS Code Extension Development Tutorial

A comprehensive learning resource for building AI-powered VS Code extensions. This project demonstrates how to create a VS Code extension that uses AI to understand workspace context and generate Git commands.

## 🎓 Learning Objectives

By completing this tutorial, you will learn:

1. **VS Code Extension Development Basics**
   - Extension architecture and lifecycle
   - Webview API for custom UI
   - VS Code extension manifest (package.json)
   - Activation events and commands

2. **TypeScript for Extensions**
   - TypeScript configuration
   - Type definitions for VS Code API
   - Module organization

3. **Webview Development**
   - Creating custom UIs in VS Code
   - Message passing between extension and webview
   - HTML/CSS/JavaScript in webviews

4. **AI Integration**
   - Integrating Google Gemini AI
   - Prompt engineering
   - Context-aware responses

5. **Workspace API**
   - Reading workspace files and structure
   - Accessing open editors
   - Git status integration
   - File system operations

6. **Modern UI/UX**
   - Chat interface design
   - Loading states and animations
   - Interactive command execution
   - File editing with Accept/Reject

## 📚 Learning Path

### Phase 1: Getting Started (Beginner)
1. [Setup Guide](./docs/01-setup-guide.md) - Environment setup
2. [Extension Basics](./docs/02-extension-basics.md) - Understanding VS Code extensions
3. [First Extension](./docs/03-first-extension.md) - Building your first extension

### Phase 2: Core Concepts (Intermediate)
4. [Webviews Explained](./docs/04-webviews-explained.md) - Custom UI in VS Code
5. [Message Passing](./docs/05-message-passing.md) - Communication patterns
6. [Workspace API](./docs/06-workspace-api.md) - Accessing workspace data

### Phase 3: Advanced Features (Advanced)
7. [AI Integration](./docs/07-ai-integration.md) - Adding AI capabilities
8. [File Operations](./docs/08-file-operations.md) - Reading and writing files
9. [UI/UX Design](./docs/09-ui-ux-design.md) - Building modern interfaces

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- VS Code 1.74.0 or higher
- Git
- Basic knowledge of TypeScript and JavaScript

### Installation

```bash
# Clone the repository
git clone https://github.com/duplixx/NaturalGit.git
cd NaturalGit

# Install dependencies
npm install

# Compile the extension
npm run compile

# Run the extension (press F5 in VS Code)
```

See [Setup Guide](./docs/01-setup-guide.md) for detailed instructions.

## 📁 Project Structure

```
NaturalGit/
├── src/                          # Source code
│   ├── extension.ts            # Main entry point (📖 Lesson 1)
│   ├── git-command-generator.ts # Git command generator (📖 Lesson 2)
│   └── workspace-cognitive.ts  # Workspace AI assistant (📖 Lesson 3)
├── media/                        # Webview assets
│   ├── main.js                 # Webview JavaScript
│   └── main.css                 # Webview styles
├── docs/                        # Documentation and tutorials
│   ├── 01-setup-guide.md
│   ├── 02-extension-basics.md
│   └── ...
├── images/                       # Extension assets
├── package.json                 # Extension manifest
├── tsconfig.json               # TypeScript config
└── webpack.config.js           # Build configuration
```

## 🎯 Features Implemented

### 1. Git Command Generator
- Converts natural language to Git commands
- Executable command buttons
- See: `src/git-command-generator.ts`

### 2. Workspace Cognitive Assistant
- Analyzes workspace context
- Understands file structure
- Provides intelligent responses
- See: `src/workspace-cognitive.ts`

### 3. Direct File Editing
- Accept/Reject file changes
- Preview code changes
- See: File edit implementation in `workspace-cognitive.ts`

### 4. Modern Chat UI
- Cursor-like interface
- Loading animations
- Message bubbles
- See: `media/main.js` and CSS

## 📖 Detailed Tutorials

Each tutorial builds on the previous one:

1. **[Setup Guide](./docs/01-setup-guide.md)** - Get your development environment ready
2. **[Extension Basics](./docs/02-extension-basics.md)** - Understand VS Code extension architecture
3. **[First Extension](./docs/03-first-extension.md)** - Build a simple "Hello World" extension
4. **[Webviews Explained](./docs/04-webviews-explained.md)** - Create custom UI in VS Code
5. **[Message Passing](./docs/05-message-passing.md)** - Communication between extension and webview
6. **[Workspace API](./docs/06-workspace-api.md)** - Access workspace files and editors
7. **[AI Integration](./docs/07-ai-integration.md)** - Add AI capabilities with Gemini
8. **[File Operations](./docs/08-file-operations.md)** - Read, write, and edit files
9. **[UI/UX Design](./docs/09-ui-ux-design.md)** - Build beautiful, responsive interfaces

## 🛠️ Development

### Build Commands

```bash
npm run compile          # Compile TypeScript
npm run watch           # Watch mode for development
npm run package         # Create production build
npm run lint            # Check code quality
npm test                # Run tests
```

### Debugging

1. Press `F5` to open a new Extension Development Host window
2. The extension will be loaded in this window
3. Use VS Code's debugger to set breakpoints
4. See `.vscode/launch.json` for debug configurations

## 📝 Code Walkthrough

### Entry Point (`src/extension.ts`)
The main file that activates the extension and registers providers.

### Git Command Generator (`src/git-command-generator.ts`)
Demonstrates:
- Webview provider implementation
- AI integration basics
- Command execution

### Workspace Cognitive (`src/workspace-cognitive.ts`)
Advanced features:
- Workspace context gathering
- File system operations
- AI prompt engineering
- File editing with WorkspaceEdit

## 🎓 Exercises

Try these exercises to reinforce learning:

1. **Exercise 1**: Add a new command to the extension
2. **Exercise 2**: Create a custom webview with different UI
3. **Exercise 3**: Integrate a different AI provider
4. **Exercise 4**: Add file diff visualization
5. **Exercise 5**: Create a settings page

See [Exercises Guide](./docs/exercises.md) for detailed instructions.

## 🤝 Contributing

This is an educational project. Contributions that improve:
- Documentation clarity
- Code comments and explanations
- Tutorial content
- Example exercises

are especially welcome!

## 📄 License

MIT License - Feel free to use this project for learning and teaching.

## 🙏 Acknowledgments

Built with:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Google Gemini AI](https://ai.google.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Webpack](https://webpack.js.org/)

## 📚 Additional Resources

- [VS Code Extension API Documentation](https://code.visualstudio.com/api)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Webpack Documentation](https://webpack.js.org/concepts/)

---

**Happy Learning! 🚀**

Start with the [Setup Guide](./docs/01-setup-guide.md) and work through the tutorials in order.
