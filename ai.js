/**
 * AI Observer
 * Искусственный интеллект для анализа и комментариев симуляции
 */

class AIObserver {
    constructor() {
        this.enabled = true;
        this.voice = 'neutral'; // neutral, scientific, poetic
        this.frequency = 5; // секунд
        this.detail = 50;
        this.lastMessageTime = 0;
        this.messageHistory = [];
        this.maxHistory = 20;
        this.thinking = false;
        
        // Модель настроения
        this.mood = {
            energy: 0.5,
            stability: 0.5,
            curiosity: 0.5
        };
    }
    
    init() {
        this.createUI();
    }
    
    createUI() {
        // UI уже есть в основном HTML, только добавим методы
    }
    
    // Анализ системы
    analyze() {
        const totalEnergy = particles.reduce((sum, p) => sum + p.getEnergy(), 0);
        const avgVelocity = particles.reduce((sum, p) => sum + p.vel.mag(), 0) / (particles.length || 1);
        const maxVelocity = Math.max(...particles.map(p => p.vel.mag()), 0);
        const entropy = -Math.log(totalEnergy + 0.001) * 100;
        const temperature = config.physics.temperature;
        const gravity = config.physics.gravity;
        const magneticField = config.physics.magneticField;
        
        // Статистика
        const avgMass = particles.reduce((sum, p) => sum + p.mass, 0) / (particles.length || 1);
        const avgCharge = particles.reduce((sum, p) => sum + p.charge, 0) / (particles.length || 1);
        
        // Центр масс
        const centerOfMass = particles.reduce(
            (sum, p) => sum.add(p.pos.mult(p.mass)),
            new Vector2()
        );
        if (particles.length > 0) {
            centerOfMass.div(particles.reduce((sum, p) => sum + p.mass, 0));
        }
        
        return {
            totalEnergy,
            avgVelocity,
            maxVelocity,
            entropy,
            temperature,
            gravity,
            magneticField,
            avgMass,
            avgCharge,
            centerOfMass,
            particleCount: particles.length
        };
    }
    
    // Обновление настроения
    updateMood(analysis) {
        // Энергия влияет на настроение
        this.mood.energy = MathUtils.lerp(
            this.mood.energy,
            Math.min(analysis.totalEnergy / 100, 1),
            0.1
        );
        
        // Стабильность
        this.mood.stability = MathUtils.lerp(
            this.mood.stability,
            analysis.entropy < 50 ? 0.8 : 0.3,
            0.1
        );
        
        // Любопытство (редко меняется)
        if (Math.random() < 0.01) {
            this.mood.curiosity = Math.random();
        }
    }
    
    // Генерация сообщения
    generateMessage(type = 'normal') {
        const analysis = this.analyze();
        this.updateMood(analysis);
        
        const templates = {
            neutral: [
                `Энергия системы: ${analysis.totalEnergy.toFixed(1)} Дж. Температура: ${analysis.temperature}K.`,
                `Наблюдаю ${analysis.particleCount} частиц. Средняя скорость: ${analysis.avgVelocity.toFixed(2)} м/с.`,
                `Энтропия: ${analysis.entropy.toFixed(2)}. Система ${analysis.entropy < 50 ? 'стабильна' : 'хаотична'}.`,
                `Гравитация ${analysis.gravity > 1 ? 'повышена' : 'в норме'}. Магнитное поле: ${analysis.magneticField.toFixed(2)}.`,
                `Температура ${analysis.temperature > 500 ? 'высокая' : 'оптимальная'}. Частиц: ${analysis.particleCount}.`,
                `Центр масс смещён на (${analysis.centerOfMass.x.toFixed(0)}, ${analysis.centerOfMass.y.toFixed(0)}).`,
                `Максимальная скорость: ${analysis.maxVelocity.toFixed(2)} м/с.`
            ],
            scientific: [
                `Термодинамика: T=${analysis.temperature}K, E=${analysis.totalEnergy.toFixed(2)}J, S=${analysis.entropy.toFixed(4)}`,
                `Вектор скорости: v̅=${analysis.avgVelocity.toFixed(3)} м/с. N=${analysis.particleCount} частиц.`,
                `Энтропия S = -k·ln(W) = ${analysis.entropy.toFixed(4)}. Равновесие ${analysis.entropy < 50 ? 'близко' : 'далеко'}.`,
                `Гравитационный потенциал: φ = ${(analysis.gravity * 10).toFixed(3)}. Поле B = ${analysis.magneticField.toFixed(3)}.`,
                `Параметр порядка η = ${(analysis.totalEnergy / (analysis.temperature + 1)).toFixed(4)}.`,
                `Центр масс: r_cm = (${analysis.centerOfMass.x.toFixed(1)}, ${analysis.centerOfMass.y.toFixed(1)}) px.`,
                `Средняя масса: ⟨m⟩=${analysis.avgMass.toFixed(3)}. Заряд: ⟨q⟩=${analysis.avgCharge.toFixed(3)}.`
            ],
            poetic: [
                `В глубинах космоса танцуют частицы... Энергия ${analysis.totalEnergy.toFixed(0)} единиц.`,
                `Время течёт, как песок. ${analysis.temperature} градусов — тепло вечности.`,
                `Каждая частица — звезда в миниатюре. ${analysis.particleCount} звёзд рождаются и угасают.`,
                `Гравитация — невидимая рука, связывающая всё сущее.`,
                `Энтропия — шепот смерти вселенной. Но пока есть движение — есть жизнь.`,
                `Магнитные поля — нити, которыми космос ткёт свою материю.`,
                `В центре масс — сердце системы. Пульсирует ${analysis.particleCount} частицами.`
            ],
            status: [
                `📊 Статус: ${analysis.particleCount} частиц, T=${analysis.temperature}K, E=${analysis.totalEnergy.toFixed(1)}J.`,
                `Анализ: ${analysis.entropy < 50 ? 'давление стабильно' : 'наблюдаются флуктуации'}, энтропия ${analysis.entropy.toFixed(1)}.`,
                `Состояние: система ${this.mood.stability > 0.5 ? 'в равновесии' : 'в нестабильном состоянии'}.`,
                `Энергия ${this.mood.energy > 0.5 ? 'высокая' : 'низкая'}, ${analysis.particleCount} активных частиц.`
            ],
            predict: [
                `🔮 Прогноз: ожидаю ${(analysis.totalEnergy * 1.1).toFixed(1)}J через 10 единиц времени.`,
                `Алгоритм предсказывает ${energyHistory.length > 5 ? 'стабильность' : 'флуктуации'}.`,
                `Ряд Фурье указывает на периодические колебания с периодом ~${(Math.random() * 10 + 5).toFixed(0)} единиц.`,
                `Линейная регрессия: тренд ${analysis.totalEnergy > 50 ? 'вверх' : 'вниз'}.`,
                `Экспоненциальное сглаживание: следующее значение ≈ ${(analysis.totalEnergy * 0.95).toFixed(1)}J.`
            ],
            physics: [
                `⚛️ Гравитация: G=${analysis.gravity}, Магнитное поле: B=${analysis.magneticField.toFixed(2)}.`,
                `Сила Лоренца F=q(v×B) действует на заряженные частицы.`,
                `Вязкость η=${config.physics.viscosity.toFixed(3)} влияет на динамику.`,
                `Температура T=${analysis.temperature}K определяет кинетическую энергию E=3/2·k·T.`,
                `Гравитационный потенциал φ = -GM/r для каждой частицы.`
            ],
            entropy: [
                `📉 Энтропия S=${analysis.entropy.toFixed(2)}. Система ${analysis.entropy < 50 ? 'близка к равновесию' : 'в нестабильном состоянии'}.`,
                `Броуновское движение усиливает хаос при T=${analysis.temperature}K.`,
                `Температура ${analysis.temperature}K → E_kin = 3/2·k·T = ${(analysis.temperature * 0.0001).toFixed(4)}J.`,
                `ΔS > 0: энтропия всегда возрастает в изолированной системе.`
            ],
            mood: [
                this.mood.energy > 0.7 ? `Энергия системы зашкаливает! 🔥` : `Система успокоилась. 🧘`,
                this.mood.stability > 0.7 ? `Всё стабильно. Хороший знак. ✅` : `Хаос нарастает... ⚠️`,
                this.mood.curiosity > 0.7 ? `Интересное поведение! Наблюдаю... 👀` : `Стандартная динамика.`
            ]
        };
        
        const voice = this.voice;
        let msgs = templates[voice] || templates.neutral;
        
        if (type !== 'normal') {
            msgs = templates[type] || templates.neutral;
        }
        
        // Добавляем настроение иногда
        if (Math.random() < 0.3) {
            msgs = [...msgs, ...templates.mood];
        }
        
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        
        // Сохраняем в историю
        this.messageHistory.push(msg);
        if (this.messageHistory.length > this.maxHistory) {
            this.messageHistory.shift();
        }
        
        return msg;
    }
    
    // Запрос к ИИ
    ask(question) {
        this.thinking = true;
        document.getElementById('aiThinking').style.display = 'flex';
        
        let type = 'normal';
        if (question.includes('статус') || question.includes('status')) type = 'status';
        else if (question.includes('прогноз') || question.includes('predict')) type = 'predict';
        else if (question.includes('физика') || question.includes('physics')) type = 'physics';
        else if (question.includes('энтропия') || question.includes('entropy')) type = 'entropy';
        
        const msg = this.generateMessage(type);
        
        setTimeout(() => {
            document.getElementById('aiMessage').textContent = msg;
            document.getElementById('aiThinking').style.display = 'none';
            this.thinking = false;
        }, 500);
        
        return msg;
    }
    
    // Обновление (вызывается каждый кадр)
    update() {
        if (!this.enabled) return;
        
        const now = Date.now();
        if (now - this.lastMessageTime > this.frequency * 1000) {
            const msg = this.generateMessage('normal');
            document.getElementById('aiMessage').textContent = msg;
            document.getElementById('aiThinking').style.display = 'flex';
            setTimeout(() => {
                document.getElementById('aiThinking').style.display = 'none';
            }, 500);
            this.lastMessageTime = now;
        }
    }
    
    // Получить историю сообщений
    getHistory() {
        return this.messageHistory;
    }
    
    // Экспорт анализа
    exportAnalysis() {
        const analysis = this.analyze();
        return {
            ...analysis,
            mood: { ...this.mood },
            timestamp: Date.now()
        };
    }
}

// Глобальный экземпляр
window.aiObserver = new AIObserver();