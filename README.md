# 🤖 GovernAgent - Proxy MCP con Pagos HTTP 402

¡Bienvenido a **GovernAgent**! El primer proxy MCP diseñado para optimizar consultas SQL y generar ingresos automáticos mediante el protocolo **HTTP 402 (Payment Required)**.

## 🚀 ¿Qué es?
GovernAgent actúa como un puente entre agentes de IA (como Claude o Cursor) y servicios de base de datos. Cada vez que un agente solicita una optimización o auditoría, el sistema gestiona el cobro automáticamente en la red **Base**.

## 💰 Modelo de Negocio (Pay-per-use)
| Herramienta | Descripción | Precio (USD) |
| :--- | :--- | :--- |
| `optimize-sql` | Análisis y optimización de queries SQL | **$0.01** |
| `audit-logs` | Auditoría de logs de seguridad | **$0.05** |
| `generate-report` | Reportes detallados de rendimiento | **$0.25** |

> [!TIP]
> **Meta:** Alcanzar **$5 USD diarios** con solo 500 llamadas de optimización.

## 🔧 Instalación y Despliegue

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/governagent
cd governagent
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env` basado en el ejemplo:
```env
WALLET_ADDRESS=0xTuDireccionDeWalletEnBase
PRIVATE_KEY=0xTuPrivateKey
PORT=3000
```

### 3. Ejecutar
```bash
npm run dev
```

## 🤖 ¿Cómo lo usan los Robots?
Los agentes de IA pueden conectarse a través de un cliente compatible con x402:
```bash
npx @civic/x402-mcp client-proxy --target http://tu-servidor.com:3000/sse
```

## 📊 Progreso del Proyecto
- [x] **Día 1**: Preparación y Estructura.
- [x] **Día 2**: MVP Funcional del Proxy.
- [x] **Día 3**: Integración de Pagos x402.
- [x] **Día 4**: Configuración de Smithery y Documentación.
- [ ] **Día 5**: Registro en Marketplaces y Primeros Usuarios.

## 🛡️ Seguridad
Este servidor utiliza el SDK oficial del **Model Context Protocol (MCP)** de Anthropic y la integración de **Civic x402**.

---
*Hecho por Antigravity para el mundo de los agentes soberanos.*
