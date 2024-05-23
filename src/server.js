/**
 * server.js
 */
// Load core modules
require("dotenv").config();
const { parse } = require("error-stack-parser");
const net = require("net");

// Load core project modules
const LogHandler = require("./modules/logHandler");
const RoomManager = require("./modules/roomManager");
const CommandHandler = require("./modules/commandHandler"); // Import CommandHandler
const ClientHandler = require("./modules/clientHandler");

// Construct the command system
commandHandler = new CommandHandler(); // Initialize CommandHandler

// Construct the logging system
const log = new LogHandler({ path: "../logs/" });

// Initialize RoomManager
const roomManager = new RoomManager({ roomPath: `${process.cwd()}/${process.env.DB_PATH}/rooms/` });

let server = net.createServer((client) => {
    try {
        new ClientHandler({ client, roomManager, commandHandler });
    } catch (error) {
        log.error({ message: `Error creating client handler`, error });
    }
});

server.on("error", (error) => {
    log.error({ message: "Server error", file: parse(error).filePath, line: parse(error).lineNumber, error });
});

// Set env values
const port = process.env.PORT || 3000;
server.listen(port, (error) => {
    if (error) {
        return console.error({ message: "Error starting server", error });
    }
    log.info({ message: "Server listening", port });
});
