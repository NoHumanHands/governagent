import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { config } from 'dotenv';
import { z } from 'zod';

config();

const app = express();
app.use(express.json()); // Necesario para recibir mensajes de los robots

// 1. Configuración de pagos
const RECEIVER_ADDRESS = process.env.WALLET_ADDRESS;
const TOOL_PRICES = {
    'optimize-sql': '$0.01',
    'audit-logs': '$0.05',
    'generate-report': '$0.25'
};

const server = new McpServer({
    name: 'GovernAgent',
    version: '1.0.0'
});

server.tool(
    'optimize-sql',
    { query: z.string().describe('SQL a optimizar') },
    async ({ query }) => {
        return {
            content: [{ type: 'text', text: `🔍 Optimización: EXPLAIN ANALYZE ${query}` }]
        };
    }
);

// 2. LA SOLUCIÓN AL 404: Aceptar GET y POST
const handleMcp = async (req: any, res: any) => {
    if (!RECEIVER_ADDRESS) {
        res.status(500).send('Falta WALLET_ADDRESS');
        return;
    }
    const transport = makePaymentAwareServerTransport(RECEIVER_ADDRESS, TOOL_PRICES);
    await server.connect(transport);
    await transport.handleRequest(req, res);
};

app.get('/sse', handleMcp);
app.post('/sse', handleMcp); // <-- Esto es lo que faltaba para los robots

// 3. Página principal para evitar el "Cannot GET /"
app.get('/', (req, res) => {
    res.send('<h1>GovernAgent is Online 🚀</h1><p>MCP Server with HTTP 402 Payments</p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', wallet: RECEIVER_ADDRESS });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🤖 Servidor blindado en puerto ${PORT}`);
});
