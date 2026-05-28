/**
 * Math & Computation Module
 * Вычисления для частиц и ИИ
 */


class ParticleMath {
    static distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }
    
    static distanceSq(p1, p2) {
        return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
    }
    
    static angle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
    
    static rotate(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: x * cos - y * sin,
            y: x * sin + y * cos
        };
    }
    
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    static smoothstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }
    
    static noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }
    
    static perlin(x, y) {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        const u = this.fade(xf);
        const v = this.fade(yf);
        
        const aa = this.hash(xi + this.hash(yi));
        const ab = this.hash(xi + this.hash(yi + 1));
        const ba = this.hash(xi + 1 + this.hash(yi));
        const bb = this.hash(xi + 1 + this.hash(yi + 1));
        
        const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
        const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
        
        return this.lerp(x1, x2, v);
    }
    
    static fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    static hash(n) {
        return ((n * 1597 + 51749) * 244957) % 256;
    }
    
    static grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    
    static computeKineticEnergy(particle) {
        return 0.5 * particle.mass * particle.vel.magSq();
    }
    
    static computePotentialEnergy(particle, center) {
        const dist = particle.pos.dist(center);
        return -config.physics.gravity * particle.mass * 1000 / (dist + 1);
    }
    
    static computeMomentum(particle) {
        return particle.vel.mult(particle.mass);
    }
    
    static computeAngularMomentum(particle, center) {
        const r = particle.pos.sub(center);
        const p = this.computeMomentum(particle);
        return r.x * p.y - r.y * p.x;
    }
}

class AIMath {
    static computeEntropy(energies) {
        const total = energies.reduce((a, b) => a + b, 0);
        if (total === 0) return 0;
        
        let entropy = 0;
        energies.forEach(e => {
            const p = e / total;
            if (p > 0) entropy -= p * Math.log(p);
        });
        return entropy;
    }
    
    static computeTemperature(avgVelocity) {
        return avgVelocity * 273 / 5;
    }
    
    static computePressure(volume, temperature, count) {
        const n = count / 6e23;
        const R = 8.314;
        return (n * R * temperature) / volume;
    }
    
    static computeDensity(count, area) {
        return count / area;
    }
    
    static linearRegression(data) {
        const n = data.length;
        if (n < 2) return { slope: 0, intercept: data[0] || 0 };
        
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumX2 += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }
    
    static exponentialMovingAverage(data, alpha = 0.3) {
        if (data.length === 0) return 0;
        let ema = data[0];
        for (let i = 1; i < data.length; i++) {
            ema = alpha * data[i] + (1 - alpha) * ema;
        }
        return ema;
    }
    
    static standardDeviation(data) {
        if (data.length < 2) return 0;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
        return Math.sqrt(variance);
    }
    
    static correlation(data1, data2) {
        if (data1.length !== data2.length || data1.length < 2) return 0;
        
        const mean1 = data1.reduce((a, b) => a + b, 0) / data1.length;
        const mean2 = data2.reduce((a, b) => a + b, 0) / data2.length;
        
        let num = 0, den1 = 0, den2 = 0;
        for (let i = 0; i < data1.length; i++) {
            const d1 = data1[i] - mean1;
            const d2 = data2[i] - mean2;
            num += d1 * d2;
            den1 += d1 * d1;
            den2 += d2 * d2;
        }
        
        return num / Math.sqrt(den1 * den2);
    }
    
    static fourierTransform(data, harmonics = 3) {
        const result = [];
        const n = data.length;
        
        for (let k = 0; k < harmonics; k++) {
            let real = 0, imag = 0;
            for (let t = 0; t < n; t++) {
                const angle = (2 * Math.PI * k * t) / n;
                real += data[t] * Math.cos(angle);
                imag += data[t] * Math.sin(angle);
            }
            result.push({ frequency: k, amplitude: Math.sqrt(real * real + imag * imag) / n, phase: Math.atan2(imag, real) });
        }
        
        return result;
    }
}

window.particleMath = ParticleMath;
window.aiMath = AIMath;