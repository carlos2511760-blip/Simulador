/* ========================================
   MODULE 4: Thermodynamics
   Gas behavior, thermal laws, heat transfer
======================================== */

const ThermodynamicsModule = {
    name: 'Termodinâmica',
    key: 'thermo',
    renderer: null,
    scenario: 'gas',
    heatSource: 'none', 
    particles: [],
    params: { temperature: 300, pressure: 1, volume: 0.8, numParticles: 50, showVelocity: true },
    time: 0,
    containerX: 0, containerY: 0, containerWidth: 0, containerHeight: 0, pistonY: 0,

    init(renderer) {
        this.renderer = renderer;
        this.time = 0;
        this.loadScenario('gas');
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Metáfora Atômica',
                    type: 'scenarios',
                    items: [
                        { label: '🔥 Cilindro Térmico', color: '#ff922b', active: true, onSelect: () => self.loadScenario('gas') },
                        { label: '🌡️ Troca Térmica', color: '#ff6b6b', onSelect: () => self.loadScenario('conduction') },
                    ]
                },
                {
                    title: 'Controles',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'th-temp', label: 'T (Kelvin)', min: 50, max: 2000, step: 10, value: self.params.temperature, unit: '', onChange: v => { self.params.temperature = v; } },
                        { kind: 'slider', id: 'th-vol', label: 'Volume Pistão', min: 0.2, max: 1.0, step: 0.05, value: self.params.volume, unit: '', onChange: v => { self.params.volume = v; } },
                        { kind: 'button', id: 'th-fire', label: '🔥 Aquecer!', onClick: () => { self.heatSource = 'fire'; } },
                        { kind: 'button', id: 'th-ice', label: '🧊 Resfriar!', onClick: () => { self.heatSource = 'ice'; } },
                        { kind: 'button', id: 'th-off', label: '⏸ Desligar Fonte', onClick: () => { self.heatSource = 'none'; } }
                    ]
                },
                {
                    title: 'Sensores',
                    type: 'info',
                    id: 'thermo-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.time = 0;
        this.particles = [];
        const w = this.renderer.width, h = this.renderer.height;
        this.containerX = w * 0.15; this.containerY = h * 0.15; this.containerWidth = w * 0.55; this.containerHeight = h * 0.7;
        this.pistonY = this.containerY + this.containerHeight * (1 - this.params.volume);

        for (let i = 0; i < this.params.numParticles; i++) {
            const spd = Math.sqrt(this.params.temperature)*2;
            this.particles.push({ x: this.containerX + Math.random()*this.containerWidth, y: this.pistonY + Math.random()*(this.containerHeight), vx: (Math.random()-0.5)*spd, vy: (Math.random()-0.5)*spd, radius: 4 });
        }
        UI.setHint('Controle a temperatura e veja o gás reagir ao volume');
    },

    update(dt) {
        this.time += dt;
        const targetP = this.containerY + this.containerHeight * (1 - this.params.volume);
        this.pistonY = PhysicsUtils.lerp(this.pistonY, targetP, 0.05);

        if (this.heatSource !== 'none') {
            this.params.temperature = PhysicsUtils.clamp(this.params.temperature + (this.heatSource === 'fire' ? 4 : -4), 50, 3000);
            const input = document.getElementById('ctrl-th-temp'); if (input) input.value = this.params.temperature;
            const val = document.getElementById('val-th-temp'); if (val) val.textContent = Math.round(this.params.temperature);
        }

        const cy = this.pistonY, cw = this.containerWidth, ch = (this.containerY + this.containerHeight) - cy, cx = this.containerX, avgSpd = Math.sqrt(this.params.temperature)*2.5;

        for (const p of this.particles) {
            const curSpd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
            if (curSpd > 0) { p.vx *= PhysicsUtils.lerp(1, avgSpd/curSpd, 0.1); p.vy *= PhysicsUtils.lerp(1, avgSpd/curSpd, 0.1); }
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < cx) { p.x = cx; p.vx = Math.abs(p.vx); }
            if (p.x > cx + cw) { p.x = cx + cw; p.vx = -Math.abs(p.vx); }
            if (p.y < cy) { p.y = cy; p.vy = Math.abs(p.vy); }
            if (p.y > cy + ch) { p.y = cy + ch; p.vy = -Math.abs(p.vy); }
        }
    },

    render(renderer) {
        renderer.clear('#08080a'); renderer.drawGrid(60);
        const ctx = renderer.ctx, w = renderer.width, h = renderer.height, cx = this.containerX, cw = this.containerWidth, cy = this.containerY, ch = this.containerHeight;

        ctx.strokeStyle = '#ff922b'; ctx.lineWidth = 4; ctx.strokeRect(cx, cy, cw, ch);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(cx, this.pistonY - 6, cw, 12); // Piston handle
        ctx.fillRect(cx + cw/2 - 4, cy - 30, 8, this.pistonY - cy + 30);

        for (const p of this.particles) {
            const s = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
            const hue = PhysicsUtils.clamp(240 - s/2, 0, 240);
            renderer.drawCircle(p.x, p.y, p.radius, `hsla(${hue}, 80%, 60%, 0.7)`);
        }

        if (this.heatSource !== 'none') {
            const botY = cy + ch, emoji = this.heatSource === 'fire' ? '🔥' : '🧊', count = 7;
            for(let i=0; i<count; i++) {
                const ex = (cx + 50) + (cw-100)/count*i + Math.sin(this.time*5+i)*20;
                renderer.drawText(emoji, ex, botY + 40, { font: '32px Arial', align: 'center' });
            }
        }

        const P = (this.params.numParticles * this.params.temperature) / (this.params.volume * 1000);
        if (!this.history) this.history = [];
        this.history.push({ P, T: this.params.temperature });
        if (this.history.length > 150) this.history.shift();

        if (this.history.length > 0) {
            const tempSeries = { data: this.history.map(h => h.T), color: '#ff6b6b', label: 'T (K)', maxPoints: 150, fill: false };
            const presSeries = { data: this.history.map(h => h.P), color: '#339af0', label: 'P (atm)', maxPoints: 150, fill: true };

            renderer.drawChart('Estado Termodinâmico', [presSeries], w - 370, 20, 350, 160);
            
            renderer.drawGauge('Temperatura', this.params.temperature, 0, 3000, 'K', w - 195, 270, 60, '#ff922b');
            renderer.drawGauge('Pressão', P, 0, Math.max(10, Math.max(...this.history.map(h=>h.P))), 'atm', w - 200, 420, 60, '#339af0');
        }

        UI.updateInfo('thermo-info', `Pressão: ${P.toFixed(2)} atm<br>T: ${Math.round(this.params.temperature)} K<br>V: ${(this.params.volume * 1000).toFixed(0)} L`);
        UI.setInfoPills([`🔥 Termo`, `P = ${P.toFixed(1)} atm`, `T = ${Math.round(this.params.temperature)} K`]);
    },
    destroy() { this.particles = []; this.history = []; }
};
