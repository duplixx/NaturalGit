# AI Integration

This tutorial explains how to integrate AI (Google Gemini) into your VS Code extension.

## Overview

Our extension uses Google Gemini AI to:
- Generate Git commands from natural language
- Analyze workspace context
- Provide intelligent code suggestions

## Setup

### 1. Install Dependencies

```bash
npm install @google/generative-ai
```

### 2. Get API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Store it securely (we'll use it in code)

## Basic Integration

### Step 1: Initialize AI Client

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with API key
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

// Get model instance
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
```

**Key Points:**
- `GoogleGenerativeAI`: Main client class
- `getGenerativeModel`: Get specific model
- `gemini-2.5-flash`: Fast, efficient model

### Step 2: Generate Content

```typescript
async function askAI(prompt: string): Promise<string> {
    const result = await model.generateContent(prompt);
    
    if (!result || !result.response) {
        throw new Error("No response from AI");
    }
    
    const responseText = result.response.text();
    return responseText;
}
```

**Flow:**
1. Send prompt to AI
2. Wait for response
3. Extract text
4. Handle errors

## Real Example: Git Command Generator

Let's examine `src/git-command-generator.ts`:

```typescript
export default class GitCommandGenerator implements vscode.WebviewViewProvider {
    public async handleUserMessage(message: string) {
        try {
            // Create prompt
            const prompt = `Convert the following request to Git commands: ${message}`;
            
            // Call AI
            const result = await model.generateContent(prompt);
            
            // Extract response
            const responseText = result.response.text();
            
            // Parse commands
            const gitCommands = this.parseGitCommands(responseText);
            
            // Send to webview
            this.sendMessageToWebview({
                type: "aiResponse",
                value: { message, commands: gitCommands }
            });
        } catch (error: any) {
            // Handle errors
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    }
}
```

**Key Concepts:**
- **Prompt Engineering**: Craft effective prompts
- **Error Handling**: Handle API failures
- **Response Parsing**: Extract useful information
- **UI Updates**: Show results to user

## Prompt Engineering

### Best Practices

1. **Be Specific**
   ```typescript
   // ❌ Bad
   const prompt = `Convert: ${message}`;
   
   // ✅ Good
   const prompt = `Convert the following natural language request to Git commands: ${message}`;
   ```

2. **Provide Context**
   ```typescript
   const prompt = `You are a Git expert. Convert to Git commands:
   ${message}
   
   Provide only the commands, one per line.`;
   ```

3. **Use Formatting Instructions**
   ```typescript
   const prompt = `Convert to Git commands. Format as:
   - git command1
   - git command2
   
   Request: ${message}`;
   ```

### Advanced Prompts

**Workspace Context:**
```typescript
const workspaceContext = await gatherWorkspaceContext();
const prompt = `You are analyzing a VS Code workspace.

Workspace Context:
${workspaceContext}

User Request: ${message}

Provide a detailed analysis considering the workspace structure.`;
```

## Error Handling

### Common Errors

1. **API Key Invalid**
   ```typescript
   catch (error: any) {
       if (error.message.includes('API key')) {
           vscode.window.showErrorMessage('Invalid API key');
       }
   }
   ```

2. **Rate Limiting**
   ```typescript
   catch (error: any) {
       if (error.status === 429) {
           vscode.window.showWarningMessage('Rate limit exceeded. Please wait.');
       }
   }
   ```

3. **Network Errors**
   ```typescript
   catch (error: any) {
       if (error.code === 'ENOTFOUND') {
           vscode.window.showErrorMessage('Network error. Check connection.');
       }
   }
   ```

## Security Considerations

### ⚠️ Never Hardcode API Keys

**❌ Bad:**
```typescript
const API_KEY = "hardcoded-key-here";
```

**✅ Good:**
```typescript
// Use VS Code settings
const config = vscode.workspace.getConfiguration('naturalGit');
const apiKey = config.get<string>('apiKey');

if (!apiKey) {
    vscode.window.showErrorMessage('API key not configured');
    return;
}
```

### Configuration

Add to `package.json`:
```json
{
  "contributes": {
    "configuration": {
      "title": "NaturalGit",
      "properties": {
        "naturalGit.apiKey": {
          "type": "string",
          "default": "",
          "description": "Google Gemini API Key"
        }
      }
    }
  }
}
```

## Advanced: Streaming Responses

For long responses, stream content:

```typescript
async function streamResponse(prompt: string) {
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
        const text = chunk.text();
        // Send partial response to webview
        this.sendPartialResponse(text);
    }
}
```

## Practice Exercise

### Exercise: Add Configuration

1. Add API key setting to `package.json`
2. Read from configuration in code
3. Show error if not configured
4. Add "Configure API Key" command

**Solution:**
```typescript
// In extension.ts
vscode.commands.registerCommand('naturalGit.configureApiKey', async () => {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter Google Gemini API Key',
        password: true
    });
    
    if (apiKey) {
        await vscode.workspace.getConfiguration().update(
            'naturalGit.apiKey',
            apiKey,
            vscode.ConfigurationTarget.Global
        );
    }
});
```

## Next Steps

- [Workspace API](./06-workspace-api.md) - Access workspace data for context
- [File Operations](./08-file-operations.md) - Apply AI suggestions to files

## Key Takeaways

✅ Use `GoogleGenerativeAI` for AI integration  
✅ Craft effective prompts for better results  
✅ Handle errors gracefully  
✅ Never hardcode API keys  
✅ Use VS Code configuration for secrets  
✅ Consider streaming for long responses

