# Blockchain Integration - Troubleshooting Guide

## Summary of Fixes

### 1. Token Deployment Issue ✅

**Problem**: Invalid BytesLike value error when deploying test token
**Solution**:

- Used compiled `MockERC20.sol` artifact instead of hardcoded bytecode
- Added `resolveJsonModule: true` to `tsconfig.json`
- Deployed test cUSD token: `0x845D9D0B4Be004Dcbc17b11160B0C18abBD5FEBD`

### 2. Contract Mismatch Issue ✅

**Problem**: TaskEscrow contract was deployed with wrong cUSD address
**Solution**:

- Created diagnostic script (`check-contract-config.ts`)
- Redeployed TaskEscrow with correct cUSD token
- New TaskEscrow address: `0xa520d207c91C0FE0e9cFe8D63AbE02fd18B2254e`

### 3. Approval Issue ✅

**Problem**: Contract couldn't transfer cUSD (no allowance)
**Solution**:

- Created `approve-cusd.ts` script
- Added `checkAllowance()` and `approveCUSD()` methods to blockchain service
- Approved contract to spend cUSD tokens

### 4. AI Verification JSON Parsing ✅

**Problem**: Gemini returning incomplete/malformed JSON responses
**Solution**:

- Added `responseMimeType: "application/json"` to Gemini API calls
- Improved JSON extraction with regex fallback
- Added better error handling and logging
- Implemented fallback parsing for malformed responses

### 5. Task Not Found Error ⚠️

**Problem**: "Task does not exist" error when approving submissions
**Root Cause**: Multiple possible causes:

1. Different project directories (`D:\new-celo` vs current workspace)
2. Old tasks pointing to old contract addresses
3. Database/blockchain sync issues

**Solution**:

- Added `getTask()` method to verify task existence
- Added `getTaskCounter()` to check blockchain state
- Created diagnostic scripts:
  - `diagnose-task-mismatch.ts` - Check DB vs blockchain
  - `cleanup-old-tasks.ts` - Mark invalid tasks as expired
  - `show-env-info.ts` - Show complete environment info

## Deployed Contracts

```
cUSD Token:       0x845D9D0B4Be004Dcbc17b11160B0C18abBD5FEBD
TaskEscrow:       0xa520d207c91C0FE0e9cFe8D63AbE02fd18B2254e
Network:          Celo Sepolia Testnet
Chain ID:         11142220
```

## Useful Scripts

### Deployment

```bash
# Deploy test cUSD token
npx tsx deploy-test-token.ts

# Deploy TaskEscrow contract
npx tsx redeploy-task-escrow.ts

# Approve cUSD spending
npx tsx approve-cusd.ts

# Create test task
npx tsx create-task-with-blockchain.ts
```

### Diagnostics

```bash
# Check contract configuration
npx tsx check-contract-config.ts

# Diagnose task mismatch
npx tsx diagnose-task-mismatch.ts

# Cleanup old/invalid tasks
npx tsx cleanup-old-tasks.ts

# Show environment info
npx tsx show-env-info.ts
```

### Testing

```bash
# Test Gemini JSON response
npx tsx test-gemini-json.ts
```

## Common Issues & Solutions

### Issue: "Task does not exist" on blockchain

**Check**:

1. Run `npx tsx show-env-info.ts` to verify contract addresses
2. Run `npx tsx diagnose-task-mismatch.ts` to check tasks
3. Ensure you're in the correct project directory

**Fix**:

- If using wrong contract: Update `CONTRACT_ADDRESS` in `.env`
- If tasks are old: Run `npx tsx cleanup-old-tasks.ts`
- If starting fresh: Create new task with `npx tsx create-task-with-blockchain.ts`

### Issue: "Insufficient allowance"

**Check**: Run `npx tsx check-contract-config.ts`

**Fix**: Run `npx tsx approve-cusd.ts`

### Issue: Gemini JSON parsing errors

**Check**: Look for "Invalid JSON response from Gemini" in logs

**Fix**:

- Already implemented: JSON mode in API calls
- Fallback parsing with regex
- Logs now show raw response for debugging

### Issue: Different project directories

**Check**: `process.cwd()` and paths in error messages

**Fix**: Ensure you're running commands from the correct directory:

```bash
cd C:\Users\RAJ\OneDrive\Desktop\micro-job-ai-agent-web3\server
```

## Environment Variables Required

```env
# Database
DATABASE_URL=<your_prisma_accelerate_url>

# Blockchain
PRIVATE_KEY=<your_private_key>
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CHAIN_ID=11142220
CONTRACT_ADDRESS=0xa520d207c91C0FE0e9cFe8D63AbE02fd18B2254e
CUSD_SEPOLIA_ADDRESS=0x845D9D0B4Be004Dcbc17b11160B0C18abBD5FEBD

# AI
GEMINI_API_KEY=<your_gemini_api_key>
```

## Next Steps

1. ✅ Verify environment: `npx tsx show-env-info.ts`
2. ✅ Check task status: `npx tsx diagnose-task-mismatch.ts`
3. ✅ Test AI verification: `npx tsx test-gemini-json.ts`
4. Create new task if needed: `npx tsx create-task-with-blockchain.ts`
5. Test full workflow: Submit task → AI verifies → Payment released

## Architecture Improvements Made

### Blockchain Service

- ✅ Added task verification before operations
- ✅ Added detailed logging
- ✅ Added helper methods: `getTask()`, `getTaskCounter()`, `getContractAddress()`
- ✅ Better error messages with context

### AI Verification Service

- ✅ JSON mode for Gemini API
- ✅ Fallback parsing for malformed responses
- ✅ Better error logging
- ✅ Response validation

### Tooling

- ✅ Comprehensive diagnostic scripts
- ✅ Automated cleanup tools
- ✅ Environment validation
- ✅ Easy testing scripts
