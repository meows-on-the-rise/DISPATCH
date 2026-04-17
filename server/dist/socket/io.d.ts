import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
export declare function initSocket(httpServer: HttpServer): SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function getIO(): SocketServer;
//# sourceMappingURL=io.d.ts.map