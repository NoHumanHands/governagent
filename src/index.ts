import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { config } from 'dotenv';
import { z } from 'zod';

config();

const app = express();

// 1. Configuración de pagos
const RECEIVER_ADDRESS = process.env.WALLET_ADDRESS;

// Precios por herramienta (MCP x402 usa strings como "$0.01")
const TOOL_PRICES = {
    'optimize-sql': '$0.01',
    'audit-logs': '$0.05',
    'generate-report': '$0.25'
};

// 2. Define las herramientas de TU proxy
const server = new McpServer({
    name: 'GovernAgent',
    version: '1.0.0'
});

// Usamos zod para que TypeScript no se queje
server.tool(
    'optimize-sql',
    {
        query: z.string().describe('SQL a optimizar')
    },
    async ({ query }) => {
        return {
            content: [{
                type: 'text',
                text: `🔍 Optimización: EXPLAIN ANALYZE ${query}`
            }]
        };
    }
);

// 3. Configura el transporte SSE (Payment-Aware)
app.get('/sse', async (req, res) => {
    if (!RECEIVER_ADDRESS || RECEIVER_ADDRESS.includes('TU_DIRECCION')) {
        res.status(500).send('Configura WALLET_ADDRESS en .env');
        return;
    }

    // Simplificamos las opciones para evitar errores de tipos
    const transport = makePaymentAwareServerTransport(
        RECEIVER_ADDRESS,
        TOOL_PRICES
    );

    await server.connect(transport);
    await transport.handleRequest(req, res);
});

// 4. Endpoint de salud
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', wallet: RECEIVER_ADDRESS });
});

// 5. ¡Arranca!
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 GovernAgent (Fix) corriendo en http://localhost:${PORT}`);
});
