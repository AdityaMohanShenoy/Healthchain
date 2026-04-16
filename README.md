# Blockchain-Based Healthcare Data Management System

A decentralized healthcare data management system built on Ethereum that allows patients to control access to their medical records, doctors to create records with patient consent, and admins to manage the system - all enforced by smart contracts.

**🌐 Live demo:** https://healthchain-eight.vercel.app (deployed on Sepolia testnet)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Roles in the System](#roles-in-the-system)
- [⚙️ Local Setup (Hardhat + localhost)](#️-local-setup-hardhat--localhost)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Install dependencies](#2-install-dependencies)
  - [3. Run the Hardhat node](#3-run-the-hardhat-node)
  - [4. Deploy the contracts](#4-deploy-the-contracts)
  - [5. Update frontend addresses](#5-update-frontend-addresses)
  - [6. Configure Pinata (optional)](#6-configure-pinata-optional)
  - [7. Start the frontend](#7-start-the-frontend)
  - [8. Configure MetaMask for Hardhat](#8-configure-metamask-for-hardhat)
  - [9. Register as Admin (Local)](#9-register-as-admin-local)
  - [10. Register as Doctor (Local)](#10-register-as-doctor-local)
  - [11. Register as Patient (Local)](#11-register-as-patient-local)
  - [12. End-to-end test flow (Local)](#12-end-to-end-test-flow-local)
  - [13. Run smart contract tests](#13-run-smart-contract-tests)
- [☁️ Vercel Setup (Sepolia + Vercel hosting)](#️-vercel-setup-sepolia--vercel-hosting)
  - [1. Get an Alchemy Sepolia RPC URL](#1-get-an-alchemy-sepolia-rpc-url)
  - [2. Get a deployer wallet + test ETH](#2-get-a-deployer-wallet--test-eth)
  - [3. Configure blockchain `.env`](#3-configure-blockchain-env)
  - [4. Deploy contracts to Sepolia](#4-deploy-contracts-to-sepolia)
  - [5. Update frontend addresses](#5-update-frontend-addresses-1)
  - [6. Configure frontend `.env`](#6-configure-frontend-env)
  - [7. Test locally against Sepolia](#7-test-locally-against-sepolia)
  - [8. Push to GitHub](#8-push-to-github)
  - [9. Deploy to Vercel](#9-deploy-to-vercel)
  - [10. Configure MetaMask for Sepolia](#10-configure-metamask-for-sepolia)
  - [11. Register as Admin (Vercel)](#11-register-as-admin-vercel)
  - [12. Register as Doctor (Vercel)](#12-register-as-doctor-vercel)
  - [13. Register as Patient (Vercel)](#13-register-as-patient-vercel)
  - [14. End-to-end test flow (Vercel)](#14-end-to-end-test-flow-vercel)
  - [15. Common Vercel gotchas](#15-common-vercel-gotchas)

---

## Problem Statement

The healthcare industry faces significant challenges in managing patient data securely, efficiently, and transparently. Traditional systems for storing and sharing medical records are often fragmented, leading to interoperability issues, data breaches, and privacy concerns. Patients struggle to access and control their own health information, hindering their ability to make informed decisions about their care.

This project addresses these challenges by leveraging blockchain technology to provide a secure, interoperable, and patient-centric approach to managing medical records.

**Key requirements addressed:**

- **Blockchain Integration** — Decentralized, tamper-proof ledger for recording patient health records and treatment histories.
- **Patient Control** — Patients control who can access their health data using wallet-based identity and on-chain permissions.
- **Smart Contracts** — Enforce role-based access control, consent management, and maintain an immutable audit trail.
- **Consent Management** — Patients explicitly grant and revoke access to doctors, with optional time-based expiry.

---

## Tech Stack

| Layer             | Technology                                                            |
| ----------------- | --------------------------------------------------------------------- |
| Smart Contracts   | Solidity ^0.8.19, Hardhat v2 (local + Sepolia testnet)                |
| Frontend          | React 19 (Vite), Tailwind CSS v4, React Router v7                     |
| Web3 Integration  | ethers.js v5, MetaMask (wallet = identity)                            |
| Off-chain Storage | IPFS via Pinata (files uploaded to Pinata, CID stored on-chain)       |
| UI/UX             | lucide-react icons, react-hot-toast notifications, custom CSS effects |
| Hosting           | Vercel (frontend) + Sepolia testnet (contracts)                       |
| Testing           | Hardhat + Chai + Mocha (20 unit tests)                                |

---

## Project Structure

```
mini-project/
├── blockchain/
│   ├── contracts/
│   │   ├── RoleManager.sol          # Role assignment (admin, doctor, patient)
│   │   ├── AccessControl.sol        # Patient consent & access grants
│   │   ├── RecordStorage.sol        # Medical record metadata + IPFS hash
│   │   └── AuditTrail.sol           # Immutable action log
│   ├── scripts/
│   │   └── deploy.js                # Deployment script for all 4 contracts
│   ├── test/                        # 20 unit tests
│   ├── .env.example                 # Sepolia RPC + private key template
│   └── hardhat.config.js            # localhost + sepolia networks
│
├── frontend/
│   ├── .env.example                 # Pinata + Sepolia RPC template
│   ├── vercel.json                  # SPA rewrite for Vercel
│   └── src/
│       ├── abis/                    # Contract ABI JSONs
│       ├── config/
│       │   ├── contracts.js         # Deployed contract addresses
│       │   └── pinata.js            # Pinata env var config
│       ├── context/
│       │   └── Web3Context.jsx      # Provider, signer, account, role, contracts
│       ├── pages/
│       │   ├── Landing.jsx          # Connect wallet + register as patient
│       │   ├── AdminDashboard.jsx   # Register doctors, system stats, audit
│       │   ├── DoctorDashboard.jsx  # Patient list, create/view records
│       │   └── PatientDashboard.jsx # My records, manage access, audit log
│       ├── components/
│       │   ├── layout/              # Navbar, RoleGuard
│       │   ├── admin/               # RegisterDoctor, SystemStats
│       │   ├── doctor/              # PatientList, CreateRecord, ViewRecords
│       │   ├── patient/             # MyRecords, ManageAccess, GrantAccess
│       │   └── shared/              # AuditLog, FileUpload, etc.
│       └── utils/
│           └── ipfs.js              # Pinata upload & gateway helpers
│
└── README.md
```

---

## Smart Contract Architecture

### 1. RoleManager.sol

Manages three roles: **Admin**, **Doctor**, and **Patient**.

- The deployer wallet is automatically assigned the Admin role.
- `registerDoctor(address)` — Admin-only function to register a new doctor.
- `registerPatient()` — Any unregistered address can self-register as a patient.
- Maintains on-chain `doctorList[]` and `patientList[]` arrays with getter functions.

### 2. AuditTrail.sol

Immutable log of all system actions. Action types: `DOCTOR_REGISTERED`, `PATIENT_REGISTERED`, `ACCESS_GRANTED`, `ACCESS_REVOKED`, `RECORD_CREATED`, `RECORD_VIEWED`.

### 3. AccessControl.sol

Patient-controlled consent management.

- `grantAccess(doctor, durationSeconds)` — Patient grants a doctor access. Pass `0` for permanent access.
- `revokeAccess(doctor)` — Patient revokes a doctor's access.
- `hasAccess(patient, doctor)` — View function that checks both grant status and expiry.

### 4. RecordStorage.sol

Medical record storage with IPFS hash. `createRecord(...)` is doctor-only and requires active access to the patient.

### Deploy Order

1. **AuditTrail** (no dependencies)
2. **RoleManager** (requires AuditTrail address)
3. **AccessControl** (requires RoleManager + AuditTrail)
4. **RecordStorage** (requires RoleManager + AccessControl + AuditTrail)

---

## Frontend Architecture

| Route      | Page              | Access       |
| ---------- | ----------------- | ------------ |
| `/`        | Landing           | Public       |
| `/admin`   | AdminDashboard    | Admin only   |
| `/doctor`  | DoctorDashboard   | Doctor only  |
| `/patient` | PatientDashboard  | Patient only |

Routes are protected by the `RoleGuard` component which checks the connected wallet's on-chain role. The `Web3Context` provides the entire app with `account`, `role`, `contracts`, `provider`, `signer`, and helpers.

---

## Roles in the System

The dApp has **three roles**, all derived from the Ethereum address connected via MetaMask. There are no usernames or passwords — your wallet is your identity.

| Role        | What they can do                                                                  | How to become one                                                                |
| ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Admin**   | Provision doctors, view full system audit log, see protocol stats                 | Be the wallet that **deployed the contracts**. Cannot be transferred or changed. |
| **Doctor**  | View granted patients, upload records to IPFS, create on-chain records            | Get registered by the admin via the **Provision Clinician** form                 |
| **Patient** | Self-register, grant/revoke doctor access (with optional expiry), view own records| **Self-register** on the landing page after connecting your wallet               |

> ⚠️ Each Ethereum address can only hold **one role**. Once registered, you cannot switch — you'd need a different wallet.

---

# ⚙️ Local Setup (Hardhat + localhost)

This is the development setup. Everything runs on your laptop — no faucets, no deploy fees, instant transactions, fresh blockchain state every time you restart.

## 1. Prerequisites

| Tool                   | Version | Link                                            |
| ---------------------- | ------- | ----------------------------------------------- |
| Node.js                | v18+    | https://nodejs.org                              |
| MetaMask (browser ext) | Latest  | https://metamask.io                             |
| Git                    | Any     | https://git-scm.com                             |

## 2. Install dependencies

```bash
git clone <repo-url>
cd mini-project

cd blockchain
npm install

cd ../frontend
npm install
```

## 3. Run the Hardhat node

In **Terminal 1**:

```bash
cd blockchain
npx hardhat node
```

This boots a local Ethereum blockchain at `http://127.0.0.1:8545` with **Chain ID 31337** and prints **20 pre-funded test accounts** with their private keys. Each has 10,000 fake ETH. **Keep this terminal running for the entire session** — closing it wipes the chain state.

## 4. Deploy the contracts

In **Terminal 2**:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Output looks like:
```
Deploying contracts with: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
AuditTrail deployed to: 0xD0586A09a7Ccc94c7f3f5e45fE5c66Ff18796236
RoleManager deployed to: 0xd187AcDF080Dc85A2cF7d269218cdae7E5F34C7E
AccessControl deployed to: 0x02eBeb7e737D7dcC64C5C70a91C101Bb5aEa1f6c
RecordStorage deployed to: 0x8c7d959252B74Ab0251Fe31829934716728081e7
```

The first account (`0xf39Fd6...92266`) is the deployer → it becomes the **Admin** automatically.

## 5. Update frontend addresses

Copy the 4 addresses into `frontend/src/config/contracts.js`:

```js
const CONTRACT_ADDRESSES = {
  ROLE_MANAGER:   "0xd187AcDF080Dc85A2cF7d269218cdae7E5F34C7E",
  AUDIT_TRAIL:    "0xD0586A09a7Ccc94c7f3f5e45fE5c66Ff18796236",
  ACCESS_CONTROL: "0x02eBeb7e737D7dcC64C5C70a91C101Bb5aEa1f6c",
  RECORD_STORAGE: "0x8c7d959252B74Ab0251Fe31829934716728081e7",
};
```

## 6. Configure Pinata (optional, for file uploads)

File attachments are stored on IPFS via Pinata. Skip this if you only want text records.

1. Sign up free at https://www.pinata.cloud
2. **API Keys** → create a new key → copy the API Key + API Secret
3. Create `frontend/.env`:
   ```
   VITE_PINATA_API_KEY=your_api_key_here
   VITE_PINATA_API_SECRET=your_api_secret_here
   ```

## 7. Start the frontend

In **Terminal 3**:

```bash
cd frontend
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

## 8. Configure MetaMask for Hardhat

### Add the Hardhat Local network

1. MetaMask → network dropdown → **Add a network manually**
2. Fill in:

   | Field           | Value                    |
   | --------------- | ------------------------ |
   | Network Name    | Hardhat Local            |
   | New RPC URL     | `http://127.0.0.1:8545`  |
   | Chain ID        | `31337`                  |
   | Currency Symbol | ETH                      |

3. Save → switch to **Hardhat Local**

### Import test accounts

When `npx hardhat node` started, it printed 20 accounts. Import at least three into MetaMask:

| Hardhat Account | Will become   | Private Key               |
| --------------- | ------------- | ------------------------- |
| **#0**          | Admin         | First key in node output  |
| **#1**          | Doctor        | Second key                |
| **#2**          | Patient       | Third key                 |

To import: MetaMask → account icon → **Import Account** → paste the private key → Import.

> ⚠️ These are test keys with fake ETH. **Never use them on a real network.**

---

## 9. Register as Admin (Local)

The Admin role is **automatically assigned** to the wallet that deployed the contracts. There is **no registration step** — you just need to connect with the right wallet.

1. In MetaMask, switch to **Account #0** (the Hardhat default deployer — address `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
2. Make sure you're on the **Hardhat Local** network
3. Open `http://localhost:5173` and click **Connect MetaMask**
4. Approve the connection in MetaMask
5. The dApp detects your role on-chain → **automatically redirects** to `/admin`
6. You'll see the **Admin Console** with the Provision Clinician form, Protocol Vitals, and System Audit Log

> If the redirect doesn't happen, your wallet isn't the deployer. Re-deploy from the same MetaMask account, or import the Hardhat default deployer (Account #0).

## 10. Register as Doctor (Local)

Doctors **cannot self-register**. The admin must add them.

### Step A: Get the doctor's wallet address

1. In MetaMask, switch to **Account #1**
2. Click the account name at the top → click the address to copy it (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`)

### Step B: Register from the admin account

1. Switch MetaMask back to **Account #0** (Admin)
2. Open the dApp → you'll be on `/admin`
3. In the **Provision Clinician** card, paste the doctor's address into the **EVM Address** field
4. The input glows **green** when the address format is valid (`0x` + 40 hex chars)
5. Click **Sign & Register**
6. Approve the transaction in MetaMask (instant on local Hardhat)
7. Toast confirms "Doctor registered on-chain"

### Step C: Verify as the doctor

1. Switch MetaMask to **Account #1**
2. The dApp auto-detects the new role → redirects to `/doctor`
3. You'll see the Doctor Dashboard with an empty patient list

## 11. Register as Patient (Local)

Patients **self-register** — no admin involvement needed.

1. In MetaMask, switch to **Account #2** (or any unregistered account)
2. Open the dApp landing page
3. Click **Connect MetaMask** → approve
4. The landing page now shows the **Claim Your Identity** card with your wallet address
5. Click **Register as Patient**
6. Approve the transaction in MetaMask
7. The dApp auto-redirects you to `/patient`
8. You'll see your dashboard: My Records (empty), Grant Access, Manage Access, My Audit Log

## 12. End-to-end test flow (Local)

| Step | Actor   | Action                                                                                | Expected                          |
| ---- | ------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| 1    | Admin   | Connect with Account #0 → land on `/admin`                                            | Admin Console renders             |
| 2    | Admin   | Provision Clinician → paste Account #1 address → Sign & Register                      | Doctors count → 1                 |
| 3    | Patient | Switch to Account #2 → Register as Patient                                            | Redirected to `/patient`          |
| 4    | Patient | Grant Access → paste Account #1 address → duration `0` (permanent) → Grant            | Doctor appears in My Doctors      |
| 5    | Doctor  | Switch to Account #1 → land on `/doctor`                                              | Patient appears in patient list   |
| 6    | Doctor  | Select patient → fill diagnosis/prescription → optionally upload a file → Create      | Toast confirms record created     |
| 7    | Patient | Switch to Account #2                                                                  | New record under My Records       |
| 8    | Patient | Manage Access → Revoke doctor                                                         | Doctor removed                    |
| 9    | Doctor  | Switch to Account #1 → try Create Record                                              | Transaction reverts (no access)   |
| 10   | Admin   | Switch to Account #0 → System Audit Log shows every action                            | All 8 events listed in order      |

## 13. Run smart contract tests

```bash
cd blockchain
npx hardhat test
```

Runs **20 unit tests** across the 4 contracts. All should pass.

---

# ☁️ Vercel Setup (Sepolia + Vercel hosting)

This is the production setup. Contracts live on the **Sepolia testnet** (public Ethereum testnet) and the frontend is hosted on **Vercel**. Anyone in the world with MetaMask can use the app.

## 1. Get an Alchemy Sepolia RPC URL

1. Sign up free at https://alchemy.com
2. **Create new app** → Chain: **Ethereum**, Network: **Ethereum Sepolia** ⚠️ (not Mainnet!)
3. From the app dashboard, copy the **HTTPS** endpoint URL
4. It must look like `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` (the `eth-sepolia` part is critical)

## 2. Get a deployer wallet + test ETH

1. Open MetaMask → **Add account** → create a fresh account (don't use one with real funds)
2. **Account details** → **Show private key** → copy it (strip the leading `0x`)
3. Get free Sepolia ETH from a faucet:
   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia (Google login, 0.05 ETH/day)
   - https://sepolia-faucet.pk910.de (browser mining, no signup)
   - https://faucet.quicknode.com/ethereum/sepolia
4. Wait until your wallet shows ~0.05 SepoliaETH on the **Sepolia** network

> ⚠️ **This wallet will permanently become the admin of your dApp.** Keep its private key safe.

## 3. Configure blockchain `.env`

```bash
cd blockchain
cp .env.example .env
```

Edit `blockchain/.env`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_metamask_private_key_without_0x_prefix
```

> ⚠️ Verify `blockchain/.env` is in `.gitignore`. Never commit your private key.

## 4. Deploy contracts to Sepolia

```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

Wait ~1–2 minutes (real Sepolia block time). Output:
```
AuditTrail deployed to: 0x...
RoleManager deployed to: 0x...
AccessControl deployed to: 0x...
RecordStorage deployed to: 0x...
```

**Save these 4 addresses** — you'll paste them into the frontend next.

## 5. Update frontend addresses

Edit `frontend/src/config/contracts.js`:
```js
const CONTRACT_ADDRESSES = {
  ROLE_MANAGER:   "0x...",  // from step 4
  AUDIT_TRAIL:    "0x...",
  ACCESS_CONTROL: "0x...",
  RECORD_STORAGE: "0x...",
};
```

## 6. Configure frontend `.env`

Create `frontend/.env`:
```
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_API_SECRET=your_pinata_api_secret
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

> ⚠️ `VITE_SEPOLIA_RPC_URL` is **critical**. The frontend uses it to bypass MetaMask's flaky public RPC for read calls. Without it, you'll hit `RPC endpoint returned too many errors`.

## 7. Test locally against Sepolia

```bash
cd ../frontend
npm install
npm run dev
```

In MetaMask, switch to **Sepolia** (not Hardhat Local), open `http://localhost:5173`, click **Connect MetaMask**. You should land on the admin dashboard since you deployed with this wallet.

## 8. Push to GitHub

```bash
cd ..
git add .
git commit -m "Deploy to Sepolia"
git push
```

⚠️ Run `git status` first and **verify `blockchain/.env` is NOT staged**. It's in `.gitignore` but always double-check.

## 9. Deploy to Vercel

1. Go to https://vercel.com/new → import your GitHub repo
2. **Configure**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
3. **Environment Variables** — add all three, apply to **Production, Preview, Development**:
   - `VITE_PINATA_API_KEY`
   - `VITE_PINATA_API_SECRET`
   - `VITE_SEPOLIA_RPC_URL`
4. Click **Deploy**
5. After ~1 min, Vercel gives you a live URL like `https://your-app.vercel.app`

## 10. Configure MetaMask for Sepolia

Every user (admin, doctor, patient) needs Sepolia configured in MetaMask.

1. MetaMask → ☰ menu → **Settings** → **Advanced** → toggle on **"Show test networks"**
2. Network dropdown → select **Sepolia**
3. **Recommended:** add the Alchemy RPC manually for reliability:
   - **Settings** → **Networks** → **Sepolia** → click **Add RPC URL**
   - Paste the same Alchemy URL from step 1
   - Set it as the default RPC for Sepolia
4. Get Sepolia ETH from a faucet (see step 2)

---

## 11. Register as Admin (Vercel)

The Admin role is **automatically assigned** to the wallet that deployed the contracts in step 4. No registration step.

1. In MetaMask, switch to the wallet whose private key is in `blockchain/.env`
2. Make sure the network is set to **Sepolia**
3. Open your Vercel URL → click **Connect MetaMask** → approve
4. The dApp detects your on-chain role → **redirects to `/admin`**
5. You see the Admin Console — ready to provision doctors

> If you don't get redirected, you connected with the wrong wallet. The admin is permanently the deployer — re-deploy from a different wallet if you need to change it.

## 12. Register as Doctor (Vercel)

Doctors **cannot self-register**. The admin must add them.

### Option A: Admin and doctor are different people

1. **Doctor side**: open the Vercel URL with their MetaMask connected to Sepolia. Copy their wallet address from MetaMask (top of the popup).
2. **Doctor sends their address** to the admin (via Slack, email, WhatsApp, etc.)
3. **Admin side**:
   - Open the Vercel URL → connect with the admin wallet → land on `/admin`
   - Paste the doctor's address into the **Provision Clinician** form
   - Wait for the green "Checksum OK" badge
   - Click **Sign & Register**
   - Approve in MetaMask → wait ~12s for the Sepolia block confirmation
4. **Doctor side**: refresh the page → they're now redirected to `/doctor`

### Option B: You are testing both roles yourself

1. In MetaMask, create a second account (**Add account**) — this will be the doctor
2. Copy that account's address
3. Switch to the **admin account**, open the Vercel URL, register the doctor address (as in Option A step 3)
4. Wait for the tx to confirm (~12s)
5. Switch MetaMask to the doctor account → refresh → you're on `/doctor`

> ⚠️ The doctor's wallet still needs Sepolia ETH for gas to create records and view audit entries. Faucet that account too.

## 13. Register as Patient (Vercel)

Patients **self-register**. No admin involvement.

1. Open the Vercel URL with any **fresh, unregistered wallet**
2. Make sure MetaMask is on **Sepolia** and the wallet has some Sepolia ETH for gas
3. Click **Connect MetaMask** → approve
4. The landing page shows **"Claim Your Identity"** with your wallet address
5. Click **Register as Patient**
6. Approve the transaction in MetaMask
7. Wait ~12 seconds for the Sepolia block confirmation
8. The dApp auto-redirects you to `/patient`

> ⚠️ You can't be admin and patient with the same wallet. If you're testing as the deployer wallet, create a separate MetaMask account for the patient role.

## 14. End-to-end test flow (Vercel)

This is the same flow as local, but on Sepolia. Allow ~12s per transaction.

| Step | Actor   | Action                                                                              | Expected                       |
| ---- | ------- | ----------------------------------------------------------------------------------- | ------------------------------ |
| 1    | Admin   | Connect with deployer wallet → `/admin`                                             | Admin Console                  |
| 2    | Admin   | Provision Clinician → paste doctor address → Sign & Register → wait ~12s            | Doctors count → 1              |
| 3    | Patient | Switch to a fresh wallet (with Sepolia ETH) → Register as Patient → wait ~12s       | Redirected to `/patient`       |
| 4    | Patient | Grant Access → paste doctor address → permanent → Grant → wait ~12s                 | Doctor in My Doctors           |
| 5    | Doctor  | Switch to doctor wallet → `/doctor`                                                 | Patient in list                |
| 6    | Doctor  | Select patient → fill record → optionally attach file (uploads to IPFS) → Create    | Toast confirms                 |
| 7    | Patient | Switch to patient wallet                                                            | Record under My Records        |
| 8    | Patient | Manage Access → Revoke doctor → wait ~12s                                           | Doctor removed                 |
| 9    | Admin   | Switch to admin wallet → System Audit Log                                           | All actions listed             |

> 💡 You can verify any transaction on https://sepolia.etherscan.io by pasting the contract address — every state change is publicly visible.

## 15. Common Vercel gotchas

| Symptom                                                                | Cause                                                              | Fix                                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `insufficient funds` during deploy                                     | Deployer wallet has no Sepolia ETH                                 | Faucet the wallet                                                                                  |
| `chain id mismatch (got 1, expected 11155111)`                         | Alchemy URL is set to Ethereum Mainnet, not Sepolia                | Create a new Alchemy app with **Network: Sepolia**, update `SEPOLIA_RPC_URL`                       |
| `RPC endpoint returned too many errors`                                | MetaMask's default Sepolia RPC is rate-limited                     | Make sure `VITE_SEPOLIA_RPC_URL` is set in Vercel env vars; the frontend bypasses MetaMask's RPC   |
| `Rolldown failed to resolve import "react-hot-toast"` on Vercel build  | Forgot to commit `package.json` / `package-lock.json` after install| `git add frontend/package*.json && git commit && git push`                                         |
| `CALL_EXCEPTION` on Connect Wallet                                     | `frontend/src/config/contracts.js` has stale addresses             | Update with the addresses from step 4, commit, push — Vercel auto-rebuilds                         |
| Vercel 404 on `/doctor` page refresh                                   | SPA routing not handled                                            | Already fixed by `frontend/vercel.json` (don't delete it)                                          |
| Pinata uploads fail in production                                      | Env var not exposed to browser                                     | Variable name must start with `VITE_` (e.g. `VITE_PINATA_API_KEY`), then redeploy                  |
| MetaMask shows "Unable to connect to Ganache local"                    | Old custom network from local dev                                  | MetaMask → network dropdown → switch to **Sepolia**                                                |
| Connect button does nothing, no popup                                  | Site previously connected with wrong network                       | MetaMask → Connected sites → revoke this site → refresh                                            |
| "Doctor" wallet can't create records on Vercel                         | Patient hasn't granted access yet, or grant tx hasn't confirmed    | Wait for the patient's grant tx to confirm on Sepolia (~12s), then refresh                         |
