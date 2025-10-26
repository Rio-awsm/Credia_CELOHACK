# Blockchain Task Sync Flow - Complete Guide

## Overview

This document explains how tasks created via the admin dashboard on the blockchain are automatically synced to the database, making them visible in the main client application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Admin Dashboard (Port 4000)              │
│                    client_admin/src/server.js               │
│                    + client_admin/src/public/index.html     │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 1. User creates task
     │ 2. /api/create-task (blockchain)
     │ 3. Returns { taskId, txHash, metadata }
     │ 4. /api/sync-task (auto-called)
     │
┌────▼────────────────────────────────────────────────────────┐
│                Blockchain Network (Celo Sepolia)           │
│                  TaskEscrow Contract                        │
│            0xa520d207c91C0FE0e9cFe8D63AbE02fd18B2254e      │
│                                                              │
│  ✅ Task stored on-chain with ID 9 (example)              │
│  ✅ Transaction hash: 0xbbfa...                           │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 5. Call backend /api/tasks/sync
     │    with taskId, txHash, metadata
     │
┌────▼────────────────────────────────────────────────────────┐
│                   Backend Server (Port 3001)               │
│            server/src/routes/task.routes.ts                 │
│        server/src/controllers/task.controller.ts            │
│                                                              │
│  ✅ Endpoint: POST /api/tasks/sync                         │
│  ✅ Creates task record in database                        │
│  ✅ Links blockchain task (contractTaskId: 9) to DB       │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 6. Task now in database
     │ 7. Frontend queries database
     │
┌────▼────────────────────────────────────────────────────────┐
│                    Main Client (Port 3000)                  │
│               client/app/tasks/page.tsx                     │
│                                                              │
│  ✅ Task visible at /tasks                                 │
│  ✅ Full task metadata displayed                           │
│  ✅ Workers can submit solutions                           │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Flow

### 1. Admin Creates Task (Frontend)

**Location:** `client_admin/src/public/index.html`

```javascript
// User fills form and clicks "Create Task on Blockchain"
const body = {
  taskName: "Cat Identification",
  taskType: "image_labeling",
  description: "Label cat breeds",
  paymentAmount: 0.01,
  durationInDays: 7,
  workerAddress: undefined,
};

// Call admin dashboard API
const resp = await fetch("/api/create-task", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
```

### 2. Admin Dashboard Creates Blockchain Task

**Location:** `client_admin/src/server.js` - `POST /api/create-task`

```javascript
// 1. Parse payment amount
const amountWei = ethers.parseEther(String(paymentAmount));

// 2. Call smart contract
const tx = await contract.createTask(amountWei, Number(durationInDays));
const receipt = await tx.wait();

// 3. Parse TaskCreated event from logs
let taskId = null;
for (const log of receipt.logs) {
  try {
    const parsed = contract.interface.parseLog(log);
    if (parsed.name === "TaskCreated") {
      taskId = parsed.args[0].toString(); // Extract task ID
      break;
    }
  } catch (e) {
    // Continue parsing
  }
}

// 4. Return success with metadata
return res.json({
  success: true,
  txHash: receipt.hash,
  taskId,
  metadata: {
    name: taskName,
    type: taskType,
    description,
  },
});
```

**Result on blockchain:**

- ✅ Task ID 9 created on TaskEscrow contract
- ✅ Transaction hash stored: `0xbbfa...`
- ✅ Event emitted: `TaskCreated(9, ...)`

### 3. Frontend Automatically Syncs to Database

**Location:** `client_admin/src/public/index.html` - After task creation

```javascript
// After blockchain confirmation, automatically call sync
const syncResp = await fetch("/api/sync-task", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    taskId: json.taskId, // 9
    txHash: json.txHash, // 0xbbfa...
    metadata: json.metadata, // { name, type, description }
    paymentAmount: parseFloat(paymentAmount), // 0.01
  }),
});

const syncJson = await syncResp.json();

// Check response format from backend
if (syncResp.ok && syncJson.success) {
  // Sync successful
  showResult(
    `Task created and synced!`,
    true,
    `TaskId: ${json.taskId}<br/>DB ID: ${syncJson.data?.task?.id}<br/>Status: Live in database`
  );
} else {
  // Sync failed but blockchain task exists
  showResult(
    `Task created on blockchain but sync failed`,
    false,
    `BlockchainId: ${json.taskId}<br/>Error: ${errorMsg}`
  );
}
```

### 4. Admin Server Forwards Sync Request

**Location:** `client_admin/src/server.js` - `POST /api/sync-task`

```javascript
app.post("/api/sync-task", async (req, res) => {
  const { taskId, txHash, metadata } = req.body;

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
  console.log(`Syncing task ${taskId} to backend: ${backendUrl}`);

  // Forward to backend with full metadata
  const syncResponse = await fetch(`${backendUrl}/api/tasks/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contractTaskId: parseInt(taskId),
      transactionHash: txHash,
      paymentAmount: metadata?.paymentAmount || "0",
      taskName: metadata?.name,
      taskType: metadata?.type,
      description: metadata?.description,
    }),
  });

  const syncedTask = JSON.parse(await syncResponse.text());
  res.json({
    success: true,
    message: "Task synced to backend database",
    task: syncedTask,
  });
});
```

### 5. Backend Creates Database Record

**Location:** `server/src/controllers/task.controller.ts` - `syncTask()` method

```typescript
static async syncTask(req: any, res: Response): Promise<void> {
  const {
    contractTaskId,
    transactionHash,
    paymentAmount,
    taskName,
    taskType,
    description,
  } = req.body;

  // Check if already synced
  const existingTask = await prisma.task.findFirst({
    where: { contractTaskId: parseInt(contractTaskId) },
  });

  if (existingTask) {
    return ResponseUtil.success(res, {
      message: "Task already synced",
      task: existingTask,
    });
  }

  // Find or create admin user for blockchain tasks
  let adminUser = await prisma.user.findFirst({
    where: { walletAddress: "0xadmin_blockchain" },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        walletAddress: "0xadmin_blockchain",
        role: "requester",
        reputationScore: 100,
      },
    });
  }

  // Create task in database
  const task = await prisma.task.create({
    data: {
      requesterId: adminUser.id,
      title: taskName || "Blockchain Task",
      description: description || "Created via blockchain admin dashboard",
      taskType: (taskType as any) || "text_verification",
      paymentAmount: parseFloat(paymentAmount) || 0,
      verificationCriteria: {
        transactionHash: transactionHash,
        blockchainCreated: true,
      },
      maxSubmissions: 10,
      contractTaskId: parseInt(contractTaskId),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: TaskStatus.OPEN,
    },
    include: {
      requester: {
        select: {
          id: true,
          walletAddress: true,
          reputationScore: true,
        },
      },
    },
  });

  // Return success
  ResponseUtil.success(
    res,
    {
      message: "Task synced to database",
      task,
      blockchain: {
        contractTaskId: parseInt(contractTaskId),
        transactionHash,
      },
    },
    201
  );
}
```

### 6. Task Now Visible in Main Client

**Location:** `client/app/tasks/page.tsx`

```typescript
// Main client queries database via API
const response = await fetch("/api/tasks/list?status=open");
const { data: tasks } = await response.json();

// Task 9 now appears in list with full metadata:
{
  id: "uuid-123...",
  title: "Cat Identification",
  description: "Label cat breeds",
  taskType: "image_labeling",
  paymentAmount: 0.01,
  contractTaskId: 9,           // ← Links to blockchain
  status: "open",
  requester: {
    walletAddress: "0xadmin_blockchain",
    reputationScore: 100,
  },
  // ... other fields
}
```

## Response Formats

### Create Task Response (Admin Dashboard API)

```json
{
  "success": true,
  "txHash": "0xbbfa69531998751073654d6c4bb9340aeaa458e6bb48987e75129345616dbfed",
  "taskId": 9,
  "metadata": {
    "name": "Cat Identification",
    "type": "image_labeling",
    "description": "Label cat breeds"
  }
}
```

### Sync Task Response (Backend API)

```json
{
  "success": true,
  "data": {
    "message": "Task synced to database",
    "task": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Cat Identification",
      "description": "Label cat breeds",
      "taskType": "image_labeling",
      "paymentAmount": 0.01,
      "contractTaskId": 9,
      "status": "open",
      "requester": {
        "id": "admin-user-id",
        "walletAddress": "0xadmin_blockchain",
        "reputationScore": 100
      }
    },
    "blockchain": {
      "contractTaskId": 9,
      "transactionHash": "0xbbfa69..."
    }
  }
}
```

## Key Data Points

| Component               | Details                                            |
| ----------------------- | -------------------------------------------------- |
| **Admin Dashboard**     | Port 4000, runs Node.js + ethers.js                |
| **Backend Server**      | Port 3001, Node.js + Express + Prisma + PostgreSQL |
| **Main Client**         | Port 3000, Next.js                                 |
| **Blockchain**          | Celo Sepolia Testnet                               |
| **TaskEscrow Contract** | `0xa520d207c91C0FE0e9cFe8D63AbE02fd18B2254e`       |
| **cUSD Token**          | `0x845D9D0B4Be004Dcbc17b11160B0C18abBD5FEBD`       |
| **Blockchain Link**     | `contractTaskId` field in tasks table              |
| **Admin User**          | `0xadmin_blockchain` (created automatically)       |

## Testing the Flow

### 1. Start all servers

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Admin Dashboard
cd client_admin && npm start

# Terminal 3: Main Client
cd client && npm run dev
```

### 2. Open admin dashboard

```
http://localhost:4000
```

### 3. Create a task

- Fill in task name, type, description, payment, duration
- Click "Create Task on Blockchain"
- Wait for blockchain confirmation
- Wait for database sync confirmation

### 4. Check main client

```
http://localhost:3000/tasks
```

The newly created task should be visible in the task list.

## Troubleshooting

### Task created but not syncing

**Symptoms:** Admin dashboard shows blockchain confirmation but sync fails

**Solutions:**

1. Check backend server is running on port 3001
2. Check `BACKEND_URL` in `client_admin/.env` (default: `http://localhost:3001`)
3. Check browser console for fetch errors
4. Check admin server logs for sync response errors
5. Check backend server logs for `/api/tasks/sync` endpoint errors

### Task synced but not visible in client

**Symptoms:** Sync successful but task not in `/tasks` page

**Solutions:**

1. Refresh browser at `http://localhost:3000/tasks`
2. Check database has the task (use Prisma Studio: `npx prisma studio`)
3. Check `contractTaskId` matches blockchain task ID
4. Check task status is "open" (not "completed" or "expired")

### Blockchain transaction failed

**Symptoms:** "Insufficient cUSD allowance" or similar

**Solutions:**

1. Click "Approve cUSD" button in admin dashboard
2. Wait for approval transaction to complete
3. Try creating task again
4. Check wallet has sufficient CELO for gas (minimum 0.001 CELO)

## Environment Variables

### Admin Dashboard (`client_admin/.env`)

```bash
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CONTRACT_ADDRESS=0xa520d207c91C0FE0e9cFe8D63AbE02fd18B2254e
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
CUSD_SEPOLIA_ADDRESS=0x845D9D0B4Be004Dcbc17b11160B0C18abBD5FEBD
PORT=4000
BACKEND_URL=http://localhost:3001
```

### Backend Server (see `server/.env`)

Requires database connection string and other configs

## Files Involved

| File                                        | Purpose                                                |
| ------------------------------------------- | ------------------------------------------------------ |
| `client_admin/src/server.js`                | Admin API endpoints for blockchain operations and sync |
| `client_admin/src/public/index.html`        | Admin dashboard UI with form and sync logic            |
| `client_admin/.env`                         | Configuration (RPC URL, contract address, etc.)        |
| `server/src/routes/task.routes.ts`          | Task route definitions including `/sync` endpoint      |
| `server/src/controllers/task.controller.ts` | `syncTask()` method that creates database records      |
| `server/prisma/schema.prisma`               | Database schema with `contractTaskId` field            |
| `client/app/tasks/page.tsx`                 | Main client tasks display page                         |

## Success Indicators

✅ Task 9 created on blockchain  
✅ Transaction hash: `0xbbfa69...`  
✅ Sync request sent to backend  
✅ Task record created in database with ID `uuid-...`  
✅ Task visible at `http://localhost:3000/tasks`  
✅ Workers can submit solutions

---

**Last Updated:** October 26, 2025
