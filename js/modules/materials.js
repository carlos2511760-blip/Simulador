/* ========================================
   MODULE 8: Material Physics
   Deformation, Friction, Fractures
======================================== */

const MaterialsModule = {
    name: 'Física de Materiais',
    key: 'materials',
    renderer: null,
    world: null,
    scenario: 'deformation',
    params: {
        stiffness: 0.5,
        friction: 0.1,
        structuralIntegrity: 0.8,
        showStress: true,
        gravity: 9.8,
    },
    nodes: [],
    constraints: [],
    time: 0,
    dragging: null,

    init(renderer) {
        this.renderer = renderer;
        this.time = 0;
        this.loadScenario('deformation');
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
                        { label: 'Deformação (Soft Body)', color: '#e599f7', active: true, onSelect: () => self.loadScenario('deformation') },
                        { label: 'Atrito Realista', color: '#ff922b', onSelect: () => self.loadScenario('friction') },
                        { label: 'Fratura de Estrutura', color: '#ff6b6b', onSelect: () => self.loadScenario('fracture') },
                        { label: 'Ponte de Treliça', color: '#51cf66', onSelect: () => self.loadScenario('bridge') },
                    ]
                },
                {
                    title: 'Parâmetros',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'mat-stiff', label: 'Rigidez', min: 0.01, max: 1.0, step: 0.05, value: self.params.stiffness, unit: '', onChange: v => { self.params.stiffness = v; self.updateStiffness(); } },
                        { kind: 'slider', id: 'mat-fric', label: 'Atrito', min: 0, max: 1, step: 0.05, value: self.params.friction, unit: '', onChange: v => { self.params.friction = v; } },
                        { kind: 'slider', id: 'mat-integ', label: 'Integridade', min: 0.1, max: 1.0, step: 0.1, value: self.params.structuralIntegrity, unit: '', onChange: v => { self.params.structuralIntegrity = v; } },
                        { kind: 'checkbox', id: 'mat-stress', label: 'Mostrar tensão', checked: true, onChange: v => { self.params.showStress = v; } },
                        { kind: 'button', id: 'mat-reset', label: '↺ Reiniciar', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Informações',
                    type: 'info',
                    id: 'materials-info'
                }
            ]
        });
    },

    loadScenario(name) {
        this.scenario = name;
        this.nodes = [];
        this.constraints = [];
        this.time = 0;
        const w = this.renderer.width;
        const h = this.renderer.height;

        if (name === 'deformation') {
            // Create a jell-o cube
            const size = 5;
            const spacing = 35;
            const startX = w / 2 - (size * spacing) / 2;
            const startY = h / 2 - (size * spacing) / 2;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    this.nodes.push({
                        pos: new Vec2(startX + x * spacing, startY + y * spacing),
                        oldPos: new Vec2(startX + x * spacing, startY + y * spacing),
                        fixed: false,
                        radius: 4,
                    });
                }
            }

            // Add constraints
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = y * size + x;
                    if (x < size - 1) this.addConstraint(i, i + 1); // Horizontal
                    if (y < size - 1) this.addConstraint(i, i + size); // Vertical
                    if (x < size - 1 && y < size - 1) {
                        this.addConstraint(i, i + size + 1); // Diagonal
                        this.addConstraint(i + 1, i + size); // Diagonal
                    }
                }
            }
            UI.setHint('Soft Body — clique e arraste para deformar o material');
        }

        if (name === 'friction') {
            // Slopes with different friction
            this.nodes = [
                { pos: new Vec2(w * 0.2, h * 0.3), oldPos: new Vec2(w * 0.2, h * 0.3), fixed: true, label: 'Liso' },
                { pos: new Vec2(w * 0.8, h * 0.3), oldPos: new Vec2(w * 0.8, h * 0.3), fixed: false, radius: 15, color: '#ff922b' }
            ];
            UI.setHint('Atrito realista — observe o deslizamento em diferentes superfícies');
        }

        if (name === 'bridge') {
            const startX = w * 0.15;
            const endX = w * 0.85;
            const midY = h * 0.6;
            const sections = 10;
            const sectionW = (endX - startX) / sections;

            // Bottom nodes
            for (let i = 0; i <= sections; i++) {
                this.nodes.push({
                    pos: new Vec2(startX + i * sectionW, midY),
                    oldPos: new Vec2(startX + i * sectionW, midY),
                    fixed: i === 0 || i === sections,
                    radius: 5,
                });
            }
            // Top nodes
            for (let i = 0; i <= sections; i++) {
                this.nodes.push({
                    pos: new Vec2(startX + i * sectionW, midY - 60),
                    oldPos: new Vec2(startX + i * sectionW, midY - 60),
                    fixed: false,
                    radius: 5,
                });
            }

            // Connectivity
            for (let i = 0; i < sections; i++) {
                this.addConstraint(i, i + 1); // Bottom stringer
                this.addConstraint(i + sections + 1, i + sections + 2); // Top stringer
                this.addConstraint(i, i + sections + 1); // Vertical
                this.addConstraint(i, i + sections + 2); // Cross
                this.addConstraint(i + 1, i + sections + 1); // Cross
            }
            this.addConstraint(sections, sections * 2 + 1); // Final vertical

            UI.setHint('Ponte de Treliça — teste a carga em partes específicas');
        }

        if (name === 'fracture') {
            // Wall of breakable constraints
            const rows = 12;
            const cols = 8;
            const spacing = 20;
            const startX = w / 2 - (cols * spacing) / 2;
            const startY = h * 0.2;

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    this.nodes.push({
                        pos: new Vec2(startX + x * spacing, startY + y * spacing),
                        oldPos: new Vec2(startX + x * spacing, startY + y * spacing),
                        fixed: y === 0,
                        radius: 3,
                    });
                }
            }

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x;
                    const breakable = true;
                    if (x < cols - 1) this.addConstraint(i, i + 1, breakable);
                    if (y < rows - 1) this.addConstraint(i, i + cols, breakable);
                }
            }
            UI.setHint('Fratura — aplique força excessiva para quebrar os elos');
        }
    },

    addConstraint(a, b, breakable = false) {
        const dist = this.nodes[a].pos.dist(this.nodes[b].pos);
        this.constraints.push({ a, b, dist, stiffness: this.params.stiffness, breakable, stress: 0 });
    },

    updateStiffness() {
        for (const c of this.constraints) {
            c.stiffness = this.params.stiffness;
        }
    },

    setupInput(canvas) {
        const self = this;
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const mouse = new Vec2(mx, my);

            let closest = null;
            let minDist = 30;

            for (const n of self.nodes) {
                const d = n.pos.dist(mouse);
                if (d < minDist) {
                    minDist = d;
                    closest = n;
                }
            }
            self.dragging = closest;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!self.dragging) return;
            const rect = canvas.getBoundingClientRect();
            self.dragging.pos.set(e.clientX - rect.left, e.clientY - rect.top);
        });

        canvas.addEventListener('mouseup', () => { self.dragging = null; });
    },

    update(dt) {
        this.time += dt;
        const g = new Vec2(0, this.params.gravity * 10);
        const friction = 1 - this.params.friction * 0.1;

        // Verlet Integration
        for (const n of this.nodes) {
            if (n.fixed) continue;
            const velocity = n.pos.sub(n.oldPos).mul(friction);
            n.oldPos = n.pos.copy();
            n.pos = n.pos.add(velocity).add(g.mul(dt * dt));

            // Quick floor collision
            const h = this.renderer.height;
            if (n.pos.y > h - 40) {
                n.pos.y = h - 40;
                n.oldPos.y = n.pos.y + velocity.y * 0.5;
                n.oldPos.x = n.pos.x + velocity.x * this.params.friction;
            }
        }

        // Constraints
        const iterations = 5;
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < this.constraints.length; j++) {
                const c = this.constraints[j];
                const n1 = this.nodes[c.a];
                const n2 = this.nodes[c.b];
                const currentDist = n1.pos.dist(n2.pos);
                const diff = (c.dist - currentDist) / currentDist;
                const correction = n1.pos.sub(n2.pos).mul(diff * c.stiffness * 0.5);

                // Calculate stress for visualization/breakage
                c.stress = Math.abs(diff);

                if (c.breakable && c.stress > 0.5 * this.params.structuralIntegrity) {
                    this.constraints.splice(j, 1);
                    j--;
                    continue;
                }

                if (!n1.fixed) n1.pos = n1.pos.add(correction);
                if (!n2.fixed) n2.pos = n2.pos.sub(correction);
            }
        }
    },

    render(renderer) {
        renderer.clear('#0c0a0f');
        renderer.drawGrid(60, 'rgba(229,153,247,0.02)');
        const ctx = renderer.ctx;
        const w = renderer.width;
        const h = renderer.height;

        // Draw floor
        renderer.drawRect(0, h - 40, w, 40, 'rgba(255,255,255,0.03)');
        renderer.drawLine(new Vec2(0, h - 40), new Vec2(w, h - 40), 'rgba(229,153,247,0.2)', 1.5);

        // Draw constraints
        for (const c of this.constraints) {
            const n1 = this.nodes[c.a];
            const n2 = this.nodes[c.b];
            let color = 'rgba(255,255,255,0.2)';

            if (this.params.showStress) {
                const stressVal = Math.min(c.stress * 4, 1);
                color = `rgba(${255 * stressVal}, ${255 * (1 - stressVal)}, ${255 * (1 - stressVal)}, 0.6)`;
            }

            renderer.drawLine(n1.pos, n2.pos, color, 2);
        }

        // Draw nodes
        for (const n of this.nodes) {
            const color = n.fixed ? '#e599f7' : (n.color || 'rgba(255,255,255,0.6)');
            renderer.drawCircle(n.pos.x, n.pos.y, n.radius || 4, color);
            if (n.label) {
                renderer.drawText(n.label, n.pos.x, n.pos.y - 15, { align: 'center', font: '10px Inter' });
            }
        }

        // Info
        UI.updateInfo('materials-info', `
      Nós: ${this.nodes.length}<br>
      Estruturas: ${this.constraints.length}<br>
      Integridade: ${(this.params.structuralIntegrity * 100).toFixed(0)}%<br>
      Atrito: ${this.params.friction.toFixed(2)}
    `);

        UI.setInfoPills([
            `🧱 Materiais`,
            `Stress: ${this.params.showStress ? 'ON' : 'OFF'}`,
            `${this.constraints.length} links`,
        ]);
    },

    destroy() {
        this.nodes = [];
        this.constraints = [];
        this.dragging = null;
    }
};
