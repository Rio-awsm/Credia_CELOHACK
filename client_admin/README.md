# client_admin

Small admin dashboard for creating tasks on the `TaskEscrow` contract.

## Setup

1. Copy `.env.example` to `.env` and fill in values (PRIVATE_KEY, CONTRACT_ADDRESS if different).

2. Install dependencies:

```powershell
cd client_admin
npm install
```

3. Run the server:

```powershell
npm start
```

4. Open dashboard: http://localhost:4000

## Endpoints

- GET `/` - dashboard UI
- POST `/api/create-task` - create task on blockchain. JSON body: `{ paymentAmount: "0.01", durationInDays: 7, workerAddress?: "0x..." }`

## Notes

- This server uses the ABI located at `../server/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json`. Ensure the artifact exists (deploy the contract if necessary).
- The server signs transactions using `PRIVATE_KEY` in `.env`. Be careful with private keys.
