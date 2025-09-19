// Collision detection and passive damage system
import { gameState } from '../core/game-state.js';
import { getMobileSpeedMultiplier, getRipSpeedMultiplier, CONSTANTS } from '../utils/helpers.js';
import { createDamageSparks } from '../ui/effects.js';

export function applyPassiveDamage(currentSpeed) {
    if (currentSpeed <= 1000) return;
    
    const currentTime = Date.now();
    
    // Apply damage every 2000ms (2 seconds) to reduce lag
    if (currentTime - gameState.lastPassiveDamageTime >= CONSTANTS.PASSIVE_DAMAGE_INTERVAL) {
        gameState.lastPassiveDamageTime = currentTime;
        
        const regularPins = gameState.pins.filter(pin => !pin.classList.contains('green-pin'));
        
        // Limit visual effects - only show sparks on a few random pins
        const maxSparks = Math.min(3, regularPins.length);
        
        // Damage all pins except green ones
        regularPins.forEach((pin, index) => {
            pin.collisionCount = (pin.collisionCount || 0) + 1;
            
            // Only create sparks for first few pins to reduce lag
            if (index < maxSparks) {
                const pinRect = pin.getBoundingClientRect();
                const pinCenterX = pinRect.left + pinRect.width / 2;
                const pinCenterY = pinRect.top + pinRect.height / 2;
                createDamageSparks(pinCenterX, pinCenterY);
            }
            
            const maxCollisions = pin.maxCollisions || 10;
            
            // Check if pin should be destroyed
            if (pin.collisionCount >= maxCollisions) {
                // Increment destroyed pins counter
                gameState.destroyedPinsCount++;
                document.getElementById('rip-number').textContent = gameState.destroyedPinsCount.toString();
                
                // Remove health bar if it exists
                if (pin.healthBar) {
                    pin.healthBar.remove();
                }
                
                // Remove pin
                pin.remove();
                gameState.pins = gameState.pins.filter(p => p !== pin);
            }
        });
        
        if (regularPins.length > 0) {
            console.log(`⚡ Speed aura damage! Speed: ${currentSpeed.toFixed(1)} - Damaged ${regularPins.length} pins (${maxSparks} with sparks)`);
        }
    }
}

export function applyGravityWellEffects() {
    // Find active black bosses
    const blackBosses = gameState.bossPins.filter(boss => boss.type === 'black' && !boss.isDestroyed);
    
    if (blackBosses.length === 0) return;
    
    blackBosses.forEach(boss => {
        // Calculate distance from flag to boss
        const flagCenterX = gameState.x + 50;
        const flagCenterY = gameState.y + 30;
        const deltaX = boss.x - flagCenterX;
        const deltaY = boss.y - flagCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Apply gravity well effect within 200px radius
        if (distance < 200 && distance > 0) {
            const gravityStrength = 0.1 * (200 - distance) / 200; // Stronger when closer
            
            // Normalize direction vector
            const normalX = deltaX / distance;
            const normalY = deltaY / distance;
            
            // Apply gravity force to flag movement
            if (!gameState.antiGravityActive || Date.now() > gameState.antiGravityEndTime) {
                gameState.dx += normalX * gravityStrength;
                gameState.dy += normalY * gravityStrength;
            } else {
                // Anti-gravity reverses the effect
                gameState.dx -= normalX * gravityStrength;
                gameState.dy -= normalY * gravityStrength;
            }
        }
    });
}
