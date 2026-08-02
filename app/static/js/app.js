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
        keepScreenOn: true,
        notificationVolume: 0.8,
        touchGuardEnabled: false,
    },
    touchGuardActive: false,
    adminSettings: {
        privateMessagesEnabled: true,
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
    categoryFilter: document.getElementById('category-filter'),
    menuToggle: document.getElementById('menu-toggle'),
    menuDropdown: document.getElementById('menu-dropdown'),
    menuUsers: document.getElementById('menu-users'),
    menuHistory: document.getElementById('menu-history'),
    menuSettings: document.getElementById('menu-settings'),
    menuTestAudio: document.getElementById('menu-test-audio'),
    touchGuardToggle: document.getElementById('touch-guard-toggle'),
    lockIcon: document.getElementById('lock-icon'),
    touchGuardCueGrid: document.getElementById('touch-guard-cue-grid'),
    touchGuardCustomMessage: document.getElementById('touch-guard-custom-message'),
    touchGuardPrivateMessage: document.getElementById('touch-guard-private-message'),
    privateMessageModal: document.getElementById('private-message-modal'),
    privateMessageRecipient: document.getElementById('private-message-recipient'),
    privateMessageInput: document.getElementById('private-message-input'),
    privateMessageCharCount: document.getElementById('private-message-char-count'),
    sendPrivateBtn: document.getElementById('send-private-btn'),
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
    keepScreenOnCheckbox: document.getElementById('keep-screen-on'),
    notificationVolumeInput: document.getElementById('notification-volume'),
    logoutBtn: document.getElementById('logout-btn'),
    loadingSpinner: document.getElementById('loading-spinner'),
    temporaryMessageInput: document.getElementById('temporary-message-input'),
    sendTemporaryMessageBtn: document.getElementById('send-temporary-message-btn'),
    historyLast24hBtn: document.getElementById('history-last-24h-btn'),
    historyAllBtn: document.getElementById('history-all-btn'),
    historySearch: document.getElementById('history-search'),
    historyFilterUser: document.getElementById('history-filter-user'),
    historyFilterCategory: document.getElementById('history-filter-category'),
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
    if (DOM.testAudioBtn) {
        DOM.testAudioBtn.addEventListener('click', testAudio);
    }
    
    // Category filter
    if (DOM.categoryFilter) {
        DOM.categoryFilter.addEventListener('change', filterCuesByCategory);
    }
    
    // Hamburger menu
    if (DOM.menuToggle && DOM.menuDropdown) {
        DOM.menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.menuDropdown.classList.toggle('hidden');
        });
    }
    
    if (DOM.menuUsers) {
        DOM.menuUsers.addEventListener('click', () => {
            DOM.menuDropdown.classList.add('hidden');
            openModal(DOM.usersPanel);
            renderUsersList();
        });
    }
    
    if (DOM.menuHistory) {
        DOM.menuHistory.addEventListener('click', () => {
            DOM.menuDropdown.classList.add('hidden');
            loadAndShowHistory();
        });
    }
    
    if (DOM.menuSettings) {
        DOM.menuSettings.addEventListener('click', () => {
            DOM.menuDropdown.classList.add('hidden');
            openModal(DOM.settingsModal);
        });
    }
    
    if (DOM.menuTestAudio) {
        DOM.menuTestAudio.addEventListener('click', () => {
            DOM.menuDropdown.classList.add('hidden');
            testAudio();
        });
    }
    
    // Touch guard toggle
    if (DOM.touchGuardToggle) {
        DOM.touchGuardToggle.addEventListener('click', toggleTouchGuard);
    }
    
    // Touch guard unlock (cue grid)
    if (DOM.touchGuardCueGrid) {
        setupTouchGuardUnlock(DOM.touchGuardCueGrid);
    }
    
    // Touch guard unlock (custom message)
    if (DOM.touchGuardCustomMessage) {
        setupTouchGuardUnlock(DOM.touchGuardCustomMessage);
    }
    
    // Touch guard unlock (private message)
    if (DOM.touchGuardPrivateMessage) {
        setupTouchGuardUnlock(DOM.touchGuardPrivateMessage);
    }
    
    // Private message
    DOM.privateMessageInput.addEventListener('input', updatePrivateMessageCharCount);
    DOM.sendPrivateBtn.addEventListener('click', sendPrivateMessage);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (DOM.menuDropdown && !e.target.closest('.hamburger-menu')) {
            DOM.menuDropdown.classList.add('hidden');
        }
    });

    // Custom message
    DOM.customMessageInput.addEventListener('input', updateCharCount);
    document.getElementById('send-custom-btn').addEventListener('click', sendCustomMessage);

    // Temporary message bar
    DOM.temporaryMessageInput.addEventListener('input', () => {
        const count = DOM.temporaryMessageInput.value.length;
        if (!DOM.tempMessageCharCount) {
            const span = document.createElement('div');
            span.id = 'temp-message-char-count';
            span.className = 'char-count temp';
            DOM.temporaryMessageInput.parentNode.insertBefore(span, DOM.sendTemporaryMessageBtn);
            DOM.tempMessageCharCount = span;
        }
        DOM.tempMessageCharCount.textContent = `${count}/500`;
    });
    DOM.sendTemporaryMessageBtn.addEventListener('click', sendTemporaryMessage);

    // History controls
    DOM.historyLast24hBtn.addEventListener('click', () => loadHistory(24 * 60));
    DOM.historyAllBtn.addEventListener('click', () => loadHistory());
    DOM.historySearch.addEventListener('input', filterHistory);
    DOM.historyFilterUser.addEventListener('change', filterHistory);
    DOM.historyFilterCategory.addEventListener('change', filterHistory);

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
    
    DOM.keepScreenOnCheckbox.addEventListener('change', (e) => {
        state.settings.keepScreenOn = e.target.checked;
        saveSettings();
        toggleWakeLock(e.target.checked);
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
            case 'private_message':
                handleCustomMessageReceived(message); // Handle same as custom message for now
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
                loadCategories();
                renderCueGrid();
                break;
            case 'admin_settings':
                console.log('Received admin settings:', message.settings);
                state.adminSettings = message.settings;
                renderUsersList(); // Re-render to update clickability
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
    
    // Get selected category filter
    const selectedCategory = DOM.categoryFilter ? DOM.categoryFilter.value : '';
    
    // Get utility cues (always included)
    const utilityCues = state.cues.filter(cue => {
        const category = (cue.category || '').trim().toLowerCase();
        return category === 'utility';
    });
    
    // Filter non-utility cues by category
    let otherCues = state.cues.filter(cue => {
        const category = (cue.category || '').trim().toLowerCase();
        if (category === 'utility') return false;
        
        if (selectedCategory) {
            return cue.category === selectedCategory;
        }
        return true;
    });
    
    // Render non-utility cues first
    otherCues.forEach(cue => {
        const button = createCueButton(cue);
        DOM.cueGrid.appendChild(button);
    });
    
    // Render utility cues at the bottom
    utilityCues.forEach(cue => {
        const button = createCueButton(cue);
        DOM.cueGrid.appendChild(button);
    });
}

function filterCuesByCategory() {
    const selectedCategory = DOM.categoryFilter ? DOM.categoryFilter.value : '';
    
    // Get utility cues (always included)
    const utilityCues = state.cues.filter(cue => {
        const category = (cue.category || '').trim().toLowerCase();
        return category === 'utility';
    });
    
    // Filter non-utility cues by category
    let otherCues = state.cues.filter(cue => {
        const category = (cue.category || '').trim().toLowerCase();
        if (category === 'utility') return false;
        
        if (selectedCategory) {
            return cue.category === selectedCategory;
        }
        return true;
    });
    
    // Re-render cue grid
    DOM.cueGrid.innerHTML = '';
    otherCues.forEach(cue => {
        const button = createCueButton(cue);
        DOM.cueGrid.appendChild(button);
    });
    
    // Render utility cues at the bottom
    utilityCues.forEach(cue => {
        const button = createCueButton(cue);
        DOM.cueGrid.appendChild(button);
    });
}

function loadCategories() {
    // Extract unique categories from cues, excluding 'utility' (case-insensitive)
    const categories = [...new Set(state.cues.map(cue => cue.category))]
        .filter(category => {
            const cat = (category || '').trim().toLowerCase();
            return cat !== 'utility';
        })
        .sort();
    
    // Populate category filter dropdown
    if (DOM.categoryFilter) {
        DOM.categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            DOM.categoryFilter.appendChild(option);
        });
    }
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

async function sendTemporaryMessage() {
    const text = DOM.temporaryMessageInput.value.trim();
    if (!text) {
        alert('Please enter a temporary message');
        return;
    }

    sendWebSocketMessage({
        type: 'custom_message',
        message_text: text,
    });

    DOM.temporaryMessageInput.value = '';
    if (DOM.tempMessageCharCount) {
        DOM.tempMessageCharCount.textContent = '0/500';
    }
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
    
    console.log('Rendering users list, privateMessagesEnabled:', state.adminSettings.privateMessagesEnabled);
    
    state.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        
        // Skip current user
        if (user.username === state.username) return;
        
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
        
        // Make clickable to open private message dialog only if enabled
        if (state.adminSettings.privateMessagesEnabled) {
            item.addEventListener('click', () => {
                console.log('User clicked, opening private message dialog for:', user.username);
                openPrivateMessageDialog(user.username);
            });
        } else {
            item.style.cursor = 'not-allowed';
            item.style.opacity = '0.5';
            console.log('Private messages disabled, user not clickable');
        }
        
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

async function loadHistory(minutes) {
    try {
        const query = typeof minutes === 'number' ? `?minutes=${minutes}` : '';
        const response = await fetch(`${CONFIG.API_BASE}/messages${query}`);
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

function filterHistory() {
    const search = DOM.historySearch.value.trim().toLowerCase();
    const user = DOM.historyFilterUser.value;
    const category = DOM.historyFilterCategory.value;

    const filtered = state.messages.filter(msg => {
        const matchesSearch = !search || msg.message_text.toLowerCase().includes(search) || msg.username.toLowerCase().includes(search);
        const matchesUser = !user || msg.username === user;
        const matchesCategory = !category || msg.category === category;
        return matchesSearch && matchesUser && matchesCategory;
    });

    renderHistory(filtered);
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
            DOM.keepScreenOnCheckbox.checked = state.settings.keepScreenOn;
            DOM.notificationVolumeInput.value = state.settings.notificationVolume * 100;
            
            // Initialize wake lock based on setting
            if (state.settings.keepScreenOn) {
                toggleWakeLock(true);
            }
            
            // Initialize touch guard based on setting
            state.touchGuardActive = state.settings.touchGuardEnabled;
            updateTouchGuardUI();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
}

// ============================================
// SCREEN WAKE LOCK
// ============================================

let wakeLock = null;

async function toggleWakeLock(enable) {
    if (!('wakeLock' in navigator)) {
        console.log('Screen Wake Lock API not supported');
        return;
    }

    if (enable) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Screen Wake Lock activated');
            
            wakeLock.addEventListener('release', () => {
                console.log('Screen Wake Lock released');
                wakeLock = null;
            });
        } catch (error) {
            console.error('Error requesting wake lock:', error);
        }
    } else {
        if (wakeLock) {
            wakeLock.release();
            wakeLock = null;
        }
    }
}

// Re-request wake lock when visibility changes (browser may release it)
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && state.settings.keepScreenOn) {
        await toggleWakeLock(true);
    }
});

// ============================================
// TOUCH GUARD
// ============================================

function toggleTouchGuard() {
    state.settings.touchGuardEnabled = !state.settings.touchGuardEnabled;
    state.touchGuardActive = state.settings.touchGuardEnabled;
    saveSettings();
    updateTouchGuardUI();
}

function updateTouchGuardUI() {
    // Update lock icon
    if (DOM.lockIcon) {
        DOM.lockIcon.textContent = state.touchGuardActive ? '🔒' : '🔓';
    }
    
    // Show/hide overlays
    if (DOM.touchGuardCueGrid) {
        if (state.touchGuardActive) {
            DOM.touchGuardCueGrid.classList.remove('hidden');
        } else {
            DOM.touchGuardCueGrid.classList.add('hidden');
        }
    }
    
    if (DOM.touchGuardCustomMessage) {
        if (state.touchGuardActive) {
            DOM.touchGuardCustomMessage.classList.remove('hidden');
        } else {
            DOM.touchGuardCustomMessage.classList.add('hidden');
        }
    }
    
    if (DOM.touchGuardPrivateMessage) {
        if (state.touchGuardActive) {
            DOM.touchGuardPrivateMessage.classList.remove('hidden');
        } else {
            DOM.touchGuardPrivateMessage.classList.add('hidden');
        }
    }
}

function setupTouchGuardUnlock(overlay) {
    const lockElement = overlay.querySelector('.touch-guard-lock');
    const progressElement = overlay.querySelector('.touch-guard-progress');
    let holdTimer = null;
    let holdStartTime = null;
    
    const startHold = (e) => {
        e.preventDefault();
        if (holdTimer) return;
        
        holdStartTime = Date.now();
        
        // Start progress animation
        if (progressElement) {
            progressElement.classList.add('active');
        }
        
        holdTimer = setTimeout(() => {
            // Unlock after 3 seconds
            state.touchGuardActive = false;
            state.settings.touchGuardEnabled = false;
            saveSettings();
            updateTouchGuardUI();
            
            // Reset progress
            if (progressElement) {
                progressElement.classList.remove('active');
            }
            
            holdTimer = null;
            holdStartTime = null;
        }, 3000);
    };
    
    const cancelHold = () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
        
        if (progressElement) {
            progressElement.classList.remove('active');
        }
        
        holdStartTime = null;
    };
    
    // Touch events
    lockElement.addEventListener('touchstart', startHold, { passive: false });
    lockElement.addEventListener('touchend', cancelHold);
    lockElement.addEventListener('touchcancel', cancelHold);
    lockElement.addEventListener('touchmove', cancelHold);
    
    // Mouse events (for desktop testing)
    lockElement.addEventListener('mousedown', startHold);
    lockElement.addEventListener('mouseup', cancelHold);
    lockElement.addEventListener('mouseleave', cancelHold);
}

// ============================================
// PRIVATE MESSAGES
// ============================================

function openPrivateMessageDialog(recipient) {
    DOM.privateMessageRecipient.textContent = recipient;
    DOM.privateMessageInput.value = '';
    DOM.privateMessageCharCount.textContent = '0';
    closeModal(DOM.usersPanel);
    openModal(DOM.privateMessageModal);
    DOM.privateMessageInput.focus();
}

function updatePrivateMessageCharCount() {
    const count = DOM.privateMessageInput.value.length;
    DOM.privateMessageCharCount.textContent = count;
}

function sendPrivateMessage() {
    const message = DOM.privateMessageInput.value.trim();
    const recipient = DOM.privateMessageRecipient.textContent;
    
    console.log('Sending private message:', { recipient, message });
    
    if (!message) {
        alert('Please enter a message');
        return;
    }
    
    if (!recipient) {
        alert('No recipient selected');
        return;
    }
    
    // Send via WebSocket
    sendWebSocketMessage({
        type: 'private_message',
        recipient: recipient,
        message: message
    });
    
    console.log('Private message sent');
    
    // Clear and close
    DOM.privateMessageInput.value = '';
    DOM.privateMessageCharCount.textContent = '0';
    closeModal(DOM.privateMessageModal);
}

// ============================================
// PROXIMITY SENSOR (Auto-enable touch guard)
// ============================================

// Note: Proximity Sensor API is not widely supported in web browsers.
// This is experimental and only works on some devices/browsers.
if ('ProximitySensor' in window) {
    try {
        const sensor = new ProximitySensor();
        sensor.addEventListener('reading', () => {
            // If proximity is near (object close to sensor), enable touch guard
            if (sensor.near && !state.touchGuardActive) {
                state.settings.touchGuardEnabled = true;
                state.touchGuardActive = true;
                saveSettings();
                updateTouchGuardUI();
            }
        });
        sensor.start();
    } catch (error) {
        console.log('Proximity Sensor not available:', error);
    }
} else {
    console.log('Proximity Sensor API not supported in this browser');
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
