/* ========================================
   MODULE 6: Electromagnetism
   Charges, Fields, Circuits
======================================== */

const ElectromagnetismModule = {
    name: 'Eletromagnetismo',
    key: 'electro',
    renderer: null,
    scenario: 'charges',
    charges: [],
    params: {
        k: 2000,
        showField: true,
        showLines: true,
        fieldResolution: 30,
        showPotential: false,
    },
    time: 0,
    dragging: null,

    init(renderer) {
        this.renderer = renderer;
        this.time = 0;
        this.loadScenario('charges');
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
                        { label: 'Cargas Elétricas', color: '#51cf66', active: true, onSelect: () => self.loadScenario('charges') },
                        { label: 'Dipolo', color: '#339af0', onSelect: () => self.loadScenario('dipole') },
                        { label: 'Capacitor', color: '#ffd43b', onSelect: () => self.loadScenario('capacitor') },
                        { label: 'Campo Magnético', color: '#845ef7', onSelect: () => self.loadScenario('magnetic') },
                    ]
                },
                {
                    title: 'Parâmetros',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'em-k', label: 'Constante k', min: 500, max: 5000, step: 100, value: self.params.k, unit: '', onChange: v => { self.params.k = v; } },
                        { kind: 'slider', id: 'em-res', label: 'Resolução do campo', min: 15, max: 50, step: 5, value: self.params.fieldResolution, unit: ' px', onChange: v => { self.params.fieldResolution = v; } },
                        { kind: 'checkbox', id: 'em-field', label: 'Vetores do campo', checked: true, onChange: v => { self.params.showField = v; } },
                        { kind: 'checkbox', id: 'em-lines', label: 'Linhas de campo', checked: true, onChange: v => { self.params.showLines = v; } },
                        { kind: 'checkbox', id: 'em-pot', label: 'Mapa de potencial', checked: false, onChange: v => { self.params.showPotential = v; } },
                        { kind: 'button', id: 'em-pos', label: '➕ Adicionar carga +', onClick: () => self.addCharge(1) },
                        { kind: 'button', id: 'em-neg', label: '➖ Adicionar carga −', onClick: () => self.addCharge(-1) },
                    ]
                },
                {
                    title: 'Informações',
                    type: 'info',
                    id: 'electro-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.charges = [];
        this.time = 0;
        const w = this.renderer.width;
        const h = this.renderer.height;
        const cx = w / 2, cy = h / 2;

        if (name === 'charges') {
            this.charges.push({ x: cx - 100, y: cy, q: 3, radius: 14, fixed: true });
            this.charges.push({ x: cx + 100, y: cy, q: -3, radius: 14, fixed: true });
            this.charges.push({ x: cx, y: cy - 120, q: 2, radius: 12, fixed: true });
            UI.setHint('Arraste as cargas para ver o campo elétrico mudar');
        }

        if (name === 'dipole') {
            this.charges.push({ x: cx - 60, y: cy, q: 5, radius: 16, fixed: true });
            this.charges.push({ x: cx + 60, y: cy, q: -5, radius: 16, fixed: true });
            UI.setHint('Dipolo elétrico — campo entre cargas opostas');
        }

        if (name === 'capacitor') {
            // Two lines of charges
            const plateGap = 200;
            const numCharges = 8;
            for (let i = 0; i < numCharges; i++) {
                const y = cy - 120 + (240 / (numCharges - 1)) * i;
                this.charges.push({ x: cx - plateGap / 2, y, q: 3, radius: 8, fixed: true });
                this.charges.push({ x: cx + plateGap / 2, y, q: -3, radius: 8, fixed: true });
            }
            UI.setHint('Capacitor de placas paralelas — campo uniforme entre as placas');
        }

        if (name === 'magnetic') {
            // Simulate magnetic field with moving charges
            this.charges.push({ x: cx, y: cy, q: 5, radius: 16, fixed: true });
            // Test charges that will orbit
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const dist = 80 + i * 15;
                this.charges.push({
                    x: cx + Math.cos(angle) * dist,
                    y: cy + Math.sin(angle) * dist,
                    q: 0.1,
                    radius: 3,
                    fixed: false,
                    vx: -Math.sin(angle) * 80,
                    vy: Math.cos(angle) * 80,
                });
            }
            UI.setHint('Campo magnético — partículas carregadas em movimento circular');
        }
    },

    addCharge(sign) {
        const w = this.renderer.width;
        const h = this.renderer.height;
        this.charges.push({
            x: w / 2 + (Math.random() - 0.5) * 200,
            y: h / 2 + (Math.random() - 0.5) * 200,
            q: sign * PhysicsUtils.randomRange(1, 5),
            radius: 12,
            fixed: true,
        });
    },

    setupInput(canvas) {
        const self = this;
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            for (const c of self.charges) {
                const dist = Math.sqrt((mx - c.x) ** 2 + (my - c.y) ** 2);
                if (dist < c.radius + 8) {
                    self.dragging = c;
                    return;
                }
            }
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!self.dragging) return;
            const rect = canvas.getBoundingClientRect();
            self.dragging.x = e.clientX - rect.left;
            self.dragging.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mouseup', () => { self.dragging = null; });
    },

    getFieldAt(x, y) {
        let ex = 0, ey = 0;
        for (const c of this.charges) {
            const dx = x - c.x;
            const dy = y - c.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 100) continue;
            const dist = Math.sqrt(distSq);
            const force = this.params.k * c.q / distSq;
            ex += force * dx / dist;
            ey += force * dy / dist;
        }
        return { x: ex, y: ey };
    },

    getPotentialAt(x, y) {
        let v = 0;
        for (const c of this.charges) {
            const dist = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
            if (dist < 10) continue;
            v += this.params.k * c.q / dist;
        }
        return v;
    },

    update(dt) {
        this.time += dt;

        // Update moving charges (magnetic scenario)
        if (this.scenario === 'magnetic') {
            for (const c of this.charges) {
                if (!c.fixed && c.vx !== undefined) {
                    // Simple circular orbit around center
                    const cx = this.renderer.width / 2;
                    const cy = this.renderer.height / 2;
                    const dx = c.x - cx;
                    const dy = c.y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 10) {
                        // Centripetal force
                        const force = this.params.k * 0.5 / dist;
                        c.vx -= (dx / dist) * force * dt;
                        c.vy -= (dy / dist) * force * dt;
                    }
                    c.x += c.vx * dt;
                    c.y += c.vy * dt;
                }
            }
        }
    },

    render(renderer) {
        renderer.clear('#080f08');
        const ctx = renderer.ctx;
        const w = renderer.width;
        const h = renderer.height;

        // Potential map
        if (this.params.showPotential) {
            const res = 8;
            for (let px = 0; px < w; px += res) {
                for (let py = 0; py < h; py += res) {
                    const v = this.getPotentialAt(px, py);
                    const intensity = PhysicsUtils.clamp(Math.abs(v) * 0.005, 0, 0.5);
                    const hue = v > 0 ? 120 : 0;
                    ctx.fillStyle = `hsla(${hue}, 70%, 40%, ${intensity})`;
                    ctx.fillRect(px, py, res, res);
                }
            }
        }

        // Field vectors
        if (this.params.showField) {
            const res = this.params.fieldResolution;
            for (let px = res; px < w; px += res) {
                for (let py = res; py < h; py += res) {
                    const field = this.getFieldAt(px, py);
                    const mag = Math.sqrt(field.x * field.x + field.y * field.y);
                    if (mag < 0.01) continue;

                    const maxLen = res * 0.8;
                    const len = Math.min(mag * 5, maxLen);
                    const nx = field.x / mag;
                    const ny = field.y / mag;
                    const alpha = PhysicsUtils.clamp(mag * 0.3, 0.05, 0.5);

                    renderer.drawArrow(
                        new Vec2(px, py),
                        new Vec2(px + nx * len, py + ny * len),
                        `rgba(81,207,102,${alpha})`, 1, 4
                    );
                }
            }
        }

        // Field lines
        if (this.params.showLines) {
            for (const c of this.charges) {
                if (c.q <= 0) continue;
                const numLines = Math.min(Math.abs(Math.round(c.q)) * 4, 16);
                for (let i = 0; i < numLines; i++) {
                    const angle = (i / numLines) * Math.PI * 2;
                    const points = [];
                    let px = c.x + Math.cos(angle) * (c.radius + 5);
                    let py = c.y + Math.sin(angle) * (c.radius + 5);

                    for (let step = 0; step < 200; step++) {
                        points.push(new Vec2(px, py));
                        const field = this.getFieldAt(px, py);
                        const mag = Math.sqrt(field.x * field.x + field.y * field.y);
                        if (mag < 0.01) break;

                        const stepSize = 4;
                        px += (field.x / mag) * stepSize;
                        py += (field.y / mag) * stepSize;

                        if (px < 0 || px > w || py < 0 || py > h) break;

                        // Stop near negative charge
                        for (const other of this.charges) {
                            if (other.q < 0) {
                                const dist = Math.sqrt((px - other.x) ** 2 + (py - other.y) ** 2);
                                if (dist < other.radius + 5) { step = 999; break; }
                            }
                        }
                    }

                    if (points.length > 2) {
                        renderer.drawFieldLine(points, 'rgba(81,207,102,0.25)', 1);
                    }
                }
            }
        }

        // Draw charges
        for (const c of this.charges) {
            if (c.radius < 5) {
                // Small moving charge
                renderer.drawCircle(c.x, c.y, c.radius, 'rgba(34,184,207,0.7)');
                continue;
            }
            const isPositive = c.q > 0;
            const color = isPositive ? '#ff6b6b' : '#339af0';

            // Glow
            renderer.drawGradientCircle(c.x, c.y, c.radius * 3,
                isPositive ? 'rgba(255,107,107,0.15)' : 'rgba(51,154,240,0.15)',
                'transparent'
            );

            renderer.drawCircle(c.x, c.y, c.radius, color);

            // + or - symbol
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${c.radius}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isPositive ? '+' : '−', c.x, c.y);
        }

        // Info
        UI.updateInfo('electro-info', `
      Cargas: ${this.charges.length}<br>
      Constante k: ${this.params.k}<br>
      Resolução: ${this.params.fieldResolution} px<br>
      Cenário: ${this.scenario}
    `);

        UI.setInfoPills([
            `🔋 Eletromagnetismo`,
            `${this.charges.filter(c => c.q > 0).length} cargas +`,
            `${this.charges.filter(c => c.q < 0).length} cargas −`,
        ]);
    },

    destroy() {
        this.charges = [];
        this.dragging = null;
    }
};
