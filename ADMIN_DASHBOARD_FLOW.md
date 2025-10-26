# Admin Dashboard Task Creation Flow

## Overview

The admin dashboard now has complete task creation functionality with database integration, similar to the server-side `create-task-with-blockchain.ts` script.

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD (PORT 4000)                  │
│                                                                 │
│  1. User fills form:                                           │
│     - Task Name                                                │
│     - Task Type                                                │
│     - Description                                              │
│     - Payment Amount (cUSD)                                    │
│     - Duration (days)                                          │
│     - Worker Address (optional)                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. POST /api/create-task (Admin Dashboard Server)              │
│     - Validates wallet CELO balance                             │
│     - Converts payment to wei                                   │
│     - Calls Smart Contract createTask()                         │
│     - Returns: {taskId, txHash}                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. POST /api/sync-task (Admin Dashboard Server)                │
│     - Prepares complete metadata:                               │
│       * contractTaskId                                          │
│       * transactionHash                                         │
│       * paymentAmount                                           │
│       * taskName, taskType, description                         │
│       * maxSubmissions (10 by default)                          │
│       * durationInDays                                          │
│       * verificationCriteria                                    │
│     - Forwards to Backend Server                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. POST /api/tasks/sync (Backend Server - Port 3001)           │
│     - Receives complete task metadata                           │
│     - Finds or creates admin user: "0xadmin_blockchain"         │
│     - Creates Task record in database with:                     │
│       * requesterId: adminUser.id                               │
│       * title, description, taskType                            │
│       * paymentAmount                                           │
│       * maxSubmissions (from request)                           │
│       * contractTaskId (blockchain ID)                          │
│       * expiresAt (calculated from durationInDays)              │
│       * verificationCriteria (with transaction hash)            │
│       * status: "open"                                          │
│     - Returns: {task: {...}, message: "Task synced"}            │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Task Available                                              │
│     - On blockchain: TaskEscrow contract holds funds            │
│     - In database: Task record ready for workers                │
│     - Workers can submit work via main client app               │
│     - Payments processed automatically on approval              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Changes Made

### 1. **Admin Dashboard Server** (`client_admin/src/server.js`)

Enhanced `/api/sync-task` endpoint to include:

- `maxSubmissions` (defaults to 10)
- `durationInDays` (used to calculate expiration)
- Complete `verificationCriteria` object
- Proper error handling and validation

### 2. **Admin Dashboard Frontend** (`client_admin/src/public/index.html`)

Updated task creation flow to:

- Collect all task metadata
- Send complete data to backend sync endpoint
- Include duration and max submissions in metadata
- Provide better success/error feedback

### 3. **Backend Task Controller** (`server/src/controllers/task.controller.ts`)

Updated `syncTask` method to:

- Accept `maxSubmissions` and `durationInDays` parameters
- Calculate `expiresAt` from duration (instead of hardcoded 30 days)
- Use provided `verificationCriteria` (instead of hardcoded values)
- Support custom task configuration

## Database Record Structure

When a task is created via admin dashboard, this record is created:

```json
{
  "id": "uuid-generated",
  "requesterId": "admin-user-id",
  "title": "User-provided task name",
  "description": "User-provided description",
  "taskType": "User-selected type (text-labeling, etc.)",
  "paymentAmount": 0.01,
  "status": "open",
  "verificationCriteria": {
    "transactionHash": "0xabcd...",
    "blockchainCreated": true
  },
  "maxSubmissions": 10,
  "contractTaskId": 1,
  "expiresAt": "2025-11-26T00:00:00Z",
  "createdAt": "2025-10-26T12:00:00Z",
  "updatedAt": "2025-10-26T12:00:00Z"
}
```

## How to Use

### 1. Start Admin Dashboard

```bash
cd client_admin
npm start
```

Dashboard runs on `http://localhost:4000`

### 2. Ensure Backend is Running

```bash
cd server
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Create Task via Admin Dashboard

1. Enter task details
2. Click "Approve cUSD" button (one-time approval)
3. Click "Create Task on Blockchain"
4. Task is automatically synced to database
5. Workers can now see the task in the main app

## Database Query Examples

### Find all blockchain-created tasks:

```sql
SELECT * FROM tasks
WHERE contract_task_id IS NOT NULL
ORDER BY created_at DESC;
```

### Find tasks by admin user:

```sql
SELECT t.* FROM tasks t
JOIN users u ON t.requester_id = u.id
WHERE u.wallet_address = '0xadmin_blockchain'
ORDER BY t.created_at DESC;
```

### Find tasks expiring soon:

```sql
SELECT * FROM tasks
WHERE expires_at < NOW() + INTERVAL '7 days'
AND expires_at > NOW()
AND status = 'open';
```

## Error Handling

### Blockchain Transaction Fails

- Error shown: "Create task error"
- Details: Reason from smart contract
- Solution: Check cUSD balance and allowance

### Database Sync Fails

- Error shown: "Task created on blockchain but sync failed"
- Task still exists on blockchain with `contractTaskId`
- Can retry sync by hitting backend `/api/tasks/sync` manually

### Missing Wallet Info

- Error shown: "Error loading wallet info"
- Check: CELO_RPC_URL and CONTRACT_ADDRESS env vars

## Env Variables Required

In `.env` for admin dashboard:

```
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...
CUSD_SEPOLIA_ADDRESS=0x...
BACKEND_URL=http://localhost:3001
PORT=4000
```

## Testing

### Create a test task:

1. Open admin dashboard
2. Fill form:
   - Task Name: "Test Admin Task"
   - Type: "text-labeling"
   - Description: "Testing admin flow"
   - Payment: 0.01 cUSD
   - Duration: 7 days
3. Click "Create Task on Blockchain"
4. Wait for blockchain + database sync
5. Check database: `npx prisma studio`

### Verify in Database:

1. Open `http://localhost:5555` (Prisma Studio)
2. Navigate to `tasks` table
3. Find task with matching `contract_task_id`
4. Verify all fields are populated correctly

## Troubleshooting

| Issue                               | Solution                                               |
| ----------------------------------- | ------------------------------------------------------ |
| "Insufficient CELO balance for gas" | Add CELO to wallet (0.001 minimum)                     |
| "Insufficient cUSD allowance"       | Click "Approve cUSD" button                            |
| "Failed to sync task to backend"    | Check BACKEND_URL env var                              |
| Task on blockchain but not in DB    | Check server logs, may need to retry `/api/tasks/sync` |
| Empty wallet info                   | Check RPC_URL and contract connectivity                |

## Next Steps

### For Workers:

- Task appears in main app at `http://localhost:3000/tasks`
- Workers can submit their work
- Verification runs automatically
- Payments released on approval

### For Admin:

- Monitor task progress via Prisma Studio
- Check payment status in database
- Track submissions and approvals
