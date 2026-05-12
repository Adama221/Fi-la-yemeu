import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { initDb } from './database';

export async function setupMcpServer() {
  const db = await initDb();
  
  const mcpServer = new Server(
    {
      name: 'Samabutik E-Commerce MCP',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_products',
          description: 'Get all store products and stock levels',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_orders',
          description: 'Get all store orders',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'update_order_status',
          description: 'Update the status of an order',
          inputSchema: {
            type: 'object',
            properties: {
              order_id: { type: 'number' },
              status: { type: 'string', description: 'New status (e.g. paid, shipped, cancelled)' },
            },
            required: ['order_id', 'status'],
          },
        },
        {
          name: 'add_product',
          description: 'Add a new product to the store',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'number' },
              description: { type: 'string' },
              stock: { type: 'number' },
            },
            required: ['name', 'price', 'description', 'stock'],
          },
        },
        {
          name: 'search_products',
          description: 'Search for products by name or category',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search term for name or category' },
            },
            required: ['query'],
          },
        }
      ],
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case 'get_products': {
        const products = await db.all('SELECT * FROM products');
        return {
          content: [{ type: 'text', text: JSON.stringify(products, null, 2) }],
        };
      }
      
      case 'get_orders': {
        const orders = await db.all('SELECT * FROM orders');
        return {
          content: [{ type: 'text', text: JSON.stringify(orders, null, 2) }],
        };
      }
      
      case 'update_order_status': {
        const { order_id, status } = request.params.arguments as any;
        await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, order_id]);
        return {
          content: [{ type: 'text', text: `Order ${order_id} status updated to ${status}` }],
        };
      }

      case 'add_product': {
        const { name, price, description, stock } = request.params.arguments as any;
        const result = await db.run(
          'INSERT INTO products (name, price, description, stock) VALUES (?, ?, ?, ?)',
          [name, price, description, stock]
        );
        return {
          content: [{ type: 'text', text: `Added product ${name} with ID ${result.lastID}` }],
        };
      }

      case 'search_products': {
        const { query } = request.params.arguments as any;
        const products = await db.all(
          'SELECT * FROM products WHERE name LIKE ? OR category LIKE ?',
          [`%${query}%`, `%${query}%`]
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(products, null, 2) }],
        };
      }

      default:
        throw new Error('Unknown tool');
    }
  });

  return mcpServer;
}
