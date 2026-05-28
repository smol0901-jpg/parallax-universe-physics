/**
 * Physics Engine
 * Расширенная физика для симуляции вселенной
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
    
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
}


// ==================== PARTICLE ====================
class Particle {
    constructor(x, y) {
        this.pos = new Vector2(x || Math.random() * canvasWidth, y || Math.random() * canvasHeight);
        this.vel = new Vector2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        this.acc = new Vector2();
        
        // Физические свойства
        this.mass = Math.random() * 2 + 0.5;
        this.charge = Math.random() > 0.5 ? 1 : -1;
        this.spin = Math.random() * Math.PI * 2;
        this.radius = 2 + this.mass;
        
        // Гены для эволюции
        this.genes = {
            speed: Math.random(),
            attraction: Math.random(),
            repulsion: Math.random(),
            cohesion: Math.random()
        };
        
        // Жизнь
        this.life = 1;
        this.maxLife = 1;
        this.decay = 0.0005 + Math.random() * 0.001;
        
        // Цвет
        this.hue = Math.random() * 60 + 200; // Сине-фиолетовый
    }
    
    applyForce(force) {
        // F = ma, a = F/m
        this.acc = this.acc.add(force.div(this.mass));
    }
    
    // Гравитационное притяжение к точке
    attractTo(target, strength = 1) {
        const force = target.sub(this.pos);
        let d = force.mag();
        d = Math.max(Math.min(d, 500), 5);
        
        const G = config.physics.gravity * strength;
        const magnitude = (G * this.mass) / (d * d);
        
        return force.normalize().mult(magnitude);
    }
    
    // Гравитация Ньютона
    applyGravity(other) {
        const force = other.pos.sub(this.pos);
        let d = force.mag();
        d = Math.max(Math.min(d, 300), 10);
        
        const G = config.physics.gravity * 0.5;
        const strength = (G * this.mass * other.mass) / (d * d);
        
        return force.normalize().mult(strength);
    }
    
    // Сила Лоренца (магнитное поле)
    applyLorentz() {
        if (config.physics.magneticField <= 0) return new Vector2();
        
        // F = q(v × B)
        const v = this.vel;
        const B = config.physics.magneticField;
        
        // Перпендикулярная сила
        const perp = new Vector2(-v.y, v.x);
        return perp.mult(this.charge * B * 0.1);
    }
    
    // Броуновское движение
    applyBrownian() {
        const temp = config.physics.temperature / 273;
        const noise = new Vector2(
            (Math.random() - 0.5) * temp,
            (Math.random() - 0.5) * temp
        );
        return noise.mult(0.5);
    }
    
    // Вязкость
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
        
        // Гравитация к центру
        const centerForce = this.attractTo(new Vector2(cx, cy), 0.5);
        this.applyForce(centerForce);
        
        // Магнитное поле
        this.applyForce(this.applyLorentz());
        
        // Броуновское
        this.applyForce(this.applyBrownian());
        
        // Вязкость
        this.applyForce(this.applyDrag());
        
        // Обновление
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.limit(15);
        this.pos = this.pos.add(this.vel.mult(dt * 60));
        this.acc = new Vector2(); // Сброс ускорения
        
        // Границы
        this.wrap();
        
        // Спин
        this.spin += 0.02 * dt * 60;
        
        // Жизнь
        this.life -= this.decay * dt * 60;
        if (this.life <= 0) {
            this.reset();
        }
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
    
    getKineticEnergy() {
        return 0.5 * this.mass * this.vel.magSq();
    }
    
    getPotentialEnergy(center) {
        const d = this.pos.dist(center);
        return -config.physics.gravity * this.mass / (d + 1);
    }
}

// ==================== PHYSICS SYSTEM ====================
class PhysicsSystem {
    constructor() {
        this.particles = [];
        this.center = new Vector2();
        this.bounds = { min: new Vector2(), max: new Vector2() };
    }
    
    init() {
        this.center = new Vector2(canvasWidth / 2, canvasHeight / 2);
    }
    
    // Расчёт полной энергии системы
    getTotalEnergy() {
        let kinetic = 0;
        let potential = 0;
        
        this.particles.forEach(p => {
            kinetic += p.getKineticEnergy();
            potential += p.getPotentialEnergy(this.center);
        });
        
        return { kinetic, potential, total: kinetic + potential };
    }
    
    // Расчёт энтропии
    getEntropy() {
        const energy = this.getTotalEnergy();
        if (energy.total <= 0) return 0;
        return -Math.log(Math.abs(energy.total)) * 100;
    }
    
    // Расчёт давления
    getPressure() {
        const energy = this.getTotalEnergy();
        const temp = config.physics.temperature;
        return (energy.kinetic * temp) / 1000;
    }
    
    // Расчёт температуры
    getTemperature() {
        const avgVel = this.particles.reduce((sum, p) => sum + p.vel.mag(), 0) / this.particles.length;
        return avgVel * avgVel * 273 / 10;
    }
    
    // Расчёт давления
    getDensity() {
        const area = canvasWidth * canvasHeight;
        return this.particles.length / area;
    }
    
    // Столкновения
    handleCollisions() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dist = p1.pos.dist(p2.pos);
                const minDist = p1.radius + p2.radius;
                
                if (dist < minDist && dist > 0) {
                    // Упругое столкновение
                    const normal = p2.pos.sub(p1.pos).normalize();
                    const relVel = p1.vel.sub(p2.vel);
                    const velAlongNormal = relVel.x * normal.x + relVel.y * normal.y;
                    
                    if (velAlongNormal > 0) continue;
                    
                    const restitution = 0.9;
                    const j = -(1 + restitution) * velAlongNormal;
                    const invMass1 = 1 / p1.mass;
                    const invMass2 = 1 / p2.mass;
                    
                    const impulse = j / (invMass1 + invMass2);
                    
                    p1.vel = p1.vel.add(normal.mult(impulse * invMass1));
                    p2.vel = p2.vel.sub(normal.mult(impulse * invMass2));
                    
                    // Разделение
                    const overlap = minDist - dist;
                    const separation = normal.mult(overlap / 2);
                    p1.pos = p1.pos.sub(separation);
                    p2.pos = p2.pos.add(separation);
                }
            }
        }
    }
    
    // Гравитационное взаимодействие (N-body)
    applyNBodyGravity() {
        if (config.physics.gravity < 0.1) return;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const force = p1.applyGravity(p2);
                p1.applyForce(force);
                p2.applyForce(force.mult(-1));
            }
        }
    }
    
    // Сортировка по квадрантам (оптимизация)
    getQuadrants() {
        const quadrants = {};
        const size = 100;
        
        this.particles.forEach(p => {
            const qx = Math.floor(p.pos.x / size);
            const qy = Math.floor(p.pos.y / size);
            const key = `${qx},${qy}`;
            
            if (!quadrants[key]) quadrants[key] = [];
            quadrants[key].push(p);
        });
        
        return quadrants;
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
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    // Линейная регрессия
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
    
    // Экспоненциальное сглаживание
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
    
    // Полиномиальная аппроксимация
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
    
    // Ряды Фурье
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

// ==================== MATH UTILS ====================
const MathUtils = {
    // Линейная интерполяция
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    // Ограничение значения
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // Плавное приближение
    smoothstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    },
    
    // Карта значения
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    
    // Случайное в диапазоне
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Шум Перлина (упрощённый)
    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },
    
    // Факториал
    factorial(n) {
        if (n <= 1) return 1;
        return n * this.factorial(n - 1);
    },
    
    // Комбинации
    combinations(n, k) {
        return this.factorial(n) / (this.factorial(k) * this.factorial(n - k));
    },
    
    // Гамма-функция (приближение)
    gamma(z) {
        const g = 7;
        const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        
        if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
        
        z -= 1;
        let x = c[0];
        for (let i = 1; i < g + 2; i++) {
            x += c[i] / (z + i);
        }
        
        const t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    },
    
    // Бета-функция
    beta(x, y) {
        return (this.gamma(x) * this.gamma(y)) / this.gamma(x + y);
    },
    
    // Функция ошибок
    erf(x) {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }
};

// Экспорт
window.Vector2 = Vector2;
window.Particle = Particle;
window.PhysicsSystem = PhysicsSystem;
window.Predictor = Predictor;
window.MathUtils = MathUtils;