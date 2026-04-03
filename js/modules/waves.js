/* ========================================
   MODULE 5: Waves & Vibrations
   Frequency, Amplitude, Interference
======================================== */

const WavesModule = {
    name: 'Ondas e Vibrações',
    key: 'waves',
    renderer: null,
    scenario: 'transverse',
    params: {
        frequency: 2,
        amplitude: 60,
        wavelength: 200,
        speed: 100,
        showEnvelope: false,
        numSources: 1,
        damping: 0,
    },
    time: 0,
    sources: [],

    init(renderer) {
        this.renderer = renderer;
        this.time = 0;
        this.loadScenario('transverse');
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Cenário',
                    type: 'scenarios',
                    items: [
                        { label: 'Onda Transversal', color: '#22b8cf', active: true, onSelect: () => self.loadScenario('transverse') },
                        { label: 'Onda Longitudinal', color: '#845ef7', onSelect: () => self.loadScenario('longitudinal') },
                        { label: 'Interferência', color: '#51cf66', onSelect: () => self.loadScenario('interference') },
                        { label: 'Ondas Estacionárias', color: '#ffd43b', onSelect: () => self.loadScenario('standing') },
                    ]
                },
                {
                    title: 'Parâmetros',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'wav-freq', label: 'Frequência', min: 0.5, max: 8, step: 0.1, value: self.params.frequency, unit: ' Hz', onChange: v => { self.params.frequency = v; } },
                        { kind: 'slider', id: 'wav-amp', label: 'Amplitude', min: 10, max: 120, step: 5, value: self.params.amplitude, unit: ' px', onChange: v => { self.params.amplitude = v; } },
                        { kind: 'slider', id: 'wav-wl', label: 'Comprimento de Onda', min: 60, max: 400, step: 10, value: self.params.wavelength, unit: ' px', onChange: v => { self.params.wavelength = v; } },
                        { kind: 'slider', id: 'wav-damp', label: 'Amortecimento', min: 0, max: 0.01, step: 0.001, value: self.params.damping, unit: '', onChange: v => { self.params.damping = v; } },
                        { kind: 'checkbox', id: 'wav-env', label: 'Mostrar envelope', checked: false, onChange: v => { self.params.showEnvelope = v; } },
                    ]
                },
                {
                    title: 'Informações',
                    type: 'info',
                    id: 'waves-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.time = 0;
        this.sources = [];
        const w = this.renderer.width;
        const h = this.renderer.height;

        if (name === 'transverse') {
            UI.setHint('Onda transversal — partículas oscilam perpendicularmente à propagação');
        }
        if (name === 'longitudinal') {
            UI.setHint('Onda longitudinal — partículas oscilam na direção da propagação');
        }
        if (name === 'interference') {
            this.sources = [
                { x: w * 0.3, y: h * 0.5 },
                { x: w * 0.7, y: h * 0.5 },
            ];
            UI.setHint('Interferência — duas fontes criando padrão de interferência');
        }
        if (name === 'standing') {
            UI.setHint('Onda estacionária — nós e antinós em destaque');
        }
    },

    update(dt) {
        this.time += dt;
    },

    render(renderer) {
        renderer.clear('#080a0f');
        renderer.drawGrid(60, 'rgba(34,184,207,0.02)');

        const ctx = renderer.ctx;
        const w = renderer.width;
        const h = renderer.height;
        const { frequency, amplitude, wavelength, damping } = this.params;
        const t = this.time;
        const omega = frequency * Math.PI * 2;
        const k = (Math.PI * 2) / wavelength;

        if (this.scenario === 'transverse') {
            const cy = h / 2;

            // Draw equilibrium line
            renderer.drawLine(new Vec2(0, cy), new Vec2(w, cy), 'rgba(255,255,255,0.05)', 1, [4, 6]);

            // Draw wave
            ctx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const dampFactor = Math.exp(-damping * x);
                const y = cy + amplitude * dampFactor * Math.sin(k * x - omega * t);
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#22b8cf';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Envelope
            if (this.params.showEnvelope) {
                ctx.beginPath();
                for (let x = 0; x < w; x += 2) {
                    const env = amplitude * Math.exp(-damping * x);
                    if (x === 0) ctx.moveTo(x, cy + env); else ctx.lineTo(x, cy + env);
                }
                ctx.strokeStyle = 'rgba(34,184,207,0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.beginPath();
                for (let x = 0; x < w; x += 2) {
                    const env = amplitude * Math.exp(-damping * x);
                    if (x === 0) ctx.moveTo(x, cy - env); else ctx.lineTo(x, cy - env);
                }
                ctx.strokeStyle = 'rgba(34,184,207,0.3)';
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw particles on wave
            for (let x = 30; x < w; x += 25) {
                const dampFactor = Math.exp(-damping * x);
                const y = cy + amplitude * dampFactor * Math.sin(k * x - omega * t);
                renderer.drawCircle(x, y, 4, '#22b8cf');
                // Velocity arrow (vertical)
                const vy = -amplitude * dampFactor * omega * Math.cos(k * x - omega * t);
                renderer.drawLine(new Vec2(x, y), new Vec2(x, y + vy * 0.15), 'rgba(255,107,107,0.5)', 1);
            }

            // Wavelength indicator
            renderer.drawLine(new Vec2(50, cy + amplitude + 30), new Vec2(50 + wavelength, cy + amplitude + 30), 'rgba(255,212,59,0.5)', 1.5);
            renderer.drawText(`λ = ${wavelength} px`, 50 + wavelength / 2, cy + amplitude + 40, {
                color: 'rgba(255,212,59,0.6)', font: '10px JetBrains Mono', align: 'center'
            });
        }

        if (this.scenario === 'longitudinal') {
            const cy = h / 2;
            const numParticles = 60;
            const spacing = w / numParticles;

            for (let i = 0; i < numParticles; i++) {
                const baseX = i * spacing + spacing / 2;
                const displacement = amplitude * 0.5 * Math.sin(k * baseX - omega * t);
                const x = baseX + displacement;

                // Color by density (compression vs rarefaction)
                const compressionFactor = -amplitude * 0.5 * k * Math.cos(k * baseX - omega * t);
                const intensity = PhysicsUtils.clamp(0.3 - compressionFactor * 0.003, 0.1, 0.8);
                const hue = compressionFactor > 0 ? 200 : 20;

                renderer.drawCircle(x, cy, 5, `hsla(${hue}, 70%, 55%, ${intensity})`);

                // Draw displacement arrows
                if (Math.abs(displacement) > 2) {
                    renderer.drawLine(
                        new Vec2(baseX, cy + 20),
                        new Vec2(x, cy + 20),
                        'rgba(132,94,247,0.4)', 1
                    );
                }
            }

            renderer.drawText('Compressão', w * 0.3, cy - 60, { color: 'rgba(34,184,207,0.5)', font: '11px Inter', align: 'center' });
            renderer.drawText('Rarefação', w * 0.7, cy - 60, { color: 'rgba(255,146,43,0.5)', font: '11px Inter', align: 'center' });
        }

        if (this.scenario === 'interference') {
            // 2D wave pattern
            const resolution = 6;
            for (let px = 0; px < w; px += resolution) {
                for (let py = 0; py < h; py += resolution) {
                    let totalDisp = 0;
                    for (const src of this.sources) {
                        const dist = Math.sqrt((px - src.x) ** 2 + (py - src.y) ** 2);
                        const dampFactor = Math.exp(-damping * dist * 0.5);
                        totalDisp += amplitude * dampFactor * Math.sin(k * dist - omega * t) / (Math.sqrt(dist + 1));
                    }

                    const intensity = PhysicsUtils.clamp(Math.abs(totalDisp) / 30, 0, 1);
                    const hue = totalDisp > 0 ? 180 : 340;
                    ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${intensity * 0.6})`;
                    ctx.fillRect(px, py, resolution, resolution);
                }
            }

            // Draw sources
            for (const src of this.sources) {
                renderer.drawCircle(src.x, src.y, 8, '#22b8cf');
                renderer.drawCircle(src.x, src.y, 20 + Math.sin(t * omega) * 5, 'rgba(34,184,207,0.3)', false, 1.5);
            }
        }

        if (this.scenario === 'standing') {
            const cy = h / 2;

            // Draw two traveling waves (faint)
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const y = cy + amplitude * Math.sin(k * x - omega * t);
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#339af0';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const y = cy + amplitude * Math.sin(k * x + omega * t);
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Standing wave (superposition)
            ctx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const standingAmp = 2 * amplitude * Math.sin(k * x) * Math.cos(omega * t);
                const y = cy + standingAmp;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#51cf66';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Mark nodes and antinodes
            for (let x = 0; x < w; x += wavelength / 2) {
                const isNode = Math.abs(Math.sin(k * x)) < 0.1;
                if (isNode) {
                    renderer.drawCircle(x, cy, 6, 'rgba(255,212,59,0.6)', false, 2);
                    renderer.drawText('Nó', x, cy + 15, { color: 'rgba(255,212,59,0.5)', font: '10px Inter', align: 'center' });
                }
            }
            for (let x = wavelength / 4; x < w; x += wavelength / 2) {
                renderer.drawCircle(x, cy, 6, 'rgba(81,207,102,0.4)', false, 2);
                renderer.drawText('Antinó', x, cy + 15, { color: 'rgba(81,207,102,0.4)', font: '9px Inter', align: 'center' });
            }
        }

        // Info
        const period = 1 / frequency;
        const velocity = frequency * wavelength;
        UI.updateInfo('waves-info', `
      Frequência: ${frequency.toFixed(1)} Hz<br>
      Período: ${period.toFixed(3)} s<br>
      Amplitude: ${amplitude} px<br>
      λ Comprimento: ${wavelength} px<br>
      Velocidade: ${velocity.toFixed(0)} px/s<br>
      Tempo: ${this.time.toFixed(1)} s
    `);

        UI.setInfoPills([
            `🌊 Ondas`,
            `f = ${frequency.toFixed(1)} Hz`,
            `A = ${amplitude} px`,
            `λ = ${wavelength} px`,
        ]);
    },

    destroy() {
        this.sources = [];
    }
};
