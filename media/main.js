(function() {
    const vscode = acquireVsCodeApi();
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    let isLoading = false;

    function sendMessage() {
        const message = userInput.value.trim();
        if (message && !isLoading) {
            appendUserMessage(message);
            showLoadingIndicator();
            vscode.postMessage({ type: 'userMessage', value: message });
            userInput.value = '';
            sendButton.disabled = true;
            isLoading = true;
        }
    }

    function appendUserMessage(content) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar user-avatar';
        avatar.textContent = 'U';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble user-bubble';
        bubble.textContent = content;
        
        messageContent.appendChild(bubble);
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageContent);
        chatContainer.appendChild(messageWrapper);
        
        scrollToBottom();
    }

    function showLoadingIndicator() {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        messageWrapper.id = 'loading-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar ai-avatar';
        avatar.textContent = 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        `;
        
        messageContent.appendChild(loadingDiv);
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageContent);
        chatContainer.appendChild(messageWrapper);
        
        scrollToBottom();
    }

    function removeLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    function appendAIMessage(analysis) {
        removeLoadingIndicator();
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar ai-avatar';
        avatar.textContent = 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble ai-bubble';
        
        // Extract file edits before processing markdown
        const fileEdits = extractFileEdits(analysis);
        
        // Remove file edit markers from analysis for display
        let displayAnalysis = analysis;
        fileEdits.forEach(edit => {
            displayAnalysis = displayAnalysis.replace(
                new RegExp(`\`\`\`file:${edit.filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n[\\s\\S]*?\\\`\\\`\\\``, 'g'),
                ''
            );
        });
        
        // Use marked.js if available to render markdown
        if (typeof marked !== 'undefined') {
            // Support both marked v2+ (marked.parse) and older versions (marked)
            if (typeof marked.parse === 'function') {
                bubble.innerHTML = marked.parse(displayAnalysis);
            } else {
                bubble.innerHTML = marked(displayAnalysis);
            }
        } else {
            // Fallback: treat as plain text with line breaks
            bubble.textContent = displayAnalysis;
            bubble.style.whiteSpace = 'pre-wrap';
        }
        
        // Extract and render executable commands
        extractAndRenderCommands(bubble, displayAnalysis);
        
        // Render file edits with Accept/Reject buttons
        fileEdits.forEach(edit => {
            renderFileEdit(bubble, edit);
        });
        
        messageContent.appendChild(bubble);
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageContent);
        chatContainer.appendChild(messageWrapper);
        
        scrollToBottom();
    }

    function extractFileEdits(text) {
        const edits = [];
        // Match code blocks with file: prefix
        const fileEditRegex = /```file:([^\n]+)\n([\s\S]*?)```/g;
        let match;
        
        while ((match = fileEditRegex.exec(text)) !== null) {
            const filePath = match[1].trim();
            const content = match[2].trim();
            edits.push({ filePath, content });
        }
        
        return edits;
    }

    function renderFileEdit(bubble, edit) {
        const editBlock = document.createElement('div');
        editBlock.className = 'edit-block';
        editBlock.dataset.filePath = edit.filePath;
        
        const header = document.createElement('div');
        header.className = 'edit-header';
        
        const fileName = document.createElement('div');
        fileName.className = 'edit-file-name';
        fileName.textContent = `📝 ${edit.filePath}`;
        
        const actions = document.createElement('div');
        actions.className = 'edit-actions';
        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'edit-button edit-accept';
        acceptButton.textContent = 'Accept';
        acceptButton.onclick = () => {
            vscode.postMessage({ 
                type: 'applyEdit', 
                value: { filePath: edit.filePath, content: edit.content }
            });
            acceptButton.disabled = true;
            acceptButton.textContent = 'Applying...';
            
            // Show status
            const status = document.createElement('div');
            status.className = 'edit-status success';
            status.textContent = 'Applying changes...';
            editBlock.appendChild(status);
        };
        
        const rejectButton = document.createElement('button');
        rejectButton.className = 'edit-button edit-reject';
        rejectButton.textContent = 'Reject';
        rejectButton.onclick = () => {
            editBlock.style.opacity = '0.5';
            editBlock.style.pointerEvents = 'none';
            const status = document.createElement('div');
            status.className = 'edit-status';
            status.textContent = 'Edit rejected';
            editBlock.appendChild(status);
        };
        
        const contentPreview = document.createElement('div');
        contentPreview.className = 'edit-content';
        contentPreview.textContent = edit.content;
        
        actions.appendChild(acceptButton);
        actions.appendChild(rejectButton);
        header.appendChild(fileName);
        header.appendChild(actions);
        
        editBlock.appendChild(header);
        editBlock.appendChild(contentPreview);
        
        bubble.appendChild(editBlock);
    }

    function extractAndRenderCommands(bubble, text) {
        // Look for code blocks that might contain commands
        const codeBlocks = bubble.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock) => {
            const codeText = codeBlock.textContent.trim();
            // Check if it looks like a command (starts with common command patterns)
            // Match commands that start with common shell commands, package managers, or executable names
            if (codeText.match(/^(git|npm|yarn|pnpm|node|python|python3|bash|sh|zsh|cd|ls|mkdir|rm|cp|mv|\.\/|\.\\|npx|tsx|ts-node|go|rust|cargo|docker|kubectl|aws|gcloud|curl|wget|echo|cat|grep|find|sed|awk|tar|zip|unzip)/i)) {
                const commandWrapper = document.createElement('div');
                commandWrapper.className = 'command-line';
                
                const commandText = document.createElement('span');
                commandText.className = 'command-text';
                commandText.textContent = codeText;
                
                const executeButton = document.createElement('button');
                executeButton.className = 'command-execute';
                executeButton.textContent = 'Run';
                executeButton.onclick = () => {
                    vscode.postMessage({ type: 'insertCommand', value: codeText });
                    executeButton.textContent = 'Running...';
                    executeButton.disabled = true;
                    setTimeout(() => {
                        executeButton.textContent = 'Run';
                        executeButton.disabled = false;
                    }, 2000);
                };
                
                commandWrapper.appendChild(commandText);
                commandWrapper.appendChild(executeButton);
                
                // Insert after the code block
                const preElement = codeBlock.closest('pre');
                if (preElement) {
                    preElement.parentNode.insertBefore(commandWrapper, preElement.nextSibling);
                }
            }
        });
        
        // Also look for inline code that might be commands
        const inlineCodes = bubble.querySelectorAll('code:not(pre code)');
        inlineCodes.forEach((code) => {
            const codeText = code.textContent.trim();
            // Only make short inline commands executable (less than 100 chars)
            if (codeText.match(/^(git|npm|yarn|pnpm|node|python|python3|bash|sh|zsh|cd|ls|mkdir|rm|cp|mv|\.\/|npx|tsx)/i) && codeText.length < 100) {
                const executeButton = document.createElement('button');
                executeButton.className = 'command-execute';
                executeButton.textContent = '▶';
                executeButton.style.marginLeft = '8px';
                executeButton.style.padding = '2px 8px';
                executeButton.onclick = () => {
                    vscode.postMessage({ type: 'insertCommand', value: codeText });
                };
                
                code.parentNode.insertBefore(executeButton, code.nextSibling);
            }
        });
    }

    function appendCommands(commands) {
        removeLoadingIndicator();
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar ai-avatar';
        avatar.textContent = 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble ai-bubble';
        
        const commandBlock = document.createElement('div');
        commandBlock.className = 'command-block';
        
        commands.forEach(command => {
            const commandLine = document.createElement('div');
            commandLine.className = 'command-line';
            
            const commandText = document.createElement('span');
            commandText.className = 'command-text';
            commandText.textContent = command;
            
            const executeButton = document.createElement('button');
            executeButton.className = 'command-execute';
            executeButton.textContent = 'Run';
            executeButton.onclick = () => {
                vscode.postMessage({ type: 'insertCommand', value: command });
                executeButton.textContent = 'Running...';
                executeButton.disabled = true;
                setTimeout(() => {
                    executeButton.textContent = 'Run';
                    executeButton.disabled = false;
                }, 2000);
            };
            
            commandLine.appendChild(commandText);
            commandLine.appendChild(executeButton);
            commandBlock.appendChild(commandLine);
        });
        
        bubble.appendChild(commandBlock);
        messageContent.appendChild(bubble);
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageContent);
        chatContainer.appendChild(messageWrapper);
        
        scrollToBottom();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'aiResponse':
                isLoading = false;
                sendButton.disabled = false;
                
                // Handle Git command generator responses (has commands array)
                if (message.value.commands) {
                    appendAIMessage(`Here are the Git commands for: "${message.value.message}"`);
                    appendCommands(message.value.commands);
                }
                // Handle workspace cognitive responses (has analysis string)
                else if (message.value.analysis) {
                    appendAIMessage(message.value.analysis);
                }
                break;
            case 'editApplied':
                // Update edit block status
                const editBlocks = document.querySelectorAll(`.edit-block[data-file-path="${message.value.filePath}"]`);
                editBlocks.forEach(block => {
                    const status = document.createElement('div');
                    status.className = `edit-status ${message.value.success ? 'success' : 'error'}`;
                    status.textContent = message.value.success 
                        ? `✓ Changes applied successfully to ${message.value.filePath}`
                        : `✗ Failed to apply changes: ${message.value.error || 'Unknown error'}`;
                    block.appendChild(status);
                    
                    // Disable buttons
                    const buttons = block.querySelectorAll('.edit-button');
                    buttons.forEach(btn => btn.disabled = true);
                });
                break;
        }
    });
})();