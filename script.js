document.addEventListener('DOMContentLoaded', () => {
    // Bouncing flag animation
    const flag = document.getElementById('bouncing-flag');
    const flagClickArea = document.createElement('div');
    flagClickArea.id = 'flag-click-area'; // Add an ID
    flagClickArea.style.position = 'fixed';
    flagClickArea.style.width = '100px';
    flagClickArea.style.height = '60px';
    flagClickArea.style.zIndex = '0';
    flagClickArea.style.cursor = 'pointer';
    document.body.appendChild(flagClickArea);
    let x = Math.random() * (window.innerWidth - 100);
    let y = Math.random() * (window.innerHeight - 60);
    let dx = (Math.random() - 0.5) * 2;
    let dy = (Math.random() - 0.5) * 2;
    let speedMultiplier = 1;
    let baseSpeedMultiplier = 1; // Increases by 5% with each correct answer
    let pins = [];
    let score = 0;
    let speedBoostEndTime = 0; // Track when speed boost should end
    let speedBoostInterval = null;
    
    // Mouse drag variables for pin placement
    let isMouseDragging = false;
    let lastPinX = 0;
    let lastPinY = 0;
    const pinSpacing = 18; // Distance between pins (14px pin + 4px gap)
    
    // Enhanced pin placement variables
    let mouseHoldStartTime = 0;
    let holdTimerElement = null;
    let isHoldingForEnhancedPin = false;
    
    // Anti-gravity effect variables
    let antiGravityEndTime = 0;
    let antiGravityActive = false;
    
    // Trail effect variables
    let trailParticles = [];
    let lastTrailX = x;
    let lastTrailY = y;
    const trailSpacing = 8; // Distance between trail particles
    
    // Mobile detection and speed adjustment
    function isMobilePortrait() {
        return window.innerWidth <= 600 && window.innerHeight > window.innerWidth;
    }
    
    function getMobileSpeedMultiplier() {
        return isMobilePortrait() ? 0.3 : 1; // Much slower in mobile portrait
    }

    function createTrailParticle(x, y, dx, dy) {
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
        
        trailParticles.push(trailData);
        
        // Start fading immediately
        setTimeout(() => {
            particle.style.opacity = '0';
        }, 50);
        
        return trailData;
    }

    function updateTrailParticles() {
        const currentTime = Date.now();
        
        // Remove expired particles
        trailParticles = trailParticles.filter(trail => {
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

    function startSpeedBoost(duration = 3000, multiplier = 200) {
        // Clear existing boost interval if any
        if (speedBoostInterval) {
            clearInterval(speedBoostInterval);
        }

        speedMultiplier = multiplier;
        speedBoostEndTime = Date.now() + duration;

        speedBoostInterval = setInterval(() => {
            const timeLeft = speedBoostEndTime - Date.now();
            if (timeLeft <= 0) {
                speedMultiplier = 1;
                clearInterval(speedBoostInterval);
                speedBoostInterval = null;
            } else {
                // Gradually reduce speed as time runs out
                const progress = timeLeft / duration;
                speedMultiplier = 1 + (multiplier - 1) * progress;
            }
        }, 50);
    }

    flagClickArea.addEventListener('click', () => {
        // Disable flag clicking in mobile portrait mode
        if (isMobilePortrait()) return;
        
        // Prevent new speed boosts while one is active
        if (speedMultiplier > 1) return;

        startSpeedBoost(3000, 200);
    });

    document.body.addEventListener('mousedown', (e) => {
        // Disable pin dropping in mobile portrait mode
        if (isMobilePortrait()) return;
        
        // Prevent dropping pins on UI elements, the flag, the flag's click area, or the title
        if (e.target.closest('#game-container, #flag-click-area, #bouncing-flag, .pin, h1')) {
            return;
        }

        if (e.button === 0) { // Left-click to start dragging and add pins
            isMouseDragging = true;
            lastPinX = e.clientX;
            lastPinY = e.clientY;
            
            // Start hold timer for enhanced pins
            mouseHoldStartTime = Date.now();
            isHoldingForEnhancedPin = true;
            
            // Create hold timer visual
            holdTimerElement = createHoldTimer(e.clientX, e.clientY);
            
            // Create the first pin at mouse position (use level-appropriate type)
            const pinType = getRandomPinType();
            createPinAtPosition(e.clientX, e.clientY, pinType);
            
            e.preventDefault(); // Prevent text selection while dragging
        }
    });

    function createPinAtPosition(x, y, pinType = 'regular') {
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
            default:
                pin.collisionCount = 0;
                pin.maxCollisions = 10;
                pin.setAttribute('data-pin-type', 'regular');
        }
        
        // Adjust position to center the pin on the cursor
        pin.style.left = (x - 5) + 'px';
        pin.style.top = (y - 5) + 'px';
        
        document.body.appendChild(pin);
        pins.push(pin);
        
        // Create health bar for enhanced pins
        if (pinType === 'heavy' || pinType === 'fortress' || pinType === 'leather') {
            createHealthBar(pin);
        }
        
        checkCollision(pin); // Check for collision immediately

        pin.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right-click to remove a pin
                e.stopPropagation(); // Prevent dropping a new pin
                
                // Increment destroyed pins counter for manual removal too
                destroyedPinsCount++;
                ripNumber.textContent = destroyedPinsCount.toString();
                
                // Remove health bar if it exists
                if (pin.healthBar) {
                    pin.healthBar.remove();
                }
                
                pin.remove();
                pins = pins.filter(p => p !== pin);
            }
        });
        
        return pin;
    }
    
    function createHealthBar(pin) {
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
    
    function updateHealthBar(pin) {
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
    
    function createHoldTimer(x, y) {
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
    
    function updateHoldTimer(timer, progress, stage) {
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


    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Disable text selection and dragging
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // Reset trail position after orientation change
            lastTrailX = x;
            lastTrailY = y;
        }, 100);
    });

    // R key to reset flag
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r') {
            // Reset flag position to random location
            x = Math.random() * (window.innerWidth - 100);
            y = Math.random() * (window.innerHeight - 60);
            
            // Reset flag direction to random
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
            
            // Clear any active speed boost
            if (speedBoostInterval) {
                clearInterval(speedBoostInterval);
                speedBoostInterval = null;
            }
            speedMultiplier = 1;
            speedBoostEndTime = 0;
            
            // Reset base speed multiplier with randomized value
            baseSpeedMultiplier = getRandomFlagSpeed();
            
            // Clear all trail particles
            trailParticles.forEach(trail => {
                if (trail.element.parentNode) {
                    trail.element.parentNode.removeChild(trail.element);
                }
            });
            trailParticles = [];
            lastTrailX = x;
            lastTrailY = y;
        }
        
        // Debug sequence handler
        keySequence += e.key.toLowerCase();
        if (keySequence.length > 5) keySequence = keySequence.slice(-5);
        if (keySequence === 'green') {
            score++;
            scoreNumber.textContent = score.toString();
            // Spawn at score pin location (top right corner)
            const scoreContainer = document.getElementById('score-container');
            const rect = scoreContainer.getBoundingClientRect();
            createDraggableGreenPin(rect.right - 15, rect.top + 15);
            keySequence = '';
        }
    });

    function animate() {
        const mobileSpeedMultiplier = getMobileSpeedMultiplier();
        const ripSpeedMultiplier = getRipSpeedMultiplier();
        
        // Calculate the full speed multiplier for internal calculations
        const fullSpeedMultiplier = speedMultiplier * baseSpeedMultiplier * mobileSpeedMultiplier * ripSpeedMultiplier;
        
        // Calculate current speed for game mechanics (uncapped)
        const currentSpeed = Math.sqrt(dx * dx + dy * dy) * fullSpeedMultiplier;
        
        // Cap the visual movement speed at 300 equivalent
        const maxVisualSpeed = 300;
        const baseSpeed = Math.sqrt(dx * dx + dy * dy);
        const visualSpeedMultiplier = baseSpeed > 0 ? Math.min(fullSpeedMultiplier, maxVisualSpeed / baseSpeed) : fullSpeedMultiplier;
        
        // Apply capped movement for visual flag position
        x += dx * visualSpeedMultiplier;
        y += dy * visualSpeedMultiplier;

        // Cap the displayed speed at 300 for visual clarity, but keep internal calculation intact
        const displayedSpeed = Math.min(currentSpeed, 300);
        speedNumber.textContent = displayedSpeed.toFixed(1);
        
        // Show/hide warning and reset text based on speed
        if (currentSpeed > 500) {
            warningContainer.style.display = 'block';
            warningText.style.display = 'inline';
            resetText.style.display = 'none';
            
            // Add red blinking effect when speed > 1000
            if (currentSpeed > 1000) {
                warningText.classList.add('extreme-speed-warning');
            } else {
                warningText.classList.remove('extreme-speed-warning');
            }
        } else {
            warningContainer.style.display = 'block';
            warningText.style.display = 'none';
            resetText.style.display = 'inline';
            warningText.classList.remove('extreme-speed-warning');
        }
        
        // Apply passive damage when speed > 1000
        applyPassiveDamage(currentSpeed);
        
        // Apply gravity well effects from black bosses
        applyGravityWellEffects();

        // Bounce off the walls
        if (x <= 0 || x >= window.innerWidth - 100) {
            dx = -dx;
        }
        if (y <= 0 || y >= window.innerHeight - 60) {
            dy = -dy;
        }

        // Create trail particles if flag has moved enough
        const trailDeltaX = x - lastTrailX;
        const trailDeltaY = y - lastTrailY;
        const trailDistance = Math.sqrt(trailDeltaX * trailDeltaX + trailDeltaY * trailDeltaY);
        
        if (trailDistance >= trailSpacing) {
            createTrailParticle(x, y, dx, dy);
            lastTrailX = x;
            lastTrailY = y;
        }

        // Update and cleanup trail particles
        updateTrailParticles();
        
        // Update magnetic field
        updateMagneticField();
        
        // Update hold timer visual
        if (isHoldingForEnhancedPin && holdTimerElement && mouseHoldStartTime > 0) {
            const holdDuration = Date.now() - mouseHoldStartTime;
            
            if (holdDuration < 5000) {
                // First 5 seconds - building to Heavy pin
                const progress = holdDuration / 5000;
                updateHoldTimer(holdTimerElement, progress, 'heavy');
            } else if (holdDuration < 10000) {
                // Next 5 seconds - building to Fortress pin
                const progress = (holdDuration - 5000) / 5000;
                updateHoldTimer(holdTimerElement, progress, 'fortress');
            } else if (holdDuration < 30000) {
                // Next 20 seconds - building to Bomb pin
                const progress = (holdDuration - 10000) / 20000;
                updateHoldTimer(holdTimerElement, progress, 'bomb');
            } else {
                // Completed - show full bomb timer
                updateHoldTimer(holdTimerElement, 1, 'bomb');
            }
        }

        // Collision with pins
        pins.forEach(checkCollision);
        
        // Update boss pins
        updateBossPins();
        
        // Check boss collisions
        bossPins.forEach(boss => checkBossCollision(boss));
        
        // Try to spawn boss pins
        spawnBossPin();

        flag.style.left = x + 'px';
        flag.style.top = y + 'px';
        flagClickArea.style.left = x + 'px';
        flagClickArea.style.top = y + 'px';

        requestAnimationFrame(animate);
    }

    function createSparks(centerX, centerY) {
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
    
    // Function to create light blue damage sparks from pins
    function createDamageSparks(pinX, pinY) {
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

    // Function to create damage indicator showing how much damage was dealt
    function createDamageIndicator(x, y, damage, speed, isLineDamage = false) {
        const indicator = document.createElement('div');
        indicator.style.position = 'fixed';
        indicator.style.left = x + 'px';
        indicator.style.top = y + 'px';
        if (isLineDamage) {
            indicator.style.color = '#ffff00';
            indicator.style.textShadow = '0 0 4px #ffaa00';
            indicator.textContent = `⚡${damage}`;
        } else {
            indicator.style.color = '#87ceeb';
            indicator.style.textShadow = '0 0 3px #4682b4';
        }
        indicator.style.fontSize = '12px';
        indicator.style.fontWeight = 'bold';
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '10001';
        indicator.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
        indicator.style.transition = 'all 1s ease-out';
        
        // Show damage amount and speed context
        if (damage >= 10) {
            indicator.textContent = 'ONESHOT!';
        } else if (damage > 1) {
            indicator.textContent = `-${damage} (${Math.floor(speed)})`;
        } else {
            indicator.textContent = '-1';
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

// ...

    function checkCollision(pin) {
        // Special handling for bomb pins
        if (pin.classList && pin.classList.contains('bomb-pin') && pin.bombPin) {
            return checkBombCollision(pin.bombPin);
        }
        
        const pinRect = pin.getBoundingClientRect();
        const flagRect = flag.getBoundingClientRect();

        // Check if flag and pin are colliding
        if (flagRect.left < pinRect.right &&
            flagRect.right > pinRect.left &&
            flagRect.top < pinRect.bottom &&
            flagRect.bottom > pinRect.top) {
            // Calculate centers for better collision detection
            const flagCenterX = x + 50; // flag width is 100px, so center is at x + 50
            const flagCenterY = y + 30; // flag height is 60px, so center is at y + 30
            const pinCenterX = pinRect.left + pinRect.width / 2;
            const pinCenterY = pinRect.top + pinRect.height / 2;

            // Calculate current speed for oneshot detection
            const mobileSpeedMultiplier = getMobileSpeedMultiplier();
            const ripSpeedMultiplier = getRipSpeedMultiplier();
            const currentSpeed = Math.sqrt(dx * dx + dy * dy) * speedMultiplier * baseSpeedMultiplier * mobileSpeedMultiplier * ripSpeedMultiplier;
            
            const isGreenPin = pin.classList.contains('green-pin');
            
            // Calculate damage based on speed and upgrades
            let damage = 1; // Base damage
            
            // Apply upgrade multipliers
            if (playerUpgrades.plasmaEdge) {
                damage *= 100; // 100x damage
            } else if (playerUpgrades.blades) {
                damage *= 10; // 10x damage
            }
            
            // After 300 speed, damage scales with speed
            if (currentSpeed > 300) {
                // Damage scales from 1 to higher values based on speed above 300
                // At 600 speed = 2x damage, at 900 speed = 3x damage, etc.
                const speedAbove300 = currentSpeed - 300;
                const speedMultiplier = 1 + Math.floor(speedAbove300 / 300);
                damage *= speedMultiplier;
            }
            
            // Special damage handling for leather pins
            const isLeatherPin = pin.classList.contains('leather-pin');
            if (isLeatherPin && !isGreenPin) {
                // Leather pins are very resistant to damage without upgrades
                if (!playerUpgrades.blades && !playerUpgrades.plasmaEdge) {
                    damage = Math.max(1, Math.floor(damage * 0.2)); // Only 20% damage without upgrades
                    console.log(`🛡️ Leather armor resisted! Damage reduced to ${damage}`);
                }
                // No oneshot capability for leather pins without upgrades
            } else if (!isGreenPin && currentSpeed > 1000 && !isLeatherPin) {
                // Regular pins can still be oneshot at high speed
                damage = Math.max(damage, 10); // Set to max to trigger instant destruction
                console.log(`💥 ONESHOT! Speed: ${currentSpeed.toFixed(1)} - Instantly destroyed red pin!`);
            }
            
            // Apply damage
            pin.collisionCount = (pin.collisionCount || 0) + damage;
            
            // Update health bar for enhanced pins
            if ((pin.classList.contains('heavy-pin') || pin.classList.contains('fortress-pin') || pin.classList.contains('leather-pin')) && !isGreenPin) {
                updateHealthBar(pin);
            }
            
            // Create damage indicator (only for regular pins)
            if (!isGreenPin) {
                createDamageIndicator(pinCenterX, pinCenterY - 15, damage, currentSpeed);
            }
            
            // Create sparks at collision point
            createSparks(pinCenterX, pinCenterY);

            // PHYSICS FIRST - Calculate collision physics before pin destruction
            // Calculate direction from pin to flag
            const deltaX = flagCenterX - pinCenterX;
            const deltaY = flagCenterY - pinCenterY;

            // Determine which side to bounce from based on the larger overlap
            const overlapX = (flagRect.width + pinRect.width) / 2 - Math.abs(deltaX);
            const overlapY = (flagRect.height + pinRect.height) / 2 - Math.abs(deltaY);

            if (overlapX < overlapY) {
                // Horizontal collision - bounce horizontally
                dx = -dx;
                // Push flag away from pin horizontally
                if (deltaX > 0) {
                    x = pinCenterX + pinRect.width / 2 + 50; // Move flag to right of pin
                } else {
                    x = pinCenterX - pinRect.width / 2 - 50; // Move flag to left of pin
                }
            } else {
                // Vertical collision - bounce vertically
                dy = -dy;
                // Push flag away from pin vertically
                if (deltaY > 0) {
                    y = pinCenterY + pinRect.height / 2 + 30; // Move flag below pin
                } else {
                    y = pinCenterY - pinRect.height / 2 - 30; // Move flag above pin
                }
            }

            // Ensure flag stays within screen bounds after collision
            x = Math.max(0, Math.min(x, window.innerWidth - 100));
            y = Math.max(0, Math.min(y, window.innerHeight - 60));

            // Special handling for green pins
            if (pin.classList.contains('green-pin')) {
                if (pin.classList.contains('anti-gravity-pin')) {
                    // Anti-gravity pin gives speed boost AND anti-gravity effect
                    startSpeedBoost(3000, 3);
                    startAntiGravityEffect(5000);
                    console.log('🌟 Anti-gravity green pin activated!');
                } else {
                    // Use merged pin's boost value, default to 3 for regular green pins
                    const boostMultiplier = pin.speedBoostMultiplier || 3;
                    console.log(`🟢 Green pin hit! Boost multiplier: ${boostMultiplier}x`);
                    
                    if (speedMultiplier < boostMultiplier) {
                        // If no boost or lower boost, start new boost
                        startSpeedBoost(3000, boostMultiplier);
                    } else {
                        // If already boosted, extend the timer by 3 seconds
                        speedBoostEndTime += 3000;
                    }
                }
            }

            // DESTRUCTION LAST - Check if pin should be removed after physics are applied
            const maxCollisions = pin.maxCollisions || 10; // Default to 10 if not set
            const pinType = isGreenPin ? 'green' : 'regular';
            
            // Debug logging
            console.log(`${pinType} pin collision #${pin.collisionCount}/${isGreenPin ? '∞' : maxCollisions}`);
            
            // Handle leather pin slowdown effect
            if (pin.classList.contains('leather-pin') && !isGreenPin) {
                applySlowdownEffect();
            }
            
            // Only destroy regular pins, green pins are indestructible
            if (!isGreenPin && pin.collisionCount >= maxCollisions) {
                console.log(`Removing ${pinType} pin after ${pin.collisionCount} collisions`);
                
                // Increment destroyed pins counter with leather pin bonus
                const ripReward = pin.classList.contains('leather-pin') ? 10 : 1;
                destroyedPinsCount += ripReward;
                ripNumber.textContent = destroyedPinsCount.toString();
                
                if (ripReward > 1) {
                    console.log(`🎯 Leather pin destroyed! +${ripReward} RIP points!`);
                }
                
                // Remove health bar if it exists
                if (pin.healthBar) {
                    pin.healthBar.remove();
                }
                
                // Check if this was the master pin
                if (pin === masterGreenPin) {
                    masterGreenPin = null;
                    masterPinPower = 0;
                    removeDamageLine();
                    console.log('💥 Master green pin destroyed!');
                }
                
                // Remove pin
                pin.remove();
                pins = pins.filter(p => p !== pin);
                return; // Exit early since pin is removed
            }
        }
    }

    // Pin drag functionality
    const scorePin = document.getElementById('score-pin');
    const scoreNumber = document.getElementById('score-number');
    let isDragging = false;
    let draggedPin = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function createDraggableGreenPin(x, y, isAntiGravity = false) {
        const greenPin = document.createElement('div');
        greenPin.classList.add('pin', 'green-pin');
        
        if (isAntiGravity) {
            greenPin.classList.add('anti-gravity-pin');
            greenPin.setAttribute('data-pin-type', 'anti-gravity');
        } else {
            greenPin.setAttribute('data-pin-type', 'green');
        }
        
        greenPin.style.left = (x - 5) + 'px';
        greenPin.style.top = (y - 5) + 'px';
        
        // Add collision counter to green pins too
        greenPin.collisionCount = 0;
        greenPin.maxCollisions = 10;
        
        document.body.appendChild(greenPin);
        pins.push(greenPin);
        
        // Add drag functionality to green pin
        addGreenPinDragHandlers(greenPin);
        
        return greenPin;
    }
    
    function applyGravityWellEffects() {
        // Find active black bosses
        const blackBosses = bossPins.filter(boss => boss.type === 'black' && !boss.isDestroyed);
        
        blackBosses.forEach(boss => {
            const flagCenterX = x + 50;
            const flagCenterY = y + 30;
            
            // Calculate distance to boss
            const deltaX = boss.x - flagCenterX;
            const deltaY = boss.y - flagCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Apply gravity if within radius
            if (distance < boss.gravityRadius && distance > 0) {
                // Calculate gravity strength (stronger when closer)
                const gravityStrength = (boss.gravityRadius - distance) / boss.gravityRadius;
                const pullForce = gravityStrength * 0.3; // Adjust this value to balance
                
                // Apply gravitational pull (but don't override anti-gravity)
                if (!antiGravityActive) {
                    const normalX = deltaX / distance;
                    const normalY = deltaY / distance;
                    
                    dx += normalX * pullForce;
                    dy += normalY * pullForce;
                }
            }
        });
        
        // Handle anti-gravity effect
        if (antiGravityActive && Date.now() > antiGravityEndTime) {
            antiGravityActive = false;
            console.log('Anti-gravity effect ended');
        }
    }
    
    function startAntiGravityEffect(duration = 5000) {
        antiGravityActive = true;
        antiGravityEndTime = Date.now() + duration;
        console.log('Anti-gravity effect started for', duration / 1000, 'seconds');
        
        // Visual feedback - make flag glow
        flag.style.filter = 'drop-shadow(0 0 10px #44ff44)';
        
        // Remove glow when effect ends
        setTimeout(() => {
            flag.style.filter = '';
        }, duration);
    }
    
    // Bomb Pin System
    class BombPin {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.element = null;
            this.healthBar = null;
            this.healthFill = null;
            this.timerElement = null;
            this.timerFill = null;
            this.collisionCount = 0;
            this.maxCollisions = 5000; // 5000 HP
            this.isDestroyed = false;
            this.timeLeft = 30000; // 30 seconds in milliseconds
            this.createdAt = Date.now();
            
            this.createElement();
            this.createHealthBar();
            this.createTimer();
            
            // Start countdown
            this.startCountdown();
        }
        
        createElement() {
            this.element = document.createElement('div');
            this.element.classList.add('pin', 'bomb-pin');
            this.element.style.position = 'fixed';
            this.element.style.width = '300px'; // 30x size (10px * 30)
            this.element.style.height = '300px';
            this.element.style.backgroundColor = '#000000';
            this.element.style.border = '10px solid #ff0000';
            this.element.style.borderRadius = '50%';
            this.element.style.boxShadow = '0 0 50px #ff0000, inset 0 0 50px rgba(255, 0, 0, 0.3)';
            this.element.style.zIndex = '10000'; // Increased z-index to ensure visibility
            this.element.style.left = (this.x - 150) + 'px'; // Center the 300px pin
            this.element.style.top = (this.y - 150) + 'px';
            this.element.style.animation = 'bomb-pulse 1s ease-in-out infinite alternate';
            this.element.style.display = 'block'; // Ensure it's displayed
            this.element.style.visibility = 'visible'; // Ensure it's visible
            
            // Add bomb symbol
            const bombSymbol = document.createElement('div');
            bombSymbol.textContent = '💣';
            bombSymbol.style.position = 'absolute';
            bombSymbol.style.top = '50%';
            bombSymbol.style.left = '50%';
            bombSymbol.style.transform = 'translate(-50%, -50%)';
            bombSymbol.style.fontSize = '100px';
            bombSymbol.style.pointerEvents = 'none';
            
            this.element.appendChild(bombSymbol);
            this.element.bombPin = this;
            
            document.body.appendChild(this.element);
        }
        
        createHealthBar() {
            this.healthBar = document.createElement('div');
            this.healthBar.classList.add('bomb-health-bar');
            this.healthBar.style.position = 'fixed';
            this.healthBar.style.width = '320px';
            this.healthBar.style.height = '20px';
            this.healthBar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            this.healthBar.style.border = '3px solid #ff0000';
            this.healthBar.style.borderRadius = '10px';
            this.healthBar.style.zIndex = '1005';
            this.healthBar.style.left = (this.x - 160) + 'px';
            this.healthBar.style.top = (this.y - 200) + 'px';
            
            this.healthFill = document.createElement('div');
            this.healthFill.style.width = '100%';
            this.healthFill.style.height = '100%';
            this.healthFill.style.backgroundColor = '#ff4444';
            this.healthFill.style.borderRadius = '7px';
            this.healthFill.style.transition = 'width 0.2s ease, background-color 0.3s ease';
            
            // Health text
            const healthText = document.createElement('div');
            healthText.style.position = 'absolute';
            healthText.style.top = '50%';
            healthText.style.left = '50%';
            healthText.style.transform = 'translate(-50%, -50%)';
            healthText.style.color = '#ffffff';
            healthText.style.fontSize = '14px';
            healthText.style.fontWeight = 'bold';
            healthText.style.textShadow = '1px 1px 2px #000000';
            healthText.textContent = '5000 / 5000 HP';
            
            this.healthBar.appendChild(this.healthFill);
            this.healthBar.appendChild(healthText);
            this.healthText = healthText;
            
            document.body.appendChild(this.healthBar);
        }
        
        createTimer() {
            this.timerElement = document.createElement('div');
            this.timerElement.classList.add('bomb-timer');
            this.timerElement.style.position = 'fixed';
            this.timerElement.style.width = '320px';
            this.timerElement.style.height = '20px';
            this.timerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            this.timerElement.style.border = '3px solid #ffaa00';
            this.timerElement.style.borderRadius = '10px';
            this.timerElement.style.zIndex = '1005';
            this.timerElement.style.left = (this.x - 160) + 'px';
            this.timerElement.style.top = (this.y - 170) + 'px';
            
            this.timerFill = document.createElement('div');
            this.timerFill.style.width = '100%';
            this.timerFill.style.height = '100%';
            this.timerFill.style.backgroundColor = '#ffaa00';
            this.timerFill.style.borderRadius = '7px';
            this.timerFill.style.transition = 'width 0.1s linear, background-color 0.3s ease';
            
            // Timer text
            const timerText = document.createElement('div');
            timerText.style.position = 'absolute';
            timerText.style.top = '50%';
            timerText.style.left = '50%';
            timerText.style.transform = 'translate(-50%, -50%)';
            timerText.style.color = '#ffffff';
            timerText.style.fontSize = '14px';
            timerText.style.fontWeight = 'bold';
            timerText.style.textShadow = '1px 1px 2px #000000';
            timerText.textContent = '30.0s';
            
            this.timerElement.appendChild(this.timerFill);
            this.timerElement.appendChild(timerText);
            this.timerText = timerText;
            
            document.body.appendChild(this.timerElement);
        }
        
        startCountdown() {
            const countdownInterval = setInterval(() => {
                if (this.isDestroyed) {
                    clearInterval(countdownInterval);
                    return;
                }
                
                this.timeLeft -= 100; // Update every 100ms
                
                if (this.timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    this.explode();
                    return;
                }
                
                this.updateTimer();
                
                // Increase urgency as time runs out
                if (this.timeLeft < 10000) { // Last 10 seconds
                    this.element.style.animation = 'bomb-critical 0.3s ease-in-out infinite alternate';
                    this.timerFill.style.backgroundColor = '#ff0000';
                } else if (this.timeLeft < 20000) { // Last 20 seconds
                    this.element.style.animation = 'bomb-warning 0.5s ease-in-out infinite alternate';
                    this.timerFill.style.backgroundColor = '#ff6600';
                }
            }, 100);
        }
        
        updateTimer() {
            if (!this.timerFill || !this.timerText) return;
            
            const timePercent = Math.max(0, this.timeLeft / 30000);
            this.timerFill.style.width = (timePercent * 100) + '%';
            
            const seconds = (this.timeLeft / 1000).toFixed(1);
            this.timerText.textContent = seconds + 's';
        }
        
        updateHealthBar() {
            if (!this.healthBar || !this.healthFill || !this.healthText) return;
            
            const healthPercent = Math.max(0, (this.maxCollisions - this.collisionCount) / this.maxCollisions);
            this.healthFill.style.width = (healthPercent * 100) + '%';
            
            const currentHP = Math.max(0, this.maxCollisions - this.collisionCount);
            this.healthText.textContent = `${currentHP} / ${this.maxCollisions} HP`;
            
            // Change color based on health
            if (healthPercent > 0.6) {
                this.healthFill.style.backgroundColor = '#44ff44';
            } else if (healthPercent > 0.3) {
                this.healthFill.style.backgroundColor = '#ffaa44';
            } else {
                this.healthFill.style.backgroundColor = '#ff4444';
            }
        }
        
        takeDamage(damage) {
            // Bomb becomes more resilient as it takes damage (armor scaling)
            const healthPercent = (this.maxCollisions - this.collisionCount) / this.maxCollisions;
            let actualDamage = damage;
            
            // Reduce damage as bomb gets more damaged (desperation armor)
            if (healthPercent < 0.5) { // Below 50% health
                const armorReduction = (0.5 - healthPercent) * 0.6; // Up to 30% damage reduction
                actualDamage = Math.ceil(damage * (1 - armorReduction));
                
                if (actualDamage < damage) {
                    console.log(`🛡️ Bomb armor activated! Damage reduced from ${damage} to ${actualDamage} (${healthPercent.toFixed(1)*100}% HP remaining)`);
                }
            }
            
            // Apply the reduced damage
            this.collisionCount += actualDamage;
            this.updateHealthBar();
            
            // Visual feedback for armor activation
            if (actualDamage < damage && healthPercent < 0.5) {
                this.element.style.borderColor = '#ffffff';
                setTimeout(() => {
                    this.element.style.borderColor = '#ff0000';
                }, 200);
            }
            
            if (this.collisionCount >= this.maxCollisions) {
                this.defuse();
                return true; // Bomb defused
            }
            return false; // Bomb still active
        }
        
        defuse() {
            if (this.isDestroyed) return;
            
            this.isDestroyed = true;
            bombActive = false;
            levelComplete = true;
            
            console.log('💚 BOMB DEFUSED! LEVEL COMPLETE!');
            
            // Remove visual elements
            this.destroy();
            
            // Show level complete screen
            showLevelCompleteScreen();
        }
        
        explode() {
            if (this.isDestroyed) return;
            
            this.isDestroyed = true;
            bombActive = false;
            gameOver = true;
            
            console.log('💥 BOMB EXPLODED! GAME OVER!');
            
            // Create explosion effect
            this.createExplosion();
            
            // Remove visual elements after explosion
            setTimeout(() => {
                this.destroy();
                showGameOverScreen();
            }, 2000);
        }
        
        createExplosion() {
            // Create multiple explosion particles
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.style.position = 'fixed';
                particle.style.width = '10px';
                particle.style.height = '10px';
                particle.style.backgroundColor = Math.random() > 0.5 ? '#ff4444' : '#ffaa00';
                particle.style.borderRadius = '50%';
                particle.style.zIndex = '10000';
                particle.style.left = this.x + 'px';
                particle.style.top = this.y + 'px';
                particle.style.pointerEvents = 'none';
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 200 + Math.random() * 300;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                document.body.appendChild(particle);
                
                // Animate particle
                let particleX = this.x;
                let particleY = this.y;
                const animateParticle = () => {
                    particleX += vx * 0.016;
                    particleY += vy * 0.016;
                    
                    particle.style.left = particleX + 'px';
                    particle.style.top = particleY + 'px';
                    particle.style.opacity = parseFloat(particle.style.opacity || 1) - 0.02;
                    
                    if (parseFloat(particle.style.opacity) > 0) {
                        requestAnimationFrame(animateParticle);
                    } else {
                        particle.remove();
                    }
                };
                
                requestAnimationFrame(animateParticle);
            }
            
            // Screen shake effect
            document.body.style.animation = 'screen-shake 0.5s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 500);
        }
        
        destroy() {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            if (this.healthBar && this.healthBar.parentNode) {
                this.healthBar.parentNode.removeChild(this.healthBar);
            }
            if (this.timerElement && this.timerElement.parentNode) {
                this.timerElement.parentNode.removeChild(this.timerElement);
            }
        }
    }
    
    function createBombPin(x, y) {
        if (bombActive || gameOver || levelComplete) return; // Only one bomb at a time
        
        bombPin = new BombPin(x, y);
        bombActive = true;
        
        // Add to pins array for collision detection
        pins.push(bombPin.element);
        
        console.log('💣 BOMB PIN CREATED! 30 SECONDS TO DEFUSE!');
    }

    function checkBombCollision(bomb) {
        if (!bomb || bomb.isDestroyed) return;
        
        const bombRect = bomb.element.getBoundingClientRect();
        const flagRect = flag.getBoundingClientRect();
        
        // Check collision
        if (flagRect.left < bombRect.right &&
            flagRect.right > bombRect.left &&
            flagRect.top < bombRect.bottom &&
            flagRect.bottom > bombRect.top) {
            
            // Calculate collision physics similar to regular pins
            const flagCenterX = x + 50;
            const flagCenterY = y + 30;
            const bombCenterX = bomb.x;
            const bombCenterY = bomb.y;
            
            // Calculate current speed for damage
            const mobileSpeedMultiplier = getMobileSpeedMultiplier();
            const ripSpeedMultiplier = getRipSpeedMultiplier();
            const currentSpeed = Math.sqrt(dx * dx + dy * dy) * speedMultiplier * baseSpeedMultiplier * mobileSpeedMultiplier * ripSpeedMultiplier;
            
            // Calculate damage - bombs have special damage scaling to prevent oneshots
            let damage = 1;
            
            // Bomb pins have capped damage to ensure intensive fights
            if (currentSpeed > 300) {
                const speedAbove300 = currentSpeed - 300;
                // Much slower damage scaling for bombs - max ~50 damage per hit
                damage = 1 + Math.floor(speedAbove300 / 500); 
            }
            
            // Cap maximum damage per hit to prevent oneshots
            if (currentSpeed > 1000) {
                // Even extreme speeds are capped at reasonable damage
                damage = Math.min(damage + 10, 50); // Max 50 damage per hit
            }
            
            // Additional damage reduction for very high speeds to ensure fight longevity
            if (currentSpeed > 5000) {
                damage = Math.min(damage, 25); // Further cap for extreme speeds
                console.log(`⚡ Extreme speed detected (${currentSpeed.toFixed(1)}) - damage capped at ${damage} for bomb balance`);
            }
            
            // Apply damage to bomb
            const destroyed = bomb.takeDamage(damage);
            
            // Create damage indicator
            createDamageIndicator(bombCenterX, bombCenterY - 50, damage, currentSpeed);
            
            // Create sparks
            createSparks(bombCenterX, bombCenterY);
            
            // Physics - bounce flag off bomb (larger bounce)
            const deltaX = flagCenterX - bombCenterX;
            const deltaY = flagCenterY - bombCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 0) {
                // Normalize and apply bounce
                const normalX = deltaX / distance;
                const normalY = deltaY / distance;
                
                // Reflect velocity with more force
                const dotProduct = dx * normalX + dy * normalY;
                dx = dx - 2 * dotProduct * normalX;
                dy = dy - 2 * dotProduct * normalY;
                
                // Push flag away from bomb (distance varies with time pressure)
                const timePercent = bomb.timeLeft / 30000;
                const basePushDistance = 180;
                
                // As time runs out, bomb becomes more "aggressive" with stronger pushback
                const aggressionMultiplier = timePercent < 0.33 ? 1.5 : 1.0; // Last 10 seconds = stronger push
                const pushDistance = basePushDistance * aggressionMultiplier;
                
                x = bombCenterX + normalX * pushDistance;
                y = bombCenterY + normalY * pushDistance;
                
                if (aggressionMultiplier > 1.0) {
                    console.log(`💥 Bomb aggression activated! Stronger pushback (${(bomb.timeLeft/1000).toFixed(1)}s remaining)`);
                }
                
                // Keep flag in bounds
                x = Math.max(0, Math.min(x, window.innerWidth - 100));
                y = Math.max(0, Math.min(y, window.innerHeight - 60));
            }
        }
    }

    function showGameOverScreen() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over-screen';
        gameOverScreen.style.position = 'fixed';
        gameOverScreen.style.top = '0';
        gameOverScreen.style.left = '0';
        gameOverScreen.style.width = '100%';
        gameOverScreen.style.height = '100%';
        gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        gameOverScreen.style.display = 'flex';
        gameOverScreen.style.flexDirection = 'column';
        gameOverScreen.style.justifyContent = 'center';
        gameOverScreen.style.alignItems = 'center';
        gameOverScreen.style.zIndex = '10001';
        gameOverScreen.style.color = '#ffffff';
        gameOverScreen.style.fontFamily = 'Poppins, sans-serif';
        
        const title = document.createElement('h1');
        title.textContent = '💥 GAME OVER 💥';
        title.style.fontSize = '4em';
        title.style.color = '#ff4444';
        title.style.marginBottom = '20px';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.animation = 'game-over-pulse 1s ease-in-out infinite alternate';
        
        const message = document.createElement('p');
        message.textContent = 'The bomb exploded! Better luck next time.';
        message.style.fontSize = '1.5em';
        message.style.marginBottom = '30px';
        message.style.textAlign = 'center';
        
        const stats = document.createElement('div');
        stats.innerHTML = `
            <p>Final Score: ${score}</p>
            <p>RIP Count: ${destroyedPinsCount}</p>
            <p>You survived until the bomb challenge!</p>
        `;
        stats.style.fontSize = '1.2em';
        stats.style.textAlign = 'center';
        stats.style.marginBottom = '30px';
        
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Game';
        restartButton.style.fontSize = '1.2em';
        restartButton.style.padding = '15px 30px';
        restartButton.style.backgroundColor = '#ff4444';
        restartButton.style.color = '#ffffff';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '10px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.fontFamily = 'Poppins, sans-serif';
        restartButton.style.fontWeight = 'bold';
        
        restartButton.addEventListener('click', () => {
            location.reload();
        });
        
        gameOverScreen.appendChild(title);
        gameOverScreen.appendChild(message);
        gameOverScreen.appendChild(stats);
        gameOverScreen.appendChild(restartButton);
        
        document.body.appendChild(gameOverScreen);
    }
    
    function showLevelCompleteScreen() {
        const levelCompleteScreen = document.createElement('div');
        levelCompleteScreen.id = 'level-complete-screen';
        levelCompleteScreen.style.position = 'fixed';
        levelCompleteScreen.style.top = '0';
        levelCompleteScreen.style.left = '0';
        levelCompleteScreen.style.width = '100%';
        levelCompleteScreen.style.height = '100%';
        levelCompleteScreen.style.backgroundColor = 'rgba(0, 50, 0, 0.9)';
        levelCompleteScreen.style.display = 'flex';
        levelCompleteScreen.style.flexDirection = 'column';
        levelCompleteScreen.style.justifyContent = 'center';
        levelCompleteScreen.style.alignItems = 'center';
        levelCompleteScreen.style.zIndex = '10001';
        levelCompleteScreen.style.color = '#ffffff';
        levelCompleteScreen.style.fontFamily = 'Poppins, sans-serif';
        
        const title = document.createElement('h1');
        title.textContent = '🎉 LEVEL COMPLETE! 🎉';
        title.style.fontSize = '4em';
        title.style.color = '#44ff44';
        title.style.marginBottom = '20px';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        title.style.animation = 'level-complete-pulse 1s ease-in-out infinite alternate';
        
        const message = document.createElement('p');
        message.textContent = 'Congratulations! You successfully defused the bomb!';
        message.style.fontSize = '1.5em';
        message.style.marginBottom = '30px';
        message.style.textAlign = 'center';
        
        const stats = document.createElement('div');
        stats.innerHTML = `
            <p>Final Score: ${score}</p>
            <p>RIP Count: ${destroyedPinsCount}</p>
            <p>You mastered Level 1!</p>
        `;
        stats.style.fontSize = '1.2em';
        stats.style.textAlign = 'center';
        stats.style.marginBottom = '30px';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '20px';
        
        const continueButton = document.createElement('button');
        continueButton.textContent = 'Continue Playing';
        continueButton.style.fontSize = '1.2em';
        continueButton.style.padding = '15px 30px';
        continueButton.style.backgroundColor = '#44ff44';
        continueButton.style.color = '#000000';
        continueButton.style.border = 'none';
        continueButton.style.borderRadius = '10px';
        continueButton.style.cursor = 'pointer';
        continueButton.style.fontFamily = 'Poppins, sans-serif';
        continueButton.style.fontWeight = 'bold';
        
        const nextLevelButton = document.createElement('button');
        if (currentLevel === 1) {
            nextLevelButton.textContent = 'Advance to Level 2';
            nextLevelButton.style.backgroundColor = '#ffaa44';
            nextLevelButton.style.opacity = '1';
            nextLevelButton.disabled = false;
        } else {
            nextLevelButton.textContent = 'Next Level (Coming Soon)';
            nextLevelButton.style.backgroundColor = '#ffaa44';
            nextLevelButton.style.opacity = '0.6';
            nextLevelButton.disabled = true;
        }
        nextLevelButton.style.fontSize = '1.2em';
        nextLevelButton.style.padding = '15px 30px';
        nextLevelButton.style.color = '#000000';
        nextLevelButton.style.border = 'none';
        nextLevelButton.style.borderRadius = '10px';
        nextLevelButton.style.cursor = 'pointer';
        nextLevelButton.style.fontFamily = 'Poppins, sans-serif';
        nextLevelButton.style.fontWeight = 'bold';
        
        continueButton.addEventListener('click', () => {
            // Reset bomb state and continue playing
            gameOver = false;
            levelComplete = false;
            bombActive = false;
            bombPin = null;
            
            // Remove the screen
            levelCompleteScreen.remove();
            
            console.log('🎮 Continuing to play after level completion!');
        });
        
        nextLevelButton.addEventListener('click', () => {
            if (currentLevel === 1 && !nextLevelButton.disabled) {
                // Advance to Level 2
                switchToLevel(2);
                
                // Reset bomb state
                gameOver = false;
                levelComplete = false;
                bombActive = false;
                bombPin = null;
                
                // Remove the screen
                levelCompleteScreen.remove();
                
                console.log('🎆 Advanced to Level 2! Leather pins incoming!');
            }
        });
        
        buttonContainer.appendChild(continueButton);
        buttonContainer.appendChild(nextLevelButton);
        
        levelCompleteScreen.appendChild(title);
        levelCompleteScreen.appendChild(message);
        levelCompleteScreen.appendChild(stats);
        levelCompleteScreen.appendChild(buttonContainer);
        
        document.body.appendChild(levelCompleteScreen);
    }

    function addGreenPinDragHandlers(greenPin) {
        greenPin.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                // Right-click to remove
                e.stopPropagation();
                
                // Increment destroyed pins counter for manual removal too
                destroyedPinsCount++;
                ripNumber.textContent = destroyedPinsCount.toString();
                
                greenPin.remove();
                pins = pins.filter(p => p !== greenPin);
                return;
            }
            
            if (e.button === 0) {
                // Left-click to drag
                e.stopPropagation();
                startDragging(greenPin, e);
            }
        });
    }

    function startDragging(pin, e) {
        isDragging = true;
        draggedPin = pin;
        
        // Create dragging visual feedback
        pin.classList.add('dragging');
        
        // Set drag offset to center the pin on cursor
        dragOffsetX = 5; // Half of pin width
        dragOffsetY = 5; // Half of pin height
        
        // Position pin at cursor immediately
        pin.style.position = 'fixed';
        pin.style.left = (e.clientX - dragOffsetX) + 'px';
        pin.style.top = (e.clientY - dragOffsetY) + 'px';
        pin.style.zIndex = '10000';
        
        e.preventDefault();
    }

    // Score pin drag handler
    scorePin.addEventListener('mousedown', (e) => {
        if (!scorePin.classList.contains('correct') || e.button !== 0) return;
        
        // Create a new green pin at cursor position and start dragging it
        const newGreenPin = createDraggableGreenPin(e.clientX, e.clientY);
        startDragging(newGreenPin, e);
        
        // Decrease score by 1 (taking one pin from the stack)
        score = Math.max(0, score - 1);
        scoreNumber.textContent = score.toString();
        
        // If score reaches 0, turn pin back to black
        if (score === 0) {
            scorePin.classList.remove('correct');
        }
        
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        // Handle existing pin dragging
        if (isDragging && draggedPin) {
            draggedPin.style.left = (e.clientX - dragOffsetX) + 'px';
            draggedPin.style.top = (e.clientY - dragOffsetY) + 'px';
            return; // Don't place new pins while dragging existing ones
        }
        
        // Handle drag-to-place-pins functionality
        if (isMouseDragging) {
            // Calculate distance from last pin position
            const deltaX = e.clientX - lastPinX;
            const deltaY = e.clientY - lastPinY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Only place a new pin if we've moved far enough
            if (distance >= pinSpacing) {
                // Prevent dropping pins on UI elements
                if (e.target.closest('#game-container, #flag-click-area, #bouncing-flag')) {
                    return;
                }
                
                const pinType = getRandomPinType();
                createPinAtPosition(e.clientX, e.clientY, pinType);
                lastPinX = e.clientX;
                lastPinY = e.clientY;
            }
        }
    });

    document.addEventListener('mouseup', (e) => {
        // Handle existing pin dragging
        if (isDragging && draggedPin) {
            isDragging = false;
            draggedPin.classList.remove('dragging');
            
            // Reset z-index but keep the pin where it was dropped
            draggedPin.style.zIndex = '1000';
            
            draggedPin = null;
        }
        
        // Handle drag-to-place-pins functionality
        if (e.button === 0) {
            isMouseDragging = false;
            
            // Handle enhanced pin creation based on hold duration
            if (isHoldingForEnhancedPin && mouseHoldStartTime > 0) {
                const holdDuration = Date.now() - mouseHoldStartTime;
                
                // Remove hold timer visual
                if (holdTimerElement) {
                    holdTimerElement.remove();
                    holdTimerElement = null;
                }
                
                // Create enhanced pin if held long enough
                if (holdDuration >= 30000) { // 30 seconds for Bomb pin
                    createBombPin(lastPinX, lastPinY);
                    console.log('💣 BOMB PIN ACTIVATED! (30+ second hold)');
                } else if (holdDuration >= 10000) { // 10 seconds for Fortress pin
                    createPinAtPosition(lastPinX, lastPinY, 'fortress');
                    console.log('Created Fortress Red Pin (10+ second hold)');
                } else if (holdDuration >= 5000) { // 5 seconds for Heavy pin
                    createPinAtPosition(lastPinX, lastPinY, 'heavy');
                    console.log('Created Heavy Red Pin (5+ second hold)');
                }
                
                // Reset hold variables
                isHoldingForEnhancedPin = false;
                mouseHoldStartTime = 0;
            }
        }
    });

    requestAnimationFrame(animate);

    const swedishSentenceEl = document.getElementById('swedish-sentence');
    const finnishWordsContainerEl = document.getElementById('finnish-words-container');
    const playerGuessEl = document.getElementById('player-guess');
    const nextSentenceBtn = document.getElementById('next-sentence-btn');
    const switchLanguageBtn = document.getElementById('switch-language-btn');
    const undoBtn = document.getElementById('undo-btn');
    const finFlag = document.getElementById('fin-flag');
    const sweFlag = document.getElementById('swe-flag');
    const speedNumber = document.getElementById('speed-number');
    const warningContainer = document.getElementById('warning-container');
    const warningText = document.getElementById('warning-text');
    const resetText = document.getElementById('reset-text');
    const ripNumber = document.getElementById('rip-number');
    const shopButton = document.getElementById('shop-button');
    
    // Initialize RIP counter
    let destroyedPinsCount = 0;
    
    // Passive damage system for extreme speeds
    let lastPassiveDamageTime = 0;
    
    // Debug key sequence tracking
    let keySequence = '';
    
    // Flag mode toggle
    let isFlagMode = false;
    
    // Boss pin system
    let bossPins = [];
    let lastBossSpawnRIP = 0;
    let activeBossPin = null;
    
    // Bomb pin system
    let bombPin = null;
    let bombTimer = 0;
    let bombActive = false;
    let gameOver = false;
    let levelComplete = false;
    
    // Level system
    let currentLevel = 1;
    let levelTitle = document.querySelector('h1');
    
    // Shop system
    let shopOpen = false;
    let playerUpgrades = {
        blades: false,
        plasmaEdge: false,
        magneticField: false
    };
    
    // Slowdown system
    let slowdownActive = false;
    let slowdownEndTime = 0;
    let lastSlowdownTime = 0;
    const SLOWDOWN_COOLDOWN = 3000; // 3 seconds
    const SLOWDOWN_DURATION = 3000; // 3 seconds
    
    // Master Green Pin Damage Line System
    let masterGreenPin = null;
    let masterPinPower = 0; // Accumulated power from merges
    let damageLineElement = null;
    
    // Level System Functions
    function updateLevelTitle() {
        if (currentLevel === 1) {
            levelTitle.textContent = 'Översättningsspel.';
        } else {
            levelTitle.textContent = `Översättningsspel. ${currentLevel}`;
        }
    }
    
    function switchToLevel(level) {
        currentLevel = level;
        updateLevelTitle();
        console.log(`🎯 Switched to Level ${level}`);
    }
    
    function getRandomPinType() {
        if (currentLevel === 1) {
            return 'regular';
        } else if (currentLevel === 2) {
            // Level 2: Mostly leather pins with some regular red pins
            return Math.random() < 0.8 ? 'leather' : 'regular';
        }
        return 'regular';
    }
    
    // Shop System Functions
    function openShop() {
        if (shopOpen) return;
        shopOpen = true;
        
        const shopModal = document.createElement('div');
        shopModal.classList.add('shop-modal');
        shopModal.id = 'shop-modal';
        
        const shopContent = document.createElement('div');
        shopContent.classList.add('shop-content');
        
        shopContent.innerHTML = `
            <div class="shop-title">🛒 Flag Upgrades Shop</div>
            <div class="shop-currency">💰 RIP Points: ${destroyedPinsCount}</div>
            
            <div class="shop-item ${playerUpgrades.blades ? 'owned' : (destroyedPinsCount >= 5000 ? '' : 'unaffordable')}" data-upgrade="blades">
                <div class="shop-item-name">⚔️ Blades</div>
                <div class="shop-item-description">10x damage to all pins, reduces leather slowdown to 5%</div>
                <div class="shop-item-price">${playerUpgrades.blades ? 'OWNED' : '5,000 RIP'}</div>
                ${!playerUpgrades.blades ? `<button class="shop-buy-button" ${destroyedPinsCount >= 5000 ? '' : 'disabled'}>Buy</button>` : ''}
            </div>
            
            <div class="shop-item ${playerUpgrades.plasmaEdge ? 'owned' : (destroyedPinsCount >= 50000 ? '' : 'unaffordable')}" data-upgrade="plasmaEdge">
                <div class="shop-item-name">⚡ Plasma Edge</div>
                <div class="shop-item-description">100x damage to all pins (requires Blades)</div>
                <div class="shop-item-price">${playerUpgrades.plasmaEdge ? 'OWNED' : '50,000 RIP'}</div>
                ${!playerUpgrades.plasmaEdge && playerUpgrades.blades ? `<button class="shop-buy-button" ${destroyedPinsCount >= 50000 ? '' : 'disabled'}>Buy</button>` : ''}
                ${!playerUpgrades.blades && !playerUpgrades.plasmaEdge ? '<div style="color: #999; font-size: 0.8em;">Requires Blades</div>' : ''}
            </div>
            
            <div class="shop-item ${playerUpgrades.magneticField ? 'owned' : (destroyedPinsCount >= 10000 ? '' : 'unaffordable')}" data-upgrade="magneticField">
                <div class="shop-item-name">🧲 Magnetic Field</div>
                <div class="shop-item-description">Continuously pulls green pins towards flag at speed 5</div>
                <div class="shop-item-price">${playerUpgrades.magneticField ? 'OWNED' : '10,000 RIP'}</div>
                ${!playerUpgrades.magneticField ? `<button class="shop-buy-button" ${destroyedPinsCount >= 10000 ? '' : 'disabled'}>Buy</button>` : ''}
            </div>
            
            <button class="shop-close">Close Shop</button>
        `;
        
        shopModal.appendChild(shopContent);
        document.body.appendChild(shopModal);
        
        // Add event listeners
        shopModal.querySelector('.shop-close').addEventListener('click', closeShop);
        
        shopModal.querySelectorAll('.shop-buy-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const upgradeType = e.target.closest('.shop-item').dataset.upgrade;
                buyUpgrade(upgradeType);
            });
        });
        
        // Close on background click
        shopModal.addEventListener('click', (e) => {
            if (e.target === shopModal) {
                closeShop();
            }
        });
    }
    
    function closeShop() {
        if (!shopOpen) return;
        shopOpen = false;
        
        const shopModal = document.getElementById('shop-modal');
        if (shopModal) {
            shopModal.remove();
        }
    }
    
    function buyUpgrade(upgradeType) {
        const prices = {
            blades: 5000,
            plasmaEdge: 50000,
            magneticField: 10000
        };
        
        const price = prices[upgradeType];
        
        if (playerUpgrades[upgradeType]) {
            console.log(`Already own ${upgradeType}`);
            return;
        }
        
        if (upgradeType === 'plasmaEdge' && !playerUpgrades.blades) {
            console.log('Need Blades before buying Plasma Edge');
            return;
        }
        
        if (destroyedPinsCount >= price) {
            destroyedPinsCount -= price;
            playerUpgrades[upgradeType] = true;
            ripNumber.textContent = destroyedPinsCount.toString();
            
            console.log(`🛒 Purchased ${upgradeType} for ${price} RIP!`);
            
            // Close and reopen shop to update display
            closeShop();
            setTimeout(() => openShop(), 100);
        } else {
            console.log(`Not enough RIP for ${upgradeType}. Need ${price}, have ${destroyedPinsCount}`);
        }
    }
    
    // Slowdown System Functions
    function applySlowdownEffect() {
        const currentTime = Date.now();
        
        // Check cooldown
        if (currentTime - lastSlowdownTime < SLOWDOWN_COOLDOWN) {
            return false; // Still on cooldown
        }
        
        // Apply slowdown based on upgrades
        let slowdownAmount = 0.2; // 20% slowdown
        if (playerUpgrades.blades) {
            slowdownAmount = 0.05; // 5% slowdown with blades
        }
        
        slowdownActive = true;
        slowdownEndTime = currentTime + SLOWDOWN_DURATION;
        lastSlowdownTime = currentTime;
        
        // Apply the slowdown by reducing speed multipliers temporarily
        const originalSpeedMultiplier = speedMultiplier;
        const originalBaseSpeedMultiplier = baseSpeedMultiplier;
        
        speedMultiplier *= (1 - slowdownAmount);
        baseSpeedMultiplier *= (1 - slowdownAmount);
        
        console.log(`🐌 Slowdown applied: ${(slowdownAmount * 100).toFixed(0)}% for ${SLOWDOWN_DURATION/1000}s`);
        
        // Remove slowdown after duration
        setTimeout(() => {
            if (slowdownActive && Date.now() >= slowdownEndTime) {
                speedMultiplier = originalSpeedMultiplier;
                baseSpeedMultiplier = originalBaseSpeedMultiplier;
                slowdownActive = false;
                console.log('🏃 Slowdown effect ended');
            }
        }, SLOWDOWN_DURATION);
        
        return true; // Slowdown was applied
    }
    
    // Green Pin Merging System
    function checkGreenPinMerging() {
        const greenPins = pins.filter(pin => pin.classList.contains('green-pin'));
        const mergedPins = new Set();
        
        for (let i = 0; i < greenPins.length; i++) {
            if (mergedPins.has(greenPins[i])) continue;
            
            const pin1 = greenPins[i];
            const pin1Left = parseFloat(pin1.style.left) || 0;
            const pin1Top = parseFloat(pin1.style.top) || 0;
            const pin1Size = parseFloat(pin1.style.width) || 10;
            const pin1CenterX = pin1Left + pin1Size / 2;
            const pin1CenterY = pin1Top + pin1Size / 2;
            
            for (let j = i + 1; j < greenPins.length; j++) {
                if (mergedPins.has(greenPins[j])) continue;
                
                const pin2 = greenPins[j];
                const pin2Left = parseFloat(pin2.style.left) || 0;
                const pin2Top = parseFloat(pin2.style.top) || 0;
                const pin2Size = parseFloat(pin2.style.width) || 10;
                const pin2CenterX = pin2Left + pin2Size / 2;
                const pin2CenterY = pin2Top + pin2Size / 2;
                
                // Check if pins are close enough to merge (within 15px)
                const distance = Math.sqrt(
                    Math.pow(pin1CenterX - pin2CenterX, 2) + 
                    Math.pow(pin1CenterY - pin2CenterY, 2)
                );
                
                if (distance < 15) {
                    // Merge the pins
                    mergeGreenPins(pin1, pin2);
                    mergedPins.add(pin1);
                    mergedPins.add(pin2);
                    break; // Only merge one pair per frame to avoid complexity
                }
            }
        }
    }
    
    function mergeGreenPins(pin1, pin2) {
        // Get current sizes and boost values
        const pin1Size = parseFloat(pin1.style.width) || 10;
        const pin2Size = parseFloat(pin2.style.width) || 10;
        const pin1Boost = pin1.speedBoostMultiplier || 200;
        const pin2Boost = pin2.speedBoostMultiplier || 200;
        const pin1Power = pin1.masterPower || 1; // Default to 1 for regular green pins
        const pin2Power = pin2.masterPower || 1;
        
        // Calculate new size (5% larger than the larger pin, capped at 20px like mini-bosses)
        const uncappedSize = Math.max(pin1Size, pin2Size) * 1.05;
        const newSize = Math.min(uncappedSize, 20); // Cap at 20px to prevent gameplay interference
        
        // Calculate combined boost (average of both, but with bonus for merging)
        const combinedBoost = Math.min(500, (pin1Boost + pin2Boost) * 0.6); // Cap at 500, 60% of sum to prevent exponential growth
        
        // Calculate combined power (sum of both pins' power)
        const combinedPower = pin1Power + pin2Power;
        
        // Get current CSS positions and calculate centers
        const pin1Left = parseFloat(pin1.style.left) || 0;
        const pin1Top = parseFloat(pin1.style.top) || 0;
        const pin2Left = parseFloat(pin2.style.left) || 0;
        const pin2Top = parseFloat(pin2.style.top) || 0;
        
        // Calculate center positions
        const pin1CenterX = pin1Left + pin1Size / 2;
        const pin1CenterY = pin1Top + pin1Size / 2;
        const pin2CenterX = pin2Left + pin2Size / 2;
        const pin2CenterY = pin2Top + pin2Size / 2;
        
        // Position the merged pin at the center midpoint
        const midCenterX = (pin1CenterX + pin2CenterX) / 2;
        const midCenterY = (pin1CenterY + pin2CenterY) / 2;
        
        // Update pin1 with merged properties (convert center back to top-left)
        pin1.style.width = newSize + 'px';
        pin1.style.height = newSize + 'px';
        pin1.style.left = (midCenterX - newSize / 2) + 'px';
        pin1.style.top = (midCenterY - newSize / 2) + 'px';
        pin1.speedBoostMultiplier = combinedBoost;
        pin1.masterPower = combinedPower;
        
        // Set as master pin if this is the first merge or if it's more powerful
        if (!masterGreenPin || combinedPower > masterPinPower) {
            masterGreenPin = pin1;
            masterPinPower = combinedPower;
            console.log(`🎆 New master green pin! Power: ${combinedPower}`);
        }
        
        // Add visual effect for merged pin (enhanced for master)
        const isMaster = pin1 === masterGreenPin;
        const glowIntensity = Math.min(25, newSize + (isMaster ? 10 : 0));
        pin1.style.boxShadow = `0 0 ${glowIntensity}px #00ff00, 0 0 ${glowIntensity * 2}px rgba(0, 255, 0, ${isMaster ? 0.5 : 0.3})`;
        
        // Add master pin indicator
        if (isMaster) {
            pin1.style.border = '2px solid #ffff00'; // Golden border for master
        }
        
        // Remove pin2
        pin2.remove();
        pins = pins.filter(p => p !== pin2);
        
        const sizeCapped = uncappedSize > 20;
        console.log(`🔗 Green pins merged! Size: ${newSize.toFixed(1)}px${sizeCapped ? ' (CAPPED)' : ''}, Boost: ${combinedBoost}x, Power: ${combinedPower}`);
        
        // Update damage line if magnetic field is active
        updateDamageLine();
    }
    
    // Magnetic Field System
    function updateMagneticField() {
        if (!playerUpgrades.magneticField) return;
        
        const flagCenterX = x + 50;
        const flagCenterY = y + 30;
        const magneticSpeed = 5;
        
        pins.forEach(pin => {
            if (!pin.classList.contains('green-pin')) return;
            
            // Use CSS positions consistently
            const pinLeft = parseFloat(pin.style.left) || 0;
            const pinTop = parseFloat(pin.style.top) || 0;
            const pinSize = parseFloat(pin.style.width) || 10;
            const pinCenterX = pinLeft + pinSize / 2;
            const pinCenterY = pinTop + pinSize / 2;
            
            // Calculate direction to flag
            const deltaX = flagCenterX - pinCenterX;
            const deltaY = flagCenterY - pinCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 10) { // Don't pull if too close
                const normalX = deltaX / distance;
                const normalY = deltaY / distance;
                
                // Calculate new center position
                let newCenterX = pinCenterX + (normalX * magneticSpeed);
                let newCenterY = pinCenterY + (normalY * magneticSpeed);
                
                // Keep pins on screen (account for pin size)
                newCenterX = Math.max(pinSize / 2, Math.min(newCenterX, window.innerWidth - pinSize / 2));
                newCenterY = Math.max(pinSize / 2, Math.min(newCenterY, window.innerHeight - pinSize / 2));
                
                // Update pin position (convert center back to top-left)
                pin.style.left = (newCenterX - pinSize / 2) + 'px';
                pin.style.top = (newCenterY - pinSize / 2) + 'px';
            }
        });
        
        // Check for green pin merging after magnetic field update
        checkGreenPinMerging();
        
        // Update damage line
        updateDamageLine();
    }
    
    // Damage Line System
    function updateDamageLine() {
        // Only show damage line if magnetic field is active and we have a master pin
        if (!playerUpgrades.magneticField || !masterGreenPin || !pins.includes(masterGreenPin)) {
            removeDamageLine();
            return;
        }
        
        // Get master pin position
        const masterLeft = parseFloat(masterGreenPin.style.left) || 0;
        const masterTop = parseFloat(masterGreenPin.style.top) || 0;
        const masterSize = parseFloat(masterGreenPin.style.width) || 10;
        const masterCenterX = masterLeft + masterSize / 2;
        const masterCenterY = masterTop + masterSize / 2;
        
        // Get flag position
        const flagCenterX = x + 50;
        const flagCenterY = y + 30;
        
        // Calculate line properties
        const deltaX = flagCenterX - masterCenterX;
        const deltaY = flagCenterY - masterCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // Calculate line thickness based on master pin power
        // Power 2 = very thin (1px), Power 40+ = thick (8px)
        const basePower = Math.max(2, masterPinPower);
        const thickness = Math.min(8, Math.max(1, Math.floor(basePower / 5)));
        
        // Create or update damage line element
        if (!damageLineElement) {
            damageLineElement = document.createElement('div');
            damageLineElement.id = 'damage-line';
            damageLineElement.style.position = 'fixed';
            damageLineElement.style.transformOrigin = '0 50%';
            damageLineElement.style.pointerEvents = 'none';
            damageLineElement.style.zIndex = '999';
            document.body.appendChild(damageLineElement);
        }
        
        // Update line properties
        damageLineElement.style.left = masterCenterX + 'px';
        damageLineElement.style.top = (masterCenterY - thickness / 2) + 'px';
        damageLineElement.style.width = distance + 'px';
        damageLineElement.style.height = thickness + 'px';
        damageLineElement.style.transform = `rotate(${angle}deg)`;
        
        // Visual styling based on power
        const opacity = Math.min(0.8, 0.3 + (basePower / 50));
        const glowSize = Math.min(10, thickness * 2);
        damageLineElement.style.background = `linear-gradient(90deg, 
            rgba(0, 255, 0, ${opacity}) 0%, 
            rgba(255, 255, 0, ${opacity * 0.8}) 50%, 
            rgba(0, 255, 0, ${opacity}) 100%)`;
        damageLineElement.style.boxShadow = `0 0 ${glowSize}px rgba(0, 255, 0, 0.6)`;
        damageLineElement.style.borderRadius = thickness / 2 + 'px';
        
        // Check for line collisions with destroyable pins
        checkLineCollisions(masterCenterX, masterCenterY, flagCenterX, flagCenterY, thickness);
    }
    
    function removeDamageLine() {
        if (damageLineElement) {
            damageLineElement.remove();
            damageLineElement = null;
        }
    }
    
    function checkLineCollisions(x1, y1, x2, y2, lineThickness) {
        const lineDamage = Math.max(1, Math.floor(masterPinPower / 2)); // Damage scales with power
        
        pins.forEach(pin => {
            // Skip green pins, boss pins, and already destroyed pins
            if (pin.classList.contains('green-pin') || 
                pin.classList.contains('boss-pin') || 
                pin.classList.contains('bomb-pin') || 
                pin.classList.contains('mini-boss') || 
                pin.collisionCount >= (pin.maxCollisions || 10)) {
                return;
            }
            
            // Get pin position
            const pinLeft = parseFloat(pin.style.left) || 0;
            const pinTop = parseFloat(pin.style.top) || 0;
            const pinSize = parseFloat(pin.style.width) || 10;
            const pinCenterX = pinLeft + pinSize / 2;
            const pinCenterY = pinTop + pinSize / 2;
            
            // Check if pin intersects with line using point-to-line distance
            const distance = pointToLineDistance(pinCenterX, pinCenterY, x1, y1, x2, y2);
            const collisionThreshold = (pinSize / 2) + (lineThickness / 2);
            
            if (distance <= collisionThreshold) {
                // Apply damage
                pin.collisionCount = (pin.collisionCount || 0) + lineDamage;
                
                // Create damage indicator
                createDamageIndicator(pinCenterX, pinCenterY - 15, lineDamage, 0, true);
                
                // Update health bar
                if (pin.healthBar) {
                    updateHealthBar(pin);
                }
                
                // Check if pin should be destroyed
                const maxCollisions = pin.maxCollisions || 10;
                if (pin.collisionCount >= maxCollisions) {
                    // Award RIP points
                    const ripReward = pin.classList.contains('leather-pin') ? 10 : 1;
                    destroyedPinsCount += ripReward;
                    ripNumber.textContent = destroyedPinsCount.toString();
                    
                    // Remove pin
                    if (pin.healthBar) {
                        pin.healthBar.remove();
                    }
                    pin.remove();
                    pins = pins.filter(p => p !== pin);
                    
                    console.log(`⚡ Damage line destroyed pin! Power: ${masterPinPower}, Damage: ${lineDamage}`);
                }
            }
        });
    }
    
    // Helper function to calculate distance from point to line
    function pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Function to generate weighted random speed for flag reset
    function getRandomFlagSpeed() {
        const random = Math.random();
        
        // 1% chance for extreme speed of 100
        if (random < 0.01) {
            console.log('🚀 EXTREME SPEED: 100!');
            return 100;
        }
        
        // 5% chance for max speed (2.0) - from the remaining 99%
        if (random < 0.06) { // 0.01 to 0.06 = 5% of total
            console.log('⚡ High speed: 2.0');
            return 2.0;
        }
        
        // Remaining 94% get weighted distribution from 0.7 to 1.9
        // Map the remaining range (0.06 to 1.0) to our speed range
        const normalizedRandom = (random - 0.06) / 0.94; // Normalize to 0-1
        
        // Use inverse power to make higher speeds more common than my previous version
        const weightedRandom = Math.pow(normalizedRandom, 0.7); // Less aggressive weighting
        const speed = 0.7 + (weightedRandom * 1.2); // 0.7 to 1.9 range
        
        // Ensure speed is never below 0.7
        const finalSpeed = Math.max(0.7, Math.min(1.9, speed));
        
        console.log(`🎯 Normal speed: ${finalSpeed.toFixed(1)} (raw: ${speed.toFixed(2)})`);
        return parseFloat(finalSpeed.toFixed(1));
    }
    
    // Function to calculate RIP-based speed multiplier
    function getRipSpeedMultiplier() {
        // Every 1000 RIP points doubles the speed
        const ripLevel = Math.floor(destroyedPinsCount / 1000);
        const ripMultiplier = Math.pow(2, ripLevel);
        
        // Log when reaching new RIP speed levels
        if (ripLevel > 0 && destroyedPinsCount % 1000 === 0) {
            console.log(`🔥 RIP SPEED BOOST! Level ${ripLevel}: ${ripMultiplier}x speed multiplier!`);
        }
        
        return ripMultiplier;
    }
    
    // Boss Pin Classes and Functions
    class BossPin {
        constructor(type, x, y, targetX, targetY) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.targetX = targetX;
            this.targetY = targetY;
            this.element = null;
            this.healthBar = null;
            this.healthFill = null;
            this.collisionCount = 0;
            this.isDestroyed = false;
            this.createdAt = Date.now();
            
            // Debug logging for boss creation
            console.log(`🎯 Creating ${type.toUpperCase()} boss at (${x.toFixed(1)}, ${y.toFixed(1)}) targeting (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`);
            
            // Type-specific properties
            this.setupTypeProperties();
            this.createElement();
            this.createHealthBar();
        }
        
        setupTypeProperties() {
            switch(this.type) {
                case 'purple':
                    this.maxCollisions = 75;
                    this.speed = 1;
                    this.color = '#8844ff';
                    this.reward = 1; // green pins
                    break;
                case 'orange':
                    this.maxCollisions = 75;
                    this.speed = 0.8;
                    this.color = '#ff8844';
                    this.reward = 4; // splits into mini-bosses
                    break;
                case 'red':
                    this.maxCollisions = 100;
                    this.speed = 0.6;
                    this.color = '#ff4444';
                    this.reward = 3;
                    this.rageMultiplier = 1;
                    break;
                case 'black':
                    this.maxCollisions = 80;
                    this.speed = 0.5;
                    this.color = '#444444';
                    this.reward = 1; // special anti-gravity pin
                    this.gravityRadius = 150;
                    break;
            }
        }
        
        createElement() {
            this.element = document.createElement('div');
            this.element.classList.add('pin', 'boss-pin', `${this.type}-boss`);
            this.element.style.position = 'fixed';
            this.element.style.width = '50px';
            this.element.style.height = '50px';
            this.element.style.backgroundColor = this.color;
            this.element.style.border = '4px solid #fff';
            this.element.style.borderRadius = '50%';
            this.element.style.boxShadow = `0 0 20px ${this.color}`;
            this.element.style.zIndex = '1002';
            this.element.style.left = (this.x - 25) + 'px';
            this.element.style.top = (this.y - 25) + 'px';
            
            // Store reference to boss instance
            this.element.bossPin = this;
            
            document.body.appendChild(this.element);
        }
        
        createHealthBar() {
            this.healthBar = document.createElement('div');
            this.healthBar.classList.add('boss-health-bar');
            this.healthBar.style.position = 'fixed';
            this.healthBar.style.width = '60px';
            this.healthBar.style.height = '8px';
            this.healthBar.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            this.healthBar.style.border = '2px solid rgba(255, 255, 255, 0.7)';
            this.healthBar.style.borderRadius = '4px';
            this.healthBar.style.zIndex = '1003';
            
            this.healthFill = document.createElement('div');
            this.healthFill.style.width = '100%';
            this.healthFill.style.height = '100%';
            this.healthFill.style.backgroundColor = '#44ff44';
            this.healthFill.style.borderRadius = '2px';
            this.healthFill.style.transition = 'width 0.3s ease, background-color 0.3s ease';
            
            this.healthBar.appendChild(this.healthFill);
            document.body.appendChild(this.healthBar);
            
            this.updateHealthBar();
        }
        
        updateHealthBar() {
            if (!this.healthBar || !this.healthFill) return;
            
            const healthPercent = Math.max(0, (this.maxCollisions - this.collisionCount) / this.maxCollisions);
            this.healthFill.style.width = (healthPercent * 100) + '%';
            
            // Position above boss pin
            this.healthBar.style.left = (this.x - 30) + 'px';
            this.healthBar.style.top = (this.y - 45) + 'px';
            
            // Change color based on health
            if (healthPercent > 0.6) {
                this.healthFill.style.backgroundColor = '#44ff44';
            } else if (healthPercent > 0.3) {
                this.healthFill.style.backgroundColor = '#ffaa44';
            } else {
                this.healthFill.style.backgroundColor = '#ff4444';
            }
        }
        
        update() {
            if (this.isDestroyed) return;
            
            // Debug: Periodic health check (every 5 seconds)
            const now = Date.now();
            if (!this.lastHealthLog || now - this.lastHealthLog > 5000) {
                this.lastHealthLog = now;
                console.log(`❤️ ${this.type.toUpperCase()} boss health: ${this.collisionCount}/${this.maxCollisions} at (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
            }
            
            // Update position based on type
            this.updateMovement();
            
            // Red boss destroys player pins it touches
            if (this.type === 'red') {
                this.checkPinDestruction();
            }
            
            // Update visual position
            this.element.style.left = (this.x - 25) + 'px';
            this.element.style.top = (this.y - 25) + 'px';
            
            // Update health bar
            this.updateHealthBar();
            
            // Check if boss should be removed (completely off screen with generous buffer)
            // Boss is 50px wide, so use 75px buffer to ensure it's completely gone
            const screenBounds = {
                left: -75,
                right: window.innerWidth + 75,
                top: -75,
                bottom: window.innerHeight + 75
            };
            
            if (this.x < screenBounds.left || this.x > screenBounds.right || 
                this.y < screenBounds.top || this.y > screenBounds.bottom) {
                console.log(`🏃 ${this.type.toUpperCase()} boss escaped! Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) Screen bounds: ${screenBounds.left} to ${screenBounds.right}, ${screenBounds.top} to ${screenBounds.bottom}`);
                this.destroy(false); // Don't give reward for escaping
            }
        }
        
        checkPinDestruction() {
            // Only red bosses destroy pins
            if (this.type !== 'red') return;
            
            pins.forEach(pin => {
                if (pin.classList.contains('green-pin')) return; // Don't destroy green pins
                
                const pinRect = pin.getBoundingClientRect();
                const bossRect = this.element.getBoundingClientRect();
                
                // Check collision with pin
                if (bossRect.left < pinRect.right &&
                    bossRect.right > pinRect.left &&
                    bossRect.top < pinRect.bottom &&
                    bossRect.bottom > pinRect.top) {
                    
                    // Destroy the pin
                    destroyedPinsCount++;
                    ripNumber.textContent = destroyedPinsCount.toString();
                    
                    // Remove health bar if it exists
                    if (pin.healthBar) {
                        pin.healthBar.remove();
                    }
                    
                    // Create destruction sparks
                    const pinCenterX = pinRect.left + pinRect.width / 2;
                    const pinCenterY = pinRect.top + pinRect.height / 2;
                    createSparks(pinCenterX, pinCenterY);
                    
                    pin.remove();
                    pins = pins.filter(p => p !== pin);
                    
                    console.log('🔥 Red boss destroyed a player pin!');
                }
            });
        }
        
        updateMovement() {
            // Calculate direction to target
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                // Normalize direction and apply speed
                let currentSpeed = this.speed;
                
                // Red boss gets faster as it takes damage (rage mechanic)
                if (this.type === 'red') {
                    const damagePercent = this.collisionCount / this.maxCollisions;
                    this.rageMultiplier = 1 + (damagePercent * 2); // Up to 3x speed when near death
                    currentSpeed *= this.rageMultiplier;
                }
                
                this.x += (dx / distance) * currentSpeed;
                this.y += (dy / distance) * currentSpeed;
            }
        }
        
        takeDamage(damage) {
            this.collisionCount += damage;
            this.updateHealthBar();
            
            if (this.collisionCount >= this.maxCollisions) {
                this.destroy(true); // Give reward
                return true; // Boss destroyed
            }
            return false; // Boss still alive
        }
        
        destroy(giveReward = true) {
            if (this.isDestroyed) return;
            
            this.isDestroyed = true;
            
            // Debug logging to track boss destruction
            const reason = giveReward ? 'DEFEATED' : 'ESCAPED';
            console.log(`💀 ${this.type.toUpperCase()} BOSS ${reason}! Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) Health: ${this.collisionCount}/${this.maxCollisions}`);
            console.trace('Boss destruction stack trace:');
            
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
            bossPins = bossPins.filter(boss => boss !== this);
            if (activeBossPin === this) {
                activeBossPin = null;
            }
        }
        
        giveReward() {
            switch(this.type) {
                case 'purple':
                    // Drop 1 green pin
                    createDraggableGreenPin(this.x, this.y);
                    break;
                case 'orange':
                    // Split into mini-bosses (implement later)
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
                bossPins.push(miniBoss);
            }
        }
    }
    
    class MiniBoss extends BossPin {
        constructor(x, y) {
            // Random target for erratic movement
            const targetX = Math.random() * window.innerWidth;
            const targetY = Math.random() * window.innerHeight;
            
            super('mini', x, y, targetX, targetY);
        }
        
        setupTypeProperties() {
            this.maxCollisions = 25;
            this.speed = 2; // Faster than regular bosses
            this.color = '#ff6622';
            this.reward = 1;
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
            // Mini-boss is 20px wide, so use 30px buffer to ensure it's completely gone
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
    
    function spawnBossPin() {
        // Don't spawn if there's already an active boss
        if (activeBossPin && !activeBossPin.isDestroyed) return;
        
        // Check if we should spawn based on RIP count
        const ripsSinceLastBoss = destroyedPinsCount - lastBossSpawnRIP;
        if (ripsSinceLastBoss < 2000) return; // Need 2000 RIP between bosses
        
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
        bossPins.push(boss);
        activeBossPin = boss;
        lastBossSpawnRIP = destroyedPinsCount;
        
        console.log(`👹 ${bossType.toUpperCase()} BOSS SPAWNED! RIP: ${destroyedPinsCount}`);
    }
    
    function updateBossPins() {
        bossPins.forEach(boss => {
            if (!boss.isDestroyed) {
                boss.update();
            }
        });
        
        // Clean up destroyed bosses
        bossPins = bossPins.filter(boss => !boss.isDestroyed);
    }
    
    function checkBossCollision(boss) {
        if (!boss || boss.isDestroyed) return;
        
        const bossRect = boss.element.getBoundingClientRect();
        const flagRect = flag.getBoundingClientRect();
        
        // Check collision
        if (flagRect.left < bossRect.right &&
            flagRect.right > bossRect.left &&
            flagRect.top < bossRect.bottom &&
            flagRect.bottom > bossRect.top) {
            
            // Calculate collision physics similar to regular pins
            const flagCenterX = x + 50;
            const flagCenterY = y + 30;
            const bossCenterX = boss.x;
            const bossCenterY = boss.y;
            
            // Calculate current speed for damage
            const mobileSpeedMultiplier = getMobileSpeedMultiplier();
            const ripSpeedMultiplier = getRipSpeedMultiplier();
            const currentSpeed = Math.sqrt(dx * dx + dy * dy) * speedMultiplier * baseSpeedMultiplier * mobileSpeedMultiplier * ripSpeedMultiplier;
            
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
            
            // Physics - bounce flag off boss
            const deltaX = flagCenterX - bossCenterX;
            const deltaY = flagCenterY - bossCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 0) {
                // Normalize and apply bounce
                const normalX = deltaX / distance;
                const normalY = deltaY / distance;
                
                // Reflect velocity
                const dotProduct = dx * normalX + dy * normalY;
                dx = dx - 2 * dotProduct * normalX;
                dy = dy - 2 * dotProduct * normalY;
                
                // Push flag away from boss
                const pushDistance = 60; // Larger push for bosses
                x = bossCenterX + normalX * pushDistance;
                y = bossCenterY + normalY * pushDistance;
                
                // Keep flag in bounds
                x = Math.max(0, Math.min(x, window.innerWidth - 100));
                y = Math.max(0, Math.min(y, window.innerHeight - 60));
            }
            
            if (destroyed) {
                // Increment RIP counter for boss destruction
                destroyedPinsCount += 10; // Bosses are worth more RIP
                ripNumber.textContent = destroyedPinsCount.toString();
            }
        }
    }
    
    // Function to apply passive damage to pins when speed > 1000
    function applyPassiveDamage(currentSpeed) {
        if (currentSpeed <= 1000) return;
        
        const currentTime = Date.now();
        
        // Apply damage every 2000ms (2 seconds) to reduce lag
        if (currentTime - lastPassiveDamageTime >= 2000) {
            lastPassiveDamageTime = currentTime;
            
            const regularPins = pins.filter(pin => !pin.classList.contains('green-pin'));
            
            // Limit visual effects - only show sparks on a few random pins
            const maxSparks = Math.min(3, regularPins.length);
            const sparkPins = regularPins.slice(0, maxSparks);
            
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
                    destroyedPinsCount++;
                    ripNumber.textContent = destroyedPinsCount.toString();
                    
                    // Remove pin
                    pin.remove();
                    pins = pins.filter(p => p !== pin);
                }
            });
            
            if (regularPins.length > 0) {
                console.log(`⚡ Speed aura damage! Speed: ${currentSpeed.toFixed(1)} - Damaged ${regularPins.length} pins (${maxSparks} with sparks)`);
            }
        }
    }
    
    // Title click handler for flag mode toggle
    const title = document.querySelector('h1');
    title.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        e.preventDefault(); // Prevent any default behavior
        
        isFlagMode = !isFlagMode;
        
        if (isFlagMode) {
            document.body.classList.add('flag-mode');
            console.log('Switched to flag game mode');
        } else {
            document.body.classList.remove('flag-mode');
            console.log('Switched to word learning mode');
        }
    });
    
    // Also add mousedown handler for better responsiveness
    title.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent pin dropping when clicking title
    });

    // Initialize button state
    nextSentenceBtn.classList.add('btn-hidden');

    let sentences = [];
    let currentSentenceIndex = 0;
    let playerGuess = [];
    let selectedWordElements = [];
    let translationMode = 'fin-swe'; // 'swe-fin' or 'fin-swe'

    // Fetch sentences from the text file
    fetch('sentences.txt')
        .then(response => response.text())
        .then(text => {
            sentences = text.trim().split('\n').map(line => {
                const [swedish, finnish] = line.split(' | ');
                return { swedish, finnish };
            });
            startGame();
        });

    function startGame() {
        shuffleArray(sentences);
        currentSentenceIndex = 0;
        updateFlagDisplay();
        loadSentence();
    }

    function loadSentence() {
        playerGuess = [];
        selectedWordElements = [];
        updatePlayerGuessDisplay();
        finnishWordsContainerEl.innerHTML = '';

        if (currentSentenceIndex >= sentences.length) {
            shuffleArray(sentences); // Re-shuffle for a new round
            currentSentenceIndex = 0; // Loop back to the start
        }

        const { swedish, finnish } = sentences[currentSentenceIndex];
        
        let sourceSentence, targetWords, targetSentence;

        if (translationMode === 'swe-fin') {
            sourceSentence = swedish;
            targetWords = finnish.split(' ');
            targetSentence = finnish;
        } else {
            sourceSentence = finnish;
            targetWords = swedish.split(' ');
            targetSentence = swedish;
        }

        swedishSentenceEl.textContent = sourceSentence;

        shuffleArray(targetWords).forEach(word => {
            const wordEl = document.createElement('div');
            wordEl.textContent = word;
            wordEl.classList.add('finnish-word');
            wordEl.addEventListener('click', () => selectWord(word, wordEl));
            finnishWordsContainerEl.appendChild(wordEl);
        });

        nextSentenceBtn.classList.add('btn-hidden');
        finnishWordsContainerEl.style.pointerEvents = 'auto'; // Ensure words are clickable
    }

    function selectWord(word, wordEl) {
        playerGuess.push(word);
        selectedWordElements.push(wordEl);
        wordEl.style.visibility = 'hidden'; // Hide the word after selection
        updatePlayerGuessDisplay();
        checkGuess();
    }

    function updatePlayerGuessDisplay() {
        playerGuessEl.textContent = playerGuess.join(' ');
    }

    function checkGuess() {
        const { swedish, finnish } = sentences[currentSentenceIndex];
        const correctSentence = translationMode === 'swe-fin' ? finnish : swedish;

        if (playerGuess.join(' ') === correctSentence) {
            playerGuessEl.style.color = '#4ade80'; // A nice green color
            nextSentenceBtn.classList.remove('btn-hidden');
            // Prevent further word selection after correct answer
            finnishWordsContainerEl.style.pointerEvents = 'none';
            // Increase base speed by 5% for each correct answer
            baseSpeedMultiplier *= 1.05;
            // Update score and pin
            score++;
            scoreNumber.textContent = score.toString();
            scorePin.classList.add('correct');
        } else {
            const correctWords = correctSentence.split(' ');
            // If the player's guess is the same length as the correct answer, it must be wrong.
            if (playerGuess.length >= correctWords.length) {
                handleWrongGuess();
            }
        }
    }

    function handleWrongGuess() {
        // Disable clicking more words during the animation
        finnishWordsContainerEl.style.pointerEvents = 'none';

        // Flash the background red
        document.body.classList.add('wrong-answer');

        // After the animation, reset for another try
        setTimeout(() => {
            // Remove the background flash class and make words visible again
            document.body.classList.remove('wrong-answer');
            selectedWordElements.forEach(el => {
                el.style.visibility = 'visible';
            });

            // Clear player's guess
            playerGuess = [];
            selectedWordElements = [];
            updatePlayerGuessDisplay();

            // Re-enable clicking
            finnishWordsContainerEl.style.pointerEvents = 'auto';
        }, 500); // Duration should match the CSS animation
    }

    function resetCurrentSentence() {
        playerGuess = [];
        selectedWordElements = [];
        updatePlayerGuessDisplay();
        playerGuessEl.style.color = '#ffffff';
        finnishWordsContainerEl.innerHTML = '';
        loadSentence(); 
    }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    nextSentenceBtn.addEventListener('click', () => {
        currentSentenceIndex++;
        loadSentence();
    });

    function updateFlagDisplay() {
        if (translationMode === 'swe-fin') {
            finFlag.style.display = 'block';
            sweFlag.style.display = 'none';
        } else {
            finFlag.style.display = 'none';
            sweFlag.style.display = 'block';
        }
    }

    switchLanguageBtn.addEventListener('click', () => {
        translationMode = translationMode === 'swe-fin' ? 'fin-swe' : 'swe-fin';
        updateFlagDisplay();
        loadSentence();
    });

    undoBtn.addEventListener('click', () => {
        if (playerGuess.length > 0) {
            playerGuess.pop();
            const lastWordEl = selectedWordElements.pop();
            if (lastWordEl) {
                lastWordEl.style.visibility = 'visible';
            }
            updatePlayerGuessDisplay();
        }
    });
    
    // Initialize level system and shop after all functions are defined
    updateLevelTitle();
    shopButton.addEventListener('click', openShop);
});
