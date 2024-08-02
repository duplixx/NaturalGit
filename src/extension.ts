import * as vscode from 'vscode';
import GitCommandGenerator from './git-command-generator'

export async function activate(context: vscode.ExtensionContext) {

    const gitCommandGenerator = new GitCommandGenerator(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('natural-git.askGit', askGPTToGitCommands),
        vscode.window.registerWebviewViewProvider("natural-git.git-view", gitCommandGenerator, {
            webviewOptions: { retainContextWhenHidden: true }
        })
    );

    async function askGPTToGitCommands() { 
        // Instead of using askChatGPT, we'll use the GitCommandGenerator
        const userInput = await vscode.window.showInputBox({ prompt: "Ask about Git commands" }) || "";
        gitCommandGenerator.handleUserMessage(userInput);
    }
}