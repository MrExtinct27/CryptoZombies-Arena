// ===== BATTLE ARENA SYSTEM =====

class BattleArena {
    constructor() {
        this.battleQueue = [];
        this.activeBattles = [];
        this.currentBattle = null;
        this.spectators = [];
        this.battleHistory = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startBattleQueue();
        this.loadBattleHistory();
    }

    setupEventListeners() {
        // Find Battle Button
        $('#findBattleBtn').click(() => this.findBattle());
        
        // Create Tournament Button
        $('#createTournamentBtn').click(() => this.createTournament());
        
        // Spectate Button
        $('#spectateBtn').click(() => this.showSpectateMode());
        
        // Battle Controls
        $('#attackBtn').click(() => this.performAttack());
        $('#fleeBtn').click(() => this.fleeBattle());
        
        // Battle Modal Events
        $('#battleModal .close-btn').click(() => this.closeBattleModal());
    }

    async findBattle() {
        if (!userAccount) {
            showStatus("Please connect your wallet first", "error");
            return;
        }

        try {
            showLoading("Finding battle...");
            
            // Get user's zombies
            const zombies = await getZombiesByOwner(userAccount);
            if (zombies.length === 0) {
                showStatus("You need at least one zombie to battle!", "error");
                hideLoading();
                return;
            }

            // Show zombie selection for battle
            this.showZombieSelection(zombies);
            
        } catch (error) {
            console.error("Error finding battle:", error);
            showStatus("Error finding battle: " + error.message, "error");
            hideLoading();
        }
    }

    showZombieSelection(zombies) {
        const modal = $(`
            <div class="modal-overlay active" id="zombieSelectionModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Select Your Fighter</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="zombie-selection-grid">
                            ${zombies.map(zombie => `
                                <div class="zombie-selection-card" data-zombie-id="${zombie.id}">
                                    <div class="zombie-avatar">🧟</div>
                                    <div class="zombie-info">
                                        <h4>${zombie.name}</h4>
                                        <p>Level ${zombie.level}</p>
                                        <p>Wins: ${zombie.winCount} | Losses: ${zombie.lossCount}</p>
                                    </div>
                                    <button class="btn-primary select-zombie-btn">Select</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);

        // Handle zombie selection
        $('.select-zombie-btn').click((e) => {
            const zombieId = $(e.target).closest('.zombie-selection-card').data('zombie-id');
            this.startBattle(zombieId);
            modal.remove();
        });

        // Close modal
        modal.find('.close-btn').click(() => modal.remove());
    }

    async startBattle(zombieId) {
        try {
            // Add to battle queue
            const battleRequest = {
                player: userAccount,
                zombieId: zombieId,
                timestamp: Date.now(),
                status: 'waiting'
            };

            this.battleQueue.push(battleRequest);
            this.updateBattleQueueDisplay();

            // Try to match with another player
            const opponent = this.findOpponent(battleRequest);
            if (opponent) {
                await this.initiateBattle(battleRequest, opponent);
            } else {
                showStatus("Waiting for opponent...", "info");
                // Start matchmaking process
                this.startMatchmaking(battleRequest);
            }

        } catch (error) {
            console.error("Error starting battle:", error);
            showStatus("Error starting battle: " + error.message, "error");
        }
    }

    findOpponent(battleRequest) {
        // Find another player in queue
        return this.battleQueue.find(request => 
            request.player !== battleRequest.player && 
            request.status === 'waiting'
        );
    }

    async startMatchmaking(battleRequest) {
        // Simulate finding opponent after 3-10 seconds
        const waitTime = Math.random() * 7000 + 3000;
        
        setTimeout(async () => {
            if (battleRequest.status === 'waiting') {
                // Create AI opponent for demo
                const aiOpponent = this.createAIOpponent();
                await this.initiateBattle(battleRequest, aiOpponent);
            }
        }, waitTime);
    }

    createAIOpponent() {
        return {
            player: '0x0000000000000000000000000000000000000000', // AI address
            zombieId: Math.floor(Math.random() * 1000), // Random zombie ID
            timestamp: Date.now(),
            status: 'ready',
            isAI: true,
            zombie: {
                name: `AI Zombie ${Math.floor(Math.random() * 100)}`,
                level: Math.floor(Math.random() * 10) + 1,
                dna: Math.floor(Math.random() * 10000000000000000),
                winCount: Math.floor(Math.random() * 20),
                lossCount: Math.floor(Math.random() * 15)
            }
        };
    }

    async initiateBattle(player1, player2) {
        try {
            // Remove from queue
            this.battleQueue = this.battleQueue.filter(req => 
                req.player !== player1.player && req.player !== player2.player
            );

            // Get zombie details if not already loaded
            if (!player1.zombie) {
                player1.zombie = await getZombieDetails(player1.zombieId);
            }
            if (!player2.zombie && !player2.isAI) {
                player2.zombie = await getZombieDetails(player2.zombieId);
            }

            // Store initial win counts
            player1.initialWins = parseInt(player1.zombie.winCount);
            player2.initialWins = player2.isAI ? parseInt(player2.zombie.winCount) : parseInt(player2.zombie.winCount);

            // Create battle
            const battle = {
                id: Date.now(),
                player1: player1,
                player2: player2,
                status: 'active',
                startTime: Date.now(),
                turn: 1,
                round: 1,
                maxRounds: 5,
                log: []
            };

            this.activeBattles.push(battle);
            this.currentBattle = battle;

            // Show battle interface
            this.showBattleInterface(battle);
            this.updateBattleQueueDisplay();
            this.updateActiveBattlesDisplay();

            hideLoading();

        } catch (error) {
            console.error("Error initiating battle:", error);
            showStatus("Error starting battle: " + error.message, "error");
            hideLoading();
        }
    }

    showBattleInterface(battle) {
        const modal = $('#battleModal');
        modal.addClass('active');
        modal.show();

        // Set up fighters
        this.setupFighters(battle);
        
        // Start battle sequence
        this.startBattleSequence(battle);
    }

    setupFighters(battle) {
        const fighter1 = $('#fighter1');
        const fighter2 = $('#fighter2');

        // Player 1 (User)
        fighter1.find('.zombie-avatar').text('🧟');
        fighter1.find('.fighter-stats').html(`
            <div class="fighter-name">${battle.player1.zombie?.name || 'Your Zombie'}</div>
            <div class="fighter-level">Level ${battle.player1.zombie?.level || 1}</div>
            <div class="fighter-hp">HP: 100/100</div>
        `);

        // Player 2 (Opponent)
        fighter2.find('.zombie-avatar').text('🧟');
        fighter2.find('.fighter-stats').html(`
            <div class="fighter-name">${battle.player2.zombie?.name || 'Opponent'}</div>
            <div class="fighter-level">Level ${battle.player2.zombie?.level || 1}</div>
            <div class="fighter-hp">HP: 100/100</div>
        `);

        // Add battle log
        this.addBattleLog("Battle started! Choose your action.");
    }

    startBattleSequence(battle) {
        // Animate fighters entering
        gsap.fromTo('#fighter1', 
            { x: -200, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power2.out" }
        );
        
        gsap.fromTo('#fighter2', 
            { x: 200, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power2.out" }
        );

        // Animate VS indicator
        gsap.fromTo('.vs-indicator', 
            { scale: 0, rotation: 180 },
            { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }
        );
    }

    async performAttack() {
        if (!this.currentBattle) return;

        try {
            const battle = this.currentBattle;
            const attackerId = battle.player1.zombieId;
            const targetId = battle.player2.zombieId;
            
            this.addBattleLog(`Round ${battle.round}: ${battle.player1.zombie.name} attacks ${battle.player2.zombie.name}!`);
            
            // Disable attack button during transaction
            $('#attackBtn').prop('disabled', true).text('Attacking...');
            
            // Call smart contract attack function
            const result = await attackZombie(attackerId, targetId);
            
            console.log("Attack result:", result);
            
            // Update zombies
            battle.player1.zombie = result.myZombie;
            battle.player2.zombie = result.enemyZombie;
            
            // Check who won
            const myWins = parseInt(result.myZombie.winCount);
            const enemyWins = parseInt(result.enemyZombie.winCount);
            const myLosses = parseInt(result.myZombie.lossCount);
            const enemyLosses = parseInt(result.enemyZombie.lossCount);
            
            // Determine battle outcome
            if (myWins > battle.player1.initialWins) {
                this.addBattleLog(`🎉 VICTORY! ${battle.player1.zombie.name} wins!`);
                this.addBattleLog(`${battle.player1.zombie.name} gained a level and a new zombie!`);
                this.animateCriticalHit();
                
                setTimeout(() => {
                    this.endBattle(battle, 'player1');
                }, 2000);
            } else {
                this.addBattleLog(`😢 DEFEAT! ${battle.player2.zombie.name} wins!`);
                this.addBattleLog(`${battle.player1.zombie.name} must wait for cooldown...`);
                
                setTimeout(() => {
                    this.endBattle(battle, 'player2');
                }, 2000);
            }

            // Animate attack
            this.animateAttack('#fighter1', '#fighter2');
            
            // Re-enable button
            $('#attackBtn').prop('disabled', false).text('Attack!');

        } catch (error) {
            console.error("Error performing attack:", error);
            this.addBattleLog("Attack failed: " + error.message);
            $('#attackBtn').prop('disabled', false).text('Attack!');
            showStatus("Battle error: " + error.message, "error");
        }
    }

    performAIAttack() {
        if (!this.currentBattle) return;

        const battle = this.currentBattle;
        this.addBattleLog(`Round ${battle.round}: Opponent attacks!`);
        
        const damage = Math.floor(Math.random() * 25) + 5;
        this.addBattleLog(`Opponent deals ${damage} damage!`);
        
        // Animate AI attack
        this.animateAttack('#fighter2', '#fighter1');
        
        battle.round++;
        
        if (this.checkBattleEnd(battle)) {
            this.endBattle(battle);
        }
    }

    checkBattleEnd(battle) {
        // Simple battle end condition - 5 rounds or random chance
        return battle.round >= battle.maxRounds || Math.random() < 0.3;
    }

    endBattle(battle) {
        const winner = Math.random() < 0.6 ? battle.player1 : battle.player2;
        const isPlayerWin = winner.player === userAccount;
        
        this.addBattleLog(`Battle ended! ${isPlayerWin ? 'You win!' : 'You lose!'}`);
        
        // Animate winner
        if (isPlayerWin) {
            this.animateVictory('#fighter1');
        } else {
            this.animateVictory('#fighter2');
        }

        // Update battle status
        battle.status = 'completed';
        battle.winner = winner;
        battle.endTime = Date.now();

        // Save to history
        this.battleHistory.push(battle);

        // Update displays
        this.updateActiveBattlesDisplay();
        this.updateLeaderboard();

        // Close battle modal after delay
        setTimeout(() => {
            this.closeBattleModal();
            showStatus(isPlayerWin ? "Victory! Your zombie gained experience!" : "Defeat! Better luck next time!", 
                      isPlayerWin ? "success" : "info");
        }, 3000);
    }

    animateAttack(attacker, target) {
        // Shake animation for attacker
        gsap.to(attacker, {
            x: 20,
            duration: 0.1,
            yoyo: true,
            repeat: 4,
            ease: "power2.inOut"
        });

        // Impact animation for target
        gsap.to(target, {
            scale: 0.9,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });

        // Flash effect
        gsap.to(target, {
            backgroundColor: "rgba(255, 0, 0, 0.5)",
            duration: 0.1,
            yoyo: true,
            repeat: 1
        });
    }

    animateCriticalHit() {
        // Critical hit effects
        gsap.to('.vs-indicator', {
            scale: 1.5,
            color: "#ff0000",
            duration: 0.3,
            yoyo: true,
            repeat: 2
        });
    }

    animateVictory(fighter) {
        gsap.to(fighter, {
            scale: 1.2,
            rotation: 5,
            duration: 0.5,
            ease: "power2.out"
        });

        // Victory particles
        this.createVictoryParticles(fighter);
    }

    createVictoryParticles(fighter) {
        for (let i = 0; i < 10; i++) {
            const particle = $('<div class="victory-particle">✨</div>');
            $(fighter).append(particle);
            
            gsap.to(particle, {
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                opacity: 0,
                scale: 0,
                duration: 1,
                ease: "power2.out",
                onComplete: () => particle.remove()
            });
        }
    }

    fleeBattle() {
        if (!this.currentBattle) return;

        this.addBattleLog("You fled the battle!");
        this.currentBattle.status = 'fled';
        this.closeBattleModal();
        showStatus("You fled the battle!", "warning");
    }

    closeBattleModal() {
        $('#battleModal').removeClass('active').hide();
        this.currentBattle = null;
    }

    addBattleLog(message) {
        const log = $('#battleLog');
        const timestamp = new Date().toLocaleTimeString();
        log.append(`<div>[${timestamp}] ${message}</div>`);
        log.scrollTop(log[0].scrollHeight);
    }

    updateBattleQueueDisplay() {
        const queueList = $('#queueList');
        queueList.empty();

        this.battleQueue.forEach((request, index) => {
            const queueItem = $(`
                <div class="queue-item">
                    <div class="queue-player">Player ${index + 1}</div>
                    <div class="queue-status">${request.status}</div>
                    <div class="queue-time">${Math.floor((Date.now() - request.timestamp) / 1000)}s</div>
                </div>
            `);
            queueList.append(queueItem);
        });
    }

    updateActiveBattlesDisplay() {
        const battleList = $('#battleList');
        battleList.empty();

        this.activeBattles.forEach(battle => {
            const battleItem = $(`
                <div class="battle-item">
                    <div class="battle-info">
                        <div class="battle-players">
                            ${battle.player1.zombie?.name || 'Player 1'} vs ${battle.player2.zombie?.name || 'Player 2'}
                        </div>
                        <div class="battle-round">Round ${battle.round}/${battle.maxRounds}</div>
                        <div class="battle-status">${battle.status}</div>
                    </div>
                    <button class="btn-secondary spectate-battle-btn" data-battle-id="${battle.id}">
                        Spectate
                    </button>
                </div>
            `);
            battleList.append(battleItem);
        });

        // Handle spectate button clicks
        $('.spectate-battle-btn').click((e) => {
            const battleId = $(e.target).data('battle-id');
            this.spectateBattle(battleId);
        });
    }

    spectateBattle(battleId) {
        const battle = this.activeBattles.find(b => b.id === battleId);
        if (battle) {
            this.currentBattle = battle;
            this.showBattleInterface(battle);
            this.addBattleLog("You are now spectating this battle!");
        }
    }

    showSpectateMode() {
        if (this.activeBattles.length === 0) {
            showStatus("No active battles to spectate", "info");
            return;
        }
        
        this.updateActiveBattlesDisplay();
        showStatus("Select a battle to spectate", "info");
    }

    createTournament() {
        showStatus("Tournament feature coming soon!", "info");
    }

    startBattleQueue() {
        // Simulate battle queue updates
        setInterval(() => {
            this.updateBattleQueueDisplay();
            this.updateActiveBattlesDisplay();
        }, 1000);
    }

    loadBattleHistory() {
        // Load battle history from localStorage
        const saved = localStorage.getItem('battleHistory');
        if (saved) {
            this.battleHistory = JSON.parse(saved);
        }
    }

    saveBattleHistory() {
        // Save battle history to localStorage
        localStorage.setItem('battleHistory', JSON.stringify(this.battleHistory));
    }

    updateLeaderboard() {
        // Update leaderboard with battle results
        if (typeof updateLeaderboard === 'function') {
            updateLeaderboard();
        }
    }
}

// Export for use in other modules
window.BattleArena = BattleArena;
