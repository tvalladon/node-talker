/**
 * The CommandHandler class extends the Base class.
 * It handles loading command files dynamically and handling command execution in the application.
 *
 * @module CommandHandler
 */
const fs = require("fs");
const path = require("path");

const Base = require("./base");

class CommandHandler extends Base {
    constructor() {
        super(); // Call the constructor of the base class

        // Initialize class properties
        this.commands = new Map();

        // Automatically load commands when the class is initialized
        this.loadCommands();
    }

    /**
     * Loads command files from a set directory, importing each and storing
     * the commands and their aliases into a Map for quick retrieval.
     */
    loadCommands() {
        // Try to read the command files. If there's an error (e.g. directory doesn't exist), log the error message and stop executing
        let commandFiles;
        try {
            commandFiles = fs.readdirSync(path.join(__dirname, "../commands")).filter((file) => file.endsWith(".js"));
        } catch (err) {
            this.logError(`Failed to read command files: ${err.message}`);
            return;
        }

        // Import each command file
        for (const file of commandFiles) {
            let command;
            try {
                command = require(`../commands/${file}`);
            } catch (err) {
                // If there was an error while importing the file, log the error message and move on to the next file
                this.logError(`Failed to load command file "${file}": ${err.message}`);
                continue;
            }

            // Store the command and aliases in the Map
            this.commands.set(command.name, command);
            if (command.aliases) {
                command.aliases.forEach((alias) => this.commands.set(alias, command));
            }
            this.logInfo(`command ${command.name} loaded.`);
        }

        this.logInfo(`Loaded ${commandFiles.length} commands.`);
    }

    /**
     * Gets all the main commands registered in the application.
     * It excludes all aliases and returns only the unique main commands.
     *
     * @returns {object[]} An array of main command objects. Each command object contains
     * the name, description, help text, and aliases of the command.
     */
    getMainCommands() {
        const allCommands = [];

        this.commands.forEach((command, name) => {
            if (command.name === name) {
                allCommands.push(command);
            }
        });
        return allCommands;
    }

    /**
     * Handles and executes the incoming commands if they exist in the commands Map,
     * otherwise returns false. The command's execution also provides various potential parameters.
     *
     * @param {object} params - An object containing command instructions and context.
     * @returns {boolean} - A binary flag indicating whether the command has been executed.
     */
    handleCommands(params = {}) {
        let message = params.data;

        // Split on the first space to separate command from arguments
        const [commandName, parameters] = message.split(/ (.+)/);

        // Get command or aliases from commands Map
        const command = this.commands.get(commandName);
        if (!command) {
            return false;
        }

        // Execute the command with the provided parameters
        try {
            command.execute({
                command: commandName,
                user: params.user,
                userManager: params.userManager,
                roomManager: params.roomManager,
                data: parameters,
                context: params.context || "user",
                commandHandler: this,
                log: {
                    logInfo: this.logInfo,
                    logWarn: this.logWarn,
                    logError: this.logError,
                },
            });
            return true;
        } catch (err) {
            // If there was an error while executing the command, log the error message
            return false;
        }
    }

    /**
     * Gathers and returns all command names and aliases stored in the commands map.
     *
     * @returns {string[]} An array made up of command names and their aliases.
     */
    getAllCommands() {
        const allCommands = [];

        this.commands.forEach((command, name) => {
            // Add the command name to the array
            allCommands.push(name);
            // If the command has aliases, add them to the array
            if (command.aliases) {
                allCommands.push(...command.aliases);
            }
        });

        return allCommands;
    }
}

module.exports = CommandHandler;
