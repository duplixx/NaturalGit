(function() {
    const vscode = acquireVsCodeApi();
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            appendMessage('user', message);
            vscode.postMessage({ type: 'userMessage', value: message });
            userInput.value = '';
        }
    }

    function appendMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = content;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function appendCommands(commands) {
        const commandsDiv = document.createElement('div');
        commandsDiv.className = 'ai-commands';
        commands.forEach(command => {
            const commandButton = document.createElement('button');
            commandButton.className = 'command-button';
            commandButton.textContent = command;
            commandButton.onclick = () => vscode.postMessage({ type: 'insertCommand', value: command });
            commandsDiv.appendChild(commandButton);
        });
        chatContainer.appendChild(commandsDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'aiResponse':
                appendMessage('ai', `Here are the Git commands for: "${message.value.message}"`);
                appendCommands(message.value.commands);
                break;
        }
    });
})();