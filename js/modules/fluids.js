/* ========================================
   MODULE 7: Fluids
   Pressure, Buoyancy, Flow
======================================== */

const FluidsModule = {
    name: 'Fluidos',
    key: 'fluids',
    renderer: null,
    scenario: 'buoyancy',
    particles: [],
    objects: [],
    splashes: [],
    params: {
        fluidType: 'Água 💧',
        fluidDensity: 1000,
        gravity: 9.8,
        viscosity: 0.02,
        showPressure: true,
        showVelocity: true,
    },
    time: 0,
    waterLevel: 0,

    init(renderer) {
        this.renderer = renderer;
        this.time = 0;
        this.loadScenario('buoyancy');
    },

    changeFluid(type) {
        this.params.fluidType = type;
        const presets = {
            'Água 💧': { d: 1000, v: 0.02 },
            'Óleo 🛢️': { d: 850, v: 0.08 },
            'Mel 🍯': { d: 1420, v: 0.45 },
            'Mercúrio 🧪': { d: 13600, v: 0.01 },
            'Mar Morto 🌊': { d: 1240, v: 0.03 }
        };
        const p = presets[type] || presets['Água 💧'];
        this.params.fluidDensity = p.d;
        this.params.viscosity = p.v;
        
        const slideVal = document.getElementById('val-fl-density');
        const slideInput = document.getElementById('ctrl-fl-density');
        if (slideInput && slideVal) { slideInput.value = p.d; slideVal.textContent = p.d; }
        UI.setHint(`Densidade automática: ${p.d} kg/m³ aplicada ao tanque.`);
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Cenário',
                    type: 'scenarios',
                    items: [
                        { label: 'Empuxo e Barcos', color: '#339af0', active: true, onSelect: () => self.loadScenario('buoyancy') },
                        { label: 'Vasos Comunicantes', color: '#22b8cf', onSelect: () => self.loadScenario('communicating') },
                        { label: 'Fluxo Laminar', color: '#51cf66', onSelect: () => self.loadScenario('laminar') },
                        { label: 'Pressão Submarina', color: '#845ef7', onSelect: () => self.loadScenario('pressure') },
                    ]
                },
                {
                    title: 'Parâmetros (SI)',
                    type: 'controls',
                    items: [
                        { kind: 'select', id: 'fl-type', label: 'Líquido', options: ['Água 💧', 'Óleo 🛢️', 'Mel 🍯', 'Mercúrio 🧪', 'Mar Morto 🌊'], value: self.params.fluidType, onChange: v => { self.changeFluid(v); } },
                        { kind: 'slider', id: 'fl-density', label: 'Densidade (kg/m³)', min: 100, max: 15000, step: 10, value: self.params.fluidDensity, unit: '', onChange: v => { self.params.fluidDensity = v; } },
                        { kind: 'slider', id: 'fl-gravity', label: 'Gravidade', min: 1, max: 25, step: 0.5, value: self.params.gravity, unit: ' m/s²', onChange: v => { self.params.gravity = v; } },
                        { kind: 'button', id: 'fl-add', label: '🎈 Soltar Objeto!', onClick: () => self.addObject() },
                        { kind: 'button', id: 'fl-reset', label: '↺ Limpar Tanque', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Info do Mundo',
                    type: 'info',
                    id: 'fluids-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.time = 0;
        this.particles = [];
        this.objects = [];
        this.splashes = [];
        const w = this.renderer.width, h = this.renderer.height;
        this.waterLevel = h * 0.4;

        if (name === 'buoyancy') {
            this.objects = [
                { x: w * 0.2, y: h * 0.1, vx: 0, vy: 0, width: 60, height: 60, density: 500, emoji: '🪵', label: 'Madeira' },
                { x: w * 0.5, y: h * 0.1, vx: 0, vy: 0, width: 45, height: 45, density: 7800, emoji: '⚓', label: 'Âncora' },
                { x: w * 0.8, y: h * 0.1, vx: 0, vy: 0, width: 55, height: 55, density: 920, emoji: '🧊', label: 'Gelo' },
            ];
            for (let i = 0; i < 100; i++) this.particles.push({ x: Math.random() * w, y: this.waterLevel + Math.random() * (h - this.waterLevel), vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, radius: 2.5 });
            UI.setHint('Arraste os objetos para mergulhá-los!');
        }

        if (name === 'pressure') {
            this.waterLevel = h * 0.2;
            UI.setHint('Observe a barra de pressão aumentando com a profundidade');
        }

        if (name === 'communicating' || name === 'laminar') {
             for (let i = 0; i < 150; i++) this.particles.push({ x: Math.random() * w, y: h * 0.5, vx: 40, vy: 0, radius: 2.5 });
        }
    },

    addObject() {
        const types = [{ d: 500, e: '🪵', l: 'Madeira' }, { d: 920, e: '🧊', l: 'Gelo' }, { d: 7800, e: '⚓', l: 'Ferro' }, { d: 200, e: '🏐', l: 'Vôlei' }];
        const c = types[Math.floor(Math.random()*types.length)];
        this.objects.push({ x: this.renderer.width * 0.5 + Math.random()*200-100, y: 50, vx: 0, vy: 50, width: 50, height: 50, density: c.d, emoji: c.e, label: c.l });
    },

    update(dt) {
        this.time += dt;
        const g = this.params.gravity, fluidD = this.params.fluidDensity, visc = this.params.viscosity, h = this.renderer.height;

        for (const obj of this.objects) {
            const wasAbove = obj.y + obj.height <= this.waterLevel;
            obj.vy += g * 10 * dt;
            
            const submergedH = Math.max(0, Math.min(obj.y + obj.height, h) - Math.max(obj.y, this.waterLevel));
            const subFrac = submergedH / obj.height;
            if (subFrac > 0) {
                const bAcc = -g * 10 * subFrac * (fluidD / obj.density);
                const drag = -visc * obj.vy * 40;
                obj.vy += (bAcc + drag) * dt;
                obj.vx *= (1 - visc * 5 * dt);
                obj.vy *= (1 - visc * 3 * dt);
                if (wasAbove && obj.vy > 30) {
                   for(let i=0; i<12; i++) this.splashes.push({ x: obj.x + Math.random()*obj.width, y: this.waterLevel, vx: (Math.random()-0.5)*obj.vy*0.4, vy: -Math.random()*obj.vy*0.3, life: 1.0 });
                }
            }
            obj.x += obj.vx * dt; obj.y += obj.vy * dt;
            if (obj.y + obj.height > h - 10) { obj.y = h - 10 - obj.height; obj.vy *= -0.2; }
            if (obj.x < 10 || obj.x + obj.width > this.renderer.width - 10) obj.vx *= -1;
        }

        for (const p of this.particles) {
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < 0) p.x = this.renderer.width; if (p.x > this.renderer.width) p.x = 0;
            if (p.y < this.waterLevel) { p.y = this.waterLevel; p.vy = Math.abs(p.vy); }
            if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy); }
        }

        for (let i = this.splashes.length - 1; i >= 0; i--) {
            const s = this.splashes[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += g * 10 * dt; s.life -= dt * 2;
            if (s.life <= 0) this.splashes.splice(i, 1);
        }
    },

    render(renderer) {
        renderer.clear('#060810');
        const ctx = renderer.ctx, w = renderer.width, h = renderer.height;
        let fCol = this.params.fluidType.includes('Mel') ? 'rgba(232,89,12,0.5)' : (this.params.fluidType.includes('Óleo') ? 'rgba(255,212,59,0.4)' : 'rgba(51,154,240,0.4)');
        
        ctx.fillStyle = fCol; ctx.fillRect(0, this.waterLevel, w, h - this.waterLevel);
        ctx.beginPath(); ctx.strokeStyle = fCol; ctx.lineWidth = 3;
        for (let x = 0; x < w; x += 5) ctx.lineTo(x, this.waterLevel + Math.sin(x*0.03 + this.time*3)*4);
        ctx.stroke();

        for (const p of this.particles) renderer.drawCircle(p.x, p.y, p.radius, 'rgba(255,255,255,0.2)');

        for (const obj of this.objects) {
            renderer.drawText(obj.emoji, obj.x + obj.width/2, obj.y + obj.height/2 + 5, { font: `${obj.width*0.8}px Arial`, align: 'center', baseline: 'middle' });
            renderer.drawText(`${obj.label} (ρ=${obj.density})`, obj.x + obj.width/2, obj.y - 10, { font: '10px Inter', align: 'center', color: '#fff' });
        }

        for (const s of this.splashes) renderer.drawCircle(s.x, s.y, 2, `rgba(255,255,255,${s.life})`);

        if (this.scenario === 'pressure' && this.params.showPressure) {
            for (let d = 0; d < 5; d++) {
                const y = this.waterLevel + (h - this.waterLevel) * (d + 1) / 6;
                const P = this.params.fluidDensity * this.params.gravity * (y - this.waterLevel) * 0.01;
                renderer.drawText(`P = ${P.toFixed(1)} kPa`, 60, y, { color: '#845ef7', font: '10px JetBrains Mono' });
            }
        }

        UI.setInfoPills([`🧪 Fluidos`, `${this.params.fluidType}`, `ρ = ${this.params.fluidDensity} kg/m³`]);
    },
    destroy() { this.objects = []; this.particles = []; this.splashes = []; }
};
