// Pin creation and management system
import { gameState } from '../core/game-state.js';
import { getMobileSpeedMultiplier, getRipSpeedMultiplier, calculateDamage, CONSTANTS } from '../utils/helpers.js';
import { createSparks, createDamageIndicator, createHoldTimer } from '../ui/effects.js';

export function initializePinSystem() {
    // Set up mouse event handlers for pin placement
    document.body.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
}

function handleMouseDown(e) {
    // Disable pin dropping in mobile portrait mode
    if (getMobileSpeedMultiplier() < 1) return;
    
    // Prevent dropping pins on UI elements, the flag, the flag's click area, or the title
    if (e.target.closest('#game-container, #flag-click-area, #bouncing-flag, .pin, h1')) {
        return;
    }

    if (e.button === 0) { // Left-click to start dragging and add pins
        gameState.isMouseDragging = true;
        gameState.lastPinX = e.clientX;
        gameState.lastPinY = e.clientY;
        
        // Start hold timer for enhanced pins
        gameState.mouseHoldStartTime = Date.now();
        gameState.isHoldingForEnhancedPin = true;
        
        // Create hold timer visual
        gameState.holdTimerElement = createHoldTimer(e.clientX, e.clientY);
        
        // Create the first pin at mouse position (use level-appropriate type)
        const pinType = getRandomPinType();
        createPinAtPosition(e.clientX, e.clientY, pinType);
        
        e.preventDefault(); // Prevent text selection while dragging
    }
}

function handleMouseUp(e) {
    if (!gameState.isMouseDragging) return;
    
    // Check if we should create an enhanced pin based on hold duration
    if (gameState.isHoldingForEnhancedPin && gameState.mouseHoldStartTime > 0) {
        const holdDuration = Date.now() - gameState.mouseHoldStartTime;
        
        if (holdDuration >= 30000) {
            // 30+ seconds = Bomb pin (center bomb on cursor position)
            createBombPin(e.clientX, e.clientY);
        } else if (holdDuration >= 10000) {
            // 10-30 seconds = Fortress pin
            createPinAtPosition(e.clientX, e.clientY, 'fortress');
        } else if (holdDuration >= 5000) {
            // 5-10 seconds = Heavy pin
            createPinAtPosition(e.clientX, e.clientY, 'heavy');
        }
    }
    
    // Reset dragging state
    gameState.isMouseDragging = false;
    gameState.isHoldingForEnhancedPin = false;
    gameState.mouseHoldStartTime = 0;
    
    // Remove hold timer
    if (gameState.holdTimerElement) {
        if (gameState.holdTimerElement.parentNode) {
            gameState.holdTimerElement.parentNode.removeChild(gameState.holdTimerElement);
        }
        gameState.holdTimerElement = null;
    }
}

function handleMouseMove(e) {
    if (!gameState.isMouseDragging) return;
    
    // Calculate distance from last pin
    const deltaX = e.clientX - gameState.lastPinX;
    const deltaY = e.clientY - gameState.lastPinY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only create a new pin if we've moved far enough
    if (distance >= CONSTANTS.PIN_SPACING) {
        const pinType = getRandomPinType();
        createPinAtPosition(e.clientX, e.clientY, pinType);
        gameState.lastPinX = e.clientX;
        gameState.lastPinY = e.clientY;
    }
}

export function createPinAtPosition(x, y, pinType = 'regular') {
    const pin = document.createElement('div');
    pin.classList.add('pin');
    
    // Set pin properties based on type
    switch(pinType) {
        case 'heavy':
            pin.classList.add('heavy-pin');
            pin.collisionCount = 0;
            pin.maxCollisions = 100; // 100 HP
            pin.setAttribute('data-pin-type', 'heavy');
            break;
        case 'fortress':
            pin.classList.add('fortress-pin');
            pin.collisionCount = 0;
            pin.maxCollisions = 200; // 200 HP
            pin.setAttribute('data-pin-type', 'fortress');
            break;
        case 'leather':
            pin.classList.add('leather-pin');
            pin.collisionCount = 0;
            pin.maxCollisions = 50; // Much higher HP than regular pins
            pin.setAttribute('data-pin-type', 'leather');
            break;
        case 'iron':
            pin.classList.add('iron-pin');
            pin.collisionCount = 0;
            pin.maxCollisions = 100; // Even higher HP than leather pins
            pin.setAttribute('data-pin-type', 'iron');
            break;
        default:
            pin.collisionCount = 0;
            pin.maxCollisions = 10;
            pin.setAttribute('data-pin-type', 'regular');
    }
    
    // Adjust position to center the pin on the cursor
    pin.style.left = (x - 5) + 'px';
    pin.style.top = (y - 5) + 'px';
    
    document.body.appendChild(pin);
    gameState.pins.push(pin);
    
    // Create health bar for enhanced pins
    if (pinType === 'heavy' || pinType === 'fortress' || pinType === 'leather' || pinType === 'iron') {
        createHealthBar(pin);
    }
    
    // Set up pin event handlers
    pin.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // Right-click to remove a pin
            e.stopPropagation(); // Prevent dropping a new pin
            
            // Increment destroyed pins counter for manual removal too
            gameState.destroyedPinsCount++;
            document.getElementById('rip-number').textContent = gameState.destroyedPinsCount.toString();
            
            // Remove health bar if it exists
            if (pin.healthBar) {
                pin.healthBar.remove();
            }
            
            pin.remove();
            gameState.pins = gameState.pins.filter(p => p !== pin);
        }
    });
    
    return pin;
}

export function createHealthBar(pin) {
    const healthBar = document.createElement('div');
    healthBar.classList.add('health-bar');
    
    const healthFill = document.createElement('div');
    healthFill.classList.add('health-fill');
    healthBar.appendChild(healthFill);
    
    // Position health bar above the pin
    const pinRect = pin.getBoundingClientRect();
    healthBar.style.position = 'fixed';
    healthBar.style.left = (pinRect.left - 5) + 'px';
    healthBar.style.top = (pinRect.top - 15) + 'px';
    healthBar.style.width = '20px';
    healthBar.style.height = '4px';
    healthBar.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    healthBar.style.border = '1px solid rgba(255, 255, 255, 0.5)';
    healthBar.style.zIndex = '1001';
    
    healthFill.style.width = '100%';
    healthFill.style.height = '100%';
    healthFill.style.backgroundColor = '#ff4444';
    healthFill.style.transition = 'width 0.2s ease';
    
    document.body.appendChild(healthBar);
    
    // Store reference to health bar in pin
    pin.healthBar = healthBar;
    pin.healthFill = healthFill;
    
    return healthBar;
}

export function updateHealthBar(pin) {
    if (!pin.healthBar || !pin.healthFill) return;
    
    const healthPercent = Math.max(0, (pin.maxCollisions - pin.collisionCount) / pin.maxCollisions);
    pin.healthFill.style.width = (healthPercent * 100) + '%';
    
    // Update health bar position to follow pin
    const pinRect = pin.getBoundingClientRect();
    pin.healthBar.style.left = (pinRect.left - 5) + 'px';
    pin.healthBar.style.top = (pinRect.top - 15) + 'px';
    
    // Change color based on health
    if (healthPercent > 0.6) {
        pin.healthFill.style.backgroundColor = '#44ff44';
    } else if (healthPercent > 0.3) {
        pin.healthFill.style.backgroundColor = '#ffaa44';
    } else {
        pin.healthFill.style.backgroundColor = '#ff4444';
    }
}

export function getRandomPinType() {
    if (gameState.currentLevel === 1) {
        return 'regular';
    } else if (gameState.currentLevel === 2) {
        // 80% leather pins, 20% regular pins in Level 2
        return Math.random() < 0.8 ? 'leather' : 'regular';
    } else if (gameState.currentLevel === 3) {
        // Level 3: 60% iron pins, 30% leather pins, 10% regular pins
        const roll = Math.random();
        if (roll < 0.6) return 'iron';
        if (roll < 0.9) return 'leather';
        return 'regular';
    }
    return 'regular';
}

export function checkCollision(pin) {
    // Special handling for bomb pins
    if (pin.classList && pin.classList.contains('bomb-pin') && pin.bombPin) {
        // This will be handled by bomb system
        return;
    }
    
    const pinRect = pin.getBoundingClientRect();
    const flagRect = gameState.flag.getBoundingClientRect();

    // Check if flag and pin are colliding
    if (flagRect.left < pinRect.right &&
        flagRect.right > pinRect.left &&
        flagRect.top < pinRect.bottom &&
        flagRect.bottom > pinRect.top) {
        
        // Calculate centers for better collision detection
        const flagCenterX = gameState.x + 50; // flag width is 100px, so center is at x + 50
        const flagCenterY = gameState.y + 30; // flag height is 60px, so center is at y + 30
        const pinCenterX = pinRect.left + pinRect.width / 2;
        const pinCenterY = pinRect.top + pinRect.height / 2;

        // Calculate current speed for damage calculation
        const mobileSpeedMultiplier = getMobileSpeedMultiplier();
        const ripSpeedMultiplier = getRipSpeedMultiplier();
        const currentSpeed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy) * 
                           gameState.speedMultiplier * gameState.baseSpeedMultiplier * 
                           mobileSpeedMultiplier * ripSpeedMultiplier;
        
        const isGreenPin = pin.classList.contains('green-pin');
        
        if (!isGreenPin) {
            // Calculate damage for regular pins
            const isLeatherPin = pin.classList.contains('leather-pin');
            const isIronPin = pin.classList.contains('iron-pin');
            const damage = calculateDamage(
                currentSpeed, 
                gameState.playerUpgrades.blades, 
                gameState.playerUpgrades.plasmaEdge, 
                isLeatherPin,
                isIronPin
            );
            
            // Apply damage
            pin.collisionCount = (pin.collisionCount || 0) + damage;
            
            // Update health bar for enhanced pins
            if ((pin.classList.contains('heavy-pin') || pin.classList.contains('fortress-pin') || pin.classList.contains('leather-pin') || pin.classList.contains('iron-pin'))) {
                updateHealthBar(pin);
            }
            
            // Create damage indicator
            createDamageIndicator(pinCenterX, pinCenterY - 15, damage, currentSpeed);
            
            // Handle special pin effects
            if (isLeatherPin) {
                applySlowdownEffect();
            } else if (pin.classList.contains('iron-pin')) {
                // Iron pins have 50% damage resistance (already applied in calculateDamage)
                // and cause a small speed boost when hit
                gameState.speedBoostEndTime = Math.max(gameState.speedBoostEndTime, Date.now() + 1000);
                console.log('⚡ Iron pin hit! +1s speed boost!');
            }
        }
        
        // Create sparks at collision point
        createSparks(pinCenterX, pinCenterY);

        // PHYSICS - Skip collision physics during redirect loops (just deal damage)
        if (!gameState.redirectLoopActive) {
            handleCollisionPhysics(flagCenterX, flagCenterY, pinCenterX, pinCenterY, pinRect);
        } else {
            // During redirect loop: just deal damage, no physics bounce
            console.log(`🔥 LOOP DAMAGE: Hit pin during redirect loop (no physics bounce)`);
        }

        // Handle green pin effects
        if (isGreenPin) {
            handleGreenPinCollision(pin);
        } else {
            // Check if regular pin should be destroyed
            const maxCollisions = pin.maxCollisions || 10;
            if (pin.collisionCount >= maxCollisions) {
                destroyPin(pin);
            }
        }
    }
}

function handleCollisionPhysics(flagCenterX, flagCenterY, pinCenterX, pinCenterY, pinRect) {
    // Calculate direction from pin to flag
    const deltaX = flagCenterX - pinCenterX;
    const deltaY = flagCenterY - pinCenterY;

    // Determine which side to bounce from based on the larger overlap
    const flagRect = gameState.flag.getBoundingClientRect();
    const overlapX = (flagRect.width + pinRect.width) / 2 - Math.abs(deltaX);
    const overlapY = (flagRect.height + pinRect.height) / 2 - Math.abs(deltaY);

    if (overlapX < overlapY) {
        // Horizontal collision - bounce horizontally
        gameState.dx = -gameState.dx;
        // Push flag away from pin horizontally
        if (deltaX > 0) {
            gameState.x = pinCenterX + pinRect.width / 2 + 50; // Move flag to right of pin
        } else {
            gameState.x = pinCenterX - pinRect.width / 2 - 50; // Move flag to left of pin
        }
    } else {
        // Vertical collision - bounce vertically
        gameState.dy = -gameState.dy;
        // Push flag away from pin vertically
        if (deltaY > 0) {
            gameState.y = pinCenterY + pinRect.height / 2 + 30; // Move flag below pin
        } else {
            gameState.y = pinCenterY - pinRect.height / 2 - 30; // Move flag above pin
        }
    }

    // Ensure flag stays within screen bounds after collision
    gameState.x = Math.max(0, Math.min(gameState.x, window.innerWidth - 100));
    gameState.y = Math.max(0, Math.min(gameState.y, window.innerHeight - 60));
}

function handleGreenPinCollision(pin) {
    if (pin.classList.contains('anti-gravity-pin')) {
        // Anti-gravity pin gives speed boost AND anti-gravity effect
        import('../physics/flag.js').then(({ startSpeedBoost, startAntiGravityEffect }) => {
            startSpeedBoost(3000, 3);
            startAntiGravityEffect(5000);
        });
        console.log('🌟 Anti-gravity green pin activated!');
    } else {
        // Use merged pin's boost value, default to 3 for regular green pins
        const boostMultiplier = pin.speedBoostMultiplier || 3;
        console.log(`🟢 Green pin hit! Boost multiplier: ${boostMultiplier}x`);
        
        import('../physics/flag.js').then(({ startSpeedBoost }) => {
            if (gameState.speedMultiplier < boostMultiplier) {
                // If no boost or lower boost, start new boost
                startSpeedBoost(3000, boostMultiplier);
            } else {
                // If already boosted, extend the timer by 3 seconds
                gameState.speedBoostEndTime += 3000;
            }
        });
    }
}

function destroyPin(pin) {
    console.log(`Removing pin after ${pin.collisionCount} collisions`);
    
    // Increment destroyed pins counter with enhanced pin bonuses
    let ripReward = 1;
    if (pin.classList.contains('iron-pin')) {
        ripReward = 20; // Iron pins give 20x RIP
    } else if (pin.classList.contains('leather-pin')) {
        ripReward = 10; // Leather pins give 10x RIP
    }
    gameState.destroyedPinsCount += ripReward;
    document.getElementById('rip-number').textContent = gameState.destroyedPinsCount.toString();
    
    if (ripReward > 1) {
        const pinType = pin.classList.contains('iron-pin') ? 'Iron' : 'Leather';
        console.log(`🎯 ${pinType} pin destroyed! +${ripReward} RIP points!`);
    }
    
    // Remove health bar if it exists
    if (pin.healthBar) {
        pin.healthBar.remove();
    }
    
    // Check if this was the master pin
    if (pin === gameState.masterGreenPin) {
        gameState.masterGreenPin = null;
        gameState.masterPinPower = 0;
        // Remove damage line - this will be handled by green pin system
        console.log('💥 Master green pin destroyed!');
    }
    
    // Remove pin
    pin.remove();
    gameState.pins = gameState.pins.filter(p => p !== pin);
}

function applySlowdownEffect() {
    const currentTime = Date.now();
    
    // Check cooldown
    if (currentTime - gameState.lastSlowdownTime < gameState.slowdownCooldown) {
        return; // Still on cooldown
    }
    
    gameState.lastSlowdownTime = currentTime;
    gameState.slowdownActive = true;
    gameState.slowdownEndTime = currentTime + 3000; // 3 seconds
    
    console.log('🐌 Leather pin slowdown effect applied!');
    
    // The actual slowdown will be applied in the flag movement calculation
    setTimeout(() => {
        gameState.slowdownActive = false;
        console.log('🏃 Slowdown effect ended');
    }, 3000);
}

// Function to create bomb pin
function createBombPin(x, y) {
    console.log(`💣 Creating bomb pin centered at cursor (${x}, ${y})`);
    import('../bosses/bomb-pin.js').then(({ createBombPin }) => {
        createBombPin(x, y);
    });
}

// Export collision checking for use in main game loop
export function checkAllCollisions() {
    gameState.pins.forEach(checkCollision);
}
