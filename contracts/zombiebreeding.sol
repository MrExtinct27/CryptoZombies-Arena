// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./zombieownership.sol";

contract ZombieBreeding is ZombieOwnership {
    
    struct BreedingPair {
        uint parent1Id;
        uint parent2Id;
        address owner;
        uint breedingFee;
        uint cooldownEnd;
        bool isActive;
    }
    
    struct Offspring {
        uint id;
        uint parent1Id;
        uint parent2Id;
        string name;
        uint dna;
        uint level;
        uint32 readyTime;
        uint16 winCount;
        uint16 lossCount;
        bool isMutated;
        uint birthTime;
    }
    
    // Breeding state
    mapping(uint => uint) public zombieToBreedingCooldown;
    mapping(address => BreedingPair[]) public userBreedingPairs;
    mapping(uint => Offspring) public offspring;
    mapping(uint => uint[]) public zombieOffspring;
    
    // Breeding configuration
    uint public breedingFee = 0.002 ether;
    uint public breedingCooldown = 1 seconds; // Changed from 1 days for testing
    uint public mutationChance = 5; // 5% chance
    uint public maxBreedingLevel = 2;
    
    // Events
    event BreedingPairCreated(uint pairId, uint parent1Id, uint parent2Id, address owner);
    event OffspringCreated(uint offspringId, uint parent1Id, uint parent2Id, bool isMutated);
    event BreedingCooldownSet(uint zombieId, uint cooldownEnd);
    
    modifier onlyZombieOwner(uint _zombieId) {
        require(zombieToOwner[_zombieId] == msg.sender, "Not the zombie owner");
        _;
    }
    
    modifier zombieReadyForBreeding(uint _zombieId) {
        require(zombies[_zombieId].level >= maxBreedingLevel, "Zombie level too low for breeding");
        require(zombieToBreedingCooldown[_zombieId] <= block.timestamp, "Zombie not ready for breeding");
        _;
    }
    
    function setBreedingFee(uint _fee) external onlyOwner {
        breedingFee = _fee;
    }
    
    function setBreedingCooldown(uint _cooldown) external onlyOwner {
        breedingCooldown = _cooldown;
    }
    
    function setMutationChance(uint _chance) external onlyOwner {
        require(_chance <= 100, "Mutation chance cannot exceed 100%");
        mutationChance = _chance;
    }
    
    function createBreedingPair(uint _parent1Id, uint _parent2Id) external payable {
        require(msg.value >= breedingFee, "Insufficient breeding fee");
        require(_parent1Id != _parent2Id, "Cannot breed zombie with itself");
        require(zombieToOwner[_parent1Id] == msg.sender, "Not owner of parent 1");
        require(zombieToOwner[_parent2Id] == msg.sender, "Not owner of parent 2");
        require(this.isZombieReadyForBreeding(_parent1Id), "Parent 1 not ready for breeding");
        require(this.isZombieReadyForBreeding(_parent2Id), "Parent 2 not ready for breeding");
        
        // Create breeding pair
        BreedingPair memory newPair = BreedingPair({
            parent1Id: _parent1Id,
            parent2Id: _parent2Id,
            owner: msg.sender,
            breedingFee: msg.value,
            cooldownEnd: block.timestamp + breedingCooldown,
            isActive: true
        });
        
        userBreedingPairs[msg.sender].push(newPair);
        uint pairId = userBreedingPairs[msg.sender].length - 1;
        
        // Set cooldowns
        zombieToBreedingCooldown[_parent1Id] = block.timestamp + breedingCooldown;
        zombieToBreedingCooldown[_parent2Id] = block.timestamp + breedingCooldown;
        
        emit BreedingPairCreated(pairId, _parent1Id, _parent2Id, msg.sender);
        emit BreedingCooldownSet(_parent1Id, block.timestamp + breedingCooldown);
        emit BreedingCooldownSet(_parent2Id, block.timestamp + breedingCooldown);
    }
    
    function breedZombies(uint _pairId) external {
        require(_pairId < userBreedingPairs[msg.sender].length, "Invalid breeding pair");
        BreedingPair storage pair = userBreedingPairs[msg.sender][_pairId];
        require(pair.isActive, "Breeding pair not active");
        require(pair.cooldownEnd <= block.timestamp, "Breeding cooldown not finished");
        
        // Get parent zombies
        Zombie storage parent1 = zombies[pair.parent1Id];
        Zombie storage parent2 = zombies[pair.parent2Id];
        
        // Calculate offspring DNA
        uint offspringDNA = calculateOffspringDNA(parent1.dna, parent2.dna);
        
        // Check for mutation
        bool isMutated = false;
        if (uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, offspringDNA))) % 100 < mutationChance) {
            offspringDNA = applyMutation(offspringDNA);
            isMutated = true;
        }
        
        // Create offspring
        uint offspringId = zombies.length;
        zombies.push(Zombie("", offspringDNA, 1, uint32(block.timestamp + cooldownTime), 0, 0));
        zombieToOwner[offspringId] = msg.sender;
        ownerZombieCount[msg.sender]++;
        
        // Store offspring data
        offspring[offspringId] = Offspring({
            id: offspringId,
            parent1Id: pair.parent1Id,
            parent2Id: pair.parent2Id,
            name: "",
            dna: offspringDNA,
            level: 1,
            readyTime: uint32(block.timestamp + cooldownTime),
            winCount: 0,
            lossCount: 0,
            isMutated: isMutated,
            birthTime: block.timestamp
        });
        
        // Update parent offspring lists
        zombieOffspring[pair.parent1Id].push(offspringId);
        zombieOffspring[pair.parent2Id].push(offspringId);
        
        // Deactivate breeding pair
        pair.isActive = false;
        
        emit OffspringCreated(offspringId, pair.parent1Id, pair.parent2Id, isMutated);
        emit NewZombie(offspringId, "", offspringDNA);
    }
    
    function calculateOffspringDNA(uint _parent1DNA, uint _parent2DNA) internal view returns (uint) {
        // Genetic inheritance algorithm
        uint combinedDNA = (_parent1DNA + _parent2DNA) / 2;
        
        // Add some randomness
        uint randomFactor = uint(keccak256(abi.encodePacked(_parent1DNA, _parent2DNA, block.timestamp))) % 1000;
        combinedDNA = (combinedDNA + randomFactor) % (10 ** 16);
        
        return combinedDNA;
    }
    
    function applyMutation(uint _dna) internal view returns (uint) {
        // Apply mutation by modifying specific digits
        uint mutatedDNA = _dna;
        uint mutationFactor = uint(keccak256(abi.encodePacked(_dna, block.timestamp))) % 10000;
        mutatedDNA = (mutatedDNA + mutationFactor) % (10 ** 16);
        
        return mutatedDNA;
    }
    
    function getBreedingCooldown(uint _zombieId) external view returns (uint) {
        if (zombieToBreedingCooldown[_zombieId] <= block.timestamp) {
            return 0;
        }
        return zombieToBreedingCooldown[_zombieId] - block.timestamp;
    }
    
    function getUserBreedingPairs(address _user) external view returns (BreedingPair[] memory) {
        return userBreedingPairs[_user];
    }
    
    function getZombieOffspring(uint _zombieId) external view returns (uint[] memory) {
        return zombieOffspring[_zombieId];
    }
    
    function getOffspringData(uint _offspringId) external view returns (Offspring memory) {
        return offspring[_offspringId];
    }
    
    function isZombieReadyForBreeding(uint _zombieId) external view returns (bool) {
        return zombies[_zombieId].level >= maxBreedingLevel && 
               zombieToBreedingCooldown[_zombieId] <= block.timestamp;
    }
    
    function calculateBreedingCost(uint _parent1Id, uint _parent2Id) external view returns (uint) {
        // Higher level zombies cost more to breed
        uint levelCost = (zombies[_parent1Id].level + zombies[_parent2Id].level) * 0.0001 ether;
        return breedingFee + levelCost;
    }
    
    function getBreedingStats() external view returns (
        uint totalBreedingPairs,
        uint totalOffspring,
        uint totalMutations,
        uint averageBreedingLevel
    ) {
        uint totalPairs = 0;
        uint totalOffspringCount = 0;
        uint totalMutationsCount = 0;
        uint totalLevel = 0;
        
        // This would need to be tracked in storage for efficiency
        // For now, return basic stats
        return (totalPairs, totalOffspringCount, totalMutationsCount, totalLevel);
    }
    
    // Override createRandomZombie to include breeding functionality
    function createRandomZombie(string memory _name) public payable virtual override {
        super.createRandomZombie(_name);
    }
}
