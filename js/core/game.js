// Main game initialization and coordination
import { gameState, initializeGameState } from './game-state.js';
import { initializeFlag, updateFlagMovement, resetFlag } from '../physics/flag.js';
import { getMobileSpeedMultiplier, getRipSpeedMultiplier, CONSTANTS } from '../utils/helpers.js';
import { updateHoldTimer } from '../ui/effects.js';
import { initializePinSystem, checkAllCollisions } from '../pins/pin-manager.js';
import { checkGreenPinMerging, updateMagneticField, updateDamageLine, createDraggableGreenPin } from '../pins/green-pins.js';
import { checkRedirectCollision, updateRedirectLoop } from '../pins/redirect-pins.js';
import { initializeShop } from '../ui/shop.js';
import { initializeLevelSystem } from '../ui/level-system.js';
import { applyPassiveDamage, applyGravityWellEffects } from '../physics/collision.js';
import { spawnBossPin, updateBossPins, checkBossCollision } from '../bosses/boss-system.js';
import { checkBombCollision } from '../bosses/bomb-pin.js';
import { initializeTranslationGame } from '../translation/word-game.js';

// DOM elements
let speedNumber, warningContainer, warningText, resetText, ripNumber, scoreNumber;

export function initializeGame() {
    // Initialize DOM elements
    speedNumber = document.getElementById('speed-number');
    warningContainer = document.getElementById('warning-container');
    warningText = document.getElementById('warning-text');
    resetText = document.getElementById('reset-text');
    ripNumber = document.getElementById('rip-number');
    scoreNumber = document.getElementById('score-number');
    
    // Initialize game state
    initializeGameState();
    
    // Initialize all systems
    initializeFlag();
    initializePinSystem();
    initializeShop();
    initializeLevelSystem();
    initializeTranslationGame();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start the game loop
    animate();
    
    console.log('Game initialized successfully');
}

function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    
    // Mouse events
    document.body.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    
    // Prevent context menu and text selection
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    
    // Orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            gameState.lastTrailX = gameState.x;
            gameState.lastTrailY = gameState.y;
        }, 100);
    });
    
    // Title click for mode toggle
    const title = document.querySelector('h1');
    title.addEventListener('click', handleTitleClick);
    title.addEventListener('mousedown', (e) => e.stopPropagation());
}

function handleKeyDown(e) {
    if (e.key.toLowerCase() === 'r') {
        resetFlag();
    }
    
    // Debug sequence handler
    gameState.keySequence += e.key.toLowerCase();
    if (gameState.keySequence.length > 8) {
        gameState.keySequence = gameState.keySequence.slice(-8);
    }
    
    // Debug: Always show key sequence when it changes
    console.log(`Key sequence: "${gameState.keySequence}"`);
    // Handle special key sequences
    if (gameState.keySequence === 'green') {
        gameState.score++;
        scoreNumber.textContent = gameState.score.toString();
        // Add correct class to score pin so it can be dragged
        const scorePin = document.getElementById('score-pin');
        if (scorePin) {
            scorePin.classList.add('correct');
        }
        
        // Spawn 4 green pins in random locations for debugging
        for (let i = 0; i < 4; i++) {
            const randomX = Math.random() * (window.innerWidth - 100) + 50;
            const randomY = Math.random() * (window.innerHeight - 100) + 50;
            createDraggableGreenPin(randomX, randomY);
        }
        
        // Also spawn one at score pin location (top right corner)
        const scoreContainer = document.getElementById('score-container');
        const rect = scoreContainer.getBoundingClientRect();
        createDraggableGreenPin(rect.right - 15, rect.top + 15);
        
        gameState.keySequence = '';
        console.log('🟢 5 Green pins spawned via "green" key sequence! (4 random + 1 at score)');
    }
    
    // Handle boss spawn key sequence for testing
    if (gameState.keySequence === 'boss') {
        // Force spawn a boss for testing at mouse location
        gameState.lastBossSpawnRIP = 0; // Reset to force spawn
        gameState.activeBossPin = null; // Clear any existing boss reference
        
        // Spawn at mouse location if available, otherwise center of screen
        const mouseX = gameState.mouseX || window.innerWidth / 2;
        const mouseY = gameState.mouseY || window.innerHeight / 2;
        
        // Import and create boss at mouse location
        import('../bosses/boss-system.js').then(({ BossPin }) => {
            const bossTypes = ['purple', 'orange', 'red', 'black'];
            const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
            
            // Create boss at mouse location with random target
            const targetX = Math.random() * window.innerWidth;
            const targetY = Math.random() * window.innerHeight;
            
            const boss = new BossPin(bossType, mouseX, mouseY, targetX, targetY);
            gameState.bossPins.push(boss);
            gameState.activeBossPin = boss;
            gameState.lastBossSpawnRIP = gameState.destroyedPinsCount;
            
            console.log(`👹 ${bossType.toUpperCase()} BOSS SPAWNED at mouse (${mouseX}, ${mouseY})!`);
        });
        
        gameState.keySequence = '';
    }
    
    // Handle big boss spawn key sequence for testing
    if (gameState.keySequence === 'bigboss' || gameState.keySequence.endsWith('bigboss')) {
        // Force spawn a big boss at mouse location
        gameState.lastBossSpawnRIP = 0; // Reset to force spawn
        gameState.activeBossPin = null; // Clear any existing boss reference
        
        // Spawn at mouse location if available, otherwise center of screen
        const mouseX = gameState.mouseX || window.innerWidth / 2;
        const mouseY = gameState.mouseY || window.innerHeight / 2;
        
        // Import and create big boss at mouse location
        import('../bosses/boss-system.js').then(({ BossPin }) => {
            // Create a special big boss (always black type but with enhanced stats)
            const targetX = Math.random() * window.innerWidth;
            const targetY = Math.random() * window.innerHeight;
            
            const bigBoss = new BossPin('black', mouseX, mouseY, targetX, targetY);
            
            // Enhance the big boss
            bigBoss.maxCollisions = 300; // 2x normal black boss health
            bigBoss.isBigBoss = true;
            bigBoss.speed = 0.5; // Slower movement
            
            // Override reward method for big boss
            bigBoss.giveReward = function() {
                // Drop 5 anti-gravity green pins in a circle
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const distance = 50;
                    const dropX = this.x + Math.cos(angle) * distance;
                    const dropY = this.y + Math.sin(angle) * distance;
                    import('../pins/green-pins.js').then(({ createDraggableGreenPin }) => {
                        createDraggableGreenPin(dropX, dropY, true); // Anti-gravity pins
                    });
                }
                console.log('🎁 BIG BOSS DEFEATED! 5 anti-gravity green pins dropped!');
            };
            
            // Make it visually larger
            bigBoss.element.style.width = '50px';
            bigBoss.element.style.height = '50px';
            bigBoss.element.style.left = (mouseX - 25) + 'px';
            bigBoss.element.style.top = (mouseY - 25) + 'px';
            bigBoss.element.style.border = '5px solid #fff';
            bigBoss.element.style.boxShadow = '0 0 30px #2c2c2c, 0 0 60px rgba(44, 44, 44, 0.5)';
            
            // Larger health bar
            bigBoss.healthBar.style.width = '60px';
            bigBoss.healthBar.style.height = '8px';
            bigBoss.healthBar.style.left = (mouseX - 30) + 'px';
            bigBoss.healthBar.style.top = (mouseY - 35) + 'px';
            
            gameState.bossPins.push(bigBoss);
            gameState.activeBossPin = bigBoss;
            gameState.lastBossSpawnRIP = gameState.destroyedPinsCount;
            
            console.log(`👹 BIG BOSS SPAWNED at mouse (${mouseX}, ${mouseY})! Health: ${bigBoss.maxCollisions}`);
        });
        
        gameState.keySequence = '';
    }
    
    // Handle bomb boss spawn key sequence for testing
    if (gameState.keySequence === 'bomb') {
        // Force spawn the final bomb boss at mouse location
        const mouseX = gameState.mouseX || window.innerWidth / 2;
        const mouseY = gameState.mouseY || window.innerHeight / 2;
        
        // Import and create bomb boss at mouse location (coordinates will be used as center)
        import('../bosses/bomb-pin.js').then(({ createBombPin }) => {
            createBombPin(mouseX, mouseY);
            console.log(`💣 BOMB BOSS SPAWNED at center (${mouseX}, ${mouseY})! Element positioned at (${mouseX-25}, ${mouseY-25})`);
        });
        
        gameState.keySequence = '';
    }
    
    // Handle level switching debug commands
    if (gameState.keySequence === 'level2') {
        import('../ui/level-system.js').then(({ switchToLevel }) => {
            switchToLevel(2);
            console.log('🎯 DEBUG: Switched to Level 2 (leather pins)');
        });
        gameState.keySequence = '';
    }
    
    if (gameState.keySequence === 'level3') {
        import('../ui/level-system.js').then(({ switchToLevel }) => {
            switchToLevel(3);
            console.log('🎯 DEBUG: Switched to Level 3 (iron pins)');
        });
        gameState.keySequence = '';
    }
}

function handleMouseDown(e) {
    // This will be handled by the pin system
    // For now, just prevent default on UI elements
    if (e.target.closest('#game-container, #flag-click-area, #bouncing-flag, .pin, h1')) {
        return;
    }
}

function handleMouseUp(e) {
    // Reset mouse dragging state
    gameState.isMouseDragging = false;
    gameState.isHoldingForEnhancedPin = false;
    gameState.mouseHoldStartTime = 0;
    
    // Remove hold timer if it exists
    if (gameState.holdTimerElement) {
        if (gameState.holdTimerElement.parentNode) {
            gameState.holdTimerElement.parentNode.removeChild(gameState.holdTimerElement);
        }
        gameState.holdTimerElement = null;
    }
}

function handleMouseMove(e) {
    // Track mouse position for boss spawning
    gameState.mouseX = e.clientX;
    gameState.mouseY = e.clientY;
    
    // This will be handled by the pin system for dragging
}

function handleTitleClick(e) {
    e.stopPropagation();
    e.preventDefault();
    
    gameState.isFlagMode = !gameState.isFlagMode;
    
    if (gameState.isFlagMode) {
        document.body.classList.add('flag-mode');
        console.log('Switched to flag game mode');
    } else {
        document.body.classList.remove('flag-mode');
        console.log('Switched to word learning mode');
    }
}

function animate() {
    // Update flag movement and get current speed
    const currentSpeed = updateFlagMovement();
    
    // Cap the displayed speed at 300 for visual clarity, but keep internal calculation intact
    const displayedSpeed = Math.min(currentSpeed, CONSTANTS.MAX_VISUAL_SPEED);
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
    
    // Update hold timer visual
    if (gameState.isHoldingForEnhancedPin && gameState.holdTimerElement && gameState.mouseHoldStartTime > 0) {
        const holdDuration = Date.now() - gameState.mouseHoldStartTime;
        
        if (holdDuration < 5000) {
            // First 5 seconds - building to Heavy pin
            const progress = holdDuration / 5000;
            updateHoldTimer(gameState.holdTimerElement, progress, 'heavy');
        } else if (holdDuration < 10000) {
            // Next 5 seconds - building to Fortress pin
            const progress = (holdDuration - 5000) / 5000;
            updateHoldTimer(gameState.holdTimerElement, progress, 'fortress');
        } else if (holdDuration < 30000) {
            // Next 20 seconds - building to Bomb pin
            const progress = (holdDuration - 10000) / 20000;
            updateHoldTimer(gameState.holdTimerElement, progress, 'bomb');
        } else {
            // Completed - show full bomb timer
            updateHoldTimer(gameState.holdTimerElement, 1, 'bomb');
        }
    }
    
    // Apply passive damage when speed > 1000
    applyPassiveDamage(currentSpeed);
    
    // Apply gravity well effects from black bosses
    applyGravityWellEffects();
    
    // Update magnetic field
    updateMagneticField();
    
    // Update damage line
    updateDamageLine();
    
    // Check for green pin merging
    checkGreenPinMerging();
    
    // Collision with pins
    checkAllCollisions();
    
    // Check redirect pin collisions
    checkRedirectCollision();
    
    // Update redirect loop timer
    updateRedirectLoop();
    
    // Update boss pins
    updateBossPins();
    
    // Check boss collisions
    gameState.bossPins.forEach(boss => checkBossCollision(boss));
    
    // Check bomb collision if bomb is active
    if (gameState.bombPin && !gameState.bombPin.isDestroyed) {
        gameState.bombPin.update();
        checkBombCollision(gameState.bombPin);
    }
    
    // Try to spawn boss pins
    spawnBossPin();

    // Continue animation loop
    requestAnimationFrame(animate);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);
