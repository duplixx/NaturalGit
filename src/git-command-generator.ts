import * as vscode from "vscode";
import * as path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAeLd3rITUK3dmxMvGwCaJcWD79y5Arsso");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export default class GitCommandGenerator implements vscode.WebviewViewProvider {
  private webView?: vscode.WebviewView;
  private responseQueue: Array<{ type: string; value: any }> = [];

  constructor(private context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      if (data.type === "userMessage") {
        this.handleUserMessage(data.value);
      } else if (data.type === "insertCommand") {
        this.insertCommand(data.value);
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
      const prompt = `Convert the following request to Git commands: ${message}`;
      const result = await model.generateContent(prompt);

      if (!result || !result.response) {
        throw new Error("No response from Gemini");
      }

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      const gitCommands = this.parseGitCommands(responseText);

      this.sendMessageToWebview({
        type: "aiResponse",
        value: { message, commands: gitCommands },
      });
    } catch (error: any) {
      console.error("Error in handleUserMessage:", error);
      vscode.window.showErrorMessage(
        `Error generating Git commands: ${error.message}`
      );

      this.sendMessageToWebview({
        type: "aiResponse",
        value: { message, commands: [`Error: ${error.message}`] },
      });
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

  private parseGitCommands(text: string): string[] {
    const lines = text.split("\n");
    const gitCommands = lines
      .filter((line) => {
        const trimmedLine = line.trim();
        return trimmedLine.startsWith("git ") || trimmedLine.startsWith("$");
      })
      .map((line) => line.trim().replace(/^\$\s*/, ""));

    return gitCommands.length > 0 ? gitCommands : [text];
  }

  private insertCommand(command: string) {
    const terminal =
      vscode.window.activeTerminal || vscode.window.createTerminal("Git");
    terminal.sendText(command);
    terminal.show();
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
                <title>Git Command Generator</title>
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
                        padding: 0;
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
                        padding: 10px 14px;
                        background: rgba(0, 122, 204, 0.15);
                        border: 1px solid rgba(0, 122, 204, 0.3);
                        border-radius: 6px;
                        margin: 8px 0;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .command-line:hover {
                        background: rgba(0, 122, 204, 0.25);
                        border-color: rgba(0, 122, 204, 0.5);
                        transform: translateX(2px);
                        box-shadow: 0 2px 4px rgba(0, 122, 204, 0.2);
                    }
                    
                    .command-text {
                        flex: 1;
                        color: var(--vscode-foreground);
                        font-weight: 500;
                    }
                    
                    .command-execute {
                        padding: 6px 16px;
                        background: #007acc;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 600;
                        transition: all 0.2s;
                        white-space: nowrap;
                    }
                    
                    .command-execute:hover {
                        background: #005a9e;
                        transform: scale(1.05);
                    }
                    
                    .command-execute:active {
                        transform: scale(0.98);
                    }
                    
                    .command-execute:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none;
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
                    <input id="user-input" type="text" placeholder="Ask about Git commands..." />
                    <button id="send-button">Send</button>
                </div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
  }
}