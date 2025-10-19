# Startup Workaround for macOS Truffle Error

## Issue
You're encountering: `SystemError: uv_interface_addresses returned Unknown system error 1`

This is a known macOS issue with Truffle's network interface detection.

## Solution: Manual Startup (For Demo)

### Method 1: Use Existing Build (Recommended for Demo)

If contracts are already deployed (build/ folder exists):

```bash
# 1. Start Ganache in terminal 1
npx ganache --wallet.mnemonic "test test test test test test test test test test test junk" --wallet.totalAccounts 10 --wallet.defaultBalance 100 --server.host 127.0.0.1 --server.port 8545 --chain.chainId 1337

# 2. In terminal 2, start web server
npx browser-sync start --server --port 8080 --files "*.html, css/*.css, js/*.js" --no-open --no-notify
```

Then:
- Open http://localhost:8080
- Import accounts in MetaMask using keys displayed by Ganache
- Connect wallet and use the app!

### Method 2: Deploy Manually

If you need to redeploy contracts:

```bash
# Terminal 1: Start Ganache
npx ganache --wallet.mnemonic "test test test test test test test test test test test junk" --wallet.totalAccounts 10 --wallet.defaultBalance 100 --server.host 127.0.0.1 --server.port 8545 --chain.chainId 1337

# Terminal 2: Compile and deploy
truffle compile
truffle migrate --reset --network development

# After deployment, update js/config.js with new contract address
# Find address in: build/contracts/ZombieMarketplace.json

# Terminal 2: Start web server
npx browser-sync start --server --port 8080 --files "*.html, css/*.css, js/*.js" --no-open --no-notify
```

### Method 3: Fix macOS Permissions (Advanced)

This might fix the underlying issue:

```bash
sudo sysctl -w kern.maxproc=2048
sudo sysctl -w kern.maxprocperuid=2048
```

Then try `npm run dev` again.

## For Your Demo

**BEST APPROACH**: 

1. Run the application once successfully BEFORE the demo
2. Keep the Ganache blockchain running
3. Keep MetaMask accounts imported
4. For the demo, just run:
   ```bash
   npx browser-sync start --server --port 8080 --no-open
   ```
5. Everything will work since contracts are already deployed!

## Account Credentials

The deterministic mnemonic generates these accounts:

**Account #0:**
- Address: `0x642995e94cF061e3e99Bf06969c133900c8F1Ab0`
- Private Key: `6253e7a56ee838a325bd0497ae5e58cace66792c5c9e23dea30b6dabcea95ec6`

**Account #1:**
- Address: `0x6b9019c337c864d866ab6d32C3D0B635A936EA27`
- Private Key: `c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3`

(Import these in MetaMask without "0x" prefix)

## Troubleshooting

- **MetaMask shows 0 ETH**: Clear MetaMask activity data, delete and re-add the network
- **Contract not found**: Check that `js/config.js` has correct contract address from `build/contracts/ZombieMarketplace.json`
- **Ganache port in use**: Run `lsof -ti:8545 | xargs kill -9` first

## Quick Test

After starting Ganache, test connection:

```bash
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545
```

Should return: `{"jsonrpc":"2.0","id":1,"result":"0x0"}`

