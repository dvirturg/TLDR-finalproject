import http from "http";
import { attachChatSocket } from "./socket";



const initApp = require("./index").default as () => Promise<import("express").Express>;

const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

initApp().then((app) => {
  const httpServer = http.createServer(app);

  attachChatSocket(httpServer, clientOrigin);

  httpServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Socket.IO ready for ${clientOrigin}`);
  });
});
