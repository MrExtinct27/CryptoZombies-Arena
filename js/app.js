// ===== CRYPTOZOMBIES ARENA - MAIN APPLICATION =====

// Global variables
let currentSection = 'army';
let userZombies = [];
let battleArena, breedingSystem, marketplace, leaderboard;

// Event Handlers
function initializeEventListeners() {
    console.log("🔧 Setting up event listeners...");
    
    // Navigation
    $('.nav-btn').click((e) => {
        const section = $(e.target).data('section');
        switchSection(section);
    });

    // Army section
    $('.createzombieButton').click(function() {
        console.log("🧟‍♂️ Create Zombie button clicked!");
        try {
            showCreateZombieModal();
        } catch (error) {
            console.error("❌ Error in showCreateZombieModal:", error);
        }
    });
    $('.showZombieButton').click(handleShowZombies);
    
    // Wallet connection - Use native JavaScript for better reliability
    const walletBtn = document.getElementById('walletStatus');
    if (walletBtn) {
        console.log("✅ Wallet button found, adding listener");
        walletBtn.addEventListener('click', async function(e) {
            console.log("🔗 Wallet button clicked!");
            e.preventDefault();
            e.stopPropagation();
            
            // Check both userAccount AND if Web3 is initialized
            // This prevents dropdown from showing before connection is complete
            if (userAccount && web3 && cryptoZombies) {
                console.log("Wallet connected, toggling dropdown");
                toggleWalletDropdown();
            } else {
                console.log("Wallet not connected, initiating connection");
                hideWalletDropdown(); // Make sure dropdown is hidden
                await connectWallet();
            }
        });
    } else {
        console.error("❌ Wallet button not found!");
    }
    
    // Wallet dropdown actions
    $('#closeWalletDropdown').click((e) => {
        e.stopPropagation();
        hideWalletDropdown();
    });
    
    $('#disconnectWalletBtn').click((e) => {
        e.stopPropagation();
        disconnectWallet();
    });
    
    $('#switchAccountBtn').click((e) => {
        e.stopPropagation();
        switchAccount();
    });
    
    $('#copyAddressBtn').click((e) => {
        e.stopPropagation();
        copyAddress();
    });
    
    // Close dropdown when clicking outside
    $(document).click((e) => {
        if (!$(e.target).closest('.wallet-container').length) {
            hideWalletDropdown();
        }
    });
    
    // Test button
    const testBtn = document.getElementById('testWallet');
    if (testBtn) {
        testBtn.addEventListener('click', function(e) {
            console.log("🧪 Test button clicked!");
            e.preventDefault();
            window.testWallet();
        });
    }

    // Modal events
    $('#confirmCreate').click(handleCreateZombie);
    $('#cancelCreate').click(() => closeModal('createZombieModal'));
    $('.close-btn').click((e) => {
        const modal = $(e.target).closest('.modal-overlay');
        modal.removeClass('active').hide();
    });
    
    // Name validation
    $('#zombieName').on('input', function() {
        const name = $(this).val().trim();
        const validation = $('#nameValidation');
        
        if (name.length === 0) {
            validation.text('Name cannot be empty').css('color', '#ff6b6b');
            $('#confirmCreate').prop('disabled', true);
        } else if (name.length > 25) {
            validation.text('Name too long (max 25 characters)').css('color', '#ff6b6b');
            $('#confirmCreate').prop('disabled', true);
        } else {
            validation.text('Name is valid').css('color', '#5cdb95');
            $('#confirmCreate').prop('disabled', false);
        }
    });

    // Add hover effect tracking
    document.addEventListener('mousemove', handleMouseMove);

    // Click sound removed

    // MetaMask Events
    if (window.ethereum) {
    ethereum.on('accountsChanged', () => {
        window.location.reload();
    });

    ethereum.on('chainChanged', () => {
        window.location.reload();
    });
    }
}

function handleMouseMove(e) {
    const zombies = document.querySelectorAll('.zombie');
    zombies.forEach(zombie => {
        const rect = zombie.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        zombie.style.setProperty('--x', `${(x / rect.width) * 100}%`);
        zombie.style.setProperty('--y', `${(y / rect.height) * 100}%`);
    });
}

// Zombie Creation Handler
async function handleCreateZombie() {
    const name = $('#zombieName').val().trim();
    
    if (!name) {
        showStatus("Please enter a zombie name!", "warning");
        return;
    }
    
    if (name.length > 25) {
        showStatus("Zombie name must be 25 characters or less!", "warning");
        return;
    }
    
    try {
        showLoading("Creating your zombie...");
        closeModal('createZombieModal');
        
        await createRandomZombie(name);
        
    } catch (error) {
        console.error("Error creating zombie:", error);
        showStatus("Error creating zombie: " + error.message, "error");
    } finally {
        hideLoading();
    }
}

function showCreateZombieModal() {
    console.log("📝 showCreateZombieModal called, userAccount:", userAccount);
    
    if (!userAccount) {
        console.log("❌ No userAccount, showing warning");
        showStatus("Please connect your MetaMask wallet first!", "warning");
        return;
    }

    console.log("✅ Opening create zombie modal");
    console.log("Modal overlay element:", document.getElementById('modalOverlay'));
    console.log("Create zombie modal element:", document.getElementById('createZombieModal'));
    
    // Show the modal from HTML
    const overlay = $('#modalOverlay');
    const modal = $('#createZombieModal');
    
    overlay.css('display', 'flex').addClass('active');
    modal.css('display', 'block').show();
    
    $('#zombieName').val('').focus();
    $('#nameValidation').text('');
    $('#confirmCreate').prop('disabled', false); // Enable button by default
    
    console.log("✅ Modal should now be visible");
}

// Helper function to get custom zombie name
function getCustomZombieName(zombieId, defaultName) {
    const rewardZombieNames = JSON.parse(localStorage.getItem('rewardZombieNames') || '{}');
    return rewardZombieNames[zombieId] || defaultName;
}

// Edit Zombie Name Function
window.editZombieName = function(zombieId, currentName) {
    console.log(`✏️ Edit name for zombie ${zombieId} (current: ${currentName})`);
    
    const modal = $(`
        <div class="modal-overlay active" id="editNameModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>✏️ Edit Zombie Name</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="text-align: center; margin-bottom: 20px; color: var(--text-secondary);">
                        Give your zombie a custom display name!
                    </p>
                    <input 
                        type="text" 
                        id="newZombieName" 
                        placeholder="Enter new name..." 
                        value="${currentName === 'NoName' ? '' : currentName}"
                        maxlength="25"
                        style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 16px; margin-bottom: 20px;"
                    >
                    <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-bottom: 20px;">
                        💡 This is a display name only (no gas fees). To change the blockchain name, level up to 2.
                    </p>
                    <button class="btn-primary" id="saveNameBtn" style="width: 100%;">Save Name</button>
                </div>
            </div>
        </div>
    `);

    $('body').append(modal);
    $('#newZombieName').focus();
    
    // Handle save
    $('#saveNameBtn').click(() => {
        const newName = $('#newZombieName').val().trim();
        
        if (!newName || newName === '') {
            showStatus("Please enter a name!", "warning");
            return;
        }
        
        // Save to localStorage
        const rewardZombieNames = JSON.parse(localStorage.getItem('rewardZombieNames') || '{}');
        rewardZombieNames[zombieId] = newName;
        localStorage.setItem('rewardZombieNames', JSON.stringify(rewardZombieNames));
        
        console.log(`💾 Saved name "${newName}" for zombie #${zombieId}`);
        showStatus(`Zombie renamed to "${newName}"!`, "success");
        
        modal.remove();
        handleShowZombies(); // Refresh display
    });
    
    // Handle enter key
    $('#newZombieName').on('keypress', (e) => {
        if (e.which === 13) {
            $('#saveNameBtn').click();
        }
    });
    
    // Handle close
    $('.close-btn', modal).click(() => modal.remove());
    modal.click((e) => {
        if ($(e.target).hasClass('modal-overlay')) {
        modal.remove();
        }
    });
};

function handleShowZombies() {
    if (!userAccount) {
        $("#txStatus").text("Please connect your MetaMask wallet first");
        return;
    }

    console.log("Show Zombies clicked. User account:", userAccount);
    $("#txStatus").text("Loading zombies...");
    
    getZombiesByOwner(userAccount)
        .then(result => {
            console.log("Zombies found:", result);
            displayZombies(result);
            $("#txStatus").text("Zombies loaded successfully!");
        })
        .catch(error => {
            console.error("Error:", error);
            $("#txStatus").text("Error loading zombies: " + error.message);
        });
}

function handleLevelUpButton() {
    if (!userAccount) {
        $("#txStatus").text("Please connect your MetaMask wallet first");
        return;
    }

    // First check if zombies are already displayed
    if ($("#zombies").children().length === 0) {
        // If no zombies are displayed, show them first
        $("#txStatus").text("Loading zombies...");
        getZombiesByOwner(userAccount)
            .then(result => {
                console.log("Zombies found:", result);
                displayZombies(result);
                $("#txStatus").text("Select a zombie to level up by clicking its 'Level Up' button!");
            })
            .catch(error => {
                console.error("Error:", error);
                $("#txStatus").text("Error loading zombies: " + error.message);
            });
    } else {
        // If zombies are already displayed, just update the message
        $("#txStatus").text("Select a zombie to level up by clicking its 'Level Up' button!");
    }
    
    // Add a visual highlight to the level up buttons to draw attention to them
    $(".level-up-btn").each(function() {
        $(this).addClass("highlight");
        setTimeout(() => {
            $(this).removeClass("highlight");
        }, 2000);
    });
}

// Section Navigation
function switchSection(section) {
    // Update navigation
    $('.nav-btn').removeClass('active');
    $(`.nav-btn[data-section="${section}"]`).addClass('active');
    
    // Update content sections
    $('.content-section').removeClass('active');
    $(`#${section}-section`).addClass('active');
    
    currentSection = section;
    
    // Load section-specific data
    switch (section) {
        case 'army':
            loadArmySection();
            break;
        case 'battle':
            loadBattleSection();
            break;
        case 'breeding':
            loadBreedingSection();
            break;
        case 'marketplace':
            loadMarketplaceSection();
            break;
        case 'leaderboard':
            loadLeaderboardSection();
            break;
    }
}

// Battle History Storage
let battleHistory = [];

// Load battle history from localStorage
function loadBattleHistory() {
    const saved = localStorage.getItem('battleHistory');
    if (saved) {
        battleHistory = JSON.parse(saved);
    }
    return battleHistory;
}

// Save battle history to localStorage
function saveBattleHistory() {
    localStorage.setItem('battleHistory', JSON.stringify(battleHistory));
}

// Add battle to history
function addBattleToHistory(battle) {
    battleHistory.unshift(battle); // Add to beginning
    if (battleHistory.length > 50) {
        battleHistory = battleHistory.slice(0, 50); // Keep last 50 battles
    }
    saveBattleHistory();
    updateBattleHistoryDisplay();
}

// Section Loaders
function loadArmySection() {
    if (userAccount) {
        handleShowZombies();
    }
}

function loadBattleSection() {
    loadBattleHistory();
    updateBattleHistoryDisplay();
}

async function loadBreedingSection() {
    console.log("🧬 Loading breeding section...");
    
    // Get user account from contracts.js
    const currentUser = getUserAccount();
    console.log("User account:", currentUser);
    
    if (!currentUser) {
        console.log("❌ No user account found!");
        $('#parent1Select').html('<option value="">Connect wallet first...</option>');
        $('#parent2Select').html('<option value="">Connect wallet first...</option>');
        return;
    }
    
    try {
        console.log("📊 Fetching zombies for breeding...");
        // Get user's zombies
        const zombies = await getZombiesByOwner(currentUser);
        console.log("✅ Zombies fetched:", zombies.length);
        
        if (zombies.length < 2) {
            const message = zombies.length === 0 ? 
                'No zombies yet! Create some first.' : 
                'You need at least 2 zombies to breed!';
            
            $('#parent1Select').html(`<option value="">${message}</option>`);
            $('#parent2Select').html(`<option value="">${message}</option>`);
            $('#breedingHint').text(message);
            return;
        }
        
        // Populate both dropdowns with zombies
        populateZombieSelect('parent1Select', zombies, null);
        populateZombieSelect('parent2Select', zombies, null);
        
        // Set up change handlers
        $('#parent1Select').off('change').on('change', function() {
            const zombieId = $(this).val();
            const parent2Id = $('#parent2Select').val();
            
            if (zombieId) {
                showZombiePreview('parent1Preview', zombieId, zombies);
            } else {
                $('#parent1Preview').empty();
            }
            
            // Update parent 2 dropdown to exclude selected parent 1
            populateZombieSelect('parent2Select', zombies, zombieId);
            
            // Restore parent 2 selection if it's still valid
            if (parent2Id && parent2Id !== zombieId) {
                $('#parent2Select').val(parent2Id);
            }
            
            checkBreedingReady();
        });
        
        $('#parent2Select').off('change').on('change', function() {
            const zombieId = $(this).val();
            const parent1Id = $('#parent1Select').val();
            
            if (zombieId) {
                showZombiePreview('parent2Preview', zombieId, zombies);
            } else {
                $('#parent2Preview').empty();
            }
            
            // Update parent 1 dropdown to exclude selected parent 2
            populateZombieSelect('parent1Select', zombies, zombieId);
            
            // Restore parent 1 selection if it's still valid
            if (parent1Id && parent1Id !== zombieId) {
                $('#parent1Select').val(parent1Id);
            }
            
            checkBreedingReady();
        });
        
        // Set up breed button
        $('#breedBtn').off('click').on('click', handleBreeding);
        
    } catch (error) {
        console.error("Error loading breeding section:", error);
        showStatus("Error loading breeding section: " + error.message, "error");
    }
}

function populateZombieSelect(selectId, zombies, excludeId = null) {
    const select = $(`#${selectId}`);
    const rewardZombieNames = JSON.parse(localStorage.getItem('rewardZombieNames') || '{}');
    
    let html = '<option value="">Select a zombie...</option>';
    
    zombies.forEach(zombie => {
        // Skip if this zombie should be excluded
        if (excludeId && zombie.id.toString() === excludeId.toString()) {
            return;
        }
        
        const displayName = rewardZombieNames[zombie.id] || zombie.name;
        const readyTime = parseInt(zombie.readyTime);
        const now = Math.floor(Date.now() / 1000);
        const isReady = readyTime <= now;
        const level = parseInt(zombie.level);
        const canBreed = level >= 2;
        
        let statusIcon = '';
        let disabled = false;
        
        if (!canBreed) {
            statusIcon = '🔒';
            disabled = true;
        } else if (!isReady) {
            statusIcon = '⏱️';
            disabled = true;
        } else {
            statusIcon = '✓';
        }
        
        html += `<option value="${zombie.id}" ${disabled ? 'disabled' : ''}>
            ${statusIcon} ${displayName} (Lvl ${zombie.level} | Wins: ${zombie.winCount})${!canBreed ? ' - Need Level 2+' : ''}
        </option>`;
    });
    
    select.html(html);
}

function showZombiePreview(previewId, zombieId, zombies) {
    const zombie = zombies.find(z => z.id.toString() === zombieId.toString());
    if (!zombie) return;
    
    const rewardZombieNames = JSON.parse(localStorage.getItem('rewardZombieNames') || '{}');
    const displayName = rewardZombieNames[zombie.id] || zombie.name;
    
    const preview = $(`#${previewId}`);
    preview.html(`
        <div style="padding: 1rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🧟</div>
            <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">${displayName}</h4>
            <p style="color: var(--text-secondary); margin: 0.25rem 0;">
                <strong>Level:</strong> ${zombie.level}
            </p>
            <p style="color: var(--text-secondary); margin: 0.25rem 0;">
                <strong>DNA:</strong> ${zombie.dna.slice(0, 8)}...
            </p>
            <p style="color: var(--text-secondary); margin: 0.25rem 0;">
                <strong>Wins:</strong> ${zombie.winCount} | <strong>Losses:</strong> ${zombie.lossCount}
            </p>
        </div>
    `);
}

function checkBreedingReady() {
    const parent1Id = $('#parent1Select').val();
    const parent2Id = $('#parent2Select').val();
    
    const breedBtn = $('#breedBtn');
    const hint = $('#breedingHint');
    
    if (!parent1Id || !parent2Id) {
        breedBtn.prop('disabled', true);
        hint.text('Select two zombies to start breeding');
        hint.css('color', 'var(--text-muted)');
        return;
    }
    
    if (parent1Id === parent2Id) {
        breedBtn.prop('disabled', true);
        hint.text('⚠️ Please select two DIFFERENT zombies!');
        hint.css('color', 'var(--danger-color)');
        return;
    }
    
    breedBtn.prop('disabled', false);
    hint.text('✓ Ready to breed! Click the button to create offspring.');
    hint.css('color', 'var(--success-color)');
}

// Prompt for offspring name before breeding
function promptForOffspringName() {
    return new Promise((resolve) => {
        const modal = $(`
            <div class="modal-overlay active" id="nameOffspringModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>🧬 Name Your Offspring</h3>
                        <button class="close-btn" id="cancelNameBtn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: var(--text-secondary); margin-bottom: 20px;">
                            Choose a name for your new zombie before breeding!
                        </p>
                        <input 
                            type="text" 
                            id="offspringNameInput" 
                            placeholder="Enter zombie name (max 25 characters)" 
                            maxlength="25"
                            style="width: 100%; padding: 12px; border: 2px solid var(--primary-color); border-radius: 8px; background: var(--bg-glass); color: var(--text-primary); font-size: 1rem;"
                        />
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 8px;">
                            💡 Tip: Make it unique and memorable!
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="cancelOffspringBtn">Cancel</button>
                        <button class="btn-primary" id="confirmOffspringBtn">Continue to Breed</button>
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(modal);
        $('#offspringNameInput').focus();
        
        // Handle confirm
        $('#confirmOffspringBtn').click(() => {
            const name = $('#offspringNameInput').val().trim();
            
            if (!name || name === '') {
                showStatus("Please enter a name for your offspring!", "warning");
                return;
            }
            
            if (name.length > 25) {
                showStatus("Name too long! Maximum 25 characters.", "warning");
                return;
            }
            
            modal.remove();
            resolve(name);
        });
        
        // Handle cancel
        $('#cancelOffspringBtn, #cancelNameBtn').click(() => {
            modal.remove();
            resolve(null);
        });
        
        // Handle enter key
        $('#offspringNameInput').on('keypress', (e) => {
            if (e.which === 13) {
                $('#confirmOffspringBtn').click();
            }
        });
        
        // Handle escape key
        $(document).on('keydown.offspringModal', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                resolve(null);
                $(document).off('keydown.offspringModal');
            }
        });
        
        // Handle close on overlay click
        modal.click((e) => {
            if ($(e.target).hasClass('modal-overlay')) {
                modal.remove();
                resolve(null);
            }
        });
    });
}

async function handleBreeding() {
    const parent1Id = $('#parent1Select').val();
    const parent2Id = $('#parent2Select').val();
    
    if (!parent1Id || !parent2Id || parent1Id === parent2Id) {
        showStatus("Please select two different zombies!", "warning");
        return;
    }
    
    // First, prompt for offspring name
    const offspringName = await promptForOffspringName();
    
    if (!offspringName) {
        showStatus("Breeding cancelled - name is required", "warning");
        return;
    }
    
    try {
        console.log("🧬 Starting breeding process...");
        console.log("Parent 1:", parent1Id);
        console.log("Parent 2:", parent2Id);
        console.log("Offspring Name:", offspringName);
        
        // Show initial loading
        showLoading("Breeding zombies and mixing DNA... 🧬");
        
        // Try simple breeding first (uses feedAndMultiply - always available)
        const result = await breedZombiesSimple(parent1Id, parent2Id, offspringName);
        
        hideLoading();
        
        console.log("✅ Breeding successful!", result);
        console.log("✅ Offspring DNA mixed from parents!");
        
        // Show success message
        showStatus("🎉 Breeding successful! Offspring created with mixed DNA!", "success");
        
        // Get parent names and DNA info
        const parent1Name = result.parent1Name || "Parent 1";
        const parent2Name = result.parent2Name || "Parent 2";
        
        // Get DNA info for display
        const offspringDNA = result.offspring ? result.offspring.dna : "Unknown";
        const parent1DNA = result.parent1DNA || "Unknown";
        const parent2DNA = result.parent2DNA || "Unknown";
        
        // Show results
        const modal = $(`
            <div class="modal-overlay active" id="breedingResultsModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>🎉 Breeding Successful!</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body" style="text-align: center;">
                        <div style="font-size: 80px; margin: 20px 0;">🧬</div>
                        <h2>New Offspring Created!</h2>
                        <div style="margin: 20px 0;">
                            <div style="font-size: 3rem; margin: 10px 0;">🧟</div>
                            <h3 style="color: var(--primary-color);">${offspringName}</h3>
                        </div>
                        
                        <div style="background: var(--bg-glass); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid var(--primary-color);">
                            <h4 style="color: var(--primary-color); margin-bottom: 15px;">🧬 DNA Mixing Results</h4>
                            <div style="text-align: left; color: var(--text-secondary); font-size: 0.9rem; font-family: monospace;">
                                <p style="margin: 8px 0;">
                                    <strong>👨 Parent 1 (${parent1Name}):</strong><br>
                                    <span style="color: var(--accent-color);">DNA: ${parent1DNA}</span>
                                </p>
                                <p style="margin: 8px 0;">
                                    <strong>👩 Parent 2 (${parent2Name}):</strong><br>
                                    <span style="color: var(--accent-color);">DNA: ${parent2DNA}</span>
                                </p>
                                <div style="text-align: center; margin: 12px 0; font-size: 1.5rem;">⬇️ + ⬇️ = 🧬</div>
                                <p style="margin: 8px 0;">
                                    <strong>👶 Offspring (${offspringName}):</strong><br>
                                    <span style="color: var(--success-color); font-weight: bold;">DNA: ${offspringDNA}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div style="background: var(--bg-glass); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                ✨ The offspring's DNA was calculated using a genetic algorithm<br>
                                that mixes both parent DNAs with a 5% mutation chance!
                            </p>
                        </div>
                        
                        <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin: 15px 0;">
                            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">
                                Transaction: ${result.transactionHash.slice(0, 10)}...${result.transactionHash.slice(-8)}
                            </p>
                        </div>
                        <button class="btn-primary" id="viewOffspringBtn" style="margin-top: 20px;">
                            🎉 View My Army
                        </button>
                    </div>
                </div>
            </div>
        `);
        
        $('body').append(modal);
        
        $('#viewOffspringBtn').click(() => {
            modal.remove();
            switchSection('army');
            handleShowZombies();
        });
        
        $('.close-btn', modal).click(() => {
            modal.remove();
            // Refresh zombie list when modal is closed
            if (currentSection === 'army') {
                handleShowZombies();
            }
        });
        
        // Refresh the zombie list immediately in the background
        setTimeout(async () => {
            try {
                const zombies = await getZombiesByOwner(userAccount);
                userZombies = zombies;
                console.log("✅ Zombie list refreshed. Total zombies:", zombies.length);
                
                // If user is on army section, update display
                if (currentSection === 'army') {
                    displayZombies(zombies);
                }
                
                // Reset breeding interface with updated zombie list
                $('#parent1Select').val('');
                $('#parent2Select').val('');
                $('#parent1Preview').empty();
                $('#parent2Preview').empty();
                loadBreedingSection();
            } catch (error) {
                console.error("Error refreshing zombie list:", error);
            }
        }, 1500);
        
    } catch (error) {
        console.error("❌ Breeding error:", error);
        hideLoading();
        showStatus("Breeding failed: " + error.message, "error");
    }
}

function loadMarketplaceSection() {
    if (enhancedMarketplace) {
        enhancedMarketplace.updateMarketplaceDisplay();
    } else {
        // Initialize if not already done
        initializeEnhancedMarketplace();
    }
}

async function loadLeaderboardSection() {
    if (leaderboard) {
        // Refresh leaderboard data from blockchain
        await leaderboard.loadLeaderboardData();
    }
}

// Modal Functions (showCreateZombieModal is defined earlier in the file)

function closeModal(modalId) {
    $('#modalOverlay').removeClass('active').hide();
    $(`#${modalId}`).hide();
}

function showStatus(message, type = 'info') {
    const statusElement = $('#txStatus');
    statusElement.text(message);
    statusElement.removeClass('success error warning info');
    statusElement.addClass(type);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusElement.text('');
        statusElement.removeClass('success error warning info');
    }, 5000);
}

function showLoading(message = 'Loading...') {
    $('#loadingOverlay').addClass('active').show();
    $('.loading-text').text(message);
}

function hideLoading() {
    $('#loadingOverlay').removeClass('active').hide();
}

// Enhanced wallet connection handler (overrides the simple one in HTML)
function enhancedWalletConnection() {
    console.log("🔗 Enhanced wallet connection called");
    try {
        console.log("🔍 Checking for MetaMask...");
        if (!window.ethereum) {
            console.log("❌ MetaMask not found");
            showStatus("Please install MetaMask to use this application", "error");
            return;
        }

        console.log("✅ MetaMask found, requesting connection...");
        showLoading("Connecting to MetaMask...");
        
        // The actual connection will be handled by the inline function
        // This is just for additional UI updates
        
    } catch (error) {
        console.error("❌ Error connecting wallet:", error);
        showStatus("Failed to connect wallet: " + error.message, "error");
        hideLoading();
    }
}

// Initialize the application
async function initializeApp() {
    try {
        // Set up event listeners first
        initializeEventListeners();
        
        // Initialize all systems
        initializeSystems();
        
        // Create background particles
        createParticles();

        // Update wallet status
        updateWalletStatus();

        // Check if MetaMask is available and if user connected before
        if (window.ethereum) {
            // Check if user manually disconnected
            const userDisconnected = localStorage.getItem('userDisconnected') === 'true';
            
            if (userDisconnected) {
                console.log("🚫 User previously disconnected, skipping auto-connect");
                // DON'T remove the flag here - keep it until user manually connects
                return; // Skip auto-connect entirely
            }
            
            // Check if wallet was connected before (from localStorage)
            const wasConnected = localStorage.getItem('walletConnected') === 'true';
            
            if (!wasConnected) {
                console.log("No previous connection found");
                return; // Skip auto-connect if never connected
            }
            
            try {
                // Check current MetaMask accounts
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (accounts && accounts.length > 0) {
                    console.log("🔗 Auto-connecting to wallet:", accounts[0]);
                    const success = await initializeWeb3();
                    if (success) {
                        console.log("✅ Wallet auto-connected successfully");
                        updateWalletStatus(); // Update UI to show address
                        
                        // Verify contract deployment
                        if (typeof verifyContractDeployment === 'function') {
                            const contractOk = await verifyContractDeployment();
                            if (!contractOk) {
                                showStatus("⚠️ Contract needs redeployment! Run: rm -rf build/ && npm run dev", "warning");
                            }
                        }
                        
                        await loadInitialData();
                    }
                } else {
                    console.log("⚠️ Wallet was connected before but no accounts found now");
                    localStorage.removeItem('walletConnected');
                }
            } catch (error) {
                console.log("No existing connection, user needs to connect manually");
                localStorage.removeItem('walletConnected');
            }
        }

    } catch (error) {
        console.error("Error initializing app:", error);
        showStatus(error.message || "Failed to initialize application", "error");
    }
}

function initializeSystems() {
    // Initialize all game systems
    battleArena = new BattleArena();
    breedingSystem = new BreedingSystem();
    leaderboard = new Leaderboard();
    
    // Marketplace is initialized separately via marketplace-new.js
    // Don't create a duplicate instance here!
    
    console.log("All systems initialized successfully");
}

async function loadInitialData() {
    try {
        // Load user's zombies
        const zombies = await getZombiesByOwner(userAccount);
        userZombies = zombies;
        
        // Update displays
        if (currentSection === 'army') {
            displayZombies(zombies);
        }
        
        // Update wallet balance
        updateUserBalance();
        
    } catch (error) {
        console.error("Error loading initial data:", error);
    }
}

function updateWalletStatus() {
    const walletStatus = $('#walletStatus');
    const userBalance = $('#userBalance');
    
    if (userAccount) {
        // Show shortened wallet address
        const shortAddress = userAccount.substring(0, 6) + '...' + userAccount.substring(userAccount.length - 4);
        walletStatus.text('🔗 ' + shortAddress);
        walletStatus.css('color', 'var(--success-color)');
        walletStatus.attr('title', 'Click to manage wallet');
        userBalance.show();
        
        // Update dropdown info
        $('#fullWalletAddress').text(userAccount);
        updateUserBalance().then(() => {
            const balance = $('#userBalance').text();
            $('#dropdownBalance').text(balance);
        });
    } else {
        walletStatus.text('🔌 Connect Wallet');
        walletStatus.css('color', 'var(--text-secondary)');
        walletStatus.attr('title', 'Click to connect');
        userBalance.hide();
        hideWalletDropdown();
    }
}

// Wallet dropdown functions
function toggleWalletDropdown() {
    const dropdown = $('#walletDropdown');
    if (dropdown.is(':visible')) {
        hideWalletDropdown();
    } else {
        showWalletDropdown();
    }
}

function showWalletDropdown() {
    $('#walletDropdown').fadeIn(200);
}

function hideWalletDropdown() {
    $('#walletDropdown').fadeOut(200);
}

function disconnectWallet() {
    console.log("🚪 Disconnecting wallet...");
    
    // Clear user data
    userAccount = null;
    web3 = null;
    cryptoZombies = null;
    userZombies = [];
    
    // Clear localStorage - add flag to prevent auto-reconnect
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('connectedAccount');
    localStorage.setItem('userDisconnected', 'true');
    
    console.log("✅ Disconnect flag set. Wallet will stay disconnected until you manually reconnect.");
    
    // Update UI
    updateWalletStatus();
    hideWalletDropdown();
    
    showStatus("Wallet disconnected. Page will reload...", "success");
    
    // Reload page to reset state
    setTimeout(() => {
        window.location.reload();
    }, 800);
}

async function switchAccount() {
    console.log("🔄 Switching account...");
    hideWalletDropdown();
    
    try {
        if (!window.ethereum) {
            showStatus("MetaMask not found!", "error");
            return;
        }
        
        showLoading("Opening MetaMask...");
        
        // Request account change in MetaMask
        await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{
                eth_accounts: {}
            }]
        });
        
        // Get new account
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
            console.log("✅ Switched to account:", accounts[0]);
            
            // Reload page with new account
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('connectedAccount', accounts[0]);
            
            hideLoading();
            showStatus("Switching account...", "success");
            
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    } catch (error) {
        hideLoading();
        console.error("Error switching account:", error);
        
        if (error.code === 4001) {
            showStatus("Account switch cancelled", "warning");
        } else {
            showStatus("Failed to switch account", "error");
        }
    }
}

function copyAddress() {
    if (!userAccount) return;
    
    // Copy to clipboard
    navigator.clipboard.writeText(userAccount).then(() => {
        console.log("✅ Address copied to clipboard");
        showStatus("Address copied to clipboard!", "success");
        
        // Visual feedback
        const btn = $('#copyAddressBtn');
        const originalText = btn.html();
        btn.html('✅ Copied!');
        btn.css('background', 'var(--success-color)');
        
        setTimeout(() => {
            btn.html(originalText);
            btn.css('background', '');
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy:", err);
        showStatus("Failed to copy address", "error");
    });
}

async function updateUserBalance() {
    if (!userAccount) return;
    
    try {
        const balance = await web3.eth.getBalance(userAccount);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');
        $('#userBalance').text(`${parseFloat(balanceInEth).toFixed(4)} ETH`);
    } catch (error) {
        console.error("Error getting balance:", error);
    }
}

// Connect wallet function
async function connectWallet() {
    console.log("🔗 Attempting to connect wallet...");
    console.log("Current walletConnected flag:", localStorage.getItem('walletConnected'));
    console.log("Current userDisconnected flag:", localStorage.getItem('userDisconnected'));
    
    try {
        if (!window.ethereum) {
            showStatus("Please install MetaMask to use this application!", "error");
            return;
        }

        showLoading("Opening MetaMask...");
        
        // Clear disconnect flag when user manually connects
        const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
        if (wasDisconnected) {
            console.log("🔄 Clearing disconnect flag - re-enabling auto-connect");
            localStorage.removeItem('userDisconnected');
        }
        
        // Initialize Web3 and connect
        // This will show MetaMask popup
        console.log("📡 Calling initializeWeb3...");
        const success = await initializeWeb3();
        console.log("initializeWeb3 result:", success);
        
        if (success) {
            console.log("✅ Connection successful, updating UI...");
            
            // Update UI
            updateWalletStatus();
            await updateUserBalance();
            
            // ONLY set connection flag AFTER successful connection
            localStorage.setItem('walletConnected', 'true');
            console.log("📝 Set walletConnected flag to true");
            
            // Load user data
            await loadInitialData();
            
            hideLoading();
            showStatus("Wallet connected successfully! 🎉", "success");
            
            console.log("✅ Wallet fully connected:", userAccount);
            console.log("📝 Auto-connect enabled for future sessions");
        } else {
            console.log("❌ Connection failed");
            hideLoading();
            showStatus("Failed to connect wallet", "error");
        }
    } catch (error) {
        hideLoading();
        console.error("❌ Wallet connection error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        // Don't set walletConnected flag on error
        localStorage.removeItem('walletConnected');
        
        if (error.code === 4001) {
            showStatus("Connection rejected. Please approve the connection in MetaMask.", "warning");
        } else if (error.code === -32002) {
            showStatus("MetaMask is already open. Please check your MetaMask window.", "warning");
        } else {
            showStatus(`Failed to connect wallet: ${error.message}`, "error");
        }
    }
}

function updateBreedingInterface() {
    // Update breeding interface with user's zombies
    if (breedingSystem && userZombies.length > 0) {
        // This will be handled by the breeding system
        console.log("Breeding interface updated with user zombies");
    }
}

// Update Battle History Display
function updateBattleHistoryDisplay() {
    const battles = loadBattleHistory();
    
    // Calculate stats
    const totalBattles = battles.length;
    const victories = battles.filter(b => b.result === 'victory').length;
    const defeats = battles.filter(b => b.result === 'defeat').length;
    const winRate = totalBattles > 0 ? Math.round((victories / totalBattles) * 100) : 0;
    
    // Update stats
    $('#totalBattles').text(totalBattles);
    $('#totalVictories').text(victories);
    $('#totalDefeats').text(defeats);
    $('#winRate').text(winRate + '%');
    
    // Update history list
    const historyList = $('#battleHistoryList');
    
    if (battles.length === 0) {
        historyList.html(`
            <div class="empty-state">
                <div class="empty-icon">⚔️</div>
                <p>No battles yet!</p>
                <p class="empty-hint">Go to your Army and click the ⚔️ Battle button to start your first battle.</p>
            </div>
        `);
        return;
    }
    
    // Display battles
    historyList.empty();
    battles.forEach(battle => {
        const resultClass = battle.result === 'victory' ? 'victory' : 'defeat';
        const resultIcon = battle.result === 'victory' ? '🏆' : '💔';
        const resultText = battle.result === 'victory' ? 'VICTORY' : 'DEFEAT';
        
        const battleItem = $(`
            <div class="battle-item ${resultClass}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">
                            ${resultIcon} ${resultText}
                        </h4>
                        <p style="margin: 0.25rem 0; color: var(--text-secondary);">
                            <strong>${battle.attacker}</strong> vs <strong>${battle.defender}</strong>
                        </p>
                        <p style="margin: 0.25rem 0; font-size: 0.9rem; color: var(--text-muted);">
                            ${new Date(battle.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        ${battle.result === 'victory' ? `
                            <p style="margin: 0.25rem 0; color: var(--success-color);">+1 Level</p>
                            <p style="margin: 0.25rem 0; color: var(--success-color);">+1 Win</p>
                            <p style="margin: 0.25rem 0; color: var(--accent-color);">+1 Zombie</p>
                        ` : `
                            <p style="margin: 0.25rem 0; color: var(--danger-color);">+1 Loss</p>
                            <p style="margin: 0.25rem 0; color: var(--warning-color);">Cooldown</p>
                        `}
                    </div>
                </div>
            </div>
        `);
        
        historyList.append(battleItem);
    });
}

// Wait for the page to load before initializing
window.addEventListener('load', () => {
    console.log("🚀 CryptoZombies Arena initializing...");
    initializeApp();
});

// Note: testWallet is defined in index.html inline script

// Simple wallet connection function
window.simpleConnect = async function() {
    console.log("🔗 Simple wallet connection...");
    try {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("✅ Simple connection successful:", accounts);
        alert("Connected! Account: " + accounts[0]);
    } catch (error) {
        console.error("❌ Simple connection failed:", error);
        alert("Connection failed: " + error.message);
    }
};

// Quick Battle Function - Select opponent from your zombies
window.quickBattle = async function(attackerId) {
    console.log("⚔️ Quick Battle initiated with zombie:", attackerId);
    
    try {
        if (!userAccount) {
            showStatus("Please connect your wallet first!", "error");
            return;
        }

        // Get all user's zombies
        const zombies = await getZombiesByOwner(userAccount);
        
        if (zombies.length < 2) {
            showStatus("You need at least 2 zombies to battle! Create another zombie first.", "warning");
            return;
        }

        // Filter out the attacker to show only opponents
        const opponents = zombies.filter(z => z.id.toString() !== attackerId.toString());

        // Show opponent selection modal
        const modal = $(`
            <div class="modal-overlay active" id="opponentSelectionModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>⚔️ Select Your Opponent</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="text-align: center; margin-bottom: 20px;">
                            Choose which zombie to battle against!
                        </p>
                        <div class="zombie-selection-grid">
                            ${opponents.map(zombie => `
                                <div class="zombie-selection-card" data-zombie-id="${zombie.id}">
                                    <div class="zombie-avatar" style="font-size: 48px;">🧟</div>
                                    <div class="zombie-info">
                                        <h4>${zombie.name}</h4>
                                        <p><strong>Level:</strong> ${zombie.level}</p>
                                        <p><strong>Wins:</strong> ${zombie.winCount} | <strong>Losses:</strong> ${zombie.lossCount}</p>
                                        <p><strong>Power:</strong> ${parseInt(zombie.level) + parseInt(zombie.winCount) - parseInt(zombie.lossCount)}</p>
                                    </div>
                                    <button class="btn-primary select-opponent-btn">Select Opponent</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);

        console.log("✅ Opponent selection modal shown");

        // Handle opponent selection with event delegation
        $('#opponentSelectionModal').on('click', '.select-opponent-btn', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("🎯 Opponent selected!");
            
            const targetId = $(e.target).closest('.zombie-selection-card').data('zombie-id');
            console.log(`Battle: Zombie ${attackerId} vs Zombie ${targetId}`);
            
            modal.remove();
            
            // Perform the battle
            try {
                await performQuickBattle(attackerId, targetId);
            } catch (error) {
                console.error("❌ Battle failed:", error);
                showStatus("Battle failed: " + error.message, "error");
            }
        });

        // Close modal
        $('#opponentSelectionModal').on('click', '.close-btn', () => {
            console.log("Closing opponent selection modal");
            modal.remove();
        });
        
    } catch (error) {
        console.error("Error in quickBattle:", error);
        showStatus("Error starting battle: " + error.message, "error");
    }
};

// Perform the actual battle
async function performQuickBattle(attackerId, targetId) {
    console.log("🚀 performQuickBattle called with:", attackerId, targetId);
    
    try {
        showLoading("Battle in progress...");
        
        console.log(`🗡️ Battle starting: Zombie ${attackerId} vs Zombie ${targetId}`);
        console.log("📊 Getting initial zombie states...");
        
        // Get initial zombie states
        const attackerBefore = await getZombieDetails(attackerId);
        console.log("✅ Attacker details:", attackerBefore);
        
        const targetBefore = await getZombieDetails(targetId);
        console.log("✅ Target details:", targetBefore);
        
        // Get custom names from localStorage
        const attackerDisplayName = getCustomZombieName(attackerId, attackerBefore.name);
        const targetDisplayName = getCustomZombieName(targetId, targetBefore.name);
        
        showStatus(`${attackerDisplayName} is attacking ${targetDisplayName}!`, "info");
        
        // Call the smart contract attack function
        const result = await attackZombie(attackerId, targetId);
        
        console.log("✅ Battle result:", result);
        
        // Get updated zombie states
        const attackerAfter = result.myZombie;
        const targetAfter = result.enemyZombie;
        
        hideLoading();
        
        // Determine winner
        const attackerWon = parseInt(attackerAfter.winCount) > parseInt(attackerBefore.winCount);
        
        if (attackerWon) {
            showStatus(`🎉 VICTORY! ${attackerDisplayName} wins and gained a level!`, "success");
            
            // Save to battle history with display names
            addBattleToHistory({
                timestamp: Date.now(),
                attacker: attackerDisplayName,
                defender: targetDisplayName,
                result: 'victory',
                attackerId: attackerId,
                targetId: targetId
            });
            
            // Show battle results modal with name input for reward zombie
            const resultsModal = $(`
                <div class="modal-overlay active" id="battleResultsModal">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>🎉 VICTORY!</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="modal-body" style="text-align: center;">
                            <div style="font-size: 80px; margin: 20px 0;">🏆</div>
                            <h2>${attackerDisplayName} WINS!</h2>
                            <div style="margin: 20px 0;">
                                <h4>Battle Results:</h4>
                                <p><strong>${attackerDisplayName}</strong></p>
                                <p>Level: ${attackerBefore.level} → ${attackerAfter.level} (+1 ⬆️)</p>
                                <p>Wins: ${attackerBefore.winCount} → ${attackerAfter.winCount} (+1)</p>
                                <hr style="margin: 20px 0; border-color: var(--border-color);">
                                <p><strong>${targetDisplayName}</strong></p>
                                <p>Losses: ${targetBefore.lossCount} → ${targetAfter.lossCount} (+1)</p>
                            </div>
                            
                            <div style="background: var(--bg-glass); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid var(--success-color);">
                                <h3 style="color: var(--success-color); margin-bottom: 15px;">🎁 Reward: New Zombie Created!</h3>
                                <p style="margin-bottom: 15px; color: var(--text-secondary);">
                                    A new zombie was created from the battle!<br>
                                    Give it a name (or leave as "NoName"):
                                </p>
                                <input 
                                    type="text" 
                                    id="rewardZombieName" 
                                    placeholder="Enter zombie name..." 
                                    maxlength="25"
                                    style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 16px; margin-bottom: 10px;"
                                >
                                <p style="font-size: 0.85rem; color: var(--text-muted);">
                                    💡 You can rename it later when it reaches level 2
                                </p>
                            </div>
                            
                            <button class="btn-primary" id="viewZombiesBtn">Continue</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(resultsModal);
            
            // Focus on name input
            $('#rewardZombieName').focus();
            
            // Handle enter key in name input
            $('#rewardZombieName').on('keypress', function(e) {
                if (e.which === 13) { // Enter key
                    $('#viewZombiesBtn').click();
                }
            });
            
            $('#viewZombiesBtn').click(async () => {
                const newName = $('#rewardZombieName').val().trim();
                
                // Store the desired name for the newest zombie
                if (newName && newName !== '' && newName !== 'NoName') {
                    // Save the name preference to localStorage
                    // We'll apply it when displaying zombies
                    const rewardZombieNames = JSON.parse(localStorage.getItem('rewardZombieNames') || '{}');
                    
                    // Get the newest zombie (it will be the last one)
                    try {
                        const allZombies = await getZombiesByOwner(userAccount);
                        if (allZombies.length > 0) {
                            const newestZombie = allZombies[allZombies.length - 1];
                            rewardZombieNames[newestZombie.id] = newName;
                            localStorage.setItem('rewardZombieNames', JSON.stringify(rewardZombieNames));
                            console.log(`💾 Saved preferred name "${newName}" for zombie #${newestZombie.id}`);
                            showStatus(`Named reward zombie "${newName}"! (Display name only)`, "success");
                        }
                    } catch (error) {
                        console.error("Error getting newest zombie:", error);
                    }
                }
                
                resultsModal.remove();
                handleShowZombies();
            });
            
            $('.close-btn', resultsModal).click(() => resultsModal.remove());
            
        } else {
            showStatus(`😢 DEFEAT! ${attackerDisplayName} lost the battle.`, "error");
            
            // Save to battle history with display names
            addBattleToHistory({
                timestamp: Date.now(),
                attacker: attackerDisplayName,
                defender: targetDisplayName,
                result: 'defeat',
                attackerId: attackerId,
                targetId: targetId
            });
            
            // Show battle results modal
            const resultsModal = $(`
                <div class="modal-overlay active" id="battleResultsModal">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>😢 DEFEAT</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="modal-body" style="text-align: center;">
                            <div style="font-size: 80px; margin: 20px 0;">💔</div>
                            <h2>${attackerDisplayName} Lost</h2>
                            <div style="margin: 20px 0;">
                                <h4>Battle Results:</h4>
                                <p><strong>${attackerDisplayName}</strong></p>
                                <p>Losses: ${attackerBefore.lossCount} → ${attackerAfter.lossCount} (+1)</p>
                                <p>⏱️ Must wait for cooldown...</p>
                                <hr>
                                <p><strong>${targetDisplayName}</strong></p>
                                <p>Wins: ${targetBefore.winCount} → ${targetAfter.winCount} (+1)</p>
                            </div>
                            <button class="btn-primary" id="viewZombiesBtn">View My Zombies</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(resultsModal);
            
            $('#viewZombiesBtn').click(() => {
                resultsModal.remove();
                handleShowZombies();
            });
            
            $('.close-btn', resultsModal).click(() => resultsModal.remove());
        }
        
        // Refresh the zombie display after a short delay
        setTimeout(() => {
            handleShowZombies();
        }, 500);
        
    } catch (error) {
        console.error("❌ Battle error:", error);
        hideLoading();
        showStatus("Battle failed: " + error.message, "error");
    }
} 