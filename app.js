/**
 * Main Application
 * Точка входа и основной цикл
 */

const config = {
    global: { animSmooth: 0.08, mouseSensitivity: 1.0 },
    layers: {
        1: { enabled: true, scrollSpeed: 0.08, mouseSpeed: 0.03 },
        2: { enabled: true, scrollSpeed: 0.15, mouseSpeed: 0.08 },
        3: { enabled: true, scrollSpeed: 0.25, mouseSpeed: 0.15 },
        4: { enabled: true, scrollSpeed: 0.35, mouseSpeed: 0.25 },
        5: { enabled: true, scrollSpeed: 0.5, mouseSpeed: 0.4 }
    },
    stars: { count: 200, twinkleAmount: 0.5, size: 1 },
    particles: { count: 150, size: 2, speed: 1, showTrail: true },
    physics: { gravity: 1, temperature: 273, viscosity: 0, magneticField: 0 },
    ai: { enabled: true, frequency: 5, voice: 'neutral', detail: 50 }
};

let canvasWidth, canvasHeight, mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
let scrollY = 0, simTime = 0, lastTime = performance.now();
let fps = 60, frameCount = 0, lastFpsUpdate = 0;
const layers = {};
let stars = [], particles = [], predictionData = [], energyHistory = [];

let starsCtx, particlesCtx, predCtx;
let starsCanvas, particlesCanvas, predCanvas;
let predictor;

function initStars() {
    starsCanvas = document.getElementById('starsCanvas');
    starsCtx = starsCanvas.getContext('2d');
    resizeCanvas(starsCanvas, starsCtx);
    stars = [];
    for (let i = 0; i < config.stars.count; i++) {
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            size: Math.random() * config.stars.size + 0.5,
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

function initParticles() {
    particlesCanvas = document.getElementById('particlesCanvas');
    particlesCtx = particlesCanvas.getContext('2d');
    resizeCanvas(particlesCanvas, particlesCtx);
    particles = [];
    for (let i = 0; i < config.particles.count; i++) {
        particles.push(new Particle(
            Math.random() * canvasWidth,
            Math.random() * canvasHeight
        ));
    }
}

function initPrediction() {
    predCanvas = document.getElementById('predictionCanvas');
    predCtx = predCanvas.getContext('2d');
    predCanvas.width = 380;
    predCanvas.height = 100;
    predictor = new Predictor();
}

function resizeCanvas(canvas, ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
}

function resizeCanvases() {
    resizeCanvas(starsCanvas, starsCtx);
    resizeCanvas(particlesCanvas, particlesCtx);
    initStars();
    initParticles();
}

function drawStars() {
    starsCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    const time = simTime;
    stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * config.stars.twinkleAmount + 0.5;
        const alpha = star.brightness * twinkle;
        starsCtx.beginPath();
        starsCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        starsCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        starsCtx.fill();
        if (star.size > 1.5) {
            const gradient = starsCtx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
            gradient.addColorStop(1, 'transparent');
            starsCtx.fillStyle = gradient;
            starsCtx.fillRect(star.x - star.size * 3, star.y - star.size * 3, star.size * 6, star.size * 6);
        }
    });
}

function drawParticles() {
    particlesCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    particles.forEach(p => {
        const alpha = p.life;
        particlesCtx.beginPath();
        particlesCtx.arc(p.pos.x, p.pos.y, config.particles.size * p.life, 0, Math.PI * 2);
        particlesCtx.fillStyle = `rgba(102, 126, 234, ${alpha})`;
        particlesCtx.fill();
        if (config.particles.showTrail) {
            particlesCtx.beginPath();
            particlesCtx.moveTo(p.pos.x - p.vel.x * 3, p.pos.y - p.vel.y * 3);
            particlesCtx.lineTo(p.pos.x, p.pos.y);
            particlesCtx.strokeStyle = `rgba(102, 126, 234, ${alpha * 0.3})`;
            particlesCtx.lineWidth = 1;
            particlesCtx.stroke();
        }
    });
}

function drawPrediction() {
    if (!predCtx || !predCanvas) return;
    predCtx.clearRect(0, 0, predCanvas.width, predCanvas.height);
    predCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    predCtx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = (predCanvas.height / 4) * i;
        predCtx.beginPath();
        predCtx.moveTo(0, y);
        predCtx.lineTo(predCanvas.width, y);
        predCtx.stroke();
    }
    if (predictionData.length < 2 || energyHistory.length < 2) return;
    const allValues = [...energyHistory, ...predictionData];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    predCtx.beginPath();
    predCtx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
    predCtx.lineWidth = 2;
    energyHistory.forEach((val, i) => {
        const x = (i / energyHistory.length) * predCanvas.width * 0.5;
        const y = predCanvas.height - ((val - min) / range) * predCanvas.height * 0.8 - 10;
        if (i === 0) predCtx.moveTo(x, y); else predCtx.lineTo(x, y);
    });
    predCtx.stroke();
    predCtx.beginPath();
    predCtx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
    predCtx.lineWidth = 2;
    predCtx.setLineDash([5, 5]);
    const startX = predCanvas.width * 0.5;
    predictionData.forEach((val, i) => {
        const x = startX + (i / predictionData.length) * predCanvas.width * 0.5;
        const y = predCanvas.height - ((val - min) / range) * predCanvas.height * 0.8 - 10;
        if (i === 0) predCtx.moveTo(x, y); else predCtx.lineTo(x, y);
    });
    predCtx.stroke();
    predCtx.setLineDash([]);
}

function updateParallax() {
    const smooth = config.global.animSmooth;
    mouseX += (targetMouseX - mouseX) * smooth;
    mouseY += (targetMouseY - mouseY) * smooth;
    const centerX = (mouseX - canvasWidth / 2) / canvasWidth;
    const centerY = (mouseY - canvasHeight / 2) / canvasHeight;
    const sensitivity = config.global.mouseSensitivity;
    for (let i = 1; i <= 5; i++) {
        if (!config.layers[i].enabled) {
            layers[i].style.transform = 'translate3d(0, 0, 0)';
            layers[i].style.opacity = '0';
            continue;
        }
        layers[i].style.opacity = '1';
        const scrollOffset = scrollY * config.layers[i].scrollSpeed;
        const mouseOffsetX = centerX * config.layers[i].mouseSpeed * sensitivity * 200;
        const mouseOffsetY = centerY * config.layers[i].mouseSpeed * sensitivity * 100;
        layers[i].style.transform = `translate3d(${mouseOffsetX}px, ${-scrollOffset + mouseOffsetY}px, 0)`;
    }
}

function updateHUD() {
    const totalEnergy = particles.reduce((sum, p) => sum + p.getEnergy(), 0);
    const entropy = -Math.log(totalEnergy + 0.001) * 100;
    const pressure = totalEnergy * config.physics.temperature / 1000;
    document.getElementById('simTime').textContent = simTime.toFixed(2) + 's';
    document.getElementById('particleCount').textContent = particles.length;
    document.getElementById('temperature').textContent = config.physics.temperature + 'K';
    document.getElementById('systemEnergy').textContent = totalEnergy.toFixed(1) + ' J';
    document.getElementById('entropy').textContent = entropy.toFixed(2);
    document.getElementById('pressure').textContent = pressure.toFixed(1) + ' Pa';
    energyHistory.push(totalEnergy);
    if (energyHistory.length > 100) energyHistory.shift();
    if (predictor) predictor.add(totalEnergy);
    const method = document.getElementById('predAlgorithm')?.value || 'linear';
    if (predictor) predictionData = predictor.predict(method);
}

function animate(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    simTime += dt;
    frameCount++;
    if (currentTime - lastFpsUpdate > 500) {
        fps = Math.round(frameCount * 2);
        document.getElementById('fpsValue').textContent = fps;
        frameCount = 0;
        lastFpsUpdate = currentTime;
    }
    particles.forEach(p => p.update(dt));
    drawStars();
    drawParticles();
    drawPrediction();
    updateParallax();
    updateHUD();
    if (window.aiObserver) window.aiObserver.update();
    if (window.evolution) window.evolution.evolve();
    requestAnimationFrame(animate);
}

function setupEventListeners() {
    document.addEventListener('mousemove', (e) => { targetMouseX = e.clientX; targetMouseY = e.clientY; });
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });
    window.addEventListener('resize', resizeCanvases);

    document.getElementById('settingsBtn').addEventListener('click', () => document.getElementById('controlPanel').classList.add('open'));
    document.getElementById('closePanelBtn').addEventListener('click', () => document.getElementById('controlPanel').classList.remove('open'));
    document.getElementById('themeBtn').addEventListener('click', () => {
        const themes = ['default', 'cyberpunk', 'sunset', 'ocean', 'minimal', 'nature'];
        const current = document.body.getAttribute('data-theme') || 'default';
        const idx = themes.indexOf(current);
        const next = themes[(idx + 1) % themes.length];
        setTheme(next);
    });
    document.getElementById('aiToggleBtn').addEventListener('click', () => {
        config.ai.enabled = !config.ai.enabled;
        if (window.aiObserver) window.aiObserver.enabled = config.ai.enabled;
        showToast(config.ai.enabled ? '🤖 ИИ включён' : '🤖 ИИ выключен', 'info');
    });
    document.getElementById('sandboxBtn').addEventListener('click', () => {
        if (window.sandbox) {
            window.sandbox.enabled = !window.sandbox.enabled;
            document.querySelector('.sandbox-panel')?.classList.toggle('open', window.sandbox.enabled);
            showToast(window.sandbox.enabled ? '🔬 Песочница открыта' : '🔬 Песочница закрыта', 'info');
        }
    });
    document.getElementById('evoBtn').addEventListener('click', () => {
        if (window.evolution) {
            window.evolution.enabled = !window.evolution.enabled;
            showToast(window.evolution.enabled ? '🧬 Эволюция включена' : '🧬 Эволюция выключена', 'info');
        }
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        initStars();
        initParticles();
        energyHistory = [];
        simTime = 0;
        showToast('🔄 Сброшено', 'success');
    });
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    const sliders = [
        { id: 'gravConst', path: 'physics.gravity', prop: 'gravConst' },
        { id: 'magField', path: 'physics.magneticField', prop: 'magField' },
        { id: 'viscosity', path: 'physics.viscosity', prop: 'viscosity' },
        { id: 'systemTemp', path: 'physics.temperature', prop: 'systemTemp', suffix: 'K' },
        { id: 'numParticles', path: 'particles.count', prop: 'numParticles', onChange: initParticles },
        { id: 'particleSpeed', path: 'particles.speed', prop: 'particleSpeed' },
        { id: 'starCount', path: 'stars.count', prop: 'starCount', onChange: initStars },
        { id: 'twinkle', path: 'stars.twinkleAmount', prop: 'twinkle', scale: 0.01, suffix: '%' },
        { id: 'starSize', path: 'stars.size', prop: 'starSize', onChange: initStars },
        { id: 'particleSize', path: 'particles.size', prop: 'particleSize' },
        { id: 'mouseSens', path: 'global.mouseSensitivity', prop: 'mouseSens' },
        { id: 'animSmooth', path: 'global.animSmooth', prop: 'smooth' },
        { id: 'aiFreq', path: 'ai.frequency', prop: 'aiFreq', suffix: 's' },
        { id: 'aiDetail', path: 'ai.detail', prop: 'aiDetail', suffix: '%' },
        { id: 'predHorizon', path: 'ai.detail', prop: 'predHorizon' }
    ];
    sliders.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) {
            el.addEventListener('input', () => {
                const val = parseFloat(el.value);
                const path = s.path.split('.');
                let obj = config;
                path.forEach(p => obj = obj[p]);
                obj = val;
                const valEl = document.getElementById(s.prop + 'Val');
                if (valEl) valEl.textContent = val + (s.suffix || '');
                if (s.onChange) s.onChange();
            });
        }
    });

    document.getElementById('aiEnabled')?.addEventListener('change', (e) => { 
        config.ai.enabled = e.target.checked; 
        if (window.aiObserver) window.aiObserver.enabled = e.target.checked;
    });
    document.getElementById('aiVoice')?.addEventListener('change', (e) => { 
        config.ai.voice = e.target.value; 
        if (window.aiObserver) window.aiObserver.voice = e.target.value;
    });
    document.getElementById('trailToggle')?.addEventListener('change', (e) => { config.particles.showTrail = e.target.checked; });
    document.getElementById('predAlgorithm')?.addEventListener('change', () => { refreshPrediction(); });
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme === 'default' ? '' : theme);
    document.querySelectorAll('.theme-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.theme-item[data-theme="${theme}"]`)?.classList.add('active');
    showToast(`🎨 Тема: ${theme}`, 'info');
}

function applyPreset(name) {
    const presets = {
        blackhole: { gravity: 5, magneticField: 1.5, viscosity: 0.3, temperature: 50, particles: { count: 300 } },
        solar: { gravity: 2, magneticField: 0.5, viscosity: 0, temperature: 800, particles: { count: 200 } },
        nebula: { gravity: 0.5, magneticField: 0.2, viscosity: 0.1, temperature: 200, particles: { count: 400 } },
        quantum: { gravity: 0.2, magneticField: 2, viscosity: 0, temperature: 1, particles: { count: 100 } },
        frozen: { gravity: 0.8, magneticField: 0, viscosity: 0.5, temperature: 0, particles: { count: 150 } },
        chaos: { gravity: 3, magneticField: 1, viscosity: 0, temperature: 1000, particles: { count: 500 } }
    };
    const p = presets[name];
    if (p) {
        Object.assign(config.physics, p);
        Object.assign(config.particles, p.particles);
        document.getElementById('gravConst').value = config.physics.gravity;
        document.getElementById('gravConstVal').textContent = config.physics.gravity.toFixed(2);
        document.getElementById('magField').value = config.physics.magneticField;
        document.getElementById('magFieldVal').textContent = config.physics.magneticField.toFixed(2);
        document.getElementById('viscosity').value = config.physics.viscosity;
        document.getElementById('viscosityVal').textContent = config.physics.viscosity.toFixed(2);
        document.getElementById('systemTemp').value = config.physics.temperature;
        document.getElementById('systemTempVal').textContent = config.physics.temperature + 'K';
        document.getElementById('numParticles').value = config.particles.count;
        document.getElementById('numParticlesVal').textContent = config.particles.count;
        initParticles();
        showToast(`Пресет: ${name}`, 'success');
    }
}

function askAI(type) {
    if (window.aiObserver) {
        window.aiObserver.ask(type);
    }
}

function refreshPrediction() {
    if (!predictor) return;
    const method = document.getElementById('predAlgorithm').value;
    predictionData = predictor.predict(method);
    showToast('🔄 Прогноз обновлён', 'success');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function init() {
    console.log('🚀 Инициализация...');
    
    for (let i = 1; i <= 5; i++) {
        layers[i] = document.querySelector('.layer-' + i);
    }
    
    initStars();
    initParticles();
    initPrediction();
    setupEventListeners();
    
    // Инициализация модулей
    if (window.evolution) window.evolution.init();
    if (window.sandbox) window.sandbox.init();
    if (window.aiObserver) window.aiObserver.init();
    
    console.log('✅ Частиц создано:', particles.length);
    console.log('✅ Звёзд создано:', stars.length);
    
    setTimeout(() => {
        const loading = document.getElementById('loadingScreen');
        if (loading) loading.classList.add('hidden');
    }, 1500);
    
    requestAnimationFrame(animate);
    
    setTimeout(() => showToast('🧠 ИИ Наблюдатель активирован', 'success'), 2000);
}

window.addEventListener('DOMContentLoaded', init);