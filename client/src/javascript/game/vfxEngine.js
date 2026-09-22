/**
 * VFX and Visual Game Feel Engine for Fighter Arena.
 * Street Fighter inspired hit-sparks, directional blood splatter,
 * arcade hit flares, floor staining, dust, screen shake, hit-stop, and projectiles.
 */

export default function createVFXManager(canvas, context) {
    const particles = [];
    const hitFlares = [];
    const slashArcs = [];
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

    // --- Street Fighter Style Hit Flares ---
    const spawnHitFlare = (x, y, isBlocked = false, isCrit = false) => {
        let radius = 30;
        if (isCrit) radius = 36;
        else if (isBlocked) radius = 26;

        hitFlares.push({
            x,
            y,
            isBlocked,
            isCrit,
            radius,
            rotation: Math.random() * Math.PI,
            lifetime: 0,
            maxLifetime: isBlocked ? 100 : 130
        });
    };

    // --- Street Fighter Style Hit Sparks ---
    const spawnHitSparks = (x, y, isBlocked = false, isCrit = false) => {
        // 1. Always spawn a tight, punchy geometric hit flare at the impact point
        spawnHitFlare(x, y, isBlocked, isCrit);

        // 2. Spawn a few crisp, needle-like directional spark streaks (not fireworks)
        let count = 4;
        let speedMult = 1;
        let colors = ['#ffffff', '#fde047', '#f59e0b'];

        if (isCrit) {
            count = 6;
            speedMult = 1.4;
            colors = ['#ffffff', '#f87171', '#ef4444', '#fbbf24'];
        } else if (isBlocked) {
            count = 3;
            speedMult = 0.8;
            colors = ['#ffffff', '#7dd3fc', '#38bdf8'];
        }

        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 4 + 3) * speedMult;
            particles.push({
                isSpark: true,
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 1.2 + 1.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                decay: Math.random() * 0.045 + 0.035, // Fast fade ~120-150ms
                gravity: 0.12,
                glow: isCrit
            });
        }
    };

    // --- Street Fighter Style Blood System (Moderate & Directional) ---
    const bloodColors = ['#b91c1c', '#991b1b', '#7f1d1d', '#880808'];

    const spawnBlood = (x, y, direction = 1, intensity = 'normal') => {
        // Moderate counts inspired by Street Fighter
        let count = 4;
        let speedMin = 3.5;
        let speedMax = 6.5;

        if (intensity === 'fatal') {
            count = 9; // Fatal KO blow: 9 punchy droplets
            speedMin = 5.0;
            speedMax = 9.5;
        } else if (intensity === 'heavy') {
            count = 6; // Heavy (uppercut, throw): 6 droplets
            speedMin = 4.0;
            speedMax = 8.0;
        }

        // For heavy and fatal hits, add a sharp stylized crimson impact crescent / slash
        if (intensity === 'heavy' || intensity === 'fatal') {
            slashArcs.push({
                x,
                y,
                direction,
                radius: intensity === 'fatal' ? 36 : 26,
                angleOffset: direction > 0 ? -0.15 : Math.PI + 0.15,
                lifetime: 0,
                maxLifetime: 120
            });
        }

        for (let i = 0; i < count; i += 1) {
            // Directional cone: blood ejects away from attacker along strike momentum
            const spread = (Math.random() - 0.5) * 0.5; // tight cone (~28 degrees)
            const baseAngle = direction > 0 ? -0.18 : Math.PI + 0.18;
            const angle = baseAngle + spread;
            const speed = Math.random() * (speedMax - speedMin) + speedMin;

            particles.push({
                isBlood: true,
                x: x + (Math.random() - 0.5) * 6,
                y: y + (Math.random() - 0.5) * 6,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (Math.random() * 1.0 + 0.3),
                size: Math.random() * 0.9 + 1.6, // compact size: 1.6 - 2.5px
                color: bloodColors[Math.floor(Math.random() * bloodColors.length)],
                alpha: 1,
                decay: Math.random() * 0.035 + 0.028, // Fast, punchy dissipation
                gravity: 0.24,
                glow: false
            });
        }
    };

    const spawnDust = (x, y, direction = 1) => {
        const count = 5;
        for (let i = 0; i < count; i += 1) {
            particles.push({
                x: x + (Math.random() - 0.5) * 16,
                y: y - Math.random() * 6,
                vx: -direction * (Math.random() * 2 + 0.8),
                vy: -Math.random() * 1.2,
                size: Math.random() * 5 + 3,
                color: '#cbd5e1',
                alpha: 0.45,
                decay: Math.random() * 0.04 + 0.03,
                gravity: -0.015,
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
            x: x + (Math.random() - 0.5) * 20,
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
        const timeScale = elapsed / 16;

        // 1. Update Hit Flares
        for (let i = hitFlares.length - 1; i >= 0; i -= 1) {
            const flare = hitFlares[i];
            flare.lifetime += elapsed;
            if (flare.lifetime >= flare.maxLifetime) {
                hitFlares.splice(i, 1);
            }
        }

        // 2. Update Slash Arcs
        for (let i = slashArcs.length - 1; i >= 0; i -= 1) {
            const slash = slashArcs[i];
            slash.lifetime += elapsed;
            if (slash.lifetime >= slash.maxLifetime) {
                slashArcs.splice(i, 1);
            }
        }

        // 3. Update Flying Particles (Blood, Sparks, Dust)
        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const p = particles[i];

            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.vy += p.gravity * timeScale;

            if (p.isBlood) {
                p.vx *= 0.92; // Viscous drag
                p.vy *= 0.94;

                // Moderate ground splats (max 10 on screen)
                if (p.y >= groundY - 2) {
                    if (p.size >= 1.5 && bloodStains.length < 10) {
                        bloodStains.push({
                            x: p.x,
                            y: groundY - Math.random() * 2,
                            radiusX: p.size * (1.1 + Math.random() * 0.4),
                            radiusY: Math.max(0.6, p.size * 0.35),
                            angle: (Math.random() - 0.5) * 0.15,
                            color: '#340404',
                            alpha: 0.75,
                            lifetime: 0,
                            maxLifetime: 2200 + Math.random() * 800
                        });
                    }

                    particles.splice(i, 1);
                    // eslint-disable-next-line no-continue
                    continue;
                }
            } else if (p.isSpark) {
                p.vx *= 0.88;
                p.vy *= 0.88;
            }

            p.alpha -= p.decay * timeScale;

            if (p.alpha <= 0 || p.size <= 0.4) {
                particles.splice(i, 1);
            }
        }

        // 4. Update Floor Blood Stains
        for (let i = bloodStains.length - 1; i >= 0; i -= 1) {
            const stain = bloodStains[i];
            stain.lifetime += elapsed;
            if (stain.lifetime >= stain.maxLifetime) {
                bloodStains.splice(i, 1);
            }
        }

        // 5. Update Floating Combat Texts
        for (let i = floatingTexts.length - 1; i >= 0; i -= 1) {
            const ft = floatingTexts[i];
            ft.lifetime += elapsed;
            ft.y += ft.vy * timeScale;
            if (ft.scale > 1) {
                ft.scale = Math.max(1, ft.scale - 0.05 * timeScale);
            }
            ft.alpha = Math.max(0, 1 - ft.lifetime / ft.maxLifetime);

            if (ft.lifetime >= ft.maxLifetime || ft.alpha <= 0) {
                floatingTexts.splice(i, 1);
            }
        }

        // 6. Update Projectiles
        for (let i = projectiles.length - 1; i >= 0; i -= 1) {
            const proj = projectiles[i];
            if (!proj.active) {
                projectiles.splice(i, 1);
                // eslint-disable-next-line no-continue
                continue;
            }

            proj.trail.push({ x: proj.x, y: proj.y, alpha: 0.8 });
            if (proj.trail.length > 8) proj.trail.shift();

            proj.x += proj.vx * timeScale;
            proj.y += proj.vy * timeScale;

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
        // 1. Subtle Floor Blood Stains
        bloodStains.forEach(stain => {
            context.save();
            const fade = Math.max(0, 1 - stain.lifetime / stain.maxLifetime);
            context.globalAlpha = stain.alpha * fade;
            context.fillStyle = stain.color;

            context.beginPath();
            context.ellipse(stain.x, stain.y, stain.radiusX, stain.radiusY, stain.angle, 0, Math.PI * 2);
            context.fill();
            context.restore();
        });

        // 2. Street Fighter Impact Slashes (Crescents)
        slashArcs.forEach(slash => {
            const progress = slash.lifetime / slash.maxLifetime;
            const currentAlpha = Math.max(0, 1 - progress);

            context.save();
            context.translate(slash.x, slash.y);
            context.globalAlpha = currentAlpha * 0.85;

            const r = slash.radius * (0.8 + progress * 0.4);
            const startAngle = slash.angleOffset - 0.65;
            const endAngle = slash.angleOffset + 0.65;

            // Outer crimson edge
            context.strokeStyle = '#991b1b';
            context.lineWidth = Math.max(1, 5 * (1 - progress));
            context.lineCap = 'round';
            context.beginPath();
            context.arc(0, 0, r, startAngle, endAngle, false);
            context.stroke();

            // Inner bright core
            context.strokeStyle = '#f87171';
            context.lineWidth = Math.max(0.5, 2 * (1 - progress));
            context.beginPath();
            context.arc(0, 0, r, startAngle + 0.1, endAngle - 0.1, false);
            context.stroke();

            context.restore();
        });

        // 3. Street Fighter Hit Flares (Starbursts / Diamonds)
        hitFlares.forEach(flare => {
            const progress = flare.lifetime / flare.maxLifetime;
            const currentAlpha = Math.max(0, 1 - progress);
            const scale = 0.5 + progress * 0.7;
            const r = flare.radius * scale;

            context.save();
            context.translate(flare.x, flare.y);
            context.rotate(flare.rotation);
            context.globalAlpha = currentAlpha;

            const coreColor = '#ffffff';
            let flareColor = '#fbbf24';
            let glowColor = '#f59e0b';
            if (flare.isCrit) {
                flareColor = '#ef4444';
                glowColor = '#dc2626';
            } else if (flare.isBlocked) {
                flareColor = '#38bdf8';
                glowColor = '#0284c7';
            }

            // Central core
            context.fillStyle = coreColor;
            context.beginPath();
            context.arc(0, 0, Math.max(1, r * 0.22), 0, Math.PI * 2);
            context.fill();

            // 4-point primary diamond cross
            context.fillStyle = flareColor;
            const rayLen = r;
            const rayWidth = r * 0.22;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
                context.save();
                context.rotate(angle);
                context.beginPath();
                context.moveTo(0, -rayWidth * 0.5);
                context.lineTo(rayLen, 0);
                context.lineTo(0, rayWidth * 0.5);
                context.lineTo(-rayWidth * 0.3, 0);
                context.closePath();
                context.fill();
                context.restore();
            }

            // Diagonal secondary rays
            if (!flare.isBlocked) {
                const diagLen = r * 0.55;
                const diagWidth = r * 0.12;
                for (let angle = Math.PI / 4; angle < Math.PI * 2; angle += Math.PI / 2) {
                    context.save();
                    context.rotate(angle);
                    context.beginPath();
                    context.moveTo(0, -diagWidth * 0.5);
                    context.lineTo(diagLen, 0);
                    context.lineTo(0, diagWidth * 0.5);
                    context.closePath();
                    context.fill();
                    context.restore();
                }
            }

            // Expanding shockwave ring
            context.strokeStyle = glowColor;
            context.lineWidth = Math.max(0.5, 2 * (1 - progress));
            context.beginPath();
            context.arc(0, 0, r * 0.8, 0, Math.PI * 2);
            context.stroke();

            context.restore();
        });

        // 4. Flying Particles (Directional Blood Droplets, Needle Sparks, Dust)
        particles.forEach(p => {
            context.save();
            context.globalAlpha = Math.max(0, p.alpha);

            if (p.isBlood) {
                const speed = Math.hypot(p.vx, p.vy);
                const angle = Math.atan2(p.vy, p.vx);
                const length = Math.max(p.size * 1.3, p.size + speed * 1.5);

                context.translate(p.x, p.y);
                context.rotate(angle);

                // Tapered droplet / capsule along trajectory
                context.fillStyle = p.color;
                context.beginPath();
                context.ellipse(0, 0, length * 0.5, Math.max(0.5, p.size * 0.5), 0, 0, Math.PI * 2);
                context.fill();

                // Subtle bright core highlight on head
                context.fillStyle = '#ef4444';
                context.beginPath();
                context.arc(length * 0.2, 0, Math.max(0.4, p.size * 0.3), 0, Math.PI * 2);
                context.fill();
            } else if (p.isSpark) {
                context.strokeStyle = p.color;
                context.lineWidth = Math.max(1, p.size);
                context.lineCap = 'round';
                context.beginPath();
                context.moveTo(p.x, p.y);
                context.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6);
                context.stroke();
            } else {
                context.fillStyle = p.color;
                context.beginPath();
                context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                context.fill();
            }

            context.restore();
        });

        // 5. Special Projectiles
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

        // 6. Floating Combat Text
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
        hitFlares,
        slashArcs,
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
