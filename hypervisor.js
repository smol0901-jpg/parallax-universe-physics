/**
 * Hypervisor Module
 * Контролер выполнения условий и логики
 */

class Hypervisor {
    constructor() {
        this.conditions = [];
        this.actions = [];
        this.rules = [];
        this.enabled = true;
        this.tickCount = 0;
    }
    
    init() {
        this.registerDefaultRules();
    }
    
    registerDefaultRules() {
        // Правило: слишком высокая энергия -> снизить температуру
        this.addRule({
            name: 'energy_overload',
            condition: () => {
                const energy = particles.reduce((s, p) => s + p.getEnergy(), 0);
                return energy > 5000;
            },
            action: () => {
                config.physics.temperature = Math.max(0, config.physics.temperature - 10);
                showToast('🌡️ Снижение температуры из-за перегрева', 'warning');
            },
            cooldown: 3000
        });
        
        // Правило: слишком низкая энергия -> повысить температуру
        this.addRule({
            name: 'energy_low',
            condition: () => {
                const energy = particles.reduce((s, p) => s + p.getEnergy(), 0);
                return energy < 10 && config.physics.temperature > 10;
            },
            action: () => {
                config.physics.temperature = Math.min(1000, config.physics.temperature + 5);
            },
            cooldown: 5000
        });
        
        // Правило: частицы вышли за границы -> вернуть
        this.addRule({
            name: 'out_of_bounds',
            condition: () => {
                return particles.some(p => 
                    p.pos.x < -100 || p.pos.x > canvasWidth + 100 ||
                    p.pos.y < -100 || p.pos.y > canvasHeight + 100
                );
            },
            action: () => {
                particles.forEach(p => p.wrap());
            },
            cooldown: 1000
        });
        
        // Правило: слишком много частиц -> удалить старые
        this.addRule({
            name: 'too_many_particles',
            condition: () => particles.length > 500,
            action: () => {
                particles.sort((a, b) => a.life - b.life);
                particles = particles.slice(0, 400);
            },
            cooldown: 2000
        });
        
        // Правило: магнитное поле влияет на заряженные частицы
        this.addRule({
            name: 'magnetic_interaction',
            condition: () => config.physics.magneticField > 0.5,
            action: () => {
                const chargedParticles = particles.filter(p => Math.abs(p.charge) > 0);
                if (chargedParticles.length > 10) {
                    showToast('🧲 Сильное магнитное взаимодействие', 'info');
                }
            },
            cooldown: 10000
        });
    }
    
    addRule(rule) {
        this.rules.push({
            ...rule,
            lastTrigger: 0
        });
    }
    
    checkConditions() {
        if (!this.enabled) return;
        
        const now = Date.now();
        this.tickCount++;
        
        this.rules.forEach(rule => {
            if (now - rule.lastTrigger < (rule.cooldown || 1000)) return;
            
            try {
                if (rule.condition()) {
                    rule.action();
                    rule.lastTrigger = now;
                }
            } catch (e) {
                console.error('Rule error:', e);
            }
        });
    }
    
    update() {
        this.checkConditions();
    }
}

window.hypervisor = new Hypervisor();