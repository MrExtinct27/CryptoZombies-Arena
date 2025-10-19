const { spawn } = require('child_process');
const ganache = require('ganache');
const qrcode = require('qrcode-terminal');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const browserSync = require('browser-sync').create();

async function updateContractAddress() {
  try {
    // Read the contract artifact - now using ZombieMarketplace (top-level contract)
    const artifactPath = path.join(__dirname, '../build/contracts/ZombieMarketplace.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Get the latest network ID and address
    const networkIds = Object.keys(artifact.networks);
    const latestNetworkId = networkIds[networkIds.length - 1];
    const contractAddress = artifact.networks[latestNetworkId].address;

    // Update config.js
    const configPath = path.join(__dirname, '../js/config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    const lines = configContent.split('\n');
    const addressLineIndex = lines.findIndex(line => line.includes('CONTRACT_ADDRESS'));
    if (addressLineIndex !== -1) {
        lines[addressLineIndex] = `const CONTRACT_ADDRESS = '${contractAddress}';`;
        fs.writeFileSync(configPath, lines.join('\n'));
    }

    console.log(`Contract address updated to: ${contractAddress}`);
    console.log('Updated in config.js (ZombieMarketplace with full breeding support)');
    return contractAddress;
  } catch (error) {
    console.error('Error updating contract address:', error);
    throw error;
  }
}

async function startHttpServer() {
  console.log('\n5. Starting HTTP server...');
  // Initialize browser-sync
  browserSync.init({
    server: "./",
    port: 8080,
    files: ["./**/*.{html,css,js}"],
    open: false,
    notify: false,
    ui: false,
    watch: true,
    reloadDelay: 1000,
    reloadDebounce: 1000
  });
}

async function startDevEnvironment() {
  console.log('\n=== Starting Development Environment ===\n');

  // Create a deterministic wallet
  const options = {
    wallet: {
      seed: "test test test test test test test test test test test junk", // Deterministic seed
      total_accounts: 10,
      default_balance_ether: 100,
      unlock: true
    },
    logging: {
      quiet: true
    },
    chain: {
      chainId: 1337
    }
  };

  console.log('1. Starting Ganache...');
  const server = ganache.server(options);
  await server.listen(8545);

  // Connect to ganache with Web3
  const web3 = new Web3('http://localhost:8545');
  const accounts = await web3.eth.getAccounts();
  
  // Get the first account details from Ganache
  const balance = await web3.eth.getBalance(accounts[0]);
  const balanceInEth = web3.utils.fromWei(balance, 'ether');

  // Get private key from the server
  const privateKey = Object.values(server.provider.getInitialAccounts())[0].secretKey;

  console.log('\n=== Development Environment Details ===');
  console.log('Available Accounts:', accounts.length);
  console.log('\nFirst Account Details:');
  console.log('Address:', accounts[0]);
  console.log('Private Key:', privateKey);
  console.log('Balance:', balanceInEth, 'ETH');

  console.log('\n=== MetaMask Setup Instructions ===');
  console.log('1. Add Network:');
  console.log('   Network Name: Ganache Local');
  console.log('   RPC URL: http://127.0.0.1:8545');
  console.log('   Chain ID: 1337');
  console.log('   Currency Symbol: ETH');
  
  console.log('\n2. Import Account:');
  console.log('   - Open MetaMask');
  console.log('   - Click "Import Account"');
  console.log('   - Copy and paste this private key (without 0x):', privateKey?.replace('0x', ''));

  // Run truffle compile
  console.log('\n3. Compiling contracts...');
  await runCommand('truffle', ['compile']);

  // Run truffle migrate
  console.log('\n4. Migrating contracts...');
  await runCommand('truffle', ['migrate', '--reset']);
  
  // Update contract address in index.html
  console.log('\nUpdating contract address...');
  const contractAddress = await updateContractAddress();

  // Start HTTP server
  await startHttpServer();

  // Watch for changes in index.html
  const watcher = chokidar.watch(['./**/*.{html,css,js}'], {
    persistent: true,
    ignoreInitial: true,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    cwd: '.'
  });

  watcher.on('change', async (path) => {
    console.log(`\n${path} changed. Reloading browsers...`);
    browserSync.reload();
  });

  // Get account details for display
  const allAccounts = Object.entries(server.provider.getInitialAccounts());
  const account0 = allAccounts[0];
  const account1 = allAccounts[1];

  console.log('\n' + '='.repeat(80));
  console.log('🚀 DEVELOPMENT ENVIRONMENT READY');
  console.log('='.repeat(80));
  console.log('\n📍 Application URL: http://localhost:8080');
  console.log('🔗 Blockchain RPC: http://127.0.0.1:8545');
  console.log('⛓️  Chain ID: 1337');
  console.log('📦 Contract Address:', contractAddress);
  
  console.log('\n' + '='.repeat(80));
  console.log('💰 ACCOUNTS FOR TESTING (Import these in MetaMask)');
  console.log('='.repeat(80));
  
  console.log('\n👤 ACCOUNT #0:');
  console.log('   Address:     ' + account0[0]);
  console.log('   Private Key: ' + account0[1].secretKey.replace('0x', ''));
  console.log('   Balance:     100 ETH');
  
  console.log('\n👤 ACCOUNT #1:');
  console.log('   Address:     ' + account1[0]);
  console.log('   Private Key: ' + account1[1].secretKey.replace('0x', ''));
  console.log('   Balance:     100 ETH');
  
  console.log('\n' + '='.repeat(80));
  console.log('📝 METAMASK SETUP:');
  console.log('='.repeat(80));
  console.log('1. Add Network → Manual');
  console.log('   Network Name: Local Ganache');
  console.log('   RPC URL:      http://127.0.0.1:8545');
  console.log('   Chain ID:     1337');
  console.log('   Symbol:       ETH');
  console.log('\n2. Import Account → Paste private key (without 0x prefix)');
  console.log('\n3. Open http://localhost:8080 and click "Connect Wallet"');
  console.log('\n' + '='.repeat(80));
  console.log('\n⌨️  Press Ctrl+C to stop\n');

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\nShutting down development environment...');
    browserSync.exit();
    watcher.close();
    process.exit();
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { shell: true });

    process.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`${data}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

startDevEnvironment().catch(error => {
  console.error('Error starting development environment:', error);
  process.exit(1);
}); 