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
    magnets: [],
    params: {
        k: 9000,
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
                    title: 'Fenômenos Invisíveis',
                    type: 'scenarios',
                    items: [
                        { label: '⚛️ Cargas Ativas', color: '#51cf66', active: true, onSelect: () => self.loadScenario('charges') },
                        { label: '🧲 Grande Ímã', color: '#845ef7', onSelect: () => self.loadScenario('magnetic') },
                        { label: '🔋 Capacitor Real', color: '#ffd43b', onSelect: () => self.loadScenario('capacitor') },
                        { label: '⚖️ Balança de Coulomb', color: '#339af0', onSelect: () => self.loadScenario('dipole') },
                    ]
                },
                {
                    title: 'Ferramentas de Carga',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'em-k', label: 'Poder Elétrico (k)', min: 1000, max: 20000, step: 500, value: self.params.k, unit: '', onChange: v => { self.params.k = v; } },
                        { kind: 'checkbox', id: 'em-lines', label: 'Ver Linhas de Força', checked: true, onChange: v => { self.params.showLines = v; } },
                        { kind: 'checkbox', id: 'em-pot', label: 'Mapa de Energia (Volt)', checked: false, onChange: v => { self.params.showPotential = v; } },
                        { kind: 'button', id: 'em-pos', label: '➕ Criar Carga Positiva', onClick: () => self.addCharge(1) },
                        { kind: 'button', id: 'em-neg', label: '➖ Criar Carga Negativa', onClick: () => self.addCharge(-1) },
                        { kind: 'button', id: 'em-clear', label: '🗑️ Descarregar Tudo', onClick: () => { self.charges = []; self.magnets = []; } },
                    ]
                },
                {
                    title: 'Monitor de Campo',
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
            this.magnets = [{ x: cx, y: cy, w: 140, h: 40 }];
            
            // Populate with dipole fields logic for the magnet ends
            this.charges.push({ x: cx - 50, y: cy, q: 6, radius: 15, fixed: true, hidden: true });
            this.charges.push({ x: cx + 50, y: cy, q: -6, radius: 15, fixed: true, hidden: true });
            
            UI.setHint('Magnetismo — Ímãs têm polos Norte e Sul inseparáveis');
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

        // Draw magnets
        for (const m of this.magnets || []) {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(m.x - m.w/2, m.y - m.h/2, m.w/2, m.h);
            ctx.fillStyle = '#339af0';
            ctx.fillRect(m.x, m.y - m.h/2, m.w/2, m.h);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(m.x - m.w/2, m.y - m.h/2, m.w, m.h);
            renderer.drawText('N', m.x - m.w * 0.25, m.y, { color: '#fff', font: 'bold 16px Inter', align: 'center', baseline: 'middle'});
            renderer.drawText('S', m.x + m.w * 0.25, m.y, { color: '#fff', font: 'bold 16px Inter', align: 'center', baseline: 'middle'});
        }

        // Draw charges
        for (const c of this.charges) {
            if (c.hidden) continue;
            
            const isPositive = c.q > 0;
            const emoji = isPositive ? '➕' : '➖';
            const color = isPositive ? 'rgba(255,107,107,0.2)' : 'rgba(51,154,240,0.2)';

            renderer.drawGradientCircle(c.x, c.y, c.radius * 3, color, 'transparent');
            renderer.drawCircle(c.x, c.y, c.radius, isPositive ? '#ff6b6b' : '#339af0');
            renderer.drawText(emoji, c.x, c.y + 1, { font: 'bold 14px Arial', align: 'center', baseline: 'middle', color: '#fff' });
            
            const qVal = `${c.q.toFixed(1)} nC`;
            renderer.drawText(qVal, c.x, c.y - c.radius - 8, { font: '10px JetBrains Mono', color: 'rgba(255,255,255,0.6)', align: 'center'});
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
