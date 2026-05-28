/**
 * Universe Physics Simulator - Complete
 * Все модули в одном файле
 */

// ==================== VECTOR2 ====================
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    mult(s) { return new Vector2(this.x * s, this.y * s); }
    div(s) { return new Vector2(this.x / s, this.y / s); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    magSq() { return this.x * this.x + this.y * this.y; }
    normalize() {
        const m = this.mag();
        return m > 0 ? this.div(m) : new Vector2();
    }
    limit(max) {
        if (this.magSq() > max * max) {
            return this.normalize().mult(max);
        }
        return this;
    }
    dist(v) { return this.sub(v).mag(); }
    clone() { return new Vector2(this.x, this.y); }
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
}

// ==================== PARTICLE ====================
class Particle {
    constructor(x, y) {
        this.pos = new Vector2(x || Math.random() * canvasWidth, y || Math.random() * canvasHeight);
        this.vel = new Vector2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        this.acc = new Vector2();
        this.mass = Math.random() * 2 + 0.5;
        this.charge = Math.random() > 0.5 ? 1 : -1;
        this.radius = 2 + this.mass;
        this.life = 1;
        this.decay = 0.0005 + Math.random() * 0.001;
    }
    
    applyForce(force) {
        this.acc = this.acc.add(force.div(this.mass));
    }
    
    attractTo(target, strength = 1) {
        const force = target.sub(this.pos);
        let d = force.mag();
        d = Math.max(Math.min(d, 500), 5);
        const G = config.physics.gravity * strength;
        const magnitude = (G * this.mass) / (d * d);
        return force.normalize().mult(magnitude);
    }
    
    applyLorentz() {
        if (config.physics.magneticField <= 0) return new Vector2();
        const v = this.vel;
        const B = config.physics.magneticField;
        const perp = new Vector2(-v.y, v.x);
        return perp.mult(this.charge * B * 0.1);
    }
    
    applyBrownian() {
        const temp = config.physics.temperature / 273;
        return new Vector2(
            (Math.random() - 0.5) * temp,
            (Math.random() - 0.5) * temp
        ).mult(0.5);
    }
    
    applyDrag() {
        const drag = this.vel.clone();
        drag.mult(-1);
        drag.normalize();
        drag.mult(config.physics.viscosity * this.vel.magSq() * 0.01);
        return drag;
    }
    
    update(dt) {
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        
        const centerForce = this.attractTo(new Vector2(cx, cy), 0.5);
        this.applyForce(centerForce);
        this.applyForce(this.applyLorentz());
        this.applyForce(this.applyBrownian());
        this.applyForce(this.applyDrag());
        
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.limit(15);
        this.pos = this.pos.add(this.vel.mult(dt * 60));
        this.acc = new Vector2();
        
        this.wrap();
        this.life -= this.decay * dt * 60;
        if (this.life <= 0) this.reset();
    }
    
    wrap() {
        if (this.pos.x < 0) this.pos.x = canvasWidth;
        if (this.pos.x > canvasWidth) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = canvasHeight;
        if (this.pos.y > canvasHeight) this.pos.y = 0;
    }
    
    reset() {
        this.pos = new Vector2(Math.random() * canvasWidth, Math.random() * canvasHeight);
        this.vel = new Vector2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        this.life = 1;
    }
    
    getEnergy() {
        return 0.5 * this.mass * this.vel.magSq();
    }
}

// ==================== PREDICTOR ====================
class Predictor {
    constructor() {
        this.history = [];
        this.maxHistory = 200;
    }
    
    add(value) {
        this.history.push(value);
        if (this.history.length > this.maxHistory) this.history.shift();
    }
    
    linearRegression() {
        if (this.history.length < 2) return [];
        const n = this.history.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += this.history[i];
            sumXY += i * this.history[i];
            sumX2 += i * i;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const predictions = [];
        for (let i = 0; i < config.ai.detail; i++) {
            predictions.push(slope * (n + i) + intercept);
        }
        return predictions;
    }
    
    exponentialSmoothing(alpha = 0.3) {
        if (this.history.length < 2) return [];
        let smoothed = this.history[0];
        for (let i = 1; i < this.history.length; i++) {
            smoothed = alpha * this.history[i] + (1 - alpha) * smoothed;
        }
        const predictions = [];
        for (let i = 0; i < config.ai.detail; i++) {
            predictions.push(smoothed + Math.sin(i * 0.1) * Math.abs(smoothed * 0.1));
        }
        return predictions;
    }
    
    polynomialRegression() {
        if (this.history.length < 3) return [];
        let mean = this.history.reduce((a, b) => a + b, 0) / this.history.length;
        let variance = this.history.reduce((a, b) => a + (b - mean) ** 2, 0) / this.history.length;
        const predictions = [];
        for (let i = 0; i < config.ai.detail; i++) {
            const trend = (this.history.length + i - this.history.length / 2) / this.history.length;
            predictions.push(mean + trend * variance * 0.1 * Math.sin(i * 0.2));
        }
        return predictions;
    }
    
    fourierPredict() {
        if (this.history.length < 10) return [];
        const predictions = [];
        for (let i = 0; i < config.ai.detail; i++) {
            let value = 0;
            for (let k = 1; k <= 3; k++) {
                value += Math.sin((2 * Math.PI * k * (this.history.length + i)) / 20 + k) * (1 / k);
            }
            predictions.push(this.history[this.history.length - 1] + value * 10);
        }
        return predictions;
    }
    
    predict(method = 'linear') {
        switch (method) {
            case 'linear': return this.linearRegression();
            case 'exponential': return this.exponentialSmoothing();
            case 'polynomial': return this.polynomialRegression();
            case 'fourier': return this.fourierPredict();
            default: return this.linearRegression();
        }
    }
}

// ==================== AI OBSERVER ====================
class AIObserver {
    constructor() {
        this.enabled = true;
        this.voice = 'neutral';
        this.frequency = 5;
        this.detail = 50;
        this.lastMessageTime = 0;
    }
    
    init() {}
    
    analyze() {
        const totalEnergy = particles.reduce((sum, p) => sum + p.getEnergy(), 0);
        const avgVelocity = particles.reduce((sum, p) => sum + p.vel.mag(), 0) / (particles.length || 1);
        const entropy = -Math.log(totalEnergy + 0.001) * 100;
        return {
            totalEnergy,
            avgVelocity,
            entropy,
            temperature: config.physics.temperature,
            gravity: config.physics.gravity,
            magneticField: config.physics.magneticField,
            particleCount: particles.length
        };
    }
    
    generateMessage(type = 'normal') {
        const a = this.analyze();
        const templates = {
            neutral: [
                `Энергия системы: ${a.totalEnergy.toFixed(1)} Дж. Температура: ${a.temperature}K.`,
                `Наблюдаю ${a.particleCount} частиц. Средняя скорость: ${a.avgVelocity.toFixed(2)} м/с.`,
                `Энтропия: ${a.entropy.toFixed(2)}. Система ${a.entropy < 50 ? 'стабильна' : 'хаотична'}.`,
                `Гравитация ${a.gravity > 1 ? 'повышена' : 'в норме'}. Магнитное поле: ${a.magneticField.toFixed(2)}.`
            ],
            scientific: [
                `Термодинамика: T=${a.temperature}K, E=${a.totalEnergy.toFixed(2)}J, S=${a.entropy.toFixed(4)}`,
                `Вектор скорости: v̅=${a.avgVelocity.toFixed(3)} м/с. N=${a.particleCount} частиц.`,
                `Энтропия S = -k·ln(W) = ${a.entropy.toFixed(4)}. Равновесие ${a.entropy < 50 ? 'близко' : 'далеко'}.`
            ],
            poetic: [
                `В глубинах космоса танцуют частицы... Энергия ${a.totalEnergy.toFixed(0)} единиц.`,
                `Каждая частица — звезда в миниатюре. ${a.particleCount} звёзд рождаются и угасают.`,
                `Гравитация — невидимая рука, связывающая всё сущее.`
            ],
            status: [
                `📊 Статус: ${a.particleCount} частиц, T=${a.temperature}K, E=${a.totalEnergy.toFixed(1)}J.`
            ],
            predict: [
                `🔮 Прогноз: ожидаю ${(a.totalEnergy * 1.1).toFixed(1)}J через 10 единиц времени.`
            ],
            physics: [
                `⚛️ Гравитация: G=${a.gravity}, Магнитное поле: B=${a.magneticField.toFixed(2)}.`
            ],
            entropy: [
                `📉 Энтропия S=${a.entropy.toFixed(2)}. Система ${a.entropy < 50 ? 'близка к равновесию' : 'в нестабильном состоянии'}.`
            ]
        };
        
        let msgs = templates[this.voice] || templates.neutral;
        if (type !== 'normal') msgs = templates[type] || templates.neutral;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    ask(question) {
        let type = 'normal';
        if (question.includes('статус') || question.includes('status')) type = 'status';
        else if (question.includes('прогноз') || question.includes('predict')) type = 'predict';
        else if (question.includes('физика') || question.includes('physics')) type = 'physics';
        else if (question.includes('энтропия') || question.includes('entropy')) type = 'entropy';
        
        const msg = this.generateMessage(type);
        document.getElementById('aiMessage').textContent = msg;
        return msg;
    }
    
    update() {
        if (!this.enabled) return;
        const now = Date.now();
        if (now - this.lastMessageTime > this.frequency * 1000) {
            const msg = this.generateMessage('normal');
            document.getElementById('aiMessage').textContent = msg;
            this.lastMessageTime = now;
        }
    }
}

// ==================== MAIN APP ====================
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
let aiObserver;

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
    console.log('✅ Создано частиц:', particles.length);
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
    if (aiObserver) aiObserver.update();
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
        if (aiObserver) aiObserver.enabled = config.ai.enabled;
        showToast(config.ai.enabled ? '🤖 ИИ включён' : '🤖 ИИ выключен', 'info');
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

    // Sliders
    const bindSlider = (id, path, prop, suffix = '', onChange = null) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                const val = parseFloat(el.value);
                const parts = path.split('.');
                let obj = config;
                for (let p of parts) obj = obj[p];
                obj = val;
                const valEl = document.getElementById(prop + 'Val');
                if (valEl) valEl.textContent = val + suffix;
                if (onChange) onChange();
            });
        }
    };
    
    bindSlider('gravConst', 'physics.gravity', 'gravConst');
    bindSlider('magField', 'physics.magneticField', 'magField');
    bindSlider('viscosity', 'physics.viscosity', 'viscosity');
    bindSlider('systemTemp', 'physics.temperature', 'systemTemp', 'K');
    bindSlider('numParticles', 'particles.count', 'numParticles', '', initParticles);
    bindSlider('particleSpeed', 'particles.speed', 'particleSpeed');
    bindSlider('starCount', 'stars.count', 'starCount', '', initStars);
    bindSlider('twinkle', 'stars.twinkleAmount', 'twinkle', '%');
    bindSlider('starSize', 'stars.size', 'starSize', '', initStars);
    bindSlider('particleSize', 'particles.size', 'particleSize');
    bindSlider('mouseSens', 'global.mouseSensitivity', 'mouseSens');
    bindSlider('animSmooth', 'global.animSmooth', 'smooth');
    bindSlider('aiFreq', 'ai.frequency', 'aiFreq', 's');
    bindSlider('aiDetail', 'ai.detail', 'aiDetail', '%');

    document.getElementById('aiEnabled')?.addEventListener('change', (e) => { 
        config.ai.enabled = e.target.checked; 
        if (aiObserver) aiObserver.enabled = e.target.checked;
    });
    document.getElementById('aiVoice')?.addEventListener('change', (e) => { 
        config.ai.voice = e.target.value; 
        if (aiObserver) aiObserver.voice = e.target.value;
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
    if (aiObserver) aiObserver.ask(type);
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
    console.log('🚀 Запуск симуляции...');
    
    for (let i = 1; i <= 5; i++) {
        layers[i] = document.querySelector('.layer-' + i);
    }
    
    initStars();
    initParticles();
    initPrediction();
    setupEventListeners();
    
    aiObserver = new AIObserver();
    aiObserver.init();
    
    console.log('✅ Частиц:', particles.length);
    console.log('✅ Звёзд:', stars.length);
    
    setTimeout(() => {
        const loading = document.getElementById('loadingScreen');
        if (loading) loading.classList.add('hidden');
    }, 1000);
    
    requestAnimationFrame(animate);
    setTimeout(() => showToast('🧠 ИИ Наблюдатель активирован', 'success'), 1500);
}

window.addEventListener('DOMContentLoaded', init);