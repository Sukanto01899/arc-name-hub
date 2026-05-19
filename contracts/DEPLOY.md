# Deploy ArcNames on Remix

## Step 1 — Get Arc Testnet USDC

Go to: https://faucet.circle.com  
Select: Arc Testnet  
Paste your MetaMask wallet address  
Click Get USDC — copy the USDC contract address shown on that page

## Step 2 — Add Arc Testnet to MetaMask

| Field            | Value                                  |
|------------------|----------------------------------------|
| Network Name     | Arc Testnet                            |
| RPC URL          | https://rpc.testnet.arc.network        |
| Chain ID         | 5042002                                |
| Currency Symbol  | USDC                                   |
| Decimals         | 18                                     |
| Explorer         | https://testnet.arcscan.app            |

## Step 3 — Deploy on Remix

1. Go to https://remix.ethereum.org
2. Create a new file `ArcNames.sol` and paste the full contract code
3. **Compile tab:**
   - Compiler version: `0.8.24`
   - Enable optimization: ✓
   - Runs: `200`
   - Click Compile ArcNames.sol
4. **Deploy tab:**
   - Environment: `Injected Provider - MetaMask`
   - Switch MetaMask to Arc Testnet (Chain ID 2911)
   - Contract: `ArcNames`
   - Constructor arg `_usdcToken`: paste the Arc testnet USDC address from Step 1
   - Click **Deploy**
   - Confirm in MetaMask
5. Copy the deployed contract address from the Deployed Contracts section

## Step 4 — Fill in config.json

Paste the deployed address into `contracts/config.json`:

```json
{
  "ARC_TESTNET": {
    "chainId": 2911,
    "rpc": "https://rpc.arc.io/testnet",
    "usdcAddress": "0x...",
    "arcNamesAddress": "0x...",
    "deployerAddress": "0x..."
  }
}
```

Also paste both addresses into `.env.local`:

```
NEXT_PUBLIC_ARCNAMES_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
```

## Step 5 — Test on Remix

After deploy, call these functions directly in Remix to verify:

```
isAvailable("sukanto")     → true
getPrice("sukanto")        → 2000000  (2 USDC)
getPrice("sk")             → 160000000 (160 USDC)
getPrice("a")              → 640000000 (640 USDC)
isValidName("sukanto")     → true
isValidName("-bad")        → false
isValidName("Bad")         → false
```

To test registration:
1. Go to the USDC contract in Remix → call `approve(arcNamesAddress, 10000000)` — approves 10 USDC
2. Back on ArcNames → call `register("sukanto", 1)`
3. Call `resolve("sukanto")` → should return your wallet address
4. Call `reverseLookup(yourAddress)` → should return "sukanto"
