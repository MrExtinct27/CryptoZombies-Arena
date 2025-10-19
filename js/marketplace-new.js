// ===== ENHANCED MARKETPLACE SYSTEM =====

class EnhancedMarketplace {
    constructor() {
        this.currentView = 'market'; // 'market' or 'sell'
        this.selectedZombieForSale = null;
        this.isSubmitting = false; // Prevent duplicate submissions
        this.init();
    }

    init() {
        console.log("🏪 Initializing Enhanced Marketplace...");
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log("🔧 Setting up marketplace event listeners...");
        
        // Toggle between views - use event delegation
        $(document).on('click', '#marketToggleBtn', () => this.switchToMarketView());
        $(document).on('click', '#sellToggleBtn', () => this.switchToSellView());
        
        // Selling actions - all using event delegation
        $(document).on('click', '.zombie-sell-card', (e) => this.selectZombieForSale(e));
        $(document).on('click', '#submitListingBtn', () => {
            console.log("🏷️ Submit listing button clicked");
            this.submitListing();
        });
        $(document).on('click', '#cancelSelectionBtn, #cancelSelectionBtn2', () => this.cancelZombieSelection());
        
        // Buying actions
        $(document).on('click', '.buy-zombie-btn', (e) => this.buyZombie(e));
        
        // Filter and search
        $(document).on('input', '#marketSearchInput', () => this.filterMarketListings());
        $(document).on('change', '#marketSortSelect', () => this.sortMarketListings());
        
        console.log("✅ Marketplace event listeners set up");
    }

    // ===== VIEW SWITCHING =====
    
    switchToMarketView() {
        this.currentView = 'market';
        $('#sellToggleBtn').removeClass('active');
        $('#marketToggleBtn').addClass('active');
        $('#sellView').hide();
        $('#marketView').show();
        this.loadMarketListings();
    }

    switchToSellView() {
        if (!userAccount) {
            showStatus("Please connect your wallet first!", "error");
            return;
        }
        this.currentView = 'sell';
        $('#marketToggleBtn').removeClass('active');
        $('#sellToggleBtn').addClass('active');
        $('#marketView').hide();
        $('#sellView').show();
        this.loadUserZombiesForSale();
    }

    // ===== SELLING FUNCTIONALITY =====
    
    async loadUserZombiesForSale() {
        if (!userAccount) return;
        
        try {
            showLoading("Loading your zombies...");
            const zombies = await getZombiesByOwner(userAccount);
            hideLoading();
            
            if (zombies.length === 0) {
                $('#zombiesForSaleList').html(`
                    <div class="empty-state">
                        <div style="font-size: 4rem; margin-bottom: 20px;">🧟</div>
                        <h3>No Zombies Available</h3>
                        <p>Create some zombies first to list them for sale!</p>
                        <button class="btn-primary" onclick="switchSection('army')">Create Zombie</button>
                    </div>
                `);
                return;
            }
            
            this.displayZombiesForSale(zombies);
        } catch (error) {
            hideLoading();
            console.error("Error loading zombies:", error);
            showStatus("Error loading your zombies", "error");
        }
    }

    displayZombiesForSale(zombies) {
        const zombiesHTML = zombies.map(zombie => `
            <div class="zombie-sell-card" data-zombie-id="${zombie.id}" data-zombie='${JSON.stringify(zombie)}'>
                <div class="zombie-card-content">
                    <div class="zombie-avatar" style="font-size: 3rem;">🧟</div>
                    <div class="zombie-details">
                        <h4 class="zombie-name">${zombie.name}</h4>
                        <div class="zombie-stats">
                            <span class="stat-badge">⭐ Level ${zombie.level}</span>
                            <span class="stat-badge">💪 ${zombie.winCount} Wins</span>
                            <span class="stat-badge">🧬 DNA: ${String(zombie.dna).substring(0, 8)}...</span>
                        </div>
                    </div>
                    <div class="select-indicator">
                        <div class="check-icon">✓</div>
                    </div>
                </div>
            </div>
        `).join('');

        $('#zombiesForSaleList').html(`
            <div class="zombies-grid">
                ${zombiesHTML}
            </div>
        `);

        // Hide listing form initially
        $('#listingFormContainer').hide();
        this.selectedZombieForSale = null;
    }

    selectZombieForSale(event) {
        const card = $(event.currentTarget);
        const zombieData = card.data('zombie');
        
        // Remove previous selection
        $('.zombie-sell-card').removeClass('selected');
        
        // Select this card
        card.addClass('selected');
        
        // Store selected zombie
        this.selectedZombieForSale = zombieData;
        
        // Show listing form
        this.showListingForm(zombieData);
    }

    showListingForm(zombie) {
        $('#selectedZombieName').text(zombie.name);
        $('#selectedZombieInfo').html(`
            <div class="selected-zombie-preview">
                <div style="font-size: 4rem; margin-bottom: 10px;">🧟</div>
                <p><strong>Level ${zombie.level}</strong></p>
                <p>Wins: ${zombie.winCount} | Losses: ${zombie.lossCount}</p>
                <p class="zombie-dna">DNA: ${zombie.dna}</p>
            </div>
        `);
        
        // Reset form
        $('#zombiePriceInput').val('');
        $('#zombieDescriptionInput').val('');
        
        // Show form with animation
        $('#listingFormContainer').slideDown(300);
        $('#zombiePriceInput').focus();
    }

    cancelZombieSelection() {
        $('.zombie-sell-card').removeClass('selected');
        $('#listingFormContainer').slideUp(300);
        this.selectedZombieForSale = null;
    }

    async submitListing() {
        console.log("📝 submitListing called");
        
        // PREVENT DUPLICATE SUBMISSIONS
        if (this.isSubmitting) {
            console.log("⚠️ Already submitting, ignoring duplicate click");
            return;
        }
        
        console.log("Selected zombie:", this.selectedZombieForSale);
        console.log("User account:", userAccount);
        console.log("Web3 instance:", typeof web3);
        console.log("CryptoZombies contract:", typeof cryptoZombies);
        
        // Check wallet connection
        if (!userAccount) {
            console.error("❌ No wallet connected!");
            showStatus("Please connect your wallet first!", "error");
            return;
        }
        
        // Check Web3
        if (!web3 || !cryptoZombies) {
            console.error("❌ Web3 or contract not initialized!");
            showStatus("Please refresh the page and reconnect your wallet", "error");
            return;
        }
        
        if (!this.selectedZombieForSale) {
            showStatus("Please select a zombie first!", "warning");
            return;
        }

        const price = $('#zombiePriceInput').val();
        const description = $('#zombieDescriptionInput').val();
        
        console.log("📊 Form values - Price:", price, "Description:", description);

        if (!price || parseFloat(price) <= 0) {
            showStatus("Please enter a valid price!", "warning");
            $('#zombiePriceInput').focus();
            return;
        }

        if (!description || description.trim() === '') {
            showStatus("Please add a description!", "warning");
            $('#zombieDescriptionInput').focus();
            return;
        }

        try {
            // SET SUBMITTING FLAG AND DISABLE BUTTON
            this.isSubmitting = true;
            $('#submitListingBtn').prop('disabled', true).text('Processing...');
            
            console.log("🚀 Starting listing creation...");
            console.log("Zombie ID:", this.selectedZombieForSale.id);
            console.log("Price (ETH):", price);
            console.log("Description:", description);
            
            showLoading("Creating listing on blockchain...");

            const priceInWei = web3.utils.toWei(price, 'ether');
            console.log("💰 Price in Wei:", priceInWei);
            
            console.log("📡 Calling createListing on contract...");
            const result = await cryptoZombies.methods
                .createListing(
                    this.selectedZombieForSale.id,
                    priceInWei,
                    description
                )
                .send({ 
                    from: userAccount,
                    gas: 300000
                });

            hideLoading();

            console.log("✅ Listing created successfully:", result);
            showStatus(`🎉 ${this.selectedZombieForSale.name} listed for ${price} ETH!`, "success");

            // Reset form and reload
            this.cancelZombieSelection();
            
            // Reload both views
            setTimeout(() => {
                this.loadUserZombiesForSale();
                this.loadMarketListings();
            }, 1000);

        } catch (error) {
            hideLoading();
            console.error("❌ Error creating listing:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            if (error.code === 4001) {
                showStatus("Transaction rejected by user", "warning");
            } else if (error.message.includes("revert")) {
                showStatus("Transaction reverted: " + error.message, "error");
            } else {
                showStatus("Error creating listing: " + error.message, "error");
            }
        } finally {
            // ALWAYS RESET SUBMITTING FLAG AND RE-ENABLE BUTTON
            this.isSubmitting = false;
            $('#submitListingBtn').prop('disabled', false).text('Create Listing');
            console.log("✅ Submission flag reset");
        }
    }

    // ===== MARKET FUNCTIONALITY =====
    
    async loadMarketListings() {
        if (!cryptoZombies || !userAccount) {
            $('#marketplaceListings').html(`
                <div class="empty-state">
                    <p>Please connect your wallet to view the marketplace</p>
                </div>
            `);
            return;
        }

        try {
            showLoading("Loading marketplace...");
            
            const activeListings = await cryptoZombies.methods.getActiveListings().call();
            
            hideLoading();

            if (!activeListings || activeListings.length === 0) {
                $('#marketplaceListings').html(`
                    <div class="empty-state">
                        <div style="font-size: 4rem; margin-bottom: 20px;">🏪</div>
                        <h3>No Listings Available</h3>
                        <p>Be the first to list a zombie for sale!</p>
                    </div>
                `);
                return;
            }

            // Get zombie details for ALL listings (including user's own)
            const listingsWithDetails = [];
            for (const listing of activeListings) {
                try {
                    const zombie = await getZombieDetails(listing.zombieId);
                    listingsWithDetails.push({
                        ...listing,
                        zombieDetails: zombie,
                        isOwnListing: listing.seller.toLowerCase() === userAccount.toLowerCase()
                    });
                } catch (error) {
                    console.error(`Error getting zombie ${listing.zombieId}:`, error);
                }
            }

            this.displayMarketListings(listingsWithDetails);

        } catch (error) {
            hideLoading();
            console.error("Error loading marketplace:", error);
            showStatus("Error loading marketplace", "error");
            $('#marketplaceListings').html(`
                <div class="empty-state">
                    <p style="color: var(--danger-color);">Error loading marketplace</p>
                </div>
            `);
        }
    }

    displayMarketListings(listings) {
        if (!listings || listings.length === 0) {
            $('#marketplaceListings').html(`
                <div class="empty-state">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🏪</div>
                    <h3>No Zombies For Sale</h3>
                    <p>Check back later or list your own zombies!</p>
                </div>
            `);
            return;
        }

        const listingsHTML = listings.map(listing => {
            const zombie = listing.zombieDetails;
            const priceInEth = web3.utils.fromWei(listing.price, 'ether');
            const isOwnListing = listing.isOwnListing;
            
            // Determine button HTML based on ownership
            const buttonHTML = isOwnListing 
                ? `<button class="btn-secondary" disabled style="opacity: 0.5; cursor: not-allowed;">Your Listing</button>`
                : `<button class="btn-primary buy-zombie-btn" data-listing-id="${listing.id}" data-price="${listing.price}" data-zombie-name="${zombie.name}">Buy Now</button>`;
            
            // Add ownership badge if it's user's listing
            const ownershipBadge = isOwnListing 
                ? `<div class="ownership-badge" style="background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-block; margin-bottom: 8px;">👤 YOUR LISTING</div>`
                : '';
            
            return `
                <div class="marketplace-listing-card ${isOwnListing ? 'own-listing' : ''}" data-listing-id="${listing.id}">
                    <div class="listing-header">
                        ${ownershipBadge}
                        <div class="zombie-avatar" style="font-size: 4rem;">🧟</div>
                    </div>
                    <div class="listing-body">
                        <h3 class="zombie-name">${zombie.name}</h3>
                        <div class="zombie-stats-row">
                            <span class="stat-badge">⭐ Lvl ${zombie.level}</span>
                            <span class="stat-badge">💪 ${zombie.winCount}W-${zombie.lossCount}L</span>
                        </div>
                        <p class="listing-description">${listing.description}</p>
                        <div class="zombie-dna-display">
                            <small>🧬 DNA: ${String(zombie.dna).substring(0, 12)}...</small>
                        </div>
                    </div>
                    <div class="listing-footer">
                        <div class="price-section">
                            <div class="price-label">Price</div>
                            <div class="price-value">${priceInEth} ETH</div>
                        </div>
                        ${buttonHTML}
                    </div>
                    <div class="seller-info">
                        <small>Seller: ${listing.seller.substring(0, 6)}...${listing.seller.substring(38)}</small>
                    </div>
                </div>
            `;
        }).join('');

        $('#marketplaceListings').html(`
            <div class="marketplace-grid">
                ${listingsHTML}
            </div>
        `);
    }

    async buyZombie(event) {
        const button = $(event.currentTarget);
        const listingId = button.data('listing-id');
        const price = button.data('price');
        const zombieName = button.data('zombie-name');

        const priceInEth = web3.utils.fromWei(price, 'ether');

        const confirmed = confirm(`Buy ${zombieName} for ${priceInEth} ETH?`);
        if (!confirmed) return;

        try {
            showLoading("Processing purchase...");

            const result = await cryptoZombies.methods
                .buyZombie(listingId)
                .send({
                    from: userAccount,
                    value: price
                });

            hideLoading();

            console.log("✅ Zombie purchased:", result);
            showStatus(`🎉 Successfully purchased ${zombieName}!`, "success");

            // Reload marketplace
            setTimeout(() => this.loadMarketListings(), 1500);

        } catch (error) {
            hideLoading();
            console.error("Error buying zombie:", error);
            showStatus("Error purchasing zombie: " + error.message, "error");
        }
    }

    filterMarketListings() {
        const searchTerm = $('#marketSearchInput').val().toLowerCase();
        $('.marketplace-listing-card').each(function() {
            const zombieName = $(this).find('.zombie-name').text().toLowerCase();
            const description = $(this).find('.listing-description').text().toLowerCase();
            
            if (zombieName.includes(searchTerm) || description.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    sortMarketListings() {
        // Sorting implementation
        const sortBy = $('#marketSortSelect').val();
        console.log("Sorting by:", sortBy);
        // TODO: Implement sorting logic
    }

    // ===== UPDATE DISPLAY =====
    
    updateMarketplaceDisplay() {
        if (this.currentView === 'market') {
            this.loadMarketListings();
        } else {
            this.loadUserZombiesForSale();
        }
    }
}

// Initialize marketplace (SINGLETON)
let enhancedMarketplace;

function initializeEnhancedMarketplace() {
    // Only create if it doesn't exist (prevent duplicates)
    if (!enhancedMarketplace) {
        enhancedMarketplace = new EnhancedMarketplace();
        console.log("✅ Enhanced Marketplace initialized");
    } else {
        console.log("⚠️ Marketplace already initialized, skipping");
    }
}

// Initialize when DOM is ready
$(document).ready(() => {
    if (typeof EnhancedMarketplace !== 'undefined') {
        initializeEnhancedMarketplace();
    }
});

