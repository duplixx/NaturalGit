import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as child_process from "child_process";
import { promisify } from "util";
import { GoogleGenerativeAI } from "@google/generative-ai";

const exec = promisify(child_process.exec);

const genAI = new GoogleGenerativeAI("AIzaSyAeLd3rITUK3dmxMvGwCaJcWD79y5Arsso");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export default class WorkspaceCognitive implements vscode.WebviewViewProvider {
  private webView?: vscode.WebviewView;
  private responseQueue: Array<{ type: string; value: any }> = [];

  constructor(private context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.type === "userMessage") {
        this.handleUserMessage(data.value);
      } else if (data.type === "insertCommand") {
        this.insertCommand(data.value);
      } else if (data.type === "applyEdit") {
        await this.applyEdit(data.value);
      } else if (data.type === "rejectEdit") {
        // Just remove the edit UI, no action needed
      }
    });

    // Process any queued responses
    while (this.responseQueue.length > 0) {
      const response = this.responseQueue.shift();
      if (response) {
        this.webView.webview.postMessage(response);
      }
    }
  }

  public async handleUserMessage(message: string) {
    try {
      // Gather workspace context
      const workspaceContext = await this.gatherWorkspaceContext();

      const prompt = `You are analyzing a VS Code workspace. Here is the current workspace context:

${workspaceContext}

User request: ${message}

Analyze the request in the context of the workspace and provide a detailed, helpful response. Consider the workspace structure, open files, and current state when answering.

If you suggest any commands (git, npm, shell commands, etc.), format them in code blocks with \`\`\`bash or \`\`\`sh tags so they can be easily executed.

If you need to fix or modify code in a file, format it as:
\`\`\`file:path/to/file.ext
[code content here]
\`\`\`

This will allow the user to directly apply the fix to the file.`;

      const result = await model.generateContent(prompt);

      if (!result || !result.response) {
        throw new Error("No response from Gemini");
      }

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      this.sendMessageToWebview({
        type: "aiResponse",
        value: { message, analysis: responseText },
      });
    } catch (error: any) {
      console.error("Error in handleUserMessage:", error);
      vscode.window.showErrorMessage(
        `Error generating workspace analysis: ${error.message}`
      );

      this.sendMessageToWebview({
        type: "aiResponse",
        value: { message, analysis: `Error: ${error.message}` },
      });
    }
  }

  private async gatherWorkspaceContext(): Promise<string> {
    const contextParts: string[] = [];

    // Get workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      contextParts.push("=== WORKSPACE FOLDERS ===");
      workspaceFolders.forEach((folder, index) => {
        contextParts.push(
          `Folder ${index + 1}: ${folder.name} (${folder.uri.fsPath})`
        );
      });
      contextParts.push("");
    }

    // Get open files and their contents
    const openFiles = await this.getOpenFilesContext();
    if (openFiles) {
      contextParts.push("=== OPEN FILES ===");
      contextParts.push(openFiles);
      contextParts.push("");
    }

    // Get current active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      contextParts.push("=== CURRENTLY ACTIVE FILE ===");
      contextParts.push(
        `File: ${path.basename(activeEditor.document.fileName)}`
      );
      contextParts.push(`Path: ${activeEditor.document.fileName}`);
      contextParts.push(`Language: ${activeEditor.document.languageId}`);
      contextParts.push(`Line count: ${activeEditor.document.lineCount}`);
      if (activeEditor.selection) {
        const startLine = activeEditor.selection.start.line + 1;
        const endLine = activeEditor.selection.end.line + 1;
        contextParts.push(`Selected lines: ${startLine}-${endLine}`);

        // Include selected text if any
        const selectedText = activeEditor.document.getText(
          activeEditor.selection
        );
        if (selectedText.trim()) {
          contextParts.push(`Selected text:\n${selectedText}`);
        }
      }
      contextParts.push("");
    }

    // Get workspace file structure (limited to avoid token limits)
    const fileStructure = await this.getWorkspaceFileStructure();
    if (fileStructure) {
      contextParts.push("=== WORKSPACE FILE STRUCTURE ===");
      contextParts.push(fileStructure);
      contextParts.push("");
    }

    // Get Git status if available
    const gitStatus = await this.getGitStatus();
    if (gitStatus) {
      contextParts.push("=== GIT STATUS ===");
      contextParts.push(gitStatus);
      contextParts.push("");
    }

    // Get recently modified files
    const recentFiles = await this.getRecentFiles();
    if (recentFiles) {
      contextParts.push("=== RECENTLY MODIFIED FILES ===");
      contextParts.push(recentFiles);
      contextParts.push("");
    }

    return contextParts.join("\n");
  }

  private async getOpenFilesContext(): Promise<string | null> {
    const openFiles: string[] = [];
    const textDocuments = vscode.workspace.textDocuments;

    if (textDocuments.length === 0) {
      return null;
    }

    // Limit to first 5 open files to avoid token limits
    const filesToProcess = textDocuments.slice(0, 5);

    for (const doc of filesToProcess) {
      if (doc.isUntitled) {
        openFiles.push(`[Untitled] - Language: ${doc.languageId}`);
      } else {
        const fileName = path.basename(doc.fileName);
        const filePath = doc.uri.fsPath;
        const lineCount = doc.lineCount;
        const language = doc.languageId;

        // Get a preview of the file (first 50 lines)
        const previewLines = Math.min(50, lineCount);
        const preview = doc.getText(new vscode.Range(0, 0, previewLines, 0));

        openFiles.push(`File: ${fileName}`);
        openFiles.push(`Path: ${filePath}`);
        openFiles.push(`Language: ${language}`);
        openFiles.push(`Lines: ${lineCount}`);
        openFiles.push(`Preview (first ${previewLines} lines):`);
        openFiles.push("```");
        openFiles.push(preview);
        openFiles.push("```");
        openFiles.push("");
      }
    }

    return openFiles.length > 0 ? openFiles.join("\n") : null;
  }

  private async getWorkspaceFileStructure(): Promise<string | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null;
    }

    const structure: string[] = [];

    // Process first workspace folder (or all if multiple)
    for (const folder of workspaceFolders.slice(0, 1)) {
      try {
        const rootPath = folder.uri.fsPath;
        structure.push(`Root: ${folder.name}`);
        structure.push(await this.getDirectoryTree(rootPath, 0, 3)); // Max depth 3
      } catch (error: any) {
        structure.push(`Error reading ${folder.name}: ${error.message}`);
      }
    }

    return structure.length > 0 ? structure.join("\n") : null;
  }

  private async getDirectoryTree(
    dirPath: string,
    currentDepth: number,
    maxDepth: number
  ): Promise<string> {
    if (currentDepth >= maxDepth) {
      return "";
    }

    const lines: string[] = [];
    const indent = "  ".repeat(currentDepth);

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      // Sort: directories first, then files
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) {
          return -1;
        }
        if (!a.isDirectory() && b.isDirectory()) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Limit entries per directory to avoid token limits
      const maxEntries = currentDepth === 0 ? 50 : 20;
      const entriesToProcess = entries.slice(0, maxEntries);

      for (const entry of entriesToProcess) {
        // Skip common ignore patterns
        if (this.shouldIgnoreFile(entry.name)) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          lines.push(`${indent}📁 ${entry.name}/`);
          if (currentDepth < maxDepth - 1) {
            const subTree = await this.getDirectoryTree(
              fullPath,
              currentDepth + 1,
              maxDepth
            );
            if (subTree) {
              lines.push(subTree);
            }
          }
        } else {
          const stats = fs.statSync(fullPath);
          const size = this.formatFileSize(stats.size);
          lines.push(`${indent}📄 ${entry.name} (${size})`);
        }
      }

      if (entries.length > maxEntries) {
        lines.push(
          `${indent}... (${entries.length - maxEntries} more entries)`
        );
      }
    } catch (error: any) {
      lines.push(`${indent}Error: ${error.message}`);
    }

    return lines.join("\n");
  }

  private shouldIgnoreFile(fileName: string): boolean {
    const ignorePatterns = [
      "node_modules",
      ".git",
      ".vscode",
      "dist",
      "out",
      "build",
      ".next",
      ".cache",
      "coverage",
      ".DS_Store",
      "*.log",
      ".env",
      ".env.local",
    ];

    return ignorePatterns.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace("*", ".*"));
        return regex.test(fileName);
      }
      return fileName === pattern || fileName.startsWith(pattern + "/");
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private async getGitStatus(): Promise<string | null> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const gitPath = path.join(rootPath, ".git");

      if (!fs.existsSync(gitPath)) {
        return "Not a Git repository";
      }

      // Get git status using child_process
      try {
        const { stdout: branch } = await exec("git branch --show-current", {
          cwd: rootPath,
        });
        const { stdout: status } = await exec("git status --short", {
          cwd: rootPath,
        });
        const { stdout: remote } = await exec("git remote -v", {
          cwd: rootPath,
        }).catch(() => ({ stdout: "" }));

        const statusLines: string[] = [];
        statusLines.push(`Current branch: ${branch.trim()}`);
        if (remote.trim()) {
          statusLines.push(`Remote: ${remote.trim().split("\n")[0]}`);
        }
        if (status.trim()) {
          statusLines.push(`Modified files:\n${status.trim()}`);
        } else {
          statusLines.push("Working tree clean");
        }

        return statusLines.join("\n");
      } catch (error: any) {
        // Git command failed, but repository exists
        return "Git repository detected (unable to read status)";
      }
    } catch (error: any) {
      return `Git status error: ${error.message}`;
    }
  }

  private async getRecentFiles(): Promise<string | null> {
    try {
      // Get recently opened files from workspace state
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
      }

      const recentFiles: string[] = [];
      const textDocuments = vscode.workspace.textDocuments;

      // Get files that were recently accessed (simplified - using open documents)
      const sortedDocs = textDocuments
        .filter((doc) => !doc.isUntitled)
        .map((doc) => {
          try {
            const stats = fs.statSync(doc.uri.fsPath);
            return { doc, mtime: stats.mtime };
          } catch {
            return null;
          }
        })
        .filter(
          (item): item is { doc: vscode.TextDocument; mtime: Date } =>
            item !== null
        )
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
        .slice(0, 10); // Top 10 most recently modified

      for (const { doc } of sortedDocs) {
        recentFiles.push(
          `- ${path.basename(doc.fileName)} (${doc.uri.fsPath})`
        );
      }

      return recentFiles.length > 0 ? recentFiles.join("\n") : null;
    } catch (error: any) {
      return null;
    }
  }

  private sendMessageToWebview(message: { type: string; value: any }) {
    if (this.webView) {
      this.webView.webview.postMessage(message);
    } else {
      // Queue the message if the webview isn't ready yet
      this.responseQueue.push(message);
    }
  }

  private insertCommand(command: string) {
    const terminal =
      vscode.window.activeTerminal || vscode.window.createTerminal("Workspace");
    terminal.sendText(command);
    terminal.show();
  }

  private async applyEdit(editData: { filePath: string; content: string }) {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder found");
        return;
      }

      // Resolve file path relative to workspace
      let fileUri: vscode.Uri;
      if (path.isAbsolute(editData.filePath)) {
        fileUri = vscode.Uri.file(editData.filePath);
      } else {
        // Try to find file in workspace - check all workspace folders
        let foundUri: vscode.Uri | undefined;
        for (const folder of workspaceFolders) {
          const fullPath = path.join(folder.uri.fsPath, editData.filePath);
          if (fs.existsSync(fullPath)) {
            foundUri = vscode.Uri.file(fullPath);
            break;
          }
        }
        
        if (foundUri) {
          fileUri = foundUri;
        } else {
          // Use first workspace folder as default (will create if doesn't exist)
          const rootPath = workspaceFolders[0].uri.fsPath;
          fileUri = vscode.Uri.file(path.join(rootPath, editData.filePath));
        }
      }

      // Check if file exists
      try {
        await vscode.workspace.fs.stat(fileUri);
      } catch {
        // File doesn't exist, ask if user wants to create it
        const createFile = await vscode.window.showWarningMessage(
          `File ${editData.filePath} does not exist. Do you want to create it?`,
          "Yes",
          "No"
        );

        if (createFile !== "Yes") {
          return;
        }

        // Create directory if needed
        const dirPath = path.dirname(fileUri.fsPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      // Open the file
      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document);

      // Apply the edit
      const edit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      edit.replace(fileUri, fullRange, editData.content);
      
      const applied = await vscode.workspace.applyEdit(edit);
      
      if (applied) {
        vscode.window.showInformationMessage(
          `Successfully applied changes to ${path.basename(editData.filePath)}`
        );
        
        // Notify webview that edit was applied
        this.sendMessageToWebview({
          type: "editApplied",
          value: { filePath: editData.filePath, success: true },
        });
      } else {
        vscode.window.showErrorMessage("Failed to apply edit");
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Error applying edit: ${error.message}`
      );
      this.sendMessageToWebview({
        type: "editApplied",
        value: { filePath: editData.filePath, success: false, error: error.message },
      });
    }
  }

  private getHtml(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, "media", "main.js"))
    );

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Workspace Cognitive</title>
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-foreground);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    
                    #chat-container {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }
                    
                    .message-wrapper {
                        display: flex;
                        gap: 12px;
                        animation: fadeIn 0.3s ease-in;
                        max-width: 100%;
                    }
                    
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .message-avatar {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    
                    .user-avatar {
                        background: #007acc;
                        color: white;
                    }
                    
                    .ai-avatar {
                        background: #6e7681;
                        color: white;
                    }
                    
                    .message-content {
                        flex: 1;
                        min-width: 0;
                    }
                    
                    .message-bubble {
                        padding: 12px 16px;
                        border-radius: 8px;
                        line-height: 1.5;
                        word-wrap: break-word;
                        white-space: pre-wrap;
                    }
                    
                    .user-bubble {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        margin-left: auto;
                        max-width: 85%;
                        border-radius: 8px 8px 2px 8px;
                    }
                    
                    .ai-bubble {
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        max-width: 95%;
                        border-radius: 8px 8px 8px 2px;
                    }
                    
                    .ai-bubble h1, .ai-bubble h2, .ai-bubble h3 {
                        margin-top: 16px;
                        margin-bottom: 8px;
                        font-weight: 600;
                    }
                    
                    .ai-bubble h1:first-child, .ai-bubble h2:first-child, .ai-bubble h3:first-child {
                        margin-top: 0;
                    }
                    
                    .ai-bubble p {
                        margin-bottom: 12px;
                    }
                    
                    .ai-bubble code {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                    }
                    
                    .ai-bubble pre {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 12px;
                        border-radius: 6px;
                        overflow-x: auto;
                        margin: 12px 0;
                    }
                    
                    .ai-bubble pre code {
                        background: none;
                        padding: 0;
                    }
                    
                    .command-block {
                        margin-top: 12px;
                        padding: 12px;
                        background: var(--vscode-textCodeBlock-background);
                        border-radius: 6px;
                        border-left: 3px solid #007acc;
                    }
                    
                    .command-line {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                        padding: 8px 12px;
                        background: rgba(0, 122, 204, 0.1);
                        border-radius: 4px;
                        margin: 8px 0;
                    }
                    
                    .command-text {
                        flex: 1;
                        color: var(--vscode-foreground);
                    }
                    
                    .command-execute {
                        padding: 4px 12px;
                        background: #007acc;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        transition: background 0.2s;
                    }
                    
                    .command-execute:hover {
                        background: #005a9e;
                    }
                    
                    .command-execute:active {
                        transform: scale(0.98);
                    }
                    
                    .edit-block {
                        margin-top: 12px;
                        padding: 12px;
                        background: var(--vscode-textCodeBlock-background);
                        border-radius: 6px;
                        border-left: 3px solid #4ec9b0;
                    }
                    
                    .edit-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    
                    .edit-file-name {
                        font-weight: 600;
                        color: var(--vscode-foreground);
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                    }
                    
                    .edit-actions {
                        display: flex;
                        gap: 8px;
                    }
                    
                    .edit-button {
                        padding: 6px 16px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        transition: all 0.2s;
                    }
                    
                    .edit-accept {
                        background: #4ec9b0;
                        color: white;
                    }
                    
                    .edit-accept:hover {
                        background: #3db89f;
                    }
                    
                    .edit-reject {
                        background: var(--vscode-input-background);
                        color: var(--vscode-foreground);
                        border: 1px solid var(--vscode-input-border);
                    }
                    
                    .edit-reject:hover {
                        background: var(--vscode-list-hoverBackground);
                    }
                    
                    .edit-content {
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                        white-space: pre-wrap;
                        max-height: 300px;
                        overflow-y: auto;
                        padding: 8px;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 4px;
                        margin-top: 8px;
                    }
                    
                    .edit-status {
                        margin-top: 8px;
                        padding: 8px;
                        border-radius: 4px;
                        font-size: 12px;
                    }
                    
                    .edit-status.success {
                        background: rgba(78, 201, 176, 0.2);
                        color: #4ec9b0;
                    }
                    
                    .edit-status.error {
                        background: rgba(255, 82, 82, 0.2);
                        color: #ff5252;
                    }
                    
                    .loading-indicator {
                        display: flex;
                        gap: 8px;
                        padding: 12px 16px;
                        align-items: center;
                    }
                    
                    .loading-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: var(--vscode-foreground);
                        opacity: 0.4;
                        animation: loadingBounce 1.4s infinite ease-in-out;
                    }
                    
                    .loading-dot:nth-child(1) {
                        animation-delay: -0.32s;
                    }
                    
                    .loading-dot:nth-child(2) {
                        animation-delay: -0.16s;
                    }
                    
                    @keyframes loadingBounce {
                        0%, 80%, 100% {
                            transform: scale(0);
                            opacity: 0.4;
                        }
                        40% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    
                    .input-container {
                        padding: 12px;
                        border-top: 1px solid var(--vscode-panel-border);
                        display: flex;
                        gap: 8px;
                        background: var(--vscode-editor-background);
                    }
                    
                    #user-input {
                        flex: 1;
                        padding: 10px 14px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 6px;
                        font-size: 14px;
                        font-family: inherit;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    
                    #user-input:focus {
                        border-color: var(--vscode-focusBorder);
                    }
                    
                    #send-button {
                        padding: 10px 20px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: opacity 0.2s;
                    }
                    
                    #send-button:hover:not(:disabled) {
                        opacity: 0.9;
                    }
                    
                    #send-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    
                    /* Scrollbar styling */
                    #chat-container::-webkit-scrollbar {
                        width: 8px;
                    }
                    
                    #chat-container::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    
                    #chat-container::-webkit-scrollbar-thumb {
                        background: var(--vscode-scrollbarSlider-background);
                        border-radius: 4px;
                    }
                    
                    #chat-container::-webkit-scrollbar-thumb:hover {
                        background: var(--vscode-scrollbarSlider-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div id="chat-container"></div>
                <div class="input-container">
                    <input id="user-input" type="text" placeholder="Ask about your workspace..." />
                    <button id="send-button">Send</button>
                </div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
  }
}
