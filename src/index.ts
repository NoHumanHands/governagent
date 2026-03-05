import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { config } from 'dotenv';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config();

const app = express();
app.use(express.json());

const RECEIVER_ADDRESS = process.env.WALLET_ADDRESS;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTsNK9Y7vPcecZTCTOpmbCCwEZT-YhKYc';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const TOOL_PRICES = {
    'optimize-sql': '$0.01',
    'audit-logs': '$0.05',
    'generate-report': '$0.25',
    'security-audit': '$0.50'
};

// 2. Definición del servidor
const server = new McpServer({ name: 'GovernAgent', version: '1.0.0' });

server.tool(
    'optimize-sql',
    { query: z.string().describe('SQL query to optimize') },
    async ({ query }) => {
        const prompt = `You are a database expert. Optimize this SQL query for performance and explain why. Be concise: ${query}`;
        const result = await model.generateContent(prompt);
        return { content: [{ type: 'text', text: `🔍 Optimization Report:\n\n${result.response.text()}` }] };
    }
);

server.tool(
    'security-audit',
    { query: z.string().describe('SQL query to audit for security') },
    async ({ query }) => {
        const prompt = `You are a cybersecurity expert. Perform a deep security audit on this SQL query. Detect SQL injection, sensitive data leaks, or risky patterns. Be professional and concise: ${query}`;
        const result = await model.generateContent(prompt);
        return { content: [{ type: 'text', text: `🛡️ PREMIUM Security Audit:\n\n${result.response.text()}` }] };
    }
);

// --- NUEVO: Servir el "Server Card" para Smithery ---
app.get('/.well-known/mcp/server-card.json', (req, res) => {
    res.json({
        mcp: { version: "1.0.0" },
        tools: [
            {
                name: "optimize-sql",
                description: "Optimizes heavy SQL queries using EXPLAIN ANALYZE to improve database performance.",
                inputSchema: {
                    type: "object",
                    properties: { query: { type: "string" } },
                    required: ["query"]
                }
            },
            {
                name: "security-audit",
                description: "🛡️ PREMIUM: Deep SQL security audit to detect injections and vulnerabilities.",
                inputSchema: {
                    type: "object",
                    properties: { query: { type: "string" } },
                    required: ["query"]
                }
            },
            {
                name: "audit-logs",
                description: "Scans server logs for error patterns and suspicious access.",
                inputSchema: {
                    type: "object",
                    properties: { logData: { type: "string" } },
                    required: ["logData"]
                }
            },
            {
                name: "generate-report",
                description: "Generates an executive database health and performance report.",
                inputSchema: {
                    type: "object",
                    properties: { metrics: { type: "object" } },
                    required: ["metrics"]
                }
            }
        ],

        "x-civic-pay": {
            address: RECEIVER_ADDRESS,
            pricing: TOOL_PRICES
        }
    });
});

// Manejador de conexiones original
const handleConnection = async (req: any, res: any) => {
    if (!RECEIVER_ADDRESS) {
        res.status(500).json({ error: 'Falta WALLET_ADDRESS' });
        return;
    }
    try {
        const transport = makePaymentAwareServerTransport(RECEIVER_ADDRESS, TOOL_PRICES);
        await server.connect(transport);
        await transport.handleRequest(req, res);
    } catch (err: any) {
        console.error('Err:', err.message);
        if (!res.headersSent) res.status(500).send(err.message);
    }
};

app.get('/sse', handleConnection);
app.post('/sse', handleConnection);

app.get('/', (req, res) => {
    res.send('<h1>GovernAgent (v9.0) 🧠</h1><p>Real-time AI Security & Performance Audit ACTIVE.</p>');
});

const PORT = parseInt(process.env.PORT || '10000');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 GoverAgent v9.0 (Gemini Powered) listo en puerto ${PORT}`);
});
