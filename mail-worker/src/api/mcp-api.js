import app from '../hono/hono';
import { registerMcpRoutes } from '../service/mcp-routes.js';

registerMcpRoutes(app);
export default app;
