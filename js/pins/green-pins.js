// Green pin merging, magnetic field, and damage line system
import { gameState } from '../core/game-state.js';
import { getDistance, CONSTANTS } from '../utils/helpers.js';
import { createDamageIndicator } from '../ui/effects.js';

export function createDraggableGreenPin(x, y, isAntiGravity = false) {
    const greenPin = document.createElement('div');
    greenPin.classList.add('pin', 'green-pin');
    
    if (isAntiGravity) {
        greenPin.classList.add('anti-gravity-pin');
    }
    
    // Set initial properties
    greenPin.speedBoostMultiplier = 3; // Default boost value
    greenPin.pinPower = 1; // Individual pin power for merging
    
    // Adjust position to center the pin on the coordinates
    greenPin.style.left = (x - 5) + 'px';
    greenPin.style.top = (y - 5) + 'px';
    greenPin.style.width = '10px';
    greenPin.style.height = '10px';
    
    document.body.appendChild(greenPin);
    gameState.pins.push(greenPin);
    
    // Add drag handlers
    addGreenPinDragHandlers(greenPin);
    
    return greenPin;
}

export function addGreenPinDragHandlers(greenPin) {
    greenPin.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            // Right-click to remove
            e.stopPropagation();
            
            // Check if this was the master pin
            if (greenPin === gameState.masterGreenPin) {
                gameState.masterGreenPin = null;
                gameState.masterPinPower = 0;
                removeDamageLine();
                console.log('💥 Master green pin removed!');
            }
            
            greenPin.remove();
            gameState.pins = gameState.pins.filter(p => p !== greenPin);
        } else if (e.button === 0) {
            // Left-click to start dragging
            e.stopPropagation();
            startDragging(greenPin, e);
        }
    });
}

export function startDragging(pin, e) {
    gameState.isDragging = true;
    gameState.draggedPin = pin;
    
    const pinRect = pin.getBoundingClientRect();
    gameState.dragOffsetX = e.clientX - pinRect.left;
    gameState.dragOffsetY = e.clientY - pinRect.top;
    
    pin.style.zIndex = '10000';
    
    // Add global mouse move and up handlers
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
}

function handleDragMove(e) {
    if (!gameState.isDragging || !gameState.draggedPin) return;
    
    const newX = e.clientX - gameState.dragOffsetX;
    const newY = e.clientY - gameState.dragOffsetY;
    
    gameState.draggedPin.style.left = newX + 'px';
    gameState.draggedPin.style.top = newY + 'px';
}

function handleDragEnd(e) {
    if (!gameState.isDragging) return;
    
    gameState.isDragging = false;
    
    if (gameState.draggedPin) {
        gameState.draggedPin.style.zIndex = '1000';
        gameState.draggedPin = null;
    }
    
    // Remove global handlers
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Check for merging after drag ends
    checkGreenPinMerging();
}

export function checkGreenPinMerging() {
    const greenPins = gameState.pins.filter(pin => pin.classList.contains('green-pin'));
    const mergedPins = new Set();
    
    for (let i = 0; i < greenPins.length; i++) {
        if (mergedPins.has(greenPins[i])) continue;
        
        for (let j = i + 1; j < greenPins.length; j++) {
            if (mergedPins.has(greenPins[j])) continue;
            
            const pin1Rect = greenPins[i].getBoundingClientRect();
            const pin2Rect = greenPins[j].getBoundingClientRect();
            
            const pin1CenterX = pin1Rect.left + pin1Rect.width / 2;
            const pin1CenterY = pin1Rect.top + pin1Rect.height / 2;
            const pin2CenterX = pin2Rect.left + pin2Rect.width / 2;
            const pin2CenterY = pin2Rect.top + pin2Rect.height / 2;
            
            const distance = getDistance(pin1CenterX, pin1CenterY, pin2CenterX, pin2CenterY);
            
            if (distance <= CONSTANTS.MERGE_DISTANCE) {
                mergeGreenPins(greenPins[i], greenPins[j]);
                mergedPins.add(greenPins[i]);
                mergedPins.add(greenPins[j]);
                return; // Only merge one pair per frame
            }
        }
    }
}

export function mergeGreenPins(pin1, pin2) {
    // Get current sizes and boost values
    const pin1Size = parseFloat(pin1.style.width) || 10;
    const pin2Size = parseFloat(pin2.style.width) || 10;
    const pin1Boost = pin1.speedBoostMultiplier || 3;
    const pin2Boost = pin2.speedBoostMultiplier || 3;
    const pin1Power = pin1.pinPower || 1;
    const pin2Power = pin2.pinPower || 1;
    
    // Determine which pin to keep (larger one, or pin1 if equal)
    const keepPin = pin1Size >= pin2Size ? pin1 : pin2;
    const removePin = keepPin === pin1 ? pin2 : pin1;
    
    // Calculate new size (5% increase from larger pin)
    const largerSize = Math.max(pin1Size, pin2Size);
    const uncappedSize = largerSize * 1.05;
    const newSize = Math.min(uncappedSize, 20); // Cap at 20px (same as mini-bosses)
    
    // Log if size was capped
    if (uncappedSize > 20) {
        console.log(`🔒 Green pin size CAPPED at 20px (would have been ${uncappedSize.toFixed(1)}px)`);
    }
    
    // Calculate new boost value (60% of sum, capped at 500x)
    const combinedBoost = (pin1Boost + pin2Boost) * 0.6;
    const newBoost = Math.min(combinedBoost, 500);
    
    // Calculate new power (sum of both pins)
    const newPower = pin1Power + pin2Power;
    
    // Update the kept pin
    keepPin.style.width = newSize + 'px';
    keepPin.style.height = newSize + 'px';
    keepPin.speedBoostMultiplier = newBoost;
    keepPin.pinPower = newPower;
    
    // Enhanced visual effects for merged pins
    keepPin.style.boxShadow = `0 0 ${Math.min(newSize / 2, 10)}px #00ff00`;
    keepPin.style.border = '2px solid #00aa00';
    
    // Check if this should become the master pin
    if (!gameState.masterGreenPin || newPower > gameState.masterPinPower) {
        // Remove golden border from previous master
        if (gameState.masterGreenPin) {
            gameState.masterGreenPin.style.border = '2px solid #00aa00';
            gameState.masterGreenPin.style.boxShadow = `0 0 ${Math.min(parseFloat(gameState.masterGreenPin.style.width) / 2, 10)}px #00ff00`;
        }
        
        // Set new master
        gameState.masterGreenPin = keepPin;
        gameState.masterPinPower = newPower;
        
        // Add golden border to new master
        keepPin.style.border = '3px solid #ffd700';
        keepPin.style.boxShadow = `0 0 ${Math.min(newSize / 2, 10)}px #ffd700, 0 0 ${Math.min(newSize, 20)}px #ffff00`;
        
        console.log(`👑 New master green pin! Power: ${newPower}`);
    }
    
    // Remove the other pin
    if (removePin.parentNode) {
        removePin.parentNode.removeChild(removePin);
    }
    gameState.pins = gameState.pins.filter(p => p !== removePin);
    
    console.log(`🔗 Green pins merged! Size: ${newSize.toFixed(1)}px, Boost: ${newBoost.toFixed(1)}x, Power: ${newPower}`);
}

export function updateMagneticField() {
    if (!gameState.playerUpgrades.magneticField) return;
    
    const flagCenterX = gameState.x + 50;
    const flagCenterY = gameState.y + 30;
    
    const greenPins = gameState.pins.filter(pin => pin.classList.contains('green-pin'));
    
    greenPins.forEach(pin => {
        const pinRect = pin.getBoundingClientRect();
        const pinCenterX = pinRect.left + pinRect.width / 2;
        const pinCenterY = pinRect.top + pinRect.height / 2;
        
        // Calculate direction from pin to flag
        const deltaX = flagCenterX - pinCenterX;
        const deltaY = flagCenterY - pinCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0) {
            // Normalize direction
            const normalX = deltaX / distance;
            const normalY = deltaY / distance;
            
            // Move pin towards flag at constant speed
            const newX = pinCenterX + normalX * CONSTANTS.MAGNETIC_FIELD_SPEED;
            const newY = pinCenterY + normalY * CONSTANTS.MAGNETIC_FIELD_SPEED;
            
            // Keep pins within screen bounds
            const pinSize = parseFloat(pin.style.width) || 10;
            const boundedX = Math.max(pinSize/2, Math.min(newX, window.innerWidth - pinSize/2));
            const boundedY = Math.max(pinSize/2, Math.min(newY, window.innerHeight - pinSize/2));
            
            pin.style.left = (boundedX - pinSize/2) + 'px';
            pin.style.top = (boundedY - pinSize/2) + 'px';
        }
    });
}

export function updateDamageLine() {
    // Only show damage line if magnetic field is active and we have a master pin
    if (!gameState.playerUpgrades.magneticField || !gameState.masterGreenPin || !gameState.pins.includes(gameState.masterGreenPin)) {
        removeDamageLine();
        return;
    }
    
    const masterRect = gameState.masterGreenPin.getBoundingClientRect();
    const masterCenterX = masterRect.left + masterRect.width / 2;
    const masterCenterY = masterRect.top + masterRect.height / 2;
    
    const flagCenterX = gameState.x + 50;
    const flagCenterY = gameState.y + 30;
    
    // Create or update damage line
    if (!gameState.damageLineElement) {
        gameState.damageLineElement = document.createElement('div');
        gameState.damageLineElement.style.position = 'fixed';
        gameState.damageLineElement.style.pointerEvents = 'none';
        gameState.damageLineElement.style.zIndex = '999';
        document.body.appendChild(gameState.damageLineElement);
    }
    
    // Calculate line properties
    const deltaX = flagCenterX - masterCenterX;
    const deltaY = flagCenterY - masterCenterY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    // Calculate thickness based on master pin power
    const thickness = Math.min(
        CONSTANTS.DAMAGE_LINE_MAX_THICKNESS,
        Math.max(CONSTANTS.DAMAGE_LINE_MIN_THICKNESS, Math.floor(gameState.masterPinPower / 5))
    );
    
    // Update line visual properties
    gameState.damageLineElement.style.left = masterCenterX + 'px';
    gameState.damageLineElement.style.top = (masterCenterY - thickness/2) + 'px';
    gameState.damageLineElement.style.width = length + 'px';
    gameState.damageLineElement.style.height = thickness + 'px';
    gameState.damageLineElement.style.background = `linear-gradient(90deg, #00ff00, #ffff00)`;
    gameState.damageLineElement.style.opacity = Math.min(0.8, 0.3 + (gameState.masterPinPower / 50));
    gameState.damageLineElement.style.transform = `rotate(${angle}deg)`;
    gameState.damageLineElement.style.transformOrigin = '0 50%';
    gameState.damageLineElement.style.boxShadow = `0 0 ${thickness * 2}px #00ff00`;
    
    // Check for line damage
    checkLineDamage(masterCenterX, masterCenterY, flagCenterX, flagCenterY);
}

function checkLineDamage(x1, y1, x2, y2) {
    const damage = Math.max(1, Math.floor(gameState.masterPinPower / 2));
    
    gameState.pins.forEach(pin => {
        if (pin.classList.contains('green-pin')) return; // Don't damage green pins
        
        const pinRect = pin.getBoundingClientRect();
        const pinCenterX = pinRect.left + pinRect.width / 2;
        const pinCenterY = pinRect.top + pinRect.height / 2;
        
        // Calculate distance from point to line
        const A = y2 - y1;
        const B = x1 - x2;
        const C = x2 * y1 - x1 * y2;
        const distance = Math.abs(A * pinCenterX + B * pinCenterY + C) / Math.sqrt(A * A + B * B);
        
        // Check if pin intersects with line (within 5px)
        if (distance <= 5) {
            pin.collisionCount = (pin.collisionCount || 0) + damage;
            
            // Create special lightning damage indicator
            createDamageIndicator(pinCenterX, pinCenterY - 15, damage, 0, true);
            
            // Check if pin should be destroyed
            const maxCollisions = pin.maxCollisions || 10;
            if (pin.collisionCount >= maxCollisions) {
                // Award RIP points
                const ripReward = pin.classList.contains('leather-pin') ? 10 : 1;
                gameState.destroyedPinsCount += ripReward;
                document.getElementById('rip-number').textContent = gameState.destroyedPinsCount.toString();
                
                // Remove health bar if it exists
                if (pin.healthBar) {
                    pin.healthBar.remove();
                }
                
                // Remove pin
                pin.remove();
                gameState.pins = gameState.pins.filter(p => p !== pin);
                
                console.log(`⚡ Line damage destroyed pin! +${ripReward} RIP`);
            }
        }
    });
}

export function removeDamageLine() {
    if (gameState.damageLineElement) {
        if (gameState.damageLineElement.parentNode) {
            gameState.damageLineElement.parentNode.removeChild(gameState.damageLineElement);
        }
        gameState.damageLineElement = null;
    }
}
