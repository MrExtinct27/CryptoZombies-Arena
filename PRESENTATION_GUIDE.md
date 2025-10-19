# 🎓 CryptoZombies Arena - Presentation Guide

## Complete Setup for Professor Demo

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js installed (v14 or higher)
- ✅ MetaMask browser extension installed
- ✅ Terminal/Command Prompt access

---

## 🚀 Step-by-Step Setup Commands

### Step 1: Navigate to Project Directory
```bash
cd /Users/yashmahajan/Downloads/Cryptozombie_Midterm_Project/Cryptozombie_Midterm_Project
```

### Step 2: Install Dependencies (if not already installed)
```bash
npm install
```

### Step 3: Clean Previous Build (Optional but Recommended)
```bash
rm -rf build/
```

### Step 4: Start the Development Server
```bash
npm run dev
```

**What happens:**
- ✅ Ganache blockchain starts on `http://127.0.0.1:8545`
- ✅ Smart contracts compile
- ✅ Contracts deploy to blockchain
- ✅ Web server starts on `http://localhost:8080`
- ✅ You'll see 10 test accounts with their details

---

## 🔑 Getting Ganache Account Private Keys

### Method 1: From Terminal Output (Easiest)

When you run `npm run dev`, look for this section in the output:

```
=== Development Environment Details ===
Available Accounts: 10
First Account Details:
Address: 0x642995e94cF061e3e99Bf06969c133900c8F1Ab0
Private Key: 0x6253e7a56ee838a325bd0497ae5e58cace66792c5c9e23dea30b6dabcea95ec6
Balance: 1000 ETH

=== MetaMask Setup Instructions ===
```

**Copy the Private Key** (the long hex string after `Private Key:`)

### Method 2: Get All Account Keys Programmatically

Create a temporary script to get all accounts:

```bash
node -e "
const ganache = require('ganache');
const server = ganache.server({
  wallet: {
    mnemonic: 'myth like bonus scare over problem client lizard pioneer submit female collect'
  }
});

const provider = server.provider;
const accounts = provider.getInitialAccounts();

console.log('\n🔑 GANACHE ACCOUNTS & PRIVATE KEYS:\n');
console.log('='.repeat(80));

let index = 0;
for (const [address, account] of Object.entries(accounts)) {
  console.log(\`\nAccount #\${index}:\`);
  console.log(\`  Address:     \${address}\`);
  console.log(\`  Private Key: \${account.secretKey}\`);
  console.log(\`  Balance:     \${account.balance / 1e18} ETH\`);
  console.log('-'.repeat(80));
  index++;
}
"
```

### Method 3: Pre-Generated Keys (Use These!)

**These accounts will be displayed when you run `npm run dev`**

**Account #0:**
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Balance: 100 ETH

**Account #1:**
- Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Private Key: `59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- Balance: 100 ETH

**Account #5 (Optional for additional testing):**
- Address: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
- Private Key: `8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`
- Balance: 100 ETH

> ✅ **Note:** These accounts will be automatically displayed at the end of `npm run dev` output

---

## 🦊 MetaMask Setup

### 1. Add Custom Network

1. Open MetaMask
2. Click **Network Dropdown** (top)
3. Click **"Add Network"** or **"Add Network Manually"**
4. Enter these details:

```
Network Name: Ganache Local
RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency Symbol: ETH
```

5. Click **"Save"**

### 2. Import Accounts

**For Account #0 (Main Account):**
1. Click **Account Icon** (top right)
2. Select **"Import Account"**
3. Select **"Private Key"**
4. Paste: `6253e7a56ee838a325bd0497ae5e58cace66792c5c9e23dea30b6dabcea95ec6`
5. Click **"Import"**
6. **You should see 1000 ETH!** ✅

**For Account #1 (For Testing Marketplace):**
1. Repeat the same process
2. Paste: `c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3`
3. Should see 1000 ETH

---

## 🎮 Demonstration Flow

### Opening the Application
```bash
# 1. Start the server (if not already running)
npm run dev

# 2. Open browser and go to:
http://localhost:8080
```

### Demo Script for Professor

**1. Connect Wallet**
- Click **"Connect Wallet"** button
- MetaMask will popup → Click **"Connect"**
- Wallet address and balance will appear

**2. Create Your First Zombie**
- Click **"Create Zombie"** section
- Enter a cool name (e.g., "ZombieKing")
- Click **"Create Zombie"**
- Confirm transaction in MetaMask
- Wait for success message

**3. View Your Army**
- Click **"View Army"**
- See your zombie with stats
- Show Level, DNA, Win/Loss record

**4. Breed Zombies** (if you have 2+ zombies)
- Click **"Breeding"** section
- Select 2 zombies
- Click **"Breed"**
- Enter offspring name
- Confirm transaction
- New zombie appears!

**5. Battle Arena**
- Click **"Battle"**
- Select your zombie
- Choose opponent (or random)
- Click **"Attack!"**
- Watch battle animation
- See win/loss result

**6. Marketplace**
- Click **"Marketplace"**
- Click **"Sell My Zombies"** tab
- Select a zombie
- Enter price (e.g., `0.5` ETH)
- Enter description
- Click **"Create Listing"**
- Confirm transaction
- Click **"Browse Market"** to see it listed
- Notice **"YOUR LISTING"** badge
- Buy button is disabled for your own zombies

**7. Leaderboard**
- Click **"Leaderboard"**
- See all players ranked
- Notice **"YOU"** badge in top-right corner
- Click on your entry to see detailed stats
- Click **"Zombies"** tab to see strongest zombies
- Click **"🔄 Refresh"** to reload data

**8. Switch Accounts (For Marketplace Testing)**
- Click wallet dropdown (top right)
- Click **"Switch Account"**
- Select Account #1 in MetaMask
- Go to **"Marketplace"** → **"Browse Market"**
- Now you can BUY the zombie you listed!

---

## 🎯 Key Features to Highlight

### 1. Blockchain Integration
- All data stored on Ethereum blockchain (Ganache local)
- Real smart contracts written in Solidity
- MetaMask for wallet management
- Gas fees for transactions

### 2. Smart Contract Features
- ERC721-compliant NFTs
- Breeding with DNA mixing
- Battle system with win/loss tracking
- Marketplace with listing/buying
- Ownership transfer

### 3. Frontend Features
- Real-time blockchain data
- Interactive UI with animations
- Wallet connection management
- Multiple sections (Army, Breeding, Battle, Marketplace, Leaderboard)

### 4. Advanced Features
- Custom naming system
- Leaderboard with real blockchain data
- Player rankings and statistics
- Click-to-view detailed player stats
- Top 3 highlighting (🥇🥈🥉)

---

## 🐛 Troubleshooting

### If Port 8545 is Already in Use
```bash
# Kill existing Ganache process
lsof -ti:8545 | xargs kill -9

# Then restart
npm run dev
```

### If MetaMask Shows 0 ETH
1. **Check Network:** Ensure you're on "Ganache Local" network
2. **Check Chain ID:** Should be 1337
3. **Reset MetaMask:**
   - Settings → Advanced → Clear Activity Tab Data
   - Reimport the account

### If Transactions Fail
1. **Reset MetaMask Account:**
   - Settings → Advanced → Clear Activity Tab Data
2. **Hard Refresh Browser:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. **Restart Ganache:**
   ```bash
   killall node
   rm -rf build/
   npm run dev
   ```

### If Browser Shows Old Data
```bash
# Hard refresh in browser
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R
```

---

## 📊 Statistics to Mention

- **Smart Contracts:** 7+ Solidity contracts
- **Functions:** 50+ contract functions
- **Frontend:** Pure JavaScript (no frameworks)
- **Blockchain:** Ethereum-compatible (Ganache)
- **Standards:** ERC721 NFT standard
- **Features:** Create, Breed, Battle, Trade, Leaderboard

---

## 🎬 Quick Demo Checklist

Before presenting:
- [ ] Terminal ready with project directory
- [ ] MetaMask installed and Account #0 imported
- [ ] Browser cleared/closed
- [ ] No other Ganache instances running

During presentation:
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:8080`
- [ ] Connect wallet
- [ ] Create zombie
- [ ] Show breeding
- [ ] Demonstrate battle
- [ ] List on marketplace
- [ ] Show leaderboard
- [ ] Highlight "YOU" badge and real blockchain data

---

## 💡 Pro Tips

1. **Prepare Zombies in Advance:**
   - Create 2-3 zombies before the demo
   - Do a few battles for stats
   - This makes the leaderboard more interesting

2. **Have Two Accounts Ready:**
   - Account #0 for main demo
   - Account #1 to show marketplace buying

3. **Terminal Window:**
   - Keep terminal visible to show blockchain logs
   - Highlight transaction confirmations

4. **Talking Points:**
   - "This is running on a local Ethereum blockchain"
   - "All data is permanently stored on-chain"
   - "Each transaction requires gas fees"
   - "MetaMask manages the wallet securely"

---

## 🚪 Shutting Down

When demo is complete:

```bash
# Press Ctrl+C in the terminal
# This stops Ganache and the web server
```

To restart later:
```bash
npm run dev
```

---

## ✅ Final Checklist

Before Demo:
- [ ] Project works locally
- [ ] MetaMask configured
- [ ] At least 1 account imported
- [ ] Internet connection (not required but good to have)

During Demo:
- [ ] Show terminal output
- [ ] Show MetaMask transactions
- [ ] Highlight gas fees
- [ ] Show blockchain data in console
- [ ] Demonstrate all features

After Demo:
- [ ] Answer questions about smart contracts
- [ ] Show Solidity code if asked
- [ ] Explain blockchain concepts

---

## 🎓 Good Luck with Your Presentation!

You've built a complete, production-ready blockchain application. Be proud of your work! 🚀

**Remember:** Keep the terminal visible during the demo to show the blockchain activity happening in real-time!

