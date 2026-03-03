import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { config } from 'dotenv';
import { z } from 'zod';

config();

const app = express();
app.use(express.json());

// 1. Configuración de pagos
const RECEIVER_ADDRESS = process.env.WALLET_ADDRESS;
const TOOL_PRICES = {
    'optimize-sql': '$0.01',
    'audit-logs': '$0.05',
    'generate-report': '$0.25'
};

// 2. Definición del servidor
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

// 3. LA SOLUCIÓN AL ERROR "ALREADY CONNECTED":
// Creamos el transporte una sola vez fuera de las rutas
let transport: any = null;

const getTransport = () => {
    if (!transport && RECEIVER_ADDRESS) {
        transport = makePaymentAwareServerTransport(RECEIVER_ADDRESS, TOOL_PRICES);
        server.connect(transport).catch(console.error);
        console.log('✅ Transporte MCP conectado por primera vez');
    }
    return transport;
};

// Las rutas ahora solo usan el transporte existente
const handleMcp = async (req: any, res: any) => {
    const currentTransport = getTransport();
    if (!currentTransport) {
        res.status(500).send('Servidor no inicializado (falta wallet)');
        return;
    }
    await currentTransport.handleRequest(req, res);
};

app.get('/sse', handleMcp);
app.post('/sse', handleMcp);

app.get('/', (req, res) => {
    res.send('<h1>GovernAgent is Online 🚀</h1><p>MCP Server with HTTP 402 Payments</p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', wallet: RECEIVER_ADDRESS });
});

const PORT = parseInt(process.env.PORT || '10000');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Servidor blindado corriendo en puerto ${PORT}`);
});
