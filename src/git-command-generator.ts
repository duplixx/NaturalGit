import * as vscode from 'vscode';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyAOqw73yo8DkfoeYl4dY7mzwEKUPilBAIk");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default class GitCommandGenerator implements vscode.WebviewViewProvider {
    private webView?: vscode.WebviewView;
    private responseQueue: Array<{ type: string; value: any }> = [];

    constructor(private context: vscode.ExtensionContext) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this.webView = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            if (data.type === 'userMessage') {
                this.handleUserMessage(data.value);
            } else if (data.type === 'insertCommand') {
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
                type: 'aiResponse', 
                value: { message, commands: gitCommands }
            });
        } catch (error: any) {
            console.error("Error in handleUserMessage:", error);
            vscode.window.showErrorMessage(`Error generating Git commands: ${error.message}`);
            
            this.sendMessageToWebview({
                type: 'aiResponse', 
                value: { message, commands: [`Error: ${error.message}`] }
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
        const lines = text.split('\n');
        const gitCommands = lines.filter(line => {
            const trimmedLine = line.trim();
            return trimmedLine.startsWith('git ') || trimmedLine.startsWith('$');
        }).map(line => line.trim().replace(/^\$\s*/, ''));

        return gitCommands.length > 0 ? gitCommands : [text];
    }

    private insertCommand(command: string) {
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('Git');
        terminal.sendText(command);
        terminal.show();
    }

    private getHtml(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'main.js')
        ));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Git Command Generator</title>
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
				<script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: Arial, sans-serif; padding: 10px; }
                    #chat-container { height: 300px; overflow-y: auto; border: 1px solid #ccc; margin-bottom: 10px; padding: 10px; }
                    #user-input { width: 70%; padding: 5px; }
                    #send-button { width: 25%; padding: 5px; }
                    .message { margin-bottom: 10px; }
                    .user-message { color: blue;}
                    .ai-message { color: green; }
                    .command-button {
                        margin-top: 5px;
                        background-color: #D3D3D3;
                        border: 1px solid #D3D3D3;
                        border-radius: 40px;
                        padding: 10px 20px;
                        color: #333;
                        cursor: pointer;
                        transition: background-color 0.3s, border-color 0.3s, transform 0.2s;
                    }
                    .command-button:hover {
                        background-color: #C0C0C0;
                        border-color: #C0C0C0;
                    }
                    .command-button:active {
                        background-color: #A9A9A9;
                        border-color: #A9A9A9;
                        transform: scale(0.95);
                    }
                </style>
            </head>
            <body class="bg-gray-800 p-5">
            <div id="chat-container" class="overflow-y-auto rounded-md"></div>
            <div class="flex">
            <input id="user-input" type="text" placeholder="Ask about Git commands..." class="w-3/4 p-2 border border-gray-300 rounded-l-lg">
            <button id="send-button" class="w-1/4 bg-blue-500 text-white p-2 rounded-r-lg">Send</button>
        </div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}