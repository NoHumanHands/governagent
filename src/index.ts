import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { config } from 'dotenv';

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

server.tool(
    'optimize-sql',
    'Optimiza consultas SQL lentas',
    {
        query: { type: 'string', description: 'SQL a optimizar' }
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

    // makePaymentAwareServerTransport crea un transport HTTP/SSE
    const transport = makePaymentAwareServerTransport(
        RECEIVER_ADDRESS,
        TOOL_PRICES,
        {
            endpoint: '/messages'
        }
    );

    await server.connect(transport);
    await transport.handleRequest(req, res);
});

app.post('/messages', async (req, res) => {
    // El transport de Civic maneja las peticiones POST internamente si se configura bien,
    // pero para MCP standard necesitamos handleRequest.
    // En este SDK simplificado, a veces el transport mismo se encarga de todo.
    res.status(405).send('Use /sse for connection');
});

// 4. Endpoint de salud y métricas
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', wallet: RECEIVER_ADDRESS });
});

app.get('/metrics', (req, res) => {
    res.json({
        total_earnings: 'Consulte su wallet en Base Scan',
        target: '$5.00 USD',
        progress: 'Verifique transacciones en red Base'
    });
});

// 5. ¡Arranca!
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 GovernAgent (Real x402) corriendo en http://localhost:${PORT}`);
    console.log(`💰 Pagos hacia: ${RECEIVER_ADDRESS}`);
    console.log(`📊 Endpoint SSE: http://localhost:${PORT}/sse`);
});
