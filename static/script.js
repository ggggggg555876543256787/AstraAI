let currentChatId = null;
let chatsData = {};
let soundEnabled = true;

// Настройка Marked.js для подсветки кода
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'flex';
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
}

function saveSettings() {
    const modelInput = document.getElementById('modelInput');
    const soundToggle = document.getElementById('soundToggle');
    if (modelInput) localStorage.setItem('astra_model', modelInput.value.trim());
    if (soundToggle) {
        soundEnabled = soundToggle.checked;
        localStorage.setItem('astra_sound', soundEnabled);
    }
    closeSettings();
}

window.addEventListener('DOMContentLoaded', () => {
    const savedModel = localStorage.getItem('astra_model');
    if (savedModel) {
        const modelInput = document.getElementById('modelInput');
        if (modelInput) modelInput.value = savedModel;
    }
    const savedSound = localStorage.getItem('astra_sound');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) soundToggle.checked = soundEnabled;
    }
});

function playSound(type) {
    if (!soundEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        if (type === 'send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === 'receive') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(550, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
            osc.start(); osc.stop(audioCtx.currentTime + 0.18);
        }
    } catch(e) { console.log("Звуки заблокированы", e); }
}

async function loadChats() {
    try {
        const res = await fetch('/api/chats');
        if (res.ok) {
            chatsData = await res.json();
            renderChatsList();
            const keys = Object.keys(chatsData);
            if (keys.length > 0 && !currentChatId) selectChat(keys[0]);
            else if (keys.length === 0) await createNewChat();
        } else await createNewChat();
    } catch (e) {
        if (!currentChatId) {
            currentChatId = "default_chat";
            chatsData[currentChatId] = { title: "Новый чат", messages: [] };
            renderChatsList();
        }
    }
}

function renderChatsList() {
    const listEl = document.getElementById('chatsList');
    if (!listEl) return;
    listEl.innerHTML = '';
    for (const [id, chat] of Object.entries(chatsData).reverse()) {
        const item = document.createElement('div');
        item.className = `chat-item ${id === currentChatId ? 'active' : ''}`;
        const titleSpan = document.createElement('span');
        titleSpan.innerText = chat.title || "Чат";
        titleSpan.style.flex = "1";
        titleSpan.style.overflow = "hidden";
        titleSpan.style.textOverflow = "ellipsis";
        titleSpan.style.whiteSpace = "nowrap";
        titleSpan.onclick = () => selectChat(id);
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-chat';
        delBtn.innerHTML = '✕';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteChat(id); };
        item.appendChild(titleSpan); item.appendChild(delBtn);
        listEl.appendChild(item);
    }
}

async function createNewChat() {
    try {
        const res = await fetch('/api/chats', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            chatsData[data.chat_id] = data.chat;
            selectChat(data.chat_id); renderChatsList(); return;
        }
    } catch (e) { console.error(e); }
    const tempId = 'chat_' + Date.now();
    chatsData[tempId] = { title: "Новый чат", messages: [] };
    selectChat(tempId); renderChatsList();
}

function selectChat(id) {
    currentChatId = id; renderChatsList();
    const chat = chatsData[id] || { title: "Чат", messages: [] };
    const chatHeader = document.getElementById('chatHeader');
    if (chatHeader) chatHeader.innerText = chat.title;
    const messagesEl = document.getElementById('chatMessages');
    if (messagesEl) {
        messagesEl.innerHTML = '';
        if (!chat.messages || chat.messages.length === 0) {
            messagesEl.innerHTML = '<div class="placeholder-text">Общайтесь в неоновом стиле ✨</div>';
        } else {
            chat.messages.forEach(msg => appendMessageToDOM(msg.role, msg.content, false));
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}

async function deleteChat(id) {
    try { await fetch(`/api/chats/${id}`, { method: 'DELETE' }); } catch (e) { }
    delete chatsData[id];
    const keys = Object.keys(chatsData);
    if (keys.length > 0) selectChat(keys[keys.length - 1]);
    else createNewChat();
    renderChatsList();
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (!currentChatId) await createNewChat();

    input.value = '';
    playSound('send');
    appendMessageToDOM('user', text, true);
    
    const messagesEl = document.getElementById('chatMessages');
    const placeholder = messagesEl.querySelector('.placeholder-text');
    if (placeholder) placeholder.remove();

    if (!chatsData[currentChatId]) chatsData[currentChatId] = { title: "Чат", messages: [] };
    chatsData[currentChatId].messages.push({ role: 'user', content: text });

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.style.opacity = '0.7';
    loadingDiv.innerText = 'Думаю... ⏳';
    messagesEl.appendChild(loadingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const activeModel = localStorage.getItem('astra_model') || 'qwen3b:latest';

    try {
        const res = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, chat_id: currentChatId, model: activeModel })
        });
        if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
        const data = await res.json();
        loadingDiv.remove();
        const responseText = data.response || data.reply || "Ошибка: пустой ответ";
        
        playSound('receive');
        appendTypewriterMessage(responseText);
        chatsData[currentChatId].messages.push({ role: 'assistant', content: responseText });
        
        if (data.title) {
            chatsData[currentChatId].title = data.title;
            const chatHeader = document.getElementById('chatHeader');
            if (chatHeader) chatHeader.innerText = data.title;
            renderChatsList();
        }
    } catch (error) {
        loadingDiv.remove();
        appendMessageToDOM('assistant', '⚠️ Сервер не отвечает. Проверь Ollama!', true);
    }
}

function appendMessageToDOM(role, content, animate) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    if (!animate) msgDiv.style.animation = 'none';
    
    if (role === 'assistant' && typeof marked !== 'undefined') {
        msgDiv.innerHTML = marked.parse(content);
    } else {
        msgDiv.innerText = content;
    }

    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendTypewriterMessage(content) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message assistant';
    messagesEl.appendChild(msgDiv);

    let i = 0;
    const speed = 10;
    let currentText = "";

    function typeWriter() {
        if (i < content.length) {
            currentText += content.charAt(i);
            
            if (typeof marked !== 'undefined') {
                msgDiv.innerHTML = marked.parse(currentText);
            } else {
                msgDiv.innerText = currentText;
            }

            i++;
            messagesEl.scrollTop = messagesEl.scrollHeight;
            
            if (content.length > 500) {
                if (i < content.length) currentText += content.charAt(i++);
            }
            setTimeout(typeWriter, speed);
        } else {
            if (typeof marked !== 'undefined') {
                msgDiv.innerHTML = marked.parse(content);
            }
        }
    }
    typeWriter();
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

loadChats();

// АНИМАЦИЯ ФОНА (ЧАСТИЦЫ)
const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const colors = ['#a855f7', '#c084fc', '#d8b4fe', '#4c1d95'];

    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeCanvas); resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5 + 1;
            this.speedX = (Math.random() * 1 - 0.5) * 0.7; this.speedY = (Math.random() * 1 - 0.5) * 0.7;
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        update() {
            this.x += this.speedX; this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = this.color; ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
    }

    function initParticles() {
        particlesArray = [];
        let numberOfParticles = (canvas.width * canvas.height) / 8000;
        for (let i = 0; i < numberOfParticles; i++) particlesArray.push(new Particle());
    }

    function connectParticles() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                             + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                if (distance < (canvas.width / 9) * (canvas.height / 9)) {
                    opacityValue = 1 - (distance / 14000);
                    ctx.strokeStyle = `rgba(168, 85, 247, ${opacityValue * 0.35})`;
                    ctx.lineWidth = 1; ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); particlesArray[i].draw(); }
        connectParticles(); requestAnimationFrame(animateParticles);
    }

    initParticles(); animateParticles();
}
