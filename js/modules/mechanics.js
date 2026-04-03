/* ========================================
   MODULE 1: Classical Mechanics
   Projectile, Collisions, Newton's Laws
======================================== */

const MechanicsModule = {
    name: 'Mecânica Clássica',
    key: 'mechanics',
    world: null,
    renderer: null,
    scenario: 'projectile',
    explosions: [],
    params: {
        projectileType: '🏀 Basquete',
        gravity: 9.8,
        angle: 45,
        speed: 200,
        showVectors: true,
        showTrails: true,
        restitution: 0.6,
        numBalls: 5,
        trackPoints: [], 
    },
    dragging: null,
    dragStart: null,
    editingPoint: null,

    init(renderer) {
        this.renderer = renderer;
        this.world = new PhysicsWorld();
        this.world.bounds = { x: 0, y: 0, w: renderer.width, h: renderer.height };
        this.loadScenario('projectile');
        this.setupInput(renderer.canvas);
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Missão Científica',
                    type: 'scenarios',
                    items: [
                        { label: '🚀 Canhão de Emojis', color: '#ff6b6b', active: true, onSelect: () => self.loadScenario('projectile') },
                        { label: '💥 Choque de Monstros', color: '#ffd43b', onSelect: () => self.loadScenario('collisions') },
                        { label: '🎢 Tobogã Radical', color: '#22b8cf', onSelect: () => self.loadScenario('incline') },
                        { label: '🕰️ O Grande Relógio', color: '#51cf66', onSelect: () => self.loadScenario('pendulum') },
                    ]
                },
                {
                    title: 'Controles',
                    type: 'controls',
                    items: [
                        { kind: 'select', id: 'mech-type', label: 'Projétil', options: ['🏀 Basquete', '⚽ Futebol', '🎾 Tênis', '💣 Bombe Explisiva', '🍉 Melancia'], value: self.params.projectileType, onChange: v => { self.params.projectileType = v; } },
                        { kind: 'slider', id: 'mech-gravity', label: 'Gravidade (g)', min: 0, max: 30, step: 0.1, value: self.params.gravity, unit: ' m/s²', onChange: v => { self.params.gravity = v; } },
                        { kind: 'slider', id: 'mech-angle', label: 'Ângulo', min: 0, max: 90, step: 1, value: self.params.angle, unit: '°', onChange: v => { self.params.angle = v; } },
                        { kind: 'slider', id: 'mech-speed', label: 'Poder', min: 50, max: 1000, step: 10, value: self.params.speed, unit: '', onChange: v => { self.params.speed = v; } },
                        { kind: 'button', id: 'mech-launch', label: '🚀 DISPARAR!', onClick: () => self.launchProjectile() },
                        { kind: 'button', id: 'mech-track-hills', label: '⛰️ Pista Colinas', onClick: () => self.setupInclineTrack('hills') },
                        { kind: 'button', id: 'mech-track-u', label: '🛹 Pista U', onClick: () => self.setupInclineTrack('u') },
                        { kind: 'button', id: 'mech-clear', label: '🗑️ Limpar Tudo', onClick: () => { self.world.clear(); self.explosions = []; } },
                    ]
                },
                {
                    title: 'Dados do Teste',
                    type: 'info',
                    id: 'mech-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.world.clear();
        this.explosions = [];
        const w = this.renderer.width;
        const h = this.renderer.height;

        if (name === 'projectile') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            UI.setHint('Arraste o círculo vermelho ou use os controles para disparar!');
        }

        if (name === 'collisions') {
            this.world.gravity = new Vec2(0, 0);
            const emojis = ['🦁', '🐯', '🐼', '🐨', '🐷', '🐸'];
            for (let i = 0; i < 6; i++) {
                const r = 30;
                this.world.addBody(new Body({
                    pos: new Vec2(PhysicsUtils.randomRange(100, w-100), PhysicsUtils.randomRange(100, h-100)),
                    vel: Vec2.random(200),
                    radius: r,
                    mass: 5,
                    label: emojis[i % emojis.length],
                    restitution: 0.9,
                    maxTrail: 40,
                }));
            }
            UI.setHint('Choque de Monstros — arraste-os para causar impacto!');
        }

        if (name === 'incline') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            this.setupInclineTrack('u');
            this.world.addBody(new Body({
                pos: this.params.trackPoints[0].copy(),
                radius: 20,
                mass: 2,
                label: '⛷️',
                maxTrail: 100,
            }));
            UI.setHint('⛷️ Tobogã — Arraste as bolinhas amarelas para mudar o trajeto!');
        }

        if (name === 'pendulum') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            const bob = new Body({
                pos: new Vec2(w/2 + 200, h*0.2 + 300),
                radius: 25,
                mass: 10,
                label: '🕰️',
                maxTrail: 150,
            });
            bob.userData.pivot = new Vec2(w/2, h*0.2);
            bob.userData.length = 400;
            bob.userData.isPendulum = true;
            this.world.addBody(bob);
            UI.setHint('Pêndulo — arraste a bola para mudar a amplitude');
        }
    },

    setupInclineTrack(type) {
        const w = this.renderer.width;
        const h = this.renderer.height;
        if (type === 'u') {
            this.params.trackPoints = [
                new Vec2(w * 0.1, h * 0.3),
                new Vec2(w * 0.2, h * 0.8),
                new Vec2(w * 0.5, h * 0.8),
                new Vec2(w * 0.6, h * 0.3),
            ];
        } else {
            this.params.trackPoints = [
                new Vec2(w * 0.05, h * 0.3),
                new Vec2(w * 0.25, h * 0.6),
                new Vec2(w * 0.45, h * 0.2),
                new Vec2(w * 0.75, h * 0.8),
            ];
        }
    },

    launchProjectile() {
        const h = this.renderer.height;
        const rad = this.params.angle * Math.PI / 180;
        const vx = this.params.speed * Math.cos(rad) * 0.8;
        const vy = -this.params.speed * Math.sin(rad) * 0.8;
        const emojiMap = { '🏀 Basquete': '🏀', '⚽ Futebol': '⚽', '🎾 Tênis': '🎾', '💣 Bombe Explisiva': '💣', '🍉 Melancia': '🍉' };
        const ball = new Body({
            pos: new Vec2(50, h - 55),
            vel: new Vec2(vx, vy),
            radius: 18,
            mass: 2,
            label: emojiMap[this.params.projectileType] || '●',
            restitution: 0.6,
            maxTrail: 100,
        });
        if (this.params.projectileType.includes('Bomb')) ball.userData.isBomb = true;
        this.world.addBody(ball);
    },

    setupInput(canvas) {
        const self = this;
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouse = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

            if (self.scenario === 'incline') {
                for (let i = 0; i < self.params.trackPoints.length; i++) {
                    if (self.params.trackPoints[i].dist(mouse) < 25) { self.editingPoint = i; return; }
                }
            }

            for (const b of self.world.bodies) {
                if (b.pos.dist(mouse) < b.radius + 15) {
                    self.dragging = b;
                    self.dragStart = mouse.copy();
                    return;
                }
            }

            if (self.scenario === 'projectile' || self.scenario === 'collisions') {
                self.dragStart = mouse.copy();
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouse = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

            if (self.editingPoint !== null) {
                self.params.trackPoints[self.editingPoint].set(mouse.x, mouse.y);
                return;
            }

            if (self.dragging) {
                if (self.scenario === 'incline' && self.dragging.label === '⛷️') {
                    let minDist = Infinity, bestP = null;
                    for (let i = 0; i <= 50; i++) {
                        const p = PhysicsUtils.getBezierPoint(self.params.trackPoints, i / 50);
                        const d = p.dist(mouse);
                        if (d < minDist) { minDist = d; bestP = p; }
                    }
                    self.dragging.pos.set(bestP.x, bestP.y);
                } else {
                    self.dragging.pos.set(mouse.x, mouse.y);
                }
                self.dragging.vel.set(0, 0);
                self.dragging.trail = [];
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouse = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

            if (self.editingPoint !== null) { self.editingPoint = null; return; }
            if (self.dragging) { self.dragging = null; self.dragStart = null; return; }

            if (self.dragStart && (self.scenario === 'projectile' || self.scenario === 'collisions')) {
                const diff = mouse.sub(self.dragStart);
                if (diff.mag() > 15) {
                    const ball = new Body({
                        pos: self.dragStart.copy(),
                        vel: diff.mul(-2),
                        radius: PhysicsUtils.randomRange(10, 18),
                        mass: 2,
                        color: `hsl(${Math.random() * 360}, 70%, 65%)`,
                        maxTrail: 100,
                    });
                    self.world.addBody(ball);
                }
                self.dragStart = null;
            }
        });
    },

    update(dt) {
        this.world.gravity = new Vec2(0, this.params.gravity * 10);

        if (this.scenario === 'pendulum') {
            for (const b of this.world.bodies) {
                if (b.userData.isPendulum && this.dragging !== b) {
                    const pivot = b.userData.pivot, len = b.userData.length;
                    let dir = b.pos.sub(pivot);
                    b.pos = pivot.add(dir.norm().mul(len));
                    const tangent = new Vec2(-dir.y, dir.x).norm();
                    b.vel = tangent.mul(b.vel.dot(tangent));
                    b.applyForce(new Vec2(0, b.mass * this.params.gravity * 10));
                    b.update(dt);
                    b.acc = new Vec2();
                }
            }
        }

        if (this.scenario === 'incline') {
            const track = this.params.trackPoints;
            for (const b of this.world.bodies) {
                if (b.label !== '⛷️' || this.dragging === b) continue;

                let minDist = Infinity, closestPoint = null, closestTangent = null;
                const iterations = 60;
                for (let i = 0; i <= iterations; i++) {
                    const t = i / iterations;
                    const p = PhysicsUtils.getBezierPoint(track, t);
                    const d = b.pos.dist(p);
                    if (d < minDist) {
                        minDist = d; closestPoint = p;
                        const pNext = PhysicsUtils.getBezierPoint(track, Math.min(t + 0.01, 1));
                        closestTangent = pNext.sub(p).norm();
                    }
                }

                if (minDist < 60) {
                    const normal = new Vec2(-closestTangent.y, closestTangent.x);
                    if (normal.y > 0) normal.mul(-1);
                    b.pos = closestPoint.add(normal.mul(b.radius));
                    const velMag = b.vel.dot(closestTangent);
                    const slopeForce = new Vec2(0, this.params.gravity * 10).dot(closestTangent);
                    b.vel = closestTangent.mul((velMag + slopeForce * dt) * 0.995);
                }
            }
        }

        this.world.step(dt);

        for (let i = 0; i < this.world.bodies.length; i++) {
            const b = this.world.bodies[i];
            if (b.userData.isBomb && b.pos.y + b.radius >= this.renderer.height - 45) {
                for(let k=0; k<20; k++) this.explosions.push({ x: b.pos.x, y: b.pos.y, vx: (Math.random()-0.5)*400, vy: -Math.random()*400, life: 1.0 });
                this.world.bodies.splice(i, 1); i--;
            }
        }

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const ex = this.explosions[i];
            ex.x += ex.vx * dt; ex.y += ex.vy * dt; ex.vy += this.params.gravity * 10 * dt;
            ex.life -= dt * 1.5;
            if (ex.life <= 0) this.explosions.splice(i, 1);
        }
    },

    render(renderer) {
        renderer.clear();
        renderer.drawGrid(60);
        const w = renderer.width, h = renderer.height;

        if (this.scenario === 'projectile' || this.scenario === 'incline') {
            renderer.drawRect(0, h - 40, w, 40, 'rgba(255,255,255,0.02)');
            renderer.drawLine(new Vec2(0, h - 40), new Vec2(w, h - 40), 'rgba(255,255,255,0.1)', 1);
        }

        if (this.scenario === 'incline') {
            const ctx = renderer.ctx, track = this.params.trackPoints;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(34,184,207,0.7)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
            for (let i = 0; i <= 50; i++) {
                const p = PhysicsUtils.getBezierPoint(track, i / 50);
                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
            for (const p of track) { renderer.drawCircle(p.x, p.y, 7, '#ffd43b'); }
        }

        if (this.scenario === 'pendulum') {
            for (const b of this.world.bodies) {
                if (b.userData.isPendulum) {
                   renderer.drawLine(b.userData.pivot, b.pos, 'rgba(255,255,255,0.3)', 2);
                   renderer.drawCircle(b.userData.pivot.x, b.userData.pivot.y, 6, 'rgba(255,255,255,0.5)');
                }
            }
        }

        for (const body of this.world.bodies) {
            if (this.params.showTrails) renderer.drawTrail(body.trail, body.color);
            if (body.label && isNaN(body.label)) {
                const off = (body.label === '⛷️') ? -body.radius * 0.2 : 0;
                renderer.drawText(body.label, body.pos.x, body.pos.y + off, { font: `${body.radius * 2.2}px Arial`, align: 'center', baseline: 'bottom' });
            } else {
                renderer.drawBody(body, body.color);
            }
        }

        for (const ex of this.explosions) renderer.drawCircle(ex.x, ex.y, 2 + ex.life * 6, `rgba(255, 146, 43, ${ex.life})`);

        let totalKE = 0;
        let totalPE = 0;
        for (const b of this.world.bodies) {
            totalKE += b.kineticEnergy();
            totalPE += b.mass * this.params.gravity * (h - b.pos.y);
        }
        
        if (!this.history) this.history = [];
        this.history.push({ ke: totalKE, pe: totalPE, t: totalKE + totalPE });
        if (this.history.length > 150) this.history.shift();

        if (this.history.length > 0) {
            const maxPoints = 150;
            const keSeries = { data: this.history.map(h => h.ke), color: '#339af0', label: 'E. Cinética', maxPoints, fill: true };
            const peSeries = { data: this.history.map(h => h.pe), color: '#ff6b6b', label: 'E. Potencial', maxPoints, fill: true };
            renderer.drawChart('Dinâmica do Sistema (J)', [keSeries, peSeries], w - 370, 20, 350, 200);
            
            if (this.world.bodies.length > 0) {
                const maxVel = Math.max(...this.world.bodies.map(b => b.vel.mag()));
                renderer.drawGauge('Vel. Máxima', maxVel, 0, 1500, 'px/s', w - 195, 310, 60, '#22b8cf');
            }
        }

        UI.setInfoPills([`⚙ Mecânica`, `🔵 ${this.world.bodies.length} corpos`, `⚡ E = ${totalKE.toFixed(0)} J`]);
    },

    destroy() { this.world.clear(); this.dragging = null; this.history = []; }
};
