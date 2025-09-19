// Flag physics and movement system
import { gameState } from '../core/game-state.js';
import { getMobileSpeedMultiplier, getRipSpeedMultiplier, keepInBounds, getRandomFlagSpeed } from '../utils/helpers.js';
import { createTrailParticle, updateTrailParticles } from '../ui/effects.js';
import { CONSTANTS } from '../utils/helpers.js';

export function initializeFlag() {
    gameState.flag = document.getElementById('bouncing-flag');
    gameState.flagClickArea = document.createElement('div');
    gameState.flagClickArea.id = 'flag-click-area';
    gameState.flagClickArea.style.position = 'fixed';
    gameState.flagClickArea.style.width = '100px';
    gameState.flagClickArea.style.height = '60px';
    gameState.flagClickArea.style.zIndex = '0';
    gameState.flagClickArea.style.cursor = 'pointer';
    document.body.appendChild(gameState.flagClickArea);
    
    // Set up flag click handler
    gameState.flagClickArea.addEventListener('click', handleFlagClick);
}

export function handleFlagClick() {
    // Disable flag clicking in mobile portrait mode
    if (getMobileSpeedMultiplier() < 1) return;
    
    // Prevent new speed boosts while one is active
    if (gameState.speedMultiplier > 1) return;

    startSpeedBoost(3000, 200);
}

export function startSpeedBoost(duration = 3000, multiplier = 200) {
    // Clear existing boost interval if any
    if (gameState.speedBoostInterval) {
        clearInterval(gameState.speedBoostInterval);
    }

    gameState.speedMultiplier = multiplier;
    gameState.speedBoostEndTime = Date.now() + duration;

    gameState.speedBoostInterval = setInterval(() => {
        const timeLeft = gameState.speedBoostEndTime - Date.now();
        if (timeLeft <= 0) {
            gameState.speedMultiplier = 1;
            clearInterval(gameState.speedBoostInterval);
            gameState.speedBoostInterval = null;
        } else {
            // Gradually reduce speed as time runs out
            const progress = timeLeft / duration;
            gameState.speedMultiplier = 1 + (multiplier - 1) * progress;
        }
    }, 50);
}

export function updateFlagMovement() {
    const mobileSpeedMultiplier = getMobileSpeedMultiplier();
    const ripSpeedMultiplier = getRipSpeedMultiplier();
    
    // Calculate the full speed multiplier for internal calculations
    const fullSpeedMultiplier = gameState.speedMultiplier * gameState.baseSpeedMultiplier * mobileSpeedMultiplier * ripSpeedMultiplier;
    
    // Calculate current speed for game mechanics (uncapped)
    const currentSpeed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy) * fullSpeedMultiplier;
    
    // Cap the visual movement speed at 300 equivalent
    const baseSpeed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy);
    const visualSpeedMultiplier = baseSpeed > 0 ? Math.min(fullSpeedMultiplier, CONSTANTS.MAX_VISUAL_SPEED / baseSpeed) : fullSpeedMultiplier;
    
    // Apply capped movement for visual flag position
    gameState.x += gameState.dx * visualSpeedMultiplier;
    gameState.y += gameState.dy * visualSpeedMultiplier;

    // Bounce off the walls
    if (gameState.x <= 0 || gameState.x >= window.innerWidth - 100) {
        gameState.dx = -gameState.dx;
    }
    if (gameState.y <= 0 || gameState.y >= window.innerHeight - 60) {
        gameState.dy = -gameState.dy;
    }

    // Create trail particles if flag has moved enough
    const trailDeltaX = gameState.x - gameState.lastTrailX;
    const trailDeltaY = gameState.y - gameState.lastTrailY;
    const trailDistance = Math.sqrt(trailDeltaX * trailDeltaX + trailDeltaY * trailDeltaY);
    
    if (trailDistance >= CONSTANTS.TRAIL_SPACING) {
        createTrailParticle(gameState.x, gameState.y, gameState.dx, gameState.dy);
        gameState.lastTrailX = gameState.x;
        gameState.lastTrailY = gameState.y;
    }

    // Update and cleanup trail particles
    updateTrailParticles();
    
    // Update flag visual position
    gameState.flag.style.left = gameState.x + 'px';
    gameState.flag.style.top = gameState.y + 'px';
    gameState.flagClickArea.style.left = gameState.x + 'px';
    gameState.flagClickArea.style.top = gameState.y + 'px';
    
    return currentSpeed;
}

export function resetFlag() {
    // Reset flag position to random location
    gameState.x = Math.random() * (window.innerWidth - 100);
    gameState.y = Math.random() * (window.innerHeight - 60);
    
    // Reset flag direction to random
    gameState.dx = (Math.random() - 0.5) * 2;
    gameState.dy = (Math.random() - 0.5) * 2;
    
    // Clear any active speed boost
    if (gameState.speedBoostInterval) {
        clearInterval(gameState.speedBoostInterval);
        gameState.speedBoostInterval = null;
    }
    gameState.speedMultiplier = 1;
    gameState.speedBoostEndTime = 0;
    
    // Reset base speed multiplier with randomized value
    gameState.baseSpeedMultiplier = getRandomFlagSpeed();
    
    // Clear all trail particles
    gameState.trailParticles.forEach(trail => {
        if (trail.element.parentNode) {
            trail.element.parentNode.removeChild(trail.element);
        }
    });
    gameState.trailParticles = [];
    gameState.lastTrailX = gameState.x;
    gameState.lastTrailY = gameState.y;
}

export function startAntiGravityEffect(duration = 5000) {
    gameState.antiGravityActive = true;
    gameState.antiGravityEndTime = Date.now() + duration;
    console.log('Anti-gravity effect started for', duration / 1000, 'seconds');
}
