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
        frequency: 1,
        amplitude: 50,
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
                    title: 'Tipos de Ondas',
                    type: 'scenarios',
                    items: [
                        { label: '⛵ No Mar (Transv.)', color: '#22b8cf', active: true, onSelect: () => self.loadScenario('transverse') },
                        { label: '🔊 Som (Longit.)', color: '#845ef7', onSelect: () => self.loadScenario('longitudinal') },
                        { label: '🎸 Corda de Violão', color: '#ffd43b', onSelect: () => self.loadScenario('standing') },
                        { label: '💧 Gotas no Lago', color: '#51cf66', onSelect: () => self.loadScenario('interference') },
                    ]
                },
                {
                    title: 'Ajuste da Vibração',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'wav-freq', label: 'Frequência (Hz)', min: 0.2, max: 10, step: 0.1, value: self.params.frequency, unit: '', onChange: v => { self.params.frequency = v; } },
                        { kind: 'slider', id: 'wav-amp', label: 'Amplitude (Energia)', min: 5, max: 150, step: 5, value: self.params.amplitude, unit: '', onChange: v => { self.params.amplitude = v; } },
                        { kind: 'slider', id: 'wav-wl', label: 'Comprimento (λ)', min: 100, max: 500, step: 10, value: self.params.wavelength, unit: ' m', onChange: v => { self.params.wavelength = v; } },
                        { kind: 'slider', id: 'wav-damp', label: 'Amortecimento', min: 0, max: 0.02, step: 0.001, value: self.params.damping, unit: '', onChange: v => { self.params.damping = v; } },
                        { kind: 'button', id: 'wav-reset', label: '↺ Reiniciar Pulso', onClick: () => { self.time = 0; } },
                    ]
                },
                {
                    title: 'Análise da Onda',
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
            UI.setHint('⛵ No Mar — as ondas sobem e descem (perpendicular)');
        }
        if (name === 'longitudinal') {
            UI.setHint('🔊 Som — a vibração empurra o ar (longitudinal)');
        }
        if (name === 'interference') {
            this.sources = [
                { x: w * 0.35, y: h * 0.5, emoji: '💧' },
                { x: w * 0.65, y: h * 0.5, emoji: '💧' },
            ];
            UI.setHint('💧 Gotas no Lago — padrões de construtividade e anulação');
        }
        if (name === 'standing') {
            UI.setHint('🎸 Cordas — nós não se movem, ventres vibram muito');
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

            // Draw boat emoji
            const bx = w * 0.5;
            const bDamp = Math.exp(-damping * bx);
            const by = cy + amplitude * bDamp * Math.sin(k * bx - omega * t);
            const bAngle = Math.atan(amplitude * bDamp * k * Math.cos(k * bx - omega * t));
            
            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(bAngle);
            renderer.drawText('⛵', 0, -15, { font: '32px Arial', align: 'center'});
            ctx.restore();

            // Draw particles on wave
            for (let x = 30; x < w; x += 30) {
                const dampFactor = Math.exp(-damping * x);
                const y = cy + amplitude * dampFactor * Math.sin(k * x - omega * t);
                renderer.drawCircle(x, y, 3.5, '#22b8cf');
            }

            // Wavelength indicator
            renderer.drawLine(new Vec2(50, cy + amplitude + 30), new Vec2(50 + wavelength, cy + amplitude + 30), 'rgba(255,212,59,0.5)', 1.5);
            renderer.drawText(`λ = ${wavelength} px`, 50 + wavelength / 2, cy + amplitude + 40, {
                color: 'rgba(255,212,59,0.6)', font: '10px JetBrains Mono', align: 'center'
            });
        }

        if (this.scenario === 'longitudinal') {
            renderer.drawText('🔊', 30, cy, { font: '40px Arial', align: 'center', baseline: 'middle'});

            for (let i = 0; i < numParticles; i++) {
                const baseX = 80 + i * spacing;
                const displacement = amplitude * 0.6 * Math.sin(k * baseX - omega * t);
                const x = baseX + displacement;

                const compressionFactor = -amplitude * 0.6 * k * Math.cos(k * baseX - omega * t);
                const intensity = PhysicsUtils.clamp(0.4 - compressionFactor * 0.002, 0.1, 0.9);
                const color = `hsla(200, 80%, 60%, ${intensity})`;

                renderer.drawCircle(x, cy, 5, color);
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
                renderer.drawText(src.emoji, src.x, src.y, { font: '28px Arial', align: 'center', baseline: 'middle'});
                renderer.drawCircle(src.x, src.y, 25 + Math.sin(t * omega) * 8, 'rgba(51,154,240,0.2)', false, 2);
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
