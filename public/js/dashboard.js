// Dashboard Client Script
document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  // Elements
  const qrcodeContainer = document.getElementById('qrcode');
  const qrUrlInput = document.getElementById('qrUrlInput');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const copyStatusText = document.getElementById('copyStatusText');
  const lanIpOption = document.getElementById('lanIpOption');
  const lanIpButtons = document.getElementById('lanIpButtons');
  
  const onlineCountEl = document.getElementById('onlineCount');
  const totalMessagesCountEl = document.getElementById('totalMessagesCount');
  const latestActivityEl = document.getElementById('latestActivity');
  
  const messagesContainer = document.getElementById('messagesContainer');
  const emptyState = document.getElementById('emptyState');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const clearAllBtnMobile = document.getElementById('clearAllBtnMobile');

  let currentMessages = [];
  let qrCodeInstance = null;
  let activeUrl = window.location.origin + '/login';

  // Subtle web audio sound for new messages
  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio might be blocked before interaction, safe to ignore
    }
  }

  // Generate QR Code with specified URL
  function renderQRCode(url) {
    activeUrl = url;
    qrUrlInput.value = url;
    qrcodeContainer.innerHTML = '';
    qrCodeInstance = new QRCode(qrcodeContainer, {
      text: url,
      width: 190,
      height: 190,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // Fetch Server Info for QR Code configuration
  fetch('/api/server-info')
    .then((res) => res.json())
    .then((info) => {
      // Determine best URL:
      // If PUBLIC_URL is set in .env, use that
      // Else if window.location is localhost / 127.0.0.1 and we have LAN IP, offer switch
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      let defaultUrl = window.location.origin + '/login';
      if (info.publicUrl) {
        defaultUrl = `${info.publicUrl}/login`;
      } else if (isLocalhost && info.recommendedLanUrl) {
        defaultUrl = info.recommendedLanUrl;
      }

      renderQRCode(defaultUrl);

      // If on localhost, show options to switch between localhost and local LAN IP
      if (isLocalhost && info.localIps && info.localIps.length > 0) {
        lanIpOption.classList.remove('hidden');
        lanIpButtons.innerHTML = '';

        // Add LAN IP buttons
        info.localIps.forEach((ip) => {
          const lanUrl = `http://${ip}:${info.port}/login`;
          const btn = document.createElement('button');
          btn.className = 'text-[11px] px-2 py-1 rounded bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-indigo-500/30 transition-all';
          btn.textContent = `ใช้ IP: ${ip}`;
          btn.onclick = () => renderQRCode(lanUrl);
          lanIpButtons.appendChild(btn);
        });

        // Add localhost button
        const localhostBtn = document.createElement('button');
        localhostBtn.className = 'text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all';
        localhostBtn.textContent = 'ใช้ localhost';
        localhostBtn.onclick = () => renderQRCode(`http://localhost:${info.port}/login`);
        lanIpButtons.appendChild(localhostBtn);
      }
    })
    .catch(() => {
      // Fallback if fetch fails
      renderQRCode(window.location.origin + '/login');
    });

  // Copy URL to Clipboard
  copyUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(qrUrlInput.value).then(() => {
      copyStatusText.textContent = 'คัดลอกแล้ว!';
      copyStatusText.classList.add('text-emerald-400');
      setTimeout(() => {
        copyStatusText.textContent = 'คัดลอกลิงก์';
        copyStatusText.classList.remove('text-emerald-400');
      }, 2000);
    });
  });

  // Format timestamp nicely in Thai
  function formatTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
    } catch {
      return 'เมื่อสักครู่';
    }
  }

  // Create Message Card Element
  function createMessageCard(msg) {
    const card = document.createElement('div');
    card.id = `msg-${msg.id}`;
    card.className = 'bg-slate-900/80 rounded-xl p-4 border border-slate-700/70 hover:border-indigo-500/50 shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group';

    // Left info: Avatar, Username, Text
    const leftContent = document.createElement('div');
    leftContent.className = 'flex items-start gap-3.5 flex-1 min-w-0';

    // Avatar with user initials
    const initial = (msg.username || 'U').charAt(0).toUpperCase();
    const avatar = document.createElement('div');
    avatar.className = 'w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0';
    avatar.textContent = initial;

    const body = document.createElement('div');
    body.className = 'flex-1 min-w-0';

    const headerLine = document.createElement('div');
    headerLine.className = 'flex items-center gap-2 mb-1 flex-wrap';

    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'font-semibold text-white text-sm';
    usernameSpan.textContent = msg.username;

    const timeBadge = document.createElement('span');
    timeBadge.className = 'text-[11px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60';
    timeBadge.textContent = formatTime(msg.timestamp);

    headerLine.appendChild(usernameSpan);
    headerLine.appendChild(timeBadge);

    const messageText = document.createElement('div');
    messageText.className = 'text-slate-200 text-sm break-words whitespace-pre-wrap leading-relaxed mt-1 font-normal';
    messageText.textContent = msg.text;

    body.appendChild(headerLine);
    body.appendChild(messageText);

    leftContent.appendChild(avatar);
    leftContent.appendChild(body);

    // Right Action: Delete Button
    const rightActions = document.createElement('div');
    rightActions.className = 'flex items-center justify-end flex-shrink-0';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all active:scale-95';
    deleteBtn.innerHTML = `
      <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      ลบข้อความ
    `;

    deleteBtn.onclick = () => {
      if (confirm(`ต้องการลบข้อความของคุณ "${msg.username}" ใช่หรือไม่?`)) {
        socket.emit('delete_message', { id: msg.id });
      }
    };

    rightActions.appendChild(deleteBtn);

    card.appendChild(leftContent);
    card.appendChild(rightActions);

    return card;
  }

  // Update Empty State visibility & counters
  function updateUIState() {
    totalMessagesCountEl.textContent = currentMessages.length;
    if (currentMessages.length === 0) {
      if (!messagesContainer.contains(emptyState)) {
        messagesContainer.appendChild(emptyState);
      }
      emptyState.style.display = 'flex';
    } else {
      emptyState.style.display = 'none';
    }
  }

  // Socket: Initial Data
  socket.on('init_data', (data) => {
    currentMessages = data.messages || [];
    onlineCountEl.textContent = data.onlineCount || 0;
    
    // Clear and re-populate
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(emptyState);

    currentMessages.forEach((msg) => {
      messagesContainer.appendChild(createMessageCard(msg));
    });

    updateUIState();
  });

  // Socket: New Message Arrived
  socket.on('new_message', (msg) => {
    currentMessages.unshift(msg);
    const card = createMessageCard(msg);

    // Fade-in animation class
    card.classList.add('animate-fadeIn');
    
    // Insert at top of list (right after emptyState)
    if (messagesContainer.firstChild) {
      messagesContainer.insertBefore(card, messagesContainer.firstChild);
    } else {
      messagesContainer.appendChild(card);
    }

    updateUIState();
    playNotificationSound();

    // Update activity line
    latestActivityEl.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
      <span class="truncate text-emerald-300">ได้รับข้อความใหม่จาก <b>${msg.username}</b></span>
    `;
  });

  // Socket: Message Deleted
  socket.on('message_deleted', (data) => {
    currentMessages = currentMessages.filter((m) => m.id !== data.id);
    const card = document.getElementById(`msg-${data.id}`);
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.remove();
        updateUIState();
      }, 250);
    } else {
      updateUIState();
    }
  });

  // Socket: All Messages Cleared
  socket.on('all_messages_cleared', () => {
    currentMessages = [];
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(emptyState);
    updateUIState();
    latestActivityEl.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-slate-500"></span>
      <span class="truncate">ล้างข้อความทั้งหมดแล้ว</span>
    `;
  });

  // Socket: Stats Update
  socket.on('stats_update', (data) => {
    if (typeof data.onlineCount === 'number') {
      onlineCountEl.textContent = data.onlineCount;
    }
    if (data.lastActiveUser) {
      latestActivityEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
        <span class="truncate">คุณ <b>${data.lastActiveUser}</b> เข้าสู่ระบบ</span>
      `;
    }
  });

  // Clear All Button Actions
  function handleClearAll() {
    if (currentMessages.length === 0) return;
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อความทั้งหมดออกจาก Dashboard?')) {
      socket.emit('clear_all_messages');
    }
  }

  clearAllBtn.addEventListener('click', handleClearAll);
  clearAllBtnMobile.addEventListener('click', handleClearAll);
});
