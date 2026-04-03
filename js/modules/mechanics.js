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
    },
    dragging: null,
    dragStart: null,

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
                    title: 'Controles de Lançamento',
                    type: 'controls',
                    items: [
                        { kind: 'select', id: 'mech-type', label: 'Projétil', options: ['🏀 Basquete', '⚽ Futebol', '🎾 Tênis', '💣 Bomba Explisiva', '🍉 Melancia'], value: self.params.projectileType, onChange: v => { self.params.projectileType = v; } },
                        { kind: 'slider', id: 'mech-gravity', label: 'Gravidade (g)', min: 0, max: 30, step: 0.1, value: self.params.gravity, unit: ' m/s²', onChange: v => { self.params.gravity = v; } },
                        { kind: 'slider', id: 'mech-angle', label: 'Ângulo de Disparo', min: 0, max: 90, step: 1, value: self.params.angle, unit: '°', onChange: v => { self.params.angle = v; } },
                        { kind: 'slider', id: 'mech-speed', label: 'Poder do Canhão', min: 50, max: 1000, step: 10, value: self.params.speed, unit: '', onChange: v => { self.params.speed = v; } },
                        { kind: 'button', id: 'mech-launch', label: '🚀 DISPARAR!', onClick: () => self.launchProjectile() },
                        { kind: 'button', id: 'mech-clear', label: '🗑️ Limpar Tudo', onClick: () => self.world.clear() },
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
        const w = this.renderer.width;
        const h = this.renderer.height;

        if (name === 'projectile') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            this.world.bounds = { x: 0, y: 0, w, h };
            // Ground
            UI.setHint('Clique em "Lançar Projétil" ou arraste no canvas para lançar');
        }

        if (name === 'collisions') {
            this.world.gravity = new Vec2(0, 0);
            this.world.bounds = { x: 0, y: 0, w, h };
            const emojis = ['🦁', '🐯', '🐼', '🐨', '🐷', '🐸'];
            for (let i = 0; i < 6; i++) {
                const r = 30;
                this.world.addBody(new Body({
                    pos: new Vec2(PhysicsUtils.randomRange(r + 50, w - r - 50), PhysicsUtils.randomRange(r + 50, h - r - 50)),
                    vel: Vec2.random(PhysicsUtils.randomRange(100, 300)),
                    radius: r,
                    mass: 5,
                    label: emojis[i % emojis.length],
                    restitution: 0.9,
                    maxTrail: 40,
                }));
            }
            UI.setHint('Choque de Monstros — veja as faíscas voarem no impacto!');
        }

        if (name === 'incline') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            this.world.bounds = { x: 0, y: 0, w, h };
            this.world.addBody(new Body({
                pos: new Vec2(w * 0.15, h * 0.2),
                vel: new Vec2(0, 0),
                radius: 20,
                mass: 2,
                label: '⛷️',
                maxTrail: 100,
            }));
            UI.setHint('Tobogã Radical — o esquiador acelera pela rampa');
        }

        if (name === 'pendulum') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            this.world.bounds = null;
            const pivotX = w / 2;
            const pivotY = h * 0.2;
            const length = h * 0.5;
            const angle = Math.PI / 3;
            const bob = new Body({
                pos: new Vec2(pivotX + Math.sin(angle) * length, pivotY + Math.cos(angle) * length),
                vel: new Vec2(0, 0),
                radius: 25,
                mass: 10,
                label: '🕰️',
                maxTrail: 150,
            });
            bob.userData.pivot = new Vec2(pivotX, pivotY);
            bob.userData.length = length;
            bob.userData.isPendulum = true;
            this.world.addBody(bob);
            UI.setHint('O Grande Relógio — analise o período de oscilação');
        }
    },

    launchProjectile() {
        const h = this.renderer.height;
        const rad = this.params.angle * Math.PI / 180;
        const vx = this.params.speed * Math.cos(rad) * 0.8;
        const vy = -this.params.speed * Math.sin(rad) * 0.8;
        const emojiMap = {
            '🏀 Basquete': '🏀', '⚽ Futebol': '⚽', '🎾 Tênis': '🎾',
            '💣 Bomba Explisiva': '💣', '🍉 Melancia': '🍉'
        };
        const ball = new Body({
            pos: new Vec2(50, h - 50),
            vel: new Vec2(vx, vy),
            radius: 18,
            mass: 2,
            label: emojiMap[this.params.projectileType] || '●',
            restitution: 0.6,
            maxTrail: 200,
        });
        if (this.params.projectileType.includes('Bomba')) {
            ball.userData.isBomb = true;
        }
        this.world.addBody(ball);
    },

    setupInput(canvas) {
        const self = this;
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            // Check if clicking on a body
            for (const b of self.world.bodies) {
                if (b.pos.dist(new Vec2(mx, my)) < b.radius + 5) {
                    self.dragging = b;
                    self.dragStart = new Vec2(mx, my);
                    return;
                }
            }

            // Start drag for launch
            if (self.scenario === 'projectile' || self.scenario === 'collisions') {
                self.dragStart = new Vec2(mx, my);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!self.dragging && !self.dragStart) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            if (self.dragging) {
                self.dragging.pos.set(mx, my);
                self.dragging.vel.set(0, 0);
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            if (self.dragging) {
                self.dragging = null;
                self.dragStart = null;
                return;
            }

            if (self.dragStart) {
                const diff = new Vec2(mx, my).sub(self.dragStart);
                if (diff.mag() > 10) {
                    const ball = new Body({
                        pos: self.dragStart.copy(),
                        vel: diff.mul(-2),
                        radius: PhysicsUtils.randomRange(8, 18),
                        mass: PhysicsUtils.randomRange(1, 5),
                        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                        restitution: self.params.restitution,
                        maxTrail: 200,
                    });
                    self.world.addBody(ball);
                }
                self.dragStart = null;
            }
        });
    },

    update(dt) {
        this.world.gravity = new Vec2(0, this.params.gravity * 10);

        // Pendulum constraint
        if (this.scenario === 'pendulum') {
            for (const b of this.world.bodies) {
                if (b.userData.isPendulum) {
                    const pivot = b.userData.pivot;
                    const len = b.userData.length;
                    const dir = b.pos.sub(pivot);
                    const dist = dir.mag();
                    if (dist > 0) {
                        b.pos = pivot.add(dir.norm().mul(len));
                        const tangent = new Vec2(-dir.y, dir.x).norm();
                        const velTangent = b.vel.dot(tangent);
                        b.vel = tangent.mul(velTangent);
                    }
                    // Gravity component
                    b.applyForce(new Vec2(0, b.mass * this.params.gravity * 10));
                    b.update(dt);
                    b.acc = new Vec2();
                    return; // Skip world step for pendulum
                }
            }
        }

        // Incline — constrain ball to ramp surface
        if (this.scenario === 'incline') {
            for (const b of this.world.bodies) {
                const w = this.renderer.width;
                const h = this.renderer.height;
                // Ramp from top-left quarter to bottom-right
                const rampStart = new Vec2(w * 0.1, h * 0.3);
                const rampEnd = new Vec2(w * 0.7, h - 60);
                const rampDir = rampEnd.sub(rampStart).norm();
                const rampNormal = new Vec2(-rampDir.y, rampDir.x);

                // Project ball onto ramp line
                const toBall = b.pos.sub(rampStart);
                const projDist = toBall.dot(rampNormal);

                if (projDist < b.radius && b.pos.x >= rampStart.x && b.pos.x <= rampEnd.x) {
                    b.pos = b.pos.add(rampNormal.mul(b.radius - projDist));
                    const velNorm = b.vel.dot(rampNormal);
                    if (velNorm < 0) {
                        b.vel = b.vel.sub(rampNormal.mul(velNorm * 1.02));
                    }
                }

                // Floor
                if (b.pos.y + b.radius > h - 40) {
                    b.pos.y = h - 40 - b.radius;
                    b.vel.y *= -b.restitution;
                }
            }
        }

        this.world.step(dt);

        // Explosion effects logic
        const g = this.params.gravity;
        for (let i = 0; i < this.world.bodies.length; i++) {
            const b = this.world.bodies[i];
            
            // Bomb explosion on floor
            if (b.userData.isBomb && b.pos.y + b.radius >= this.renderer.height - 45 && Math.abs(b.vel.y) > 50) {
                for(let k=0; k<25; k++) {
                    this.explosions.push({
                        x: b.pos.x, y: b.pos.y,
                        vx: (Math.random()-0.5)*400, vy: -Math.random()*400,
                        life: 1.0, color: '#ff922b'
                    });
                }
                this.world.bodies.splice(i, 1);
                i--;
                continue;
            }
        }

        if (this.explosions) {
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const ex = this.explosions[i];
                ex.x += ex.vx * dt;
                ex.y += ex.vy * dt;
                ex.vy += g * 10 * dt;
                ex.life -= dt * 1.5;
                if (ex.life <= 0) this.explosions.splice(i, 1);
            }
        }

        // Clean up off-screen bodies
        this.world.bodies = this.world.bodies.filter(b => b.pos.x > -100 && b.pos.x < this.renderer.width + 100);
    },

    render(renderer) {
        renderer.clear();
        renderer.drawGrid(60);

        const w = renderer.width;
        const h = renderer.height;

        // Draw ground line for projectile / incline
        if (this.scenario === 'projectile') {
            renderer.drawRect(0, h - 40, w, 40, 'rgba(255,255,255,0.03)');
            renderer.drawLine(new Vec2(0, h - 40), new Vec2(w, h - 40), 'rgba(255,107,107,0.3)', 2);
            // Launch position indicator
            renderer.drawCircle(50, h - 50, 6, 'rgba(255,107,107,0.5)');
        }

        if (this.scenario === 'incline') {
            // Draw ramp
            const rampStart = new Vec2(w * 0.1, h * 0.3);
            const rampEnd = new Vec2(w * 0.7, h - 60);
            renderer.drawLine(rampStart, rampEnd, 'rgba(34,184,207,0.6)', 3);
            // Floor
            renderer.drawRect(0, h - 40, w, 40, 'rgba(255,255,255,0.03)');
            renderer.drawLine(new Vec2(0, h - 40), new Vec2(w, h - 40), 'rgba(34,184,207,0.3)', 2);
        }

        if (this.scenario === 'pendulum') {
            for (const b of this.world.bodies) {
                if (b.userData.isPendulum && b.userData.pivot) {
                    // Draw string
                    renderer.drawLine(b.userData.pivot, b.pos, 'rgba(255,255,255,0.3)', 2);
                    // Pivot
                    renderer.drawCircle(b.userData.pivot.x, b.userData.pivot.y, 5, 'rgba(255,255,255,0.5)');
                }
            }
        }

        // Draw bodies
        for (const body of this.world.bodies) {
            if (this.params.showTrails) {
                renderer.drawTrail(body.trail, body.color ? body.color.replace(')', ',0.3)').replace('hsl', 'hsla') : 'rgba(255,255,255,0.2)');
            }
            
            if (body.label && body.label.length > 0 && isNaN(body.label)) {
                renderer.drawText(body.label, body.pos.x, body.pos.y, {
                   font: `${body.radius * 2}px Arial`, align: 'center', baseline: 'middle'
                });
            } else {
                renderer.drawBody(body, body.color);
            }

            if (this.params.showVectors && body.vel.mag() > 10) {
                const velEnd = body.pos.add(body.vel.norm().mul(Math.min(body.vel.mag() * 0.2, 50)));
                renderer.drawArrow(body.pos, velEnd, '#ffd43b', 2, 6);
            }
        }

        if (this.explosions) {
            for (const ex of this.explosions) {
                renderer.drawCircle(ex.x, ex.y, 2 + ex.life * 5, `rgba(255, 146, 43, ${ex.life})`);
            }
        }

        // Info
        let totalKE = 0;
        for (const b of this.world.bodies) totalKE += b.kineticEnergy();
        UI.updateInfo('mech-info', `
      Corpos: ${this.world.bodies.length}<br>
      Energia Cinética Total: ${totalKE.toFixed(1)} J<br>
      Gravidade: ${this.params.gravity} m/s²
    `);

        UI.setInfoPills([
            `⚙ Mecânica Clássica`,
            `🔵 ${this.world.bodies.length} corpos`,
            `⚡ E = ${totalKE.toFixed(0)} J`,
        ]);
    },

    destroy() {
        this.world.clear();
        this.dragging = null;
        this.dragStart = null;
    }
};
