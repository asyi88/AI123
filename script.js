document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chatHistory');
    const messageInput = document.querySelector('.message-input');
    const sendButton = document.querySelector('.send-btn');

    // API 配置
    const API_KEY = 'sk-1FD0dnVgZumBcRZC5dSdfMaE5mCHoWQp2ZIgJmr8dFK88UN6';
    const API_URL = 'https://api.moonshot.cn/v1/chat/completions';

    // 记录对话到文件
    async function logChat(userMessage, aiResponse) {
        try {
            const timestamp = new Date().toLocaleString('zh-CN');
            const logContent = `
时间：${timestamp}
用户：${userMessage}
AI：${aiResponse}
----------------------------------------
`;
            
            const blob = new Blob([logContent], { type: 'text/plain' });
            const formData = new FormData();
            formData.append('log', blob, 'chat.txt');

            // 发送日志到服务器
            await fetch('/api/log', {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('日志记录失败:', error);
        }
    }

    async function callKimiAPI(userMessage) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "moonshot-v1-8k",
                    messages: [
                        {
                            "role": "system",
                            "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。"
                        },
                        {
                            "role": "user",
                            "content": userMessage
                        }
                    ],
                    temperature: 0.3
                })
            });

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // 记录对话
            await logChat(userMessage, aiResponse);
            
            return aiResponse;
        } catch (error) {
            console.error('API 调用错误:', error);
            return '抱歉，我现在无法回应，请稍后再试。';
        }
    }

    function addMessage(text, isUser = true) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user' : 'ai'}`;
        message.textContent = text;
        
        // 添加消息时的淡入动画
        message.style.opacity = '0';
        chatHistory.appendChild(message);
        
        requestAnimationFrame(() => {
            message.style.transition = 'opacity 0.3s ease-in-out';
            message.style.opacity = '1';
        });

        // 滚动到最新消息
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async function handleSendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            // 禁用输入和发送按钮
            messageInput.disabled = true;
            sendButton.disabled = true;
            
            // 显示用户消息
            addMessage(text, true);
            messageInput.value = '';
            
            // 显示加载状态
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'message ai loading';
            loadingMessage.textContent = '正在思考...';
            chatHistory.appendChild(loadingMessage);
            
            try {
                // 调用 API 获取回复
                const response = await callKimiAPI(text);
                
                // 移除加载消息
                chatHistory.removeChild(loadingMessage);
                
                // 显示 AI 回复
                addMessage(response, false);
            } catch (error) {
                // 移除加载消息
                chatHistory.removeChild(loadingMessage);
                
                // 显示错误消息
                addMessage('抱歉，发生了错误，请稍后重试。', false);
            } finally {
                // 重新启用输入和发送按钮
                messageInput.disabled = false;
                sendButton.disabled = false;
                messageInput.focus();
            }
        }
    }

    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
}); 