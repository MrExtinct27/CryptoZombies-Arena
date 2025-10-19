// ===== ZOMBIE BREEDING SYSTEM =====

class BreedingSystem {
    constructor() {
        this.parent1 = null;
        this.parent2 = null;
        this.breedingCooldown = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.breedingFee = 0.002; // 0.002 ETH
        this.geneticTraits = {
            strength: { min: 1, max: 100, dominant: 0.7 },
            speed: { min: 1, max: 100, dominant: 0.6 },
            intelligence: { min: 1, max: 100, dominant: 0.8 },
            resilience: { min: 1, max: 100, dominant: 0.5 },
            special: { min: 1, max: 100, dominant: 0.3 }
        };
        this.mutationChance = 0.05; // 5% chance for mutation
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadBreedingHistory();
    }

    setupEventListeners() {
        // Parent selection
        $(document).on('click', '.zombie-card', (e) => {
            if ($(e.target).closest('.zombie-card').length) {
                this.selectParent($(e.target).closest('.zombie-card'));
            }
        });

        // Breeding button
        $('#breedBtn').click(() => this.performBreeding());
        
        // Clear parents
        $(document).on('click', '.clear-parent', () => this.clearParent($(this).data('parent')));
    }

    selectParent(zombieCard) {
        const zombieId = zombieCard.data('zombie-id');
        const zombieData = zombieCard.data('zombie-data');
        
        if (!zombieData) return;

        // Check if zombie is ready for breeding
        if (!this.isZombieReadyForBreeding(zombieData)) {
            showStatus("This zombie is not ready for breeding yet!", "warning");
            return;
        }

        // Determine which parent slot to use
        let parentSlot = null;
        if (!this.parent1) {
            parentSlot = 'parent1';
        } else if (!this.parent2) {
            parentSlot = 'parent2';
        } else {
            showStatus("Both parent slots are full! Clear one to select a different zombie.", "info");
            return;
        }

        this.setParent(parentSlot, zombieData);
        this.updateBreedingPreview();
    }

    setParent(slot, zombieData) {
        if (slot === 'parent1') {
            this.parent1 = zombieData;
        } else {
            this.parent2 = zombieData;
        }

        this.updateParentDisplay(slot, zombieData);
    }

    updateParentDisplay(slot, zombieData) {
        const parentSlot = $(`#${slot}`);
        const card = parentSlot.find('.zombie-card');
        
        card.html(`
            <div class="zombie-avatar">🧟</div>
            <div class="zombie-info">
                <h4>${zombieData.name}</h4>
                <p>Level ${zombieData.level}</p>
                <p>DNA: ${zombieData.dna}</p>
                <div class="genetic-traits">
                    <div class="trait">Strength: ${this.calculateTraitValue(zombieData.dna, 'strength')}</div>
                    <div class="trait">Speed: ${this.calculateTraitValue(zombieData.dna, 'speed')}</div>
                    <div class="trait">Intelligence: ${this.calculateTraitValue(zombieData.dna, 'intelligence')}</div>
                </div>
            </div>
            <button class="clear-parent" data-parent="${slot}">Clear</button>
        `);
        
        parentSlot.addClass('occupied');
    }

    calculateTraitValue(dna, trait) {
        // Extract trait value from DNA based on trait position
        const traitPositions = {
            strength: [0, 1, 2],
            speed: [3, 4, 5],
            intelligence: [6, 7, 8],
            resilience: [9, 10, 11],
            special: [12, 13, 14]
        };
        
        const positions = traitPositions[trait] || [0, 1, 2];
        let traitValue = 0;
        
        positions.forEach(pos => {
            const digit = parseInt(dna.toString().charAt(pos) || '0');
            traitValue += digit;
        });
        
        return Math.min(100, Math.max(1, traitValue * 10));
    }

    isZombieReadyForBreeding(zombieData) {
        // Check if zombie is level 2 or higher
        if (zombieData.level < 2) {
            return false;
        }

        // Check breeding cooldown (simplified - in real implementation, check blockchain)
        const lastBreeding = localStorage.getItem(`breeding_${zombieData.id}`);
        if (lastBreeding) {
            const timeSinceBreeding = Date.now() - parseInt(lastBreeding);
            if (timeSinceBreeding < this.breedingCooldown) {
                return false;
            }
        }

        return true;
    }

    updateBreedingPreview() {
        if (!this.parent1 || !this.parent2) {
            $('#breedBtn').prop('disabled', true);
            return;
        }

        // Calculate offspring traits
        const offspringTraits = this.calculateOffspringTraits();
        const offspringDNA = this.generateOffspringDNA(offspringTraits);
        
        // Check for mutations
        const isMutated = Math.random() < this.mutationChance;
        if (isMutated) {
            offspringTraits.special = Math.min(100, offspringTraits.special + 20);
        }

        // Update preview
        const offspringCard = $('#offspringCard');
        offspringCard.html(`
            <div class="zombie-avatar">${isMutated ? '🧬' : '🧟'}</div>
            <div class="zombie-info">
                <h4>${isMutated ? 'Mutant Offspring' : 'Offspring'}</h4>
                <p>DNA: ${offspringDNA}</p>
                <div class="genetic-traits">
                    <div class="trait">Strength: ${offspringTraits.strength}</div>
                    <div class="trait">Speed: ${offspringTraits.speed}</div>
                    <div class="trait">Intelligence: ${offspringTraits.intelligence}</div>
                    <div class="trait">Resilience: ${offspringTraits.resilience}</div>
                    ${isMutated ? '<div class="trait mutation">Special: ' + offspringTraits.special + ' ⭐</div>' : ''}
                </div>
                <div class="breeding-info">
                    <p>Rarity: ${this.calculateRarity(offspringTraits)}</p>
                    <p>Mutation: ${isMutated ? 'Yes' : 'No'}</p>
                </div>
            </div>
        `);

        // Enable breeding button
        $('#breedBtn').prop('disabled', false);
        $('#breedBtn').text(`Breed Zombies (${this.breedingFee} ETH)`);
    }

    calculateOffspringTraits() {
        const traits = {};
        
        Object.keys(this.geneticTraits).forEach(trait => {
            const parent1Value = this.calculateTraitValue(this.parent1.dna, trait);
            const parent2Value = this.calculateTraitValue(this.parent2.dna, trait);
            
            // Genetic inheritance with dominance
            const dominance = this.geneticTraits[trait].dominant;
            const inheritance = Math.random() < dominance ? 
                Math.max(parent1Value, parent2Value) : 
                Math.min(parent1Value, parent2Value);
            
            // Add some randomness
            const variation = (Math.random() - 0.5) * 20;
            traits[trait] = Math.min(100, Math.max(1, inheritance + variation));
        });
        
        return traits;
    }

    generateOffspringDNA(traits) {
        // Generate DNA based on traits
        let dna = '';
        const traitOrder = ['strength', 'speed', 'intelligence', 'resilience', 'special'];
        
        traitOrder.forEach(trait => {
            const value = Math.floor(traits[trait] / 10);
            dna += value.toString().padStart(2, '0');
        });
        
        // Pad to 16 digits
        while (dna.length < 16) {
            dna += Math.floor(Math.random() * 10);
        }
        
        return parseInt(dna);
    }

    calculateRarity(traits) {
        const totalTraits = Object.values(traits).reduce((sum, val) => sum + val, 0);
        const average = totalTraits / Object.keys(traits).length;
        
        if (average >= 90) return 'Legendary';
        if (average >= 80) return 'Epic';
        if (average >= 70) return 'Rare';
        if (average >= 60) return 'Uncommon';
        return 'Common';
    }

    async performBreeding() {
        if (!this.parent1 || !this.parent2) {
            showStatus("Please select both parents!", "warning");
            return;
        }

        if (!userAccount) {
            showStatus("Please connect your wallet first!", "error");
            return;
        }

        try {
            showLoading("Breeding zombies...");
            
            // Calculate offspring traits
            const offspringTraits = this.calculateOffspringTraits();
            const offspringDNA = this.generateOffspringDNA(offspringTraits);
            const isMutated = Math.random() < this.mutationChance;
            
            // Show breeding animation
            this.showBreedingAnimation();
            
            // Simulate breeding process (in real implementation, call smart contract)
            await this.simulateBreedingProcess();
            
            // Create offspring
            const offspring = {
                name: this.generateOffspringName(),
                dna: offspringDNA,
                level: 1,
                winCount: 0,
                lossCount: 0,
                traits: offspringTraits,
                isMutated: isMutated,
                parents: [this.parent1.id, this.parent2.id],
                birthTime: Date.now()
            };

            // Save breeding record
            this.saveBreedingRecord(offspring);
            
            // Update parent cooldowns
            this.updateParentCooldowns();
            
            // Show success message
            showStatus(`Successfully bred ${offspring.name}! ${isMutated ? 'Mutation detected!' : ''}`, "success");
            
            // Clear parents
            this.clearParents();
            
            // Update displays
            this.updateBreedingPreview();
            
        } catch (error) {
            console.error("Error breeding zombies:", error);
            showStatus("Error breeding zombies: " + error.message, "error");
        } finally {
            hideLoading();
        }
    }

    showBreedingAnimation() {
        const animation = $(`
            <div class="breeding-animation">
                <div class="dna-helix-large"></div>
                <div class="genetic-particles"></div>
                <div class="breeding-text">Breeding in progress...</div>
            </div>
        `);
        
        $('body').append(animation);
        
        // Animate breeding process
        gsap.to('.dna-helix-large', {
            rotation: 360,
            duration: 3,
            ease: "power2.inOut"
        });
        
        gsap.to('.genetic-particles', {
            scale: 1.5,
            opacity: 0,
            duration: 2,
            ease: "power2.out"
        });
        
        setTimeout(() => animation.remove(), 3000);
    }

    async simulateBreedingProcess() {
        // Simulate blockchain transaction
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    generateOffspringName() {
        const prefixes = ['Zombie', 'Undead', 'Rotten', 'Decayed', 'Feral', 'Savage'];
        const suffixes = ['Spawn', 'Offspring', 'Child', 'Progeny', 'Heir'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const number = Math.floor(Math.random() * 1000);
        
        return `${prefix} ${suffix} ${number}`;
    }

    saveBreedingRecord(offspring) {
        const breedingHistory = JSON.parse(localStorage.getItem('breedingHistory') || '[]');
        breedingHistory.push({
            ...offspring,
            timestamp: Date.now()
        });
        localStorage.setItem('breedingHistory', JSON.stringify(breedingHistory));
    }

    updateParentCooldowns() {
        if (this.parent1) {
            localStorage.setItem(`breeding_${this.parent1.id}`, Date.now().toString());
        }
        if (this.parent2) {
            localStorage.setItem(`breeding_${this.parent2.id}`, Date.now().toString());
        }
    }

    clearParent(parentSlot) {
        if (parentSlot === 'parent1') {
            this.parent1 = null;
        } else {
            this.parent2 = null;
        }
        
        const parentElement = $(`#${parentSlot}`);
        parentElement.removeClass('occupied');
        parentElement.find('.zombie-card').html('<div class="empty-slot">Select a zombie</div>');
        
        this.updateBreedingPreview();
    }

    clearParents() {
        this.clearParent('parent1');
        this.clearParent('parent2');
    }

    loadBreedingHistory() {
        const history = JSON.parse(localStorage.getItem('breedingHistory') || '[]');
        return history;
    }

    getBreedingCooldownRemaining(zombieId) {
        const lastBreeding = localStorage.getItem(`breeding_${zombieId}`);
        if (!lastBreeding) return 0;
        
        const timeSinceBreeding = Date.now() - parseInt(lastBreeding);
        const remaining = this.breedingCooldown - timeSinceBreeding;
        return Math.max(0, remaining);
    }

    formatCooldownTime(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    // Method to get breeding statistics
    getBreedingStats() {
        const history = this.loadBreedingHistory();
        const stats = {
            totalBreedings: history.length,
            mutations: history.filter(h => h.isMutated).length,
            averageTraits: {},
            rarityDistribution: {}
        };

        if (history.length > 0) {
            // Calculate average traits
            Object.keys(this.geneticTraits).forEach(trait => {
                const traitValues = history.map(h => h.traits[trait] || 0);
                stats.averageTraits[trait] = traitValues.reduce((sum, val) => sum + val, 0) / traitValues.length;
            });

            // Calculate rarity distribution
            history.forEach(h => {
                const rarity = this.calculateRarity(h.traits);
                stats.rarityDistribution[rarity] = (stats.rarityDistribution[rarity] || 0) + 1;
            });
        }

        return stats;
    }
}

// Initialize Breeding System
// Export for use in other modules
window.BreedingSystem = BreedingSystem;
