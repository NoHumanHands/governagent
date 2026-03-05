import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
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
app.use(express.static('public')); // Servir el logo y otros estáticos

const RECEIVER_ADDRESS = process.env.WALLET_ADDRESS;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDTsNK9Y7vPcecZTCTOpmbCCwEZT-YhKYc';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Cliente Blockchain para ver ganancias
const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

const TOOL_PRICES = {
    'optimize-sql': '$0.01',
    'audit-logs': '$0.05',
    'generate-report': '$0.25',
    'security-audit': '$0.50'
};

// 1. Manejador de conexiones con Servidor Independiente por Usuario
const handleConnection = async (req: any, res: any) => {
    if (!RECEIVER_ADDRESS) {
        res.status(500).json({ error: 'Falta WALLET_ADDRESS' });
        return;
    }

    try {
        // CREAR UNA INSTANCIA NUEVA POR CADA CONEXIÓN (Estabilidad Total)
        const server = new McpServer({ name: 'GovernAgent', version: '1.0.0' });

        // Registrar las herramientas en esta instancia
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

        server.tool(
            'audit-logs',
            { logData: z.string().describe('Log data to analyze') },
            async ({ logData }) => {
                const prompt = `Analyze these server logs for error patterns or suspicious activity: ${logData}`;
                const result = await model.generateContent(prompt);
                return { content: [{ type: 'text', text: `📋 Log Audit Report:\n\n${result.response.text()}` }] };
            }
        );

        server.tool(
            'generate-report',
            { metrics: z.object({}).describe('Metrics object to summarize') },
            async ({ metrics }) => {
                const prompt = `Generate an executive database health report based on these metrics: ${JSON.stringify(metrics)}`;
                const result = await model.generateContent(prompt);
                return { content: [{ type: 'text', text: `📊 Executive Report:\n\n${result.response.text()}` }] };
            }
        );

        // Crear el transporte con cobro
        const transport = makePaymentAwareServerTransport(RECEIVER_ADDRESS, TOOL_PRICES);

        // Conectar y procesar
        await server.connect(transport);
        await transport.handleRequest(req, res);
    } catch (err: any) {
        console.error('Err:', err.message);
        if (!res.headersSent) res.status(500).send(err.message);
    }
};

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

// (Manejador movido arriba)

app.get('/sse', handleConnection);
app.post('/sse', handleConnection);

app.get('/dashboard', async (req, res) => {
    try {
        const balance = await publicClient.getBalance({ address: RECEIVER_ADDRESS as `0x${string}` });
        const ethBalance = formatEther(balance);
        const goal = 5; // $5 USD (Aproximado en bsETH para visualización)

        res.send(`
            <html>
                <head>
                    <title>GovernAgent Admin | Earnings</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; text-align: center; padding-top: 50px; }
                        .card { background: #1e293b; border-radius: 15px; padding: 30px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
                        h1 { color: #38bdf8; margin-bottom: 5px; }
                        .balance { font-size: 3rem; font-weight: bold; margin: 20px 0; color: #f8fafc; }
                        .meta { color: #94a3b8; font-size: 1.1rem; }
                        .progress-bar { background: #334155; border-radius: 10px; height: 20px; width: 300px; margin: 20px auto; overflow: hidden; }
                        .progress-fill { background: linear-gradient(90deg, #38bdf8, #818cf8); height: 100%; width: ${Math.min((parseFloat(ethBalance) / 0.002) * 100, 100)}%; transition: width 1s ease-in-out; }
                        .tool-list { text-align: left; margin-top: 20px; }
                        .tag { background: #0ea5e9; padding: 2px 8px; border-radius: 5px; font-size: 0.8rem; margin-right: 5px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <img src="/logo.png" alt="GovernAgent Logo" style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 20px rgba(255,255,255,0.3); margin-bottom: 15px;">
                        <p class="meta">GOVERNAGENT v13.0</p>
                        <h1>Revenue Dashboard</h1>
                        <div class="balance">${parseFloat(ethBalance).toFixed(6)} <span style="font-size: 1rem; color: #94a3b8;">bsETH</span></div>
                        <p class="meta">Target: $5.00 / day</p>
                        <div class="progress-bar"><div class="progress-fill"></div></div>
                        <div class="tool-list">
                            <p><span class="tag">$0.50</span> Premium Security Audit: 🟢 Active</p>
                            <p><span class="tag">$0.01</span> SQL Optimization: 🟢 Active</p>
                        </div>
                        <p style="margin-top: 20px; font-size: 0.8rem; color: #64748b;">Wallet: ${RECEIVER_ADDRESS}</p>
                    </div>
                </body>
            </html>
        `);

    } catch (error) {
        res.status(500).send("Error fetching blockchain data");
    }
});

app.get('/', (req, res) => {
    res.send('<h1>GovernAgent (v13.0) 🧠</h1><div style="text-align:center"><img src="/logo.png" style="width:150px; border-radius:50%; box-shadow: 0 0 30px rgba(255,255,255,0.2); margin-top:20px;"></div><p>Intelligent MCP Server Live. Visit <a href="/dashboard" style="color:#38bdf8">/dashboard</a> to see earnings.</p>');
});

const PORT = parseInt(process.env.PORT || '10000');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 GoverAgent v9.0 (Gemini Powered) listo en puerto ${PORT}`);
});
