/* ========================================
   MODULE 4: Thermodynamics
   Gas behavior, thermal laws, heat transfer
======================================== */

const ThermodynamicsModule = {
    name: 'Termodinâmica',
    key: 'thermo',
    renderer: null,
    scenario: 'gas',
    heatSource: 'none', // 'fire', 'ice', 'none'
    particles: [],
    params: {
        temperature: 300,
        pressure: 1,
        volume: 0.8,
        numParticles: 60,
        showVelocity: true,
        wallHeat: false,
    },
    time: 0,
    containerWidth: 0,
    containerHeight: 0,
    containerX: 0,
    containerY: 0,
    pistonY: 0,
    targetPistonY: 0,
    histogram: new Array(15).fill(0),

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
                    title: 'Cenário Molecular',
                    type: 'scenarios',
                    items: [
                        { label: '🔥 Motor a Pistão', color: '#ff922b', active: true, onSelect: () => self.loadScenario('gas') },
                        { label: '🌡️ Troca de Calor', color: '#ff6b6b', onSelect: () => self.loadScenario('conduction') },
                        { label: '💨 Expansão de Gás', color: '#ffd43b', onSelect: () => self.loadScenario('expansion') },
                    ]
                },
                {
                    title: 'Controle de Energia',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'th-temp', label: 'Temperatura (K)', min: 50, max: 2000, step: 10, value: self.params.temperature, unit: '', onChange: v => { self.params.temperature = v; self.applyTemperature(); } },
                        { kind: 'slider', id: 'th-volume', label: 'Volume do Pistão', min: 0.2, max: 1, step: 0.05, value: self.params.volume, unit: '', onChange: v => { self.params.volume = v; } },
                        { kind: 'button', id: 'th-fire', label: '🔥 Ligar Fogo!', onClick: () => { self.heatSource = 'fire'; } },
                        { kind: 'button', id: 'th-ice', label: '🧊 Usar Gelo!', onClick: () => { self.heatSource = 'ice'; } },
                        { kind: 'button', id: 'th-off', label: '⏹️ Desligar Fonte', onClick: () => { self.heatSource = 'none'; } },
                        { kind: 'button', id: 'th-reset', label: '↺ Limpar Gás', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Dados em Tempo Real',
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
        const w = this.renderer.width;
        const h = this.renderer.height;

        this.containerX = w * 0.15;
        this.containerY = h * 0.1;
        this.containerWidth = w * 0.5;
        this.containerHeight = h * 0.75;
        this.pistonY = this.containerY + this.containerHeight * (1 - this.params.volume);
        this.targetPistonY = this.pistonY;

        const avgSpeed = Math.sqrt(this.params.temperature) * 2;

        if (name === 'gas' || name === 'expansion') {
            for (let i = 0; i < this.params.numParticles; i++) {
                this.particles.push({
                    x: this.containerX + 20 + Math.random() * (this.containerWidth - 40),
                    y: this.pistonY + 20 + Math.random() * (this.containerY + this.containerHeight - this.pistonY - 40),
                    vx: (Math.random() - 0.5) * avgSpeed,
                    vy: (Math.random() - 0.5) * avgSpeed,
                    radius: 3,
                    mass: 1,
                });
            }
            UI.setHint(name === 'gas' ? 'Gás ideal em recipiente — ajuste temperatura e volume' : 'Expansão livre do gás');
        }

        if (name === 'conduction') {
            const halfW = this.containerWidth / 2;
            for (let i = 0; i < this.params.numParticles; i++) {
                const isHot = i < this.params.numParticles / 2;
                const speed = isHot ? avgSpeed * 2 : avgSpeed * 0.3;
                this.particles.push({
                    x: this.containerX + (isHot ? 20 + Math.random() * (halfW - 30) : halfW + 10 + Math.random() * (halfW - 30)),
                    y: this.containerY + 20 + Math.random() * (this.containerHeight - 40),
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    radius: 3,
                    mass: 1,
                });
            }
            UI.setHint('Condução de calor — lado esquerdo quente, direito frio');
        }
    },

    applyTemperature() {
        const avgSpeed = Math.sqrt(this.params.temperature) * 2;
        for (const p of this.particles) {
            const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (currentSpeed > 0) {
                const scale = avgSpeed / currentSpeed;
                p.vx *= PhysicsUtils.lerp(1, scale, 0.1);
                p.vy *= PhysicsUtils.lerp(1, scale, 0.1);
            }
        }
    },

    update(dt) {
        this.time += dt;

        // Update piston position
        this.targetPistonY = this.containerY + this.containerHeight * (1 - this.params.volume);
        this.pistonY = PhysicsUtils.lerp(this.pistonY, this.targetPistonY, 0.05);

        const cx = this.containerX;
        const cy = this.scenario === 'gas' || this.scenario === 'expansion' ? this.pistonY : this.containerY;
        
        // Heat source effect
        if (this.heatSource !== 'none') {
            const delta = this.heatSource === 'fire' ? 2 : -2;
            this.params.temperature = PhysicsUtils.clamp(this.params.temperature + delta, 50, 4000);
            this.applyTemperature();
            
            const slideVal = document.getElementById('val-th-temp');
            const slideInput = document.getElementById('ctrl-th-temp');
            if (slideInput && slideVal) {
                slideInput.value = this.params.temperature;
                slideVal.textContent = Math.round(this.params.temperature);
            }
        }

        const cw = this.containerWidth;
        const ch = this.containerY + this.containerHeight - cy;

        // Update particles
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Wall collisions
            if (p.x - p.radius < cx) { p.x = cx + p.radius; p.vx = Math.abs(p.vx); }
            if (p.x + p.radius > cx + cw) { p.x = cx + cw - p.radius; p.vx = -Math.abs(p.vx); }
            if (p.y - p.radius < cy) { p.y = cy + p.radius; p.vy = Math.abs(p.vy); }
            if (p.y + p.radius > cy + ch) { p.y = cy + ch - p.radius; p.vy = -Math.abs(p.vy); }
        }

        // Simple particle collisions
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const a = this.particles[i];
                const b = this.particles[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = a.radius + b.radius;

                if (dist < minDist && dist > 0) {
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Separate
                    const overlap = minDist - dist;
                    a.x -= nx * overlap * 0.5;
                    a.y -= ny * overlap * 0.5;
                    b.x += nx * overlap * 0.5;
                    b.y += ny * overlap * 0.5;

                    // Elastic collision
                    const dvx = a.vx - b.vx;
                    const dvy = a.vy - b.vy;
                    const dvn = dvx * nx + dvy * ny;
                    if (dvn > 0) {
                        a.vx -= dvn * nx;
                        a.vy -= dvn * ny;
                        b.vx += dvn * nx;
                        b.vy += dvn * ny;
                    }
                }
            }
        }

        // Update histogram
        this.histogram = new Array(20).fill(0);
        for (const p of this.particles) {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const bin = Math.min(Math.floor(speed / 20), 19);
            this.histogram[bin]++;
        }
    },

    render(renderer) {
        renderer.clear('#0a0808');
        renderer.drawGrid(60, 'rgba(255,146,43,0.02)');

        const ctx = renderer.ctx;
        const w = renderer.width;
        const h = renderer.height;
        const cx = this.containerX;
        const cw = this.containerWidth;
        const cy = this.containerY;
        const ch = this.containerHeight;

        // Container
        ctx.save();
        ctx.strokeStyle = 'rgba(255,146,43,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, cw, ch);
        ctx.restore();

        // Piston (if gas scenario)
        if (this.scenario === 'gas' || this.scenario === 'expansion') {
            const pistonH = 8;
            ctx.fillStyle = 'rgba(255,146,43,0.4)';
            ctx.fillRect(cx, this.pistonY - pistonH / 2, cw, pistonH);
            ctx.fillStyle = 'rgba(255,146,43,0.2)';

            // Piston rod
            ctx.fillRect(cx + cw / 2 - 3, cy - 20, 6, this.pistonY - cy + 20);
        }

        // Conduction divider
        if (this.scenario === 'conduction') {
            renderer.drawLine(
                new Vec2(cx + cw / 2, cy),
                new Vec2(cx + cw / 2, cy + ch),
                'rgba(255,255,255,0.1)', 1, [4, 4]
            );
            renderer.drawText('QUENTE', cx + cw * 0.25, cy - 20, {
                color: '#ff6b6b', font: '12px Inter', align: 'center'
            });
            renderer.drawText('FRIO', cx + cw * 0.75, cy - 20, {
                color: '#339af0', font: '12px Inter', align: 'center'
            });
        }

        // Draw particles with glow
        for (const p of this.particles) {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const hue = PhysicsUtils.clamp(230 - speed * 1.8, 0, 240);
            const color = `hsl(${hue}, 90%, 60%)`;
            
            renderer.drawCircle(p.x, p.y, p.radius, color);
            // Dynamic glow for fast particles
            if (speed > 180) {
                ctx.save();
                ctx.globalAlpha = 0.2;
                renderer.drawCircle(p.x, p.y, p.radius * 2.5, color);
                ctx.restore();
            }
        }

        // Animated Heat Source
        if (this.heatSource !== 'none') {
            const bottomY = cy + ch;
            const emoji = this.heatSource === 'fire' ? '🔥' : '🧊';
            const count = this.heatSource === 'fire' ? 8 : 6;
            for(let i=0; i<count; i++) {
                const ex = cx + (cw / count) * i + (Math.sin(this.time*3 + i)*10);
                const ey = bottomY + 25 + (Math.cos(this.time*2 + i)*5);
                renderer.drawText(emoji, ex, ey, { font: '24px Arial', align: 'center'});
            }
        }

        // Speed distribution histogram
        const histX = cx + cw + 40;
        const histY = cy + 30;
        const histW = w - histX - 30;
        const histH = ch * 0.4;

        if (histW > 80) {
            renderer.drawText('Distribuição de Velocidades', histX, histY - 20, {
                color: 'rgba(255,255,255,0.5)', font: '11px Inter'
            });

            const maxBin = Math.max(...this.histogram, 1);
            const barW = histW / this.histogram.length;

            for (let i = 0; i < this.histogram.length; i++) {
                const barH = (this.histogram[i] / maxBin) * histH;
                const hue = PhysicsUtils.clamp(240 - i * 12, 0, 240);
                renderer.drawRect(
                    histX + i * barW,
                    histY + histH - barH,
                    barW - 1,
                    barH,
                    `hsla(${hue}, 70%, 50%, 0.6)`
                );
            }

            renderer.drawLine(new Vec2(histX, histY + histH), new Vec2(histX + histW, histY + histH), 'rgba(255,255,255,0.2)', 1);
            renderer.drawText('Velocidade →', histX + histW / 2, histY + histH + 8, {
                color: 'rgba(255,255,255,0.3)', font: '10px Inter', align: 'center'
            });
        }

        // Calculate stats
        let avgSpeed = 0, avgKE = 0, pressure = 0;
        for (const p of this.particles) {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            avgSpeed += speed;
            avgKE += 0.5 * p.mass * (p.vx * p.vx + p.vy * p.vy);
        }
        if (this.particles.length > 0) {
            avgSpeed /= this.particles.length;
            avgKE /= this.particles.length;
            pressure = this.particles.length * avgKE / (this.containerWidth * this.containerHeight * this.params.volume);
        }

        UI.updateInfo('thermo-info', `
      Partículas: ${this.particles.length}<br>
      Temperatura: ${this.params.temperature} K<br>
      Vel. Média: ${avgSpeed.toFixed(1)} px/s<br>
      EC Média: ${avgKE.toFixed(1)} J<br>
      Volume: ${(this.params.volume * 100).toFixed(0)}%<br>
      Pressão: ${(pressure * 1000).toFixed(2)}
    `);

        UI.setInfoPills([
            `🔥 Termodinâmica`,
            `T = ${this.params.temperature} K`,
            `N = ${this.particles.length}`,
        ]);
    },

    destroy() {
        this.particles = [];
    }
};
