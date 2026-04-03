/* ========================================
   ANTIGRAVITY — Application Controller
   Navigation, global loop, module management
======================================== */

const App = {
    activeModule: null,
    renderer: null,
    isPlaying: true,
    timeScale: 1.0,
    lastTime: 0,
    moduleMap: {
        'mechanics': MechanicsModule,
        'gravity': GravityModule,
        'energy': EnergyModule,
        'thermo': ThermodynamicsModule,
        'waves': WavesModule,
        'electro': ElectromagnetismModule,
        'fluids': FluidsModule,
        'materials': MaterialsModule,
    },

    init() {
        console.log('🌌 Antigravity Simulator Initializing...');

        // Initialize stars background for landing page
        this.initStars();

        // Initialize main canvas renderer
        const canvas = document.getElementById('sim-canvas');
        if (canvas) {
            this.renderer = new Renderer(canvas);
        }

        // Start global animation loop
        requestAnimationFrame((t) => this.loop(t));
    },

    initStars() {
        const canvas = document.getElementById('stars-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h;
        const stars = [];

        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * (window.devicePixelRatio || 1);
            canvas.height = h * (window.devicePixelRatio || 1);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
        };

        window.addEventListener('resize', resize);
        resize();

        // Generate stars
        for (let i = 0; i < 300; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 1.5,
                speed: 0.1 + Math.random() * 0.4,
                opacity: Math.random()
            });
        }

        const drawStars = () => {
            if (document.getElementById('landing-page').classList.contains('hidden')) return;
            ctx.clearRect(0, 0, w, h);
            
            // Nebula Background
            const time = Date.now() * 0.0005;
            const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w*0.8);
            grad.addColorStop(0, '#0a0a20');
            grad.addColorStop(0.5, '#050510');
            grad.addColorStop(1, '#020205');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            for (const s of stars) {
                const flicker = 0.2 + Math.abs(Math.sin(time * s.speed * 20)) * 0.6;
                ctx.globalAlpha = flicker;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();

                // Slow drift
                s.y -= s.speed * 0.3;
                if (s.y < 0) {
                    s.y = h;
                    s.x = Math.random() * w;
                }
            }
            requestAnimationFrame(drawStars);
        };
        drawStars();
    },

    openModule(moduleKey) {
        const mod = this.moduleMap[moduleKey];
        if (!mod) return;

        // UI transitions
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('simulator-view').classList.add('active');
        document.getElementById('sim-title').textContent = mod.name;

        // Initialize module
        if (this.activeModule && this.activeModule.destroy) {
            this.activeModule.destroy();
        }

        this.activeModule = mod;
        mod.init(this.renderer);
        
        // FIX FOR BLACK SCREEN
        if (this.renderer) {
            this.renderer.resize();
        }

        mod.buildUI(document.getElementById('sim-panel'));

        this.isPlaying = true;
        this.updatePlayBtn();

        // Smooth fade in
        const simView = document.getElementById('simulator-view');
        simView.style.opacity = 0;
        setTimeout(() => simView.style.opacity = 1, 50);
    },

    goHome() {
        if (this.activeModule && this.activeModule.destroy) {
            this.activeModule.destroy();
        }
        this.activeModule = null;

        document.getElementById('landing-page').classList.remove('hidden');
        document.getElementById('simulator-view').classList.remove('active');
    },

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        this.updatePlayBtn();
    },

    updatePlayBtn() {
        const btn = document.getElementById('btn-play');
        if (btn) {
            btn.innerHTML = this.isPlaying ? '⏸ Pause' : '▶ Play';
            btn.classList.toggle('active', !this.isPlaying);
        }
    },

    resetSim() {
        if (this.activeModule && this.activeModule.loadScenario) {
            this.activeModule.loadScenario(this.activeModule.scenario);
        }
    },

    cycleSpeed() {
        const speeds = [0.1, 0.5, 1.0, 2.0, 5.0];
        let idx = speeds.indexOf(this.timeScale);
        this.timeScale = speeds[(idx + 1) % speeds.length];
        document.getElementById('btn-speed').textContent = this.timeScale + 'x';
    },

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.activeModule && this.renderer) {
            // Sub-stepping for stability
            const substeps = 4;
            const subDt = (dt * this.timeScale) / substeps;

            if (this.isPlaying && dt < 0.1) {
                for (let i = 0; i < substeps; i++) {
                    this.activeModule.update(subDt);
                }
            }

            this.activeModule.render(this.renderer);
        }

        requestAnimationFrame((t) => this.loop(t));
    }
};

// Global entry point
window.addEventListener('DOMContentLoaded', () => App.init());
