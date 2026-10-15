import type { McpToolContext } from './types'
import { version } from '../package.json'
import { createServer, startServer, stopServer } from './server'
import { registerToolYoutubeMusic } from './tools/youtube'
import http from 'http'

// --- Render Port binding for Free Web Service ---
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MCP Server is Live!');
}).listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// --- Main MCP Function ---
(async function main() {
  const mcp = createServer({
    name: 'my-mcp-server',
    version: version || '0.0.1',
  })

  process.on('SIGTERM', () => stopServer(mcp))
  process.on('SIGINT', () => stopServer(mcp))

  registerToolYoutubeMusic({ mcp } as McpToolContext)

  await startServer(mcp)
})()
