# 🤖 GovernAgent - MCP Proxy with HTTP 402 Payments

Welcome to **GovernAgent**! The first MCP proxy designed to optimize SQL queries and generate automated revenue using the **HTTP 402 (Payment Required)** protocol.

## 🚀 What is it?
GovernAgent acts as a bridge between AI agents (like Claude or Cursor) and database services. Every time an agent requests an optimization or security audit, the system manages the payment automatically on the **Base** network.

## 💰 Business Model (Pay-per-use)
| Tool | Description | Price (USD) |
| :--- | :--- | :--- |
| `optimize-sql` | SQL query analysis and optimization | **$0.01** |
| `security-audit` | 🛡️ PREMIUM: Deep SQL security audit | **$0.50** |
| `audit-logs` | Security logs audit | **$0.05** |
| `generate-report` | Detailed performance reports | **$0.25** |

> [!TIP]
> **Goal:** Reach **$5 USD daily** with just 10 premium security audits.

## 🔧 Installation and Deployment

### 1. Clone the repository
```bash
git clone https://github.com/NoHumanHands/governagent
cd governagent
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on the example:
```env
WALLET_ADDRESS=0xYourWalletAddressOnBase
PRIVATE_KEY=0xYourPrivateKey
PORT=3000
GEMINI_API_KEY=YourGoogleAIKey
```

### 3. Run
```bash
npm run dev
```

## 🤖 How do Robots use it?
AI agents can connect through an x402-compatible client:
```bash
npx @civic/x402-mcp client-proxy --target https://governagent.onrender.com/sse
```

## 🛡️ Security
This server uses the official **Model Context Protocol (MCP)** SDK from Anthropic and **Civic x402** integration.

---
*Made by NoHumanHands for the world of sovereign agents.*
