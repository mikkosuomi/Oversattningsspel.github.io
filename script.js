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

    function createTrailParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.backgroundColor = '#006aa7'; // Swedish flag blue
        particle.style.borderRadius = '50%';
        particle.style.left = (x + 48) + 'px'; // Center of flag
        particle.style.top = (y + 28) + 'px';
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
        
        // Prevent dropping pins on UI elements, the flag, or the flag's click area
        if (e.target.closest('#game-container, #flag-click-area, #bouncing-flag, .pin')) {
            return;
        }

        if (e.button === 0) { // Left-click to start dragging and add pins
            isMouseDragging = true;
            lastPinX = e.clientX;
            lastPinY = e.clientY;
            
            // Create the first pin at mouse position
            createPinAtPosition(e.clientX, e.clientY);
            
            e.preventDefault(); // Prevent text selection while dragging
        }
    });

    function createPinAtPosition(x, y) {
        const pin = document.createElement('div');
        pin.classList.add('pin');
        // Adjust position to center the pin on the cursor
        pin.style.left = (x - 5) + 'px';
        pin.style.top = (y - 5) + 'px';
        document.body.appendChild(pin);
        pins.push(pin);
        checkCollision(pin); // Check for collision immediately

        pin.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right-click to remove a pin
                e.stopPropagation(); // Prevent dropping a new pin
                pin.remove();
                pins = pins.filter(p => p !== pin);
            }
        });
        
        return pin;
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
            
            // Reset base speed multiplier
            baseSpeedMultiplier = 1;
            
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
    });

    function animate() {
        const mobileSpeedMultiplier = getMobileSpeedMultiplier();
        x += dx * speedMultiplier * baseSpeedMultiplier * mobileSpeedMultiplier;
        y += dy * speedMultiplier * baseSpeedMultiplier * mobileSpeedMultiplier;

        // Calculate and display current speed
        const currentSpeed = Math.sqrt(dx * dx + dy * dy) * speedMultiplier * baseSpeedMultiplier * mobileSpeedMultiplier;
        speedNumber.textContent = currentSpeed.toFixed(1);
        
        // Show/hide warning based on speed
        if (currentSpeed > 500) {
            warningContainer.style.display = 'block';
        } else {
            warningContainer.style.display = 'none';
        }

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
            createTrailParticle(x, y);
            lastTrailX = x;
            lastTrailY = y;
        }

        // Update and cleanup trail particles
        updateTrailParticles();

        // Collision with pins
        pins.forEach(checkCollision);

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

    function checkCollision(pin) {
        const pinRect = pin.getBoundingClientRect();
        const flagRect = flag.getBoundingClientRect();

        if (
            flagRect.left < pinRect.right &&
            flagRect.right > pinRect.left &&
            flagRect.top < pinRect.bottom &&
            flagRect.bottom > pinRect.top
        ) {
            // Calculate centers for better collision detection
            const flagCenterX = x + 50; // flag width is 100px, so center is at x + 50
            const flagCenterY = y + 30; // flag height is 60px, so center is at y + 30
            const pinCenterX = pinRect.left + pinRect.width / 2;
            const pinCenterY = pinRect.top + pinRect.height / 2;

            // Create sparks at collision point
            createSparks(pinCenterX, pinCenterY);

            // Special handling for green pins
            if (pin.classList.contains('green-pin')) {
                // Green pin gives 300% speed boost and extends timer by 3 seconds
                if (speedMultiplier < 3) {
                    // If no boost or lower boost, start 300% boost
                    startSpeedBoost(3000, 3);
                } else {
                    // If already boosted, extend the timer by 3 seconds
                    speedBoostEndTime += 3000;
                }
            }

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
        }
    }

    // Pin drag functionality
    const scorePin = document.getElementById('score-pin');
    const scoreNumber = document.getElementById('score-number');
    let isDragging = false;
    let draggedPin = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function createDraggableGreenPin(x, y) {
        const greenPin = document.createElement('div');
        greenPin.classList.add('pin', 'green-pin');
        greenPin.style.left = (x - 5) + 'px';
        greenPin.style.top = (y - 5) + 'px';
        document.body.appendChild(greenPin);
        pins.push(greenPin);
        
        // Add drag functionality to green pin
        addGreenPinDragHandlers(greenPin);
        
        return greenPin;
    }

    function addGreenPinDragHandlers(greenPin) {
        greenPin.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                // Right-click to remove
                e.stopPropagation();
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
                
                createPinAtPosition(e.clientX, e.clientY);
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
});
