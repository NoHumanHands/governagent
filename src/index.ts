import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makePaymentAwareServerTransport } from '@civic/x402-mcp';
import { config } from 'dotenv';
import { z } from 'zod';

config();

const app = express();
app.use(express.json());

// 1. Configuración de cobros
const RECEIVER_ADDRESS = process.env.WALLET_ADDRESS;
const TOOL_PRICES = {
    'optimize-sql': '$0.01',
    'audit-logs': '$0.05',
    'generate-report': '$0.25'
};

// 2. Función que crea las herramientas (independiente)
const setupTools = (server: McpServer) => {
    server.tool(
        'optimize-sql',
        { query: z.string().describe('SQL a optimizar') },
        async ({ query }) => {
            return {
                content: [{ type: 'text', text: `🔍 Optimización: EXPLAIN ANALYZE ${query}` }]
            };
        }
    );
};

// 3. Manejador de conexiones (Crea un servidor nuevo para cada cliente)
const handleConnection = async (req: any, res: any) => {
    if (!RECEIVER_ADDRESS) {
        res.status(500).json({ error: 'Configuración incompleta', detail: 'Falta WALLET_ADDRESS' });
        return;
    }

    console.log(`📡 Nueva conexión MCP de: ${req.ip}`);

    try {
        // Creamos una instancia limpia por cada conexión
        const server = new McpServer({ name: 'GovernAgent', version: '1.0.0' });
        setupTools(server);

        // Creamos el transporte de pagos
        const transport = makePaymentAwareServerTransport(RECEIVER_ADDRESS, TOOL_PRICES);

        // Conectamos y procesamos
        await server.connect(transport);
        await transport.handleRequest(req, res);
    } catch (err: any) {
        console.error('❌ Error en conexión MCP:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error del servidor', message: err.message });
        }
    }
};

app.get('/sse', handleConnection);
app.post('/sse', handleConnection);

// Rutas de información
app.get('/', (req, res) => {
    res.send('<h1>GovernAgent is Online 🚀</h1><p>MCP Server with HTTP 402 Payments (v4.0)</p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', wallet: RECEIVER_ADDRESS });
});

const PORT = parseInt(process.env.PORT || '10000');
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Servidor GoverAgent v4.0 corriendo en puerto ${PORT}`);
});
