/**
 * server.js
 */
// Load core modules
require("dotenv").config();
const {parse} = require("error-stack-parser");
const net = require("net");

// Load core project modules
const LogHandler = require("./modules/logHandler");
const RoomManager = require("./modules/roomManager");
const CommandHandler = require("./modules/commandHandler"); // Import CommandHandler
const ClientHandler = require("./modules/clientHandler");
const ItemManager = require("./modules/itemManager"); // Import ItemManager

// Construct the command system
commandHandler = new CommandHandler(); // Initialize CommandHandler

// Construct the logging system
const log = new LogHandler({path: "../logs/"});

// Initialize RoomManager
const roomManager = new RoomManager({roomPath: `${process.cwd()}/${process.env.DB_PATH}/rooms/`});

// Initialize ItemManager
const itemManager = new ItemManager({itemPath: `${process.cwd()}/${process.env.DB_PATH}/items/`});

let server = net.createServer((client) => {
    try {
        new ClientHandler({client, roomManager, commandHandler, itemManager});
    } catch (error) {
        log.error({message: `Error creating client handler`, error});
    }
});

server.on("error", (error) => {
    log.error({message: "Server error", file: parse(error).filePath, line: parse(error).lineNumber, error});
});

// Set env values
const port = process.env.PORT || 3000;
server.listen(port, (error) => {
    if (error) {
        return console.error({message: "Error starting server", error});
    }
    log.info({message: "Server listening", port});
});

// Timeout to clear empty rooms - now in global scope, so it will run only once, not per connection
let clientHandler = new ClientHandler({client: null, roomManager, commandHandler, itemManager});

// Default to 30 min if not set in process.env
const intervalMinutes = parseInt(process.env.UNLOAD_EMPTY_ROOMS_INTERVAL_MINUTES) || 30;

setInterval(() => {
    log.info({message: `Loaded Rooms: ${roomManager.rooms.size}, Connected Users: ${clientHandler.userManager.users.length}`});

    roomManager.rooms.forEach((room, roomKey) => {
        const [zoneId, roomId] = roomKey.split(':');

        // Check if any user resides in the room
        const isRoomEmpty = !clientHandler.userManager.users.some(user => {
            return user.zoneId == zoneId && user.roomId == roomId;
        });

        // If the room is empty, log it
        if (isRoomEmpty) {
            roomManager.unloadRoom(zoneId, roomId);
        }
    });
}, intervalMinutes * 60 * 1000);
