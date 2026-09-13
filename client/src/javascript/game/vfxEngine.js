/**
 * VFX and Visual Game Feel Engine for Fighter Arena.
 * Handles realistic blood splatter physics, floor staining, sparks, dust,
 * screen shake, hit-stop freeze, floating combat text, and projectiles.
 */

export default function createVFXManager(canvas, context) {
    const particles = [];
    const bloodStains = [];
    const floatingTexts = [];
    const projectiles = [];
    let hitStopTimer = 0;

    // --- Screen Shake ---
    const triggerScreenShake = (intensity = 'medium') => {
        const container = document.querySelector('.arena___battlefield') || document.querySelector('.arena___root');
        if (!container) return;

        const className = `arena--shake-${intensity}`;
        container.classList.remove('arena--shake-light', 'arena--shake-medium', 'arena--shake-heavy');
        // Force reflow
        // eslint-disable-next-line no-unused-expressions
        container.offsetHeight;
        container.classList.add(className);

        let duration = 140;
        if (intensity === 'heavy') duration = 350;
        else if (intensity === 'medium') duration = 220;
        setTimeout(() => {
            container.classList.remove(className);
        }, duration);
    };

    // --- Hit-Stop (Micro-freeze) ---
    const triggerHitStop = durationMs => {
        hitStopTimer = Math.max(hitStopTimer, durationMs);
    };

    const isHitStopped = () => hitStopTimer > 0;

    // --- Particle Spawning ---
    const spawnHitSparks = (x, y, isBlocked = false, isCrit = false) => {
        let count = 18;
        let baseColor = '#f59e0b';
        let colors = ['#fde047', '#f59e0b', '#d97706', '#ffffff'];

        if (isCrit) {
            count = 26;
            baseColor = '#ef4444';
            colors = ['#f87171', '#ef4444', '#dc2626', '#fbbf24', '#ffffff'];
        } else if (isBlocked) {
            count = 14;
            baseColor = '#fbbf24';
            colors = ['#fef08a', '#fde047', '#eab308', '#ffffff'];
        }

        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 5 + 2) * (isCrit ? 1.4 : 1);
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)] || baseColor,
                alpha: 1,
                decay: Math.random() * 0.035 + 0.025,
                gravity: 0.18,
                glow: isCrit
            });
        }
    };

    // --- Realistic Subtle Blood System ---
    const bloodPalette = [
        { main: '#5e0606', splat: '#330202' },
        { main: '#730808', splat: '#3d0303' },
        { main: '#850a0a', splat: '#450404' },
        { main: '#960c0c', splat: '#4a0404' },
        { main: '#4f0404', splat: '#2b0101' }
    ];

    const spawnBlood = (x, y, direction = 1, intensity = 'normal') => {
        let count = 9;
        let minSpeed = 2.5;
        let maxSpeed = 7.0;
        let baseUpward = -2.8;

        if (intensity === 'fatal') {
            count = 25;
            minSpeed = 4.0;
            maxSpeed = 12.0;
            baseUpward = -5.5;
        } else if (intensity === 'heavy') {
            count = 15;
            minSpeed = 3.0;
            maxSpeed = 9.0;
            baseUpward = -4.0;
        }

        for (let i = 0; i < count; i += 1) {
            // Tight spray cone away from the strike impact
            const spread = (Math.random() - 0.5) * 0.75;
            const angle = direction > 0 ? -0.32 + spread : Math.PI + 0.32 + spread;
            const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
            const colorSet = bloodPalette[Math.floor(Math.random() * bloodPalette.length)];

            // Natural fine droplet sizes
            let size = Math.random() * 1.2 + 1.1; // Default fine droplet: 1.1 - 2.3px
            if (Math.random() < 0.25) {
                size = Math.random() * 1.0 + 2.4; // Occasional larger bead: 2.4 - 3.4px
            }

            particles.push({
                isBlood: true,
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed + direction * 0.8,
                vy: Math.sin(angle) * speed + baseUpward * (Math.random() * 0.5 + 0.6),
                size,
                color: colorSet.main,
                splatColor: colorSet.splat,
                alpha: 0.95,
                decay: Math.random() * 0.016 + 0.012,
                gravity: 0.38 + Math.random() * 0.08,
                glow: false
            });
        }
    };

    const spawnDust = (x, y, direction = 1) => {
        const count = 8;
        for (let i = 0; i < count; i += 1) {
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y - Math.random() * 8,
                vx: -direction * (Math.random() * 2.5 + 1),
                vy: -Math.random() * 1.5,
                size: Math.random() * 6 + 4,
                color: '#cbd5e1',
                alpha: 0.55,
                decay: Math.random() * 0.04 + 0.03,
                gravity: -0.02,
                glow: false
            });
        }
    };

    // --- Floating Combat Text ---
    const spawnFloatingText = (x, y, text, type = 'hit') => {
        const colorMap = {
            combo: '#fbbf24',
            crit: '#ef4444',
            punish: '#38bdf8',
            block: '#94a3b8',
            hit: '#f8fafc',
            special: '#a855f7'
        };

        const fontSizeMap = {
            combo: 26,
            crit: 28,
            punish: 22,
            block: 18,
            hit: 20,
            special: 24
        };

        floatingTexts.push({
            x: x + (Math.random() - 0.5) * 24,
            y: y - 20,
            text,
            color: colorMap[type] || '#fbbf24',
            fontSize: fontSizeMap[type] || 22,
            alpha: 1,
            vy: -1.6,
            scale: 1.3,
            lifetime: 0,
            maxLifetime: 750
        });
    };

    // --- Special Move Projectiles ---
    const spawnProjectile = (ownerSide, x, y, facingLeft, config = {}) => {
        const dir = facingLeft ? -1 : 1;
        projectiles.push({
            id: `proj_${Date.now()}_${Math.random()}`,
            ownerSide,
            x,
            y,
            vx: dir * (config.speed || 8),
            vy: config.vy || 0,
            radius: config.radius || 24,
            type: config.type || 'energy',
            color: config.color || '#38bdf8',
            secondaryColor: config.secondaryColor || '#67e8f9',
            damage: config.damage || 14,
            isLow: Boolean(config.isLow),
            active: true,
            trail: []
        });
    };

    // --- Update Loop ---
    const update = elapsed => {
        if (hitStopTimer > 0) {
            hitStopTimer -= elapsed;
            if (hitStopTimer < 0) hitStopTimer = 0;
        }

        const groundY = canvas.height - 20;

        // Update active flying particles
        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const p = particles[i];
            const timeScale = elapsed / 16;

            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.vy += p.gravity * timeScale;

            if (p.isBlood) {
                p.vx *= 0.955; // Fluid viscous drag

                // Ground splat check
                if (p.y >= groundY - 2) {
                    if (p.size >= 1.5 && bloodStains.length < 40) {
                        const satellites = [];
                        if (p.size >= 2.2) {
                            satellites.push({
                                dx: (Math.random() - 0.5) * 10,
                                dy: (Math.random() - 0.5) * 3,
                                r: Math.random() * 0.6 + 0.6
                            });
                        }

                        bloodStains.push({
                            x: p.x,
                            y: groundY - Math.random() * 2,
                            radiusX: p.size * (1.1 + Math.random() * 0.5),
                            radiusY: Math.max(0.7, p.size * 0.32),
                            angle: (Math.random() - 0.5) * 0.2,
                            color: p.splatColor || '#330202',
                            alpha: 0.82,
                            lifetime: 0,
                            maxLifetime: 4500 + Math.random() * 2000,
                            satellites
                        });
                    }

                    particles.splice(i, 1);
                    // eslint-disable-next-line no-continue
                    continue;
                }
            }

            p.alpha -= p.decay * timeScale;

            if (p.alpha <= 0 || p.size <= 0.4) {
                particles.splice(i, 1);
            }
        }

        // Update floor blood stains
        for (let i = bloodStains.length - 1; i >= 0; i -= 1) {
            const stain = bloodStains[i];
            stain.lifetime += elapsed;
            if (stain.lifetime >= stain.maxLifetime) {
                bloodStains.splice(i, 1);
            }
        }

        // Update floating combat texts
        for (let i = floatingTexts.length - 1; i >= 0; i -= 1) {
            const ft = floatingTexts[i];
            ft.lifetime += elapsed;
            ft.y += ft.vy * (elapsed / 16);
            if (ft.scale > 1) {
                ft.scale = Math.max(1, ft.scale - 0.05 * (elapsed / 16));
            }
            ft.alpha = Math.max(0, 1 - ft.lifetime / ft.maxLifetime);

            if (ft.lifetime >= ft.maxLifetime || ft.alpha <= 0) {
                floatingTexts.splice(i, 1);
            }
        }

        // Update projectiles
        for (let i = projectiles.length - 1; i >= 0; i -= 1) {
            const proj = projectiles[i];
            if (!proj.active) {
                projectiles.splice(i, 1);
                // eslint-disable-next-line no-continue
                continue;
            }

            proj.trail.push({ x: proj.x, y: proj.y, alpha: 0.8 });
            if (proj.trail.length > 8) proj.trail.shift();

            proj.x += proj.vx * (elapsed / 16);
            proj.y += proj.vy * (elapsed / 16);

            if (proj.y >= groundY) {
                proj.y = groundY;
                proj.vy = 0;
            }

            if (proj.x < -60 || proj.x > canvas.width + 60) {
                projectiles.splice(i, 1);
            }
        }
    };

    // --- Draw Loop ---
    const draw = () => {
        // 1. Draw Persistent Floor Blood Stains
        bloodStains.forEach(stain => {
            context.save();
            const fade = Math.max(0, 1 - stain.lifetime / stain.maxLifetime);
            context.globalAlpha = stain.alpha * fade;
            context.fillStyle = stain.color;

            // Main flattened stain pool
            context.beginPath();
            context.ellipse(stain.x, stain.y, stain.radiusX, stain.radiusY, stain.angle, 0, Math.PI * 2);
            context.fill();

            // Satellite micro splatter droplets
            stain.satellites.forEach(sat => {
                context.beginPath();
                context.arc(stain.x + sat.dx, stain.y + sat.dy, sat.r, 0, Math.PI * 2);
                context.fill();
            });
            context.restore();
        });

        // 2. Draw Flying Particles (Blood Droplets, Sparks, Dust)
        particles.forEach(p => {
            context.save();
            context.globalAlpha = Math.max(0, p.alpha);

            if (p.isBlood) {
                const speed = Math.hypot(p.vx, p.vy);
                const angle = Math.atan2(p.vy, p.vx);
                const length = Math.max(p.size, p.size + speed * 0.5);

                context.translate(p.x, p.y);
                context.rotate(angle);

                context.fillStyle = p.color;
                context.beginPath();
                context.ellipse(0, 0, length, p.size, 0, 0, Math.PI * 2);
                context.fill();

                if (p.size >= 2.2) {
                    context.fillStyle = 'rgba(255, 170, 170, 0.3)';
                    context.beginPath();
                    context.ellipse(length * 0.15, -p.size * 0.2, length * 0.25, p.size * 0.2, 0, 0, Math.PI * 2);
                    context.fill();
                }
            } else {
                if (p.glow) {
                    context.shadowColor = p.color;
                    context.shadowBlur = 10;
                }
                context.fillStyle = p.color;
                context.beginPath();
                context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                context.fill();
            }

            context.restore();
        });

        // 3. Draw Projectiles
        projectiles.forEach(proj => {
            context.save();

            proj.trail.forEach((t, index) => {
                const trailAlpha = (index / proj.trail.length) * 0.45;
                context.globalAlpha = trailAlpha;
                context.fillStyle = proj.secondaryColor;
                context.beginPath();
                context.arc(t.x, t.y, proj.radius * 0.75, 0, Math.PI * 2);
                context.fill();
            });

            context.globalAlpha = 1;
            context.shadowColor = proj.color;
            context.shadowBlur = 18;

            const grad = context.createRadialGradient(proj.x, proj.y, 2, proj.x, proj.y, proj.radius);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, proj.secondaryColor);
            grad.addColorStop(1, proj.color);

            context.fillStyle = grad;
            context.beginPath();
            context.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            context.fill();

            context.restore();
        });

        // 4. Draw Floating Combat Text
        floatingTexts.forEach(ft => {
            context.save();
            context.globalAlpha = Math.max(0, ft.alpha);
            context.font = `900 ${Math.round(ft.fontSize * ft.scale)}px 'Russo One', sans-serif`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            context.shadowColor = 'rgba(0, 0, 0, 0.9)';
            context.shadowBlur = 8;
            context.lineWidth = 4;
            context.strokeStyle = '#050a14';
            context.strokeText(ft.text, ft.x, ft.y);

            context.fillStyle = ft.color;
            context.fillText(ft.text, ft.x, ft.y);

            context.restore();
        });
    };

    return {
        particles,
        bloodStains,
        floatingTexts,
        projectiles,
        triggerScreenShake,
        triggerHitStop,
        isHitStopped,
        spawnHitSparks,
        spawnBlood,
        spawnDust,
        spawnFloatingText,
        spawnProjectile,
        clearBloodStains: () => {
            bloodStains.length = 0;
        },
        update,
        draw
    };
}
