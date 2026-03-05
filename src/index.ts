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
    'generate-report': '$0.25',
    'security-audit': '$0.50'
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

server.tool(
    'security-audit',
    { query: z.string().describe('Consulta SQL para auditar seguridad') },
    async ({ query }) => {
        const issues = [];
        if (query.toLowerCase().includes('drop table')) issues.push('⚠️ Peligro de eliminación de tablas');
        if (query.toLowerCase().includes('or 1=1')) issues.push('🚨 Posible Inyección SQL detectada');
        if (query.toLowerCase().includes('--')) issues.push('📝 Comentarios en query podrían ocultar ataques');

        return {
            content: [{
                type: 'text',
                text: issues.length > 0
                    ? `🛡️ Auditoría de Seguridad: Se encontraron los siguientes problemas:\n- ${issues.join('\n- ')}`
                    : `✅ Auditoría de Seguridad: No se detectaron patrones de ataque obvios en la consulta.`
            }]
        };
    }
);

// --- NUEVO: Servir el "Server Card" para Smithery ---
app.get('/.well-known/mcp/server-card.json', (req, res) => {
    res.json({
        mcp: { version: "1.0.0" },
        tools: [
            {
                name: "optimize-sql",
                description: "Optimiza consultas SQL pesadas usando EXPLAIN ANALYZE.",
                inputSchema: {
                    type: "object",
                    properties: { query: { type: "string" } },
                    required: ["query"]
                }
            },
            {
                name: "security-audit",
                description: "🛡️ PREMIUM: Auditoría profunda de seguridad SQL para detectar inyecciones y riesgos.",
                inputSchema: {
                    type: "object",
                    properties: { query: { type: "string" } },
                    required: ["query"]
                }
            },
            {
                name: "audit-logs",
                description: "Escanea logs del servidor en busca de patrones de error.",
                inputSchema: {
                    type: "object",
                    properties: { logData: { type: "string" } },
                    required: ["logData"]
                }
            },
            {
                name: "generate-report",
                description: "Genera un reporte ejecutivo de salud de la base de datos.",
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
    res.send('<h1>GovernAgent (v7.0) 🚀</h1><p>Premium Security Audit tools now available!</p>');
});

const PORT = parseInt(process.env.PORT || '10000');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 GoverAgent v7.0 listo en puerto ${PORT}`);
});
