/**
 * Command name: act
 * Description: This command lets you broadcast an action in various scopes.
 *
 * Usage:
 * "act <message>": Broadcast an action to the same room.
 * "lact <message>": Broadcast an action to the same and adjacent rooms.
 * "gact <message>": Broadcast an action globally across the server.
 *
 * E.g:
 * "act dances in a circle." - User sends an action to the current room.
 * "lact hides" - User sends an action to the current and adjacent rooms.
 * "gact starts to sneak." - User sends an action globally across the server.
 *
 * Abbreviated commands are also available for convenience.
 * Single quote (me) for "act"
 * Double quotes (lme) for "lact"
 * Exclamation mark (gme) for "gact"
 *
 * E.g:
 * "me dances" - Equivalent to "act dances"
 * "lme sneaks" - Equivalent to "gact sneaks"
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 * The structure of the 'params' object is:
 * - `command`: The command or alias used to trigger the method.
 * - `user`: The user object identifying who is interacting.
 * - `userManager`: Manager to handle user related requirements.
 * - `roomManager`: Manager to handle room related queries.
 * - `data`: The additional data provided with the command.
 */

const _ = require("lodash");

module.exports = {
    name: "act",
    description: "This command lets you broadcast an action in various scopes.",
    help: "Use [c:act <message>], [c:lact <message>], or [c:gact <message>] to broadcast an action. Each command broadcasts to a different range: 'act' for the same room, 'lact' for local rooms, and 'gact' for global.",
    aliases: ["lact", "gact", "me", "lme", "gme"],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;
        let {logInfo, logWarn, logError} = params.log;

        // Error checking for valid message
        if (!data) {
            userManager.send(user.id, "You need to provide something to act!");
            return;
        }

        // Broadcast the 'action' to all users in the room
        const sendInRoom = (user, data) => {
            userManager.send(user.id, `You act: ${data}<reset>`);
            // Get all users in the same room
            let usersInRoom = userManager.getRoomUsers(user.zoneId, user.roomId).filter((roomUser) => roomUser.id !== user.id) || [];
            // The message that other users in the room will see
            userManager.send(
                usersInRoom.map((person) => person.id),
                `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${data}<reset>`
            );
        };

        // Broadcast the 'action' to all users in the room and adjacent rooms
        const sendLocally = (user, data) => {
            userManager.send(user.id, `You ${data}<reset>`);
            // Get all users in the same room
            let usersInRoom = userManager.getRoomUsers(user.zoneId, user.roomId).filter((roomUser) => roomUser.id !== user.id) || [];
            // The message that other users in the room will see
            userManager.send(
                usersInRoom.map((person) => person.id),
                `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${data}<reset>`
            );

            // Fetch current room
            let currentRoom = roomManager.loadRoom(user.zoneId, user.roomId);

            // Get the current room exits
            let exits = currentRoom.exits;

            // Iterate through the exits
            _.forEach(exits, function (value) {
                [nextZoneId, nextRoomId] = value.split(":");

                // Get the users in the room that exit leads to
                let usersInExit = userManager.getRoomUsers(nextZoneId, nextRoomId) || [];

                // Send message to users in adjacent rooms
                userManager.send(
                    usersInExit.map((person) => person.id),
                    `(from nearby) [p:${user.morphedName || user.firstName + " " + user.lastName}] ${data}<reset>`
                );
            });
        };

        // Broadcast the message to all users
        const sendGlobally = (user, message) => {
            // The message that the current user will see
            userManager.send(user.id, `(globally) You ${message}`);
            // Get all users in the same room
            let allUsers = userManager.getActiveUsers().filter((activeUser) => activeUser.id !== user.id) || [];
            // The message that other users on the server will see
            userManager.send(
                allUsers.map((person) => person.id),
                `(from somewhere) [p:${user.morphedName || user.firstName + " " + user.lastName}] ${message}`
            );
        };

        switch (command) {
            case "lact":
            case "lme":
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not lact, please use [c:user create] to create an account.`);
                    return;
                }
                sendLocally(user, data);

                logInfo('communication', {type:'lact', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
            case "gact":
            case "gme":
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not gact, please use [c:user create] to create an account.`);
                    return;
                }
                sendGlobally(user, data);

                logInfo('communication', {type:'gact', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
            default:
                sendInRoom(user, data);

                logInfo('communication', {type:'act', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
        }
    },
};
