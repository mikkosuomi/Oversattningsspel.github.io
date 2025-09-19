// Bomb pin final boss system
import { gameState } from '../core/game-state.js';
import { getMobileSpeedMultiplier, getRipSpeedMultiplier, keepInBounds } from '../utils/helpers.js';
import { createSparks, createDamageIndicator } from '../ui/effects.js';
import { showGameOverScreen, showLevelCompleteScreen } from '../ui/level-system.js';

export class BombPin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxCollisions = 5000; // Very high HP for final boss
        this.collisionCount = 0;
        this.isDestroyed = false;
        this.timeLeft = 30000; // 30 seconds
        this.startTime = Date.now();
        this.element = null;
        this.healthBar = null;
        this.healthFill = null;
        this.timerElement = null;
        this.warningElement = null;
        
        this.createElement();
        this.createHealthBar();
        this.createTimer();
        this.createWarning();
        
        // Set game state
        gameState.bombActive = true;
        gameState.bombPin = this;
        
        console.log('💣 BOMB PIN CREATED! 30 SECONDS TO DEFUSE!');
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.classList.add('pin', 'bomb-pin');
        this.element.style.position = 'fixed';
        this.element.style.width = '50px';
        this.element.style.height = '50px';
        this.element.style.backgroundColor = '#ff0000';
        this.element.style.border = '4px solid #fff';
        this.element.style.borderRadius = '50%';
        this.element.style.boxShadow = '0 0 30px #ff0000, 0 0 60px #ff6600';
        this.element.style.zIndex = '1005';
        this.element.style.left = (this.x - 25) + 'px';
        this.element.style.top = (this.y - 25) + 'px';
        
        console.log(`💣 Bomb boss positioned: center(${this.x}, ${this.y}) -> element(${this.x-25}, ${this.y-25})`);
        this.element.style.animation = 'bomb-pulse 1s ease-in-out infinite alternate';
        
        // Add bomb emoji
        this.element.textContent = '💣';
        this.element.style.fontSize = '30px';
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        
        // Add magnetic attraction on mouse hold
        this.element.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.startMagneticAttraction();
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        this.element.bombPin = this;
        document.body.appendChild(this.element);
    }
    
    startMagneticAttraction() {
        this.magneticActive = true;
        this.magneticPulseTime = 0;
        
        // Visual feedback - pulsing border
        this.element.style.animation = 'bomb-pulse 1s ease-in-out infinite alternate, boss-magnetic 0.3s ease-in-out infinite alternate';
        this.element.style.borderColor = '#ffff00';
        
        console.log(`🧲 BOMB boss magnetic attraction activated!`);
        
        // Stop magnetic attraction on mouse up
        const stopMagnetic = () => {
            this.magneticActive = false;
            this.element.style.animation = 'bomb-pulse 1s ease-in-out infinite alternate';
            this.element.style.borderColor = '#fff';
            document.removeEventListener('mouseup', stopMagnetic);
            console.log(`🧲 BOMB boss magnetic attraction deactivated!`);
        };
        
        document.addEventListener('mouseup', stopMagnetic);
    }
    
    applyMagneticAttraction() {
        const flagCenterX = gameState.x + 50;
        const flagCenterY = gameState.y + 30;
        
        const deltaX = this.x - flagCenterX;
        const deltaY = this.y - flagCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0 && distance < 400) { // Larger magnetic range for bomb boss
            // Pulsing attraction - stronger every 0.5 seconds
            this.magneticPulseTime += 16; // Assuming 60fps
            const pulseStrength = Math.sin(this.magneticPulseTime * 0.01) * 0.5 + 0.5; // 0 to 1
            
            // Normalize direction and apply magnetic force
            const normalX = deltaX / distance;
            const normalY = deltaY / distance;
            
            // Stronger base attraction for bomb boss
            const baseStrength = (400 - distance) / 400 * 1.2; // 0 to 1.2 (stronger than regular boss)
            const finalStrength = baseStrength * (0.4 + pulseStrength * 0.8); // Pulse between 40% and 120%
            
            // Apply magnetic force to flag
            gameState.dx += normalX * finalStrength;
            gameState.dy += normalY * finalStrength;
            
            // Visual feedback - stronger glow during pulse
            const glowIntensity = 30 + pulseStrength * 30;
            this.element.style.boxShadow = `0 0 ${glowIntensity}px #ff0000, 0 0 ${glowIntensity * 2}px #ff6600`;
            
            // Debug log occasionally
            if (Math.random() < 0.01) {
                console.log(`🧲 BOMB Magnetic pull: distance=${distance.toFixed(1)}, strength=${finalStrength.toFixed(2)}, pulse=${pulseStrength.toFixed(2)}`);
            }
        }
    }
    
    createHealthBar() {
        this.healthBar = document.createElement('div');
        this.healthBar.style.position = 'fixed';
        this.healthBar.style.width = '60px';
        this.healthBar.style.height = '8px';
        this.healthBar.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        this.healthBar.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        this.healthBar.style.zIndex = '1006';
        this.healthBar.style.left = (this.x - 30) + 'px';
        this.healthBar.style.top = (this.y - 45) + 'px';
        
        this.healthFill = document.createElement('div');
        this.healthFill.style.width = '100%';
        this.healthFill.style.height = '100%';
        this.healthFill.style.backgroundColor = '#ff0000';
        this.healthFill.style.transition = 'width 0.1s ease';
        
        this.healthBar.appendChild(this.healthFill);
        document.body.appendChild(this.healthBar);
    }
    
    createTimer() {
        this.timerElement = document.createElement('div');
        this.timerElement.style.position = 'fixed';
        this.timerElement.style.left = '50%';
        this.timerElement.style.top = '20px';
        this.timerElement.style.transform = 'translateX(-50%)';
        this.timerElement.style.fontSize = '48px';
        this.timerElement.style.fontWeight = 'bold';
        this.timerElement.style.color = '#ff0000';
        this.timerElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        this.timerElement.style.zIndex = '10000';
        this.timerElement.style.fontFamily = 'monospace';
        
        document.body.appendChild(this.timerElement);
    }
    
    createWarning() {
        this.warningElement = document.createElement('div');
        this.warningElement.style.position = 'fixed';
        this.warningElement.style.left = '50%';
        this.warningElement.style.top = '80px';
        this.warningElement.style.transform = 'translateX(-50%)';
        this.warningElement.style.fontSize = '24px';
        this.warningElement.style.fontWeight = 'bold';
        this.warningElement.style.color = '#ffff00';
        this.warningElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        this.warningElement.style.zIndex = '10000';
        this.warningElement.style.textAlign = 'center';
        this.warningElement.textContent = '⚠️ DEFUSE THE BOMB! ⚠️';
        this.warningElement.style.animation = 'bomb-warning 0.5s ease-in-out infinite alternate';
        
        document.body.appendChild(this.warningElement);
    }
    
    update() {
        if (this.isDestroyed) return;
        
        const currentTime = Date.now();
        this.timeLeft = Math.max(0, 30000 - (currentTime - this.startTime));
        
        // Update timer display
        const seconds = Math.ceil(this.timeLeft / 1000);
        this.timerElement.textContent = `${seconds}s`;
        
        // Change timer color as time runs out
        if (seconds <= 5) {
            this.timerElement.style.color = '#ff0000';
            this.timerElement.style.animation = 'bomb-warning 0.2s ease-in-out infinite alternate';
        } else if (seconds <= 10) {
            this.timerElement.style.color = '#ff6600';
            this.timerElement.style.animation = 'bomb-warning 0.5s ease-in-out infinite alternate';
        }
        
        // Check if time is up
        if (this.timeLeft <= 0) {
            this.explode();
            return;
        }
        
        // Update health bar
        this.updateHealthBar();
        
        // Apply magnetic attraction to flag if active
        if (this.magneticActive) {
            this.applyMagneticAttraction();
        }
        
        // Apply stronger pushback in last 10 seconds
        if (this.timeLeft <= 10000) {
            this.applyAggressivePushback();
        }
    }
    
    updateHealthBar() {
        if (!this.healthBar || !this.healthFill) return;
        
        const healthPercent = Math.max(0, (this.maxCollisions - this.collisionCount) / this.maxCollisions);
        this.healthFill.style.width = (healthPercent * 100) + '%';
        
        // Change color based on health and add armor visual feedback
        if (healthPercent < 0.5) {
            // Armor activation below 50% health
            this.healthFill.style.backgroundColor = '#ffffff';
            this.element.style.border = '4px solid #ffffff';
            this.element.style.animation = 'bomb-armor 0.3s ease-in-out infinite alternate, bomb-pulse 1s ease-in-out infinite alternate';
        } else if (healthPercent < 0.7) {
            this.healthFill.style.backgroundColor = '#ffaa00';
        } else {
            this.healthFill.style.backgroundColor = '#ff0000';
        }
    }
    
    applyAggressivePushback() {
        // Stronger pushback force in last 10 seconds
        const flagCenterX = gameState.x + 50;
        const flagCenterY = gameState.y + 30;
        
        const deltaX = flagCenterX - this.x;
        const deltaY = flagCenterY - this.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 150 && distance > 0) {
            const pushStrength = 0.5; // 1.5x stronger than normal
            const normalX = deltaX / distance;
            const normalY = deltaY / distance;
            
            // Push flag away more aggressively
            gameState.dx += normalX * pushStrength;
            gameState.dy += normalY * pushStrength;
        }
    }
    
    takeDamage(damage, currentSpeed) {
        // Special damage scaling for bomb pin to prevent oneshot kills
        let actualDamage = damage;
        
        if (currentSpeed > 300) {
            // Much slower scaling: base damage + (speed-300)/500
            actualDamage = 1 + Math.floor((currentSpeed - 300) / 500);
            
            // Cap damage at high speeds
            if (currentSpeed >= 5000) {
                actualDamage = Math.min(actualDamage, 25); // Max 25 damage at 5000+ speed
            } else if (currentSpeed >= 1000) {
                actualDamage = Math.min(actualDamage, 50); // Max 50 damage at 1000+ speed
            }
        }
        
        // Apply armor scaling below 50% health
        const healthPercent = (this.maxCollisions - this.collisionCount) / this.maxCollisions;
        if (healthPercent < 0.5) {
            // Up to 30% damage reduction
            const armorReduction = 0.3 * (0.5 - healthPercent) / 0.5;
            actualDamage = Math.floor(actualDamage * (1 - armorReduction));
            actualDamage = Math.max(1, actualDamage); // Always at least 1 damage
            
            console.log(`🛡️ Bomb armor activated! Damage reduced by ${(armorReduction * 100).toFixed(1)}%`);
        }
        
        this.collisionCount += actualDamage;
        
        console.log(`💥 Bomb hit! Damage: ${actualDamage} (Speed: ${currentSpeed.toFixed(1)}) Health: ${this.collisionCount}/${this.maxCollisions}`);
        
        if (this.collisionCount >= this.maxCollisions) {
            this.defuse();
            return true; // Bomb defused
        }
        return false; // Bomb still active
    }
    
    defuse() {
        this.isDestroyed = true;
        gameState.bombActive = false;
        gameState.levelComplete = true;
        
        console.log('🎉 BOMB DEFUSED! LEVEL COMPLETE!');
        
        // Remove visual elements
        this.destroy();
        
        // Show level complete screen
        setTimeout(() => {
            showLevelCompleteScreen();
        }, 1000);
    }
    
    explode() {
        this.isDestroyed = true;
        gameState.bombActive = false;
        gameState.gameOver = true;
        
        console.log('💥 BOMB EXPLODED! GAME OVER!');
        
        // Create explosion effect
        this.element.textContent = '💥';
        this.element.style.fontSize = '100px';
        this.element.style.animation = 'explosion 1s ease-out';
        
        // Remove timer and warning
        if (this.timerElement && this.timerElement.parentNode) {
            this.timerElement.parentNode.removeChild(this.timerElement);
        }
        if (this.warningElement && this.warningElement.parentNode) {
            this.warningElement.parentNode.removeChild(this.warningElement);
        }
        
        // Show game over screen after explosion animation
        setTimeout(() => {
            this.destroy();
            showGameOverScreen();
        }, 1000);
    }
    
    destroy() {
        // Remove all visual elements
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
        if (this.timerElement && this.timerElement.parentNode) {
            this.timerElement.parentNode.removeChild(this.timerElement);
        }
        if (this.warningElement && this.warningElement.parentNode) {
            this.warningElement.parentNode.removeChild(this.warningElement);
        }
        
        // Clear game state
        gameState.bombPin = null;
    }
}

export function createBombPin(x, y) {
    if (gameState.bombActive || gameState.gameOver || gameState.levelComplete) return; // Only one bomb at a time
    
    gameState.bombPin = new BombPin(x, y);
    
    console.log('💣 BOMB PIN CREATED! 30 SECONDS TO DEFUSE!');
}

export function checkBombCollision(bomb) {
    if (!bomb || bomb.isDestroyed) return;
    
    const bombRect = bomb.element.getBoundingClientRect();
    const flagRect = gameState.flag.getBoundingClientRect();
    
    // Check collision
    if (flagRect.left < bombRect.right &&
        flagRect.right > bombRect.left &&
        flagRect.top < bombRect.bottom &&
        flagRect.bottom > bombRect.top) {
        
        // Calculate collision physics
        const flagCenterX = gameState.x + 50;
        const flagCenterY = gameState.y + 30;
        const bombCenterX = bomb.x;
        const bombCenterY = bomb.y;
        
        // Calculate current speed for damage
        const mobileSpeedMultiplier = getMobileSpeedMultiplier();
        const ripSpeedMultiplier = getRipSpeedMultiplier();
        const currentSpeed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy) * 
                           gameState.speedMultiplier * gameState.baseSpeedMultiplier * 
                           mobileSpeedMultiplier * ripSpeedMultiplier;
        
        // Calculate base damage
        let damage = 1;
        if (currentSpeed > 300) {
            const speedAbove300 = currentSpeed - 300;
            damage = 1 + Math.floor(speedAbove300 / 300);
        }
        
        // Apply upgrades
        if (gameState.playerUpgrades.plasmaEdge) {
            damage *= 100;
        } else if (gameState.playerUpgrades.blades) {
            damage *= 10;
        }
        
        // Apply damage to bomb (with special scaling)
        const destroyed = bomb.takeDamage(damage, currentSpeed);
        
        // Create damage indicator
        createDamageIndicator(bombCenterX, bombCenterY - 30, damage, currentSpeed);
        
        // Create sparks
        createSparks(bombCenterX, bombCenterY);
        
        // Physics - Skip collision physics during redirect loops (just deal damage)
        if (!gameState.redirectLoopActive) {
            // Normal physics - bounce flag off bomb with stronger force
            const deltaX = flagCenterX - bombCenterX;
            const deltaY = flagCenterY - bombCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 0) {
                // Normalize and apply strong bounce
                const normalX = deltaX / distance;
                const normalY = deltaY / distance;
                
                // Stronger reflection for bomb
                const dotProduct = gameState.dx * normalX + gameState.dy * normalY;
                gameState.dx = gameState.dx - 3 * dotProduct * normalX; // 3x stronger reflection
                gameState.dy = gameState.dy - 3 * dotProduct * normalY;
                
                // Push flag away from bomb
                const pushDistance = 80; // Even larger push for bomb
                gameState.x = bombCenterX + normalX * pushDistance;
                gameState.y = bombCenterY + normalY * pushDistance;
                
                // Keep flag in bounds
                const bounds = keepInBounds(gameState.x, gameState.y);
                gameState.x = bounds.x;
                gameState.y = bounds.y;
            }
        } else {
            // During redirect loop: just deal damage, no physics bounce
            console.log(`🔥 LOOP DAMAGE: Hit bomb boss during redirect loop (no physics bounce)`);
        }
    }
}
