# 🪙 Credio — AI-Verified Micro-Task Marketplace on Celo

<img src="assets/landing.png" alt="Credio Landing Page" width="800" />

An **AI-powered decentralized task marketplace** built on **Celo Sepolia Testnet**, where requesters post micro-tasks, workers complete them, AI verifies the results, and **payments are automatically released in cUSD** upon approval.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat&logo=vercel)](https://micro-job-ai-agent-web3.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=flat&logo=github)](https://github.com/Rio-awsm/micro-job-ai-agent-web3)

## 🔗 Quick Links

- **🌐 Live Demo:** [https://micro-job-ai-agent-web3.vercel.app/](https://micro-job-ai-agent-web3.vercel.app/)
- **📂 GitHub Repository:** [Rio-awsm/micro-job-ai-agent-web3](https://github.com/Rio-awsm/micro-job-ai-agent-web3)
- **🎥 Demo Video:** [https://youtu.be/PC2ccqsz74M](https://youtu.be/PC2ccqsz74M)
- **📊 Presentation:** [https://drive.google.com/file/d/18V1VG_NMWrNqNsutYqYxM6apTbu-LUeE/view?usp=sharing](https://drive.google.com/file/d/18V1VG_NMWrNqNsutYqYxM6apTbu-LUeE/view?usp=sharing)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#️-tech-stack)
- [AI Integration](#-ai-integration-google-gemini-15-pro)
- [Database Schema](#️-database-schema-core-entities)
- [Folder Structure](#-folder-structure)
- [Setup Guide](#️-setup-guide)
- [Smart Contract Deployment](#-smart-contract-deployment)
- [Workflow](#-workflow)
- [API Examples](#-example-api-calls)
- [Architecture](#-architecture-diagram)
- [Features](#-features-checklist)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Future Roadmap](#-future-roadmap)
- [License](#-license)

---

## ⚡ Overview

**Credio** introduces verifiable trust between micro-task requesters and workers. AI moderation (powered by **Google Gemini**) ensures submissions are **authentic and high-quality**, while the **TaskEscrow smart contract** on **Celo** guarantees transparent, secure on-chain payments.

### Key Features

- 🤖 **AI-Powered Verification** — Automated content moderation using Google Gemini
- ⛓️ **Blockchain Escrow** — Smart contract-based payment security
- 💰 **Instant Payments** — Automatic cUSD release upon task approval
- 🔐 **Wallet Authentication** — Secure login via MetaMask or MiniPay
- 📊 **Real-Time Updates** — Live task and submission status tracking
- 🎯 **Quality Control** — AI prevents spam, fraud, and low-effort submissions

---

## 🛠️ Tech Stack

### 🖥️ Frontend — Next.js (App Router)

| Feature            | Library/Framework                                   |
| ------------------ | --------------------------------------------------- |
| UI Components      | [shadcn/ui](https://ui.shadcn.com)                     |
| Styling            | [TailwindCSS](https://tailwindcss.com)                 |
| State Management   | [Zustand](https://zustand-demo.pmnd.rs)                |
| Data Fetching      | [TanStack Query](https://tanstack.com/query/v5)        |
| Wallet Integration | [wagmi](https://wagmi.sh) + [viem](https://viem.sh)       |
| Blockchain SDK     | [@celo/contractkit](https://docs.celo.org/)            |
| Wallets Supported  | **MiniPay** and **MetaMask**            |
| AI Moderation      | [Google Gemini 1.5](https://ai.google.dev/gemini-api/) |

### ⚙️ Backend — Express.js + TypeScript

| Feature           | Technology                                 |
| ----------------- | ------------------------------------------ |
| Framework         | Express.js                                 |
| Database          | PostgreSQL + Prisma ORM                    |
| Job Queue         | Bull + Redis                               |
| AI Verification   | Gemini API                                 |
| Blockchain        | Celo Sepolia                               |
| Authentication    | Wallet Signature (EIP-191)                 |
| File Verification | cUSD Escrow via TaskEscrow.sol             |
| Notifications     | Background service + WebSocket placeholder |

### ⛓️ Blockchain — Celo Sepolia Testnet

- **Smart Contract:** `TaskEscrow.sol`
  - Holds task payments in escrow
  - Releases funds when AI-verified
  - Refunds requester if submissions are rejected
- **Token:** `cUSD` (Stablecoin)
- **Network RPC:** https://forno.celo-sepolia.celo-testnet.org
- **Explorer:** [CeloScan (Sepolia)](https://sepolia.celoscan.io)

---

## 🤖 AI Integration (Google Gemini 1.5 Pro)

Used for:

- ✅ Spam, fraud, and duplicate prevention
- ✅ Toxic or low-effort content rejection
- ✅ Criteria-based submission scoring

Gemini runs asynchronously in a **Bull Queue worker**, sending results via webhook to approve or reject submissions.

---

## 🗄️ Database Schema (Core Entities)

| Table                   | Description                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **users**         | Stores wallet addresses, roles (`requester` / `worker`), reputation & earnings |
| **tasks**         | Contains task metadata, blockchain taskID, payment amount, expiry                  |
| **submissions**   | Tracks worker submissions, AI verification results                                 |
| **payments**      | Logs payment releases (+txHash)                                                    |
| **notifications** | In-app notifications for verification or payment updates                           |

---

## 💎 Folder Structure

```
credio/
├── client/                 # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # shadcn + custom UI
│   ├── hooks/             # Zustand + wagmi hooks
│   ├── lib/               # API client + Celo utils
│   └── types/             # Shared TypeScript models
│
└── server/                # Express backend
    ├── src/
    │   ├── routes/        # /api/v1 tasks, submissions, users
    │   ├── controllers/   # Request handlers
    │   ├── services/      # AI, blockchain, queue, moderation
    │   ├── workers/       # Bull verification worker
    │   └── database/      # Prisma schema + migrations
    └── prisma/
```

---

## ⚙️ Setup Guide

### Prerequisites

- ✅ Node.js >= 20
- ✅ npm >= 9
- ✅ Redis (running locally or hosted)
- ✅ PostgreSQL database
- ✅ Celo wallet with test cUSD

### 1️⃣ Environment Variables

#### `.env` (Backend)

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/credio"

# Blockchain
PRIVATE_KEY=YOUR_PRIVATE_KEY_WITH_CUSD
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CONTRACT_ADDRESS=0xYourTaskEscrowAddress
CUSD_SEPOLIA_ADDRESS=0x874069fa1eb16d44d622f2e0ca25eea172369bc1

# AI (Gemini)
GEMINI_API_KEY=your_google_gemini_api_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### `.env.local` (Frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
NEXT_PUBLIC_CUSD_ADDRESS=0x874069fa1eb16d44d622f2e0ca25eea172369bc1
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourTaskEscrowAddress
NEXT_PUBLIC_CHAIN_ID=44787
```

### 2️⃣ Backend Setup

```bash
cd server
npm install

# Prisma setup + migrate
npx prisma generate
npx prisma db push

# Start Redis (using Docker)
docker run -d -p 6379:6379 redis:alpine

# Start backend in dev mode
npm run dev
```

### 3️⃣ Frontend Setup

```bash
cd client
npm install
npm run dev
```

Visit → [http://localhost:3000](http://localhost:3000)

---

## 💰 Smart Contract Deployment

Deploy `TaskEscrow.sol` on **Celo Sepolia** using Remix or Hardhat.

### Compile & Deploy

```bash
npx hardhat run scripts/deploy.ts --network celo-sepolia
```

### Verify Contract

```bash
npx hardhat verify --network celo-sepolia 0xYourContractAddress "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"
```

---

## 🧠 Wireframe

<img src="assets/wireframe.jpg" alt="Credio Wireframe" width="800" />

## 💰 Tasks

<img src="assets/tasks.png" alt="Credio Wireframe" width="800" />

## 🧠 Workflow

### ✳️ Requester Flow

1. Connect wallet → Create Task
2. Payment locked in smart contract
3. Task visible to workers

### 🛠️ Worker Flow

1. Accept Task → Submit Response
2. Gemini AI verifies content
3. If approved ✅ → Payment auto-released (cUSD)
4. If rejected ❌ → Refund to requester

---

## 🧾 Example API Calls

### Create Task

```http
POST /api/v1/tasks/create
Content-Type: application/json

{
  "title": "Label Images",
  "description": "Tag each image with emotion category",
  "paymentAmount": 3.5,
  "expiresAt": "2025-11-10T12:00:00Z"
}
```

### Submit Task

```http
POST /api/v1/submissions/submit
Content-Type: application/json

{
  "taskId": "uuid",
  "submissionData": {
    "imageUrls": ["https://ipfs.tech/image1.png"],
    "metadata": { "label": "happy" }
  }
}
```

**AI Queue → Gemini Verification → Payment Released**

---

## 🧱 Architecture Diagram

```
┌────────────┐
│  Next.js   │────┐
└────────────┘    │
                  ▼
┌───────────┐  ┌──────────────┐
│Express.js │◄─│ PostgreSQL   │
└───────────┘  └──────────────┘
      │
┌─────┼──────┐
▼     ▼      ▼
Gemini   Redis   Celo
AI      /Bull    Network
(Verify) (Queue) (Escrow)
```

---

## ✅ Features Checklist

- [X] Wallet Signature Login (EIP-191)
- [X] Gemini-based Content Moderation
- [X] Blockchain-Backed Escrow Payments
- [X] Task + Submission CRUD
- [X] Bull Queue Worker Verification
- [X] Real-Time Status Updates
- [X] cUSD Balance Tracking
- [X] Transaction Confirmation + CeloScan Link
- [X] Admin + Requester Dashboard
- [X] Fully Responsive UI

---

## 🧪 Testing

```bash
# Run backend tests
cd server
npm run test

# Database Studio
npx prisma studio

# Queue dashboard
npm run bull:dashboard
```

---

## 🌍 Deployment

### Suggested Setup

| Layer    | Platform                                                | Notes                    |
| -------- | ------------------------------------------------------- | ------------------------ |
| Frontend | [Vercel](https://vercel.com)                               | Auto-deploy from main    |
| Backend  | [Railway](https://railway.app) / [Render](https://render.com) | Node + Postgres service  |
| Database | Neon / Supabase                                         | Free Postgres DB         |
| Redis    | Upstash / Redis Cloud                                   | Connection for Bull jobs |

---

## 🧠 Future Roadmap

- 🪄 On-chain Gemini verification proofs
- 🧩 Decentralized task reputation scoring
- 💬 Worker messaging + chat
- 🪶 File uploads to IPFS / Web3.Storage
- ⚙️ Multi-network support (Base, Polygon)

---

## 🪙 Credits

Developed with 💚 on the Celo blockchain.

Built using **Next.js**, **Celo ContractKit**, **Gemini AI**, and **Prisma**.

---

## 📝 License

This project is licensed under the **MIT License** — feel free to fork and extend 💡

---

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact

For questions or support, please open an issue on [GitHub](https://github.com/Rio-awsm/micro-job-ai-agent-web3/issues).

---

<p align="center">Made with ❤️ for the Celo ecosystem</p>
