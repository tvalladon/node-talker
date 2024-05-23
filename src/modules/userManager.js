/**
 * UserManager is a class that extends the Base class and provides functionality
 * for user management in a system. This includes actions like moving a user
 * to a different room, adding and removing users, querying for users, or
 * sending messages to the users.
 *
 * @module UserManager
 */
const Base = require("./base");
const _ = require("lodash");

class UserManager extends Base {
    constructor() {
        super(); // Call the constructor of the base class

        this.users = [];
        this.log = null; // Initialize log to null
    }

    /**
     * Moves specified user(s) to a specified room. The room is loaded from the
     * RoomManager. If the room does not exist, an error message is send to users.
     *
     * @param {string|Array} userIds - Array of user IDs or a single user ID string.
     * @param {number} zoneId - ID of the zone to move the user(s) in.
     * @param {number} roomId - ID of the room to move the user(s) in.
     * @returns {boolean} - Whether the operation was successful.
     */
    moveUser(userIds, zoneId, roomId) {
        // Convert userId to an array if it's a string
        if (typeof userIds === "string") {
            userIds = [userIds];
        }

        const room = this.roomManager.loadRoom(zoneId, roomId);

        if (!room) {
            // Handle error (room not found)
            this.send([user.id], "<sl>Error: Room not found.<dl>");
            return false;
        }

        userIds.forEach((userId) => {
            // Get the user object using the userId
            const user = this.getUser({id: userId});

            // Update user's zoneId and roomId
            user.zoneId = zoneId;
            user.roomId = roomId;
            // Inform the user about the move
            // this.send([user.id], `<sl>You have been moved to <cyan>${room.name}<reset>.<dl>`);
            user.eventEmitter.emit("user_move");
        });
        return true;
    }

    /**
     * Adds a new user to the UserManager's users list.
     *
     * @param {Object} params - An object that must include "user" and "roomManager".
     */
    addUser(params) {
        this.roomManager = params.roomManager;
        this.users.push(params.user);
    }

    /**
     * Removes a user from the UserManager's users list using their id.
     *
     * @param {string} id - ID of the user to remove.
     */
    removeUser(id) {
        _.remove(this.users, {id});
    }

    /**
     * Fetch a user's data using the specified search parameters.
     *
     * @param {Object} params - Search parameters to find a user.
     * @returns {?Object} - User object if found or null otherwise.
     */
    getUser(params) {
        return _.find(this.getOnlineUsers(), params);
    }

    /**
     * Fetch all online users.
     *
     * @returns {Array} - The list of online users.
     */
    getOnlineUsers() {
        return _.filter(this.users, "online");
    }

    /**
     * Fetch all active users.
     *
     * @returns {Array} - The list of active users.
     */
    getActiveUsers() {
        return _.filter(this.users, {status: "active"});
    }

    /**
     * Fetch all users in a specified room.
     *
     * @param {number} zoneId - ID of the zone to search in.
     * @param {number} roomId - ID of the room to search users in.
     * @returns {Array} - The list of users present in the specified room.
     */
    getRoomUsers(zoneId, roomId) {
        return _.filter(this.users, {zoneId, roomId});
    }

    /**
     * Sends the specified message to the specified users.
     *
     * @param {Array|string} userIds - Array of user IDs or a single user ID string.
     * @param {string} message - The message to send.
     */
    send(userIds, message) {
        // Convert userId to an array if it's a string
        if (typeof userIds === "string") {
            userIds = [userIds];
        }

        _.forEach(userIds, (id) => {
            const user = this.getUser({id});
            if (user && user.client) {
                user.client.write(this.format(`${message}`, user));
            } else {
                console.log(`User with id ${id.id} not found or offline.`);
            }
        });
    }

    /**
     * Sends out a message to all active users.
     *
     * @param {string} message - The message to broadcast.
     */
    broadcast(message) {
        _.forEach(this.getActiveUsers(), (user) => {
            if (user) {
                this.send({id: user.id}, message);
            }
        });
    }
}

const userManager = new UserManager();
module.exports = userManager;
