function displayZombies(zombies) {
    console.log("Displaying zombies:", zombies);
    $("#zombies").empty();
    
    if (!zombies || zombies.length === 0) {
        $("#zombies").append(`
            <div class='loading'>
                No zombies found! Create one to start your army.
                <br>
                <span style='font-size: 100px; animation: zombieWalk 2s infinite;'>🧟</span>
            </div>
        `);
        return;
    }

    zombies.forEach((zombie) => {
        // Check if there's a custom display name in localStorage
        const rewardZombieNames = JSON.parse(localStorage.getItem('rewardZombieNames') || '{}');
        const customName = rewardZombieNames[zombie.id];
        
        // Ensure all numeric values are properly converted
        const zombieData = {
            id: zombie.id.toString(),
            name: customName || zombie.name, // Use custom name if available
            originalName: zombie.name, // Keep original for reference
            dna: zombie.dna.toString(),
            level: parseInt(zombie.level.toString()),
            readyTime: parseInt(zombie.readyTime.toString()),
            winCount: parseInt(zombie.winCount.toString()),
            lossCount: parseInt(zombie.lossCount.toString())
        };

        const powerLevel = zombieData.level + zombieData.winCount - zombieData.lossCount;
        // Check if this zombie has been edited before (reuse the rewardZombieNames from above)
        const hasBeenEdited = rewardZombieNames.hasOwnProperty(zombieData.id);
        const showEditButton = (zombieData.originalName === 'NoName' || zombie.name === 'NoName') && !hasBeenEdited;
        
        const zombieElement = $(`
            <div class="zombie" data-zombie-id="${zombieData.id}">
                <div class="zombie-aura"></div>
                ${showEditButton ? `
                    <button class="edit-name-btn" onclick="editZombieName(${zombieData.id}, '${zombieData.name}')" title="Edit Name">
                        ✏️
                    </button>
                ` : ''}
                <div class="zombie-content">
                    <div class="zombie-header">
                        <div class="zombie-name">
                            <span class="zombie-icon">🧟</span>
                            <span class="zombie-name-text" data-full-name="${zombieData.name}">${zombieData.name}</span>
                            ${customName ? '<span style="color: var(--accent-color); font-size: 0.7rem; margin-left: 5px;">✏️</span>' : ''}
                        </div>
                    </div>
                    <div class="zombie-stats">
                        <ul>
                            <li>
                                <span class="stat-label">
                                    <span class="stat-icon">🧬</span> DNA
                                </span>
                                <span class="stat-value">${zombieData.dna}</span>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" style="--fill-amount: ${(parseInt(zombieData.dna) % 100) / 100}"></div>
                                </div>
                            </li>
                            <li>
                                <span class="stat-label">
                                    <span class="stat-icon">⭐</span> Level
                                </span>
                                <span class="stat-value">${zombieData.level}</span>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" style="--fill-amount: ${zombieData.level/10}"></div>
                                </div>
                            </li>
                            <li>
                                <span class="stat-label">
                                    <span class="stat-icon">🏆</span> Wins
                                </span>
                                <span class="stat-value">${zombieData.winCount}</span>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" style="--fill-amount: ${zombieData.winCount/10}"></div>
                                </div>
                            </li>
                            <li>
                                <span class="stat-label">
                                    <span class="stat-icon">💔</span> Losses
                                </span>
                                <span class="stat-value">${zombieData.lossCount}</span>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" style="--fill-amount: ${zombieData.lossCount/10}"></div>
                                </div>
                            </li>
                            <li>
                                <span class="stat-label ready-timer">Ready Time</span>
                                <span class="stat-value">${new Date(zombieData.readyTime * 1000).toLocaleString()}</span>
                            </li>
                        </ul>
                    </div>
                    <div class="zombie-actions">
                        <button class="level-up-btn" onclick="levelUp(${zombieData.id})">Level Up (${LEVEL_UP_FEE} ETH)</button>
                        <button class="battle-btn" onclick="quickBattle(${zombieData.id})">⚔️ Battle</button>
                    </div>
                </div>
            </div>
        `);
        
        $("#zombies").append(zombieElement);
    });

    // Hover sound effect removed
}

window.showZombieAnimation = function() {
    const overlay = $('<div class="overlay"></div>');
    const container = $(`
        <div class="zombie-walking-container">
            <div class="blood-splatter"></div>
            <div class="zombie-walking">🧟</div>
            <div class="zombie-shadow"></div>
            <div class="progress-bar">
                <div class="progress-bar-fill"></div>
            </div>
            <div class="loading-text">Summoning your zombie...</div>
        </div>
    `);
    
    $('body').append(overlay);
    $('body').append(container);

    // Zombie groaning sounds removed
}

window.hideZombieAnimation = function() {
    const container = $('.zombie-walking-container');
    clearInterval(container.data('groanInterval'));
    $('.overlay, .zombie-walking-container').fadeOut(500, function() {
        $(this).remove();
    });
}

window.showLevelUpAnimation = function(oldLevel, newLevel) {
    const overlay = $('<div class="overlay"></div>');
    const container = $(`
        <div class="level-up-container">
            <div class="level-up-stars"></div>
            <div class="level-up-icon">⚡</div>
            <div class="power-bar">
                <div class="power-bar-fill"></div>
            </div>
            <div class="level-up-text">LEVEL UP!</div>
            <div class="level-up-stats">
                Level ${oldLevel} → Level ${newLevel}
            </div>
        </div>
    `);
    
    $('body').append(overlay);
    $('body').append(container);

    // Add all effects
    createMagicEffects(container);
    createLightningEffect(container);
    createPowerOrbs(container);
    
    playPowerUpSounds();

    // Show level numbers periodically
    const numberInterval = setInterval(() => {
        showLevelNumber(container, newLevel);
    }, 800);

    // Remove animation and clear intervals
    setTimeout(() => {
        clearInterval(numberInterval);
        overlay.fadeOut(1000, function() { $(this).remove(); });
        container.fadeOut(1000, function() { $(this).remove(); });
    }, 4000);
} 