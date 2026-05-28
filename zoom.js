/**
 * Zoom & Navigation Module
 * Увеличение поля в 10 раз, мини-карта, навигация
 */

class ZoomNavigator {
    constructor() {
        this.zoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 10;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        this.worldWidth = 0;
        this.worldHeight = 0;
        this.miniMap = null;
        this.miniMapCanvas = null;
        this.elements = {
            hud: true,
            ai: true,
            controls: true,
            particles: true,
            stars: true
        };
    }
    
    init() {
        this.worldWidth = window.innerWidth * this.maxZoom;
        this.worldHeight = window.innerHeight * this.maxZoom;
        this.createMiniMap();
        this.bindEvents();
    }
    
    createMiniMap() {
        const map = document.createElement('div');
        map.className = 'mini-map';
        map.innerHTML = `
            <div class="map-header">🗺️ Мини-карта</div>
            <canvas class="map-canvas"></canvas>
            <div class="map-controls">
                <button class="map-zoom-in">+</button>
                <button class="map-zoom-out">-</button>
                <button class="map-center">⟲</button>
            </div>
        `;
        document.body.appendChild(map);
        this.miniMap = map;
        this.miniMapCanvas = map.querySelector('.map-canvas');
        this.miniMapCtx = this.miniMapCanvas.getContext('2d');
        this.miniMapCanvas.width = 150;
        this.miniMapCanvas.height = 100;
        
        map.querySelector('.map-zoom-in').addEventListener('click', () => this.zoomIn());
        map.querySelector('.map-zoom-out').addEventListener('click', () => this.zoomOut());
        map.querySelector('.map-center').addEventListener('click', () => this.centerView());
        
        map.addEventListener('click', (e) => {
            const rect = this.miniMapCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.panToWorld(x / this.miniMapCanvas.width * this.worldWidth, y / this.miniMapCanvas.height * this.worldHeight);
        });
    }
    
    bindEvents() {
        const container = document.querySelector('.parallax-container');
        if (container) {
            container.addEventListener('wheel', (e) => this.handleWheel(e));
            container.addEventListener('mousedown', (e) => this.startPan(e));
            container.addEventListener('mousemove', (e) => this.doPan(e));
            container.addEventListener('mouseup', () => this.endPan());
            container.addEventListener('mouseleave', () => this.endPan());
        }
        
        // Клавиши
        document.addEventListener('keydown', (e) => {
            if (e.key === '+' || e.key === '=') this.zoomIn();
            if (e.key === '-') this.zoomOut();
            if (e.key === '0') this.resetZoom();
            if (e.key === 'h') this.toggleHUD();
            if (e.key === 'a') this.toggleAI();
            if (e.key === 'c') this.toggleControls();
        });
    }
    
    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.setZoom(this.zoom * delta);
    }
    
    startPan(e) {
        if (e.button === 1 || e.shiftKey) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
        }
    }
    
    doPan(e) {
        if (!this.isPanning) return;
        const dx = e.clientX - this.lastPanX;
        const dy = e.clientY - this.lastPanY;
        this.panX -= dx / this.zoom;
        this.panY -= dy / this.zoom;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
    }
    
    endPan() {
        this.isPanning = false;
    }
    
    setZoom(z) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
        this.applyTransform();
    }
    
    zoomIn() {
        this.setZoom(this.zoom * 1.5);
    }
    
    zoomOut() {
        this.setZoom(this.zoom / 1.5);
    }
    
    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.applyTransform();
    }
    
    centerView() {
        this.panX = this.worldWidth / 2 - window.innerWidth / 2;
        this.panY = this.worldHeight / 2 - window.innerHeight / 2;
        this.applyTransform();
    }
    
    panToWorld(x, y) {
        this.panX = x - window.innerWidth / 2 / this.zoom;
        this.panY = y - window.innerHeight / 2 / this.zoom;
        this.applyTransform();
    }
    
    applyTransform() {
        const container = document.querySelector('.parallax-container');
        if (container) {
            container.style.transform = `scale(${this.zoom}) translate(${-this.panX}px, ${-this.panY}px)`;
        }
        showToast(`🔍 Zoom: ${this.zoom.toFixed(1)}x`, 'info');
    }
    
    toggleHUD() {
        this.elements.hud = !this.elements.hud;
        document.querySelector('.physics-hud').style.display = this.elements.hud ? 'block' : 'none';
    }
    
    toggleAI() {
        this.elements.ai = !this.elements.ai;
        document.querySelector('.ai-panel').style.display = this.elements.ai ? 'block' : 'none';
    }
    
    toggleControls() {
        this.elements.controls = !this.elements.controls;
        document.querySelector('.bottom-controls').style.display = this.elements.controls ? 'flex' : 'none';
    }
    
    updateMiniMap() {
        if (!this.miniMapCtx) return;
        const ctx = this.miniMapCtx;
        const w = this.miniMapCanvas.width;
        const h = this.miniMapCanvas.height;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, w, h);
        
        // Масштаб
        const scaleX = w / this.worldWidth;
        const scaleY = h / this.worldHeight;
        
        // Звёзды
        if (this.elements.stars) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            stars.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x * scaleX, s.y * scaleY, 1, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Частицы
        if (this.elements.particles) {
            ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.pos.x * scaleX, p.pos.y * scaleY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Планеты
        if (window.planets) {
            window.planets.forEach(planet => {
                ctx.fillStyle = planet.color;
                ctx.beginPath();
                ctx.arc(planet.x * scaleX, planet.y * scaleY, planet.radius * scaleX * 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Область просмотра
        const viewX = this.panX * scaleX;
        const viewY = this.panY * scaleY;
        const viewW = (window.innerWidth / this.zoom) * scaleX;
        const viewH = (window.innerHeight / this.zoom) * scaleY;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(viewX, viewY, viewW, viewH);
    }
    
    update() {
        this.updateMiniMap();
    }
}

window.zoomNavigator = new ZoomNavigator();