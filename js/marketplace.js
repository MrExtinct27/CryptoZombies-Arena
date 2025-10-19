// ===== MARKETPLACE & TRADING SYSTEM =====

class Marketplace {
    constructor() {
        this.listings = [];
        this.auctions = [];
        this.userListings = [];
        this.tradeHistory = [];
        this.priceHistory = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMarketplaceData();
        this.startPriceUpdates();
    }

    setupEventListeners() {
        // Marketplace controls
        $('#listZombieBtn').click(() => this.showListZombieModal());
        $('#myListingsBtn').click(() => this.showMyListings());
        
        // Search and filter
        $('#searchInput').on('input', () => this.filterListings());
        $('#sortBy').change(() => this.sortListings());
        
        // Listing actions
        $(document).on('click', '.buy-btn', (e) => this.buyZombie($(e.target).data('listing-id')));
        $(document).on('click', '.cancel-listing-btn', (e) => this.cancelListing($(e.target).data('listing-id')));
        $(document).on('click', '.bid-btn', (e) => this.placeBid($(e.target).data('auction-id')));
    }

    loadMarketplaceData() {
        // Load from localStorage (in real implementation, load from blockchain)
        const savedListings = localStorage.getItem('marketplaceListings');
        const savedAuctions = localStorage.getItem('marketplaceAuctions');
        const savedHistory = localStorage.getItem('tradeHistory');
        
        if (savedListings) {
            this.listings = JSON.parse(savedListings);
        }
        
        if (savedAuctions) {
            this.auctions = JSON.parse(savedAuctions);
        }
        
        if (savedHistory) {
            this.tradeHistory = JSON.parse(savedHistory);
        }
        
        this.updateMarketplaceDisplay();
    }

    saveMarketplaceData() {
        localStorage.setItem('marketplaceListings', JSON.stringify(this.listings));
        localStorage.setItem('marketplaceAuctions', JSON.stringify(this.auctions));
        localStorage.setItem('tradeHistory', JSON.stringify(this.tradeHistory));
    }

    showListZombieModal() {
        if (!userAccount) {
            showStatus("Please connect your wallet first!", "error");
            return;
        }

        // Get user's zombies
        getZombiesByOwner(userAccount)
            .then(zombies => {
                if (zombies.length === 0) {
                    showStatus("You don't have any zombies to list!", "warning");
                    return;
                }
                
                this.showZombieSelectionModal(zombies);
            })
            .catch(error => {
                console.error("Error loading zombies:", error);
                showStatus("Error loading your zombies", "error");
            });
    }

    showZombieSelectionModal(zombies) {
        const modal = $(`
            <div class="modal-overlay active" id="listZombieModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>List Zombie for Sale</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="zombie-selection">
                            <h4>Select Zombie to List:</h4>
                            <div class="zombie-grid">
                                ${zombies.map(zombie => `
                                    <div class="zombie-card" data-zombie-id="${zombie.id}" data-zombie-data='${JSON.stringify(zombie)}'>
                                        <div class="zombie-avatar">🧟</div>
                                        <div class="zombie-info">
                                            <h4>${zombie.name}</h4>
                                            <p>Level ${zombie.level}</p>
                                            <p>DNA: ${zombie.dna}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="listing-options" style="display: none;">
                            <h4>Listing Options:</h4>
                            <div class="option-tabs">
                                <button class="tab-btn active" data-type="fixed">Fixed Price</button>
                                <button class="tab-btn" data-type="auction">Auction</button>
                            </div>
                            <div class="listing-form">
                                <div class="form-group">
                                    <label>Price (ETH):</label>
                                    <input type="number" id="listingPrice" step="0.001" min="0.001" placeholder="0.001">
                                </div>
                                <div class="form-group auction-only" style="display: none;">
                                    <label>Starting Bid (ETH):</label>
                                    <input type="number" id="startingBid" step="0.001" min="0.001" placeholder="0.001">
                                </div>
                                <div class="form-group auction-only" style="display: none;">
                                    <label>Duration (hours):</label>
                                    <select id="auctionDuration">
                                        <option value="24">24 hours</option>
                                        <option value="48">48 hours</option>
                                        <option value="72">72 hours</option>
                                        <option value="168">1 week</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Description (optional):</label>
                                    <textarea id="listingDescription" placeholder="Describe your zombie..."></textarea>
                                </div>
                                <button class="btn-primary" id="confirmListing">List for Sale</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);

        // Handle zombie selection
        $('.zombie-card').click(function() {
            $('.zombie-card').removeClass('selected');
            $(this).addClass('selected');
            $('.listing-options').show();
        });

        // Handle tab switching
        $('.tab-btn').click(function() {
            $('.tab-btn').removeClass('active');
            $(this).addClass('active');
            
            if ($(this).data('type') === 'auction') {
                $('.auction-only').show();
            } else {
                $('.auction-only').hide();
            }
        });

        // Handle listing confirmation
        $('#confirmListing').click(() => {
            const selectedZombie = $('.zombie-card.selected');
            if (selectedZombie.length === 0) {
                showStatus("Please select a zombie to list!", "warning");
                return;
            }

            const zombieData = JSON.parse(selectedZombie.data('zombie-data'));
            const listingType = $('.tab-btn.active').data('type');
            const price = parseFloat($('#listingPrice').val());
            const description = $('#listingDescription').val();

            if (listingType === 'auction') {
                const startingBid = parseFloat($('#startingBid').val());
                const duration = parseInt($('#auctionDuration').val());
                this.createAuction(zombieData, startingBid, duration, description);
            } else {
                this.createListing(zombieData, price, description);
            }

            modal.remove();
        });

        // Close modal
        modal.find('.close-btn').click(() => modal.remove());
    }

    createListing(zombieData, price, description) {
        const listing = {
            id: Date.now(),
            zombieId: zombieData.id,
            zombie: zombieData,
            seller: userAccount,
            price: price,
            description: description,
            timestamp: Date.now(),
            status: 'active',
            type: 'fixed'
        };

        this.listings.push(listing);
        this.saveMarketplaceData();
        this.updateMarketplaceDisplay();
        
        showStatus(`Zombie "${zombieData.name}" listed for ${price} ETH!`, "success");
    }

    createAuction(zombieData, startingBid, duration, description) {
        const auction = {
            id: Date.now(),
            zombieId: zombieData.id,
            zombie: zombieData,
            seller: userAccount,
            startingBid: startingBid,
            currentBid: startingBid,
            highestBidder: null,
            description: description,
            startTime: Date.now(),
            endTime: Date.now() + (duration * 60 * 60 * 1000),
            status: 'active',
            type: 'auction',
            bids: []
        };

        this.auctions.push(auction);
        this.saveMarketplaceData();
        this.updateMarketplaceDisplay();
        
        showStatus(`Auction created for "${zombieData.name}" starting at ${startingBid} ETH!`, "success");
    }

    updateMarketplaceDisplay() {
        this.displayListings();
        this.displayAuctions();
    }

    displayListings() {
        const container = $('#marketplaceListings');
        container.empty();

        if (this.listings.length === 0) {
            container.html('<div class="empty-state">No zombies listed for sale</div>');
            return;
        }

        this.listings.forEach(listing => {
            if (listing.status !== 'active') return;

            const listingCard = $(`
                <div class="listing-card">
                    <div class="listing-header">
                        <div class="zombie-info">
                            <div class="zombie-avatar">🧟</div>
                            <div class="zombie-details">
                                <h4>${listing.zombie.name}</h4>
                                <p>Level ${listing.zombie.level}</p>
                                <p>DNA: ${listing.zombie.dna}</p>
                            </div>
                        </div>
                        <div class="listing-price">
                            <div class="price">${listing.price} ETH</div>
                            <div class="price-usd">≈ $${(listing.price * 2000).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="listing-stats">
                        <div class="stat">Wins: ${listing.zombie.winCount}</div>
                        <div class="stat">Losses: ${listing.zombie.lossCount}</div>
                        <div class="stat">Rarity: ${this.calculateRarity(listing.zombie)}</div>
                    </div>
                    ${listing.description ? `<div class="listing-description">${listing.description}</div>` : ''}
                    <div class="listing-actions">
                        <button class="btn-primary buy-btn" data-listing-id="${listing.id}">
                            Buy Now
                        </button>
                        ${listing.seller === userAccount ? 
                            `<button class="btn-secondary cancel-listing-btn" data-listing-id="${listing.id}">
                                Cancel Listing
                            </button>` : ''
                        }
                    </div>
                </div>
            `);

            container.append(listingCard);
        });
    }

    displayAuctions() {
        const container = $('#marketplaceListings');
        
        this.auctions.forEach(auction => {
            if (auction.status !== 'active') return;

            const timeRemaining = this.getTimeRemaining(auction.endTime);
            const isUserAuction = auction.seller === userAccount;

            const auctionCard = $(`
                <div class="listing-card auction-card">
                    <div class="listing-header">
                        <div class="zombie-info">
                            <div class="zombie-avatar">🧟</div>
                            <div class="zombie-details">
                                <h4>${auction.zombie.name} <span class="auction-badge">AUCTION</span></h4>
                                <p>Level ${auction.zombie.level}</p>
                                <p>DNA: ${auction.zombie.dna}</p>
                            </div>
                        </div>
                        <div class="listing-price">
                            <div class="price">${auction.currentBid} ETH</div>
                            <div class="price-usd">≈ $${(auction.currentBid * 2000).toFixed(2)}</div>
                            <div class="time-remaining">${timeRemaining}</div>
                        </div>
                    </div>
                    <div class="auction-info">
                        <div class="auction-stats">
                            <div class="stat">Starting Bid: ${auction.startingBid} ETH</div>
                            <div class="stat">Bids: ${auction.bids.length}</div>
                            <div class="stat">Highest Bidder: ${auction.highestBidder ? 'Anonymous' : 'None'}</div>
                        </div>
                        <div class="bid-input">
                            <input type="number" id="bidAmount_${auction.id}" step="0.001" min="${auction.currentBid + 0.001}" placeholder="Bid amount">
                            <button class="btn-primary bid-btn" data-auction-id="${auction.id}">
                                Place Bid
                            </button>
                        </div>
                    </div>
                    ${isUserAuction ? 
                        `<div class="listing-actions">
                            <button class="btn-secondary cancel-listing-btn" data-listing-id="${auction.id}">
                                Cancel Auction
                            </button>
                        </div>` : ''
                    }
                </div>
            `);

            container.append(auctionCard);
        });
    }

    calculateRarity(zombie) {
        const totalStats = zombie.level + zombie.winCount - zombie.lossCount;
        if (totalStats >= 50) return 'Legendary';
        if (totalStats >= 30) return 'Epic';
        if (totalStats >= 20) return 'Rare';
        if (totalStats >= 10) return 'Uncommon';
        return 'Common';
    }

    getTimeRemaining(endTime) {
        const now = Date.now();
        const remaining = endTime - now;
        
        if (remaining <= 0) return 'Ended';
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    async buyZombie(listingId) {
        if (!userAccount) {
            showStatus("Please connect your wallet first!", "error");
            return;
        }

        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) {
            showStatus("Listing not found!", "error");
            return;
        }

        if (listing.seller === userAccount) {
            showStatus("You cannot buy your own zombie!", "warning");
            return;
        }

        try {
            showLoading("Processing purchase...");
            
            // Simulate blockchain transaction
            await this.simulatePurchase(listing);
            
            // Remove from listings
            this.listings = this.listings.filter(l => l.id !== listingId);
            
            // Add to trade history
            this.tradeHistory.push({
                type: 'purchase',
                zombieId: listing.zombieId,
                zombie: listing.zombie,
                buyer: userAccount,
                seller: listing.seller,
                price: listing.price,
                timestamp: Date.now()
            });
            
            this.saveMarketplaceData();
            this.updateMarketplaceDisplay();
            
            showStatus(`Successfully purchased ${listing.zombie.name} for ${listing.price} ETH!`, "success");
            
        } catch (error) {
            console.error("Error purchasing zombie:", error);
            showStatus("Error purchasing zombie: " + error.message, "error");
        } finally {
            hideLoading();
        }
    }

    async simulatePurchase(listing) {
        // Simulate blockchain transaction delay
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    async placeBid(auctionId) {
        if (!userAccount) {
            showStatus("Please connect your wallet first!", "error");
            return;
        }

        const auction = this.auctions.find(a => a.id === auctionId);
        if (!auction) {
            showStatus("Auction not found!", "error");
            return;
        }

        if (auction.seller === userAccount) {
            showStatus("You cannot bid on your own auction!", "warning");
            return;
        }

        const bidAmount = parseFloat($(`#bidAmount_${auctionId}`).val());
        if (!bidAmount || bidAmount <= auction.currentBid) {
            showStatus("Bid must be higher than current bid!", "warning");
            return;
        }

        try {
            showLoading("Placing bid...");
            
            // Add bid
            auction.bids.push({
                bidder: userAccount,
                amount: bidAmount,
                timestamp: Date.now()
            });
            
            auction.currentBid = bidAmount;
            auction.highestBidder = userAccount;
            
            this.saveMarketplaceData();
            this.updateMarketplaceDisplay();
            
            showStatus(`Bid placed: ${bidAmount} ETH`, "success");
            
        } catch (error) {
            console.error("Error placing bid:", error);
            showStatus("Error placing bid: " + error.message, "error");
        } finally {
            hideLoading();
        }
    }

    cancelListing(listingId) {
        // Remove from listings
        this.listings = this.listings.filter(l => l.id !== listingId);
        this.auctions = this.auctions.filter(a => a.id !== listingId);
        
        this.saveMarketplaceData();
        this.updateMarketplaceDisplay();
        
        showStatus("Listing cancelled!", "info");
    }

    showMyListings() {
        const myListings = this.listings.filter(l => l.seller === userAccount);
        const myAuctions = this.auctions.filter(a => a.seller === userAccount);
        
        if (myListings.length === 0 && myAuctions.length === 0) {
            showStatus("You have no active listings", "info");
            return;
        }
        
        // Show modal with user's listings
        this.showMyListingsModal(myListings, myAuctions);
    }

    showMyListingsModal(listings, auctions) {
        const modal = $(`
            <div class="modal-overlay active" id="myListingsModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>My Listings</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="my-listings">
                            ${listings.map(listing => `
                                <div class="listing-item">
                                    <div class="zombie-info">
                                        <h4>${listing.zombie.name}</h4>
                                        <p>Price: ${listing.price} ETH</p>
                                    </div>
                                    <button class="btn-secondary cancel-listing-btn" data-listing-id="${listing.id}">
                                        Cancel
                                    </button>
                                </div>
                            `).join('')}
                            ${auctions.map(auction => `
                                <div class="listing-item">
                                    <div class="zombie-info">
                                        <h4>${auction.zombie.name} (Auction)</h4>
                                        <p>Current Bid: ${auction.currentBid} ETH</p>
                                        <p>Bids: ${auction.bids.length}</p>
                                    </div>
                                    <button class="btn-secondary cancel-listing-btn" data-listing-id="${auction.id}">
                                        Cancel
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);
        modal.find('.close-btn').click(() => modal.remove());
    }

    filterListings() {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const sortBy = $('#sortBy').val();
        
        // Filter listings
        let filteredListings = this.listings.filter(listing => 
            listing.zombie.name.toLowerCase().includes(searchTerm) ||
            listing.zombie.dna.toString().includes(searchTerm)
        );
        
        // Sort listings
        filteredListings.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return a.price - b.price;
                case 'level':
                    return b.zombie.level - a.zombie.level;
                case 'rarity':
                    return this.getRarityValue(b.zombie) - this.getRarityValue(a.zombie);
                default:
                    return 0;
            }
        });
        
        this.displayFilteredListings(filteredListings);
    }

    getRarityValue(zombie) {
        const totalStats = zombie.level + zombie.winCount - zombie.lossCount;
        return totalStats;
    }

    displayFilteredListings(listings) {
        const container = $('#marketplaceListings');
        container.empty();
        
        listings.forEach(listing => {
            // Display listing card (same as in displayListings)
            const listingCard = $(`
                <div class="listing-card">
                    <div class="listing-header">
                        <div class="zombie-info">
                            <div class="zombie-avatar">🧟</div>
                            <div class="zombie-details">
                                <h4>${listing.zombie.name}</h4>
                                <p>Level ${listing.zombie.level}</p>
                                <p>DNA: ${listing.zombie.dna}</p>
                            </div>
                        </div>
                        <div class="listing-price">
                            <div class="price">${listing.price} ETH</div>
                            <div class="price-usd">≈ $${(listing.price * 2000).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="listing-actions">
                        <button class="btn-primary buy-btn" data-listing-id="${listing.id}">
                            Buy Now
                        </button>
                    </div>
                </div>
            `);
            container.append(listingCard);
        });
    }

    sortListings() {
        this.filterListings();
    }

    startPriceUpdates() {
        // Simulate price updates every 30 seconds
        setInterval(() => {
            this.updatePriceHistory();
        }, 30000);
    }

    updatePriceHistory() {
        // Simulate price changes
        this.listings.forEach(listing => {
            const priceChange = (Math.random() - 0.5) * 0.001; // ±0.0005 ETH
            listing.price = Math.max(0.001, listing.price + priceChange);
        });
        
        this.saveMarketplaceData();
    }

    getMarketplaceStats() {
        const stats = {
            totalListings: this.listings.length,
            totalAuctions: this.auctions.length,
            totalVolume: this.tradeHistory.reduce((sum, trade) => sum + trade.price, 0),
            averagePrice: 0,
            topSellers: {}
        };

        if (this.tradeHistory.length > 0) {
            stats.averagePrice = stats.totalVolume / this.tradeHistory.length;
            
            // Calculate top sellers
            this.tradeHistory.forEach(trade => {
                stats.topSellers[trade.seller] = (stats.topSellers[trade.seller] || 0) + 1;
            });
        }

        return stats;
    }
}

// Initialize Marketplace
// Export for use in other modules
window.Marketplace = Marketplace;
