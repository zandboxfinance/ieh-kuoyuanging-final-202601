// --- 音效模組 ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSnd(freq, type, duration, vol) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

// --- 變數與狀態 ---
let pHP = 100, aHP = 100, pX = 475, pY = 450, aX = 475, aY = 100;
let isArmed = false, state = "MENU", keys = {}, mX = 0, mY = 0;
let config = { n: '步槍', s: 600, d: 15 }, aiTimer;

const box = document.getElementById('game-box');
const p = document.getElementById('player');
const a = document.getElementById('ai');
const pG = document.getElementById('player-gun');
const aG = document.getElementById('ai-gun');

// --- 輸入監聽 ---
window.onkeydown = (e) => { 
    keys[e.key.toLowerCase()] = true; 
    if(e.key === '1') { 
        isArmed = true; 
        pG.style.display = 'block'; 
        playSnd(400, 'square', 0.1, 0.1); 
    }
};
window.onkeyup = (e) => keys[e.key.toLowerCase()] = false;
box.onmousemove = (e) => {
    const r = box.getBoundingClientRect();
    mX = e.clientX - r.left; mY = e.clientY - r.top;
};

// --- 遊戲邏輯 ---
function setMode(n, s, d, btn) {
    config = { n, s, d };
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('s-btn').style.display = 'block';
    playSnd(600, 'sine', 0.1, 0.2);
}

function initGame() {
    pHP = 100; aHP = 100;
    document.getElementById('overlay').style.display = 'none';
    state = 'PLAY'; 
    a.style.display = 'block';
    updateHUD(); 
    gameLoop(); 
    startAI();
}

function gameLoop() {
    if (state !== 'PLAY') return;

    // 1. 玩家移動 (WASD)
    let tilt = 0;
    if (keys['a'] && pX > 10) { pX -= 6; tilt = -8; }
    if (keys['d'] && pX < 940) { pX += 6; tilt = 8; }
    if (keys['w'] && pY > 100) pY -= 6;
    if (keys['s'] && pY < 590) pY += 6;
    p.style.left = pX + 'px'; 
    p.style.top = pY + 'px';
    p.style.transform = `rotate(${tilt}deg)`;

    // 2. 玩家瞄準
    if (isArmed) {
        const angle = Math.atan2(mY - (pY + 23), mX - (pX + 23));
        pG.style.transform = `rotate(${angle}rad)`;
    }

    // 3. AI 移動與追蹤瞄準
    aX += Math.sin(Date.now() / 400) * 8;
    a.style.left = aX + 'px'; 
    a.style.top = aY + 'px';
    const aiAngle = Math.atan2((pY + 23) - (aY + 23), (pX + 23) - (aX + 23));
    aG.style.transform = `rotate(${aiAngle}rad)`;

    requestAnimationFrame(gameLoop);
}

function startAI() {
    aiTimer = setInterval(() => {
        if (state !== 'PLAY') return;
        drawBullet(aX+23, aY+23, pX+23, pY+23, '#ff4757');
        playSnd(150, 'sawtooth', 0.2, 0.1);
        pHP -= config.d; 
        updateHUD();
        triggerFlash('rgba(255,0,0,0.3)');
        if (pHP <= 0) finish(false);
    }, config.s);
}

box.onmousedown = () => {
    if (state !== 'PLAY' || !isArmed) return;
    playSnd(800, 'sawtooth', 0.1, 0.2);
    drawBullet(pX+23, pY+23, mX, mY, '#fff700');
    
    // 判定擊中 AI
    if (mX >= aX && mX <= aX+46 && mY >= aY && mY <= aY+46) {
        aHP -= 20; 
        updateHUD();
        showDmg(mX, mY, 20);
        playSnd(1200, 'sine', 0.05, 0.1);
        if (aHP <= 0) finish(true);
    }
};

// --- 工具函式 ---
function drawBullet(sx, sy, ex, ey, col) {
    const d = Math.sqrt((ex-sx)**2 + (ey-sy)**2);
    const a = Math.atan2(ey-sy, ex-sx);
    const t = document.createElement('div');
    t.className = 'bullet';
    t.style.width = d + 'px'; t.style.left = sx + 'px'; t.style.top = sy + 'px';
    t.style.transform = `rotate(${a}rad)`; t.style.background = col;
    box.appendChild(t);
    setTimeout(() => t.remove(), 50);
}

function showDmg(x, y, d) {
    const el = document.createElement('div');
    el.className = 'dmg-popup'; el.innerText = d;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    box.appendChild(el);
    setTimeout(() => el.remove(), 500);
}

function triggerFlash(col) {
    const f = document.getElementById('flash');
    f.style.background = col;
    f.style.opacity = '1'; setTimeout(() => f.style.opacity = '0', 100);
}

function updateHUD() {
    document.getElementById('p-bar').style.width = pHP + '%';
    document.getElementById('a-bar').style.width = aHP + '%';
}

function finish(win) {
    state = "MENU"; 
    clearInterval(aiTimer);
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('s-btn').style.display = 'none';
    const h1 = document.querySelector('h1');
    h1.innerText = win ? "VICTORY" : "DEFEATED";
    h1.style.color = win ? "var(--s)" : "var(--d)";
    playSnd(win ? 1000 : 200, 'sine', 0.5, 0.3);
}



