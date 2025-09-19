// Redirect pin system for creating flag routing chains
import { gameState } from '../core/game-state.js';
import { createSparks } from '../ui/effects.js';

export class RedirectPin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = Date.now() + Math.random(); // Unique ID
        this.element = null;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        this.createElement();
        this.addEventListeners();
        
        // Add to redirect pins array
        gameState.redirectPins.push(this);
        
        console.log(`🔄 Redirect pin created at (${x.toFixed(1)}, ${y.toFixed(1)}). Total: ${gameState.redirectPins.length}`);
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.classList.add('pin', 'redirect-pin');
        this.element.style.position = 'fixed';
        this.element.style.width = '35px';
        this.element.style.height = '35px';
        this.element.style.backgroundColor = '#00aaff';
        this.element.style.border = '3px solid #fff';
        this.element.style.borderRadius = '50%';
        this.element.style.boxShadow = '0 0 15px #00aaff, 0 0 30px rgba(0, 170, 255, 0.3)';
        this.element.style.zIndex = '1004';
        this.element.style.left = (this.x - 17.5) + 'px';
        this.element.style.top = (this.y - 17.5) + 'px';
        this.element.style.cursor = 'move';
        
        // Add arrow indicator
        this.element.innerHTML = '🔄';
        this.element.style.fontSize = '20px';
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        
        // Store reference
        this.element.redirectPin = this;
        document.body.appendChild(this.element);
    }
    
    addEventListeners() {
        this.element.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.startDragging(e);
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    
    startDragging(e) {
        this.isDragging = true;
        
        const pinRect = this.element.getBoundingClientRect();
        this.dragOffsetX = e.clientX - pinRect.left;
        this.dragOffsetY = e.clientY - pinRect.top;
        
        this.element.style.zIndex = '10000';
        this.element.style.transform = 'scale(1.1)';
        
        // Add global mouse move and up handlers
        const handleDragMove = (e) => {
            if (!this.isDragging) return;
            
            const newX = e.clientX - this.dragOffsetX + 17.5; // Center position
            const newY = e.clientY - this.dragOffsetY + 17.5;
            
            // Keep within screen bounds
            this.x = Math.max(35, Math.min(newX, window.innerWidth - 35));
            this.y = Math.max(35, Math.min(newY, window.innerHeight - 35));
            
            this.element.style.left = (this.x - 17.5) + 'px';
            this.element.style.top = (this.y - 17.5) + 'px';
        };
        
        const handleDragEnd = () => {
            this.isDragging = false;
            this.element.style.zIndex = '1004';
            this.element.style.transform = 'scale(1)';
            
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            
            console.log(`🔄 Redirect pin moved to (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
        };
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }
    
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Remove from redirect pins array
        gameState.redirectPins = gameState.redirectPins.filter(pin => pin !== this);
        
        console.log(`🔄 Redirect pin destroyed. Remaining: ${gameState.redirectPins.length}`);
    }
}

export function createRedirectPin(x, y) {
    return new RedirectPin(x, y);
}

export function checkRedirectCollision() {
    if (gameState.redirectPins.length === 0) return;
    
    const flagCenterX = gameState.x + 50;
    const flagCenterY = gameState.y + 30;
    
    // Check collision with each redirect pin
    gameState.redirectPins.forEach(pin => {
        const distance = Math.sqrt(
            (flagCenterX - pin.x) * (flagCenterX - pin.x) + 
            (flagCenterY - pin.y) * (flagCenterY - pin.y)
        );
        
        if (distance < 35) { // Collision detected
            // During active loop, only handle sequence redirects, not new loop triggers
            if (gameState.redirectLoopActive) {
                // Only redirect if this is the expected pin in sequence
                const expectedPin = gameState.redirectSequence[gameState.redirectSequenceIndex];
                if (pin === expectedPin) {
                    handleRedirectCollision(pin, flagCenterX, flagCenterY);
                }
                // Ignore collisions with non-sequence pins during loop
            } else {
                // Normal behavior - can trigger new loops
                handleRedirectCollision(pin, flagCenterX, flagCenterY);
            }
        }
    });
}

function handleRedirectCollision(hitPin, flagX, flagY) {
    const totalPins = gameState.redirectPins.length;
    
    // Create sparks effect
    createSparks(hitPin.x, hitPin.y);
    
    // Visual feedback
    hitPin.element.style.transform = 'scale(1.2)';
    setTimeout(() => {
        if (hitPin.element) {
            hitPin.element.style.transform = 'scale(1)';
        }
    }, 200);
    
    // Store which pin we came from to avoid redirecting back
    if (!gameState.lastRedirectPin) gameState.lastRedirectPin = null;
    
    if (totalPins === 1) {
        // Single pin: always redirect northwest
        redirectFlagNorthwest();
        console.log('🔄 Flag redirected NORTHWEST (single pin)');
        gameState.lastRedirectPin = hitPin;
        
    } else {
        // Multiple pins: 50% chance to start a 3-second sequence loop
        const roll = Math.random();
        
        // Check if we're already in a forced loop
        if (gameState.redirectLoopActive) {
            // We're in a forced loop - follow the sequence pattern
            const nextPin = getNextPinInSequence(hitPin);
            if (nextPin) {
                redirectFlagToTarget(nextPin.x, nextPin.y);
                console.log(`🔥 SEQUENCE LOOP! Pin ${gameState.redirectSequenceIndex + 1}/${gameState.redirectPins.length} | Time left: ${((gameState.redirectLoopEndTime - Date.now()) / 1000).toFixed(1)}s`);
            } else {
                passThrough();
            }
        } else if (roll < 0.5) {
            // 50% chance: Start a 3-second sequence loop
            gameState.redirectLoopActive = true;
            gameState.redirectLoopEndTime = Date.now() + 3000; // 3 seconds
            gameState.redirectSequenceIndex = 0; // Start at first pin
            
            // Create ordered sequence of pins (by creation order)
            gameState.redirectSequence = [...gameState.redirectPins];
            
            const nextPin = getNextPinInSequence(hitPin);
            if (nextPin) {
                redirectFlagToTarget(nextPin.x, nextPin.y);
                console.log(`🔥 SEQUENCE LOOP STARTED! Pattern: ${gameState.redirectPins.length} pins for 3 seconds!`);
            } else {
                gameState.redirectLoopActive = false;
                passThrough();
            }
        } else {
            // 50% chance: Pass through normally
            passThrough();
            console.log('🔄 Flag passed through (50% chance)');
        }
    }
}

function redirectFlagNorthwest() {
    // Calculate northwest direction (-1, -1) normalized
    const speed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy);
    const normalizedSpeed = Math.max(speed, 5); // Minimum speed
    
    gameState.dx = -normalizedSpeed * 0.707; // cos(135°)
    gameState.dy = -normalizedSpeed * 0.707; // sin(135°)
}

function redirectFlagToTarget(targetX, targetY) {
    const flagX = gameState.x + 50;
    const flagY = gameState.y + 30;
    
    // Calculate direction to target
    const deltaX = targetX - flagX;
    const deltaY = targetY - flagY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 0) {
        // Maintain current speed but change direction
        const currentSpeed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy);
        const normalizedSpeed = Math.max(currentSpeed, 5); // Minimum speed
        
        gameState.dx = (deltaX / distance) * normalizedSpeed;
        gameState.dy = (deltaY / distance) * normalizedSpeed;
    }
}

function findClosestRedirectPin(currentPin, excludePin) {
    // Find closest redirect pin, excluding the current pin and optionally the pin we came from
    let availablePins;
    if (excludePin === null) {
        // Allow loops - only exclude current pin
        availablePins = gameState.redirectPins.filter(pin => pin !== currentPin);
    } else {
        // Normal behavior - exclude both current and previous pin
        availablePins = gameState.redirectPins.filter(pin => 
            pin !== currentPin && pin !== excludePin
        );
    }
    
    if (availablePins.length === 0) return null;
    
    let closestPin = availablePins[0];
    let closestDistance = Math.sqrt(
        (currentPin.x - closestPin.x) * (currentPin.x - closestPin.x) + 
        (currentPin.y - closestPin.y) * (currentPin.y - closestPin.y)
    );
    
    for (let i = 1; i < availablePins.length; i++) {
        const pin = availablePins[i];
        const distance = Math.sqrt(
            (currentPin.x - pin.x) * (currentPin.x - pin.x) + 
            (currentPin.y - pin.y) * (currentPin.y - pin.y)
        );
        
        if (distance < closestDistance) {
            closestPin = pin;
            closestDistance = distance;
        }
    }
    
    return closestPin;
}

function passThrough() {
    // Keep current direction but boost speed slightly
    const currentSpeed = Math.sqrt(gameState.dx * gameState.dx + gameState.dy * gameState.dy);
    gameState.dx *= 1.1;
    gameState.dy *= 1.1;
}

function getNextPinInSequence(currentPin) {
    // Get next pin in the sequence pattern (1->2->3->1->2->3...)
    if (!gameState.redirectSequence || gameState.redirectSequence.length === 0) {
        return null;
    }
    
    // Find current pin index in sequence
    const currentIndex = gameState.redirectSequence.findIndex(pin => pin === currentPin);
    
    if (currentIndex !== -1) {
        // Move to next pin in sequence
        gameState.redirectSequenceIndex = (currentIndex + 1) % gameState.redirectSequence.length;
    } else {
        // Current pin not in sequence, start from beginning
        gameState.redirectSequenceIndex = 0;
    }
    
    return gameState.redirectSequence[gameState.redirectSequenceIndex];
}

export function updateRedirectLoop() {
    // Check if redirect loop should end
    if (gameState.redirectLoopActive && Date.now() > gameState.redirectLoopEndTime) {
        gameState.redirectLoopActive = false;
        gameState.redirectSequence = [];
        gameState.redirectSequenceIndex = 0;
        console.log('🔥 SEQUENCE LOOP ENDED! Flag is free to move normally.');
    }
}
