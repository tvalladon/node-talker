/**
 * The LogHandler class is a custom utility for managing log data.
 * It writes the logging data to files in a specified path, separates
 * by different extensions based on logging levels (info, warn, error, or debug).
 *
 * @module LogHandler
 */
const fs = require("fs");
const moment = require("moment");
const _ = require("lodash");

class LogHandler {
    constructor(params) {
        this.path = params.path;
    }

    /**
     * Writes the given data into specific log file.
     *
     * @param {*} data - Logging data.
     * @param {string} [ext='log'] - File extension (indicating log level).
     * @param {string} [logPath=''] - Optional logging path. Default to instance's logging path if not provided.
     * @returns {*} - Returns data.
     */
    write(data, ext = "log", logPath = "") {
        logPath = logPath || this.path;

        const logName = moment().format("YYYY-MM-DD") + `.${ext}`;
        if (!fs.existsSync(logPath)) fs.mkdirSync(logPath);
        fs.appendFile(`${logPath}${logName}`, `${data}\n`, (err) => {
            if (err) throw err;
        });
        return data;
    }

    /**
     * Writes a log entry at the specified level.
     *
     * @param {string} level - Log level (e.g., 'INFO', 'WARN', 'ERROR', 'DEBUG').
     * @param {Object} params - Logging details.
     */
    log(level, params) {
        const logTemplate = _.template(`[${moment().format("YYYY-MM-DD HH:mm:ss")}][${level}]${_.map(Object.keys(params), (key) => `[${key}: ${params[key]}]`).join("")}`);
        console.log(this.write(logTemplate({}), level === "DEBUG" ? "json" : "log"));
    }

    /**
     * Writes a log at the 'INFO' level.
     * @param {Object} params - Logging details.
     */
    info(params) {
        this.log("INFO", params);
    }

    /**
     * Writes a log at the 'WARN' level.
     * @param {Object} params - Logging details.
     */
    warn(params) {
        this.log("WARN", params);
    }

    /**
     * Writes a log at the 'ERROR' level.
     * @param {Object} params - Logging details.
     */
    error(params) {
        this.log("ERROR", params);
    }

    /**
     * Writes a debug log. The data is written into '.json' file for better visibility and parsing.
     * @param {Object} params - Logging details.
     */
    debug(params) {
        const logTemplate = _.template(`[${moment().format("YYYY-MM-DD")}] [DEBUG] payload: <%= JSON.stringify(params, null, 2) %}`);
        this.write(logTemplate({}), "json");
    }
}

module.exports = LogHandler;
