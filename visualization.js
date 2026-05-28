/**
 * Particle Visualization Module
 * Визуализация и детализация частиц
 */


class ParticleVisualizer {
    constructor() {
        this.selectedParticle = null;
        this.hoveredParticle = null;
        this.frozenZones = [];
        this.freezeDuration = 5000;
        this.freezeRadius = 80;
        this.infoPanel = null;
        this.trailCanvas = null;
        this.trailCtx = null;
    }
    
    init() {
        this.createInfoPanel();
        this.createTrailCanvas();
        this.bindEvents();
    }
    
    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'particle-info-panel';
        panel.innerHTML = `
            <div class="info-header">
                <span>⚛️ Частица</span>
                <button class="close-info">&times;</button>
            </div>
            <div class="info-content">
                <div class="info-row"><span>ID:</span><span id="p-id">-</span></div>
                <div class="info-row"><span>Позиция:</span><span id="p-pos">-</span></div>
                <div class="info-row"><span>Скорость:</span><span id="p-vel">-</span></div>
                <div class="info-row"><span>Масса:</span><span id="p-mass">-</span></div>
                <div class="info-row"><span>Заряд:</span><span id="p-charge">-</span></div>
                <div class="info-row"><span>Энергия:</span><span id="p-energy">-</span></div>
                <div class="info-row"><span>Жизнь:</span><span id="p-life">-</span></div>
                <div class="info-row"><span>Температура:</span><span id="p-temp">-</span></div>
            </div>
        `;
        panel.style.display = 'none';
        document.body.appendChild(panel);
        this.infoPanel = panel;
        
        panel.querySelector('.close-info').addEventListener('click', () => {
            this.selectedParticle = null;
            panel.style.display = 'none';
        });
    }
    
    createTrailCanvas() {
        const canvas = document.createElement('canvas');
        canvas.className = 'trail-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:50;';
        document.body.appendChild(canvas);
        this.trailCanvas = canvas;
        this.trailCtx = canvas.getContext('2d');
    }
    
    bindEvents() {
        const container = document.querySelector('.parallax-container');
        if (container) {
            container.addEventListener('click', (e) => this.handleClick(e));
            container.addEventListener('mousemove', (e) => this.handleHover(e));
        }
        
        window.addEventListener('resize', () => {
            if (this.trailCanvas) {
                this.trailCanvas.width = window.innerWidth;
                this.trailCanvas.height = window.innerHeight;
            }
        });
    }
    
    handleClick(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        // Проверка клика на частицу
        let clickedParticle = null;
        for (let p of particles) {
            const dist = Math.sqrt((p.pos.x - x) ** 2 + (p.pos.y - y) ** 2);
            if (dist < 20) {
                clickedParticle = p;
                break;
            }
        }
        
        if (clickedParticle) {
            this.selectParticle(clickedParticle);
        } else {
            this.createFreezeZone(x, y);
        }
    }
    
    handleHover(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        this.hoveredParticle = null;
        for (let p of particles) {
            const dist = Math.sqrt((p.pos.x - x) ** 2 + (p.pos.y - y) ** 2);
            if (dist < 15) {
                this.hoveredParticle = p;
                break;
            }
        }
    }
    
    selectParticle(p) {
        this.selectedParticle = p;
        this.updateInfoPanel();
        this.infoPanel.style.display = 'block';
    }
    
    updateInfoPanel() {
        if (!this.selectedParticle) return;
        const p = this.selectedParticle;
        document.getElementById('p-id').textContent = particles.indexOf(p);
        document.getElementById('p-pos').textContent = `${p.pos.x.toFixed(1)}, ${p.pos.y.toFixed(1)}`;
        document.getElementById('p-vel').textContent = p.vel.mag().toFixed(2) + ' м/с';
        document.getElementById('p-mass').textContent = p.mass.toFixed(2) + ' кг';
        document.getElementById('p-charge').textContent = p.charge > 0 ? '+' + p.charge : p.charge;
        document.getElementById('p-energy').textContent = p.getEnergy().toFixed(2) + ' J';
        document.getElementById('p-life').textContent = (p.life * 100).toFixed(0) + '%';
        document.getElementById('p-temp').textContent = config.physics.temperature + 'K';
    }
    
    createFreezeZone(x, y) {
        const zone = {
            x, y,
            radius: this.freezeRadius,
            startTime: Date.now(),
            duration: this.freezeDuration
        };
        this.frozenZones.push(zone);
        showToast(`❄️ Зона заморозки на ${this.freezeDuration/1000}с`, 'info');
        
        setTimeout(() => {
            const idx = this.frozenZones.indexOf(zone);
            if (idx > -1) this.frozenZones.splice(idx, 1);
        }, this.freezeDuration);
    }
    
    isFrozen(x, y) {
        for (let zone of this.frozenZones) {
            const dist = Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2);
            if (dist < zone.radius) return true;
        }
        return false;
    }
    
    drawFrozenZones() {
        if (!this.trailCtx) return;
        const now = Date.now();
        
        for (let zone of this.frozenZones) {
            const elapsed = now - zone.startTime;
            const remaining = zone.duration - elapsed;
            const alpha = remaining / zone.duration * 0.3;
            
            this.trailCtx.beginPath();
            this.trailCtx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            this.trailCtx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
            this.trailCtx.fill();
            this.trailCtx.strokeStyle = `rgba(0, 200, 255, ${alpha + 0.2})`;
            this.trailCtx.lineWidth = 2;
            this.trailCtx.stroke();
            
            // Таймер
            this.trailCtx.fillStyle = 'rgba(255,255,255,0.8)';
            this.trailCtx.font = '14px monospace';
            this.trailCtx.textAlign = 'center';
            this.trailCtx.fillText((remaining/1000).toFixed(1) + 'с', zone.x, zone.y);
        }
    }
    
    drawParticleTrails() {
        if (!this.trailCtx || !config.particles.showTrail) return;
        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        
        particles.forEach((p, i) => {
            if (this.isFrozen(p.pos.x, p.pos.y)) return;
            
            const gradient = this.trailCtx.createRadialGradient(
                p.pos.x, p.pos.y, 0,
                p.pos.x, p.pos.y, config.particles.size * 3
            );
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
            
            this.trailCtx.beginPath();
            this.trailCtx.arc(p.pos.x, p.pos.y, config.particles.size * 3, 0, Math.PI * 2);
            this.trailCtx.fillStyle = gradient;
            this.trailCtx.fill();
        });
        
        // Выделение при наведении
        if (this.hoveredParticle) {
            const p = this.hoveredParticle;
            this.trailCtx.beginPath();
            this.trailCtx.arc(p.pos.x, p.pos.y, 15, 0, Math.PI * 2);
            this.trailCtx.strokeStyle = '#fff';
            this.trailCtx.lineWidth = 2;
            this.trailCtx.stroke();
        }
        
        this.drawFrozenZones();
    }
    
    update() {
        if (this.selectedParticle) {
            this.updateInfoPanel();
        }
        this.drawParticleTrails();
    }
}

window.particleVisualizer = new ParticleVisualizer();