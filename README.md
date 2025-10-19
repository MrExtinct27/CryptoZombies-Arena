# CryptoZombies Arena - Enhanced DApp

## 👥 Team Members

- **Yash Mahajan** - CWID: 835167255 
- **Arnav Tanawade** - CWID: 879953479 
- **Bhavana Athavane** - CWID: 884423609 
- **Pratik** - CWID: 810819599 

---

## 📖 Project Description

CryptoZombies Arena is a comprehensive blockchain-based gaming DApp built on Ethereum. This project transforms the basic CryptoZombies starter code into a fully-featured NFT game with marketplace capabilities, battle system, breeding mechanics, and real-time leaderboards. Players can create zombies, breed them to create offspring with custom names, engage in battles, trade zombies in an NFT marketplace, and compete on global leaderboards.

The application demonstrates full-stack blockchain development with smart contract interaction, Web3 integration, and modern frontend design principles.

---

## 🚀 Major Improvements & Features

### 1. **Complete Frontend Development** 
- **Modern, Responsive UI**: Built a professional web interface with a sleek blue theme
- **Interactive Animations**: Added visual effects for zombie creation, battles, and level-ups
- **Real-time Updates**: Dynamic UI updates reflecting blockchain state changes
- **Multi-section Navigation**: Organized interface with sections for Army, Breeding, Battle, Marketplace, and Leaderboard
- **Mobile Responsive**: Optimized for various screen sizes

### 2. **Automated Development Environment** 
- **Single Command Setup**: `npm run dev` handles everything:
  - Automatically starts local Ganache blockchain
  - Compiles all smart contracts
  - Deploys contracts with migration scripts
  - Updates contract addresses in frontend config
  - Starts HTTP server with live reload
  - Displays account credentials for easy MetaMask import
- **No Manual Configuration**: Eliminates need for hard-coded addresses
- **Developer-Friendly**: Automatic contract address synchronization

### 3. **Enhanced Breeding System** 
- **Custom Naming**: Players can name offspring before breeding (no more "NoName")
- **Interactive Modal**: User-friendly interface for entering zombie names
- **Name Validation**: Ensures zombie names meet length requirements (3-20 characters)
- **Instant Refresh**: Automatically updates zombie army after successful breeding
- **Victory Rewards**: Automatic breeding rewards after winning battles

### 4. **NFT Marketplace** 
- **List Zombies for Sale**: Players can sell their zombies with custom prices and descriptions
- **Browse Market**: View all available zombies with detailed information
- **Buy Mechanism**: Purchase zombies from other players using ETH
- **Ownership Badges**: Visual indicators for your own listings
- **Transaction Safety**: Prevents buying your own zombies
- **Real-time Updates**: Marketplace refreshes after transactions
- **Duplicate Prevention**: Safeguards against multiple listing submissions

### 5. **Global Leaderboard System** 
- **Real Blockchain Data**: Fetches all players and zombies from blockchain events
- **Player Rankings**: Ranks players by wins, total zombies, and level
- **Zombie Rankings**: Displays top zombies by power level
- **Comprehensive Stats**: Shows battles, wins, losses, win rates
- **Player Profiles**: Detailed modal view for each player's zombies
- **Current User Highlighting**: "YOU" badge for easy identification
- **Live Updates**: Refresh button to get latest blockchain data

### 6. **Advanced Wallet Management** 
- **MetaMask Integration**: Seamless wallet connection
- **Connect/Disconnect**: Full control over wallet state
- **Account Switching**: Easy switching between multiple accounts for testing
- **Persistent Connection**: Remembers connection preference
- **Address Display**: Shows connected wallet address and balance
- **Copy Address**: Quick copy functionality for sharing
- **Network Validation**: Ensures connection to correct blockchain network

### 7. **Battle System** 
- **Zombie vs Zombie Battles**: Engage in turn-based combat
- **Win/Loss Tracking**: Records battle outcomes on blockchain
- **Attack Animations**: Visual feedback during battles
- **Victory Rewards**: New zombie creation from defeated opponent's DNA
- **Level Progression**: Zombies level up based on wins
- **Battle Statistics**: Win rate calculation and display

### 8. **View Army Feature** 
- **Zombie Gallery**: Display all owned zombies with details
- **Visual DNA**: Unique zombie appearance based on DNA
- **Stats Display**: Level, win/loss record, ready time
- **Zombie Selection**: Click to select zombies for breeding or battle
- **Real-time Sync**: Updates automatically after breeding/battles
- **Detailed Information**: Name, DNA, level, and combat history

### 9. **Smart Contract Enhancements** 
- **Modular Architecture**: Inherited contract structure (Factory → Feeding → Attack → Marketplace)
- **Gas Optimization**: Efficient contract methods
- **Event Emissions**: Comprehensive event logging for frontend tracking
- **Access Control**: Owner-only functions using OpenZeppelin's Ownable
- **SafeMath Integration**: Prevents integer overflow/underflow
- **Testing Optimization**: Removed cooldown timers for demo purpose.

---

## 🛠️ Technologies Used

- **Blockchain**: Ethereum, Solidity ^0.8.20
- **Development Framework**: Truffle Suite
- **Local Blockchain**: Ganache
- **Web3 Library**: Web3.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), jQuery
- **Wallet Integration**: MetaMask
- **Package Management**: npm
- **Development Server**: BrowserSync (live reload)
- **Version Control**: Git

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MetaMask browser extension

### Quick Start (Recommended)

1. **Navigate to project directory**
   ```bash
   cd Cryptozombie_Midterm_Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development environment**
   ```bash
   npm run dev
   ```

   This single command will:
   - Start local Ganache blockchain on port 8545
   - Compile all Solidity contracts
   - Deploy contracts to the local blockchain
   - Update contract addresses in frontend
   - Start HTTP server on port 8080
   - Display account credentials for MetaMask import

4. **Setup MetaMask**
   - Add Network:
     - Network Name: `Local Ganache`
     - RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `1337`
     - Currency Symbol: `ETH`
   
   - Import Accounts:
     - Copy private keys from terminal output (displayed after `npm run dev`)
     - In MetaMask: Click account icon → Import Account → Paste private key
     - Import at least 2 accounts for marketplace testing

5. **Open Application**
   - Navigate to: `http://localhost:8080`
   - Click "Connect Wallet" and approve MetaMask connection
   - Start creating and battling zombies!

---

## 🎮 How to Use

### Creating Your First Zombie
1. Click "Create Zombie" on the home page
2. Enter a unique name for your zombie
3. Approve the transaction in MetaMask
4. Wait for confirmation (your zombie will appear in "View Army")

### Breeding Zombies
1. Navigate to "Breeding" section
2. Select two parent zombies from your army
3. Enter a name for the offspring
4. Approve gas fee in MetaMask
5. New zombie appears in your army with mixed DNA

### Battle System
1. Go to "Battle" section
2. Select your zombie to fight with
3. Choose an opponent zombie (from your army)
4. Watch the battle animation
5. Winner gains experience and levels up

### NFT Marketplace
1. **Selling:**
   - Switch to "Sell My Zombies" view
   - Select zombie to sell
   - Enter price (in ETH) and description
   - Approve transaction
   - Zombie appears in marketplace

2. **Buying:**
   - Switch to "Browse Market" view
   - Browse available zombies
   - Click "Buy Now" on desired zombie
   - Approve transaction
   - Zombie transfers to your wallet

### Leaderboard
- View top players ranked by wins
- See top zombies by power level
- Click on players to see their full army
- Track your global ranking

---

## 📁 Project Structure

```
Cryptozombie_Midterm_Project/
├── contracts/              # Solidity smart contracts
│   ├── zombiefactory.sol   # Base zombie creation
│   ├── zombiefeeding.sol   # Breeding logic
│   ├── zombieattack.sol    # Battle system
│   ├── zombiehelper.sol    # Helper functions
│   ├── zombieownership.sol # ERC721 implementation
│   └── zombiemarketplace.sol # Marketplace logic
├── js/                     # JavaScript files
│   ├── app.js              # Main application logic
│   ├── contracts.js        # Web3 contract interactions
│   ├── config.js           # Contract ABI and address
│   ├── battle.js           # Battle system logic
│   ├── breeding.js         # Breeding mechanics
│   ├── marketplace-new.js  # Marketplace functionality
│   ├── leaderboard.js      # Leaderboard system
│   ├── ui.js               # UI interactions
│   └── effects.js          # Visual effects
├── css/
│   └── styles.css          # Application styling
├── migrations/             # Truffle deployment scripts
├── scripts/
│   └── dev-environment.js  # Automated dev setup
├── test/                   # Contract tests
├── index.html              # Main HTML file
├── package.json            # npm dependencies
├── truffle-config.js       # Truffle configuration
├── PRESENTATION_GUIDE.md   # Demo instructions
├── QUICK_DEMO_COMMANDS.txt # Quick reference
└── README.md               # This file
```

---

## 🎯 Key Differences from Starter Code

1. **No Hard-Coding**: Contract addresses automatically updated
2. **Complete Frontend**: Fully functional web interface vs. basic starter
3. **Automated Setup**: One command vs. multiple manual steps
4. **Additional Features**: Marketplace, leaderboard, advanced breeding
5. **Modern UI**: Professional design vs. basic HTML
6. **Wallet Management**: Full connect/disconnect/switch capabilities
7. **Enhanced Contracts**: Added marketplace and helper functions
8. **Developer Tools**: Comprehensive documentation and scripts
9. **Production-Ready**: Error handling, validation, user feedback
10. **Scalable Architecture**: Modular code structure

---

**GitHub Repository**: https://github.com/MrExtinct27/CryptoZombies-Arena

---

*This project was developed as part of CPSC 559- Advanced Blockchain Technologies - Midterm Project*

