const ganache = require('ganache');
const qrcode = require('qrcode-terminal');

async function setupMetamask() {
  // Start Ganache with a specific mnemonic
  const options = {
    wallet: {
      mnemonic: "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
    },
    logging: {
      quiet: true
    }
  };

  const server = ganache.server(options);
  await server.listen(8545);

  // Get the first account's private key
  const provider = server.provider;
  const accounts = await provider.request({ method: "eth_accounts" });
  const privateKey = await provider.request({
    method: "eth_private_key",
    params: [accounts[0]]
  });

  console.log('\n=== MetaMask Setup Instructions ===');
  console.log('1. Open MetaMask');
  console.log('2. Click on the network dropdown (probably says "Ethereum Mainnet")');
  console.log('3. Select "Add Network" > "Add Network Manually"');
  console.log('\nNetwork Configuration:');
  console.log('Network Name: Ganache Local');
  console.log('New RPC URL: http://127.0.0.1:8545');
  console.log('Chain ID: 1337');
  console.log('Currency Symbol: ETH');
  
  console.log('\nTo import the account:');
  console.log('1. Click on your account icon');
  console.log('2. Select "Import Account"');
  console.log('3. Paste this private key:');
  console.log(privateKey);
  
  console.log('\nOr scan this QR code with MetaMask mobile:');
  qrcode.generate(privateKey);
}

setupMetamask(); 