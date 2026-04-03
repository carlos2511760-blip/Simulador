/* ========================================
   MODULE 2: Gravity & Orbits
   N-body gravitational simulation
======================================== */

const GravityModule = {
    name: 'Gravidade e Órbitas',
    key: 'gravity',
    bodies: [],
    explosions: [],
    renderer: null,
    scenario: 'solar',
    params: {
        G: 800,
        showTrails: true,
        showVectors: false,
        showForces: true,
        timeScale: 1,
        mergeOnCollision: true,
    },
    dragging: null,
    dragStart: null,
    time: 0,

    init(renderer) {
        this.renderer = renderer;
        this.bodies = [];
        this.time = 0;
        this.loadScenario('solar');
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
                        { label: 'Sistema Solar', color: '#ffd43b', active: true, onSelect: () => self.loadScenario('solar') },
                        { label: 'Órbita Binária', color: '#845ef7', onSelect: () => self.loadScenario('binary') },
                        { label: 'Três Corpos', color: '#ff6b6b', onSelect: () => self.loadScenario('threebody') },
                        { label: 'Cinturão de Asteroides', color: '#22b8cf', onSelect: () => self.loadScenario('asteroids') },
                    ]
                },
                {
                    title: 'Parâmetros',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'grav-G', label: 'Constante G', min: 100, max: 3000, step: 50, value: self.params.G, unit: '', onChange: v => { self.params.G = v; } },
                        { kind: 'checkbox', id: 'grav-trails', label: 'Mostrar órbitas', checked: true, onChange: v => { self.params.showTrails = v; } },
                        { kind: 'checkbox', id: 'grav-forces', label: 'Mostrar forças', checked: true, onChange: v => { self.params.showForces = v; } },
                        { kind: 'checkbox', id: 'grav-merge', label: 'Fundir em colisão', checked: true, onChange: v => { self.params.mergeOnCollision = v; } },
                        { kind: 'button', id: 'grav-add', label: '🪐 Adicionar Planeta', onClick: () => self.addRandomPlanet() },
                    ]
                },
                {
                    title: 'Informações',
                    type: 'info',
                    id: 'grav-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.bodies = [];
        this.time = 0;
        const w = this.renderer.width;
        const h = this.renderer.height;
        const cx = w / 2, cy = h / 2;

        if (name === 'solar') {
            // Sun
            this.bodies.push(new Body({
                pos: new Vec2(cx, cy), vel: new Vec2(0, 0),
                mass: 500, radius: 28, color: '#ffd43b', label: '☀️', fixed: true, maxTrail: 0,
            }));
            // Planets
            const planets = [
                { dist: 80, mass: 3, r: 6, color: '#adb5bd', label: '🌑', speed: 3.8 },
                { dist: 120, mass: 8, r: 8, color: '#ff922b', label: '🌕', speed: 3.1 },
                { dist: 170, mass: 10, r: 9, color: '#339af0', label: '🌍', speed: 2.6 },
                { dist: 220, mass: 6, r: 7, color: '#ff6b6b', label: '🔴', speed: 2.2 },
                { dist: 310, mass: 60, r: 16, color: '#e8590c', label: '🪐', speed: 1.5 },
                { dist: 390, mass: 40, r: 14, color: '#fcc419', label: '⭐', speed: 1.2 },
            ];
            for (const p of planets) {
                const angle = Math.random() * Math.PI * 2;
                const orbitalSpeed = Math.sqrt(this.params.G * 500 / p.dist) * p.speed * 0.25;
                this.bodies.push(new Body({
                    pos: new Vec2(cx + Math.cos(angle) * p.dist, cy + Math.sin(angle) * p.dist),
                    vel: new Vec2(-Math.sin(angle) * orbitalSpeed, Math.cos(angle) * orbitalSpeed),
                    mass: p.mass, radius: p.r, color: p.color, label: p.label, maxTrail: 300,
                }));
            }
            UI.setHint('Sistema Solar — arraste para adicionar novos corpos celestes');
        }

        if (name === 'binary') {
            const dist = 120;
            const speed = Math.sqrt(this.params.G * 100 / (dist * 2));
            this.bodies.push(new Body({
                pos: new Vec2(cx - dist, cy), vel: new Vec2(0, speed),
                mass: 100, radius: 20, color: '#339af0', label: '🔵', maxTrail: 200,
            }));
            this.bodies.push(new Body({
                pos: new Vec2(cx + dist, cy), vel: new Vec2(0, -speed),
                mass: 100, radius: 20, color: '#ff6b6b', label: '🔴', maxTrail: 200,
            }));
            // small orbiting planet
            this.bodies.push(new Body({
                pos: new Vec2(cx, cy - 250), vel: new Vec2(speed * 1.8, 0),
                mass: 2, radius: 5, color: '#51cf66', label: '🌍', maxTrail: 400,
            }));
            UI.setHint('Sistema binário — duas estrelas orbitando mutuamente');
        }

        if (name === 'threebody') {
            const L = 150;
            const speed = Math.sqrt(this.params.G * 80 / L) * 0.6;
            const positions = [
                new Vec2(cx, cy - L),
                new Vec2(cx - L * 0.866, cy + L * 0.5),
                new Vec2(cx + L * 0.866, cy + L * 0.5),
            ];
            const colors = ['#ff6b6b', '#845ef7', '#22b8cf'];
            const labels = ['Corpo A', 'Corpo B', 'Corpo C'];
            for (let i = 0; i < 3; i++) {
                const toCenter = new Vec2(cx, cy).sub(positions[i]).norm();
                const tangent = new Vec2(-toCenter.y, toCenter.x);
                this.bodies.push(new Body({
                    pos: positions[i],
                    vel: tangent.mul(speed),
                    mass: 80, radius: 14, color: colors[i], label: labels[i], maxTrail: 500,
                }));
            }
            UI.setHint('Problema dos Três Corpos — caótico e imprevisível!');
        }

        if (name === 'asteroids') {
            // Central star
            this.bodies.push(new Body({
                pos: new Vec2(cx, cy), vel: new Vec2(0, 0),
                mass: 600, radius: 22, color: '#ffd43b', label: 'Estrela', fixed: true, maxTrail: 0,
            }));
            // Asteroid belt
            for (let i = 0; i < 60; i++) {
                const dist = PhysicsUtils.randomRange(140, 320);
                const angle = Math.random() * Math.PI * 2;
                const orbitalSpeed = Math.sqrt(this.params.G * 600 / dist) * 0.25;
                this.bodies.push(new Body({
                    pos: new Vec2(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist),
                    vel: new Vec2(-Math.sin(angle) * orbitalSpeed, Math.cos(angle) * orbitalSpeed),
                    mass: PhysicsUtils.randomRange(0.5, 3),
                    radius: PhysicsUtils.randomRange(2, 5),
                    color: `hsl(${PhysicsUtils.randomRange(30, 60)}, 30%, ${PhysicsUtils.randomRange(40, 70)}%)`,
                    maxTrail: 100,
                }));
            }
            UI.setHint('Cinturão de asteroides orbitando uma estrela');
        }
    },

    addRandomPlanet() {
        const w = this.renderer.width;
        const h = this.renderer.height;
        const cx = w / 2, cy = h / 2;
        const dist = PhysicsUtils.randomRange(80, Math.min(w, h) * 0.4);
        const angle = Math.random() * Math.PI * 2;
        const centralMass = this.bodies.length > 0 ? this.bodies[0].mass : 200;
        const orbitalSpeed = Math.sqrt(this.params.G * centralMass / dist) * 0.25;

        this.bodies.push(new Body({
            pos: new Vec2(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist),
            vel: new Vec2(-Math.sin(angle) * orbitalSpeed, Math.cos(angle) * orbitalSpeed),
            mass: PhysicsUtils.randomRange(3, 20),
            radius: PhysicsUtils.randomRange(4, 12),
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            maxTrail: 200,
        }));
    },

    setupInput(canvas) {
        const self = this;
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            self.dragStart = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
        });
        canvas.addEventListener('mouseup', (e) => {
            if (!self.dragStart) return;
            const rect = canvas.getBoundingClientRect();
            const end = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
            const diff = end.sub(self.dragStart);
            if (diff.mag() > 10) {
                self.bodies.push(new Body({
                    pos: self.dragStart.copy(),
                    vel: diff.mul(-0.5),
                    mass: PhysicsUtils.randomRange(5, 30),
                    radius: PhysicsUtils.randomRange(5, 14),
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    maxTrail: 200,
                }));
            }
            self.dragStart = null;
        });
    },

    update(dt) {
        this.time += dt;
        const G = this.params.G;

        // N-body gravitational forces
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];
                const dir = b.pos.sub(a.pos);
                const dist = Math.max(dir.mag(), a.radius + b.radius);
                const forceMag = G * a.mass * b.mass / (dist * dist);
                const force = dir.norm().mul(forceMag);

                if (!a.fixed) a.applyForce(force);
                if (!b.fixed) b.applyForce(force.mul(-1));
            }
        }

        for (const b of this.bodies) {
            b.update(dt);
            b.acc = new Vec2();
        }

        // Merge collisions
        if (this.params.mergeOnCollision) {
            for (let i = 0; i < this.bodies.length; i++) {
                for (let j = i + 1; j < this.bodies.length; j++) {
                    const a = this.bodies[i];
                    const b = this.bodies[j];
                    if (a.pos.dist(b.pos) < (a.radius + b.radius) * 0.6) {
                        for(let k=0; k<15; k++) {
                            this.explosions.push({
                                x: b.pos.x, y: b.pos.y,
                                vx: (Math.random()-0.5) * 100 + a.vel.x,
                                vy: (Math.random()-0.5) * 100 + a.vel.y,
                                color: b.color,
                                life: 1.0
                            });
                        }
                        
                        // Merge b into a
                        const totalMass = a.mass + b.mass;
                        a.vel = a.vel.mul(a.mass / totalMass).add(b.vel.mul(b.mass / totalMass));
                        a.mass = totalMass;
                        a.radius = Math.sqrt(a.radius * a.radius + b.radius * b.radius);
                        this.bodies.splice(j, 1);
                        j--;
                    }
                }
            }
        }
        
        if (this.explosions) {
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const ex = this.explosions[i];
                ex.x += ex.vx * dt;
                ex.y += ex.vy * dt;
                ex.life -= dt * 2.0;
                if (ex.life <= 0) this.explosions.splice(i, 1);
            }
        }
    },

    render(renderer) {
        renderer.clear('#050510');

        // Draw faint background stars
        const ctx = renderer.ctx;
        ctx.save();
        for (let i = 0; i < 80; i++) {
            const x = (Math.sin(i * 127.1) * 0.5 + 0.5) * renderer.width;
            const y = (Math.cos(i * 311.7) * 0.5 + 0.5) * renderer.height;
            const brightness = 0.1 + Math.sin(this.time * 0.5 + i) * 0.05;
            renderer.drawCircle(x, y, 1, `rgba(255,255,255,${brightness})`);
        }
        ctx.restore();

        // Draw trails
        if (this.params.showTrails) {
            for (const body of this.bodies) {
                if (body.trail.length > 1) {
                    renderer.drawTrail(body.trail, body.color, 1);
                }
            }
        }

        // Draw force lines
        if (this.params.showForces) {
            for (let i = 0; i < this.bodies.length; i++) {
                for (let j = i + 1; j < this.bodies.length; j++) {
                    const a = this.bodies[i];
                    const b = this.bodies[j];
                    const dist = a.pos.dist(b.pos);
                    const alpha = PhysicsUtils.clamp(1 - dist / 500, 0.02, 0.15);
                    renderer.drawLine(a.pos, b.pos, `rgba(132,94,247,${alpha})`, 1);
                }
            }
        }

        // Draw bodies with glow
        for (const body of this.bodies) {
            // Stars get extra glow
            const isLarge = body.mass > 50;
            if (isLarge) {
                renderer.drawGradientCircle(body.pos.x, body.pos.y, body.radius * 3,
                    body.color.replace(')', ',0.15)').replace('hsl', 'hsla').replace('#ffd43b', 'rgba(255,212,59,0.15)'),
                    'transparent'
                );
            }
            
            const origLabel = body.label;
            if (['☀️','🌍','🪐','🌕','🌑','🔴','⭐','🔵','☄️'].includes(body.label)) {
                body.label = ''; // Hide normal rendering text
            }
            renderer.drawBody(body, body.color);
            body.label = origLabel;

            if (['☀️','🌍','🪐','🌕','🌑','🔴','⭐','🔵','☄️'].includes(body.label)) {
                renderer.drawText(body.label, body.pos.x, body.pos.y, {
                   font: `${Math.max(body.radius * 1.5, 12)}px Arial`, align: 'center', baseline: 'middle'
                });
            }
        }
        
        if (this.explosions) {
            for (const ex of this.explosions) {
                renderer.drawCircle(ex.x, ex.y, 2 + ex.life * 4, ex.color.replace(')', `,${ex.life})`).replace('hsl', 'hsla').replace(/#[0-9a-fA-F]{6}/, (c) => `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},${ex.life})`));
            }
        }

        // Info
        let totalMass = 0, totalKE = 0, totalPE = 0;
        const MASS_SCALE = 1e24; // 1 unit = 10^24 kg
        const VEL_SCALE = 1000;  // 1 pixel/s = 1000 m/s
        const DIST_SCALE = 1e6;  // 1 pixel = 1000 km
        
        for (let i = 0; i < this.bodies.length; i++) {
            const b = this.bodies[i];
            totalMass += b.mass;
            
            const v_real = b.vel.mag() * VEL_SCALE;
            const m_real = b.mass * MASS_SCALE;
            totalKE += 0.5 * m_real * v_real * v_real;
            
            for (let j = i + 1; j < this.bodies.length; j++) {
                const b2 = this.bodies[j];
                const distReal = Math.max(b.pos.dist(b2.pos), 10) * DIST_SCALE;
                // Using real G for calculation of true PE relative to scaled bodies
                const realG = 6.674e-11; 
                totalPE -= (realG * m_real * (b2.mass * MASS_SCALE)) / distReal;
            }
        }
        
        if (!this.history) this.history = [];
        this.history.push({ ke: totalKE, pe: totalPE, t: totalKE + totalPE });
        if (this.history.length > 150) this.history.shift();

        if (this.history.length > 0) {
            const maxPoints = 150;
            const keSeries = { data: this.history.map(h => h.ke), color: '#339af0', label: 'E. Cinética', maxPoints, fill: false };
            const peSeries = { data: this.history.map(h => h.pe), color: '#ff6b6b', label: 'E. Potencial', maxPoints, fill: false };
            const tSeries = { data: this.history.map(h => h.t), color: '#ffd43b', label: 'E. Total', maxPoints, fill: false };
            renderer.drawChart('Gravitação Universal (Joules reais)', [keSeries, peSeries, tSeries], renderer.width - 370, 20, 350, 180);
            
            if (this.bodies.length > 0) {
                const maxSpeed = Math.max(...this.bodies.map(b => b.vel.mag() * VEL_SCALE / 1000));
                renderer.drawGauge('Vel. Máxima', maxSpeed, 0, 1000, 'km/s', renderer.width - 195, 290, 60, '#9d7cff');
            }
        }

        UI.updateInfo('grav-info', `
      Corpos: ${this.bodies.length}<br>
      Massa Total: ${totalMass.toFixed(1)} x 10²⁴ kg<br>
      E. Total: ${(totalKE + totalPE).toExponential(2)} J<br>
      Tempo: ${this.time.toFixed(1)}s
    `);

        UI.setInfoPills([
            `🪐 Gravidade`,
            `🔵 ${this.bodies.length} corpos`,
            `G = 6.674×10⁻¹¹`,
        ]);
    },

    destroy() {
        this.bodies = [];
        this.dragging = null;
        this.dragStart = null;
        this.history = [];
    }
};
