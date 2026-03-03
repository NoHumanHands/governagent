import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { config } from 'dotenv';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config();

const app = express();
app.use(express.json());

const RECEIVER_ADDRESS = process.env.WALLET_ADDRESS;
const TOOL_PRICES = {
    'optimize-sql': '$0.01',
    'audit-logs': '$0.05',
    'generate-report': '$0.25'
};

// 2. Definición del servidor
const server = new McpServer({ name: 'GovernAgent', version: '1.0.0' });

server.tool(
    'optimize-sql',
    { query: z.string().describe('SQL a optimizar') },
    async ({ query }) => {
        return { content: [{ type: 'text', text: `🔍 Optimización: EXPLAIN ANALYZE ${query}` }] };
    }
);

// --- NUEVO: Servir el "Server Card" para Smithery ---
app.get('/.well-known/mcp/server-card.json', (req, res) => {
    res.json({
        mcp: { version: "1.0.0" },
        tools: [
            {
                name: "optimize-sql",
                description: "Optimiza consultas SQL usando AI.",
                inputSchema: {
                    type: "object",
                    properties: { query: { type: "string" } },
                    required: ["query"]
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
    res.send('<h1>GovernAgent (v5.0) 🚀</h1><p>Server Card active at /.well-known/mcp/server-card.json</p>');
});

const PORT = parseInt(process.env.PORT || '10000');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 GoverAgent v5.0 listo en puerto ${PORT}`);
});
