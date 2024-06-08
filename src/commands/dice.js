/**
 * Command name: dice
 * Description: This command lets you make a die roll and broadcast the result in various scopes.
 *
 * Usage:
 * "dice <dice>": Broadcast a message with roll result in the same room.
 * "ldice <dice>": Broadcast a message with roll result in the same and adjacent rooms.
 * "gdice <dice>": Broadcast a message with roll result globally across the server.
 *
 * @param {object} params - A similar structure as the params in 'say' command.
 */

const _ = require("lodash");

module.exports = {
    name: "dice",
    description: "Roll dice with or without a modifier and with advantage or disadvantage.",
    help: "Format: `<number of dice>d<dice sides>[+/-<modifier>][adv/dis]`. Examples: [c:dice 2d6+3], [c:dice 1d20-2], [c:dice 2d20adv], [c:dice 4d10-2dis]. Each command broadcasts to a different range: 'dice' for the same room, 'ldice' for local rooms, and 'gdice' for global.",
    aliases: ["ldice", "gdice"],
    execute(params) {
        const { command, user, data, userManager, roomManager } = params;
        let {logInfo, logWarn, logError} = params.log;

        if (!data) {
            userManager.send(user.id, "You need to provide dice information!");
            return;
        }

        let diceData = parseDiceString(data);

        if (diceData.error) {
            userManager.send(user.id, `${diceData.error}`);
            return;
        }

        let output = "";

        let diceRolls = rollDice(diceData.count, diceData.sides);

        if (diceData.with_advantage || diceData.with_disadvantage) {
            // sort array in descending order
            diceRolls.sort((a, b) => b - a);

            // split the array into two arrays, high and low
            let midpoint = Math.ceil(diceRolls.length / 2);
            let highRolls = diceRolls.slice(0, midpoint);
            let lowRolls = diceRolls.slice(midpoint);

            output += `${diceData.with_advantage ? " > Adv" : "   Adv"}: ${calculateDiceRolls(highRolls, diceData.modifier)}\r\n`;
            output += `${diceData.with_disadvantage ? " > Dis" : "   Dis"}: ${calculateDiceRolls(lowRolls, diceData.modifier)}`;
        } else {
            output += `<ht>${calculateDiceRolls(diceRolls, diceData.modifier)}\r\n`;
        }

        // Get all users in the same room
        let targetUsers = userManager.getRoomUsers(user.zoneId, user.roomId) || [];

        switch (command) {
            case "ldice":
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not ldice, please use [c:user create] to create an account.`);
                    return;
                }
                // Get the current room exits
                let exits = roomManager.loadRoom(user.zoneId, user.roomId).exits;

                // Iterate through the exits
                _.forEach(exits, function (value) {
                    const [nextZoneId, nextRoomId] = value.split(":");

                    // Get the users in the room that the exit leads to
                    let usersInExit = userManager.getRoomUsers(nextZoneId, nextRoomId) || [];

                    // Append usersInExit to the targetUsers array
                    targetUsers = targetUsers.concat(usersInExit);
                });

                logInfo('communication', {type:'ldice', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
            case "gdice":
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not gdice, please use [c:user create] to create an account.`);
                    return;
                }
                // Override targetUsers with all active users
                targetUsers = userManager.getActiveUsers() || [];

                logInfo('communication', {type:'gdice', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
            default:
                logInfo('communication', {type:'dice', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
        }

        // Send roll information to all targetUsers
        userManager.send(
            targetUsers.map((person) => person.id),
            `[p:${user.morphedName || user.firstName + " " + user.lastName}] rolls: ${data}\r\n${output}`
        );
    },
};

/**
 * The parseDiceString function is intended to parse a string command for rolling dice.
 *
 * @param {string} input - The dice command as a string.
 * @returns {object} parsedData - An object that carries specifications of the dice roll.
 * parsedData.count: Number of dice to roll.
 * parsedData.sides: Number of sides on the dice.
 * parsedData.modifier: Optional modifier to the total roll.
 * parsedData.with_advantage: Indicates if the roll is made with advantage.
 * parsedData.with_disadvantage: Indicates if the roll is made with disadvantage.
 * If a wrong input is detected, an object with an 'error' key and an error message is returned.
 */
function parseDiceString(input) {
    // Define default parsed data
    let parsedData = {
        count: null,
        sides: null,
        modifier: 0,
        with_advantage: false,
        with_disadvantage: false,
    };

    // Define the regular expressions
    const regexList = {
        dice: /(\d+)d(\d+)/,
        modifier: /([-+]\d+)/,
        advantage: /(adv)/,
        disadvantage: /(dis)/,
    };

    // Function to execute regex on input and update parsedData
    const updateParsedData = (regex, field1, field2 = null) => {
        let match = input.match(regex);
        if (match) {
            parsedData[field1] = Number(match[1]);
            if (field2) {
                parsedData[field2] = Number(match[2]);
            }
        }
    };

    // Execute the function with each regex
    updateParsedData(regexList.dice, "count", "sides");
    updateParsedData(regexList.modifier, "modifier");

    // Update booleans for advantage and disadvantage
    if (input.match(regexList.advantage)) {
        parsedData.with_advantage = true;
    }
    if (input.match(regexList.disadvantage)) {
        parsedData.with_disadvantage = true;
    }

    // List of conditions for error messaging
    let errorCheckList = [
        {
            condition: parsedData.count < 1 || parsedData.count > 100,
            errorMessage: "Count must be between 1 and 100.",
        },
        {
            condition: parsedData.sides < 2 || parsedData.sides > 100,
            errorMessage: "Sides must be between 2 and 100.",
        },
        {
            condition: parsedData.modifier < -100 || parsedData.modifier > 100,
            errorMessage: "Modifier must be between -100 and 100.",
        },
        {
            condition: parsedData.with_advantage && parsedData.with_disadvantage,
            errorMessage: "A dice roll cannot be both with advantage and disadvantage.",
        },
        {
            condition: (parsedData.with_advantage || parsedData.with_disadvantage) && parsedData.count % 2 !== 0,
            errorMessage: "Number of dice must be even when rolling with advantage/disadvantage.",
        },
    ];

    // Loop over each error condition and return if one is met
    for (let { condition, errorMessage } of errorCheckList) {
        if (condition) {
            return { error: errorMessage };
        }
    }

    return parsedData;
}

/**
 * This function simulates rolling a specified number of dice, each with a specified number of sides.
 *
 * @param {number} count - The number of dice to roll.
 * @param {number} sides - The number of sides on each die.
 * @returns {number[]} - An array of dice roll results.
 * @throws {Error} - Will throw an error if input parameters are invalid.
 */
function rollDice(count, sides) {
    // Input type checking
    if (typeof count !== "number" || typeof sides !== "number") {
        throw new Error("Both count and sides must be a number");
    }

    // Input value checking
    if (count < 1 || sides < 1) {
        throw new Error("Both count and sides must be at least 1");
    }

    // Input integer checking
    if (!Number.isInteger(count) || !Number.isInteger(sides)) {
        throw new Error("Both count and sides must be an integer");
    }

    let results = [];
    for (let i = 0; i < count; i++) {
        let roll = Math.floor(Math.random() * sides) + 1;
        results.push(roll);
    }

    return results;
}

/**
 * Calculate the total of an array of dice rolls, an optional modifier, and return a formatted string.
 *
 * @param {Array<number>} dice - An array of numbers representing dice rolls.
 * @param {number} [modifier=0] - An optional modifier to be added to or subtracted from the total dice roll.
 * @returns {string} - A formatted string representing the total of dice rolls and modifier.
 */
function calculateDiceRolls(dice, modifier = 0) {
    // Error checking - if dice is not an array or modifier is not a number, throw an Error
    if (!Array.isArray(dice) || typeof modifier !== "number") {
        throw new Error("Invalid arguments. Ensure dice is an array and modifier (if provided) is a number.");
    }

    // Error checking - if any element of dice is not a number, throw an Error
    if (dice.some((die) => typeof die !== "number")) {
        throw new Error("Invalid arguments. Elements of dice array must be numbers.");
    }

    // Calculate the sum of the dice array
    const sum = dice.reduce((a, b) => a + b, 0);

    // Start building the result string
    let result = `${dice.join(", ")} = ${sum}`;

    // If a modifier exists and is not zero, append it and the total to the result string
    if (modifier > 0) {
        result += ` + ${modifier} = ${sum + modifier}`;
    } else if (modifier < 0) {
        result += ` - ${Math.abs(modifier)} = ${sum + modifier}`;
    }

    // Return the result string
    return result;
}
