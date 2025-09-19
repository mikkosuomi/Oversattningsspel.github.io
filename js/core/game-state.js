// Global game state management
export const gameState = {
    // Flag properties
    flag: null,
    flagClickArea: null,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    
    // Speed and multipliers
    speedMultiplier: 1,
    baseSpeedMultiplier: 1,
    speedBoostEndTime: 0,
    speedBoostInterval: null,
    
    // Game state
    pins: [],
    bossPins: [],
    activeBossPin: null,
    lastBossSpawnRIP: 0,
    score: 0,
    destroyedPinsCount: 0,
    currentLevel: 1,
    isFlagMode: false,
    gameOver: false,
    levelComplete: false,
    
    // Pin management
    isMouseDragging: false,
    lastPinX: 0,
    lastPinY: 0,
    mouseHoldStartTime: 0,
    holdTimerElement: null,
    isHoldingForEnhancedPin: false,
    
    // Green pin system
    greenPins: [],
    masterGreenPin: null,
    masterPinPower: 0,
    damageLineElement: null,
    
    // Redirect pin system
    redirectPins: [],
    lastRedirectPin: null,
    redirectLoopActive: false,
    redirectLoopEndTime: 0,
    redirectSequence: [],
    redirectSequenceIndex: 0,
    
    // Effects
    antiGravityEndTime: 0,
    antiGravityActive: false,
    trailParticles: [],
    lastTrailX: 0,
    lastTrailY: 0,
    lastPassiveDamageTime: 0,
    
    // Bomb system
    bombPin: null,
    bombActive: false,
    
    // Dragging system
    isDragging: false,
    draggedPin: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    
    // Shop and upgrades
    shopOpen: false,
    playerUpgrades: {
        blades: false,
        plasmaEdge: false,
        magneticField: false
    },
    redirectPinPrice: 500,
    redirectPinsPurchased: 0,
    
    // Slowdown system
    lastSlowdownTime: 0,
    slowdownCooldown: 3000,
    slowdownActive: false,
    slowdownEndTime: 0,
    
    // Translation game
    sentences: [],
    currentSentenceIndex: 0,
    playerGuess: [],
    selectedWordElements: [],
    translationMode: 'fin-swe',
    
    // Debug
    keySequence: '',
    
    // Mouse tracking
    mouseX: 0,
    mouseY: 0
};

// Initialize game state
export function initializeGameState() {
    // Set initial flag position
    gameState.x = Math.random() * (window.innerWidth - 100);
    gameState.y = Math.random() * (window.innerHeight - 60);
    gameState.dx = (Math.random() - 0.5) * 2;
    gameState.dy = (Math.random() - 0.5) * 2;
    
    // Initialize trail position
    gameState.lastTrailX = gameState.x;
    gameState.lastTrailY = gameState.y;
    
    console.log('Game state initialized');
}

// Export for global access
window.gameState = gameState;
