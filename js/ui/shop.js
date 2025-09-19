// Shop system and upgrades
import { gameState } from '../core/game-state.js';
import { isMobilePortrait } from '../utils/helpers.js';

let shopButton, shopContainer;

export function initializeShop() {
    shopButton = document.getElementById('shop-button');
    
    if (shopButton) {
        shopButton.addEventListener('click', openShop);
    }
}

export function openShop() {
    if (gameState.shopOpen) return;
    gameState.shopOpen = true;
    
    // Create shop overlay
    shopContainer = document.createElement('div');
    shopContainer.id = 'shop-container';
    shopContainer.style.position = 'fixed';
    shopContainer.style.top = '0';
    shopContainer.style.left = '0';
    shopContainer.style.width = '100%';
    shopContainer.style.height = '100%';
    shopContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    shopContainer.style.zIndex = '10000';
    shopContainer.style.display = 'flex';
    shopContainer.style.justifyContent = 'center';
    shopContainer.style.alignItems = 'center';
    
    // Create shop panel
    const shopPanel = document.createElement('div');
    shopPanel.style.backgroundColor = '#1a1a1a';
    shopPanel.style.border = '2px solid #ffd700';
    shopPanel.style.borderRadius = '10px';
    shopPanel.style.padding = '20px';
    shopPanel.style.maxWidth = '400px';
    shopPanel.style.width = '90%';
    shopPanel.style.color = '#ffffff';
    shopPanel.style.fontFamily = 'Arial, sans-serif';
    
    // Shop title
    const title = document.createElement('h2');
    title.textContent = 'SHOP';
    title.style.textAlign = 'center';
    title.style.color = '#ffd700';
    title.style.marginBottom = '20px';
    shopPanel.appendChild(title);
    
    // RIP display
    const ripDisplay = document.createElement('div');
    ripDisplay.style.textAlign = 'center';
    ripDisplay.style.fontSize = '18px';
    ripDisplay.style.marginBottom = '20px';
    ripDisplay.innerHTML = `💀 RIP Points: <span style="color: #ffd700;">${gameState.destroyedPinsCount}</span>`;
    shopPanel.appendChild(ripDisplay);
    
    // Upgrades
    const upgrades = [
        {
            name: 'Blades',
            price: 5000,
            description: '10x damage, reduces slowdown to 5%',
            key: 'blades'
        },
        {
            name: 'Plasma Edge',
            price: 50000,
            description: '100x damage (requires Blades)',
            key: 'plasmaEdge',
            requires: 'blades'
        },
        {
            name: 'Magnetic Field',
            price: 10000,
            description: 'Pulls green pins at speed 5',
            key: 'magneticField'
        },
        {
            name: 'Redirect Pin',
            price: gameState.redirectPinPrice || 500,
            description: 'Creates flag routing chains (price doubles)',
            key: 'redirectPin',
            isConsumable: true
        }
    ];
    
    upgrades.forEach(upgrade => {
        const upgradeDiv = document.createElement('div');
        upgradeDiv.style.border = '1px solid #666';
        upgradeDiv.style.borderRadius = '5px';
        upgradeDiv.style.padding = '10px';
        upgradeDiv.style.marginBottom = '10px';
        upgradeDiv.style.backgroundColor = '#2a2a2a';
        
        const owned = gameState.playerUpgrades[upgrade.key];
        const canAfford = gameState.destroyedPinsCount >= upgrade.price;
        const meetsRequirements = !upgrade.requires || gameState.playerUpgrades[upgrade.requires];
        
        if (owned) {
            upgradeDiv.style.backgroundColor = '#004400';
            upgradeDiv.style.borderColor = '#00aa00';
        } else if (!canAfford || !meetsRequirements) {
            upgradeDiv.style.backgroundColor = '#440000';
            upgradeDiv.style.borderColor = '#aa0000';
            upgradeDiv.style.opacity = '0.6';
        }
        
        const nameDiv = document.createElement('div');
        nameDiv.style.fontSize = '16px';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = owned ? '#00ff00' : '#ffffff';
        nameDiv.textContent = upgrade.name + (owned ? ' ✓' : '');
        upgradeDiv.appendChild(nameDiv);
        
        const descDiv = document.createElement('div');
        descDiv.style.fontSize = '12px';
        descDiv.style.color = '#cccccc';
        descDiv.style.marginTop = '5px';
        descDiv.textContent = upgrade.description;
        upgradeDiv.appendChild(descDiv);
        
        const priceDiv = document.createElement('div');
        priceDiv.style.fontSize = '14px';
        priceDiv.style.color = '#ffd700';
        priceDiv.style.marginTop = '5px';
        priceDiv.textContent = `💀 ${upgrade.price} RIP`;
        upgradeDiv.appendChild(priceDiv);
        
        if (!owned && canAfford && meetsRequirements) {
            upgradeDiv.style.cursor = 'pointer';
            upgradeDiv.addEventListener('click', () => buyUpgrade(upgrade.key));
            upgradeDiv.addEventListener('mouseenter', () => {
                upgradeDiv.style.backgroundColor = '#333333';
            });
            upgradeDiv.addEventListener('mouseleave', () => {
                upgradeDiv.style.backgroundColor = '#2a2a2a';
            });
        }
        
        if (upgrade.requires && !gameState.playerUpgrades[upgrade.requires]) {
            const reqDiv = document.createElement('div');
            reqDiv.style.fontSize = '10px';
            reqDiv.style.color = '#ff6666';
            reqDiv.style.marginTop = '5px';
            reqDiv.textContent = `Requires: ${upgrade.requires}`;
            upgradeDiv.appendChild(reqDiv);
        }
        
        shopPanel.appendChild(upgradeDiv);
    });
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'CLOSE';
    closeButton.style.width = '100%';
    closeButton.style.padding = '10px';
    closeButton.style.backgroundColor = '#666666';
    closeButton.style.color = '#ffffff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.marginTop = '20px';
    closeButton.addEventListener('click', closeShop);
    shopPanel.appendChild(closeButton);
    
    shopContainer.appendChild(shopPanel);
    document.body.appendChild(shopContainer);
    
    // Close shop when clicking outside
    shopContainer.addEventListener('click', (e) => {
        if (e.target === shopContainer) {
            closeShop();
        }
    });
}

export function closeShop() {
    if (!gameState.shopOpen) return;
    gameState.shopOpen = false;
    shopContainer.parentNode.removeChild(shopContainer);
}

export function buyUpgrade(upgradeType) {
    // Handle redirect pin purchase (special case)
    if (upgradeType === 'redirectPin') {
        const price = gameState.redirectPinPrice;
        
        // Check if can afford
        if (gameState.destroyedPinsCount < price) {
            console.log(`Cannot afford redirect pin. Need ${price} RIP, have ${gameState.destroyedPinsCount}`);
            return;
        }
        
        // Purchase redirect pin
        gameState.destroyedPinsCount -= price;
        gameState.redirectPinsPurchased++;
        document.getElementById('rip-number').textContent = gameState.destroyedPinsCount.toString();
        
        // Create redirect pin at center of screen
        import('../pins/redirect-pins.js').then(({ createRedirectPin }) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            createRedirectPin(centerX, centerY);
        });
        
        // Double the price for next purchase
        gameState.redirectPinPrice *= 2;
        
        console.log(`🛒 Purchased redirect pin for ${price} RIP! Next price: ${gameState.redirectPinPrice}`);
        
        // Close and reopen shop to refresh display
        closeShop();
        setTimeout(() => openShop(), 100);
        return;
    }
    
    // Handle regular upgrades
    const prices = {
        blades: 5000,
        plasmaEdge: 50000,
        magneticField: 10000
    };
    
    const requirements = {
        plasmaEdge: 'blades'
    };
    
    const price = prices[upgradeType];
    const requirement = requirements[upgradeType];
    
    // Check if already owned
    if (gameState.playerUpgrades[upgradeType]) {
        console.log(`Already own ${upgradeType}`);
        return;
    }
    
    // Check requirements
    if (requirement && !gameState.playerUpgrades[requirement]) {
        console.log(`${upgradeType} requires ${requirement}`);
        return;
    }
    
    // Check if can afford
    if (gameState.destroyedPinsCount < price) {
        console.log(`Cannot afford ${upgradeType}. Need ${price} RIP, have ${gameState.destroyedPinsCount}`);
        return;
    }
    
    // Purchase upgrade
    gameState.destroyedPinsCount -= price;
    gameState.playerUpgrades[upgradeType] = true;
    document.getElementById('rip-number').textContent = gameState.destroyedPinsCount.toString();
    
    console.log(`🛒 Purchased ${upgradeType} for ${price} RIP!`);
    
    // Close and reopen shop to refresh display
    closeShop();
    setTimeout(() => openShop(), 100);
}
