// Boss pin system and management
import { gameState } from '../core/game-state.js';
import { getMobileSpeedMultiplier, getRipSpeedMultiplier, getDistance, normalizeVector, keepInBounds } from '../utils/helpers.js';
import { createSparks, createDamageIndicator } from '../ui/effects.js';
import { createDraggableGreenPin } from '../pins/green-pins.js';
import { updateHealthBar } from '../pins/pin-manager.js';

export class BossPin {
    constructor(type, x, y, targetX, targetY) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.collisionCount = 0;
        this.isDestroyed = false;
        this.speed = 1;
        this.element = null;
        this.healthBar = null;
        this.healthFill = null;
        
        this.setupTypeProperties();
        this.createElement();
        this.createHealthBar();
    }
    
    setupTypeProperties() {
        switch(this.type) {
            case 'purple':
                this.maxCollisions = 50;
                this.color = '#8a2be2';
                this.reward = 1; // 1 green pin
                break;
            case 'orange':
                this.maxCollisions = 75;
                this.color = '#ff8c00';
                this.reward = 'split'; // Splits into mini-bosses
                break;
            case 'red':
                this.maxCollisions = 100;
                this.color = '#dc143c';
                this.reward = 3; // 3 green pins
                break;
            case 'black':
                this.maxCollisions = 150;
                this.color = '#2c2c2c';
                this.reward = 'antigrav'; // Anti-gravity green pin
                break;
            case 'mini':
                this.maxCollisions = 25;
                this.speed = 2;
                this.color = '#ff6622';
                this.reward = 1;
                break;
        }
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.classList.add('pin', 'boss-pin', `${this.type}-boss`);
        this.element.style.position = 'fixed';
        this.element.style.width = '30px';
        this.element.style.height = '30px';
        this.element.style.backgroundColor = this.color;
        this.element.style.border = '3px solid #fff';
        this.element.style.borderRadius = '50%';
        this.element.style.boxShadow = `0 0 15px ${this.color}`;
        this.element.style.zIndex = '1002';
        this.element.style.left = (this.x - 15) + 'px';
        this.element.style.top = (this.y - 15) + 'px';
        
        // Store reference to boss in element
        this.element.bossPin = this;
        
        // Add magnetic attraction on mouse hold
        this.element.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.startMagneticAttraction();
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        document.body.appendChild(this.element);
    }
    
    startMagneticAttraction() {
        this.magneticActive = true;
        this.magneticPulseTime = 0;
        
        // Visual feedback - pulsing border
        this.element.style.animation = 'boss-magnetic 0.3s ease-in-out infinite alternate';
        this.element.style.borderColor = '#ffff00';
        
        console.log(`🧲 ${this.type.toUpperCase()} boss magnetic attraction activated!`);
        
        // Stop magnetic attraction on mouse up
        const stopMagnetic = () => {
            this.magneticActive = false;
            this.element.style.animation = '';
            this.element.style.borderColor = '#fff';
            document.removeEventListener('mouseup', stopMagnetic);
            console.log(`🧲 ${this.type.toUpperCase()} boss magnetic attraction deactivated!`);
        };
        
        document.addEventListener('mouseup', stopMagnetic);
    }
    
    applyMagneticAttraction() {
        const flagCenterX = gameState.x + 50;
        const flagCenterY = gameState.y + 30;
        
        const deltaX = this.x - flagCenterX;
        const deltaY = this.y - flagCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0 && distance < 300) { // Magnetic range of 300px
            // Pulsing attraction - stronger every 0.5 seconds
            this.magneticPulseTime += 16; // Assuming 60fps
            const pulseStrength = Math.sin(this.magneticPulseTime * 0.01) * 0.5 + 0.5; // 0 to 1
            
            // Normalize direction and apply magnetic force
            const normalX = deltaX / distance;
            const normalY = deltaY / distance;
            
            // Base attraction strength (stronger when closer)
            const baseStrength = (300 - distance) / 300 * 0.8; // 0 to 0.8
            const finalStrength = baseStrength * (0.3 + pulseStrength * 0.7); // Pulse between 30% and 100%
            
            // Apply magnetic force to flag
            gameState.dx += normalX * finalStrength;
            gameState.dy += normalY * finalStrength;
            
            // Visual feedback - stronger glow during pulse
            const glowIntensity = 15 + pulseStrength * 20;
            this.element.style.boxShadow = `0 0 ${glowIntensity}px ${this.color}`;
            
            // Debug log occasionally
            if (Math.random() < 0.01) {
                console.log(`🧲 Magnetic pull: distance=${distance.toFixed(1)}, strength=${finalStrength.toFixed(2)}, pulse=${pulseStrength.toFixed(2)}`);
            }
        }
    }
    
    createHealthBar() {
        this.healthBar = document.createElement('div');
        this.healthBar.style.position = 'fixed';
        this.healthBar.style.width = '40px';
        this.healthBar.style.height = '6px';
        this.healthBar.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        this.healthBar.style.border = '1px solid rgba(255, 255, 255, 0.5)';
        this.healthBar.style.zIndex = '1003';
        this.healthBar.style.left = (this.x - 20) + 'px';
        this.healthBar.style.top = (this.y - 25) + 'px';
        
        this.healthFill = document.createElement('div');
        this.healthFill.style.width = '100%';
        this.healthFill.style.height = '100%';
        this.healthFill.style.backgroundColor = '#ff0000';
        this.healthFill.style.transition = 'width 0.2s ease';
        
        this.healthBar.appendChild(this.healthFill);
        document.body.appendChild(this.healthBar);
    }
    
    updateMovement() {
        // Calculate direction to target
        const deltaX = this.targetX - this.x;
        const deltaY = this.targetY - this.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0) {
            // Normalize direction and apply speed
            const normalX = deltaX / distance;
            const normalY = deltaY / distance;
            
            this.x += normalX * this.speed;
            this.y += normalY * this.speed;
        }
    }
    
    updateHealthBar() {
        if (!this.healthBar || !this.healthFill) return;
        
        const healthPercent = Math.max(0, (this.maxCollisions - this.collisionCount) / this.maxCollisions);
        this.healthFill.style.width = (healthPercent * 100) + '%';
        
        // Update position
        this.healthBar.style.left = (this.x - 20) + 'px';
        this.healthBar.style.top = (this.y - 25) + 'px';
        
        // Change color based on health
        if (healthPercent > 0.6) {
            this.healthFill.style.backgroundColor = '#00ff00';
        } else if (healthPercent > 0.3) {
            this.healthFill.style.backgroundColor = '#ffaa00';
        } else {
            this.healthFill.style.backgroundColor = '#ff0000';
        }
    }
    
    update() {
        if (this.isDestroyed) return;
        
        this.updateMovement();
        
        // Apply magnetic attraction to flag if active
        if (this.magneticActive) {
            this.applyMagneticAttraction();
        }
        
        // Update visual position
        this.element.style.left = (this.x - 15) + 'px';
        this.element.style.top = (this.y - 15) + 'px';
        
        this.updateHealthBar();
        
        // Check if boss should be removed (off screen with buffer)
        if (this.x < -50 || this.x > window.innerWidth + 50 || 
            this.y < -50 || this.y > window.innerHeight + 50) {
            console.log(`🏃 ${this.type.toUpperCase()} boss escaped!`);
            this.destroy(false); // No reward for escaped bosses
        }
    }
    
    takeDamage(damage) {
        this.collisionCount += damage;
        
        if (this.collisionCount >= this.maxCollisions) {
            this.destroy(true);
            return true; // Boss destroyed
        }
        return false; // Boss still alive
    }
    
    destroy(giveReward = true) {
        this.isDestroyed = true;
        
        const reason = giveReward ? 'DEFEATED' : 'ESCAPED';
        console.log(`💀 ${this.type.toUpperCase()} BOSS ${reason}! Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) Health: ${this.collisionCount}/${this.maxCollisions}`);
        
        if (giveReward) {
            this.giveReward();
        }
        
        // Remove visual elements
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
        
        // Remove from boss pins array
        gameState.bossPins = gameState.bossPins.filter(boss => boss !== this);
        if (gameState.activeBossPin === this) {
            gameState.activeBossPin = null;
        }
    }
    
    giveReward() {
        switch(this.type) {
            case 'purple':
                // Drop 1 green pin
                createDraggableGreenPin(this.x, this.y);
                break;
            case 'orange':
                // Split into mini-bosses
                this.createMiniBosses();
                break;
            case 'red':
                // Drop 3 green pins
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    const distance = 30;
                    const dropX = this.x + Math.cos(angle) * distance;
                    const dropY = this.y + Math.sin(angle) * distance;
                    createDraggableGreenPin(dropX, dropY);
                }
                break;
            case 'black':
                // Drop special anti-gravity green pin
                createDraggableGreenPin(this.x, this.y, true);
                break;
        }
    }
    
    createMiniBosses() {
        // Create 3-4 mini-bosses for orange splitter
        const miniCount = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < miniCount; i++) {
            const angle = (i / miniCount) * Math.PI * 2;
            const distance = 60;
            const miniX = this.x + Math.cos(angle) * distance;
            const miniY = this.y + Math.sin(angle) * distance;
            
            // Create mini-boss (smaller, faster, less health)
            const miniBoss = new MiniBoss(miniX, miniY);
            gameState.bossPins.push(miniBoss);
        }
    }
}

export class MiniBoss extends BossPin {
    constructor(x, y) {
        // Random target for erratic movement
        const targetX = Math.random() * window.innerWidth;
        const targetY = Math.random() * window.innerHeight;
        
        super('mini', x, y, targetX, targetY);
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.classList.add('pin', 'mini-boss');
        this.element.style.position = 'fixed';
        this.element.style.width = '20px';
        this.element.style.height = '20px';
        this.element.style.backgroundColor = this.color;
        this.element.style.border = '2px solid #fff';
        this.element.style.borderRadius = '50%';
        this.element.style.boxShadow = `0 0 10px ${this.color}`;
        this.element.style.zIndex = '1002';
        this.element.style.left = (this.x - 10) + 'px';
        this.element.style.top = (this.y - 10) + 'px';
        
        this.element.bossPin = this;
        document.body.appendChild(this.element);
    }
    
    updateMovement() {
        // Erratic movement - change target occasionally
        if (Math.random() < 0.02) { // 2% chance per frame to change direction
            this.targetX = Math.random() * window.innerWidth;
            this.targetY = Math.random() * window.innerHeight;
        }
        
        super.updateMovement();
    }
    
    update() {
        if (this.isDestroyed) return;
        
        this.updateMovement();
        
        // Update visual position (smaller size)
        this.element.style.left = (this.x - 10) + 'px';
        this.element.style.top = (this.y - 10) + 'px';
        
        this.updateHealthBar();
        
        // Check if mini-boss should be removed (completely off screen with generous buffer)
        if (this.x < -30 || this.x > window.innerWidth + 30 || 
            this.y < -30 || this.y > window.innerHeight + 30) {
            console.log(`🏃 Mini-boss escaped! Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
            this.destroy(false);
        }
    }
    
    giveReward() {
        // Each mini-boss drops 1 green pin
        createDraggableGreenPin(this.x, this.y);
    }
}

export function spawnBossPin() {
    // Don't spawn if there's already an active boss
    if (gameState.activeBossPin && !gameState.activeBossPin.isDestroyed) {
        console.log(`Boss spawn blocked: Active boss exists (${gameState.activeBossPin.type})`);
        return;
    }
    
    // Check if we should spawn based on RIP count
    const ripsSinceLastBoss = gameState.destroyedPinsCount - (gameState.lastBossSpawnRIP || 0);
    console.log(`Boss spawn check: RIP since last boss: ${ripsSinceLastBoss} (need 100 for testing)`);
    if (ripsSinceLastBoss < 100) return; // Reduced for testing - was 2000
    
    // Random boss type
    const bossTypes = ['purple', 'orange', 'red', 'black'];
    const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    
    // Random spawn location (edge of screen)
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    let startX, startY, targetX, targetY;
    
    switch(side) {
        case 0: // Top
            startX = Math.random() * window.innerWidth;
            startY = -50;
            targetX = Math.random() * window.innerWidth;
            targetY = window.innerHeight + 50;
            break;
        case 1: // Right
            startX = window.innerWidth + 50;
            startY = Math.random() * window.innerHeight;
            targetX = -50;
            targetY = Math.random() * window.innerHeight;
            break;
        case 2: // Bottom
            startX = Math.random() * window.innerWidth;
            startY = window.innerHeight + 50;
            targetX = Math.random() * window.innerWidth;
            targetY = -50;
            break;
        case 3: // Left
            startX = -50;
            startY = Math.random() * window.innerHeight;
            targetX = window.innerWidth + 50;
            targetY = Math.random() * window.innerHeight;
            break;
    }
    
    const boss = new BossPin(bossType, startX, startY, targetX, targetY);
    gameState.bossPins.push(boss);
    gameState.activeBossPin = boss;
    gameState.lastBossSpawnRIP = gameState.destroyedPinsCount;
    
    console.log(`👹 ${bossType.toUpperCase()} BOSS SPAWNED! RIP: ${gameState.destroyedPinsCount}`);
}

export function updateBossPins() {
    gameState.bossPins.forEach(boss => {
        if (!boss.isDestroyed) {
            boss.update();
        }
    });
    
    // Clean up destroyed bosses
    gameState.bossPins = gameState.bossPins.filter(boss => !boss.isDestroyed);
}

export function checkBossCollision(boss) {
    if (!boss || boss.isDestroyed) return;
    
    const bossRect = boss.element.getBoundingClientRect();
    const flagRect = gameState.flag.getBoundingClientRect();
    
    // Debug: Log boss and flag positions occasionally
    if (Math.random() < 0.01) { // 1% chance to log
        console.log(`Boss collision check: Boss(${boss.x.toFixed(1)}, ${boss.y.toFixed(1)}) Flag(${gameState.x.toFixed(1)}, ${gameState.y.toFixed(1)})`);
    }
    
    // Check collision
    if (flagRect.left < bossRect.right &&
        flagRect.right > bossRect.left &&
        flagRect.top < bossRect.bottom &&
        flagRect.bottom > bossRect.top) {
        
        console.log(`💥 BOSS COLLISION! ${boss.type.toUpperCase()} boss hit!`);
        
        // Calculate collision physics similar to regular pins
        const flagCenterX = gameState.x + 50;
        const flagCenterY = gameState.y + 30;
        const bossCenterX = boss.x;
        const bossCenterY = boss.y;
        
        // Calculate current speed for damage
        const mobileSpeedMultiplier = getMobileSpeedMultiplier();
        const ripSpeedMultiplier = getRipSpeedMultiplier();
        const currentSpeed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy) * 
                           gameState.speedMultiplier * gameState.baseSpeedMultiplier * 
                           mobileSpeedMultiplier * ripSpeedMultiplier;
        
        // Calculate damage
        let damage = 1;
        if (currentSpeed > 300) {
            const speedAbove300 = currentSpeed - 300;
            damage = 1 + Math.floor(speedAbove300 / 300);
        }
        if (currentSpeed > 1000) {
            damage = Math.max(damage, 10); // High speed bonus damage
        }
        
        // Apply damage to boss
        const destroyed = boss.takeDamage(damage);
        
        // Create damage indicator
        createDamageIndicator(bossCenterX, bossCenterY - 30, damage, currentSpeed);
        
        // Create sparks
        createSparks(bossCenterX, bossCenterY);
        
        // Physics - Skip collision physics during redirect loops (just deal damage)
        if (!gameState.redirectLoopActive) {
            // Normal physics - bounce flag off boss
            const deltaX = flagCenterX - bossCenterX;
            const deltaY = flagCenterY - bossCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 0) {
                // Normalize and apply bounce
                const normalX = deltaX / distance;
                const normalY = deltaY / distance;
                
                // Reflect velocity
                const dotProduct = gameState.dx * normalX + gameState.dy * normalY;
                gameState.dx = gameState.dx - 2 * dotProduct * normalX;
                gameState.dy = gameState.dy - 2 * dotProduct * normalY;
                
                // Push flag away from boss
                const pushDistance = 60; // Larger push for bosses
                gameState.x = bossCenterX + normalX * pushDistance;
                gameState.y = bossCenterY + normalY * pushDistance;
                
                // Keep flag in bounds
                const bounds = keepInBounds(gameState.x, gameState.y);
                gameState.x = bounds.x;
                gameState.y = bounds.y;
            }
        } else {
            // During redirect loop: just deal damage, no physics bounce
            console.log(`🔥 LOOP DAMAGE: Hit ${boss.type.toUpperCase()} boss during redirect loop (no physics bounce)`);
        }
        
        if (destroyed) {
            // Increment RIP counter for boss destruction
            gameState.destroyedPinsCount += 10; // Bosses are worth more RIP
            document.getElementById('rip-number').textContent = gameState.destroyedPinsCount.toString();
        }
    }
}
