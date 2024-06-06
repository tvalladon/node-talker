/**
 * The RoomManager class is responsible for creating, managing, and retrieving
 * virtual rooms within the application. It uses a Map to store rooms and provides
 * utility methods to load and check room existence.
 *
 * @module RoomManager
 */
const fs = require("fs");
const path = require("path");
const Room = require("../models/room");
const Base = require("./base");

class RoomManager extends Base {
    constructor(params) {
        super(); // Call the constructor of the base class

        this.rooms = new Map();
        this.roomPath = params.roomPath;
    }

    /**
     * Formats zone ID and room ID to have leading zeros and formulates
     * the room key.
     *
     * @param {number} zoneId - Zone ID.
     * @param {number} roomId - Room ID.
     * @returns {string} - Formatted key in the form `{zoneId}:{roomId}`.
     */
    getRoomKey(zoneId, roomId) {
        const paddedZoneId = this.pad(zoneId); // Pad zoneId with zeros
        const paddedRoomId = this.pad(roomId); // Pad roomId with zeros
        return `${paddedZoneId}:${paddedRoomId}`;
    }

    /**
     * Loads a room specified by zone ID and room ID.
     * Checks if room is already loaded and if not, reads the room data from file system.
     *
     * @param {number} zoneId - Zone ID.
     * @param {number} roomId - Room ID.
     * @returns {Room|boolean} - An instance of Room or false if error occurs or room doesn't exist.
     */
    loadRoom(zoneId, roomId) {
        try {
            // Check if the room is already loaded
            const roomKey = this.getRoomKey(zoneId, roomId);

            if (this.rooms.has(roomKey)) {
                return this.rooms.get(roomKey);
            }

            if (!this.exists(zoneId, roomId)) {
                return false;
            }

            const filename = this.getRoomFilename(zoneId, roomId);
            const filePath = path.join(this.roomPath, filename);

            // Delete the previous cache before requiring the file.
            delete require.cache[require.resolve(filePath)];

            const roomData = require(filePath);
            const room = new Room(roomData);

            // Add the loaded room to the map
            this.rooms.set(roomKey, room);

            return room;
        } catch (error) {
            this.logInfo(`Error loading room ${zoneId}:${roomId}: ${error.message}`);
            return false;
        }
    }

    /**
     * Checks the existence of a room specified by zone ID and room ID.
     * First, checks in the room Map and then in the file system if room
     * was not found in the Map.
     *
     * @param {number} zoneId - Zone ID.
     * @param {number} roomId - Room ID.
     * @returns {boolean} - Result of the room existence check.
     */
    exists(zoneId, roomId) {
        // Check if the room is already loaded
        const roomKey = this.getRoomKey(zoneId, roomId);

        // Check if room is loaded in memory
        if (this.rooms.has(roomKey)) {
            return true;
        }

        // If room is not loaded, check if it exists on the file system
        const roomFilePath = `${this.roomPath}/${roomKey}.json`;
        if (fs.existsSync(roomFilePath)) {
            return true;
        }

        // Room does not exist
        return false;
    }

    /**
     * Get the filename of the room file based on zone ID and room ID.
     *
     * @param {number} zoneId - Zone ID.
     * @param {number} roomId - Room ID.
     * @returns {string} - Room filename.
     */
    getRoomFilename(zoneId, roomId) {
        return `${this.getRoomKey(zoneId, roomId)}.json`;
    }

    /**
     * Pads a number with zeros to the left to make sure it is at
     * least 3 digits long.
     *
     * @param {number} number - Number to pad.
     * @returns {string} - Padded number.
     */
    pad(number) {
        return String(number).padStart(3, "0");
    }

    /**
     * Unloads a room specified by zone ID and room ID.
     * Checks if room is already unloaded and if not, removes the room data from the Map.
     *
     * @param {number} zoneId - Zone ID.
     * @param {number} roomId - Room ID.
     * @returns {boolean} - Result of the operation, returns false if room is not found.
     */
    unloadRoom(zoneId, roomId) {
        try {
            // Check if the room is already loaded
            const roomKey = this.getRoomKey(zoneId, roomId);

            if (!this.rooms.has(roomKey)) {
                this.logError(`Room ${roomKey} is not loaded.`);
                return false;
            }

            // Unload the room
            this.rooms.delete(roomKey);

            this.logInfo(`Room ${roomKey} has been successfully unloaded.`);
            return true;
        } catch (error) {
            this.logError(`Error unloading room ${roomKey}: ${error.message}`);
            return false;
        }
    }
}

module.exports = RoomManager;
