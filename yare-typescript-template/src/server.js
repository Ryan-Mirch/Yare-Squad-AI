const WebSocketServer = require("ws").Server;
const fs = require("fs");

const wss = new WebSocketServer({ port: 8080 });

console.log("receiving messages");

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    console.log("Position Data: ", message.toString());
    fs.writeFileSync("./src/position.json", message.toString());    
  });
});