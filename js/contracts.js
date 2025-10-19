// Global variables
let web3 = null;
let cryptoZombies = null;
let userAccount = null;

// Getter function to access userAccount from other files
function getUserAccount() {
    return userAccount;
}

// Contract verification function
async function verifyContractDeployment() {
    if (!cryptoZombies) {
        console.error("❌ Contract not initialized");
        return false;
    }
    
    try {
        console.log("🔍 Verifying contract deployment...");
        console.log("📍 Contract address:", cryptoZombies.options.address);
        
        // Test basic function
        const zombieCount = await cryptoZombies.methods.getZombiesByOwner(userAccount).call();
        console.log("✅ Basic functions work. Zombie count:", zombieCount.length);
        
        // Test breeding function
        try {
            const breedingFee = await cryptoZombies.methods.breedingFee().call();
            console.log("✅ Breeding functions available! Fee:", web3.utils.fromWei(breedingFee, 'ether'), "ETH");
            return true;
        } catch (error) {
            console.error("❌ Breeding functions NOT found!");
            console.error("⚠️ You need to redeploy the contract with breeding support");
            console.error("Run: rm -rf build/ && npm run dev");
            return false;
        }
    } catch (error) {
        console.error("❌ Contract verification failed:", error);
        return false;
    }
}

// Initialize Web3 and contract
async function initializeWeb3() {
    try {
        // Check if MetaMask is installed
        if (!window.ethereum) {
            throw new Error("Please install MetaMask to use this application");
        }

        // Create Web3 instance
        web3 = new Web3(window.ethereum);

        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get the user's account
        const accounts = await web3.eth.getAccounts();
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found. Please connect to MetaMask.");
        }

        userAccount = accounts[0];
        console.log("Connected account:", userAccount);

        // Initialize the contract
        cryptoZombies = new web3.eth.Contract(
            ZOMBIE_OWNERSHIP_ABI,
            CONTRACT_ADDRESS,
            { from: userAccount }
        );

        // Set up event listeners for account and network changes
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', handleChainChange);
        window.ethereum.on('disconnect', handleDisconnect);

        console.log("Web3 initialized successfully");
        return true;

    } catch (error) {
        console.error("Error in initializeWeb3:", error);
        web3 = null;
        cryptoZombies = null;
        userAccount = null;
        throw error;
    }
}

// Event handlers for Web3
function handleAccountChange(accounts) {
    if (!accounts || accounts.length === 0) {
        console.log("Please connect to MetaMask.");
        $("#txStatus").text("Please connect to MetaMask");
        userAccount = null;
    } else if (accounts[0] !== userAccount) {
        userAccount = accounts[0];
        console.log("Account changed to:", userAccount);
        window.location.reload();
    }
}

function handleChainChange() {
    console.log("Network changed, reloading...");
    window.location.reload();
}

function handleDisconnect(error) {
    console.log("Disconnected from Ethereum network:", error);
    $("#txStatus").text("Disconnected from Ethereum network. Please reconnect.");
    web3 = null;
    cryptoZombies = null;
    userAccount = null;
}

// Helper function to normalize zombie data
function normalizeZombieData(zombieData, id) {
    return {
        id: id.toString(),
        name: zombieData.name,
        dna: zombieData.dna.toString(),
        level: parseInt(zombieData.level.toString()),
        readyTime: parseInt(zombieData.readyTime.toString()),
        winCount: parseInt(zombieData.winCount.toString()),
        lossCount: parseInt(zombieData.lossCount.toString())
    };
}

// Contract interaction functions
async function getZombiesByOwner(owner) {
    if (!web3 || !cryptoZombies || !userAccount) {
        throw new Error("Web3 not initialized. Please connect to MetaMask.");
    }

    try {
        // Get all zombie IDs for the owner
        const zombieIds = await cryptoZombies.methods.getZombiesByOwner(owner).call();
        
        // Use Promise.all to fetch all zombie details in parallel
        const zombieDetails = await Promise.all(
            zombieIds.map(id => cryptoZombies.methods.zombies(id).call())
        );
        
        // Combine IDs with their details and normalize the data
        return zombieIds.map((id, index) => normalizeZombieData(zombieDetails[index], id));
    } catch (error) {
        console.error("Error getting zombies:", error);
        throw error;
    }
}

async function getZombieDetails(zombieId) {
    if (!web3 || !cryptoZombies) {
        throw new Error("Web3 not initialized. Please connect to MetaMask.");
    }

    try {
        console.log(`📊 Getting details for zombie ${zombieId}...`);
        const zombieData = await cryptoZombies.methods.zombies(zombieId).call();
        const normalized = normalizeZombieData(zombieData, zombieId);
        console.log(`✅ Zombie ${zombieId} details:`, normalized);
        return normalized;
    } catch (error) {
        console.error(`Error getting zombie ${zombieId} details:`, error);
        throw error;
    }
}

async function createRandomZombie(name) {
    if (!web3 || !cryptoZombies || !userAccount) {
        throw new Error("Web3 not initialized. Please connect to MetaMask.");
    }

    try {
        showZombieAnimation();

        const result = await cryptoZombies.methods.createRandomZombie(name)
            .send({ 
                from: userAccount,
                value: web3.utils.toWei(CREATE_ZOMBIE_FEE, 'ether'),
                gas: DEFAULT_GAS_LIMIT
            });

        // Wait for transaction confirmation
        await web3.eth.getTransactionReceipt(result.transactionHash);
        
        // Get the updated zombie list
        const zombies = await getZombiesByOwner(userAccount);
        
        // Hide animation
        hideZombieAnimation();

        // Update the display
        displayZombies(zombies);
        
        // Show success message
        $("#txStatus").text(`Successfully created zombie: ${name}!`);

        return zombies;
    } catch (error) {
        hideZombieAnimation();
        console.error("Error creating zombie:", error);
        $("#txStatus").text(`Error creating zombie: ${error.message}`);
        throw error;
    }
}

async function levelUp(zombieId) {
    if (!web3 || !cryptoZombies || !userAccount) {
        throw new Error("Web3 not initialized. Please connect to MetaMask.");
    }

    try {
        // Get current zombie level
        const zombie = await cryptoZombies.methods.zombies(zombieId).call();
        const currentLevel = parseInt(zombie.level.toString());

        $("#txStatus").text("Leveling up your zombie... Please wait.");

        const result = await cryptoZombies.methods.levelUp(zombieId)
            .send({ 
                from: userAccount,
                value: web3.utils.toWei(LEVEL_UP_FEE, 'ether'),
                gas: DEFAULT_GAS_LIMIT
            });

        // Wait for transaction confirmation
        await web3.eth.getTransactionReceipt(result.transactionHash);

        // Show level up animation
        showLevelUpAnimation(currentLevel, currentLevel + 1);
        
        // Get the updated zombie list
        const zombies = await getZombiesByOwner(userAccount);
        
        // Update the display
        displayZombies(zombies);
        
        // Show success message
        $("#txStatus").text("Power overwhelming! Zombie successfully leveled up!");

        return zombies;
    } catch (error) {
        console.error("Error leveling up:", error);
        $("#txStatus").text(`Error leveling up: ${error.message}`);
        throw error;
    }
}

async function feedOnKitty(zombieId, kittyId) {
    if (!web3 || !cryptoZombies || !userAccount) {
        throw new Error("Web3 not initialized. Please connect to MetaMask.");
    }

    try {
        const result = await cryptoZombies.methods.feedOnKitty(zombieId, kittyId)
            .send({ 
                from: userAccount,
                gas: DEFAULT_GAS_LIMIT
            });
            
        return await getZombiesByOwner(userAccount);
    } catch (error) {
        console.error("Error feeding on kitty:", error);
        throw error;
    }
}

// Initialize the application
async function startApp() {
    try {
        await initializeWeb3();
        const zombies = await getZombiesByOwner(userAccount);
        displayZombies(zombies);
        return true;
    } catch (error) {
        console.error("Error starting app:", error);
        $("#txStatus").text(error.message);
        return false;
    }
}

// Battle Functions
async function attackZombie(attackerId, targetId) {
    console.log("🎮 attackZombie called:", { attackerId, targetId, userAccount });
    
    if (!web3 || !cryptoZombies || !userAccount) {
        const error = "Web3 not initialized. Please connect to MetaMask.";
        console.error("❌", error);
        throw new Error(error);
    }

    try {
        console.log(`🗡️ Calling smart contract attack: zombie ${attackerId} -> ${targetId}`);
        console.log("📋 Contract address:", cryptoZombies.options.address);
        console.log("👤 From account:", userAccount);
        
        const result = await cryptoZombies.methods.attack(attackerId, targetId)
            .send({ 
                from: userAccount,
                gas: DEFAULT_GAS_LIMIT
            });

        console.log("✅ Attack transaction successful!", result);
        console.log("📝 Transaction hash:", result.transactionHash);
        
        // Get updated zombie data
        console.log("📊 Fetching updated zombie data...");
        const myZombie = await getZombieDetails(attackerId);
        const enemyZombie = await getZombieDetails(targetId);
        
        console.log("✅ Battle complete! Updated zombies:", { myZombie, enemyZombie });
        
        return {
            success: true,
            transactionHash: result.transactionHash,
            myZombie: myZombie,
            enemyZombie: enemyZombie
        };
        
    } catch (error) {
        console.error("❌ Error attacking zombie:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            data: error.data
        });
        throw error;
    }
}

// Simple Breeding Function using feedAndMultiply (always available)
async function breedZombiesSimple(parent1Id, parent2Id, offspringName) {
    console.log("🧬 Simple breeding using feedAndMultiply...");
    
    if (!web3 || !cryptoZombies || !userAccount) {
        throw new Error("Web3 not initialized. Please connect to MetaMask.");
    }

    try {
        // Get parent details
        const parent1 = await getZombieDetails(parent1Id);
        const parent2 = await getZombieDetails(parent2Id);
        
        console.log("Parent 1:", parent1.name, "DNA:", parent1.dna);
        console.log("Parent 2:", parent2.name, "DNA:", parent2.dna);
        console.log("Offspring Name:", offspringName);
        
        // Use breed function to create offspring from parent DNAs
        // This wraps feedAndMultiply and mixes the DNAs
        console.log("📝 Calling breed to mix DNAs...");
        console.log("Mixing:", parent1.dna, "+", parent2.dna);
        
        const result = await cryptoZombies.methods.breed(parent1Id, parent2.dna, offspringName)
            .send({ 
                from: userAccount,
                gas: DEFAULT_GAS_LIMIT
            });

        console.log("✅ Breeding successful!", result.transactionHash);
        
        // Wait for blockchain to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get updated zombies
        const allZombies = await getZombiesByOwner(userAccount);
        const offspring = allZombies[allZombies.length - 1];
        
        console.log("✅ Offspring created with mixed DNA!");
        console.log("👶 Offspring DNA:", offspring.dna);
        console.log("📊 Parent 1 DNA:", parent1.dna);
        console.log("📊 Parent 2 DNA:", parent2.dna);
        
        return {
            success: true,
            transactionHash: result.transactionHash,
            zombies: allZombies,
            offspring: offspring,
            parent1Name: parent1.name,
            parent2Name: parent2.name,
            parent1DNA: parent1.dna,
            parent2DNA: parent2.dna
        };
        
    } catch (error) {
        console.error("❌ Error in simple breeding:", error);
        throw error;
    }
}

// Complex Breeding Function using ZombieBreeding contract
async function breedZombiesDirectly(parent1Id, parent2Id) {
    console.log("🧬 breedZombiesDirectly called:", { parent1Id, parent2Id, userAccount });
    
    if (!web3 || !cryptoZombies || !userAccount) {
        const error = "Web3 not initialized. Please connect to MetaMask.";
        console.error("❌", error);
        throw new Error(error);
    }

    try {
        console.log(`🧬 Breeding zombies: ${parent1Id} + ${parent2Id}`);
        console.log("📋 Contract address:", cryptoZombies.options.address);
        console.log("👤 From account:", userAccount);
        
        // Get parent zombies' details
        const parent1 = await getZombieDetails(parent1Id);
        const parent2 = await getZombieDetails(parent2Id);
        
        console.log("Parent 1:", parent1.name, "Level:", parent1.level, "DNA:", parent1.dna);
        console.log("Parent 2:", parent2.name, "Level:", parent2.level, "DNA:", parent2.dna);
        
        // Check if zombies meet breeding requirements
        if (parent1.level < 2 || parent2.level < 2) {
            throw new Error(`Both zombies must be at least level 2 to breed! Parent 1 is level ${parent1.level}, Parent 2 is level ${parent2.level}`);
        }
        
        // Check if zombies are ready (cooldown)
        const now = Math.floor(Date.now() / 1000);
        if (parent1.readyTime > now) {
            const waitTime = parent1.readyTime - now;
            throw new Error(`Parent 1 (${parent1.name}) is in cooldown! Wait ${waitTime} seconds.`);
        }
        if (parent2.readyTime > now) {
            const waitTime = parent2.readyTime - now;
            throw new Error(`Parent 2 (${parent2.name}) is in cooldown! Wait ${waitTime} seconds.`);
        }
        
        console.log("✅ Pre-checks passed: Both zombies meet level and cooldown requirements");
        
        // Get breeding fee
        const breedingFee = await cryptoZombies.methods.breedingFee().call();
        console.log("💰 Breeding fee:", web3.utils.fromWei(breedingFee, 'ether'), "ETH");
        
        // Check user balance
        const userBalance = await web3.eth.getBalance(userAccount);
        const userBalanceEth = web3.utils.fromWei(userBalance, 'ether');
        console.log("👛 Your balance:", userBalanceEth, "ETH");
        
        if (BigInt(userBalance) < BigInt(breedingFee)) {
            throw new Error(`Insufficient balance! You need ${web3.utils.fromWei(breedingFee, 'ether')} ETH but only have ${userBalanceEth} ETH`);
        }
        
        // Check if the breeding functions exist in the contract
        try {
            await cryptoZombies.methods.breedingFee().call();
            console.log("✅ Breeding functions found in contract");
        } catch (error) {
            throw new Error("Contract doesn't have breeding functions! Please redeploy with: rm -rf build/ && npm run dev");
        }
        
        // Check if both zombies are ready for breeding
        console.log("🔍 Checking if zombies are ready for breeding...");
        try {
            const isReady1 = await cryptoZombies.methods.isZombieReadyForBreeding(parent1Id).call();
            console.log(`Parent 1 (ID: ${parent1Id}) ready:`, isReady1);
            
            if (!isReady1) {
                // Check breeding cooldown specifically
                try {
                    const cooldown1 = await cryptoZombies.methods.getBreedingCooldown(parent1Id).call();
                    if (cooldown1 > 0) {
                        throw new Error(`Parent 1 has breeding cooldown! Wait ${cooldown1} seconds. This is different from the regular zombie cooldown.`);
                    }
                } catch (e) {
                    console.warn("Couldn't check breeding cooldown:", e.message);
                }
                throw new Error(`Parent 1 (${parent1.name}) is not ready for breeding! Level: ${parent1.level}, Required: 2+`);
            }
            
            const isReady2 = await cryptoZombies.methods.isZombieReadyForBreeding(parent2Id).call();
            console.log(`Parent 2 (ID: ${parent2Id}) ready:`, isReady2);
            
            if (!isReady2) {
                // Check breeding cooldown specifically
                try {
                    const cooldown2 = await cryptoZombies.methods.getBreedingCooldown(parent2Id).call();
                    if (cooldown2 > 0) {
                        throw new Error(`Parent 2 has breeding cooldown! Wait ${cooldown2} seconds. This is different from the regular zombie cooldown.`);
                    }
                } catch (e) {
                    console.warn("Couldn't check breeding cooldown:", e.message);
                }
                throw new Error(`Parent 2 (${parent2.name}) is not ready for breeding! Level: ${parent2.level}, Required: 2+`);
            }
            
            console.log("✅ Both zombies are ready for breeding");
        } catch (error) {
            if (error.message.includes("not ready") || error.message.includes("cooldown")) {
                throw error;
            }
            console.warn("⚠️ Couldn't check breeding readiness (function may not exist):", error.message);
        }
        
        // Verify the parent IDs are different
        if (parent1Id.toString() === parent2Id.toString()) {
            throw new Error("Cannot breed a zombie with itself! Please select two different zombies.");
        }
        console.log("✅ Different zombies selected");
        
        // Step 1: Create breeding pair
        console.log("📝 Step 1: Creating breeding pair...");
        console.log("Sending:", web3.utils.fromWei(breedingFee, 'ether'), "ETH");
        console.log("From:", userAccount);
        console.log("Parent IDs:", parent1Id, "and", parent2Id);
        
        // Try to estimate gas first to catch any revert errors
        console.log("🔍 Testing transaction (estimating gas)...");
        try {
            const gasEstimate = await cryptoZombies.methods.createBreedingPair(parent1Id, parent2Id)
                .estimateGas({ 
                    from: userAccount,
                    value: breedingFee
                });
            console.log("✅ Gas estimate successful:", gasEstimate, "- Transaction should work!");
        } catch (estimateError) {
            console.error("❌ Gas estimation failed - transaction will revert!");
            console.error("Error:", estimateError);
            
            // Try to provide a helpful error message
            if (estimateError.message.includes("revert")) {
                throw new Error("❌ Contract rejected the transaction! Possible reasons:\n" +
                    "1. One or both zombies are still in breeding cooldown from a previous breeding\n" +
                    "2. Zombies were just created/leveled and blockchain needs a moment to update\n" +
                    "3. Contract not properly deployed with breeding support\n\n" +
                    "Try: Wait 30 seconds and try again, or redeploy with: rm -rf build/ && npm run dev");
            }
            throw estimateError;
        }
        
        const pairResult = await cryptoZombies.methods.createBreedingPair(parent1Id, parent2Id)
            .send({ 
                from: userAccount,
                value: breedingFee,
                gas: DEFAULT_GAS_LIMIT
            });

        console.log("✅ Breeding pair created!", pairResult.transactionHash);
        
        // Get the user's breeding pairs to find the latest one
        const userPairs = await cryptoZombies.methods.getUserBreedingPairs(userAccount).call();
        console.log("📊 User has", userPairs.length, "breeding pairs");
        
        // Get the latest (most recent) pair
        const latestPairIndex = userPairs.length - 1;
        const latestPair = userPairs[latestPairIndex];
        
        console.log("🧬 Latest breeding pair:", {
            index: latestPairIndex,
            parent1Id: latestPair.parent1Id,
            parent2Id: latestPair.parent2Id,
            cooldownEnd: new Date(latestPair.cooldownEnd * 1000).toLocaleString(),
            isActive: latestPair.isActive
        });
        
        // Check if we can breed immediately (cooldown might be 0 for testing)
        const currentTime = Math.floor(Date.now() / 1000);
        const cooldownEnd = parseInt(latestPair.cooldownEnd);
        
        if (cooldownEnd > currentTime) {
            const waitTime = cooldownEnd - currentTime;
            console.log(`⏰ Cooldown active. Need to wait ${waitTime} seconds`);
            
            // Show helpful error message
            const hours = Math.floor(waitTime / 3600);
            const minutes = Math.floor((waitTime % 3600) / 60);
            
            if (waitTime > 3600) {
                throw new Error(`Breeding cooldown active! Please wait ${hours} hours and ${minutes} minutes before breeding can complete.`);
            } else if (waitTime > 60) {
                throw new Error(`Breeding cooldown active! Please wait ${minutes} minutes before breeding can complete.`);
            } else {
                throw new Error(`Breeding cooldown active! Please wait ${waitTime} seconds before breeding can complete.`);
            }
        }
        
        // Step 2: Breed the zombies (this creates the offspring with mixed DNA)
        console.log("📝 Step 2: Breeding zombies (mixing DNA)...");
        
        // Update loading message if showLoading function exists
        if (typeof showLoading === 'function') {
            showLoading("Step 2/2: Mixing parent DNA and creating offspring... 🧬✨");
        }
        
        const breedResult = await cryptoZombies.methods.breedZombies(latestPairIndex)
            .send({ 
                from: userAccount,
                gas: DEFAULT_GAS_LIMIT
            });

        console.log("✅ Breeding complete!", breedResult.transactionHash);
        
        // Wait for blockchain to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get updated zombie data
        console.log("📊 Fetching updated zombie data...");
        const allZombies = await getZombiesByOwner(userAccount);
        
        // Find the new offspring (last zombie)
        const offspring = allZombies[allZombies.length - 1];
        console.log("✅ Offspring created with mixed DNA:", offspring);
        console.log("👶 Offspring DNA:", offspring.dna);
        console.log("📊 Parent 1 DNA:", parent1.dna);
        console.log("📊 Parent 2 DNA:", parent2.dna);
        
        return {
            success: true,
            transactionHash: breedResult.transactionHash,
            zombies: allZombies,
            offspring: offspring,
            parent1Name: parent1.name,
            parent2Name: parent2.name,
            parent1DNA: parent1.dna,
            parent2DNA: parent2.dna
        };
        
    } catch (error) {
        console.error("❌ Error breeding zombies:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            data: error.data
        });
        throw error;
    }
}
