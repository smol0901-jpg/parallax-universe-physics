/**
 * Planets Module
 * Планеты с гравитацией, магнитным полем, атмосферой
 */

class Planet {
    constructor(config) {
        this.name = config.name || 'Planet';
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.radius = config.radius || 30;
        this.mass = config.mass || 1000;
        this.gravity = config.gravity || 1;
        this.magneticField = config.magneticField || 0;
        this.color = config.color || '#4a90d9';
        this.atmosphere = config.atmosphere || { color: 'rgba(100,150,255,0.3)', radius: 50 };
        this.temperature = config.temperature || 273;
        this.ring = config.ring || null;
        this.satellites = config.satellites || [];
    }
    
    attractParticle(p) {
        const dx = this.x - p.pos.x;
        const dy = this.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.radius) return new Vector2();
        
        const force = this.gravity * this.mass * p.mass / (dist * dist);
        const angle = Math.atan2(dy, dx);
        return new Vector2(Math.cos(angle) * force, Math.sin(angle) * force);
    }
    
    applyMagneticField(p) {
        if (this.magneticField <= 0) return new Vector2();
        const dx = this.x - p.pos.x;
        const dy = this.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.radius * 5) return new Vector2();
        
        const strength = this.magneticField / (dist * 0.1 + 1);
        const perp = new Vector2(-p.vel.y, p.vel.x);
        return perp.mult(p.charge * strength * 0.1);
    }
    
    getAtmosphereDensity(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.atmosphere.radius) return 0;
        return 1 - (dist / this.atmosphere.radius);
    }
}

class PlanetSystem {
    constructor() {
        this.planets = [];
        this.canvas = null;
        this.ctx = null;
    }
    
    init() {
        this.createDefaultPlanets();
    }
    
    createDefaultPlanets() {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        
        this.planets = [
            new Planet({
                name: 'Солнце',
                x: cx - 300,
                y: cy - 200,
                radius: 50,
                mass: 5000,
                gravity: 3,
                magneticField: 1.5,
                color: '#ff6b35',
                atmosphere: { color: 'rgba(255,150,50,0.4)', radius: 100 },
                temperature: 5778,
                ring: { color: 'rgba(255,200,100,0.3)', inner: 60, outer: 80 }
            }),
            new Planet({
                name: 'Земля',
                x: cx + 200,
                y: cy + 100,
                radius: 25,
                mass: 1000,
                gravity: 1,
                magneticField: 0.5,
                color: '#4a90d9',
                atmosphere: { color: 'rgba(100,150,255,0.3)', radius: 40 },
                temperature: 288
            }),
            new Planet({
                name: 'Марс',
                x: cx + 350,
                y: cy - 150,
                radius: 20,
                mass: 600,
                gravity: 0.6,
                magneticField: 0.1,
                color: '#c1440e',
                atmosphere: { color: 'rgba(200,100,50,0.2)', radius: 30 },
                temperature: 210
            }),
            new Planet({
                name: 'Юпитер',
                x: cx - 400,
                y: cy + 250,
                radius: 40,
                mass: 3000,
                gravity: 2,
                magneticField: 2,
                color: '#d4a574',
                atmosphere: { color: 'rgba(200,150,100,0.3)', radius: 70 },
                temperature: 165,
                ring: { color: 'rgba(200,180,150,0.2)', inner: 50, outer: 65 }
            }),
            new Planet({
                name: 'Луна',
                x: cx + 230,
                y: cy + 120,
                radius: 10,
                mass: 100,
                gravity: 0.2,
                magneticField: 0,
                color: '#888888',
                atmosphere: null,
                temperature: 100
            })
        ];
        
        window.planets = this.planets;
    }
    
    applyToParticles() {
        particles.forEach(p => {
            this.planets.forEach(planet => {
                p.applyForce(planet.attractParticle(p));
                p.applyForce(planet.applyMagneticField(p));
            });
        });
    }
    
    draw() {
        const canvas = document.createElement('canvas');
        canvas.className = 'planets-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:10;';
        document.body.appendChild(canvas);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.planets.forEach(planet => {
            // Атмосфера
            if (planet.atmosphere) {
                const grad = this.ctx.createRadialGradient(
                    planet.x, planet.y, planet.radius,
                    planet.x, planet.y, planet.atmosphere.radius
                );
                grad.addColorStop(0, planet.atmosphere.color);
                grad.addColorStop(1, 'transparent');
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(planet.x, planet.y, planet.atmosphere.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Кольцо
            if (planet.ring) {
                this.ctx.beginPath();
                this.ctx.ellipse(planet.x, planet.y, planet.ring.outer, planet.ring.inner * 0.3, 0, 0, Math.PI * 2);
                this.ctx.strokeStyle = planet.ring.color;
                this.ctx.lineWidth = planet.ring.outer - planet.ring.inner;
                this.ctx.stroke();
            }
            
            // Планета
            const planetGrad = this.ctx.createRadialGradient(
                planet.x - planet.radius * 0.3, planet.y - planet.radius * 0.3, 0,
                planet.x, planet.y, planet.radius
            );
            planetGrad.addColorStop(0, this.lightenColor(planet.color, 30));
            planetGrad.addColorStop(0.7, planet.color);
            planetGrad.addColorStop(1, this.darkenColor(planet.color, 30));
            
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = planetGrad;
            this.ctx.fill();
            
            // Название
            this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(planet.name, planet.x, planet.y + planet.radius + 15);
        });
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R},${G},${B})`;
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R},${G},${B})`;
    }
    
    update() {
        this.applyToParticles();
        this.render();
    }
}

window.planetSystem = new PlanetSystem();