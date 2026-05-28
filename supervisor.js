/**
 * Supervisor Module
 * Контролер физики и системных проверок
 */


class Supervisor {
    constructor() {
        this.physicsEnabled = true;
        this.collisionEnabled = true;
        this.boundaryEnabled = true;
        this.performanceMode = false;
        this.lastPhysicsUpdate = 0;
        this.physicsFps = 60;
        this.maxDeltaTime = 0.1;
    }
    
    init() {
        this.detectPerformance();
    }
    
    detectPerformance() {
        const testStart = performance.now();
        for (let i = 0; i < 10000; i++) {
            Math.sqrt(i) * Math.sin(i);
        }
        const testTime = performance.now() - testStart;
        
        if (testTime > 50) {
            this.performanceMode = true;
            showToast('⚡ Режим оптимизации включён', 'info');
        }
    }
    
    updatePhysics(dt) {
        if (!this.physicsEnabled) return;
        
        const now = performance.now();
        const delta = Math.min(dt, this.maxDeltaTime);
        
        // Ограничение частоты обновления физики
        if (now - this.lastPhysicsUpdate < 1000 / this.physicsFps) return;
        this.lastPhysicsUpdate = now;
        
        // Обновление частиц
        particles.forEach(p => {
            if (window.particleVisualizer && window.particleVisualizer.isFrozen(p.pos.x, p.pos.y)) {
                return; // Замороженная частица
            }
            p.update(delta);
        });
        
        // Проверка коллизий
        if (this.collisionEnabled) {
            this.checkCollisions();
        }
        
        // Проверка границ
        if (this.boundaryEnabled) {
            this.checkBoundaries();
        }
    }
    
    checkCollisions() {
        if (this.performanceMode && particles.length > 200) return;
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                
                const dx = p2.pos.x - p1.pos.x;
                const dy = p2.pos.y - p1.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = (p1.radius + p2.radius) * config.particles.size;
                
                if (dist < minDist && dist > 0) {
                    // Упругое столкновение
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    const dvx = p1.vel.x - p2.vel.x;
                    const dvy = p1.vel.y - p2.vel.y;
                    const dvn = dvx * nx + dvy * ny;
                    
                    if (dvn > 0) continue;
                    
                    const m1 = p1.mass;
                    const m2 = p2.mass;
                    const restitution = 0.8;
                    
                    const impulse = (-(1 + restitution) * dvn) / (1/m1 + 1/m2);
                    
                    p1.vel.x += impulse * nx / m1;
                    p1.vel.y += impulse * ny / m1;
                    p2.vel.x -= impulse * nx / m2;
                    p2.vel.y -= impulse * ny / m2;
                    
                    // Разделение
                    const overlap = minDist - dist;
                    p1.pos.x -= overlap * nx * 0.5;
                    p1.pos.y -= overlap * ny * 0.5;
                    p2.pos.x += overlap * nx * 0.5;
                    p2.pos.y += overlap * ny * 0.5;
                }
            }
        }
    }
    
    checkBoundaries() {
        const margin = 50;
        
        particles.forEach(p => {
            if (p.pos.x < -margin) p.pos.x = canvasWidth + margin;
            if (p.pos.x > canvasWidth + margin) p.pos.x = -margin;
            if (p.pos.y < -margin) p.pos.y = canvasHeight + margin;
            if (p.pos.y > canvasHeight + margin) p.pos.y = -margin;
        });
    }
    
    validateState() {
        // Проверка на NaN
        particles.forEach(p => {
            if (isNaN(p.pos.x) || isNaN(p.pos.y)) {
                p.pos = new Vector2(Math.random() * canvasWidth, Math.random() * canvasHeight);
            }
            if (isNaN(p.vel.x) || isNaN(p.vel.y)) {
                p.vel = new Vector2();
            }
        });
    }
    
    getStats() {
        return {
            particles: particles.length,
            fps: this.physicsFps,
            performanceMode: this.performanceMode,
            physicsEnabled: this.physicsEnabled,
            collisions: this.collisionEnabled
        };
    }
    
    update() {
        this.validateState();
    }
}

window.supervisor = new Supervisor();