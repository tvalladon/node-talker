/**
 * ClientHandler class constructor.
 * ClientHandler is a base class for handling client specific tasks such as user creation, getting terminal capabilities etc.
 *
 * @param {Object} params - An object containing different parameters to control the execution of this command.
 * The structure of the 'params' object is:
 * - `client`: The websocket client
 * - `roomManager`: A roomManager instance for manipulating room.
 * - `commandHandler`: A commandHandler instance for handling commands
 */
const _ = require("lodash");
const Base = require("./base");
const User = require("../models/user");
const userManager = require("../modules/userManager");

class ClientHandler extends Base {
    constructor(params) {
        super(); // Call the constructor of the base class

        this.client = params.client; // Copy the client object ot this.client
        this.roomManager = params.roomManager;
        this.commandHandler = params.commandHandler;
        this.userManager = userManager;

        if (!this.client) {
            return;
        }

        this.logInfo("Client connected"); // Log client connection

        const user = new User(); // Set up the new user
        userManager.addUser({user, roomManager: this.roomManager}); // Add the user

        user.client = this.client; // Link the user with the client
        user.online = true; // Set the user to online

        this.user = user; // Assign the user to this.user

        // Initial ansi color and high ASCII support checks for the user's terminal
        user.status = "colorCheck";
        user.supportsColor = true;
        user.supportsHighAscii = true;

        // Initial color check for the client's terminal
        this.colorCheck();

        user.eventEmitter.on("user_move", () =>
            this.commandHandler.handleCommands({
                user,
                userManager,
                roomManager: params.roomManager,
                data: "look",
                context: "emit",
            })
        );

        this.handleEvents(); // Setup event handlers
    }

    /**
     * Handles different events like error, end, close, data etc. on websocket client.
     */
    handleEvents() {
        this.client.on("error", (err) => {
            this.logError(`Client ${err} event`);
        });

        this.client.on("end", (err) => {
            this.logError(`Client ${err} event`);
        });

        this.client.on("close", () => {
            this.logInfo("Client disconnected");
            this.user.online = false; // mark the user as offline
            userManager.save(this.user);
            userManager.removeUser(this.user.id); // remove the user from the list
            userManager.broadcast(`[p:${this.user.firstName} ${this.user.lastName}] has disconnected.`); // Notify all users about the disconnection
        });

        this.client.on("data", async (data) => {
            try {
                let cleanData = _.trim(_.toString(data));

                if (!this.checkTerminalCapabilities(cleanData)) {
                    if (cleanData) {
                        // Get the command name
                        let commandName = _.first(_.split(cleanData, ' ')).toLowerCase();

                        // Check if the command exists
                        if (!_.includes(this.commandHandler.getAllCommands(), commandName)) {
                            userManager.send(this.user.id, `Command or alias "${commandName}" not found.`);
                            this.sendPrompt();
                            return false;
                        }

                        let cleanDataArray = cleanData.split(' ');
                        cleanDataArray[0] = cleanDataArray[0].toLowerCase();
                        cleanData = cleanDataArray.join(' ');

                        const commandResult = this.commandHandler.handleCommands({
                            user: this.user,
                            userManager,
                            roomManager: this.roomManager,
                            data: cleanData
                        });

                        let didCommandSucceed;

                        if (commandResult instanceof Promise) {
                            didCommandSucceed = await commandResult;
                        } else {
                            didCommandSucceed = commandResult;
                        }

                        if (!didCommandSucceed) {
                            console.log('Error: Command handler execution failed');
                        }
                    }
                }

                // if (cleanData) this.logInfo("Client data", cleanData);
            } catch (error) {
                this.logInfo(`Failed to handle data: ${error}`); // Error message if handling data fails
            }
            this.sendPrompt();
        });
    }

    /**
     * Checks if ANSI colors are supported by the client.
     * It sends a message asking if colors are visible to the client.
     */
    colorCheck() {
        userManager.send([this.user.id], "\r\nChecking if you support ansi colors.\r\nCan you see this [c:text] in color?\r\n(y/n) > ", true, false);
    }

    /**
     * Checks if high ASCII characters are supported by the client.
     * It sends a message asking if two specific characters are visible to the client.
     */
    highAsciiCheck() {
        userManager.send([this.user.id], "\r\nChecking if you support special characters.\r\nCan you see BOTH of these characters correctly: ♥ and ¤ ?\r\n(y/n) > ", true, false);
    }

    /**
     * Sends a banner message to the user.
     * The message is either retrieved from settings, environment variables or set to 'SERVER BANNER'.
     */
    sendUserBanner() {
        let bannerMessage = (this.settings.bannerMessage || process.env.BANNER_MESSAGE || 'SERVER BANNER');

        userManager.send([this.user.id], bannerMessage);
    }

    /**
     * Sends a welcome message to the user.
     * The message is either retrieved from settings, environment variables or set to 'Welcome [p:<player_name>] to the server.'.
     */
    sendUserWelcome() {
        userManager.send([this.user.id], (this.settings.welcomeMessage || process.env.WELCOME_MESSAGE || 'Welcome [p:<player_name>] to the server.'));
    }

    /**
     * Sends the Message of the Day (MOTD) to the user.
     * The message is either retrieved from settings, environment variables or set to 'SERVER MOTD'.
     */
    sendUserMOTD() {
        userManager.send([this.user.id], (this.settings.motdMessage || process.env.MOTD || 'SERVER MOTD'));
    }

    /**
     * Sends a spawn message to user.
     * The message is either retrieved from settings, environment variables or set to '... and BOOM! you exist ...'
     */
    sendSpawnMessage() {
        userManager.send([this.user.id], (this.settings.spawnMessage || process.env.SPAWN_MESSAGE || '... and BOOM! you exist ...'));
    }

    /**
     * Sends a prompt to user.
     * It sends a predetermined prompt to the user.
     */
    sendPrompt() {
        if (this.user.status === 'active') {
            userManager.send([this.user.id], `[b:? for help][p:${this.user.morphedName || this.user.firstName + " " + this.user.lastName}] <red>:><reset> `, true, false);
        }
    }

    /**
     * Checks the terminal capabilities including ANSI colors and high ASCII characters.
     *
     * @param {string} strData - data received from the client for terminal capability check
     * @return {boolean} - Returns true if the terminal capabilities check is in progress. Otherwise, returns false.
     */
    checkTerminalCapabilities(strData) {
        if (this.user.status === "colorCheck") {
            this.handleColorCheck(strData);
        } else if (this.user.status === "asciiCheck") {
            this.handleHighAsciiCheck(strData);
        } else if (this.user.status === "welcome_pause") {
            this.user.status = "active";
            userManager.broadcast(`[p:${this.user.firstName} ${this.user.lastName}] has connected.`); // Notify all users about the new connection
            userManager.moveUser(this.user.id, process.env.START_ZONE || '000', process.env.START_ROOM || '000');
        } else {
            return false;
        }
        return true;
    }

    /**
     * Handles user response for the ANSI color support check.
     * Changes the user status to 'asciiCheck' and initiates the high ASCII check if a valid response is given.
     *
     * @param {String} strData - Response from the user. Should be either 'y' or 'n'.
     */
    handleColorCheck(strData) {
        if (strData.toLowerCase() === "y" || strData.toLowerCase() === "n") {
            this.user.supportsColor = strData.toLowerCase() === "y";
            this.user.status = "asciiCheck";
            this.highAsciiCheck();
        } else {
            this.colorCheck();
        }
    }

    /**
     * Handles the check for high ASCII character support in the user's terminal.
     * A response from the user regarding the special characters visibility should be handled here.
     *
     * @param {String} strData - Response from the user. Expected to be 'y' or 'n'.
     */
    handleHighAsciiCheck(strData) {
        if (strData.toLowerCase() === "y" || strData.toLowerCase() === "n") {
            this.user.supportsHighAscii = strData.toLowerCase() === "y";
            this.sendUserBanner();
            this.sendUserWelcome();
            this.sendSpawnMessage();
            this.sendUserMOTD();
            userManager.send([this.user.id], "Press [c:enter] to continue.");
            this.user.status = "welcome_pause";
        } else {
            this.highAsciiCheck();
        }
    }
}

module.exports = ClientHandler;
