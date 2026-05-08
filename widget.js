(function () {
  // ─── Config (injected per hotel) ───────────────────────────────────────────
  var BACKEND_URL = window.StayViConfig?.backendUrl || 'http://localhost:3000';
  var HOTEL_ID = window.StayViConfig?.hotelId || 'silk-house-hanoi';
  var HOTEL_NAME = window.StayViConfig?.hotelName || 'StayVi Concierge';
  var ACCENT = window.StayViConfig?.accent || '#1E4D3A';
  var GOLD = '#C9A24A';

  // ─── State ─────────────────────────────────────────────────────────────────
  var history = [];
  var open = false;

  // ─── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = `
    #stayvi-btn {
      position: fixed; bottom: 28px; right: 28px; z-index: 99999;
      width: 58px; height: 58px; border-radius: 50%;
      background: ${ACCENT}; border: none; cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #stayvi-btn:hover { transform: scale(1.08); box-shadow: 0 12px 32px rgba(0,0,0,0.22); }
    #stayvi-btn svg { width: 26px; height: 26px; }

    #stayvi-widget {
      position: fixed; bottom: 100px; right: 28px; z-index: 99998;
      width: 360px; height: 520px;
      background: #FAF5E8; border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.16);
      display: flex; flex-direction: column; overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
      transform: scale(0.85) translateY(20px); opacity: 0;
      pointer-events: none;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }
    #stayvi-widget.open {
      transform: scale(1) translateY(0); opacity: 1;
      pointer-events: all;
    }

    #stayvi-header {
      background: ${ACCENT}; padding: 16px 18px;
      display: flex; align-items: center; gap: 12px;
    }
    #stayvi-header .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: ${GOLD}; display: flex; align-items: center;
      justify-content: center; font-weight: 700; font-size: 15px;
      color: ${ACCENT}; flex-shrink: 0;
    }
    #stayvi-header .info .name {
      font-size: 14px; font-weight: 600; color: #FAF5E8;
    }
    #stayvi-header .info .status {
      font-size: 11.5px; color: rgba(255,255,255,0.65);
      display: flex; align-items: center; gap: 5px; margin-top: 2px;
    }
    #stayvi-header .info .status::before {
      content: ''; width: 6px; height: 6px;
      background: #4CAF80; border-radius: 50%;
    }
    #stayvi-close {
      margin-left: auto; background: none; border: none;
      color: rgba(255,255,255,0.7); cursor: pointer; font-size: 20px;
      line-height: 1; padding: 4px;
    }
    #stayvi-close:hover { color: white; }

    #stayvi-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    #stayvi-messages::-webkit-scrollbar { width: 4px; }
    #stayvi-messages::-webkit-scrollbar-thumb { background: rgba(30,77,58,0.15); border-radius: 2px; }

    .sv-msg { display: flex; max-width: 82%; }
    .sv-msg.user { margin-left: auto; justify-content: flex-end; }
    .sv-bubble {
      padding: 10px 14px; border-radius: 16px;
      font-size: 13.5px; line-height: 1.45; word-wrap: break-word;
    }
    .sv-msg.bot .sv-bubble {
      background: white; color: #1A2A22;
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(30,77,58,0.1);
    }
    .sv-msg.user .sv-bubble {
      background: ${ACCENT}; color: #FAF5E8;
      border-bottom-right-radius: 4px;
    }

    .sv-typing {
      display: inline-flex; gap: 4px;
      padding: 12px 14px; background: white;
      border-radius: 16px; border-bottom-left-radius: 4px;
      border: 1px solid rgba(30,77,58,0.1);
    }
    .sv-typing span {
      width: 6px; height: 6px; background: #5C6E64;
      border-radius: 50%; opacity: 0.5;
      animation: sv-bounce 1.2s infinite;
    }
    .sv-typing span:nth-child(2) { animation-delay: 0.15s; }
    .sv-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes sv-bounce {
      0%,60%,100% { transform: translateY(0); opacity: 0.5; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    #stayvi-input-row {
      padding: 12px 14px; border-top: 1px solid rgba(30,77,58,0.1);
      display: flex; gap: 8px; align-items: center;
      background: white;
    }
    #stayvi-input {
      flex: 1; border: 1px solid rgba(30,77,58,0.15);
      border-radius: 999px; padding: 10px 16px;
      font-size: 13.5px; font-family: inherit;
      background: #FAF5E8; color: #1A2A22; outline: none;
      transition: border-color 0.2s;
    }
    #stayvi-input:focus { border-color: ${ACCENT}; }
    #stayvi-input::placeholder { color: #5C6E64; }
    #stayvi-send {
      width: 36px; height: 36px; border-radius: 50%;
      background: ${ACCENT}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.2s;
    }
    #stayvi-send:hover { background: #143628; }
    #stayvi-send svg { width: 14px; height: 14px; }

    #stayvi-branding {
      text-align: center; font-size: 10.5px;
      color: #5C6E64; padding: 6px 0 8px;
      background: white;
    }
    #stayvi-branding a { color: ${GOLD}; text-decoration: none; font-weight: 600; }

    @media (max-width: 480px) {
      #stayvi-widget { width: calc(100vw - 24px); right: 12px; bottom: 90px; }
      #stayvi-btn { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ─── HTML ──────────────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'stayvi-btn';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="#FAF5E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`;
  document.body.appendChild(btn);

  var widget = document.createElement('div');
  widget.id = 'stayvi-widget';
  widget.innerHTML = `
    <div id="stayvi-header">
      <div class="avatar">${HOTEL_NAME.charAt(0)}</div>
      <div class="info">
        <div class="name">${HOTEL_NAME}</div>
        <div class="status">Online · replies instantly</div>
      </div>
      <button id="stayvi-close">×</button>
    </div>
    <div id="stayvi-messages"></div>
    <div id="stayvi-input-row">
      <input id="stayvi-input" type="text" placeholder="Ask anything about your stay…" />
      <button id="stayvi-send">
        <svg viewBox="0 0 24 24" fill="none" stroke="#FAF5E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <div id="stayvi-branding">Powered by <a href="https://stayvi.io" target="_blank">StayVi</a></div>
  `;
  document.body.appendChild(widget);

  // ─── Logic ─────────────────────────────────────────────────────────────────
  var messagesEl = document.getElementById('stayvi-messages');
  var inputEl = document.getElementById('stayvi-input');

  function toggleWidget() {
    open = !open;
    widget.classList.toggle('open', open);
    if (open && messagesEl.children.length === 0) {
      addBotMessage(`Welcome to ${HOTEL_NAME}! 🌿 How can I help you today?`);
    }
    if (open) setTimeout(() => inputEl.focus(), 300);
  }

  function addBotMessage(text) {
    var msg = document.createElement('div');
    msg.className = 'sv-msg bot';
    msg.innerHTML = `<div class="sv-bubble">${text.replace(/\n/g, '<br/>')}</div>`;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function addUserMessage(text) {
    var msg = document.createElement('div');
    msg.className = 'sv-msg user';
    msg.innerHTML = `<div class="sv-bubble">${text}</div>`;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'sv-msg bot';
    typing.id = 'sv-typing';
    typing.innerHTML = `<div class="sv-typing"><span></span><span></span><span></span></div>`;
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById('sv-typing');
    if (t) t.remove();
  }

  async function sendMessage() {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addUserMessage(text);
    showTyping();

    try {
      var res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, hotelId: HOTEL_ID, history })
      });
      var data = await res.json();
      hideTyping();
      if (data.reply) {
        addBotMessage(data.reply);
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: data.reply });
        // Keep history to last 10 exchanges
        if (history.length > 20) history = history.slice(-20);
      } else {
        addBotMessage("Sorry, I'm having trouble connecting. Please try again.");
      }
    } catch (e) {
      hideTyping();
      addBotMessage("Sorry, I'm having trouble connecting. Please try again.");
    }
  }

  btn.addEventListener('click', toggleWidget);
  document.getElementById('stayvi-close').addEventListener('click', toggleWidget);
  document.getElementById('stayvi-send').addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });
})();
