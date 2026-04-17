# Healthchain · End-to-End Workflow

A walkthrough of how the Healthchain protocol actually works, from the moment a wallet connects through every on-chain action and who sees what. Written for someone new to the project — no prior blockchain knowledge assumed.

---

## 1. Big Picture

Healthchain is a **blockchain-based healthcare records system** deployed on Ethereum's Sepolia testnet. It replaces the classic "hospital owns your data" model with one where **the patient owns the data** and cryptographically grants or revokes doctors' access.

**What lives where:**

| Data | Storage | Why |
|------|---------|-----|
| Identity (who is a doctor, who is a patient) | Ethereum (smart contract) | Public, tamper-proof |
| Access rules (which doctor can read which patient) | Ethereum | Enforced by code, not a server admin |
| Medical record metadata (diagnosis, prescription, notes) | Ethereum | Immutable, auditable |
| Attached files (scans, PDFs) | IPFS (via Pinata) | Too expensive to put on-chain; only the content hash is stored |
| Audit log (every action) | Ethereum | Cannot be edited or deleted |

**Why four contracts instead of one:** separation of concerns.

1. **`RoleManager`** — who is allowed to do what (Admin / Doctor / Patient / None).
2. **`AccessControl`** — which patients have granted which doctors access, and for how long.
3. **`RecordStorage`** — the actual medical record entries.
4. **`AuditTrail`** — every action appends an entry here. Never modified, never deleted.

---

## 2. The Three Roles

### Admin
The wallet that **deployed** the contracts. Exactly one exists. Admin's only privilege is **registering doctors** (the contract explicitly gates `registerDoctor` behind `onlyAdmin`).

### Doctor
A wallet that admin has whitelisted. Doctors can:
- See which patients have granted them access.
- Write new medical records **only for patients who authorized them**.
- Read records of patients who authorized them.

### Patient
Any user can self-register as a patient — no gatekeeping. Patients can:
- Grant a doctor permanent or time-limited access.
- Revoke access at any time.
- View their own records and a personal audit log.

A single wallet address can only have **one role** forever. The contract enforces this: `require(roles[addr] == Role.None)` in both `registerDoctor` and `registerPatient`. To change role, you need a fresh wallet.

---

## 3. The Complete Journey (End-to-End)

Suppose the project is freshly deployed and nobody has used it yet. Here's what happens, step by step.

### Step 0 — Deployment (one-time, done by you)

1. Developer runs the Hardhat deploy script.
2. Four contracts are deployed to Sepolia in this order:
   - `AuditTrail` (no dependencies)
   - `RoleManager(auditTrail)`
   - `AccessControl(roleManager, auditTrail)`
   - `RecordStorage(roleManager, accessControl, auditTrail)`
3. Deploy script automatically calls `auditTrail.setAuthorizedCaller(...)` for each of the three contracts so they can write audit entries.
4. The **deployer's wallet becomes Admin** (set in `RoleManager` constructor: `roles[msg.sender] = Role.Admin`).
5. Contract addresses are saved into `frontend/src/config/contracts.js`.
6. Frontend is deployed to Vercel with the Pinata + Alchemy env vars.

Nobody can use the app until the frontend has these addresses. After this, the app is "live."

---

### Step 1 — Admin opens the app

1. Admin visits `healthchain-eight.vercel.app`.
2. Clicks **Connect MetaMask**. MetaMask pops up → approve.
3. Frontend reads the wallet address, queries `RoleManager.getRole(address)`, sees it returns `Admin`, and routes to `/admin`.
4. Admin Dashboard loads showing:
   - Provision Clinician form (register a doctor)
   - Protocol Vitals (live counts of clinicians, patients, records, audits)
   - Registry (full list of all doctors and patients, clickable for drill-down)
   - Role Lookup (paste any address, see its role)
   - Deployed Contracts (addresses + Etherscan links)
   - System Audit Log (filterable, exportable)

### Step 2 — Admin registers a doctor

Say Dr. Smith gives admin her wallet address `0xABCD…`.

1. Admin pastes `0xABCD…` into **Provision Clinician** and clicks **Sign & Register**.
2. Frontend calls `roleManager.registerDoctor(0xABCD…)`.
3. MetaMask pops up asking Admin to sign.
4. Admin approves → transaction broadcasts to Sepolia.
5. Inside the contract, `onlyAdmin` check passes (caller == admin). `roles[0xABCD…]` is set to `Doctor`. Pushed to `doctorList[]`. Audit entry logged.
6. After ~15 seconds (Sepolia block time), the tx confirms.
7. Registry panel updates — `0xABCD…` now appears under Clinicians.

Dr. Smith still doesn't see anything yet — she needs to connect.

### Step 3 — Dr. Smith connects

1. Dr. Smith opens the app with her wallet `0xABCD…`.
2. `getRole()` returns `Doctor`, app routes to `/doctor`.
3. Doctor Dashboard loads with an **empty** patient list. She has no patients yet because none have granted her access.

### Step 4 — Patient self-registers

Alice (a patient) opens the app with her wallet `0x1111…`.

1. `getRole()` returns `None` (no role yet).
2. Landing page shows a **Register as Patient** button.
3. She clicks it. Frontend calls `roleManager.registerPatient()` (no admin required — patient self-registration is permissionless).
4. MetaMask signs and broadcasts.
5. Contract sets `roles[0x1111…] = Patient`. Appended to `patientList[]`. Audit logged.
6. App reloads role, routes to `/patient`. Empty dashboard.

### Step 5 — Alice grants Dr. Smith access

1. On her Patient Dashboard, Alice sees a **Grant Access** card.
2. She pastes Dr. Smith's address `0xABCD…` and selects a duration (Permanent / 1 Hour / 1 Day / 1 Week / 30 Days).
3. Clicks **Grant Access**. Frontend calls `accessControl.grantAccess(0xABCD…, durationSeconds)`.
4. Contract checks:
   - `onlyPatient` modifier — caller must be a Patient ✓
   - Target must be a Doctor (via RoleManager) ✓
   - Access must not already be granted ✓
5. Records `accessMap[Alice][Smith] = { isGranted, grantedAt, expiresAt }`.
6. Pushes Smith onto `patientDoctors[Alice]` and Alice onto `doctorPatients[Smith]`.
7. Audit entry: `ACCESS_GRANTED`.
8. Alice's **My Doctors** list updates.
9. When Dr. Smith refreshes her dashboard, Alice appears under **My Patients**.

### Step 6 — Dr. Smith creates a medical record

1. On Doctor Dashboard, Dr. Smith clicks Alice's entry. The **Create Record** form opens.
2. She fills in:
   - Diagnosis: "Common Cold"
   - Prescription: "Paracetamol 500mg, Rest"
   - Notes: optional
   - (Optional) Attaches a PDF of the report.
3. If a file is attached:
   - Frontend uploads it to **Pinata IPFS** using the API keys in the env vars.
   - Pinata returns a content hash (CID) like `QmXk…`.
4. Dr. Smith clicks **Create Record**.
5. Frontend calls `recordStorage.createRecord(Alice, diagnosis, prescription, notes, ipfsHash)`.
6. Contract checks:
   - `onlyDoctor` modifier ✓
   - `accessControl.hasAccess(Alice, Smith) == true` ✓ (and not expired)
7. Pushes a `MedicalRecord` struct onto `records[]` and indexes it in `patientRecords[Alice]`.
8. Audit entry: `RECORD_CREATED`.

### Step 7 — Alice views her record

1. Alice refreshes her Patient Dashboard.
2. **My Medical Records** calls `recordStorage.getPatientRecordIds(Alice)` → returns `[0]`.
3. For each id, calls `getRecord(0)` → returns the struct.
4. Rendered as a RecordCard showing diagnosis, Rx, notes, doctor address, timestamp.
5. If an IPFS hash is present, a **View File** button opens `https://gateway.pinata.cloud/ipfs/<hash>` in a new tab.

### Step 8 — Alice revokes access (optional)

1. Alice clicks **Revoke** next to Dr. Smith's entry in My Doctors.
2. Frontend calls `accessControl.revokeAccess(0xABCD…)`.
3. Contract flips `accessMap[Alice][Smith].isGranted = false`.
4. Removes from both `patientDoctors[Alice]` and `doctorPatients[Smith]` arrays.
5. Audit entry: `ACCESS_REVOKED`.
6. Dr. Smith can no longer create new records for Alice. Existing records remain (blockchain is immutable), but Alice's records are still hers — past diagnoses don't vanish.

### Step 9 — Everyone sees audit log

Every action above wrote an entry to `AuditTrail`. Each entry records:
- Action type (one of: `DOCTOR_REGISTERED`, `PATIENT_REGISTERED`, `ACCESS_GRANTED`, `ACCESS_REVOKED`, `RECORD_CREATED`, `RECORD_VIEWED`)
- Performer (who initiated the action)
- Subject (who it was about)
- Details (short string)
- Timestamp

**Who sees what:**
- **Admin**: the *entire* system audit log, with filters by action type and address, plus CSV/JSON export.
- **Patient**: entries where the patient is performer or subject.
- **Doctor**: entries where the doctor is performer or subject.

Filtering at the contract level is done via `AuditTrail.getUserAuditIds(address)` which returns ids where the address is either performer or subject.

---

## 4. Data Flow Diagram

```
┌──────────┐      ┌────────────┐      ┌─────────────┐
│  User    │─────▶│  Frontend  │─────▶│  MetaMask   │
│ (wallet) │      │ (React)    │      │  (signer)   │
└──────────┘      └─────┬──────┘      └──────┬──────┘
                        │                     │
                 read path│                     │ write path
                   (via)  │                     │ (sign + send)
                        ▼                     ▼
                  ┌───────────┐         ┌──────────────┐
                  │  Alchemy  │         │  Sepolia RPC │
                  │ Sepolia   │         │  (Alchemy)   │
                  └─────┬─────┘         └──────┬───────┘
                        └──────────┬──────────┘
                                   ▼
                      ┌────────────────────────┐
                      │  4 Smart Contracts     │
                      │  on Sepolia            │
                      └────────────────────────┘
                                   │
                   (file uploads)  │
                                   ▼
                            ┌──────────┐
                            │  Pinata  │
                            │  IPFS    │
                            └──────────┘
```

**Read path:** the frontend intercepts `eth_call`, `eth_getBalance`, etc. and routes them through Alchemy directly, so the UI is fast even when MetaMask's default RPC is slow.

**Write path:** for any tx that changes state (register, grant, revoke, createRecord), the frontend **pre-populates** `gasLimit`, `maxFeePerGas`, `nonce`, and `chainId` using Alchemy, then hands the fully-formed tx to MetaMask for signing. This avoids MetaMask's circuit breaker tripping when its polling RPC hits rate limits.

---

## 5. Key Guarantees (what the code actually enforces)

| Rule | Enforced by | Mechanism |
|------|-------------|-----------|
| Only admin can register doctors | `RoleManager.registerDoctor` | `onlyAdmin` modifier |
| A wallet can only have one role ever | `RoleManager.register*` | `require(roles[addr] == None)` |
| Doctors can only write records for authorized patients | `RecordStorage.createRecord` | calls `AccessControl.hasAccess` |
| Only patients can grant/revoke access | `AccessControl.grant/revokeAccess` | `onlyPatient` modifier |
| Expired access auto-revokes on read | `AccessControl.hasAccess` | checks `block.timestamp <= expiresAt` |
| Audit log is append-only | `AuditTrail` | no delete or update function exists |

None of these rely on the frontend. Even if someone calls the contracts directly from Etherscan or a script, the same rules apply.

---

## 6. What the Frontend Adds (but the contracts don't need)

- **Aurora/cyber visual theme** — purely aesthetic, no functional impact.
- **Role-aware routing** — on connect, the app reads your role and sends you to the matching dashboard.
- **Alchemy bypass for reads** — faster page loads, independent of MetaMask's RPC health.
- **Transaction pre-population for writes** — avoids MetaMask circuit breaker tripping.
- **IPFS upload via Pinata** — contracts only store the hash; actual files live off-chain.
- **Admin conveniences** — Role Lookup, Registry drill-down modal, Contract Directory, Audit filters + export. All are thin wrappers around existing contract view functions.

---

## 7. Security Model (honest about what this is and isn't)

**What's solid:**
- No central server can forge an action. Every write is signed by a wallet, and the audit trail records who did it.
- The admin cannot read a patient's records unless they become a doctor and a patient grants them access.
- Revoking access is instant (one transaction).

**What's not protected (and would need more work for a real product):**
- **Record contents are not encrypted on-chain.** Diagnosis strings are public on Sepolia. In production you'd encrypt with the patient's public key and store only ciphertext. Same for IPFS files — currently anyone with the hash can view them.
- **Admin compromise is catastrophic.** If the admin key is stolen, attacker can flood the system with fake doctors. A multi-sig or DAO-controlled admin would mitigate this.
- **No rate-limiting on patient registration** — a spammer could register thousands of wallets. Fine for a demo, problematic in production.
- **Doctor revocation by admin doesn't exist** — admin can register doctors but not remove them. Would require a small contract addition.

This is a **mini-project/educational demo**, not a production healthcare system. The security model is deliberately simple so the blockchain mechanics are readable.

---

## 8. Glossary

- **Wallet / address** — a 20-byte Ethereum identity, shown as `0x...` hex. Each wallet has a private key only the owner knows.
- **Sign** — the wallet uses its private key to cryptographically endorse a transaction. MetaMask's popup is the signing prompt.
- **Transaction (tx)** — a signed request to change state on a blockchain. Costs gas (a small amount of ETH).
- **Smart contract** — code that lives on the blockchain. Anyone can call its functions; the code decides what to do.
- **EIP-55 checksum** — mixed-case hex address (e.g., `0x9E69…`) that encodes a checksum. Lowercase addresses `0x9e69…` refer to the same bytes and are equally valid.
- **IPFS** — content-addressed file storage. You upload a file, you get back a hash; anyone with the hash can fetch the file.
- **Pinata** — a commercial IPFS pinning service that guarantees your file stays available.
- **Alchemy / Infura** — RPC providers. They run Ethereum nodes so your app doesn't have to. MetaMask and our dapp both talk to the blockchain through an RPC.
- **Circuit breaker (MetaMask)** — after several failed RPC calls in a row, MetaMask stops trying for 30 seconds and shows "too many errors". Our write-path pre-population avoids triggering this.
- **Gas** — fee paid to validators for executing your transaction. On Sepolia, it's free test ETH.

---

## 9. Recap

A patient walks in, connects a wallet, registers themselves, and now owns a cryptographic identity. They hand a doctor permission with a signed transaction. The doctor writes a record, also signed. Every action is a receipt in the audit log that nobody — not even the admin — can delete. If the patient changes their mind, one more signed transaction revokes access.

That's the entire system. Everything else is UI.
