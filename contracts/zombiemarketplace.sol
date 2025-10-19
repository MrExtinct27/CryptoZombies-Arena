// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./zombiebreeding.sol";

contract ZombieMarketplace is ZombieBreeding {
    
    struct Listing {
        uint id;
        uint zombieId;
        address seller;
        uint price;
        uint timestamp;
        bool isActive;
        string description;
        uint listingType; // 0 = fixed price, 1 = auction
    }
    
    struct Auction {
        uint id;
        uint zombieId;
        address seller;
        uint startingBid;
        uint currentBid;
        address highestBidder;
        uint endTime;
        bool isActive;
        string description;
    }
    
    struct Bid {
        address bidder;
        uint amount;
        uint timestamp;
    }
    
    struct Trade {
        uint id;
        uint zombieId;
        address seller;
        address buyer;
        uint price;
        uint timestamp;
        string tradeType;
    }
    
    // Marketplace state
    mapping(uint => Listing) public listings;
    mapping(uint => Auction) public auctions;
    mapping(address => uint[]) public userListings;
    mapping(address => uint[]) public userAuctions;
    mapping(address => uint[]) public userBids;
    mapping(uint => Trade) public trades;
    
    // Counters
    uint public nextListingId = 1;
    uint public nextAuctionId = 1;
    uint public nextTradeId = 1;
    
    // Marketplace fees
    uint public marketplaceFee = 250; // 2.5% (250/10000)
    uint public auctionFee = 500; // 5% (500/10000)
    address public feeRecipient;
    
    // Events
    event ListingCreated(uint listingId, uint zombieId, address seller, uint price);
    event ListingCancelled(uint listingId);
    event ZombieSold(uint listingId, uint zombieId, address buyer, uint price);
    event AuctionCreated(uint auctionId, uint zombieId, address seller, uint startingBid, uint endTime);
    event BidPlaced(uint auctionId, address bidder, uint amount);
    event AuctionEnded(uint auctionId, address winner, uint finalBid);
    event TradeExecuted(uint tradeId, uint zombieId, address buyer, address seller, uint price);
    
    modifier onlyListingOwner(uint _listingId) {
        require(listings[_listingId].seller == msg.sender, "Not the listing owner");
        _;
    }
    
    modifier onlyAuctionOwner(uint _auctionId) {
        require(auctions[_auctionId].seller == msg.sender, "Not the auction owner");
        _;
    }
    
    modifier listingExists(uint _listingId) {
        require(listings[_listingId].id != 0, "Listing does not exist");
        _;
    }
    
    modifier auctionExists(uint _auctionId) {
        require(auctions[_auctionId].id != 0, "Auction does not exist");
        _;
    }
    
    constructor() {
        feeRecipient = msg.sender;
    }
    
    function setMarketplaceFee(uint _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        marketplaceFee = _fee;
    }
    
    function setAuctionFee(uint _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        auctionFee = _fee;
    }
    
    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid fee recipient");
        feeRecipient = _recipient;
    }
    
    // Fixed Price Listings
    function createListing(
        uint _zombieId,
        uint _price,
        string memory _description
    ) external {
        require(zombieToOwner[_zombieId] == msg.sender, "Not the zombie owner");
        require(_price > 0, "Price must be greater than 0");
        
        // Create listing
        Listing memory newListing = Listing({
            id: nextListingId,
            zombieId: _zombieId,
            seller: msg.sender,
            price: _price,
            timestamp: block.timestamp,
            isActive: true,
            description: _description,
            listingType: 0
        });
        
        listings[nextListingId] = newListing;
        userListings[msg.sender].push(nextListingId);
        
        emit ListingCreated(nextListingId, _zombieId, msg.sender, _price);
        nextListingId++;
    }
    
    function buyZombie(uint _listingId) external payable listingExists(_listingId) {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing is not active");
        require(listing.seller != msg.sender, "Cannot buy your own zombie");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Calculate fees
        uint fee = (listing.price * marketplaceFee) / 10000;
        uint sellerAmount = listing.price - fee;
        
        // Transfer zombie ownership
        zombieToOwner[listing.zombieId] = msg.sender;
        ownerZombieCount[listing.seller]--;
        ownerZombieCount[msg.sender]++;
        
        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }
        
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        // Create trade record
        trades[nextTradeId] = Trade({
            id: nextTradeId,
            zombieId: listing.zombieId,
            seller: listing.seller,
            buyer: msg.sender,
            price: listing.price,
            timestamp: block.timestamp,
            tradeType: "fixed_price"
        });
        
        // Deactivate listing
        listing.isActive = false;
        
        emit ZombieSold(_listingId, listing.zombieId, msg.sender, listing.price);
        emit TradeExecuted(nextTradeId, listing.zombieId, msg.sender, listing.seller, listing.price);
        nextTradeId++;
    }
    
    function cancelListing(uint _listingId) external onlyListingOwner(_listingId) {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing is not active");
        
        listing.isActive = false;
        emit ListingCancelled(_listingId);
    }
    
    // Auction System
    function createAuction(
        uint _zombieId,
        uint _startingBid,
        uint _duration,
        string memory _description
    ) external {
        require(zombieToOwner[_zombieId] == msg.sender, "Not the zombie owner");
        require(_startingBid > 0, "Starting bid must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        Auction memory newAuction = Auction({
            id: nextAuctionId,
            zombieId: _zombieId,
            seller: msg.sender,
            startingBid: _startingBid,
            currentBid: _startingBid,
            highestBidder: address(0),
            endTime: block.timestamp + _duration,
            isActive: true,
            description: _description
        });
        
        auctions[nextAuctionId] = newAuction;
        userAuctions[msg.sender].push(nextAuctionId);
        
        emit AuctionCreated(nextAuctionId, _zombieId, msg.sender, _startingBid, block.timestamp + _duration);
        nextAuctionId++;
    }
    
    function placeBid(uint _auctionId) external payable auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.isActive, "Auction is not active");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(auction.seller != msg.sender, "Cannot bid on your own auction");
        require(msg.value > auction.currentBid, "Bid must be higher than current bid");
        
        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.currentBid);
        }
        
        auction.currentBid = msg.value;
        auction.highestBidder = msg.sender;
        
        userBids[msg.sender].push(_auctionId);
        
        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }
    
    function endAuction(uint _auctionId) external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.isActive, "Auction is not active");
        require(block.timestamp >= auction.endTime || msg.sender == auction.seller, "Auction has not ended");
        
        auction.isActive = false;
        
        if (auction.highestBidder != address(0)) {
            // Transfer zombie ownership
            zombieToOwner[auction.zombieId] = auction.highestBidder;
            ownerZombieCount[auction.seller]--;
            ownerZombieCount[auction.highestBidder]++;
            
            // Calculate fees
            uint fee = (auction.currentBid * auctionFee) / 10000;
            uint sellerAmount = auction.currentBid - fee;
            
            // Transfer payments
            payable(auction.seller).transfer(sellerAmount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            
            // Create trade record
            trades[nextTradeId] = Trade({
                id: nextTradeId,
                zombieId: auction.zombieId,
                seller: auction.seller,
                buyer: auction.highestBidder,
                price: auction.currentBid,
                timestamp: block.timestamp,
                tradeType: "auction"
            });
            
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.currentBid);
            emit TradeExecuted(nextTradeId, auction.zombieId, auction.highestBidder, auction.seller, auction.currentBid);
            nextTradeId++;
        }
    }
    
    // View functions
    function getActiveListings() external view returns (Listing[] memory) {
        uint activeCount = 0;
        for (uint i = 1; i < nextListingId; i++) {
            if (listings[i].isActive) {
                activeCount++;
            }
        }
        
        Listing[] memory activeListings = new Listing[](activeCount);
        uint index = 0;
        for (uint i = 1; i < nextListingId; i++) {
            if (listings[i].isActive) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }
    
    function getActiveAuctions() external view returns (Auction[] memory) {
        uint activeCount = 0;
        for (uint i = 1; i < nextAuctionId; i++) {
            if (auctions[i].isActive) {
                activeCount++;
            }
        }
        
        Auction[] memory activeAuctions = new Auction[](activeCount);
        uint index = 0;
        for (uint i = 1; i < nextAuctionId; i++) {
            if (auctions[i].isActive) {
                activeAuctions[index] = auctions[i];
                index++;
            }
        }
        
        return activeAuctions;
    }
    
    function getUserListings(address _user) external view returns (Listing[] memory) {
        uint[] memory userListingIds = userListings[_user];
        Listing[] memory userListingsArray = new Listing[](userListingIds.length);
        
        for (uint i = 0; i < userListingIds.length; i++) {
            userListingsArray[i] = listings[userListingIds[i]];
        }
        
        return userListingsArray;
    }
    
    function getUserAuctions(address _user) external view returns (Auction[] memory) {
        uint[] memory userAuctionIds = userAuctions[_user];
        Auction[] memory userAuctionsArray = new Auction[](userAuctionIds.length);
        
        for (uint i = 0; i < userAuctionIds.length; i++) {
            userAuctionsArray[i] = auctions[userAuctionIds[i]];
        }
        
        return userAuctionsArray;
    }
    
    function getAuctionBids(uint _auctionId) external view returns (uint) {
        return userBids[auctions[_auctionId].highestBidder].length;
    }
    
    function getTradeHistory(uint _tradeId) external view returns (Trade memory) {
        return trades[_tradeId];
    }
    
    function getMarketplaceStats() external view returns (
        uint totalListings,
        uint totalAuctions,
        uint totalTrades,
        uint totalVolume
    ) {
        uint volume = 0;
        for (uint i = 1; i < nextTradeId; i++) {
            volume += trades[i].price;
        }
        
        return (nextListingId - 1, nextAuctionId - 1, nextTradeId - 1, volume);
    }
    
    // Override createRandomZombie to include marketplace functionality
    function createRandomZombie(string memory _name) public payable virtual override {
        super.createRandomZombie(_name);
    }
}
