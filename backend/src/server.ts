import https from "https"; 
import fs from "fs";
import path from "path";
import { attachChatSocket } from "./socket";

const initApp = require("./index").default as () => Promise<import("express").Express>;

const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "https://localhost:5173";

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "../localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../localhost.pem"))
};

initApp().then((app) => {
  const httpsServer = https.createServer(sslOptions, app);

  attachChatSocket(httpsServer, clientOrigin);

  httpsServer.listen(port, () => {
    console.log(`🔒 Secure Server listening at https://localhost:${port}`);
    console.log(`🚀 Socket.IO ready for ${clientOrigin}`);
  });
});