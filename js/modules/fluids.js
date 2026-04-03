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
        if (type === 'Água 💧') { this.params.fluidDensity = 1000; this.params.viscosity = 0.02; }
        if (type === 'Óleo 🛢️') { this.params.fluidDensity = 800; this.params.viscosity = 0.08; }
        if (type === 'Mel 🍯') { this.params.fluidDensity = 1420; this.params.viscosity = 0.4; }
        if (type === 'Mercúrio 🧪') { this.params.fluidDensity = 13600; this.params.viscosity = 0.01; }
        if (type === 'Mar Morto 🌊') { this.params.fluidDensity = 1240; this.params.viscosity = 0.03; }
        
        const slideVal = document.getElementById('val-fl-density');
        const slideInput = document.getElementById('ctrl-fl-density');
        if (slideInput && slideVal) {
            slideInput.value = this.params.fluidDensity;
            slideVal.textContent = this.params.fluidDensity;
        }
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
                    title: 'Parâmetros (SI Units)',
                    type: 'controls',
                    items: [
                        { kind: 'select', id: 'fl-type', label: 'Escolha o Líquido', options: ['Água 💧', 'Óleo 🛢️', 'Mel 🍯', 'Mercúrio 🧪', 'Mar Morto 🌊'], value: self.params.fluidType, onChange: v => { self.changeFluid(v); } },
                        { kind: 'slider', id: 'fl-density', label: 'Densidade (kg/m³)', min: 100, max: 15000, step: 10, value: self.params.fluidDensity, unit: '', onChange: v => { self.params.fluidDensity = v; } },
                        { kind: 'slider', id: 'fl-gravity', label: 'Gravidade', min: 1, max: 25, step: 0.5, value: self.params.gravity, unit: ' m/s²', onChange: v => { self.params.gravity = v; } },
                        { kind: 'slider', id: 'fl-visc', label: 'Viscosidade', min: 0, max: 0.5, step: 0.01, value: self.params.viscosity, unit: '', onChange: v => { self.params.viscosity = v; } },
                        { kind: 'button', id: 'fl-add', label: '🎈 Soltar Objeto Surpresa!', onClick: () => self.addObject() },
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
        const w = this.renderer.width;
        const h = this.renderer.height;
        this.waterLevel = h * 0.35;

        if (name === 'buoyancy') {
            // Floating objects with different densities in SI units
            this.objects = [
                { x: w * 0.25, y: h * 0.2, vx: 0, vy: 0, width: 60, height: 60, density: 500, emoji: '🪵', label: 'Madeira' },
                { x: w * 0.5, y: h * 0.1, vx: 0, vy: 0, width: 45, height: 45, density: 7800, emoji: '⚓', label: 'Âncora' },
                { x: w * 0.75, y: h * 0.15, vx: 0, vy: 0, width: 55, height: 55, density: 920, emoji: '🧊', label: 'Gelo' },
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
        const types = [
            { d: 500, e: '🪵', l: 'Madeira', s: 60 },
            { d: 920, e: '🧊', l: 'Gelo', s: 55 },
            { d: 7800, e: '⚓', l: 'Ferro', s: 45 },
            { d: 10, e: '🎈', l: 'Balão', s: 45 },
            { d: 2000, e: '🧱', l: 'Tijolo', s: 40 },
            { d: 1040, e: '🍉', l: 'Melancia', s: 55 },
        ];
        const choice = types[Math.floor(Math.random() * types.length)];
        this.objects.push({
            x: w * 0.5 + PhysicsUtils.randomRange(-150, 150),
            y: 20,
            vx: PhysicsUtils.randomRange(-20, 20),
            vy: PhysicsUtils.randomRange(0, 50),
            width: choice.s,
            height: choice.s,
            density: choice.d,
            emoji: choice.e,
            label: choice.l,
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

                // Splash detection
                const wasAbove = obj.y + obj.height <= this.waterLevel;
                
                // Buoyancy
                const objBottom = obj.y + obj.height;
                const objTop = obj.y;
                const submergedTop = Math.max(objTop, this.waterLevel);
                const submergedBottom = Math.min(objBottom, h - 10);
                const submergedHeight = Math.max(0, submergedBottom - submergedTop);
                const submergedFraction = submergedHeight / obj.height;

                const isBelow = obj.y + obj.height > this.waterLevel;
                if (wasAbove && isBelow && obj.vy > 30) {
                    for(let s=0; s<15; s++) {
                        this.splashes.push({
                            x: obj.x + Math.random()*obj.width,
                            y: this.waterLevel,
                            vx: (Math.random()-0.5) * obj.vy * 0.4,
                            vy: -Math.random() * obj.vy * 0.5,
                            life: 1.0
                        });
                    }
                }

                if (submergedFraction > 0) {
                    // F_b = density_fluid * g * V_submerged
                    // F_g = density_obj * g * V_obj (done previously)
                    // Therefore acc_b = SubmergedFraction * (density_fluid / density_obj) * g
                    const accBuoyancy = -g * 10 * submergedFraction * (fluidDensity / obj.density);
                    const dragForce = -visc * obj.vy * 50;
                    obj.vy += (accBuoyancy + dragForce) * dt;
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
        
        if (this.splashes) {
            for (let i = this.splashes.length - 1; i >= 0; i--) {
                const s = this.splashes[i];
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.vy += g * 10 * dt;
                s.life -= dt * 2;
                if (s.life <= 0 || s.y > h) this.splashes.splice(i, 1);
            }
        }
    },

    render(renderer) {
        renderer.clear('#060810');
        const ctx = renderer.ctx;
        const w = renderer.width;
        const h = renderer.height;

        if (this.scenario === 'buoyancy' || this.scenario === 'pressure') {
            let fColorTop = 'rgba(51,154,240,0.1)';
            let fColorBot = 'rgba(51,154,240,0.4)';
            if (this.params.fluidType.includes('Óleo')) { fColorTop = 'rgba(255,212,59,0.3)'; fColorBot = 'rgba(255,212,59,0.6)'; }
            if (this.params.fluidType.includes('Mel')) { fColorTop = 'rgba(232,89,12,0.4)'; fColorBot = 'rgba(232,89,12,0.8)'; }
            if (this.params.fluidType.includes('Mercúrio')) { fColorTop = 'rgba(173,181,189,0.6)'; fColorBot = 'rgba(134,142,150,0.9)'; }
            if (this.params.fluidType.includes('Mar Morto')) { fColorTop = 'rgba(34,184,207,0.3)'; fColorBot = 'rgba(34,184,207,0.7)'; }

            const gradient = ctx.createLinearGradient(0, this.waterLevel, 0, h);
            gradient.addColorStop(0, fColorTop);
            gradient.addColorStop(1, fColorBot);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, this.waterLevel, w, h - this.waterLevel);

            ctx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const waveY = this.waterLevel + Math.sin(x * 0.02 + this.time * 2) * 3;
                if (x === 0) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
            }
            ctx.strokeStyle = fColorBot;
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
                let r=51, g=154, b=240;
                if (this.params.fluidType.includes('Óleo')) { r=255; g=212; b=59; }
                else if (this.params.fluidType.includes('Mel')) { r=232; g=89; b=12; }
                else if (this.params.fluidType.includes('Mercúrio')) { r=173; g=181; b=189; }
                else if (this.params.fluidType.includes('Mar Morto')) { r=34; g=184; b=207; }
                
                const depth = this.scenario === 'buoyancy' || this.scenario === 'pressure'
                    ? Math.max(0, (p.y - this.waterLevel) / (h - this.waterLevel)) : 0.5;
                color = `rgba(${r},${g},${b},${0.3 + depth * 0.4})`;
            }
            renderer.drawCircle(p.x, p.y, p.radius, color);
        }

        // Draw objects
        for (const obj of this.objects) {
            ctx.save();
            if (obj.emoji) {
                renderer.drawText(obj.emoji, obj.x + obj.width/2, obj.y + obj.height/2 + 5, {
                    color: '#fff', font: `${obj.width * 0.8}px Arial`, align: 'center', baseline: 'middle'
                });
            } else {
                ctx.fillStyle = obj.color || '#fff';
                ctx.globalAlpha = 0.8;
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = obj.color || '#fff';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            }
            ctx.restore();

            const subLabel = `${obj.label} (${obj.density})`;
            renderer.drawText(subLabel, obj.x + obj.width / 2, obj.y - 12, {
                color: 'rgba(255,255,255,0.8)', font: '11px Inter', align: 'center'
            });

            if (obj.y + obj.height > this.waterLevel) {
                const submerged = Math.min(obj.y + obj.height, h) - Math.max(obj.y, this.waterLevel);
                const objMass = obj.density * (obj.width * obj.height);
                const subVol = obj.width * submerged;
                const bForce = this.params.fluidDensity * subVol * 10;
                const forceLen = PhysicsUtils.clamp((bForce / objMass) * 3, 0, 80);
                if (forceLen > 5) {
                    renderer.drawArrow(
                        new Vec2(obj.x + obj.width / 2, obj.y + obj.height),
                        new Vec2(obj.x + obj.width / 2, obj.y + obj.height - forceLen),
                        'rgba(81,207,102,0.9)', 3, 6
                    );
                }
            }
        }
        
        if (this.splashes) {
            let r=255, g=255, b=255;
            if (this.params.fluidType.includes('Óleo')) { r=255; g=212; b=59; }
            else if (this.params.fluidType.includes('Mel')) { r=232; g=89; b=12; }
            for (const s of this.splashes) {
                renderer.drawCircle(s.x, s.y, 1.5 + s.life * 3, `rgba(${r},${g},${b},${s.life})`);
            }
        }

        // Info
        UI.updateInfo('fluids-info', `
      Líquido: ${this.params.fluidType.split(' ')[0]}<br>
      ρ Fluido: ${this.params.fluidDensity} kg/m³<br>
      Gravidade: ${this.params.gravity} m/s²<br>
      Viscosidade: ${this.params.viscosity}<br>
      Objetos no tanque: ${this.objects.length}<br>
      Partículas: ${this.particles.length}
    `);

        UI.setInfoPills([
            `💧 Fluidos`,
            `${this.params.fluidType} ρ=${this.params.fluidDensity}`,
            `g = ${this.params.gravity} m/s²`,
        ]);
    },

    destroy() {
        this.particles = [];
        this.objects = [];
        this.splashes = [];
    }
};
