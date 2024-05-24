/**
 * The Base class provides fundamental utilities and methods for other classes.
 * It is responsible for settings retrieval, logging, and text formatting.
 *
 * @alias module:Base
 */

const fs = require('fs');
const path = require('path');
const _ = require("lodash");
const LogHandler = require("../modules/logHandler");

class Base {
    constructor() {
        // Construct the logging system
        this.log = new LogHandler({path: process.cwd() + '/' + process.env.LOGS_PATH + '/'});

        this.settings = this.getConfig();

        this.formatSpecs = {
            "<player_name>": (user) => `${user.firstName} ${user.lastName}` || "",
            "<server_name>": this.settings.server_name || process.env.SERVER_NAME || "SERVER_NAME",
            "<cls>": "\x1b[2J", // Clear screen
            "<reset>": "\x1b[0m",
            "<bold>": "\x1b[1m",
            "<dim>": "\x1b[2m",
            "<underline>": "\x1b[4m",
            "<blink>": "\x1b[5m",
            "<inverse>": "\x1b[7m",
            "<hidden>": "\x1b[8m",
            "<black>": "\x1b[30m",
            "<red>": "\x1b[31m",
            "<green>": "\x1b[32m",
            "<yellow>": "\x1b[33m",
            "<blue>": "\x1b[34m",
            "<magenta>": "\x1b[35m",
            "<cyan>": "\x1b[36m",
            "<white>": "\x1b[37m",
            "<rc>": `\x1b[${Math.floor(Math.random() * (36 - 31 + 1) + 31)}m`, // Random color
            "<sl>": "\r\n", // Single new line
            "<dl>": "\r\n\r\n", // Double new line
            "<t>": "\t", // Tab
            "<ht>": "    ", // Half Tab
            "<zws>": "\u200B", // Zero width space
        };
    }

    /**
     * This method reads a configuration file 'settings.json', parsing and returning its contents as an object.
     *
     * @returns {object|null} settings object if successful, otherwise returns null.
     * @throws {Error} when settings.json does not exist or contains invalid format data.
     */
    getConfig() {
        let settings;
        const filepath = path.join(`${process.cwd()}/${process.env.DB_PATH}/`, 'settings.json');

        try {
            if (fs.existsSync(filepath)) {
                const data = fs.readFileSync(filepath, 'utf8');
                settings = JSON.parse(data);

                if (!settings || typeof settings !== 'object') { // Check if settings is an object
                    throw new Error('Invalid settings format in settings.json');
                }

            } else {
                throw new Error('Settings.json does not exist');
            }

        } catch (error) {
            console.error(`Failed to get settings from 'db/settings.json': ${error.message}`);
        }

        return settings;
    }

    /**
     * Privately used logging method which prepares & formats data to be logged, and then writes it via instance's LogHandler.
     *
     * @param {string} level - Represents the level of the log (info, warn, error).
     * @param {string} message - Message to be logged.
     * @param {null|object} data - Additional data to be logged.
     */
    _log(level, message, data = null) {
        const formattedData = data ? this.formatMessage(data) : null;

        // Construct log entry with remoteAddress, remotePort, message, and data in the specified order
        let logEntry = {};

        if (this.hasOwnProperty('client')) {
            if (this.client && this.client.remoteAddress) {
                logEntry.remoteAddress = this.client.remoteAddress;
            }

            if (this.client && this.client.remotePort) {
                logEntry.remotePort = this.client.remotePort;
            }
        }

        logEntry.message = message;

        if (formattedData) {
            logEntry.data = formattedData;
        }

        this.log[level](logEntry);
    }

    /**
     * Logs an error message. The logging operation is debounced to 1000ms to prevent redundant logs.
     *
     * @param {string} error - The error message to be logged.
     */
    logError(error) {
        const debouncedLogError = _.debounce(() => {
            this._log("error", "Client error", error);
        }, 1000);

        debouncedLogError();
    }

    /**
     * Logs an informational message.
     *
     * @param {string} message - The information message to be logged.
     * @param {null|object} data - Additional data to be logged.
     */
    logInfo(message, data = null) {
        this._log("info", message, data);
    }

    /**
     * Logs a warning message.
     *
     * @param {string} message - The warning message to be logged.
     * @param {null|object} data - Additional data to be logged.
     */
    logWarn(message, data = null) {
        this._log("warn", message, data);
    }

    /**
     * Formats an input message. If message is object, maps keys and values into array of formatted strings.
     * If message is string, returns it as is. For unsupported input types, returns a default string.
     *
     * @param {*} input - Represents the incoming message.
     * @returns {string} - returns a formatted string.
     */
    formatMessage(input) {
        if (typeof input === "string") {
            return input;
        } else if (typeof input === "object" && input !== null) {
            return _.map(input, (value, key) => `[${key}: ${value}]`);
        } else {
            return "Unknown input type";
        }
    }

    /**
     * Replaces custom tags in a provided text depending on its context.
     * Uses regular expressions to find and format specific strings.
     *
     * @param {string} text - The text to format.
     * @param {object} user - User object to pull dynamic data, if needed. Default is an empty object.
     * @returns {string} - text with replaced custom tags.
     */
    // Function to handle text formatting
    format(text, user = {}) {
        // Replace custom tags for players, exits, interactable props, and commands
        text = text.replace(/\[p:(.+?)]/g, "<yellow>[<green>$1<yellow>]<reset>"); // Players
        text = text.replace(/\[e:(.+?)]/g, "<yellow>[<cyan>$1<yellow>]<reset>"); // Exits
        text = text.replace(/\[i:(.+?)]/g, "<yellow>[:<magenta>$1<yellow>:]<reset>"); // Interactable props
        text = text.replace(/\[c:(.+?)]/g, '<yellow>"<green>$1<yellow>"<reset>'); // Commands
        text = text.replace(/\[b:(.+?)]/g, "<yellow>(<green>$1<yellow>)<reset>"); // Brackets

        // Replace user-specific format specifiers
        for (const spec in this.formatSpecs) {
            if (typeof this.formatSpecs[spec] === "function") {
                text = text.split(spec).join(this.formatSpecs[spec](user));
            } else {
                text = text.split(spec).join(this.formatSpecs[spec]);
            }
        }

        return text;
    }
}

module.exports = Base;
