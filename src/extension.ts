/**
 * NaturalGit - VS Code Extension
 * 
 * This is the main entry point for the extension.
 * It registers commands and webview providers when the extension activates.
 * 
 * @see https://code.visualstudio.com/api/get-started/your-first-extension
 */

import * as vscode from 'vscode';
import GitCommandGenerator from './git-command-generator';
import WorkspaceCognitive from './workspace-cognitive';

/**
 * This function is called when your extension is activated.
 * Activation happens when:
 * - A user opens a view that uses this extension
 * - A command from this extension is executed
 * - An activation event defined in package.json is triggered
 * 
 * @param context - Extension context that provides:
 *   - subscriptions: For registering disposables (cleanup)
 *   - extensionPath: Path to extension directory
 *   - workspaceState: Persistent storage for extension
 */
export async function activate(context: vscode.ExtensionContext) {
    // Create instances of our feature providers
    // These implement WebviewViewProvider to create custom UI
    const gitCommandGenerator = new GitCommandGenerator(context);
    const workspaceCognitive = new WorkspaceCognitive(context);

    // Register all extension contributions
    // context.subscriptions ensures proper cleanup when extension deactivates
    context.subscriptions.push(
        // Register a command that users can invoke
        // Users can run this via Command Palette (Cmd+Shift+P)
        vscode.commands.registerCommand('natural-git.askGit', askGPTToGitCommands),
        
        // Register webview view provider for Workspace Cognitive feature
        // This creates a view in the sidebar (Activity Bar)
        // retainContextWhenHidden: keeps webview state when hidden
        vscode.window.registerWebviewViewProvider("natural-git.view", workspaceCognitive, {
            webviewOptions: { retainContextWhenHidden: true }
        }),
        
        // Register webview view provider for Git Command Generator
        // Uncomment to enable Git command generator view
        vscode.window.registerWebviewViewProvider("natural-git.git-view", gitCommandGenerator, {
            webviewOptions: { retainContextWhenHidden: true }
        })
    );

    /**
     * Command handler for 'natural-git.askGit'
     * Shows an input box, then processes the user's Git question
     */
    async function askGPTToGitCommands() {
        // Show input box to get user's question
        const userInput = await vscode.window.showInputBox({ 
            prompt: "Ask about Git commands" 
        }) || "";
        
        // If user provided input, process it through the Git command generator
        if (userInput) {
            gitCommandGenerator.handleUserMessage(userInput);
        }
    }
}

/**
 * Optional: Called when extension is deactivated
 * Use this for cleanup if needed
 */
export function deactivate() {
    // Cleanup code here if needed
}