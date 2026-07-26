/**
 * StageComms - Frontend Application
 * Church production control system with WebSocket real-time communication
 */

// ============================================
// CONFIG & CONSTANTS
// ============================================

const CONFIG = {
    WS_PROTOCOL: window.location.protocol === 'https:' ? 'wss:' : 'ws:',
    WS_HOST: window.location.host,
    API_BASE: `${window.location.protocol}//${window.location.host}/api`,
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    CUE_OVERLAY_DURATION: 3000, // 3 seconds
    AUDIO_PRELOAD_TIMEOUT: 10000, // 10 seconds
};

const AUDIO_MODES = {
    AUTOMATIC: 'automatic',
    MP3_ONLY: 'mp3_only',
    TTS_ONLY: 'tts_only',
    SILENT: 'silent',
};

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    username: null,
    isConnected: false,
    ws: null,
    cues: [],
    messages: [],
    users: [],
    preloadedAudio: {},
    settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        fullScreenCues: true,
        notificationVolume: 0.8,
    },
};

// ============================================
// DOM ELEMENTS
// ============================================

const DOM = {
    loginScreen: document.getElementById('login-screen'),
    mainScreen: document.getElementById('main-screen'),
    usernameInput: document.getElementById('username-input'),
    loginBtn: document.getElementById('login-btn'),
    currentUsername: document.getElementById('current-username'),
    cueGrid: document.getElementById('cue-grid'),
    testAudioBtn: document.getElementById('test-audio-btn'),
    customMessageBtn: document.getElementById('custom-message-btn'),
    historyBtn: document.getElementById('history-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    cueOverlay: document.getElementById('cue-overlay'),
    overlayMessage: document.getElementById('overlay-message'),
    overlaySender: document.getElementById('overlay-sender'),
    lastCueContent: document.getElementById('last-cue-content'),
    connectionStatus: document.getElementById('connection-status'),
    connectionDot: document.getElementById('connection-dot'),
    connectionText: document.getElementById('connection-text'),
    usersPanel: document.getElementById('users-panel'),
    usersList: document.getElementById('users-list'),
    historyModal: document.getElementById('history-modal'),
    historyList: document.getElementById('history-list'),
    customMessageModal: document.getElementById('custom-message-modal'),
    customMessageInput: document.getElementById('custom-message-input'),
    charCount: document.getElementById('char-count'),
    settingsModal: document.getElementById('settings-modal'),
    soundEnabledCheckbox: document.getElementById('sound-enabled'),
    vibrationEnabledCheckbox: document.getElementById('vibration-enabled'),
    fullScreenCuesCheckbox: document.getElementById('full-screen-cues'),
    notificationVolumeInput: document.getElementById('notification-volume'),
    logoutBtn: document.getElementById('logout-btn'),
    loadingSpinner: document.getElementById('loading-spinner'),
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
    
    const savedUsername = localStorage.getItem('stagecomms_username');
    if (savedUsername) {
        DOM.usernameInput.value = savedUsername;
        login();
    } else {
        showLoginScreen();
        DOM.usernameInput.focus();
    }
});

// Register service worker for offline capability
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Login
    DOM.loginBtn.addEventListener('click', login);
    DOM.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    // Navigation
    DOM.testAudioBtn.addEventListener('click', testAudio);
    DOM.customMessageBtn.addEventListener('click', () => openModal(DOM.customMessageModal));
    DOM.historyBtn.addEventListener('click', loadAndShowHistory);
    DOM.settingsBtn.addEventListener('click', () => openModal(DOM.settingsModal));

    // Custom message
    DOM.customMessageInput.addEventListener('input', updateCharCount);
    document.getElementById('send-custom-btn').addEventListener('click', sendCustomMessage);

    // Modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal, .side-panel')));
    });

    // Settings
    DOM.soundEnabledCheckbox.addEventListener('change', (e) => {
        state.settings.soundEnabled = e.target.checked;
        saveSettings();
    });
    DOM.vibrationEnabledCheckbox.addEventListener('change', (e) => {
        state.settings.vibrationEnabled = e.target.checked;
        saveSettings();
    });
    DOM.fullScreenCuesCheckbox.addEventListener('change', (e) => {
        state.settings.fullScreenCues = e.target.checked;
        saveSettings();
    });
    DOM.notificationVolumeInput.addEventListener('change', (e) => {
        state.settings.notificationVolume = e.target.value / 100;
        saveSettings();
    });

    DOM.logoutBtn.addEventListener('click', logout);

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Prevent scrolling on body
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.closest('.modal, .side-panel, .main-content') === null) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ============================================
// AUTHENTICATION
// ============================================

async function login() {
    const username = DOM.usernameInput.value.trim();
    
    if (!username) {
        alert('Please enter your name');
        return;
    }

    state.username = username;
    localStorage.setItem('stagecomms_username', username);
    
    DOM.currentUsername.textContent = username;
    showMainScreen();
    
    connectWebSocket();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        disconnectWebSocket();
        localStorage.removeItem('stagecomms_username');
        state.username = null;
        state.cues = [];
        state.messages = [];
        state.users = [];
        showLoginScreen();
    }
}

function showLoginScreen() {
    DOM.loginScreen.classList.remove('hidden');
    DOM.mainScreen.classList.add('hidden');
    DOM.usernameInput.focus();
}

function showMainScreen() {
    DOM.loginScreen.classList.add('hidden');
    DOM.mainScreen.classList.remove('hidden');
}

// ============================================
// WEBSOCKET COMMUNICATION
// ============================================

function connectWebSocket() {
    const wsUrl = `${CONFIG.WS_PROTOCOL}//${CONFIG.WS_HOST}/ws/${encodeURIComponent(state.username)}`;
    
    state.ws = new WebSocket(wsUrl);
    
    state.ws.onopen = handleWSOpen;
    state.ws.onmessage = handleWSMessage;
    state.ws.onerror = handleWSError;
    state.ws.onclose = handleWSClose;
}

function disconnectWebSocket() {
    if (state.ws) {
        state.ws.close();
        state.ws = null;
    }
}

function handleWSOpen(event) {
    console.log('WebSocket connected');
    state.isConnected = true;
    updateConnectionStatus();
    
    // Start heartbeat
    setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL);
    
    // Request initial state
    sendWebSocketMessage({ type: 'ping' });
}

function handleWSMessage(event) {
    try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
            case 'cue':
                handleCueMessage(message);
                break;
            case 'custom_message':
                handleCustomMessageReceived(message);
                break;
            case 'user_connected':
                addUserToList(message.username);
                updateConnectionStatus();
                break;
            case 'user_disconnected':
                removeUserFromList(message.username);
                updateConnectionStatus();
                break;
            case 'users_list':
                state.users = message.users;
                renderUsersList();
                break;
            case 'cues_list':
                state.cues = message.cues;
                renderCueGrid();
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Error handling WebSocket message:', error);
    }
}

function handleWSError(event) {
    console.error('WebSocket error:', event);
    state.isConnected = false;
    updateConnectionStatus();
}

function handleWSClose(event) {
    console.log('WebSocket disconnected');
    state.isConnected = false;
    updateConnectionStatus();
    
    // Attempt to reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000);
}

function sendWebSocketMessage(message) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify(message));
    }
}

function sendHeartbeat() {
    sendWebSocketMessage({ type: 'ping' });
}

// ============================================
// CUE HANDLING
// ============================================

async function renderCueGrid() {
    DOM.cueGrid.innerHTML = '';
    
    // Group cues by category
    const categories = {};
    state.cues.forEach(cue => {
        if (!categories[cue.category]) {
            categories[cue.category] = [];
        }
        categories[cue.category].push(cue);
    });

    // Render cues
    state.cues.forEach(cue => {
        const button = createCueButton(cue);
        DOM.cueGrid.appendChild(button);
    });
}

function createCueButton(cue) {
    const button = document.createElement('button');
    button.className = 'cue-button';
    button.style.backgroundColor = cue.button_colour;
    
    const icon = document.createElement('div');
    icon.className = 'cue-button-icon';
    icon.textContent = getIconForCue(cue);
    
    const text = document.createElement('div');
    text.className = 'cue-button-text';
    text.textContent = cue.display_name;
    
    button.appendChild(icon);
    button.appendChild(text);
    
    button.addEventListener('click', () => {
        sendCue(cue.id, cue);
        triggerHaptic();
    });
    
    button.addEventListener('touchstart', () => {
        button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('touchend', () => {
        button.style.transform = '';
    });
    
    return button;
}

function getIconForCue(cue) {
    const iconMap = {
        'bell': '🔔',
        'go': '▶️',
        'stop': '⏹️',
        'speaker': '🎤',
        'music': '🎵',
        'light': '💡',
        'camera': '📷',
        'circle': '⭕',
        'prayer': '🙏',
        'offering': '💰',
        'announcement': '📢',
        'wait': '⏳',
    };
    return iconMap[cue.icon] || '▪️';
}

async function sendCue(cueId, cue) {
    sendWebSocketMessage({
        type: 'cue',
        cue_id: cueId,
    });
}

async function handleCueMessage(message) {
    // Update banner
    updateBanner(message);
    
    // Show full screen overlay
    if (state.settings.fullScreenCues) {
        showCueOverlay(message);
    }
    
    // Play audio
    await playAudio(message);
}

function updateBanner(message) {
    const sender = message.username || 'System';
    const text = message.display_name || message.message_text;
    DOM.lastCueContent.innerHTML = `<strong>${sender}</strong> says:<br>${text}`;
}

function showCueOverlay(message) {
    DOM.overlayMessage.textContent = message.display_name || message.message_text;
    DOM.overlaySender.textContent = `${message.username} says...`;
    DOM.cueOverlay.classList.remove('hidden');
    
    setTimeout(() => {
        DOM.cueOverlay.classList.add('hidden');
    }, CONFIG.CUE_OVERLAY_DURATION);
}

// ============================================
// AUDIO SYSTEM
// ============================================

async function playAudio(message) {
    const audioMode = message.audio_mode || AUDIO_MODES.AUTOMATIC;
    const audioFile = message.audio_file;
    const spokenText = message.spoken_text || message.message_text || message.display_name;
    
    if (!state.settings.soundEnabled) return;
    
    try {
        // Try MP3 first if automatic or mp3_only
        if ((audioMode === AUDIO_MODES.AUTOMATIC || audioMode === AUDIO_MODES.MP3_ONLY) && audioFile) {
            if (await playMP3(audioFile)) {
                return;
            }
        }
        
        // Fall back to TTS if automatic or tts_only
        if (audioMode === AUDIO_MODES.AUTOMATIC || audioMode === AUDIO_MODES.TTS_ONLY) {
            if (spokenText) {
                await playTTS(spokenText);
            }
        }
    } catch (error) {
        console.error('Error playing audio:', error);
    }
}

async function playMP3(filename) {
    return new Promise((resolve) => {
        try {
            if (state.preloadedAudio[filename]) {
                const audio = state.preloadedAudio[filename].cloneNode();
                audio.volume = state.settings.notificationVolume;
                
                audio.onended = () => resolve(true);
                audio.onerror = () => resolve(false);
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => resolve(false));
                } else {
                    resolve(true);
                }
                
                // Timeout fallback
                setTimeout(() => resolve(true), CONFIG.AUDIO_PRELOAD_TIMEOUT);
                return;
            }
        } catch (error) {
            console.error('Error playing MP3:', error);
        }
        resolve(false);
    });
}

async function playTTS(text) {
    return new Promise((resolve) => {
        try {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.volume = state.settings.notificationVolume;
                utterance.rate = 1;
                utterance.pitch = 1;
                
                utterance.onend = () => resolve(true);
                utterance.onerror = () => resolve(false);
                
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
                
                // Timeout
                setTimeout(() => resolve(true), 10000);
            } else {
                resolve(false);
            }
        } catch (error) {
            console.error('Error playing TTS:', error);
            resolve(false);
        }
    });
}

async function testAudio() {
    if (!state.settings.soundEnabled) {
        alert('Sound is disabled. Enable it in settings.');
        return;
    }
    
    try {
        await playTTS('Audio test successful');
        showNotification('✓ Audio test complete');
    } catch (error) {
        alert('Audio test failed. Check volume and browser permissions.');
    }
}

// ============================================
// CUSTOM MESSAGES
// ============================================

function updateCharCount() {
    const count = DOM.customMessageInput.value.length;
    DOM.charCount.textContent = count;
}

async function sendCustomMessage() {
    const text = DOM.customMessageInput.value.trim();
    
    if (!text) {
        alert('Please enter a message');
        return;
    }
    
    sendWebSocketMessage({
        type: 'custom_message',
        message_text: text,
    });
    
    DOM.customMessageInput.value = '';
    updateCharCount();
    closeModal(DOM.customMessageModal);
    
    triggerHaptic();
}

async function handleCustomMessageReceived(message) {
    updateBanner(message);
    
    if (state.settings.fullScreenCues) {
        showCueOverlay(message);
    }
    
    await playAudio(message);
}

// ============================================
// USERS MANAGEMENT
// ============================================

function renderUsersList() {
    DOM.usersList.innerHTML = '';
    
    state.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        
        const name = document.createElement('span');
        name.className = 'user-name';
        name.textContent = user.username;
        
        const dot = document.createElement('span');
        dot.className = 'status-dot online';
        
        const time = document.createElement('span');
        time.className = 'user-time';
        time.textContent = new Date(user.last_seen).toLocaleTimeString();
        
        item.appendChild(dot);
        item.appendChild(name);
        item.appendChild(time);
        DOM.usersList.appendChild(item);
    });
}

function addUserToList(username) {
    const exists = state.users.some(u => u.username === username);
    if (!exists) {
        state.users.push({
            username: username,
            connected_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
        });
        renderUsersList();
        showNotification(`📱 ${username} connected`);
    }
}

function removeUserFromList(username) {
    state.users = state.users.filter(u => u.username !== username);
    renderUsersList();
    showNotification(`📱 ${username} disconnected`);
}

// ============================================
// MESSAGE HISTORY
// ============================================

async function loadAndShowHistory() {
    openModal(DOM.historyModal);
    await loadHistory();
}

async function loadHistory() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/messages`);
        const messages = await response.json();
        
        state.messages = messages;
        renderHistory(messages);
        
        // Populate filters
        populateHistoryFilters();
    } catch (error) {
        console.error('Error loading history:', error);
        DOM.historyList.innerHTML = '<p>Error loading history</p>';
    }
}

function renderHistory(messages) {
    DOM.historyList.innerHTML = '';
    
    if (messages.length === 0) {
        DOM.historyList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No messages yet</p>';
        return;
    }
    
    messages.reverse().forEach(msg => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const header = document.createElement('div');
        header.className = 'history-header';
        
        const username = document.createElement('span');
        username.className = 'history-username';
        username.textContent = msg.username;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'history-timestamp';
        timestamp.textContent = new Date(msg.timestamp).toLocaleTimeString();
        
        header.appendChild(username);
        header.appendChild(timestamp);
        item.appendChild(header);
        
        const text = document.createElement('div');
        text.className = 'history-message';
        text.textContent = msg.message_text;
        item.appendChild(text);
        
        if (msg.category) {
            const category = document.createElement('div');
            category.className = 'history-category';
            category.textContent = msg.category;
            item.appendChild(category);
        }
        
        DOM.historyList.appendChild(item);
    });
}

function populateHistoryFilters() {
    const userSelect = document.getElementById('history-filter-user');
    const categorySelect = document.getElementById('history-filter-category');
    
    const users = [...new Set(state.messages.map(m => m.username))];
    const categories = [...new Set(state.messages.map(m => m.category).filter(c => c))];
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(element) {
    element.classList.add('hidden');
    if (!document.querySelector('.modal:not(.hidden), .side-panel:not(.hidden)')) {
        document.body.style.overflow = '';
    }
}

// ============================================
// SETTINGS & STORAGE
// ============================================

function saveSettings() {
    localStorage.setItem('stagecomms_settings', JSON.stringify(state.settings));
}

function loadSettings() {
    const saved = localStorage.getItem('stagecomms_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            Object.assign(state.settings, settings);
            
            DOM.soundEnabledCheckbox.checked = state.settings.soundEnabled;
            DOM.vibrationEnabledCheckbox.checked = state.settings.vibrationEnabled;
            DOM.fullScreenCuesCheckbox.checked = state.settings.fullScreenCues;
            DOM.notificationVolumeInput.value = state.settings.notificationVolume * 100;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
}

// ============================================
// CONNECTION STATUS
// ============================================

function updateConnectionStatus() {
    if (state.isConnected) {
        DOM.connectionDot.classList.remove('offline');
        DOM.connectionDot.classList.add('online');
        DOM.connectionText.textContent = 'Connected';
    } else {
        DOM.connectionDot.classList.remove('online');
        DOM.connectionDot.classList.add('offline');
        DOM.connectionText.textContent = 'Disconnected';
    }
}

// ============================================
// UTILITIES
// ============================================

function triggerHaptic() {
    if (state.settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function showNotification(message) {
    // Simple notification
    console.log('Notification:', message);
    // Could be enhanced with a toast-like UI
}

// ============================================
// PRELOAD AUDIO FILES
// ============================================

async function preloadCueAudio() {
    for (const cue of state.cues) {
        if (cue.audio_file && cue.audio_mode !== AUDIO_MODES.TTS_ONLY) {
            try {
                const response = await fetch(`/static/audio/${cue.audio_file}`);
                const arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                
                const audio = new Audio();
                audio.src = url;
                audio.preload = 'auto';
                
                state.preloadedAudio[cue.audio_file] = audio;
            } catch (error) {
                console.warn(`Failed to preload audio: ${cue.audio_file}`, error);
            }
        }
    }
}

// Initial preload when cues are received
const originalHandleWSMessage = handleWSMessage;
window.addEventListener('cues-loaded', () => {
    preloadCueAudio();
});
