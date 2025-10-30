# PixelAfrica

**One Pixel, One Life.**  
PixelAfrica turns every donated blood unit into a digital record secured on Hedera Hashgraph.  
It helps hospitals, couriers, and donors track each blood bag from collection to transfusion with full traceability.

---

## Vision

Blood donation should always reach the people who need it.  
PixelAfrica aims to make every drop count by providing a decentralized system that allows authorized organizations to monitor and verify each blood unit’s journey in real time.

---

## Motivation

In many regions, donated blood doesn’t always make it to patients due to poor tracking and logistics.  
We wanted to build something that could be trusted — a system where hospitals, couriers, and collection centers work with transparent data shared on a distributed ledger, not in isolated systems or paper records.

---

## Problem

Even successful blood donation campaigns lose up to 25% of collected units due to:
- Expired or mishandled inventory
- Poor traceability during transport
- Fragmented or missing data
- Lack of unified accountability

These inefficiencies cost lives and damage trust in the medical supply chain.

---

## Solution

PixelAfrica establishes a verifiable trail for each blood unit.  
Every bag is registered with key information (type, volume, expiry, responsible parties) and tracked on **Hedera Consensus Service (HCS)**.  
Each action — collection, transit, hospital testing, transfusion — is securely recorded and retrieved via **Mirror Node APIs**.

**Key features:**
- Wallet-based role authentication using **HashConnect**
- QR-based verification for transparency
- Immutable event history with timestamps
- No centralized storage or database required

---

## Core Pages

| Page | Purpose |
|------|----------|
| **Home (Pixel Map)** | Shows all registered blood bags as visual tiles, each color-coded by status. |
| **Register** | Used by collection centers to record a new bag, assign courier and hospital roles, and generate a QR code. |
| **Transit** | Couriers scan and update transport status using connected wallets. |
| **Hospital** | Doctors and hospital staff scan bag IDs to view history and mark test results or outcomes (tested, transfused, expired, etc.). |
| **Verify** | Public page for verifying a bag’s authenticity and full history using QR or ID lookup. |

---

## System Architecture

PixelAfrica runs entirely on the client side, without a traditional backend.  
Each event — registration, transit update, or hospital action — is written to the **Hedera Consensus Service (HCS)** and later fetched from **Mirror Nodes** to display verified history.

---

### Hedera Components Used
- **Hedera Consensus Service (HCS):** logs every lifecycle event immutably  
- **Mirror Nodes:** provide read access to public history  
- **HashConnect:** wallet connection and message signing  
- **@hashgraph/sdk:** low-level SDK for HCS transactions and receipts  

---

## Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | React + TypeScript + Vite |
| Blockchain | Hedera Consensus Service (HCS) |
| Wallet Integration | HashConnect + HashPack |
| Data Fetching | Mirror Node REST API |
| QR Tools | qrcode.react, react-qr-barcode-scanner |
| Hosting | Vercel (static deployment) |

---

## Local Setup and Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/pixel-africa.git
cd pixel-africa
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create a .env File
```bash
VITE_TOPIC_ID=0.0.xxxxx
VITE_OPERATOR_ID=0.0.xxxxx
VITE_OPERATOR_KEY=302e02...
VITE_WC_PROJECT_ID=your_walletconnect_project_id
```

### 4. Run Locally
```bash
npm run dev
```
- Then open http://localhost:5173

### 5. Build for Production
```bash
npm run build
```

---

## Deployment on Vercel

1. Push the repository to GitHub (make sure it is public).  
2. Import the project into Vercel and select **Vite** as the framework.  
3. Set the build command to `npm run build`.  
4. Set the output directory to `dist`.  
5. Add environment variables in the project settings.  
6. Click **Deploy**.  

---

## Roles and Permissions

| Role | Authentication | Permissions |
|------|----------------|--------------|
| **Collection Center** | Wallet required | Create and register new blood units |
| **Courier** | Wallet required | Update transport status and delivery confirmations |
| **Hospital Staff** | Wallet required | Add test results and finalize transfusion or expiry outcomes |
| **Public** | No wallet | Verify authenticity and view non-sensitive information |

---

## Security Notes

- No sensitive medical or personal data is stored on-chain.  
- All operations are signed locally through the user’s connected wallet.  
- Hedera Consensus Service ensures event integrity and ordering.  
- Mirror Nodes provide read-only verification for all status changes.  
- Only authorized wallet addresses can perform write actions.

---

## Hackathon Submission Checklist

- [x] Public GitHub repository created during the hackathon  
- [x] Clear README including setup and technology details  
- [x] Pitch deck and video links added below  
- [x] Invited **Hackathon@hashgraph-association.com** as a collaborator  
- [x] Built using Hedera technologies (HCS, Mirror Nodes, HashConnect)

---

## Pitch Deck and Demo

• Live Demo: https://pixel-africa.vercel.app

• Demo Video: https://youtu.be/7joHzZael3o• X / Twitter: https://x.com/PixelAfricaX

• X / Twitter: https://x.com/PixelAfricaX

• Source Code: https://github.com/GokhanCey/pixel-africa

• Pitch Deck: https://github.com/GokhanCey/pixel-africa/PitchDeck.pdf

---

## Hashgraph Developer Course - Certificate<img width="1268" height="126" alt="image" src="https://github.com/user-attachments/assets/f9f6dba2-7d53-4748-8e5f-eefd04926bba" />

<img width="1254" height="706" alt="image" src="https://github.com/user-attachments/assets/5341d8c2-cf81-45f4-a19e-216318ce4b41" />


---


## Credits

Built for **Hashgraph Hackathon 2025 – DLT for Social Impact**  
Powered by **Hedera Hashgraph**, **HashConnect**, and **Mirror Node APIs**
Each interaction is stored and retrieved using Hedera’s distributed infrastructure.
