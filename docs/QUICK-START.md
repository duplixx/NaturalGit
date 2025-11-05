# Quick Start Guide

Get up and running with NaturalGit in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- VS Code 1.74+ installed
- Git installed

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/duplixx/NaturalGit.git
cd NaturalGit
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Compile Extension

```bash
npm run compile
```

### Step 4: Run Extension

1. Open the project in VS Code:
   ```bash
   code .
   ```

2. Press `F5` to start debugging

3. A new "Extension Development Host" window opens

4. In the new window:
   - Click the Activity Bar icon (ChatGPT icon)
   - Open "Workspace Cognitive" view
   - Start asking questions!

## First Steps

### 1. Test the Extension

In the Extension Development Host window:

1. Open the Workspace Cognitive view
2. Type a question like: "What files are in this workspace?"
3. See the AI response!

### 2. Try Git Commands

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type "Ask Git Command"
3. Ask: "How do I commit changes?"
4. See the generated Git command!

### 3. Explore the Code

1. Open `src/extension.ts` - Entry point
2. Open `src/workspace-cognitive.ts` - Workspace AI
3. Open `src/git-command-generator.ts` - Git commands
4. Read the code comments!

## Common Tasks

### Rebuild Extension

```bash
npm run compile
```

### Watch Mode (Auto-compile)

```bash
npm run watch
```

### Run Tests

```bash
npm test
```

### Check Code Quality

```bash
npm run lint
```

## Next Steps

1. **Read the Tutorials**
   - Start with [Setup Guide](./01-setup-guide.md)
   - Follow [Learning Path](./LEARNING-PATH.md)

2. **Explore the Code**
   - Read code comments
   - Understand the architecture
   - Try modifying features

3. **Build Something**
   - Create your own extension
   - Add new features
   - Experiment!

## Troubleshooting

### Extension Not Loading

1. Check `dist/extension.js` exists
2. Run `npm run compile`
3. Restart VS Code

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run compile
```

### TypeScript Errors

```bash
# Check TypeScript version
npm list typescript

# Update if needed
npm install typescript@latest --save-dev
```

## Getting Help

- Check [Documentation](./README.md)
- Read [Tutorials](./README.md)
- Review [Architecture](./ARCHITECTURE.md)
- Open an issue on GitHub

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)

---

**Ready to learn?** Start with the [Setup Guide](./01-setup-guide.md)!

