/**
 * Evolution Mode
 * Эволюция частиц с генетическим алгоритмом
 */

class Evolution {
    constructor() {
        this.enabled = false;
        this.generation = 0;
        this.populationSize = 100;
        this.mutationRate = 0.1;
        this.eliteCount = 10;
        this.bestFitness = 0;
        this.generationData = [];
    }
    
    init() {
        this.createUI();
    }
    
    createUI() {
        const panel = document.createElement('div');
        panel.className = 'evolution-panel';
        panel.innerHTML = `
            <div class="evo-header">🧬 Эволюция</div>
            <div class="evo-stats">
                <div class="evo-stat">
                    <span class="evo-label">Поколение</span>
                    <span class="evo-value" id="genNum">0</span>
                </div>
                <div class="evo-stat">
                    <span class="evo-label">Лучший фитнес</span>
                    <span class="evo-value" id="bestFit">0</span>
                </div>
                <div class="evo-stat">
                    <span class="evo-label">Средний фитнес</span>
                    <span class="evo-value" id="avgFit">0</span>
                </div>
            </div>
            <div class="evo-controls">
                <button class="evo-btn" id="evoToggle">▶️ Старт</button>
                <button class="evo-btn" onclick="evolution.nextGen()">⏭️ Следующее</button>
                <button class="evo-btn" onclick="evolution.reset()">🔄 Сброс</button>
            </div>
            <div class="evo-graph">
                <canvas id="evoCanvas" width="160" height="80"></canvas>
            </div>
            <div class="evo-settings">
                <div class="evo-setting">
                    <label>Размер популяции</label>
                    <input type="range" id="popSize" min="20" max="200" value="100">
                </div>
                <div class="evo-setting">
                    <label>Мутация</label>
                    <input type="range" id="mutRate" min="0" max="50" value="10">
                </div>
            </div>
            <div class="evo-goals">
                <div class="evo-goal-title">🎯 Цель:</div>
                <select id="evoGoal">
                    <option value="energy">Макс. энергия</option>
                    <option value="speed">Макс. скорость</option>
                    <option value="cluster">Кластеризация</option>
                    <option value="center">Централизация</option>
                </select>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .evolution-panel {
                position: fixed;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                background: var(--panel-bg);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 16px;
                z-index: 200;
                min-width: 180px;
            }
            .evo-header {
                font-weight: 700;
                color: var(--success);
                margin-bottom: 12px;
                text-align: center;
            }
            .evo-stats {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }
            .evo-stat {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
            }
            .evo-label { color: var(--text-secondary); }
            .evo-value { color: var(--accent); font-family: monospace; }
            .evo-controls {
                display: flex;
                gap: 6px;
                margin-bottom: 12px;
            }
            .evo-btn {
                flex: 1;
                padding: 8px 4px;
                border-radius: 6px;
                border: 1px solid var(--border);
                background: rgba(255,255,255,0.05);
                color: var(--text);
                cursor: pointer;
                font-size: 10px;
            }
            .evo-btn:hover { background: var(--success); border-color: var(--success); }
            .evo-graph canvas {
                width: 100%;
                border-radius: 8px;
                background: rgba(0,0,0,0.3);
            }
            .evo-settings {
                margin-top: 12px;
            }
            .evo-setting {
                margin-bottom: 8px;
            }
            .evo-setting label {
                font-size: 10px;
                color: var(--text-secondary);
                display: block;
                margin-bottom: 4px;
            }
            .evo-setting input {
                width: 100%;
            }
            .evo-goals {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--border);
            }
            .evo-goal-title {
                font-size: 11px;
                color: var(--text-secondary);
                margin-bottom: 6px;
            }
            .evo-goals select {
                width: 100%;
                padding: 6px;
                background: rgba(255,255,255,0.1);
                border: 1px solid var(--border);
                border-radius: 6px;
                color: var(--text);
                font-size: 11px;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(panel);
        
        document.getElementById('evoToggle').addEventListener('click', () => {
            this.enabled = !this.enabled;
            document.getElementById('evoToggle').textContent = this.enabled ? '⏸ Пауза' : '▶️ Старт';
        });
        
        document.getElementById('popSize').addEventListener('change', (e) => {
            this.populationSize = parseInt(e.target.value);
        });
        
        document.getElementById('mutRate').addEventListener('change', (e) => {
            this.mutationRate = parseInt(e.target.value) / 100;
        });
    }
    
    calculateFitness(particle, goal) {
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        
        switch (goal) {
            case 'energy':
                return particle.getEnergy();
                
            case 'speed':
                return particle.vel.mag();
                
            case 'cluster':
                let minDist = Infinity;
                particles.forEach(other => {
                    if (other === particle) return;
                    const d = particle.pos.dist(other.pos);
                    if (d < minDist) minDist = d;
                });
                return 100 - minDist;
                
            case 'center':
                return 1000 - particle.pos.dist(new Vector2(cx, cy));
                
            default:
                return particle.getEnergy();
        }
    }
    
    evolve() {
        if (!this.enabled) return;
        
        const goal = document.getElementById('evoGoal')?.value || 'energy';
        
        // Оцениваем фитнес
        particles.forEach(p => {
            p.fitness = this.calculateFitness(p, goal);
        });
        
        // Сортируем
        particles.sort((a, b) => b.fitness - a.fitness);
        
        // Лучшие
        const best = particles[0];
        const avg = particles.reduce((sum, p) => sum + p.fitness, 0) / particles.length;
        
        this.bestFitness = Math.max(this.bestFitness, best.fitness);
        this.generation++;
        
        // Сохраняем данные
        this.generationData.push({
            gen: this.generation,
            best: best.fitness,
            avg: avg
        });
        if (this.generationData.length > 50) this.generationData.shift();
        
        // Обновляем UI
        document.getElementById('genNum').textContent = this.generation;
        document.getElementById('bestFit').textContent = best.fitness.toFixed(1);
        document.getElementById('avgFit').textContent = avg.toFixed(1);
        
        this.drawGraph();
    }
    
    nextGen() {
        const goal = document.getElementById('evoGoal')?.value || 'energy';
        
        // Элита
        const elite = particles.slice(0, this.eliteCount);
        
        // Новые частицы
        const newParticles = [];
        
        // Добавляем элиту
        elite.forEach(p => {
            newParticles.push(this.cloneParticle(p));
        });
        
        // Создаём потомков
        while (newParticles.length < this.populationSize) {
            const parent1 = particles[Math.floor(Math.random() * this.eliteCount)];
            const parent2 = particles[Math.floor(Math.random() * this.eliteCount)];
            const child = this.crossover(parent1, parent2);
            this.mutate(child);
            newParticles.push(child);
        }
        
        particles = newParticles;
        this.generation++;
        
        document.getElementById('genNum').textContent = this.generation;
    }
    
    cloneParticle(p) {
        const clone = new Particle(p.pos.x, p.pos.y);
        clone.vel = p.vel.clone();
        clone.mass = p.mass;
        clone.charge = p.charge;
        clone.genes = { ...p.genes };
        return clone;
    }
    
    crossover(p1, p2) {
        const child = new Particle(
            (p1.pos.x + p2.pos.x) / 2,
            (p1.pos.y + p2.pos.y) / 2
        );
        child.vel = new Vector2(
            (p1.vel.x + p2.vel.x) / 2,
            (p1.vel.y + p2.vel.y) / 2
        );
        child.mass = (p1.mass + p2.mass) / 2;
        child.charge = Math.random() > 0.5 ? p1.charge : p2.charge;
        
        // Гены
        child.genes = {
            speed: Math.random() > 0.5 ? p1.genes.speed : p2.genes.speed,
            attraction: Math.random() > 0.5 ? p1.genes.attraction : p2.genes.attraction,
            repulsion: Math.random() > 0.5 ? p1.genes.repulsion : p2.genes.repulsion,
            cohesion: Math.random() > 0.5 ? p1.genes.cohesion : p2.genes.cohesion
        };
        
        return child;
    }
    
    mutate(p) {
        if (Math.random() < this.mutationRate) {
            p.genes.speed += (Math.random() - 0.5) * 0.2;
            p.genes.attraction += (Math.random() - 0.5) * 0.2;
            p.genes.repulsion += (Math.random() - 0.5) * 0.2;
            p.genes.cohesion += (Math.random() - 0.5) * 0.2;
        }
        
        // Мутация скорости
        if (Math.random() < this.mutationRate) {
            p.vel.x += (Math.random() - 0.5) * 2;
            p.vel.y += (Math.random() - 0.5) * 2;
        }
    }
    
    reset() {
        this.generation = 0;
        this.bestFitness = 0;
        this.generationData = [];
        initParticles();
        showToast('🔄 Эволюция сброшена', 'success');
    }
    
    drawGraph() {
        const canvas = document.getElementById('evoCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.generationData.length < 2) return;
        
        const maxFit = Math.max(...this.generationData.map(d => d.best)) || 1;
        
        // Линия лучшего
        ctx.beginPath();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        this.generationData.forEach((d, i) => {
            const x = (i / (this.generationData.length - 1)) * canvas.width;
            const y = canvas.height - (d.best / maxFit) * canvas.height * 0.8 - 5;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Линия среднего
        ctx.beginPath();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 1;
        this.generationData.forEach((d, i) => {
            const x = (i / (this.generationData.length - 1)) * canvas.width;
            const y = canvas.height - (d.avg / maxFit) * canvas.height * 0.8 - 5;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
}

const evolution = new Evolution();