#!/bin/bash

# Pre-Demo Test Script
# Run this before your presentation to verify everything works

echo "═══════════════════════════════════════════════════════════════"
echo "          CRYPTOZOMBIES ARENA - PRE-DEMO TEST"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check Node.js
echo "1. Checking Node.js installation..."
if command -v node &> /dev/null
then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js installed: $NODE_VERSION"
else
    echo "   ❌ Node.js not found! Please install Node.js first."
    exit 1
fi

# Check npm
echo ""
echo "2. Checking npm installation..."
if command -v npm &> /dev/null
then
    NPM_VERSION=$(npm -v)
    echo "   ✅ npm installed: $NPM_VERSION"
else
    echo "   ❌ npm not found! Please install npm first."
    exit 1
fi

# Check if we're in the right directory
echo ""
echo "3. Checking project directory..."
if [ -f "package.json" ]; then
    echo "   ✅ package.json found"
else
    echo "   ❌ Not in project directory! Please cd to the project folder."
    exit 1
fi

# Check if node_modules exists
echo ""
echo "4. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ⚠️  Dependencies not installed. Installing now..."
    npm install
fi

# Check if contracts exist
echo ""
echo "5. Checking smart contracts..."
if [ -d "contracts" ]; then
    CONTRACT_COUNT=$(ls -1 contracts/*.sol 2>/dev/null | wc -l)
    echo "   ✅ Found $CONTRACT_COUNT Solidity contracts"
else
    echo "   ❌ Contracts folder not found!"
    exit 1
fi

# Check if port 8545 is available
echo ""
echo "6. Checking if port 8545 is available..."
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ⚠️  Port 8545 is in use. Killing process..."
    lsof -ti:8545 | xargs kill -9 2>/dev/null
    sleep 2
    echo "   ✅ Port 8545 is now available"
else
    echo "   ✅ Port 8545 is available"
fi

# Check if port 8080 is available
echo ""
echo "7. Checking if port 8080 is available..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ⚠️  Port 8080 is in use. Killing process..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    sleep 2
    echo "   ✅ Port 8080 is now available"
else
    echo "   ✅ Port 8080 is available"
fi

# Clean build folder
echo ""
echo "8. Cleaning previous build..."
if [ -d "build" ]; then
    rm -rf build/
    echo "   ✅ Build folder cleaned"
else
    echo "   ✅ No previous build to clean"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    ✅ ALL CHECKS PASSED!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🚀 Ready to start! Run this command:"
echo ""
echo "   npm run dev"
echo ""
echo "Then:"
echo "   1. Open http://localhost:8080 in browser"
echo "   2. Setup MetaMask with Ganache Local network"
echo "   3. Import Account #0 private key:"
echo "      6253e7a56ee838a325bd0497ae5e58cace66792c5c9e23dea30b6dabcea95ec6"
echo ""
echo "📖 See QUICK_DEMO_COMMANDS.txt for full guide"
echo ""
echo "═══════════════════════════════════════════════════════════════"

