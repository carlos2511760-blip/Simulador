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
    params: {
        gravity: 9.8,
        angle: 45,
        speed: 200,
        showVectors: true,
        showTrails: true,
        restitution: 0.8,
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
                    title: 'Cenário',
                    type: 'scenarios',
                    items: [
                        { label: 'Projétil', color: '#ff6b6b', active: true, onSelect: () => self.loadScenario('projectile') },
                        { label: 'Colisões', color: '#ffd43b', onSelect: () => self.loadScenario('collisions') },
                        { label: 'Plano Inclinado', color: '#22b8cf', onSelect: () => self.loadScenario('incline') },
                        { label: 'Pêndulo', color: '#51cf66', onSelect: () => self.loadScenario('pendulum') },
                    ]
                },
                {
                    title: 'Parâmetros',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'mech-gravity', label: 'Gravidade', min: 0, max: 30, step: 0.1, value: self.params.gravity, unit: ' m/s²', onChange: v => { self.params.gravity = v; } },
                        { kind: 'slider', id: 'mech-angle', label: 'Ângulo', min: 0, max: 90, step: 1, value: self.params.angle, unit: '°', onChange: v => { self.params.angle = v; } },
                        { kind: 'slider', id: 'mech-speed', label: 'Velocidade', min: 50, max: 500, step: 10, value: self.params.speed, unit: ' px/s', onChange: v => { self.params.speed = v; } },
                        { kind: 'slider', id: 'mech-rest', label: 'Restituição', min: 0, max: 1, step: 0.05, value: self.params.restitution, unit: '', onChange: v => { self.params.restitution = v; } },
                        { kind: 'checkbox', id: 'mech-vectors', label: 'Mostrar vetores', checked: true, onChange: v => { self.params.showVectors = v; } },
                        { kind: 'checkbox', id: 'mech-trails', label: 'Mostrar rastro', checked: true, onChange: v => { self.params.showTrails = v; } },
                        { kind: 'button', id: 'mech-launch', label: '🚀 Lançar Projétil', onClick: () => self.launchProjectile() },
                    ]
                },
                {
                    title: 'Informações',
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
            const colors = ['#ff6b6b', '#845ef7', '#22b8cf', '#ffd43b', '#51cf66', '#ff922b'];
            for (let i = 0; i < 8; i++) {
                const r = PhysicsUtils.randomRange(12, 30);
                this.world.addBody(new Body({
                    pos: new Vec2(PhysicsUtils.randomRange(r + 50, w - r - 50), PhysicsUtils.randomRange(r + 50, h - r - 50)),
                    vel: Vec2.random(PhysicsUtils.randomRange(50, 200)),
                    radius: r,
                    mass: r * 0.5,
                    color: colors[i % colors.length],
                    restitution: this.params.restitution,
                    maxTrail: 80,
                }));
            }
            UI.setHint('Bolas colidindo elasticamente — arraste para adicionar novas');
        }

        if (name === 'incline') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            this.world.bounds = { x: 0, y: 0, w, h };
            // We'll draw an incline and simulate a ball on it
            const ball = new Body({
                pos: new Vec2(w * 0.25, h * 0.35),
                vel: new Vec2(0, 0),
                radius: 15,
                mass: 2,
                color: '#ff6b6b',
                maxTrail: 120,
            });
            this.world.addBody(ball);
            UI.setHint('Bola descendo o plano inclinado');
        }

        if (name === 'pendulum') {
            this.world.gravity = new Vec2(0, this.params.gravity * 10);
            this.world.bounds = null;
            // Pendulum bob
            const pivotX = w / 2;
            const pivotY = h * 0.15;
            const length = h * 0.4;
            const angle = Math.PI / 4;
            const bob = new Body({
                pos: new Vec2(pivotX + Math.sin(angle) * length, pivotY + Math.cos(angle) * length),
                vel: new Vec2(0, 0),
                radius: 18,
                mass: 3,
                color: '#845ef7',
                maxTrail: 200,
            });
            bob.userData.pivot = new Vec2(pivotX, pivotY);
            bob.userData.length = length;
            bob.userData.isPendulum = true;
            this.world.addBody(bob);
            UI.setHint('Pêndulo simples — arraste a bola para mudar o ângulo');
        }
    },

    launchProjectile() {
        const w = this.renderer.width;
        const h = this.renderer.height;
        const rad = this.params.angle * Math.PI / 180;
        const vx = this.params.speed * Math.cos(rad);
        const vy = -this.params.speed * Math.sin(rad);
        const ball = new Body({
            pos: new Vec2(50, h - 50),
            vel: new Vec2(vx, vy),
            radius: 10,
            mass: 1,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            restitution: this.params.restitution,
            maxTrail: 300,
        });
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

        // Clean up off-screen bodies (projectile)
        if (this.scenario === 'projectile') {
            this.world.bodies = this.world.bodies.filter(b =>
                b.pos.x > -100 && b.pos.x < this.renderer.width + 100
            );
        }
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
                renderer.drawTrail(body.trail, body.color.replace(')', ',0.3)').replace('hsl', 'hsla').replace('rgb', 'rgba') || 'rgba(132,94,247,0.2)');
            }
            renderer.drawBody(body, body.color);

            if (this.params.showVectors && body.vel.mag() > 1) {
                const velEnd = body.pos.add(body.vel.norm().mul(Math.min(body.vel.mag() * 0.3, 60)));
                renderer.drawArrow(body.pos, velEnd, '#ff6b6b', 2, 8);
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
