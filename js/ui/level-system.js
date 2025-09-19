// Level progression and management system
import { gameState } from '../core/game-state.js';

let levelTitle;

export function initializeLevelSystem() {
    levelTitle = document.querySelector('h1');
    updateLevelTitle();
}

export function updateLevelTitle() {
    if (!levelTitle) return;
    
    if (gameState.currentLevel === 1) {
        levelTitle.textContent = 'Översättningsspel.';
    } else {
        levelTitle.textContent = `Översättningsspel. ${gameState.currentLevel}`;
    }
}

export function switchToLevel(level) {
    gameState.currentLevel = level;
    updateLevelTitle();
    console.log(`🎯 Switched to Level ${level}`);
    
    // Update level-specific mechanics
    if (level === 2) {
        console.log('📈 Level 2 activated: Leather pins now spawn (80% chance)');
        console.log('🛡️ Leather pins have 50 HP and provide 10x RIP rewards');
        console.log('🐌 Leather pins apply slowdown effect on collision');
    }
}

export function showLevelCompleteScreen() {
    const levelCompleteScreen = document.createElement('div');
    levelCompleteScreen.id = 'level-complete-screen';
    levelCompleteScreen.style.position = 'fixed';
    levelCompleteScreen.style.top = '0';
    levelCompleteScreen.style.left = '0';
    levelCompleteScreen.style.width = '100%';
    levelCompleteScreen.style.height = '100%';
    levelCompleteScreen.style.backgroundColor = 'rgba(0, 100, 0, 0.9)';
    levelCompleteScreen.style.display = 'flex';
    levelCompleteScreen.style.flexDirection = 'column';
    levelCompleteScreen.style.justifyContent = 'center';
    levelCompleteScreen.style.alignItems = 'center';
    levelCompleteScreen.style.zIndex = '20000';
    levelCompleteScreen.style.color = '#ffffff';
    levelCompleteScreen.style.textAlign = 'center';
    levelCompleteScreen.style.fontFamily = 'Arial, sans-serif';
    
    const title = document.createElement('h1');
    title.textContent = '🎉 LEVEL COMPLETE! 🎉';
    title.style.fontSize = '48px';
    title.style.marginBottom = '30px';
    title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    title.style.animation = 'pulse 2s ease-in-out infinite alternate';
    levelCompleteScreen.appendChild(title);
    
    const message = document.createElement('p');
    message.textContent = 'Bomb defeated! Choose your path:';
    message.style.fontSize = '24px';
    message.style.marginBottom = '40px';
    levelCompleteScreen.appendChild(message);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.justifyContent = 'center';
    
    // Continue to next level button
    const nextLevelBtn = document.createElement('button');
    nextLevelBtn.textContent = `Continue to Level ${gameState.currentLevel + 1}`;
    nextLevelBtn.style.padding = '15px 30px';
    nextLevelBtn.style.fontSize = '18px';
    nextLevelBtn.style.backgroundColor = '#4CAF50';
    nextLevelBtn.style.color = 'white';
    nextLevelBtn.style.border = 'none';
    nextLevelBtn.style.borderRadius = '10px';
    nextLevelBtn.style.cursor = 'pointer';
    nextLevelBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    nextLevelBtn.style.transition = 'all 0.3s ease';
    
    nextLevelBtn.addEventListener('mouseenter', () => {
        nextLevelBtn.style.backgroundColor = '#45a049';
        nextLevelBtn.style.transform = 'translateY(-2px)';
    });
    
    nextLevelBtn.addEventListener('mouseleave', () => {
        nextLevelBtn.style.backgroundColor = '#4CAF50';
        nextLevelBtn.style.transform = 'translateY(0)';
    });
    
    nextLevelBtn.addEventListener('click', () => {
        switchToLevel(gameState.currentLevel + 1);
        gameState.levelComplete = false;
        gameState.gameOver = false;
        document.body.removeChild(levelCompleteScreen);
        
        // Reset bomb state
        gameState.bombActive = false;
        gameState.bombPin = null;
        
        console.log(`🚀 Advanced to Level ${gameState.currentLevel}!`);
    });
    
    buttonContainer.appendChild(nextLevelBtn);
    
    // Restart current level button
    const restartBtn = document.createElement('button');
    restartBtn.textContent = `Restart Level ${gameState.currentLevel}`;
    restartBtn.style.padding = '15px 30px';
    restartBtn.style.fontSize = '18px';
    restartBtn.style.backgroundColor = '#ff9800';
    restartBtn.style.color = 'white';
    restartBtn.style.border = 'none';
    restartBtn.style.borderRadius = '10px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    restartBtn.style.transition = 'all 0.3s ease';
    
    restartBtn.addEventListener('mouseenter', () => {
        restartBtn.style.backgroundColor = '#f57c00';
        restartBtn.style.transform = 'translateY(-2px)';
    });
    
    restartBtn.addEventListener('mouseleave', () => {
        restartBtn.style.backgroundColor = '#ff9800';
        restartBtn.style.transform = 'translateY(0)';
    });
    
    restartBtn.addEventListener('click', () => {
        gameState.levelComplete = false;
        gameState.gameOver = false;
        document.body.removeChild(levelCompleteScreen);
        
        // Reset bomb state
        gameState.bombActive = false;
        gameState.bombPin = null;
        
        console.log(`🔄 Restarting Level ${gameState.currentLevel}!`);
    });
    
    buttonContainer.appendChild(restartBtn);
    
    // Return to Level 1 button
    const level1Btn = document.createElement('button');
    level1Btn.textContent = 'Return to Level 1';
    level1Btn.style.padding = '15px 30px';
    level1Btn.style.fontSize = '18px';
    level1Btn.style.backgroundColor = '#2196F3';
    level1Btn.style.color = 'white';
    level1Btn.style.border = 'none';
    level1Btn.style.borderRadius = '10px';
    level1Btn.style.cursor = 'pointer';
    level1Btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    level1Btn.style.transition = 'all 0.3s ease';
    
    level1Btn.addEventListener('mouseenter', () => {
        level1Btn.style.backgroundColor = '#1976D2';
        level1Btn.style.transform = 'translateY(-2px)';
    });
    
    level1Btn.addEventListener('mouseleave', () => {
        level1Btn.style.backgroundColor = '#2196F3';
        level1Btn.style.transform = 'translateY(0)';
    });
    
    level1Btn.addEventListener('click', () => {
        switchToLevel(1);
        gameState.levelComplete = false;
        gameState.gameOver = false;
        document.body.removeChild(levelCompleteScreen);
        
        // Reset bomb state
        gameState.bombActive = false;
        gameState.bombPin = null;
        
        console.log('🏠 Returned to Level 1!');
    });
    
    buttonContainer.appendChild(level1Btn);
    levelCompleteScreen.appendChild(buttonContainer);
    
    // Stats display
    const statsDiv = document.createElement('div');
    statsDiv.style.marginTop = '40px';
    statsDiv.style.fontSize = '16px';
    statsDiv.style.opacity = '0.8';
    
    const stats = document.createElement('p');
    stats.innerHTML = `
        💀 Total RIP: ${gameState.destroyedPinsCount}<br>
        ⭐ Score: ${gameState.score}<br>
        🎯 Level Completed: ${gameState.currentLevel}
    `;
    statsDiv.appendChild(stats);
    levelCompleteScreen.appendChild(statsDiv);
    
    document.body.appendChild(levelCompleteScreen);
}

export function showGameOverScreen() {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    gameOverScreen.style.position = 'fixed';
    gameOverScreen.style.top = '0';
    gameOverScreen.style.left = '0';
    gameOverScreen.style.width = '100%';
    gameOverScreen.style.height = '100%';
    gameOverScreen.style.backgroundColor = 'rgba(100, 0, 0, 0.9)';
    gameOverScreen.style.display = 'flex';
    gameOverScreen.style.flexDirection = 'column';
    gameOverScreen.style.justifyContent = 'center';
    gameOverScreen.style.alignItems = 'center';
    gameOverScreen.style.zIndex = '20000';
    gameOverScreen.style.color = '#ffffff';
    gameOverScreen.style.textAlign = 'center';
    gameOverScreen.style.fontFamily = 'Arial, sans-serif';
    
    const title = document.createElement('h1');
    title.textContent = '💥 GAME OVER 💥';
    title.style.fontSize = '48px';
    title.style.marginBottom = '20px';
    title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    title.style.animation = 'shake 0.5s ease-in-out infinite alternate';
    gameOverScreen.appendChild(title);
    
    const message = document.createElement('p');
    message.textContent = 'The bomb exploded!';
    message.style.fontSize = '24px';
    message.style.marginBottom = '30px';
    gameOverScreen.appendChild(message);
    
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Try Again';
    restartBtn.style.padding = '15px 30px';
    restartBtn.style.fontSize = '20px';
    restartBtn.style.backgroundColor = '#f44336';
    restartBtn.style.color = 'white';
    restartBtn.style.border = 'none';
    restartBtn.style.borderRadius = '10px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    restartBtn.style.transition = 'all 0.3s ease';
    
    restartBtn.addEventListener('mouseenter', () => {
        restartBtn.style.backgroundColor = '#d32f2f';
        restartBtn.style.transform = 'translateY(-2px)';
    });
    
    restartBtn.addEventListener('mouseleave', () => {
        restartBtn.style.backgroundColor = '#f44336';
        restartBtn.style.transform = 'translateY(0)';
    });
    
    restartBtn.addEventListener('click', () => {
        // Reset game state
        gameState.gameOver = false;
        gameState.bombActive = false;
        gameState.bombPin = null;
        
        // Remove all pins
        gameState.pins.forEach(pin => {
            if (pin.parentNode) pin.parentNode.removeChild(pin);
            if (pin.healthBar && pin.healthBar.parentNode) {
                pin.healthBar.parentNode.removeChild(pin.healthBar);
            }
        });
        gameState.pins = [];
        
        // Reset boss pins
        gameState.bossPins.forEach(boss => {
            if (boss.element && boss.element.parentNode) {
                boss.element.parentNode.removeChild(boss.element);
            }
            if (boss.healthBar && boss.healthBar.parentNode) {
                boss.healthBar.parentNode.removeChild(boss.healthBar);
            }
        });
        gameState.bossPins = [];
        gameState.activeBossPin = null;
        
        // Reset green pin system
        gameState.masterGreenPin = null;
        gameState.masterPinPower = 0;
        if (gameState.damageLineElement && gameState.damageLineElement.parentNode) {
            gameState.damageLineElement.parentNode.removeChild(gameState.damageLineElement);
            gameState.damageLineElement = null;
        }
        
        document.body.removeChild(gameOverScreen);
        console.log('🔄 Game restarted after bomb explosion');
    });
    
    gameOverScreen.appendChild(restartBtn);
    
    // Stats display
    const statsDiv = document.createElement('div');
    statsDiv.style.marginTop = '30px';
    statsDiv.style.fontSize = '16px';
    statsDiv.style.opacity = '0.8';
    
    const stats = document.createElement('p');
    stats.innerHTML = `
        💀 Total RIP: ${gameState.destroyedPinsCount}<br>
        ⭐ Score: ${gameState.score}<br>
        🎯 Level: ${gameState.currentLevel}
    `;
    statsDiv.appendChild(stats);
    gameOverScreen.appendChild(statsDiv);
    
    document.body.appendChild(gameOverScreen);
}
