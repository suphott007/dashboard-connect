// Mobile User Client Script
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Elements
  const connectionDot = document.getElementById('connectionDot');
  const connectionStatus = document.getElementById('connectionStatus');
  
  const loginCard = document.getElementById('loginCard');
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameInput');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  const messageCard = document.getElementById('messageCard');
  const displayUsername = document.getElementById('displayUsername');
  const userAvatarText = document.getElementById('userAvatarText');
  const logoutBtn = document.getElementById('logoutBtn');

  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const charCount = document.getElementById('charCount');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const toastNotification = document.getElementById('toastNotification');

  const myHistorySection = document.getElementById('myHistorySection');
  const myHistoryList = document.getElementById('myHistoryList');

  let currentUsername = localStorage.getItem('dashboard_connect_username') || '';

  // Connection status events
  socket.on('connect', () => {
    connectionDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
    connectionStatus.textContent = 'เชื่อมต่อสำเร็จ';
    
    // Auto-login if username is already saved
    if (currentUsername) {
      performLogin(currentUsername);
    }
  });

  socket.on('disconnect', () => {
    connectionDot.className = 'w-2 h-2 rounded-full bg-rose-400';
    connectionStatus.textContent = 'การเชื่อมต่อขัดข้อง';
  });

  // Switch UI to logged-in state
  function showMessageCard(username) {
    displayUsername.textContent = username;
    userAvatarText.textContent = username.charAt(0).toUpperCase();
    loginCard.classList.add('hidden');
    messageCard.classList.remove('hidden');
    messageInput.focus();
  }

  // Switch UI to login state
  function showLoginCard() {
    loginCard.classList.remove('hidden');
    messageCard.classList.add('hidden');
    usernameInput.value = currentUsername || '';
    usernameInput.focus();
  }

  // Handle Login
  function performLogin(username) {
    currentUsername = username;
    localStorage.setItem('dashboard_connect_username', username);
    socket.emit('user_login', { username });
    showMessageCard(username);
  }

  // Login form submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (!name) return;
    performLogin(name);
  });

  // Logout / Change name
  logoutBtn.addEventListener('click', () => {
    currentUsername = '';
    localStorage.removeItem('dashboard_connect_username');
    showLoginCard();
  });

  // Character counter for textarea
  messageInput.addEventListener('input', () => {
    const len = messageInput.value.length;
    charCount.textContent = `${len} / 500`;
    if (len >= 480) {
      charCount.classList.add('text-amber-400');
    } else {
      charCount.classList.remove('text-amber-400');
    }
  });

  // Show Toast feedback
  function showToast(message, isSuccess = true) {
    toastNotification.textContent = message;
    if (isSuccess) {
      toastNotification.className = 'rounded-xl p-3 text-xs flex items-center gap-2 border bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    } else {
      toastNotification.className = 'rounded-xl p-3 text-xs flex items-center gap-2 border bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 3500);
  }

  // Send message form submit
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) {
      showToast('กรุณากรอกข้อความก่อนกดส่ง', false);
      return;
    }

    sendMessageBtn.disabled = true;
    sendMessageBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      กำลังส่งข้อความ...
    `;

    socket.emit('send_message', {
      username: currentUsername,
      text: text
    });
  });

  // Socket: Send Success Confirmation
  socket.on('send_success', () => {
    const sentText = messageInput.value.trim();
    messageInput.value = '';
    charCount.textContent = '0 / 500';
    sendMessageBtn.disabled = false;
    sendMessageBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
      <span>ส่งข้อความไปที่ Dashboard</span>
    `;

    showToast('✨ ส่งข้อความขึ้นหน้า Dashboard เรียบร้อยแล้ว!');

    // Add to personal history view
    myHistorySection.classList.remove('hidden');
    const historyItem = document.createElement('div');
    historyItem.className = 'p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300 break-words';
    
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    historyItem.innerHTML = `
      <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
        <span class="text-emerald-400 font-medium">ส่งแล้ว</span>
        <span>${timeStr} น.</span>
      </div>
      <div>${sentText}</div>
    `;
    myHistoryList.insertBefore(historyItem, myHistoryList.firstChild);
  });

  // Socket: Error message
  socket.on('error_message', (data) => {
    sendMessageBtn.disabled = false;
    sendMessageBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
      <span>ส่งข้อความไปที่ Dashboard</span>
    `;
    showToast(data.message || 'เกิดข้อผิดพลาดในการส่ง', false);
  });
});
