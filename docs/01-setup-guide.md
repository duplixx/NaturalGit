# Setup Guide

This guide will help you set up your development environment to build VS Code extensions.

## Prerequisites

Before you begin, ensure you have the following installed:

### 1. Node.js
- **Version**: 18.x or higher
- **Download**: [nodejs.org](https://nodejs.org/)
- **Verify**: Run `node --version` in terminal

### 2. VS Code
- **Version**: 1.74.0 or higher
- **Download**: [code.visualstudio.com](https://code.visualstudio.com/)
- **Extensions**: Install "TypeScript and JavaScript Language Features"

### 3. Git
- **Download**: [git-scm.com](https://git-scm.com/)
- **Verify**: Run `git --version` in terminal

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/duplixx/NaturalGit.git
cd NaturalGit
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- TypeScript and type definitions
- Webpack for bundling
- VS Code extension tools
- AI libraries (Google Gemini)

### Step 3: Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list --depth=0
```

### Step 4: Build the Extension

```bash
npm run compile
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Step 5: Open in VS Code

```bash
code .
```

## Configuration Files Explained

### `package.json`
- **Purpose**: Extension manifest
- **Key fields**:
  - `main`: Entry point (compiled JavaScript)
  - `contributes`: Extension contributions (views, commands)
  - `activationEvents`: When extension activates

### `tsconfig.json`
- **Purpose**: TypeScript configuration
- **Key settings**:
  - `target`: ES2020 (modern JavaScript)
  - `module`: CommonJS (Node.js compatible)
  - `lib`: Includes DOM types for webviews

### `webpack.config.js`
- **Purpose**: Bundles code for production
- **Output**: `dist/extension.js`

## Running the Extension

### Method 1: Debug Mode (Recommended)

1. Open the project in VS Code
2. Press `F5` or go to Run → Start Debugging
3. A new "Extension Development Host" window opens
4. The extension is loaded in this window

### Method 2: Package and Install

```bash
# Create VSIX package
npm run package

# Install the extension
code --install-extension natural-git-2.0.0.vsix
```

## Troubleshooting

### Issue: `npm install` fails

**Solution**: Clear npm cache and try again
```bash
npm cache clean --force
npm install
```

### Issue: TypeScript compilation errors

**Solution**: Check TypeScript version
```bash
npm list typescript
npm install typescript@latest --save-dev
```

### Issue: Extension not loading

**Solution**: 
1. Check `dist/extension.js` exists
2. Check `package.json` `main` field points to correct file
3. Restart VS Code

### Issue: Webpack build errors

**Solution**: 
```bash
rm -rf node_modules dist
npm install
npm run compile
```

## Next Steps

Once setup is complete, proceed to:
- [Extension Basics](./02-extension-basics.md) - Learn about VS Code extension architecture

## Additional Resources

- [VS Code Extension Development](https://code.visualstudio.com/api)
- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

