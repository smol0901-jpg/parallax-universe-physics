/**
 * Sandbox Mode
 * Песочница с редактором частиц и экспериментами
 */

class Sandbox {
    constructor() {
        this.enabled = false;
        this.selectedTool = 'spawn';
        this.brushSize = 20;
        this.spawnRate = 1;
        this.customParticles = [];
        this.experiments = [];
    }
    
    init() {
        this.createUI();
    }
    
    createUI() {
        const panel = document.createElement('div');
        panel.className = 'sandbox-panel';
        panel.innerHTML = `
            <div class="sandbox-header">🔬 Песочница</div>
            <div class="sandbox-tools">
                <div class="sandbox-tool active" data-tool="spawn" title="Создать частицы">
                    <span>✨</span>
                </div>
                <div class="sandbox-tool" data-tool="attract" title="Притяжение">
                    <span>🧲</span>
                </div>
                <div class="sandbox-tool" data-tool="repel" title="Отталкивание">
                    <span>💥</span>
                </div>
                <div class="sandbox-tool" data-tool="freeze" title="Заморозить">
                    <span>❄️</span>
                </div>
                <div class="sandbox-tool" data-tool="heat" title="Нагреть">
                    <span>🔥</span>
                </div>
                <div class="sandbox-tool" data-tool="gravity" title="Изменить гравитацию">
                    <span>⬇️</span>
                </div>
                <div class="sandbox-tool" data-tool="delete" title="Удалить">
                    <span>🗑️</span>
                </div>
            </div>
            <div class="sandbox-settings">
                <div class="sandbox-setting">
                    <label>Размер кисти</label>
                    <input type="range" id="brushSize" min="5" max="100" value="20">
                </div>
                <div class="sandbox-setting">
                    <label>Скорость создания</label>
                    <input type="range" id="spawnRate" min="1" max="20" value="1">
                </div>
            </div>
            <div class="sandbox-experiments">
                <div class="exp-title">🧪 Эксперименты</div>
                <button class="exp-btn" onclick="sandbox.runExperiment('bigbang')">💥 Большой взрыв</button>
                <button class="exp-btn" onclick="sandbox.runExperiment('collision')">☄️ Столкновение</button>
                <button class="exp-btn" onclick="sandbox.runExperiment('orbit')">🛸 Орбита</button>
                <button class="exp-btn" onclick="sandbox.runExperiment('vortex')">🌀 Вихрь</button>
                <button class="exp-btn" onclick="sandbox.runExperiment('rain')">🌧️ Дождь</button>
                <button class="exp-btn" onclick="sandbox.runExperiment('antimatter')">⚛️ Антивещество</button>
            </div>
            <div class="sandbox-stats">
                <div class="sandbox-stat">
                    <span>Создано:</span>
                    <span id="spawnedCount">0</span>
                </div>
                <div class="sandbox-stat">
                    <span>Удалено:</span>
                    <span id="deletedCount">0</span>
                </div>
            </div>
            <button class="sandbox-toggle" id="sandboxToggle">🔬 Песочница</button>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .sandbox-panel {
                position: fixed;
                left: 20px;
                bottom: 100px;
                background: var(--panel-bg);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 16px;
                z-index: 200;
                min-width: 160px;
                display: none;
            }
            .sandbox-panel.open { display: block; }
            .sandbox-header {
                font-weight: 700;
                color: var(--secondary);
                margin-bottom: 12px;
                text-align: center;
            }
            .sandbox-tools {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
                margin-bottom: 12px;
            }
            .sandbox-tool {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                border: 1px solid var(--border);
                background: rgba(255,255,255,0.05);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s;
            }
            .sandbox-tool:hover { background: rgba(255,255,255,0.1); }
            .sandbox-tool.active {
                background: var(--secondary);
                border-color: var(--secondary);
            }
            .sandbox-settings {
                margin-bottom: 12px;
            }
            .sandbox-setting {
                margin-bottom: 8px;
            }
            .sandbox-setting label {
                font-size: 10px;
                color: var(--text-secondary);
                display: block;
                margin-bottom: 4px;
            }
            .sandbox-setting input { width: 100%; }
            .sandbox-experiments {
                padding-top: 12px;
                border-top: 1px solid var(--border);
            }
            .exp-title {
                font-size: 11px;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }
            .exp-btn {
                width: 100%;
                padding: 8px;
                margin-bottom: 6px;
                border-radius: 6px;
                border: 1px solid var(--border);
                background: rgba(255,255,255,0.05);
                color: var(--text);
                cursor: pointer;
                font-size: 11px;
                text-align: left;
            }
            .exp-btn:hover { background: var(--primary); border-color: var(--primary); }
            .sandbox-stats {
                display: flex;
                justify-content: space-between;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--border);
                font-size: 10px;
            }
            .sandbox-stat span:last-child {
                color: var(--accent);
                font-family: monospace;
            }
            .sandbox-toggle {
                position: fixed;
                left: 20px;
                bottom: 100px;
                padding: 12px 20px;
                background: var(--panel-bg);
                border: 1px solid var(--border);
                border-radius: 30px;
                color: var(--text);
                cursor: pointer;
                z-index: 150;
                font-size: 13px;
            }
            .sandbox-toggle:hover { background: var(--secondary); border-color: var(--secondary); }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(panel);
        document.body.appendChild(panel.cloneNode(true));
        
        // Event listeners
        document.getElementById('sandboxToggle').addEventListener('click', () => {
            this.enabled = !this.enabled;
            document.querySelector('.sandbox-panel').classList.toggle('open', this.enabled);
        });
        
        document.querySelectorAll('.sandbox-tool').forEach(tool => {
            tool.addEventListener('click', () => {
                document.querySelectorAll('.sandbox-tool').forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                this.selectedTool = tool.dataset.tool;
            });
        });
        
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
        });
        
        document.getElementById('spawnRate').addEventListener('input', (e) => {
            this.spawnRate = parseInt(e.target.value);
        });
    }
    
    // Применение инструмента
    applyTool(x, y, particles) {
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        
        switch (this.selectedTool) {
            case 'spawn':
                for (let i = 0; i < this.spawnRate; i++) {
                    const p = new Particle(
                        x + (Math.random() - 0.5) * this.brushSize,
                        y + (Math.random() - 0.5) * this.brushSize
                    );
                    p.vel = Vector2.random().mult(Math.random() * 3);
                    particles.push(p);
                }
                this.customParticles += this.spawnRate;
                document.getElementById('spawnedCount').textContent = this.customParticles;
                break;
                
            case 'attract':
                particles.forEach(p => {
                    const d = p.pos.dist(new Vector2(x, y));
                    if (d < this.brushSize * 2 && d > 1) {
                        const force = new Vector2(x - p.pos.x, y - p.pos.y).normalize().mult(2);
                        p.vel.add(force);
                    }
                });
                break;
                
            case 'repel':
                particles.forEach(p => {
                    const d = p.pos.dist(new Vector2(x, y));
                    if (d < this.brushSize * 2 && d > 1) {
                        const force = new Vector2(p.pos.x - x, p.pos.y - y).normalize().mult(2);
                        p.vel.add(force);
                    }
                });
                break;
                
            case 'freeze':
                particles.forEach(p => {
                    const d = p.pos.dist(new Vector2(x, y));
                    if (d < this.brushSize) {
                        p.vel = p.vel.mult(0.5);
                    }
                });
                break;
                
            case 'heat':
                particles.forEach(p => {
                    const d = p.pos.dist(new Vector2(x, y));
                    if (d < this.brushSize) {
                        p.vel.add(Vector2.random().mult(2));
                    }
                });
                break;
                
            case 'gravity':
                particles.forEach(p => {
                    const d = p.pos.dist(new Vector2(x, y));
                    if (d < this.brushSize * 2) {
                        p.vel.y += 0.5;
                    }
                });
                break;
                
            case 'delete':
                const before = particles.length;
                particles = particles.filter(p => {
                    const d = p.pos.dist(new Vector2(x, y));
                    return d > this.brushSize;
                });
                const deleted = before - particles.length;
                this.customParticles -= deleted;
                document.getElementById('deletedCount').textContent = deleted;
                break;
        }
        
        return particles;
    }
    
    // Запуск экспериментов
    runExperiment(name) {
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        
        switch (name) {
            case 'bigbang':
                // Взрыв из центра
                particles = [];
                for (let i = 0; i < 200; i++) {
                    const p = new Particle(cx, cy);
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 10 + 5;
                    p.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
                    particles.push(p);
                }
                showToast('💥 Большой взрыв!', 'success');
                break;
                
            case 'collision':
                // Два потока навстречу
                particles = [];
                for (let i = 0; i < 100; i++) {
                    const p = new Particle(Math.random() * canvasWidth, cy - 100);
                    p.vel = new Vector2((Math.random() - 0.5) * 2, 3);
                    particles.push(p);
                }
                for (let i = 0; i < 100; i++) {
                    const p = new Particle(Math.random() * canvasWidth, cy + 100);
                    p.vel = new Vector2((Math.random() - 0.5) * 2, -3);
                    particles.push(p);
                }
                showToast('☄️ Готово к столкновению!', 'success');
                break;
                
            case 'orbit':
                // Орбитальное движение
                particles = [];
                for (let i = 0; i < 50; i++) {
                    const angle = (i / 50) * Math.PI * 2;
                    const r = 150;
                    const p = new Particle(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
                    p.vel = new Vector2(-Math.sin(angle) * 2, Math.cos(angle) * 2);
                    particles.push(p);
                }
                showToast('🛸 Орбита создана!', 'success');
                break;
                
            case 'vortex':
                // Вихрь
                particles = [];
                for (let i = 0; i < 150; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * 200;
                    const p = new Particle(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
                    p.vel = new Vector2(-Math.sin(angle) * 3, Math.cos(angle) * 3);
                    particles.push(p);
                }
                showToast('🌀 Вихрь активирован!', 'success');
                break;
                
            case 'rain':
                // Дождь сверху
                particles = [];
                for (let i = 0; i < 100; i++) {
                    const p = new Particle(Math.random() * canvasWidth, -10);
                    p.vel = new Vector2((Math.random() - 0.5), 5 + Math.random() * 3);
                    particles.push(p);
                }
                showToast('🌧️ Начинается дождь!', 'success');
                break;
                
            case 'antimatter':
                // Антивещество (отталкивание)
                particles = [];
                for (let i = 0; i < 100; i++) {
                    const p = new Particle(
                        cx + (Math.random() - 0.5) * 300,
                        cy + (Math.random() - 0.5) * 300
                    );
                    p.charge = -p.charge; // Инвертируем заряд
                    p.vel = Vector2.random().mult(2);
                    particles.push(p);
                }
                showToast('⚛️ Антивещество создано!', 'success');
                break;
        }
    }
}

const sandbox = new Sandbox();