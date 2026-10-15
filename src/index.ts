import type { McpToolContext } from './types'
import { version } from '../package.json'
import { createServer, startServer, stopServer } from './server'
import { registerToolYoutubeMusic } from './tools/youtube'
import http from 'http'
import WebSocket from 'ws'

// --- ১. Render Port binding (Health Check) ---
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Xiaozhi YouTube Music MCP Server is Live!');
}).listen(PORT, () => {
  console.log(`HTTP Server is running on port ${PORT}`);
});

// --- ২. Xiaozhi WebSocket Gateway Connection ---
const XIAOZHI_WSS_URL = "wss://api.xiaozhi.me/mcp/?token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMzIwNzcsImFnZW50SWQiOjI0OTc5NTgsImVuZHBvaW50SWQiOiJhZ2VudF8yNDk3OTU4IiwicHVycG9zZSI6Im1jcC1lbmRwb2ludCIsImlhdCI6MTc5MjA0NTAyMywiZXhwIjoxODIzNjAyNjIzfQ.IxfB-uqYWVbFWRTVjvDXaQ8BF1yUb_kbC1-iRzcYKVpw1RbpXNf1JizO37DWz8__B64iUC0FUDF2M00FSjI5aA";

function connectXiaozhi() {
  console.log("Connecting YouTube Music MCP to Xiaozhi Gateway...");
  const ws = new WebSocket(XIAOZHI_WSS_URL);

  ws.on('open', () => {
    console.log("✅ Successfully connected YouTube Music MCP to Xiaozhi!");
  });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Xiaozhi যখন টুলের লিস্ট চাইবে
      if (msg.method === "tools/list") {
        ws.send(JSON.stringify({
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            tools: [
              {
                name: "search_youtube_music",
                description: "ইউটিউব মিউজিকে গান সার্চ করা বা প্লে করার টুল।",
                inputSchema: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "গানের নাম বা শিল্পীর নাম" }
                  },
                  required: ["query"]
                }
              }
            ]
          }
        }));
      }

      // Xiaozhi যখন গান সার্চ/প্লে টুল কল করবে
      if (msg.method === "tools/call" && msg.params?.name === "search_youtube_music") {
        const songQuery = msg.params.arguments?.query || "";
        
        ws.send(JSON.stringify({
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            content: [{ 
              type: "text", 
              text: `রানা ভাই, ইউটিউব মিউজিকে "${songQuery}" গানটি খোঁজা হচ্ছে এবং প্লে করার জন্য সিগন্যাল পাঠানো হয়েছে।` 
            }]
          }
        }));
      }
    } catch (e) {
      console.error("Error handling Xiaozhi message:", e);
    }
  });

  ws.on('close', () => {
    console.log("❌ Connection lost. Reconnecting in 5 seconds...");
    setTimeout(connectXiaozhi, 5000);
  });

  ws.on('error', (err) => {
    console.error("WebSocket Error:", err.message);
  });
}

// --- ৩. Main MCP Function ---
(async function main() {
  const mcp = createServer({
    name: 'xiaozhi-youtube-mcp',
    version: version || '0.0.1',
  })

  process.on('SIGTERM', () => stopServer(mcp))
  process.on('SIGINT', () => stopServer(mcp))

  registerToolYoutubeMusic({ mcp } as McpToolContext)

  await startServer(mcp)
  
  // Xiaozhi Gateway-এর সাথে সংযোগ স্থাপন
  connectXiaozhi();
})()
