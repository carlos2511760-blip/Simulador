/* ========================================
   MODULE 3: Energy
   Kinetic, Potential, Conservation
======================================== */

const EnergyModule = {
    name: 'Energia',
    key: 'energy',
    renderer: null,
    world: null,
    scenario: 'skate',
    params: {
        gravity: 9.8,
        mass: 5,
        showEnergy: true,
        friction: 0.002,
        trackType: 'Rampa U',
        showHeightGrid: true,
        objectType: '🛹 Skatista',
    },
    ball: null,
    time: 0,
    trackPoints: [],
    energyHistory: [],
    editingPoint: null,
    draggingBody: false,

    init(renderer) {
        this.renderer = renderer;
        this.world = new PhysicsWorld();
        this.time = 0;
        this.energyHistory = [];
        this.loadScenario('skate');
        this.setupInput();
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Montanha Russa',
                    type: 'scenarios',
                    items: [
                        { label: '🛹 Skate Park', color: '#ffd43b', active: true, onSelect: () => self.loadScenario('skate') },
                        { label: '🍎 Maçã Newton', color: '#ff6b6b', onSelect: () => self.loadScenario('freefall') },
                        { label: '🏹 Estilingue', color: '#51cf66', onSelect: () => self.loadScenario('spring') },
                        { label: '🏗️ Demolição', color: '#845ef7', onSelect: () => self.loadScenario('pendulum_energy') },
                    ]
                },
                {
                    title: 'Controles',
                    type: 'controls',
                    items: [
                        { kind: 'select', id: 'en-obj', label: 'Objeto', options: ['🛹 Skatista', '🍎 Maçã', '⛸️ Patins', '🎾 Bola'], value: self.params.objectType, onChange: v => { self.params.objectType = v; self.loadScenario(self.scenario); } },
                        { kind: 'select', id: 'en-track', label: 'Tipo Pista', options: ['Rampa U', 'Rampa W', 'Colinas', 'Abismo'], value: self.params.trackType, onChange: v => { self.params.trackType = v; self.loadScenario(self.scenario); } },
                        { kind: 'slider', id: 'en-mass', label: 'Massa (kg)', min: 1, max: 100, step: 1, value: self.params.mass, unit: '', onChange: v => { self.params.mass = v; } },
                        { kind: 'slider', id: 'en-friction', label: 'Atrito', min: 0, max: 0.1, step: 0.001, value: self.params.friction, unit: '', onChange: v => { self.params.friction = v; } },
                        { kind: 'button', id: 'en-reset', label: '↺ Reiniciar', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Radar de Energia',
                    type: 'info',
                    id: 'energy-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.time = 0;
        this.energyHistory = [];
        const w = this.renderer.width, h = this.renderer.height;
        const emojis = { '🛹 Skatista': '🛹', '🍎 Maçã': '🍎', '⛸️ Patins': '⛸️', '🎾 Bola': '🎾' };
        const emoji = emojis[this.params.objectType] || '●';

        if (name === 'skate') {
            this.trackPoints = this.generateTrack(w, h, this.params.trackType);
            this.ball = { t: 0, speed: 0, pos: this.trackPoints[0].copy(), radius: 15, label: emoji, trail: [] };
            UI.setHint('🛹 Arraste as bolinhas amarelas para criar pistas loucas!');
        }

        if (name === 'freefall') {
            this.ball = { pos: new Vec2(w / 2, 80), vel: new Vec2(0, 0), radius: 15, label: emoji, trail: [], groundY: h - 60 };
            UI.setHint('Arraste a maçã para o alto e solte!');
        }

        if (name === 'spring') {
            this.ball = { pos: new Vec2(w / 2, h / 2), vel: new Vec2(0, 0), restX: w / 2, displacement: 200, radius: 15, label: '🏹', trail: [], k: 3, phase: 0 };
            UI.setHint('Arraste o estilingue para carregar energia!');
        }

        if (name === 'pendulum_energy') {
            const pivot = new Vec2(w/2, h*0.2);
            this.ball = { pos: new Vec2(w/2+300, h*0.2+200), vel: new Vec2(0,0), pivot: pivot, length: 400, angle: 1.0, angularVel: 0, radius: 20, label: '🏗️', trail: [] };
            UI.setHint('Arraste o pêndulo para mudar a altura inicial');
        }
    },

    generateTrack(w, h, type) {
        if (type === 'Rampa U') return [new Vec2(w*0.1, h*0.3), new Vec2(w*0.2, h*0.85), new Vec2(w*0.7, h*0.85), new Vec2(w*0.8, h*0.3)];
        if (type === 'Rampa W') return [new Vec2(w*0.1, h*0.4), new Vec2(w*0.3, h*0.8), new Vec2(w*0.5, h*0.4), new Vec2(w*0.7, h*0.8), new Vec2(w*0.9, h*0.3)];
        if (type === 'Colinas') return [new Vec2(w*0.05, h*0.5), new Vec2(w*0.2, h*0.2), new Vec2(w*0.4, h*0.5), new Vec2(w*0.6, h*0.2), new Vec2(w*0.9, h*0.5)];
        return [new Vec2(w*0.1, h*0.2), new Vec2(w*0.4, h*0.9), new Vec2(w*0.6, h*0.1), new Vec2(w*0.9, h*0.8)];
    },

    setupInput() {
        const self = this;
        this.renderer.canvas.addEventListener('mousedown', (e) => {
            const rect = self.renderer.canvas.getBoundingClientRect();
            const mouse = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
            if (self.ball && mouse.dist(self.ball.pos) < 40) { self.draggingBody = true; return; }
            if (self.scenario === 'skate') {
                for (let i = 0; i < self.trackPoints.length; i++) {
                    if (self.trackPoints[i].dist(mouse) < 25) { self.editingPoint = i; return; }
                }
            }
        });
        this.renderer.canvas.addEventListener('mousemove', (e) => {
            const rect = self.renderer.canvas.getBoundingClientRect();
            const mouse = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
            if (self.editingPoint !== null) { self.trackPoints[self.editingPoint].set(mouse.x, mouse.y); return; }
            if (self.draggingBody && self.ball) {
                if (self.scenario === 'skate') {
                    let minDist = Infinity, bestT = 0;
                    for (let i = 0; i <= 80; i++) {
                        const pt = PhysicsUtils.getBezierPoint(self.trackPoints, i / 80);
                        const d = pt.dist(mouse); if (d < minDist) { minDist = d; bestT = i / 80; }
                    }
                    self.ball.t = bestT; self.ball.speed = 0; self.ball.trail = [];
                } else if (self.scenario === 'freefall') {
                   self.ball.pos.set(mouse.x, mouse.y); self.ball.vel.set(0, 0); self.ball.trail = [];
                } else if (self.scenario === 'pendulum_energy') {
                   let dir = mouse.sub(self.ball.pivot);
                   self.ball.angle = Math.atan2(dir.x, dir.y);
                   self.ball.angularVel = 0; self.ball.trail = [];
                }
            }
        });
        this.renderer.canvas.addEventListener('mouseup', () => { self.editingPoint = null; self.draggingBody = false; });
    },

    update(dt) {
        const g = this.params.gravity;
        if (this.scenario === 'skate' && this.ball && !this.draggingBody) {
            const track = this.trackPoints;
            const p = PhysicsUtils.getBezierPoint(track, this.ball.t);
            const pNext = PhysicsUtils.getBezierPoint(track, Math.min(this.ball.t + 0.005, 1));
            const tangent = pNext.sub(p).norm();
            this.ball.speed += (g * 10 * tangent.y - this.params.friction * this.ball.speed * 10) * dt;
            this.ball.t += (this.ball.speed * dt) / 800;   // Estimated arc speed
            if (this.ball.t > 0.99) { this.ball.t = 0.99; this.ball.speed *= -0.4; }
            if (this.ball.t < 0.01) { this.ball.t = 0.01; this.ball.speed *= -0.4; }
            this.ball.pos = PhysicsUtils.getBezierPoint(track, this.ball.t);
            this.ball.trail.push(this.ball.pos.copy()); if (this.ball.trail.length > 60) this.ball.trail.shift();
        }

        if (this.scenario === 'freefall' && this.ball && !this.draggingBody) {
            this.ball.vel.y += g * 10 * dt; this.ball.pos = this.ball.pos.add(this.ball.vel.mul(dt));
            if (this.ball.pos.y + this.ball.radius > this.ball.groundY) { this.ball.pos.y = this.ball.groundY - this.ball.radius; this.ball.vel.y *= -0.7; }
            this.ball.trail.push(this.ball.pos.copy()); if (this.ball.trail.length > 80) this.ball.trail.shift();
        }

        if (this.scenario === 'pendulum_energy' && this.ball && !this.draggingBody) {
            const acc = -(g * 10 / this.ball.length) * Math.sin(this.ball.angle);
            this.ball.angularVel += acc * dt; this.ball.angularVel *= 0.999; this.ball.angle += this.ball.angularVel * dt;
            this.ball.pos = new Vec2(this.ball.pivot.x + Math.sin(this.ball.angle) * this.ball.length, this.ball.pivot.y + Math.cos(this.ball.angle) * this.ball.length);
            this.ball.trail.push(this.ball.pos.copy()); if (this.ball.trail.length > 100) this.ball.trail.shift();
        }

        if (this.ball) {
            const h = this.renderer.height, mass = this.params.mass;
            let ke = 0, pe = 0;
            if (this.scenario === 'skate') { ke = 0.5 * mass * this.ball.speed * this.ball.speed; pe = mass * g * (h - this.ball.pos.y); }
            else if (this.scenario === 'freefall') { ke = 0.5 * mass * this.ball.vel.magSq() * 0.1; pe = mass * g * (this.ball.groundY - this.ball.pos.y) * 0.1; }
            else if (this.scenario === 'pendulum_energy') { ke = 0.5 * mass * (this.ball.angularVel * this.ball.length)**2 * 0.1; pe = mass * g * (this.ball.length - this.ball.length * Math.cos(this.ball.angle)) * 0.1; }
            this.energyHistory.push({ ke, pe, total: ke + pe });
            if (this.energyHistory.length > 150) this.energyHistory.shift();
        }
    },

    render(renderer) {
        renderer.clear('#08080f'); renderer.drawGrid(60);
        const w = renderer.width, h = renderer.height;

        if (this.scenario === 'skate') {
            const ctx = renderer.ctx, track = this.trackPoints;
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,212,59,0.5)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
            for (let i = 0; i <= 60; i++) { const p = PhysicsUtils.getBezierPoint(track, i/60); if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
            ctx.stroke();
            for (const p of track) { renderer.drawCircle(p.x, p.y, 7, '#ffd43b'); }
        }

        if (this.ball) {
            if (this.ball.trail.length > 1) renderer.drawTrail(this.ball.trail, '#ffd43b');
            const track = this.trackPoints;
            const p = PhysicsUtils.getBezierPoint(track, this.ball.t);
            const pNext = PhysicsUtils.getBezierPoint(track, Math.min(this.ball.t + 0.01, 1));
            const tangent = pNext.sub(p).norm();
            let normal = new Vec2(-tangent.y, tangent.x); if (normal.y > 0) normal.mul(-1);
            const renderPos = (this.scenario === 'skate') ? this.ball.pos.add(normal.mul(this.ball.radius)) : this.ball.pos;
            renderer.drawText(this.ball.label, renderPos.x, renderPos.y, { font: `${this.ball.radius * 2.8}px Arial`, align: 'center', baseline: 'bottom' });
        }

        if (this.energyHistory.length > 0) {
            const latest = this.energyHistory[this.energyHistory.length - 1];
            UI.updateInfo('energy-info', `EC (Cinética): ${latest.ke.toFixed(0)} J<br>EP (Potencial): ${latest.pe.toFixed(0)} J<br>ET (Total): ${latest.total.toFixed(0)} J`);
            UI.setInfoPills([`⚡ Energia`, `E = ${latest.total.toFixed(0)} J`]);
        }
    },

    destroy() { this.ball = null; }
};
