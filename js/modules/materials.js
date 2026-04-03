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
    params: { stiffness: 1.0, friction: 0.95, structuralIntegrity: 0.3, yieldPoint: 0.1, gravity: 9.8 },
    time: 0,
    dragging: null,

    init(renderer) {
        this.renderer = renderer;
        this.loadScenario('bridge');
        this.setupInput(renderer.canvas);
    },

    buildUI(panel) {
        const self = this;
        UI.buildPanel(panel, {
            sections: [
                {
                    title: 'Laboratório de Estruturas',
                    type: 'scenarios',
                    items: [
                        { label: '🌉 Treliça Metálica', color: '#51cf66', active: true, onSelect: () => self.loadScenario('bridge') },
                        { label: '🗜️ Ensaio de Tração', color: '#339af0', onSelect: () => self.loadScenario('tensile') },
                        { label: '🧱 Teste de Impacto', color: '#ff6b6b', onSelect: () => self.loadScenario('fracture') },
                    ]
                },
                {
                    title: 'Propriedades do Material',
                    type: 'controls',
                    items: [
                        { kind: 'slider', id: 'mat-stiff', label: 'Módulo de Young (E)', min: 0.1, max: 1.5, step: 0.1, value: self.params.stiffness, unit: '', onChange: v => { self.params.stiffness = v; self.updateStiffness(); } },
                        { kind: 'slider', id: 'mat-yield', label: 'Limite Elástico (Yield)', min: 0.02, max: 0.5, step: 0.02, value: self.params.yieldPoint, unit: '', onChange: v => { self.params.yieldPoint = v; } },
                        { kind: 'slider', id: 'mat-integ', label: 'Tensão de Ruptura', min: 0.05, max: 0.8, step: 0.05, value: self.params.structuralIntegrity, unit: '', onChange: v => { self.params.structuralIntegrity = v; } },
                        { kind: 'button', id: 'mat-reset', label: '↺ Reconstruir', onClick: () => self.loadScenario(self.scenario) },
                    ]
                },
                {
                    title: 'Relatório de Tensão',
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

        if (name === 'tensile') {
            const cols = 4, rows = 12, spacing = 20, startX = w/2 - (cols*spacing)/2, startY = h*0.2;
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const isFixed = y === 0 || y === rows - 1; // Fix top and bottom
                    this.nodes.push({ pos: new Vec2(startX + x * spacing, startY + y * spacing), oldPos: new Vec2(startX + x * spacing, startY + y * spacing), fixed: y === 0, radius: 4, mass: 1, isPullNode: y === rows - 1 });
                }
            }
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x;
                    if (x < cols - 1) this.addConstraint(i, i + 1, true); // horizontal
                    if (y < rows - 1) this.addConstraint(i, i + cols, true); // vertical
                    if (x < cols - 1 && y < rows - 1) { 
                        this.addConstraint(i, i + cols + 1, true); // diag 1
                        this.addConstraint(i + 1, i + cols, true); // diag 2
                    }
                }
            }
            UI.setHint('🗜️ Ensaio de Tração — Arraste a base para baixo firmemente para ver o comportamento gráfico!');
        }

        if (name === 'fracture') {
            const rows = 12, cols = 8, spacing = 22, startX = w/2 - (cols*spacing)/2, startY = h*0.2;
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    this.nodes.push({ pos: new Vec2(startX+x*spacing, startY+y*spacing), oldPos: new Vec2(startX+x*spacing, startY+y*spacing), fixed: y === 0, radius: 4, mass: 2 });
                }
            }
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y*cols+x;
                    if (x < cols-1) this.addConstraint(i, i+1, true); // h
                    if (y < rows-1) this.addConstraint(i, i+cols, true); // v
                    if (x < cols-1 && y < rows-1) { this.addConstraint(i, i+cols+1, true); this.addConstraint(i+1, i+cols, true); }
                }
            }
            // Add a heavy wrecking ball to crash into it
            this.nodes.push({ pos: new Vec2(startX - 150, startY + rows*spacing/2), oldPos: new Vec2(startX - 230, startY + rows*spacing/2), fixed: false, radius: 25, mass: 100, isHeavy: true });
            UI.setHint('🧱 Destruição — Arraste o bloco ou atire massas nele!');
        }

        if (name === 'bridge') {
            const startX = w*0.15, sections = 12, sw = (w*0.7)/sections, midY = h*0.5;
            for (let i = 0; i <= sections; i++) {
                // Bottom chord
                this.nodes.push({ pos: new Vec2(startX+i*sw, midY), oldPos: new Vec2(startX+i*sw, midY), fixed: i === 0 || i === sections, radius: 5, mass: 1 });
                // Top chord
                this.nodes.push({ pos: new Vec2(startX+i*sw + (i<sections ? sw/2 : 0), midY-50), oldPos: new Vec2(startX+i*sw + (i<sections ? sw/2 : 0), midY-50), fixed: false, radius: 5, mass: 1 });
            }
            // Connect truss
            for (let i = 0; i < sections; i++) {
                const b1=i*2, t1=i*2+1, b2=(i+1)*2, t2=(i+1)*2+1;
                this.addConstraint(b1, b2, true); // bottom horizontal
                if (i < sections - 1) this.addConstraint(t1, t2, true); // top horizontal
                this.addConstraint(b1, t1, true); // diag up-right
                this.addConstraint(t1, b2, true); // diag down-right
            }
            this.addConstraint(sections*2, sections*2-1, true);
            UI.setHint('🌉 Treliça — Arraste qualquer nó para aplicar cargas. Azul = Compressão, Vermelho = Tração');
        }
    },

    addConstraint(a, b, breakable = false) {
        const dist = this.nodes[a].pos.dist(this.nodes[b].pos);
        this.constraints.push({ a, b, dist, stiffness: this.params.stiffness, breakable, strain: 0, plasticStrain: 0 });
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
        const g = new Vec2(0, this.params.gravity * 20);
        const friction = this.params.friction;
        
        // Verlet numerical integration
        for (const n of this.nodes) {
            if (n.fixed) continue;
            const vel = n.pos.sub(n.oldPos).mul(friction);
            n.oldPos = n.pos.copy();
            n.pos = n.pos.add(vel).add(g.mul(dt * dt * n.mass));
            
            // Ground collision
            if (n.pos.y > this.renderer.height - 40 - n.radius) { 
                n.pos.y = this.renderer.height - 40 - n.radius; 
                n.oldPos.y = n.pos.y + vel.y * 0.2; 
                n.pos.x = n.oldPos.x + vel.x * 0.5; // floor friction
            }
        }
        
        // Solve constraints using Gauss-Seidel relaxation (Multiple iterations for rigidity = True Solid Physics)
        const iterations = 50;
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < this.constraints.length; j++) {
                const c = this.constraints[j];
                const n1 = this.nodes[c.a];
                const n2 = this.nodes[c.b];
                
                const delta = n2.pos.sub(n1.pos);
                let d = delta.mag();
                if (d === 0) continue;
                
                // Engineering strain (deformação)
                const currentRest = c.dist * (1 + c.plasticStrain);
                let strain = (d - currentRest) / currentRest; 
                
                // Yielding / Plastic Deformation
                if (Math.abs(strain) > this.params.yieldPoint) {
                    const plasticIncrement = (Math.abs(strain) - this.params.yieldPoint) * Math.sign(strain) * 0.05;
                    c.plasticStrain += plasticIncrement;
                    strain -= plasticIncrement; 
                }
                
                c.strain = strain; // Positive = tension, Negative = compression
                
                // Fast fracture mechanics
                if (c.breakable && Math.abs(strain) > this.params.structuralIntegrity) {
                    this.constraints.splice(j, 1); 
                    j--; 
                    continue; 
                }
                
                // Apply Hooke's Law Restoring correction
                const diff = (d - currentRest) / d;
                const totalMass = n1.mass + n2.mass;
                const m1Ratio = n2.mass / totalMass;
                const m2Ratio = n1.mass / totalMass;
                
                const corr = delta.mul(diff * c.stiffness * 0.5);
                
                if (!n1.fixed) n1.pos = n1.pos.add(corr.mul(m1Ratio * 2));
                if (!n2.fixed) n2.pos = n2.pos.sub(corr.mul(m2Ratio * 2));
            }
        }
    },

    render(renderer) {
        renderer.clear('#0c0a0f'); renderer.drawGrid(60);
        const ctx = renderer.ctx, w = renderer.width, h = renderer.height;
        renderer.drawRect(0, h - 40, w, 40, 'rgba(255,255,255,0.02)');
        renderer.drawLine(new Vec2(0, h - 40), new Vec2(w, h - 40), 'rgba(255,255,255,0.1)', 1);

        let maxTension = 0;
        let maxCompression = 0;
        
        for (const c of this.constraints) {
            const isTension = c.strain > 0;
            const absStrain = Math.abs(c.strain);
            
            if (isTension && absStrain > maxTension) maxTension = absStrain;
            if (!isTension && absStrain > maxCompression) maxCompression = absStrain;
            
            // Map stress to color (Engineering standard: Red = Tension, Blue = Compression)
            const intensity = Math.min(absStrain / this.params.structuralIntegrity, 1);
            let color;
            if (intensity < 0.01) color = 'rgba(255,255,255,0.4)';
            else if (isTension) {
                color = `rgba(255, ${Math.floor(255*(1-intensity))}, ${Math.floor(255*(1-intensity))}, ${0.4 + 0.6*intensity})`;
            } else {
                color = `rgba(${Math.floor(255*(1-intensity))}, ${Math.floor(180*(1-intensity) + 50)}, 255, ${0.4 + 0.6*intensity})`;
            }
            
            renderer.drawLine(this.nodes[c.a].pos, this.nodes[c.b].pos, color, c.isHeavy ? 6 : 3);
        }
        
        if (!this.history) this.history = [];
        this.history.push({ t: maxTension, c: maxCompression });
        if (this.history.length > 150) this.history.shift();

        if (this.history.length > 0) {
            const h1 = { data: this.history.map(h => h.t * 100), color: '#ff6b6b', label: 'Tração Máx (%)', maxPoints: 150, fill: true };
            const h2 = { data: this.history.map(h => h.c * 100), color: '#339af0', label: 'Comp. Máx (%)', maxPoints: 150, fill: true };
            
            renderer.drawChart('Tensão Mecânica (Strain %)', [h1, h2], w - 370, 20, 350, 160);
            
            const globalMax = Math.max(maxTension, maxCompression);
            renderer.drawGauge('Risco Ruptura', globalMax, 0, this.params.structuralIntegrity, '', w - 120, 260, 60, globalMax > this.params.yieldPoint ? '#ff6b6b' : '#51cf66');
            
            // Labels for engineering
            renderer.drawText('█ Tração (Esticando)', w - 350, 200, { color: '#ff6b6b', font: '10px Inter' });
            renderer.drawText('█ Compressão (Apertando)', w - 350, 220, { color: '#339af0', font: '10px Inter' });
        }

        for (const n of this.nodes) {
            let color = '#fff';
            if (n.fixed) color = '#adb5bd';
            if (n.isPullNode) color = '#ff922b';
            if (n.isHeavy) color = '#495057';
            renderer.drawCircle(n.pos.x, n.pos.y, n.radius || 4, color);
        }
        
        UI.updateInfo('materials-info', `
          Módulo E: ${this.params.stiffness.toFixed(2)}<br>
          Ruptura em: ${(this.params.structuralIntegrity*100).toFixed(0)}% strain<br>
          Tração Atual: ${(maxTension*100).toFixed(1)}%<br>
          Compr Atual: ${(maxCompression*100).toFixed(1)}%
        `);
        
        UI.setInfoPills([`🛠️ Ciênc. Materiais`, `Nós: ${this.nodes.length}`, `Links: ${this.constraints.length}`]);
    },
    destroy() { this.nodes = []; this.constraints = []; this.history = []; }
};
