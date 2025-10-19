// ===== LEADERBOARD SYSTEM =====

class Leaderboard {
    constructor() {
        this.players = [];
        this.zombies = [];
        this.guilds = [];
        this.stats = {
            totalPlayers: 0,
            totalZombies: 0,
            totalBattles: 0,
            totalVolume: 0
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLeaderboardData();
        this.startDataUpdates();
    }

    setupEventListeners() {
        // Tab switching
        $('.tab-btn').click((e) => {
            const tab = $(e.target).data('tab');
            this.switchTab(tab);
        });

        // Refresh button
        $(document).on('click', '.refresh-leaderboard', () => this.refreshLeaderboard());
    }

    switchTab(tab) {
        // Update active tab
        $('.tab-btn').removeClass('active');
        $(`.tab-btn[data-tab="${tab}"]`).addClass('active');

        // Update content
        this.updateLeaderboardContent(tab);
    }

    async loadLeaderboardData() {
        // Load REAL data from blockchain
        if (!cryptoZombies || !web3) {
            console.log("⚠️ Contract not initialized yet, using sample data");
            this.generateSampleData();
            this.updateLeaderboardContent('players');
            return;
        }

        try {
            console.log("📊 Loading real blockchain data for leaderboard...");
            await this.loadRealBlockchainData();
            this.updateLeaderboardContent('players');
        } catch (error) {
            console.error("Error loading blockchain data:", error);
            this.generateSampleData();
            this.updateLeaderboardContent('players');
        }
    }

    async loadRealBlockchainData() {
        showLoading("Loading leaderboard data from blockchain...");
        
        // Get all zombie owners and their zombies
        const ownersMap = new Map();
        const allZombies = [];
        
        try {
            // Get all NewZombie events to find all zombies
            console.log("📡 Fetching all NewZombie events from blockchain...");
            const events = await cryptoZombies.getPastEvents('NewZombie', {
                fromBlock: 0,
                toBlock: 'latest'
            });
            
            console.log(`📊 Found ${events.length} zombies on blockchain`);
            
            // Fetch all zombies
            for (let event of events) {
                const zombieId = event.returnValues.zombieId;
                try {
                    const zombie = await getZombieDetails(zombieId);
                    const owner = await cryptoZombies.methods.ownerOf(zombieId).call();
                    
                    // Add to zombies array
                    allZombies.push({
                        id: zombieId,
                        name: zombie.name,
                        owner: owner.toLowerCase(),
                        level: parseInt(zombie.level),
                        dna: zombie.dna,
                        winCount: parseInt(zombie.winCount),
                        lossCount: parseInt(zombie.lossCount),
                        powerLevel: 0,
                        rarity: this.calculateRarity(parseInt(zombie.level)),
                        rank: 0
                    });
                    
                    // Track owners
                    if (!ownersMap.has(owner.toLowerCase())) {
                        ownersMap.set(owner.toLowerCase(), {
                            address: owner.toLowerCase(),
                            zombies: [],
                            totalZombies: 0,
                            totalBattles: 0,
                            wins: 0,
                            losses: 0,
                            winRate: 0,
                            level: 0
                        });
                    }
                    
                    const ownerData = ownersMap.get(owner.toLowerCase());
                    ownerData.zombies.push(zombie);
                    ownerData.totalZombies++;
                    ownerData.totalBattles += parseInt(zombie.winCount) + parseInt(zombie.lossCount);
                    ownerData.wins += parseInt(zombie.winCount);
                    ownerData.losses += parseInt(zombie.lossCount);
                    
                } catch (error) {
                    console.error(`Error fetching zombie ${zombieId}:`, error);
                }
            }
            
            // Calculate stats for each owner
            const playersArray = [];
            let rank = 1;
            
            ownersMap.forEach((ownerData, address) => {
                ownerData.winRate = ownerData.totalBattles > 0 
                    ? (ownerData.wins / ownerData.totalBattles) * 100 
                    : 0;
                    
                // Calculate player level based on total wins
                ownerData.level = Math.floor(ownerData.wins / 5) + 1;
                
                // Create player display name
                const displayName = address === userAccount?.toLowerCase() 
                    ? 'You' 
                    : `${address.substring(0, 6)}...${address.substring(38)}`;
                    
                playersArray.push({
                    address: address,
                    name: displayName,
                    level: ownerData.level,
                    totalZombies: ownerData.totalZombies,
                    totalBattles: ownerData.totalBattles,
                    wins: ownerData.wins,
                    losses: ownerData.losses,
                    winRate: ownerData.winRate,
                    totalEarnings: 0, // Can be calculated from marketplace if needed
                    rank: 0,
                    avatar: '🧟',
                    guild: null,
                    isCurrentUser: address === userAccount?.toLowerCase()
                });
            });
            
            // Sort players by wins
            playersArray.sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                if (b.totalZombies !== a.totalZombies) return b.totalZombies - a.totalZombies;
                return b.level - a.level;
            });
            
            // Assign ranks
            playersArray.forEach((player, index) => {
                player.rank = index + 1;
            });
            
            this.players = playersArray;
            
            // Calculate power levels for zombies
            allZombies.forEach(zombie => {
                zombie.powerLevel = zombie.level + zombie.winCount - zombie.lossCount;
            });
            
            // Sort zombies by power level
            allZombies.sort((a, b) => b.powerLevel - a.powerLevel);
            allZombies.forEach((zombie, index) => {
                zombie.rank = index + 1;
            });
            
            this.zombies = allZombies;
            
            // Update stats
            this.stats.totalPlayers = playersArray.length;
            this.stats.totalZombies = allZombies.length;
            this.stats.totalBattles = playersArray.reduce((sum, p) => sum + p.totalBattles, 0);
            
            hideLoading();
            console.log("✅ Leaderboard data loaded successfully!");
            console.log(`Players: ${this.players.length}, Zombies: ${this.zombies.length}`);
            
        } catch (error) {
            hideLoading();
            console.error("Error loading blockchain data:", error);
            throw error;
        }
    }

    generateSampleData() {
        // Generate sample players
        for (let i = 0; i < 50; i++) {
            this.players.push({
                address: `0x${Math.random().toString(16).substr(2, 40)}`,
                name: `Player${i + 1}`,
                level: Math.floor(Math.random() * 50) + 1,
                totalZombies: Math.floor(Math.random() * 20) + 1,
                totalBattles: Math.floor(Math.random() * 100) + 10,
                wins: Math.floor(Math.random() * 80) + 20,
                losses: Math.floor(Math.random() * 60) + 10,
                winRate: 0,
                totalEarnings: Math.random() * 10,
                rank: i + 1,
                avatar: this.getRandomAvatar(),
                guild: i < 10 ? `Guild${Math.floor(i / 3) + 1}` : null
            });
        }

        // Calculate win rates
        this.players.forEach(player => {
            player.winRate = player.totalBattles > 0 ? (player.wins / player.totalBattles) * 100 : 0;
        });

        // Sort by level
        this.players.sort((a, b) => b.level - a.level);
        this.players.forEach((player, index) => {
            player.rank = index + 1;
        });

        // Generate sample zombies
        for (let i = 0; i < 30; i++) {
            this.zombies.push({
                id: i + 1,
                name: `Zombie${i + 1}`,
                owner: this.players[Math.floor(Math.random() * this.players.length)].address,
                level: Math.floor(Math.random() * 30) + 1,
                dna: Math.floor(Math.random() * 10000000000000000),
                winCount: Math.floor(Math.random() * 50) + 1,
                lossCount: Math.floor(Math.random() * 30) + 1,
                powerLevel: 0,
                rarity: this.calculateRarity(Math.floor(Math.random() * 30) + 1),
                rank: i + 1
            });
        }

        // Calculate power levels and sort
        this.zombies.forEach(zombie => {
            zombie.powerLevel = zombie.level + zombie.winCount - zombie.lossCount;
        });

        this.zombies.sort((a, b) => b.powerLevel - a.powerLevel);
        this.zombies.forEach((zombie, index) => {
            zombie.rank = index + 1;
        });

        // Generate sample guilds
        for (let i = 0; i < 10; i++) {
            this.guilds.push({
                name: `Guild${i + 1}`,
                leader: this.players[Math.floor(Math.random() * 10)].address,
                members: Math.floor(Math.random() * 20) + 5,
                totalBattles: Math.floor(Math.random() * 200) + 50,
                wins: Math.floor(Math.random() * 150) + 30,
                losses: Math.floor(Math.random() * 100) + 20,
                winRate: 0,
                totalPower: Math.floor(Math.random() * 1000) + 100,
                rank: i + 1,
                emblem: this.getRandomEmblem()
            });
        }

        // Calculate guild win rates
        this.guilds.forEach(guild => {
            guild.winRate = guild.totalBattles > 0 ? (guild.wins / guild.totalBattles) * 100 : 0;
        });

        // Sort guilds by total power
        this.guilds.sort((a, b) => b.totalPower - a.totalPower);
        this.guilds.forEach((guild, index) => {
            guild.rank = index + 1;
        });

        this.saveLeaderboardData();
    }

    getRandomAvatar() {
        const avatars = ['🧟', '🧟‍♂️', '🧟‍♀️', '💀', '👻', '🎭', '🦹', '🦹‍♂️', '🦹‍♀️'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    getRandomEmblem() {
        const emblems = ['⚔️', '🛡️', '👑', '🔥', '⚡', '❄️', '🌊', '🌪️', '💎', '🌟'];
        return emblems[Math.floor(Math.random() * emblems.length)];
    }

    calculateRarity(level) {
        if (level >= 25) return 'Legendary';
        if (level >= 15) return 'Epic';
        if (level >= 10) return 'Rare';
        if (level >= 5) return 'Uncommon';
        return 'Common';
    }

    updateLeaderboardContent(tab) {
        const content = $('#leaderboardContent');
        content.empty();

        switch (tab) {
            case 'players':
                this.displayPlayersLeaderboard();
                break;
            case 'zombies':
                this.displayZombiesLeaderboard();
                break;
            case 'guilds':
                this.displayGuildsLeaderboard();
                break;
        }
    }

    displayPlayersLeaderboard() {
        const content = $('#leaderboardContent');
        
        const header = $(`
            <div class="leaderboard-header">
                <h3>🏆 Top Players</h3>
                <div class="leaderboard-stats">
                    <div class="stat">Total Players: ${this.players.length}</div>
                    <div class="stat">Total Zombies: ${this.stats.totalZombies}</div>
                    <div class="stat">Total Battles: ${this.stats.totalBattles}</div>
                    <button class="btn-secondary refresh-leaderboard">🔄 Refresh</button>
                </div>
            </div>
        `);
        content.append(header);

        const leaderboard = $('<div class="leaderboard-list"></div>');
        
        // Show top 50 or all players
        const displayPlayers = this.players.slice(0, 50);
        
        displayPlayers.forEach((player, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const isCurrentUser = player.isCurrentUser ? 'current-user' : '';
            const userBadge = player.isCurrentUser ? '<span class="you-badge">YOU</span>' : '';
            
            // Get player's zombies
            const playerZombies = this.zombies.filter(z => z.owner === player.address);
            const zombiesList = playerZombies.length > 0 
                ? `<div class="player-zombies-preview">
                     <strong>Zombies:</strong> ${playerZombies.slice(0, 3).map(z => z.name).join(', ')}
                     ${playerZombies.length > 3 ? ` +${playerZombies.length - 3} more` : ''}
                   </div>`
                : '<div class="player-zombies-preview">No zombies yet</div>';
            
            const playerItem = $(`
                <div class="leaderboard-item ${rankClass} ${isCurrentUser}" data-player="${player.address}">
                    ${userBadge}
                    <div class="rank">${medal} #${player.rank}</div>
                    <div class="player-info">
                        <div class="player-avatar">${player.avatar}</div>
                        <div class="player-details">
                            <div class="player-name">${player.name}</div>
                            <div class="player-address">${player.address.substring(0, 10)}...${player.address.substring(36)}</div>
                            <div class="player-level">⭐ Level ${player.level}</div>
                            ${zombiesList}
                        </div>
                    </div>
                    <div class="player-stats">
                        <div class="stat-group">
                            <div class="stat-label">Zombies</div>
                            <div class="stat-value">${player.totalZombies}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Battles</div>
                            <div class="stat-value">${player.totalBattles}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Wins</div>
                            <div class="stat-value wins">${player.wins}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Losses</div>
                            <div class="stat-value losses">${player.losses}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Win Rate</div>
                            <div class="stat-value ${player.winRate > 50 ? 'wins' : ''}">${player.winRate.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
            `);
            
            // Add click to view player's zombies
            playerItem.click(() => this.showPlayerDetails(player));
            
            leaderboard.append(playerItem);
        });

        if (this.players.length === 0) {
            leaderboard.html(`
                <div class="empty-state">
                    <div style="font-size: 4rem; margin-bottom: 20px;">👥</div>
                    <h3>No Players Yet</h3>
                    <p>Be the first to create a zombie and appear on the leaderboard!</p>
                </div>
            `);
        }

        content.append(leaderboard);
    }

    showPlayerDetails(player) {
        const playerZombies = this.zombies.filter(z => z.owner === player.address);
        
        const zombiesHTML = playerZombies.map(z => `
            <div class="zombie-detail-card">
                <div class="zombie-icon">🧟</div>
                <div class="zombie-info">
                    <div class="zombie-name">${z.name}</div>
                    <div class="zombie-stats-mini">
                        Level ${z.level} | Power: ${z.powerLevel} | Rank: #${z.rank}
                    </div>
                    <div class="zombie-record">
                        <span class="wins">✅ ${z.winCount}W</span> - 
                        <span class="losses">❌ ${z.lossCount}L</span>
                    </div>
                </div>
            </div>
        `).join('');

        const modal = $(`
            <div class="custom-modal" id="playerDetailsModal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>👤 ${player.name}</h2>
                        <button class="close-btn" onclick="$('#playerDetailsModal').remove(); $('#modalOverlay').hide();">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="player-full-address">
                            <strong>Address:</strong> ${player.address}
                        </div>
                        <div class="player-stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${player.totalZombies}</div>
                                <div class="stat-label">Total Zombies</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${player.totalBattles}</div>
                                <div class="stat-label">Total Battles</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value wins">${player.wins}</div>
                                <div class="stat-label">Wins</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value losses">${player.losses}</div>
                                <div class="stat-label">Losses</div>
                            </div>
                        </div>
                        <h3 style="margin-top: 20px; margin-bottom: 10px;">🧟 Zombies</h3>
                        <div class="zombies-list">
                            ${zombiesHTML || '<p>No zombies yet</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('#modalOverlay').show().addClass('active');
        $('body').append(modal);
    }

    displayZombiesLeaderboard() {
        const content = $('#leaderboardContent');
        
        const header = $(`
            <div class="leaderboard-header">
                <h3>🧟‍♂️ Strongest Zombies</h3>
                <div class="leaderboard-stats">
                    <div class="stat">Total Zombies: ${this.zombies.length}</div>
                    <div class="stat">Average Level: ${this.calculateAverageLevel()}</div>
                    <button class="btn-secondary refresh-leaderboard">Refresh</button>
                </div>
            </div>
        `);
        content.append(header);

        const leaderboard = $('<div class="leaderboard-list"></div>');
        
        this.zombies.slice(0, 20).forEach((zombie, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            const zombieItem = $(`
                <div class="leaderboard-item ${rankClass}">
                    <div class="rank">${medal} ${zombie.rank}</div>
                    <div class="zombie-info">
                        <div class="zombie-avatar">🧟</div>
                        <div class="zombie-details">
                            <div class="zombie-name">${zombie.name}</div>
                            <div class="zombie-level">Level ${zombie.level}</div>
                            <div class="zombie-owner">Owner: ${this.getPlayerName(zombie.owner)}</div>
                        </div>
                    </div>
                    <div class="zombie-stats">
                        <div class="stat-group">
                            <div class="stat-label">Power Level</div>
                            <div class="stat-value">${zombie.powerLevel}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Wins</div>
                            <div class="stat-value">${zombie.winCount}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Losses</div>
                            <div class="stat-value">${zombie.lossCount}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Rarity</div>
                            <div class="stat-value rarity-${zombie.rarity.toLowerCase()}">${zombie.rarity}</div>
                        </div>
                    </div>
                </div>
            `);
            
            leaderboard.append(zombieItem);
        });

        content.append(leaderboard);
    }

    displayGuildsLeaderboard() {
        const content = $('#leaderboardContent');
        
        const header = $(`
            <div class="leaderboard-header">
                <h3>🏰 Guild Rankings</h3>
                <div class="leaderboard-stats">
                    <div class="stat">Total Guilds: ${this.guilds.length}</div>
                    <div class="stat">Average Members: ${this.calculateAverageMembers()}</div>
                    <button class="btn-secondary refresh-leaderboard">Refresh</button>
                </div>
            </div>
        `);
        content.append(header);

        const leaderboard = $('<div class="leaderboard-list"></div>');
        
        this.guilds.slice(0, 15).forEach((guild, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            const guildItem = $(`
                <div class="leaderboard-item ${rankClass}">
                    <div class="rank">${medal} ${guild.rank}</div>
                    <div class="guild-info">
                        <div class="guild-emblem">${guild.emblem}</div>
                        <div class="guild-details">
                            <div class="guild-name">${guild.name}</div>
                            <div class="guild-leader">Leader: ${this.getPlayerName(guild.leader)}</div>
                            <div class="guild-members">${guild.members} members</div>
                        </div>
                    </div>
                    <div class="guild-stats">
                        <div class="stat-group">
                            <div class="stat-label">Total Power</div>
                            <div class="stat-value">${guild.totalPower}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Battles</div>
                            <div class="stat-value">${guild.totalBattles}</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Win Rate</div>
                            <div class="stat-value">${guild.winRate.toFixed(1)}%</div>
                        </div>
                        <div class="stat-group">
                            <div class="stat-label">Members</div>
                            <div class="stat-value">${guild.members}</div>
                        </div>
                    </div>
                </div>
            `);
            
            leaderboard.append(guildItem);
        });

        content.append(leaderboard);
    }

    getPlayerName(address) {
        const player = this.players.find(p => p.address === address);
        return player ? player.name : 'Unknown';
    }

    calculateAverageLevel() {
        if (this.zombies.length === 0) return 0;
        const totalLevel = this.zombies.reduce((sum, zombie) => sum + zombie.level, 0);
        return (totalLevel / this.zombies.length).toFixed(1);
    }

    calculateAverageMembers() {
        if (this.guilds.length === 0) return 0;
        const totalMembers = this.guilds.reduce((sum, guild) => sum + guild.members, 0);
        return (totalMembers / this.guilds.length).toFixed(1);
    }

    async refreshLeaderboard() {
        showLoading("Refreshing leaderboard from blockchain...");
        
        try {
            await this.loadLeaderboardData();
            hideLoading();
            showStatus("✅ Leaderboard refreshed!", "success");
        } catch (error) {
            hideLoading();
            showStatus("Error refreshing leaderboard", "error");
            console.error("Refresh error:", error);
        }
    }

    startDataUpdates() {
        // Update leaderboard data every 5 minutes
        setInterval(() => {
            this.updateLeaderboardData();
        }, 300000);
    }

    updateLeaderboardData() {
        // Simulate real-time updates
        this.players.forEach(player => {
            // Randomly update some stats
            if (Math.random() < 0.1) {
                player.totalBattles += Math.floor(Math.random() * 3);
                player.wins += Math.floor(Math.random() * 2);
                player.winRate = player.totalBattles > 0 ? (player.wins / player.totalBattles) * 100 : 0;
            }
        });

        this.zombies.forEach(zombie => {
            if (Math.random() < 0.05) {
                zombie.winCount += Math.floor(Math.random() * 2);
                zombie.powerLevel = zombie.level + zombie.winCount - zombie.lossCount;
            }
        });

        // Re-sort and re-rank
        this.players.sort((a, b) => b.level - a.level);
        this.players.forEach((player, index) => {
            player.rank = index + 1;
        });

        this.zombies.sort((a, b) => b.powerLevel - a.powerLevel);
        this.zombies.forEach((zombie, index) => {
            zombie.rank = index + 1;
        });

        this.saveLeaderboardData();
    }

    saveLeaderboardData() {
        localStorage.setItem('leaderboardPlayers', JSON.stringify(this.players));
        localStorage.setItem('leaderboardZombies', JSON.stringify(this.zombies));
        localStorage.setItem('leaderboardGuilds', JSON.stringify(this.guilds));
        localStorage.setItem('leaderboardStats', JSON.stringify(this.stats));
    }

    // Method to add new battle result
    addBattleResult(winner, loser, winnerZombie, loserZombie) {
        // Update player stats
        const winnerPlayer = this.players.find(p => p.address === winner);
        const loserPlayer = this.players.find(p => p.address === loser);

        if (winnerPlayer) {
            winnerPlayer.totalBattles++;
            winnerPlayer.wins++;
            winnerPlayer.winRate = (winnerPlayer.wins / winnerPlayer.totalBattles) * 100;
        }

        if (loserPlayer) {
            loserPlayer.totalBattles++;
            loserPlayer.losses++;
            loserPlayer.winRate = (loserPlayer.wins / loserPlayer.totalBattles) * 100;
        }

        // Update zombie stats
        const winnerZombieData = this.zombies.find(z => z.id === winnerZombie.id);
        const loserZombieData = this.zombies.find(z => z.id === loserZombie.id);

        if (winnerZombieData) {
            winnerZombieData.winCount++;
            winnerZombieData.powerLevel = winnerZombieData.level + winnerZombieData.winCount - winnerZombieData.lossCount;
        }

        if (loserZombieData) {
            loserZombieData.lossCount++;
            loserZombieData.powerLevel = loserZombieData.level + loserZombieData.winCount - loserZombieData.lossCount;
        }

        // Re-sort and save
        this.players.sort((a, b) => b.level - a.level);
        this.zombies.sort((a, b) => b.powerLevel - a.powerLevel);
        
        this.saveLeaderboardData();
    }

    // Method to get player ranking
    getPlayerRanking(address) {
        const player = this.players.find(p => p.address === address);
        return player ? player.rank : null;
    }

    // Method to get zombie ranking
    getZombieRanking(zombieId) {
        const zombie = this.zombies.find(z => z.id === zombieId);
        return zombie ? zombie.rank : null;
    }

    // Method to get guild ranking
    getGuildRanking(guildName) {
        const guild = this.guilds.find(g => g.name === guildName);
        return guild ? guild.rank : null;
    }
}

// Initialize Leaderboard
// Export for use in other modules
window.Leaderboard = Leaderboard;
