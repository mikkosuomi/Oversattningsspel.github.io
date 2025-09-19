// Visual effects system
import { gameState } from '../core/game-state.js';

export function createTrailParticle(x, y, dx, dy) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '3px';
    particle.style.height = '3px';
    particle.style.backgroundColor = '#006aa7'; // Swedish flag blue
    particle.style.borderRadius = '50%';
    
    // Calculate trail position behind the flag's movement direction
    const trailDistance = 50; // Distance behind the flag
    const speed = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = speed > 0 ? dx / speed : 0;
    const normalizedDy = speed > 0 ? dy / speed : 0;
    
    // Place particle behind the flag's movement
    const trailX = x + 48 - (normalizedDx * trailDistance); // Center of flag minus movement direction
    const trailY = y + 28 - (normalizedDy * trailDistance);
    
    particle.style.left = trailX + 'px';
    particle.style.top = trailY + 'px';
    particle.style.opacity = '0.6';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '0';
    particle.style.transition = 'opacity 3s ease-out';
    
    document.body.appendChild(particle);
    
    const trailData = {
        element: particle,
        createdAt: Date.now(),
        lifetime: 3000 // 3 seconds
    };
    
    gameState.trailParticles.push(trailData);
    
    // Start fading immediately
    setTimeout(() => {
        particle.style.opacity = '0';
    }, 50);
    
    return trailData;
}

export function updateTrailParticles() {
    const currentTime = Date.now();
    
    // Remove expired particles
    gameState.trailParticles = gameState.trailParticles.filter(trail => {
        const age = currentTime - trail.createdAt;
        if (age > trail.lifetime) {
            if (trail.element.parentNode) {
                trail.element.parentNode.removeChild(trail.element);
            }
            return false;
        }
        return true;
    });
}

export function createSparks(centerX, centerY) {
    // Create 3-5 sparks for a nice effect without being too heavy
    const sparkCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        spark.classList.add('spark');
        
        // Random direction and distance for each spark
        const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5;
        const distance = 15 + Math.random() * 20;
        const sparkX = centerX + Math.cos(angle) * distance;
        const sparkY = centerY + Math.sin(angle) * distance;
        
        spark.style.left = centerX + 'px';
        spark.style.top = centerY + 'px';
        
        document.body.appendChild(spark);
        
        // Animate to final position
        setTimeout(() => {
            spark.style.left = sparkX + 'px';
            spark.style.top = sparkY + 'px';
        }, 10);
        
        // Remove spark after animation completes
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 600);
    }
}

export function createDamageSparks(pinX, pinY) {
    // Create 1-2 small sparks per pin to keep it light
    const sparkCount = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        spark.classList.add('damage-spark');
        
        // Random direction and small distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 8 + Math.random() * 12;
        const sparkX = pinX + Math.cos(angle) * distance;
        const sparkY = pinY + Math.sin(angle) * distance;
        
        spark.style.left = pinX + 'px';
        spark.style.top = pinY + 'px';
        
        document.body.appendChild(spark);
        
        // Animate to final position
        setTimeout(() => {
            spark.style.left = sparkX + 'px';
            spark.style.top = sparkY + 'px';
        }, 10);
        
        // Remove spark after animation
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 600);
    }
}

export function createDamageIndicator(x, y, damage, speed, isLineDamage = false) {
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.left = x + 'px';
    indicator.style.top = y + 'px';
    indicator.style.fontSize = '12px';
    indicator.style.fontWeight = 'bold';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = '10001';
    indicator.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    indicator.style.transition = 'all 1s ease-out';
    
    if (isLineDamage) {
        indicator.style.color = '#ffff00';
        indicator.style.textShadow = '0 0 4px #ffaa00';
        indicator.textContent = `⚡${damage}`;
    } else {
        indicator.style.color = '#87ceeb';
        indicator.style.textShadow = '0 0 3px #4682b4';
        
        // Show damage amount and speed context
        if (damage >= 10) {
            indicator.textContent = 'ONESHOT!';
        } else if (damage > 1) {
            indicator.textContent = `-${damage} (${Math.floor(speed)})`;
        } else {
            indicator.textContent = '-1';
        }
    }
    
    document.body.appendChild(indicator);
    
    // Animate upward and fade out
    setTimeout(() => {
        indicator.style.top = (y - 30) + 'px';
        indicator.style.opacity = '0';
    }, 50);
    
    // Remove after animation
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 1100);
}

export function createHoldTimer(x, y) {
    const timer = document.createElement('div');
    timer.classList.add('hold-timer');
    timer.style.position = 'fixed';
    timer.style.left = (x - 25) + 'px';
    timer.style.top = (y - 25) + 'px';
    timer.style.width = '50px';
    timer.style.height = '50px';
    timer.style.border = '3px solid rgba(255, 255, 255, 0.3)';
    timer.style.borderRadius = '50%';
    timer.style.pointerEvents = 'none';
    timer.style.zIndex = '10000';
    
    const fill = document.createElement('div');
    fill.classList.add('timer-fill');
    fill.style.position = 'absolute';
    fill.style.top = '0';
    fill.style.left = '0';
    fill.style.width = '100%';
    fill.style.height = '100%';
    fill.style.borderRadius = '50%';
    fill.style.background = 'conic-gradient(#ffaa44 0deg, transparent 0deg)';
    fill.style.transition = 'none';
    
    timer.appendChild(fill);
    document.body.appendChild(timer);
    
    timer.fill = fill;
    return timer;
}

export function updateHoldTimer(timer, progress, stage) {
    if (!timer || !timer.fill) return;
    
    const degrees = Math.min(360, progress * 360);
    
    if (stage === 'heavy') {
        timer.fill.style.background = `conic-gradient(#ffaa44 ${degrees}deg, transparent ${degrees}deg)`;
        timer.style.borderColor = 'rgba(255, 170, 68, 0.8)';
    } else if (stage === 'fortress') {
        timer.fill.style.background = `conic-gradient(#aa4444 ${degrees}deg, transparent ${degrees}deg)`;
        timer.style.borderColor = 'rgba(170, 68, 68, 0.8)';
    } else if (stage === 'bomb') {
        timer.fill.style.background = `conic-gradient(#ff0000 ${degrees}deg, transparent ${degrees}deg)`;
        timer.style.borderColor = 'rgba(255, 0, 0, 1)';
        timer.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
        
        // Pulsing effect for bomb stage
        if (progress > 0.8) {
            timer.style.animation = 'bomb-warning 0.5s ease-in-out infinite alternate';
        }
    }
}
