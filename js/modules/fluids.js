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
    params: {
        fluidDensity: 1.0,
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

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Cenário',
                    type: 'scenarios',
                    items: [
                        { label: 'Empuxo', color: '#339af0', active: true, onSelect: () => self.loadScenario('buoyancy') },
                        { label: 'Vasos Comunicantes', color: '#22b8cf', onSelect: () => self.loadScenario('communicating') },
                        { label: 'Fluxo Laminar', color: '#51cf66', onSelect: () => self.loadScenario('laminar') },
                        { label: 'Pressão', color: '#845ef7', onSelect: () => self.loadScenario('pressure') },
                    ]
                },
                {
                    title: 'Parâmetros',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'fl-density', label: 'Densidade do fluido', min: 0.3, max: 3.0, step: 0.1, value: self.params.fluidDensity, unit: ' g/cm³', onChange: v => { self.params.fluidDensity = v; } },
                        { kind: 'slider', id: 'fl-gravity', label: 'Gravidade', min: 1, max: 25, step: 0.5, value: self.params.gravity, unit: ' m/s²', onChange: v => { self.params.gravity = v; } },
                        { kind: 'slider', id: 'fl-visc', label: 'Viscosidade', min: 0, max: 0.1, step: 0.005, value: self.params.viscosity, unit: '', onChange: v => { self.params.viscosity = v; } },
                        { kind: 'checkbox', id: 'fl-press', label: 'Mostrar pressão', checked: true, onChange: v => { self.params.showPressure = v; } },
                        { kind: 'button', id: 'fl-add', label: '📦 Adicionar Objeto', onClick: () => self.addObject() },
                        { kind: 'button', id: 'fl-reset', label: '↺ Reiniciar', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Informações',
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
        const w = this.renderer.width;
        const h = this.renderer.height;
        this.waterLevel = h * 0.35;

        if (name === 'buoyancy') {
            // Floating objects with different densities
            this.objects = [
                { x: w * 0.25, y: h * 0.2, vx: 0, vy: 0, width: 50, height: 50, density: 0.5, color: '#ffd43b', label: 'Madeira (0.5)' },
                { x: w * 0.45, y: h * 0.15, vx: 0, vy: 0, width: 40, height: 40, density: 1.5, color: '#adb5bd', label: 'Pedra (1.5)' },
                { x: w * 0.65, y: h * 0.25, vx: 0, vy: 0, width: 45, height: 45, density: 0.9, color: '#ff922b', label: 'Plástico (0.9)' },
                { x: w * 0.35, y: h * 0.1, vx: 0, vy: 0, width: 35, height: 35, density: 7.8, color: '#868e96', label: 'Ferro (7.8)' },
            ];
            // Water particles for visual
            for (let i = 0; i < 120; i++) {
                this.particles.push({
                    x: PhysicsUtils.randomRange(10, w - 10),
                    y: PhysicsUtils.randomRange(this.waterLevel, h - 10),
                    vx: PhysicsUtils.randomRange(-5, 5),
                    vy: PhysicsUtils.randomRange(-3, 3),
                    radius: 3,
                });
            }
            UI.setHint('Empuxo — objetos de diferentes densidades na água');
        }

        if (name === 'communicating') {
            // U-tube particles
            for (let i = 0; i < 200; i++) {
                const side = Math.random() > 0.7 ? 'right' : 'left';
                const tubeX = side === 'left' ? w * 0.25 : w * 0.65;
                this.particles.push({
                    x: tubeX + PhysicsUtils.randomRange(-40, 40),
                    y: PhysicsUtils.randomRange(h * 0.3, h * 0.8),
                    vx: PhysicsUtils.randomRange(-3, 3),
                    vy: PhysicsUtils.randomRange(-3, 3),
                    radius: 3,
                    tube: side,
                });
            }
            UI.setHint('Vasos comunicantes — o líquido busca equilíbrio');
        }

        if (name === 'laminar') {
            // Flow particles
            for (let i = 0; i < 150; i++) {
                this.particles.push({
                    x: PhysicsUtils.randomRange(0, w),
                    y: PhysicsUtils.randomRange(h * 0.2, h * 0.8),
                    vx: PhysicsUtils.randomRange(20, 80),
                    vy: PhysicsUtils.randomRange(-5, 5),
                    radius: 2.5,
                });
            }
            UI.setHint('Fluxo laminar em um tubo — perfil de velocidade parabólico');
        }

        if (name === 'pressure') {
            this.waterLevel = h * 0.2;
            for (let i = 0; i < 100; i++) {
                this.particles.push({
                    x: PhysicsUtils.randomRange(w * 0.15, w * 0.85),
                    y: PhysicsUtils.randomRange(this.waterLevel, h - 20),
                    vx: PhysicsUtils.randomRange(-5, 5),
                    vy: PhysicsUtils.randomRange(-3, 3),
                    radius: 3,
                });
            }
            UI.setHint('Pressão hidrostática — aumenta com a profundidade');
        }
    },

    addObject() {
        const w = this.renderer.width;
        const density = PhysicsUtils.randomRange(0.3, 5);
        const size = PhysicsUtils.randomRange(25, 55);
        this.objects.push({
            x: w * 0.5 + PhysicsUtils.randomRange(-100, 100),
            y: 50,
            vx: 0,
            vy: 0,
            width: size,
            height: size,
            density: parseFloat(density.toFixed(1)),
            color: `hsl(${Math.random() * 360}, 60%, 55%)`,
            label: `ρ=${density.toFixed(1)}`,
        });
    },

    update(dt) {
        this.time += dt;
        const g = this.params.gravity;
        const fluidDensity = this.params.fluidDensity;
        const visc = this.params.viscosity;
        const w = this.renderer.width;
        const h = this.renderer.height;

        // Buoyancy scenario — update objects
        if (this.scenario === 'buoyancy' || this.scenario === 'pressure') {
            for (const obj of this.objects) {
                // Gravity
                obj.vy += g * 10 * dt;

                // Buoyancy
                const objBottom = obj.y + obj.height;
                const objTop = obj.y;
                const submergedTop = Math.max(objTop, this.waterLevel);
                const submergedBottom = Math.min(objBottom, h - 10);
                const submergedHeight = Math.max(0, submergedBottom - submergedTop);
                const submergedFraction = submergedHeight / obj.height;

                if (submergedFraction > 0) {
                    const buoyancyForce = -fluidDensity * g * 10 * obj.width * submergedHeight * 0.01;
                    const dragForce = -visc * obj.vy * 50;
                    obj.vy += (buoyancyForce / (obj.density * obj.width * obj.height * 0.01) + dragForce) * dt;
                }

                // Drag in fluid
                if (objBottom > this.waterLevel) {
                    obj.vx *= (1 - visc * 10 * dt);
                    obj.vy *= (1 - visc * 5 * dt);
                }

                obj.x += obj.vx * dt;
                obj.y += obj.vy * dt;

                // Floor
                if (obj.y + obj.height > h - 10) {
                    obj.y = h - 10 - obj.height;
                    obj.vy *= -0.3;
                }
                // Ceiling
                if (obj.y < 10) { obj.y = 10; obj.vy = Math.abs(obj.vy) * 0.3; }
                // Walls
                if (obj.x < 10) { obj.x = 10; obj.vx *= -0.5; }
                if (obj.x + obj.width > w - 10) { obj.x = w - 10 - obj.width; obj.vx *= -0.5; }
            }
        }

        // Update fluid particles
        for (const p of this.particles) {
            if (this.scenario === 'laminar') {
                // Parabolic flow profile
                const centerY = h * 0.5;
                const pipeRadius = h * 0.3;
                const distFromCenter = Math.abs(p.y - centerY);
                const speedFactor = Math.max(0, 1 - (distFromCenter / pipeRadius) ** 2);
                p.vx = PhysicsUtils.lerp(p.vx, 80 * speedFactor, 0.05);
                p.vy *= (1 - visc * 10);

                // Keep in pipe
                if (p.y < centerY - pipeRadius) { p.y = centerY - pipeRadius; p.vy = Math.abs(p.vy); }
                if (p.y > centerY + pipeRadius) { p.y = centerY + pipeRadius; p.vy = -Math.abs(p.vy); }
            } else {
                // Gentle random motion
                p.vx += (Math.random() - 0.5) * 20 * dt;
                p.vy += (Math.random() - 0.5) * 20 * dt;
                p.vx *= (1 - visc * 5);
                p.vy *= (1 - visc * 5);
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Bounds
            if (this.scenario !== 'communicating') {
                if (p.x < 5) { p.x = this.scenario === 'laminar' ? w : 5; }
                if (p.x > w - 5) { p.x = this.scenario === 'laminar' ? 5 : w - 5; }
                if (p.y < this.waterLevel) { p.y = this.waterLevel; p.vy = Math.abs(p.vy) * 0.5; }
                if (p.y > h - 5) { p.y = h - 5; p.vy = -Math.abs(p.vy) * 0.5; }
            }
        }
    },

    render(renderer) {
        renderer.clear('#060810');
        const ctx = renderer.ctx;
        const w = renderer.width;
        const h = renderer.height;

        if (this.scenario === 'buoyancy' || this.scenario === 'pressure') {
            // Water body
            const gradient = ctx.createLinearGradient(0, this.waterLevel, 0, h);
            gradient.addColorStop(0, 'rgba(51,154,240,0.08)');
            gradient.addColorStop(1, 'rgba(51,154,240,0.2)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, this.waterLevel, w, h - this.waterLevel);

            // Water surface
            ctx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const waveY = this.waterLevel + Math.sin(x * 0.02 + this.time * 2) * 3;
                if (x === 0) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
            }
            ctx.strokeStyle = 'rgba(51,154,240,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pressure gradient indicators
            if (this.params.showPressure) {
                for (let depth = 0; depth < 5; depth++) {
                    const y = this.waterLevel + (h - this.waterLevel) * (depth + 1) / 6;
                    const pressure = this.params.fluidDensity * this.params.gravity * (y - this.waterLevel) * 0.01;
                    renderer.drawLine(new Vec2(15, y), new Vec2(45, y), 'rgba(132,94,247,0.4)', 1);
                    renderer.drawText(`P = ${pressure.toFixed(1)} kPa`, 50, y - 6, {
                        color: 'rgba(132,94,247,0.5)', font: '9px JetBrains Mono'
                    });
                }
            }
        }

        if (this.scenario === 'laminar') {
            // Pipe walls
            const centerY = h * 0.5;
            const pipeRadius = h * 0.3;
            renderer.drawLine(new Vec2(0, centerY - pipeRadius), new Vec2(w, centerY - pipeRadius), 'rgba(255,255,255,0.2)', 2);
            renderer.drawLine(new Vec2(0, centerY + pipeRadius), new Vec2(w, centerY + pipeRadius), 'rgba(255,255,255,0.2)', 2);

            // Parabolic velocity profile
            ctx.beginPath();
            for (let y = centerY - pipeRadius; y <= centerY + pipeRadius; y += 3) {
                const distFromCenter = Math.abs(y - centerY);
                const speed = 80 * Math.max(0, 1 - (distFromCenter / pipeRadius) ** 2);
                const x = 50 + speed;
                if (y === centerY - pipeRadius) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(81,207,102,0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
            renderer.drawText('Perfil de Velocidade', 50, centerY - pipeRadius - 20, {
                color: 'rgba(81,207,102,0.5)', font: '10px Inter'
            });
        }

        if (this.scenario === 'communicating') {
            // U-tube shape
            const tubeW = 100;
            const leftX = w * 0.25 - tubeW / 2;
            const rightX = w * 0.65 - tubeW / 2;
            const bottomY = h * 0.8;
            const topY = h * 0.2;
            const connY = h * 0.7;

            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            // Left tube
            ctx.strokeRect(leftX, topY, tubeW, bottomY - topY);
            // Right tube
            ctx.strokeRect(rightX, topY, tubeW, bottomY - topY);
            // Bottom connection
            ctx.fillStyle = 'rgba(51,154,240,0.05)';
            ctx.fillRect(leftX, connY, rightX + tubeW - leftX, bottomY - connY);
        }

        // Draw fluid particles
        for (const p of this.particles) {
            let speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            let alpha = 0.4;
            let color;
            if (this.params.showVelocity && this.scenario === 'laminar') {
                const hue = PhysicsUtils.clamp(200 - speed * 2, 0, 240);
                color = `hsla(${hue}, 70%, 55%, 0.5)`;
            } else {
                const depth = this.scenario === 'buoyancy' || this.scenario === 'pressure'
                    ? (p.y - this.waterLevel) / (h - this.waterLevel) : 0.5;
                color = `rgba(51,154,240,${0.3 + depth * 0.3})`;
            }
            renderer.drawCircle(p.x, p.y, p.radius, color);
        }

        // Draw objects
        for (const obj of this.objects) {
            ctx.save();
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            ctx.restore();

            // Label
            renderer.drawText(obj.label, obj.x + obj.width / 2, obj.y - 10, {
                color: 'rgba(255,255,255,0.6)', font: '10px Inter', align: 'center'
            });

            // Buoyancy force arrow (when submerged)
            if (obj.y + obj.height > this.waterLevel) {
                const submerged = Math.min(obj.y + obj.height, h) - Math.max(obj.y, this.waterLevel);
                const forceLen = PhysicsUtils.clamp(submerged * this.params.fluidDensity * 0.5, 0, 80);
                if (forceLen > 5) {
                    renderer.drawArrow(
                        new Vec2(obj.x + obj.width / 2, obj.y + obj.height),
                        new Vec2(obj.x + obj.width / 2, obj.y + obj.height - forceLen),
                        'rgba(81,207,102,0.6)', 2, 6
                    );
                }
            }
        }

        // Info
        UI.updateInfo('fluids-info', `
      ρ Fluido: ${this.params.fluidDensity} g/cm³<br>
      Gravidade: ${this.params.gravity} m/s²<br>
      Viscosidade: ${this.params.viscosity}<br>
      Objetos: ${this.objects.length}<br>
      Partículas: ${this.particles.length}
    `);

        UI.setInfoPills([
            `💧 Fluidos`,
            `ρ = ${this.params.fluidDensity} g/cm³`,
            `g = ${this.params.gravity} m/s²`,
        ]);
    },

    destroy() {
        this.particles = [];
        this.objects = [];
    }
};
