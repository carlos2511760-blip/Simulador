/* ========================================
   ANTIGRAVITY — Canvas Renderer
   Drawing utilities, trails, grids, vectors
======================================== */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    clear(color = '#0a0a0f') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /* ---- Grid ---- */
    drawGrid(spacing = 50, color = 'rgba(255,255,255,0.03)') {
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = spacing; x < this.width; x += spacing) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
        }
        for (let y = spacing; y < this.height; y += spacing) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
        }
        ctx.stroke();
    }

    /* ---- Bodies ---- */
    drawBody(body, glowColor) {
        const ctx = this.ctx;
        const { pos, radius, color } = body;

        // Glow
        if (glowColor) {
            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = radius * 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = glowColor;
            ctx.fill();
            ctx.restore();
        }

        // Main circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Highlight
        if (radius > 4) {
            ctx.beginPath();
            ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fill();
        }

        // Label
        if (body.label) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(body.label, pos.x, pos.y - radius - 6);
        }
    }

    /* ---- Trail ---- */
    drawTrail(trail, color = 'rgba(132,94,247,0.3)', width = 1.5) {
        if (trail.length < 2) return;
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    /* ---- Vectors / Arrows ---- */
    drawArrow(from, to, color = '#ff6b6b', width = 2, headSize = 8) {
        const ctx = this.ctx;
        const dir = to.sub(from);
        const len = dir.mag();
        if (len < 1) return;
        const angle = dir.angle();

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
            to.x - headSize * Math.cos(angle - 0.4),
            to.y - headSize * Math.sin(angle - 0.4)
        );
        ctx.lineTo(
            to.x - headSize * Math.cos(angle + 0.4),
            to.y - headSize * Math.sin(angle + 0.4)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /* ---- Text ---- */
    drawText(text, x, y, opts = {}) {
        const ctx = this.ctx;
        ctx.fillStyle = opts.color || 'rgba(255,255,255,0.7)';
        ctx.font = opts.font || '12px JetBrains Mono';
        ctx.textAlign = opts.align || 'left';
        ctx.textBaseline = opts.baseline || 'top';
        ctx.fillText(text, x, y);
    }

    /* ---- Lines ---- */
    drawLine(from, to, color = 'rgba(255,255,255,0.1)', width = 1, dash) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
    }

    /* ---- Circle ---- */
    drawCircle(x, y, r, color, fill = true, lineWidth = 1) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
    }

    /* ---- Rectangle ---- */
    drawRect(x, y, w, h, color, fill = true, lineWidth = 1) {
        const ctx = this.ctx;
        if (fill) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.strokeRect(x, y, w, h);
        }
    }

    /* ---- Gradient Circle ---- */
    drawGradientCircle(x, y, r, colorInner, colorOuter) {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, colorInner);
        gradient.addColorStop(1, colorOuter);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    /* ---- Wavy Line ---- */
    drawWave(startX, startY, width, amplitude, frequency, phase, color = '#22b8cf', lineWidth = 2) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let x = 0; x <= width; x++) {
            const y = startY + amplitude * Math.sin((x / width) * frequency * Math.PI * 2 + phase);
            if (x === 0) ctx.moveTo(startX + x, y);
            else ctx.lineTo(startX + x, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    /* ---- Field Lines ---- */
    drawFieldLine(points, color = 'rgba(81,207,102,0.4)', width = 1) {
        if (points.length < 2) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }
}
