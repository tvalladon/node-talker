/**
 * UserManager is a class that extends the Base class and provides functionality
 * for user management in a system. This includes actions like moving a user
 * to a different room, adding and removing users, querying for users, or
 * sending messages to the users.
 *
 * @module UserManager
 */
const Base = require("./base");
const fs = require('fs');
const path = require('path');
const _ = require("lodash");
const uuid = require("uuid");
const crypto = require('crypto')

class UserManager extends Base {
    constructor() {
        super(); // Call the constructor of the base class

        this.users = [];
        this.log = null; // Initialize log to null
    }

    /**
     * Creates and saves a new user object to the file system.
     *
     * @param {Object} userInfo - The user object to save, without ID which will be created
     * @returns {Object} The saved user object
     */
    create(userInfo = {}) {
        // Prepare a user object
        const user = {
            ...userInfo,
            id: uuid.v4(),
        };

        // Define the user directory path
        const userDirPath = path.join(process.env.DB_PATH, 'users');

        // Get the list of user files
        const userFiles = fs.readdirSync(userDirPath);

        // Check if a user file with the same ID already exists
        if (userFiles.includes(`${user.id}.json`)) {
            throw new Error("User with this ID already exists.<sl>");
        }

        // Check all user files and make sure no user has same first and last name
        for (let file of userFiles) {
            const existingUser = JSON.parse(fs.readFileSync(path.join(userDirPath, file), 'utf-8'));
            if (existingUser.firstName === user.firstName && existingUser.lastName === user.lastName) {
                throw new Error("User with this first and last name already exists.<sl>");
            }
        }

        // Omit specified properties from user object
        const simplifiedUser = _.omit(user, ['client', 'eventEmitter', 'status', 'online']);

        // Now all checks passed, save the simplified user
        const filePath = path.join(userDirPath, `${simplifiedUser.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(simplifiedUser));

        return simplifiedUser;
    }

    /**
     * Loads a user object from the file system.
     *
     * @param {String} userId - The ID of the user to load
     * @throws {Error} If no user with the specified ID exists
     *
     * @return {Object} The loaded user
     */
    load(userId) {
        const filePath = path.join(process.env.DB_PATH, 'users', `${userId}.json`);
        if (fs.existsSync(filePath)) {
            const userData = fs.readFileSync(filePath);
            this.user = JSON.parse(userData);
            return this.user;
        } else {
            return false;
        }
    }

    verifyAndLoadUser(firstName, lastName, password) {
        const userDirPath = path.join(process.env.DB_PATH, 'users');
        const userFiles = fs.readdirSync(userDirPath);
        for (let file of userFiles) {
            const existingUser = JSON.parse(fs.readFileSync(path.join(userDirPath, file), 'utf-8'));
            if (existingUser.firstName === firstName && existingUser.lastName === lastName) {
                if (!this.checkPassword(password, existingUser.salt, existingUser.password)) {
                    throw new Error('Incorrect password.<sl>');
                } else {
                    return this.load(existingUser.id);
                }
            }
        }
        throw new Error('User with the provided first and last name does not exist.<sl>');
    }

    /**
     * Saves a user object to the file system.
     *
     * @param {Object} user - The user object to save
     */
    save(user) {

        // Do not save if temporary is true
        if (user.temporary !== true) {
            const filePath = path.join(process.env.DB_PATH, 'users', `${user.id}.json`);

            // Check if user file already exists
            if (fs.existsSync(filePath)) {
                // If file exists, load its content and check first and last names
                let existingUser = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                // If first and last names don't match, throw an error
                if (existingUser.firstName !== user.firstName || existingUser.lastName !== user.lastName) {
                    throw new Error("First and last name don't match with existing user data.");
                }
            }

            // Create simplified user object excluding 'client', 'eventEmitter', 'status', 'online'
            const simplifiedUser = _.omit(user, ['client', 'eventEmitter', 'status', 'online']);

            fs.writeFileSync(filePath, JSON.stringify(simplifiedUser));
        }
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
     * @param {boolean} format - Should the message be formatted? Default: true
     */
    send(userIds, message, format = true) {
        // Convert userId to an array if it's a string
        if (typeof userIds === "string") {
            userIds = [userIds];
        }

        _.forEach(userIds, (id) => {
            const user = this.getUser({id});
            if (user && user.client) {
                if (format === true) {
                    user.client.write(this.format(`${message}`, user));
                } else {
                    user.client.write(`${message}`);
                }
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

    /**
     * Generates a new random salt and hashes a password using that salt.
     *
     * @param {string} password - Plain-text password to hash
     * @returns {Object} An object containing the salt and the hashed password.
     */
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex'); // create a random salt
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`); // create hash
        return {
            salt,
            password: hash
        };
    }

    /**
     * Checks a password against a given salt and hash.
     *
     * @param {string} password - Password to check
     * @param {string} salt - Salt that was used to hash the password
     * @param {string} hash - Hash to check the password against
     * @returns {boolean} Returns `true` if the generated hash matches the provided hash, `false` otherwise.
     */
    checkPassword(password, salt, hash) {
        let generatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
        return generatedHash === hash;
    }
}

const userManager = new UserManager();
module.exports = userManager;
