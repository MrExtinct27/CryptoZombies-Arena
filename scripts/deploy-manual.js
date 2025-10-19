const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

async function deployContracts() {
  console.log('\n🚀 Manual Contract Deployment\n');
  
  // Connect to Ganache
  const web3 = new Web3('http://127.0.0.1:8545');
  
  // Get accounts
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  
  console.log('Deploying from account:', deployer);
  
  try {
    // Read the compiled contract
    const contractPath = path.join(__dirname, '../build/contracts/ZombieMarketplace.json');
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    console.log('✅ Contract artifact loaded');
    
    // Create contract instance
    const ZombieMarketplace = new web3.eth.Contract(contractJson.abi);
    
    console.log('📝 Deploying ZombieMarketplace...');
    
    // Deploy (use estimation first)
    const deployTx = ZombieMarketplace.deploy({
      data: contractJson.bytecode
    });
    
    const gasEstimate = await deployTx.estimateGas({ from: deployer });
    console.log(`📊 Estimated gas: ${gasEstimate}`);
    
    const deployed = await deployTx.send({
      from: deployer,
      gas: Math.floor(gasEstimate * 1.2), // 20% buffer
      gasPrice: '20000000000'
    });
    
    console.log('✅ Contract deployed at:', deployed.options.address);
    
    // Update config.js
    const configPath = path.join(__dirname, '../js/config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    const lines = configContent.split('\n');
    const addressLineIndex = lines.findIndex(line => line.includes('CONTRACT_ADDRESS'));
    
    if (addressLineIndex !== -1) {
      lines[addressLineIndex] = `const CONTRACT_ADDRESS = '${deployed.options.address}';`;
      fs.writeFileSync(configPath, lines.join('\n'));
      console.log('✅ Updated config.js with new address');
    }
    
    // Update the artifact file with network info
    const networkId = await web3.eth.net.getId();
    contractJson.networks = contractJson.networks || {};
    contractJson.networks[networkId] = {
      address: deployed.options.address,
      transactionHash: deployed._deploymentTransaction.transactionHash
    };
    fs.writeFileSync(contractPath, JSON.stringify(contractJson, null, 2));
    console.log('✅ Updated contract artifact');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DEPLOYMENT SUCCESSFUL');
    console.log('='.repeat(80));
    console.log(`Contract Address: ${deployed.options.address}`);
    console.log(`Network ID: ${networkId}`);
    console.log(`Deployer: ${deployer}`);
    console.log('='.repeat(80) + '\n');
    
    return deployed.options.address;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployContracts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

