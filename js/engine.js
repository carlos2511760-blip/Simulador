/* ========================================
   ANTIGRAVITY — Core Physics Engine
   Vectors, integration, collision detection
======================================== */

class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  copy() { return new Vec2(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vec2(this.x * s, this.y * s); }
  div(s) { return s !== 0 ? new Vec2(this.x / s, this.y / s) : new Vec2(); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  cross(v) { return this.x * v.y - this.y * v.x; }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  magSq() { return this.x * this.x + this.y * this.y; }
  norm() { const m = this.mag(); return m > 0 ? this.div(m) : new Vec2(); }
  dist(v) { return this.sub(v).mag(); }
  angle() { return Math.atan2(this.y, this.x); }
  rotate(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }
  lerp(v, t) { return new Vec2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t); }
  limit(max) {
    const m = this.mag();
    return m > max ? this.norm().mul(max) : this.copy();
  }

  static fromAngle(a, mag = 1) { return new Vec2(Math.cos(a) * mag, Math.sin(a) * mag); }
  static random(mag = 1) { return Vec2.fromAngle(Math.random() * Math.PI * 2, mag); }
}

/* ---- Particle / Body ---- */
class Body {
  constructor(opts = {}) {
    this.pos = opts.pos || new Vec2();
    this.vel = opts.vel || new Vec2();
    this.acc = opts.acc || new Vec2();
    this.mass = opts.mass || 1;
    this.radius = opts.radius || 10;
    this.color = opts.color || '#845ef7';
    this.fixed = opts.fixed || false;
    this.charge = opts.charge || 0;
    this.temperature = opts.temperature || 300; // Kelvin
    this.trail = [];
    this.maxTrail = opts.maxTrail || 60;
    this.restitution = opts.restitution !== undefined ? opts.restitution : 0.8;
    this.label = opts.label || '';
    this.id = Body._nextId++;
    this.userData = opts.userData || {};
  }

  applyForce(force) {
    if (this.fixed) return;
    this.acc = this.acc.add(force.div(this.mass));
  }

  update(dt) {
    if (this.fixed) return;
    this.vel = this.vel.add(this.acc.mul(dt));
    this.pos = this.pos.add(this.vel.mul(dt));
    this.acc = new Vec2();

    // Store trail
    this.trail.push(this.pos.copy());
    if (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }
  }

  kineticEnergy() {
    return 0.5 * this.mass * this.vel.magSq();
  }

  momentum() {
    return this.vel.mul(this.mass);
  }
}
Body._nextId = 0;

/* ---- Physics World ---- */
class PhysicsWorld {
  constructor() {
    this.bodies = [];
    this.gravity = new Vec2(0, 0);
    this.bounds = null; // { x, y, w, h }
    this.damping = 1.0;
    this.substeps = 1;
  }

  addBody(body) {
    this.bodies.push(body);
    return body;
  }

  removeBody(body) {
    const idx = this.bodies.indexOf(body);
    if (idx >= 0) this.bodies.splice(idx, 1);
  }

  clear() {
    this.bodies = [];
  }

  step(dt) {
    const subDt = dt / this.substeps;
    for (let s = 0; s < this.substeps; s++) {
      for (const b of this.bodies) {
        if (!b.fixed) {
          b.applyForce(this.gravity.mul(b.mass));
        }
      }
      for (const b of this.bodies) {
        b.update(subDt);
        if (!b.fixed) {
          b.vel = b.vel.mul(this.damping);
        }
      }
      if (this.bounds) {
        this.enforceBounds();
      }
      this.resolveCollisions();
    }
  }

  enforceBounds() {
    const { x, y, w, h } = this.bounds;
    for (const b of this.bodies) {
      if (b.fixed) continue;
      if (b.pos.x - b.radius < x) {
        b.pos.x = x + b.radius;
        b.vel.x *= -b.restitution;
      }
      if (b.pos.x + b.radius > x + w) {
        b.pos.x = x + w - b.radius;
        b.vel.x *= -b.restitution;
      }
      if (b.pos.y - b.radius < y) {
        b.pos.y = y + b.radius;
        b.vel.y *= -b.restitution;
      }
      if (b.pos.y + b.radius > y + h) {
        b.pos.y = y + h - b.radius;
        b.vel.y *= -b.restitution;
      }
    }
  }

  resolveCollisions() {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const a = this.bodies[i];
        const b = this.bodies[j];
        const dist = a.pos.dist(b.pos);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0) {
          const normal = b.pos.sub(a.pos).norm();
          const overlap = minDist - dist;

          // Separate
          if (!a.fixed && !b.fixed) {
            const totalMass = a.mass + b.mass;
            a.pos = a.pos.sub(normal.mul(overlap * b.mass / totalMass));
            b.pos = b.pos.add(normal.mul(overlap * a.mass / totalMass));
          } else if (a.fixed) {
            b.pos = b.pos.add(normal.mul(overlap));
          } else {
            a.pos = a.pos.sub(normal.mul(overlap));
          }

          // Impulse
          const relVel = a.vel.sub(b.vel);
          const velAlongNormal = relVel.dot(normal);
          if (velAlongNormal > 0) continue;

          const e = Math.min(a.restitution, b.restitution);
          const invMassA = a.fixed ? 0 : 1 / a.mass;
          const invMassB = b.fixed ? 0 : 1 / b.mass;
          const impulse = -(1 + e) * velAlongNormal / (invMassA + invMassB);

          if (!a.fixed) a.vel = a.vel.add(normal.mul(-impulse * invMassA));
          if (!b.fixed) b.vel = b.vel.sub(normal.mul(-impulse * invMassB));
        }
      }
    }
  }
}

/* ---- Utility Functions ---- */
const PhysicsUtils = {
  G: 6.674e-11,  // Gravitational constant (real)
  k: 8.987e9,    // Coulomb constant (real)
  kB: 1.381e-23, // Boltzmann constant

  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  map(v, inMin, inMax, outMin, outMax) {
    return outMin + (v - inMin) * (outMax - outMin) / (inMax - inMin);
  },
  randomRange(min, max) { return min + Math.random() * (max - min); },
  hslToString(h, s, l, a = 1) { return `hsla(${h}, ${s}%, ${l}%, ${a})`; },
  
  /* Bezier multi-point calculation (Recursive De Casteljau) */
  getBezierPoint(pts, t) {
    if (!pts || pts.length === 0) return new Vec2();
    if (pts.length === 1) return pts[0].copy();
    const nextLayer = [];
    for (let i = 0; i < pts.length - 1; i++) {
        nextLayer.push(pts[i].lerp(pts[i+1], t));
    }
    return this.getBezierPoint(nextLayer, t);
  }
};
