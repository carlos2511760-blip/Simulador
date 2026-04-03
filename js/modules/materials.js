/* ========================================
   MODULE 8: Material Physics
   Deformation, Friction, Fractures
======================================== */

const MaterialsModule = {
    name: 'Física de Materiais',
    key: 'materials',
    renderer: null,
    scenario: 'deformation',
    nodes: [],
    constraints: [],
    params: { stiffness: 0.6, friction: 0.2, structuralIntegrity: 0.8, showStress: true, gravity: 9.8 },
    time: 0,
    dragging: null,

    init(renderer) {
        this.renderer = renderer;
        this.loadScenario('deformation');
        this.setupInput(renderer.canvas);
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Resistência',
                    type: 'scenarios',
                    items: [
                        { label: '🍮 Gelatina', color: '#e599f7', active: true, onSelect: () => self.loadScenario('deformation') },
                        { label: '🧱 Parede de Tijolo', color: '#ff6b6b', onSelect: () => self.loadScenario('fracture') },
                        { label: '🪵 Ponte Suspendida', color: '#51cf66', onSelect: () => self.loadScenario('bridge') },
                    ]
                },
                {
                    title: 'Controles',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'mat-stiff', label: 'Elasticidade', min: 0.05, max: 1.0, step: 0.05, value: self.params.stiffness, unit: '', onChange: v => { self.params.stiffness = v; self.updateStiffness(); } },
                        { kind: 'slider', id: 'mat-integ', label: 'Dureza', min: 0.1, max: 2.0, step: 0.1, value: self.params.structuralIntegrity, unit: '', onChange: v => { self.params.structuralIntegrity = v; } },
                        { kind: 'button', id: 'mat-reset', label: '↺ Reset Construção', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Integridade',
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
        const w = this.renderer.width, h = this.renderer.height;

        if (name === 'deformation') {
            const size = 6, spacing = 35, startX = w/2 - (size*spacing)/2, startY = h/3;
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    this.nodes.push({ pos: new Vec2(startX + x * spacing, startY + y * spacing), oldPos: new Vec2(startX + x * spacing, startY + y * spacing), fixed: y === 0 && (x === 0 || x === size-1), radius: 5 });
                }
            }
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = y * size + x;
                    if (x < size - 1) this.addConstraint(i, i + 1);
                    if (y < size - 1) this.addConstraint(i, i + size);
                    if (x < size - 1 && y < size - 1) { this.addConstraint(i, i + size + 1); this.addConstraint(i + 1, i + size); }
                }
            }
            UI.setHint('🍮 Puxe a gelatina e veja-a balançar!');
        }

        if (name === 'fracture') {
            const rows = 12, cols = 8, spacing = 22, startX = w/2 - (cols*spacing)/2, startY = h*0.2;
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    this.nodes.push({ pos: new Vec2(startX+x*spacing, startY+y*spacing), oldPos: new Vec2(startX+x*spacing, startY+y*spacing), fixed: y === 0, radius: 4 });
                }
            }
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y*cols+x;
                    if (x < cols-1) this.addConstraint(i, i+1, true);
                    if (y < rows-1) this.addConstraint(i, i+cols, true);
                }
            }
            UI.setHint('Tijolos Frágeis — arraste com força para quebrar a parede!');
        }

        if (name === 'bridge') {
            const startX = w*0.15, sections = 12, sw = (w*0.7)/sections, midY = h*0.65;
            for (let i = 0; i <= sections; i++) {
                this.nodes.push({ pos: new Vec2(startX+i*sw, midY), oldPos: new Vec2(startX+i*sw, midY), fixed: i === 0 || i === sections, radius: 4 });
                this.nodes.push({ pos: new Vec2(startX+i*sw, midY-60), oldPos: new Vec2(startX+i*sw, midY-60), fixed: false, radius: 4 });
            }
            for (let i = 0; i < sections; i++) {
                const b1=i*2, t1=i*2+1, b2=(i+1)*2, t2=(i+1)*2+1;
                this.addConstraint(b1, b2); this.addConstraint(t1, t2); this.addConstraint(b1, t1); this.addConstraint(b1, t2); this.addConstraint(b2, t1);
            }
            this.addConstraint(sections*2, sections*2+1);
            UI.setHint('Ponte — arraste o meio para testar a resistência das treliças');
        }
    },

    addConstraint(a, b, breakable = false) {
        const dist = this.nodes[a].pos.dist(this.nodes[b].pos);
        this.constraints.push({ a, b, dist, stiffness: this.params.stiffness, breakable, stress: 0 });
    },

    updateStiffness() { for (const c of this.constraints) c.stiffness = this.params.stiffness; },

    setupInput(canvas) {
        const self = this;
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouse = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
            let closest = null, minDist = 40;
            for (const n of self.nodes) { const d = n.pos.dist(mouse); if (d < minDist) { minDist = d; closest = n; } }
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
        const g = new Vec2(0, this.params.gravity * 20), friction = 0.98;
        for (const n of this.nodes) {
            if (n.fixed) continue;
            const vel = n.pos.sub(n.oldPos).mul(friction);
            n.oldPos = n.pos.copy();
            n.pos = n.pos.add(vel).add(g.mul(dt * dt));
            if (n.pos.y > this.renderer.height - 40) { n.pos.y = this.renderer.height - 40; n.oldPos.y = n.pos.y + vel.y * 0.2; }
        }
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < this.constraints.length; j++) {
                const c = this.constraints[j], n1 = this.nodes[c.a], n2 = this.nodes[c.b];
                const d = n1.pos.dist(n2.pos), diff = (c.dist - d) / d;
                const corr = n1.pos.sub(n2.pos).mul(diff * c.stiffness * 0.5);
                c.stress = Math.abs(diff);
                if (c.breakable && c.stress > 0.4 * this.params.structuralIntegrity) { this.constraints.splice(j, 1); j--; continue; }
                if (!n1.fixed) n1.pos = n1.pos.add(corr);
                if (!n2.fixed) n2.pos = n2.pos.sub(corr);
            }
        }
    },

    render(renderer) {
        renderer.clear('#0c0a0f'); renderer.drawGrid(60);
        const ctx = renderer.ctx, w = renderer.width, h = renderer.height;
        renderer.drawRect(0, h - 40, w, 40, 'rgba(255,255,255,0.02)');
        renderer.drawLine(new Vec2(0, h - 40), new Vec2(w, h - 40), 'rgba(255,255,255,0.1)', 1);

        for (const c of this.constraints) {
            const stress = Math.min(c.stress * 4 / this.params.structuralIntegrity, 1);
            const color = `rgba(${Math.floor(255*stress)}, ${Math.floor(255*(1-stress))}, 100, 0.8)`;
            renderer.drawLine(this.nodes[c.a].pos, this.nodes[c.b].pos, color, 3);
        }
        for (const n of this.nodes) {
            const color = n.fixed ? '#e599f7' : '#fff';
            renderer.drawCircle(n.pos.x, n.pos.y, n.radius || 4, color);
        }
        UI.setInfoPills([`🧱 Materiais`, `Nós: ${this.nodes.length}`, `Links: ${this.constraints.length}`]);
    },
    destroy() { this.nodes = []; this.constraints = []; }
};
