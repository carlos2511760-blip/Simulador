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
        friction: 0.005,
        trackType: 'Rampa U',
        showHeightGrid: false,
    },
    ball: null,
    time: 0,
    trackPoints: [],
    energyHistory: [],

    init(renderer) {
        this.renderer = renderer;
        this.world = new PhysicsWorld();
        this.time = 0;
        this.energyHistory = [];
        this.loadScenario('skate');
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Cenário',
                    type: 'scenarios',
                    items: [
                        { label: 'Pista de Velocidade', color: '#ffd43b', active: true, onSelect: () => self.loadScenario('skate') },
                        { label: 'Queda Livre', color: '#ff6b6b', onSelect: () => self.loadScenario('freefall') },
                        { label: 'Mola Elástica', color: '#51cf66', onSelect: () => self.loadScenario('spring') },
                        { label: 'Pêndulo Energético', color: '#845ef7', onSelect: () => self.loadScenario('pendulum_energy') },
                    ]
                },
                {
                    title: 'Parâmetros',
                    type: 'controls',
                    items: [
                        { kind: 'select', id: 'en-track', label: 'Formato da Pista', options: ['Rampa U', 'Rampa W', 'Colinas', 'Complexa'], value: self.params.trackType, onChange: v => { self.params.trackType = v; self.loadScenario(self.scenario); } },
                        { kind: 'slider', id: 'en-gravity', label: 'Gravidade', min: 1, max: 25, step: 0.5, value: self.params.gravity, unit: ' m/s²', onChange: v => { self.params.gravity = v; } },
                        { kind: 'slider', id: 'en-mass', label: 'Massa', min: 1, max: 20, step: 0.5, value: self.params.mass, unit: ' kg', onChange: v => { self.params.mass = v; } },
                        { kind: 'slider', id: 'en-friction', label: 'Atrito', min: 0, max: 0.05, step: 0.001, value: self.params.friction, unit: '', onChange: v => { self.params.friction = v; } },
                        { kind: 'checkbox', id: 'en-show', label: 'Barras de energia', checked: self.params.showEnergy, onChange: v => { self.params.showEnergy = v; } },
                        { kind: 'checkbox', id: 'en-grid', label: 'Grade de altura', checked: self.params.showHeightGrid, onChange: v => { self.params.showHeightGrid = v; } },
                        { kind: 'button', id: 'en-reset', label: '↺ Reiniciar', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Energia',
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
        const w = this.renderer.width;
        const h = this.renderer.height;

        if (name === 'skate' || name === 'rollercoaster') {
            this.scenario = 'skate';
            this.trackPoints = this.generateTrack(w, h, this.params.trackType);
            this.ball = {
                t: 0, // parameter along track
                speed: 0,
                pos: this.trackPoints[0].copy(),
                radius: 12,
                color: '#ffd43b',
                trail: [],
            };
            UI.setHint('Pista de Velocidade — altere o formato da pista e analise a energia.');
        }

        if (name === 'freefall') {
            this.ball = {
                pos: new Vec2(w / 2, 80),
                vel: new Vec2(0, 0),
                radius: 15,
                color: '#ff6b6b',
                trail: [],
                groundY: h - 60,
            };
            UI.setHint('Queda livre — energia potencial → cinética');
        }

        if (name === 'spring') {
            this.ball = {
                pos: new Vec2(w / 2, h / 2),
                vel: new Vec2(0, 0),
                restX: w / 2,
                restY: h / 2,
                displacement: 150,
                radius: 18,
                color: '#51cf66',
                trail: [],
                k: 2, // spring constant
                phase: 0,
            };
            UI.setHint('Mola elástica — energia potencial elástica ↔ cinética');
        }

        if (name === 'pendulum_energy') {
            const pivotX = w / 2;
            const pivotY = h * 0.15;
            const length = h * 0.4;
            this.ball = {
                pos: new Vec2(pivotX + Math.sin(1.2) * length, pivotY + Math.cos(1.2) * length),
                vel: new Vec2(0, 0),
                pivot: new Vec2(pivotX, pivotY),
                length: length,
                angle: 1.2,
                angularVel: 0,
                radius: 16,
                color: '#845ef7',
                trail: [],
            };
            UI.setHint('Pêndulo — troca contínua entre EP e EC');
        }
    },

    generateTrack(w, h, type) {
        const points = [];
        const numPoints = 200;
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const x = t * w;
            let y = 0;
            const baseY = h * 0.2;
            const bottomY = h - 60;
            const dr = bottomY - baseY;

            if (type === 'Rampa U') {
                let tt = t * 2 - 1;
                y = bottomY - dr * Math.pow(tt, 2);
            } else if (type === 'Rampa W') {
                y = baseY + (dr / 2) - (dr / 2) * Math.cos(t * Math.PI * 4);
            } else if (type === 'Colinas') {
                y = baseY + (dr / 2) - (dr / 2) * Math.cos(t * Math.PI * 6);
            } else { // Complexa
                y = baseY - Math.sin(t * Math.PI * 2) * h * 0.2 - Math.sin(t * Math.PI * 4) * h * 0.08 + Math.sin(t * Math.PI * 6) * h * 0.04;
            }
            points.push(new Vec2(x, PhysicsUtils.clamp(y, 10, h + 100)));
        }
        return points;
    },

    update(dt) {
        this.time += dt;
        const g = this.params.gravity;
        const friction = this.params.friction;

        if (this.scenario === 'skate' && this.ball) {
            const pts = this.trackPoints;
            let idx = Math.floor(this.ball.t * (pts.length - 1));
            idx = PhysicsUtils.clamp(idx, 0, pts.length - 2);
            const next = idx + 1;

            const dx = pts[next].x - pts[idx].x;
            const dy = pts[next].y - pts[idx].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);
            const sinAngle = dy / segLen;

            // Acceleration along track
            const accel = g * 10 * sinAngle - friction * this.ball.speed * 10;
            this.ball.speed += accel * dt;

            // Move along track
            this.ball.t += (this.ball.speed * dt) / (this.renderer.width);
            if (this.ball.t > 1) this.ball.t = 0;
            if (this.ball.t < 0) this.ball.t = 1;

            const finalIdx = PhysicsUtils.clamp(Math.floor(this.ball.t * (pts.length - 1)), 0, pts.length - 1);
            this.ball.pos = pts[finalIdx].copy();
            this.ball.trail.push(this.ball.pos.copy());
            if (this.ball.trail.length > 60) this.ball.trail.shift();
        }

        if (this.scenario === 'freefall' && this.ball) {
            this.ball.vel.y += g * 10 * dt;
            this.ball.vel.y *= (1 - friction);
            this.ball.pos = this.ball.pos.add(new Vec2(this.ball.vel.x * dt, this.ball.vel.y * dt));

            if (this.ball.pos.y + this.ball.radius > this.ball.groundY) {
                this.ball.pos.y = this.ball.groundY - this.ball.radius;
                this.ball.vel.y *= -0.85;
            }
            this.ball.trail.push(this.ball.pos.copy());
            if (this.ball.trail.length > 100) this.ball.trail.shift();
        }

        if (this.scenario === 'spring' && this.ball) {
            this.ball.phase += dt * 3;
            const damping = 1 - friction * 10;
            this.ball.displacement *= Math.pow(damping, dt);
            this.ball.pos.x = this.ball.restX + Math.cos(this.ball.phase) * this.ball.displacement;
            this.ball.vel = new Vec2(-Math.sin(this.ball.phase) * this.ball.displacement * 3, 0);
            this.ball.trail.push(this.ball.pos.copy());
            if (this.ball.trail.length > 100) this.ball.trail.shift();
        }

        if (this.scenario === 'pendulum_energy' && this.ball) {
            const angularAccel = -(g * 10 / this.ball.length) * Math.sin(this.ball.angle);
            this.ball.angularVel += angularAccel * dt;
            this.ball.angularVel *= (1 - friction * 5);
            this.ball.angle += this.ball.angularVel * dt;
            this.ball.pos = new Vec2(
                this.ball.pivot.x + Math.sin(this.ball.angle) * this.ball.length,
                this.ball.pivot.y + Math.cos(this.ball.angle) * this.ball.length,
            );
            this.ball.trail.push(this.ball.pos.copy());
            if (this.ball.trail.length > 150) this.ball.trail.shift();
        }

        // Record energy history
        if (this.ball) {
            const h = this.renderer.height;
            const mass = this.params.mass;
            let ke = 0, pe = 0;

            if (this.scenario === 'skate') {
                ke = 0.5 * mass * this.ball.speed * this.ball.speed * 1000;
                pe = mass * g * (h - this.ball.pos.y) * 10;
            } else if (this.scenario === 'freefall') {
                ke = 0.5 * mass * (this.ball.vel.y * this.ball.vel.y) * 0.1;
                pe = mass * g * (this.ball.groundY - this.ball.pos.y) * 0.1;
            } else if (this.scenario === 'spring') {
                const disp = this.ball.pos.x - this.ball.restX;
                ke = 0.5 * mass * this.ball.vel.x * this.ball.vel.x * 0.1;
                pe = 0.5 * this.ball.k * disp * disp * 0.5;
            } else if (this.scenario === 'pendulum_energy') {
                const linearVel = this.ball.angularVel * this.ball.length;
                ke = 0.5 * mass * linearVel * linearVel * 0.1;
                pe = mass * g * (this.ball.length - this.ball.length * Math.cos(this.ball.angle)) * 0.5;
            }

            this.energyHistory.push({ ke, pe, total: ke + pe });
            if (this.energyHistory.length > 200) this.energyHistory.shift();
        }
    },

    render(renderer) {
        renderer.clear('#08080f');
        renderer.drawGrid(60, 'rgba(255,212,59,0.02)');

        const w = renderer.width;
        const h = renderer.height;

        // Scenario-specific rendering
        if (this.scenario === 'skate') {
            // Height grid
            if (this.params.showHeightGrid) {
                for (let i = 0; i <= 10; i++) {
                    const hy = h - 60 - ((h - 60 - h * 0.2) / 10) * i;
                    if (hy > 0) {
                        renderer.drawLine(new Vec2(0, hy), new Vec2(w, hy), 'rgba(255,255,255,0.06)', 1, [2, 4]);
                        renderer.drawText(`${(i * 10)}m`, 10, hy - 15, { color: 'rgba(255,255,255,0.2)', font: '10px Inter' });
                    }
                }
            }
            
            // Draw track
            const ctx = renderer.ctx;
            ctx.beginPath();
            for (let i = 0; i < this.trackPoints.length; i++) {
                const p = this.trackPoints[i];
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = 'rgba(255,212,59,0.3)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        if (this.scenario === 'freefall') {
            // Ground
            renderer.drawRect(0, this.ball.groundY, w, h - this.ball.groundY, 'rgba(255,107,107,0.05)');
            renderer.drawLine(new Vec2(0, this.ball.groundY), new Vec2(w, this.ball.groundY), 'rgba(255,107,107,0.3)', 2);
            // Height indicator
            if (this.ball) {
                renderer.drawLine(
                    new Vec2(w * 0.1, this.ball.pos.y),
                    new Vec2(w * 0.1, this.ball.groundY),
                    'rgba(255,212,59,0.3)', 1, [4, 4]
                );
                renderer.drawText(`h = ${((this.ball.groundY - this.ball.pos.y) / 10).toFixed(1)} m`,
                    w * 0.1 + 10, (this.ball.pos.y + this.ball.groundY) / 2,
                    { color: 'rgba(255,212,59,0.6)', font: '11px JetBrains Mono' }
                );
            }
        }

        if (this.scenario === 'spring') {
            // Draw spring
            renderer.drawLine(
                new Vec2(this.ball.restX - 200, h / 2),
                new Vec2(this.ball.restX + 200, h / 2),
                'rgba(81,207,102,0.15)', 1, [4, 4]
            );
            // Rest position line
            renderer.drawLine(
                new Vec2(this.ball.restX, h / 2 - 40),
                new Vec2(this.ball.restX, h / 2 + 40),
                'rgba(255,255,255,0.1)', 1, [2, 4]
            );
            // Draw zigzag spring
            if (this.ball) {
                const springStart = new Vec2(w * 0.1, h / 2);
                const springEnd = this.ball.pos;
                const ctx = renderer.ctx;
                ctx.save();
                ctx.strokeStyle = 'rgba(81,207,102,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const segs = 20;
                for (let i = 0; i <= segs; i++) {
                    const t = i / segs;
                    const x = springStart.x + (springEnd.x - springStart.x) * t;
                    const zigzag = (i % 2 === 0 ? 1 : -1) * 10 * (i > 0 && i < segs ? 1 : 0);
                    const y = h / 2 + zigzag;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();
                // Wall
                renderer.drawRect(w * 0.1 - 10, h / 2 - 30, 10, 60, 'rgba(255,255,255,0.1)');
            }
        }

        if (this.scenario === 'pendulum_energy' && this.ball) {
            renderer.drawLine(this.ball.pivot, this.ball.pos, 'rgba(255,255,255,0.3)', 2);
            renderer.drawCircle(this.ball.pivot.x, this.ball.pivot.y, 5, 'rgba(255,255,255,0.5)');
            // Reference line
            renderer.drawLine(
                this.ball.pivot,
                new Vec2(this.ball.pivot.x, this.ball.pivot.y + this.ball.length),
                'rgba(255,255,255,0.05)', 1, [3, 5]
            );
        }

        // Draw ball
        if (this.ball) {
            // Trail
            if (this.ball.trail.length > 1) {
                renderer.drawTrail(this.ball.trail, this.ball.color, 1.5);
            }
            renderer.drawBody(new Body({
                pos: this.ball.pos,
                radius: this.ball.radius,
                color: this.ball.color,
            }), this.ball.color);
        }

        // Energy bars
        if (this.params.showEnergy && this.energyHistory.length > 0) {
            const latest = this.energyHistory[this.energyHistory.length - 1];
            const maxE = Math.max(latest.total, 1);
            const barW = 180;
            const barH = 14;
            const barX = w - barW - 20;
            const barY = 20;

            // Background
            renderer.drawRect(barX - 10, barY - 10, barW + 20, 100, 'rgba(0,0,0,0.5)');

            // KE bar
            renderer.drawText('EC', barX - 8, barY + 2, { color: '#ff6b6b', font: '10px JetBrains Mono', align: 'right' });
            renderer.drawRect(barX, barY, barW, barH, 'rgba(255,255,255,0.05)');
            renderer.drawRect(barX, barY, barW * PhysicsUtils.clamp(latest.ke / maxE, 0, 1), barH, '#ff6b6b');
            renderer.drawText(latest.ke.toFixed(0) + ' J', barX + barW + 5, barY + 2, { color: '#ff6b6b', font: '10px JetBrains Mono' });

            // PE bar
            renderer.drawText('EP', barX - 8, barY + barH + 8, { color: '#339af0', font: '10px JetBrains Mono', align: 'right' });
            renderer.drawRect(barX, barY + barH + 6, barW, barH, 'rgba(255,255,255,0.05)');
            renderer.drawRect(barX, barY + barH + 6, barW * PhysicsUtils.clamp(latest.pe / maxE, 0, 1), barH, '#339af0');
            renderer.drawText(latest.pe.toFixed(0) + ' J', barX + barW + 5, barY + barH + 8, { color: '#339af0', font: '10px JetBrains Mono' });

            // Total bar
            renderer.drawText('ET', barX - 8, barY + (barH + 6) * 2 + 2, { color: '#51cf66', font: '10px JetBrains Mono', align: 'right' });
            renderer.drawRect(barX, barY + (barH + 6) * 2, barW, barH, 'rgba(255,255,255,0.05)');
            renderer.drawRect(barX, barY + (barH + 6) * 2, barW * PhysicsUtils.clamp(latest.total / maxE, 0, 1), barH, '#51cf66');
            renderer.drawText(latest.total.toFixed(0) + ' J', barX + barW + 5, barY + (barH + 6) * 2 + 2, { color: '#51cf66', font: '10px JetBrains Mono' });

            // Energy graph
            const graphX = barX;
            const graphY = barY + 80;
            const graphW = barW;
            const graphH = 60;
            renderer.drawRect(graphX, graphY, graphW, graphH, 'rgba(255,255,255,0.03)');

            if (this.energyHistory.length > 2) {
                const maxHist = Math.max(...this.energyHistory.map(e => e.total), 1);
                const ctx = renderer.ctx;

                // KE line
                ctx.beginPath();
                for (let i = 0; i < this.energyHistory.length; i++) {
                    const x = graphX + (i / this.energyHistory.length) * graphW;
                    const y = graphY + graphH - (this.energyHistory[i].ke / maxHist) * graphH;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = 'rgba(255,107,107,0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // PE line
                ctx.beginPath();
                for (let i = 0; i < this.energyHistory.length; i++) {
                    const x = graphX + (i / this.energyHistory.length) * graphW;
                    const y = graphY + graphH - (this.energyHistory[i].pe / maxHist) * graphH;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = 'rgba(51,154,240,0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        const latest = this.energyHistory.length > 0 ? this.energyHistory[this.energyHistory.length - 1] : { ke: 0, pe: 0, total: 0 };
        UI.updateInfo('energy-info', `
      EC (Cinética): ${latest.ke.toFixed(1)} J<br>
      EP (Potencial): ${latest.pe.toFixed(1)} J<br>
      ET (Total): ${latest.total.toFixed(1)} J<br>
      Massa: ${this.params.mass} kg
    `);

        UI.setInfoPills([
            `⚡ Energia`,
            `EC = ${latest.ke.toFixed(0)} J`,
            `EP = ${latest.pe.toFixed(0)} J`,
        ]);
    },

    destroy() {
        this.ball = null;
        this.energyHistory = [];
        this.trackPoints = [];
    }
};
