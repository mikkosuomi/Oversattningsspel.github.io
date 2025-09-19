// Utility functions and constants
export const CONSTANTS = {
    PIN_SPACING: 18,
    TRAIL_SPACING: 8,
    MAX_VISUAL_SPEED: 120,
    PASSIVE_DAMAGE_INTERVAL: 2000,
    BOSS_SPAWN_RIP_REQUIREMENT: 2000,
    MERGE_DISTANCE: 15,
    MAGNETIC_FIELD_SPEED: 5,
    DAMAGE_LINE_MIN_THICKNESS: 1,
    DAMAGE_LINE_MAX_THICKNESS: 8
};

export function isMobilePortrait() {
    return window.innerWidth <= 600 && window.innerHeight > window.innerWidth;
}

export function getMobileSpeedMultiplier() {
    return isMobilePortrait() ? 0.3 : 1;
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function getRandomFlagSpeed() {
    return 1 + Math.random() * 0.5; // Random speed between 1.0 and 1.5
}

export function getRipSpeedMultiplier() {
    // Speed increases based on RIP count
    const ripCount = window.gameState?.destroyedPinsCount || 0;
    if (ripCount < 100) return 1;
    if (ripCount < 500) return 1.2;
    if (ripCount < 1000) return 1.5;
    if (ripCount < 2000) return 2;
    return 3; // Max 3x speed at 2000+ RIP
}

export function calculateDamage(currentSpeed, hasBlades = false, hasPlasmaEdge = false, isLeatherPin = false, isIronPin = false) {
    let damage = 1; // Base damage
    
    // Apply upgrade multipliers
    if (hasPlasmaEdge) {
        damage *= 100; // 100x damage
    } else if (hasBlades) {
        damage *= 10; // 10x damage
    }
    
    // After 300 speed, damage scales with speed
    if (currentSpeed > 300) {
        const speedAbove300 = currentSpeed - 300;
        const speedMultiplier = 1 + Math.floor(speedAbove300 / 300);
        damage *= speedMultiplier;
    }
    
    // Special damage handling for enhanced pins
    if (isLeatherPin) {
        if (!hasBlades && !hasPlasmaEdge) {
            damage = Math.max(1, Math.floor(damage * 0.2)); // Only 20% damage without upgrades
        }
    } else if (isIronPin) {
        // Iron pins have 50% damage resistance
        damage = Math.max(1, Math.floor(damage * 0.5));
    } else if (currentSpeed > 1000) {
        // Regular pins can be oneshot at high speed
        damage = Math.max(damage, 10);
    }
    
    return damage;
}

export function keepInBounds(x, y, width = 100, height = 60) {
    return {
        x: Math.max(0, Math.min(x, window.innerWidth - width)),
        y: Math.max(0, Math.min(y, window.innerHeight - height))
    };
}

export function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function normalizeVector(dx, dy) {
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return { x: 0, y: 0 };
    return { x: dx / length, y: dy / length };
}
