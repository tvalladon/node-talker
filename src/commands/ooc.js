/**
 * Command name: ooc
 * Description: This command lets you broadcast a message in various scopes.
 *
 * Usage:
 * "ooc <message>": Broadcast a message to the same room.
 * "looc <message>": Broadcast a message to the same and adjacent rooms.
 * "gooc <message>": Broadcast a message globally across the server.
 *
 * E.g:
 * "ooc discusses the scene." - User sends a message to the current room.
 * "looc asks for clarification" - User sends a message to the current and adjacent rooms.
 * "gooc shares a thought." - User sends a message globally across the server.
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
    name: "ooc",
    description: "This command lets you broadcast a message in various scopes.",
    help: "Use [c:ooc <message>], [c:looc <message>], or [c:gooc <message>] to broadcast a message. Each command broadcasts to a different range: 'ooc' for the same room, 'looc' for local rooms, and 'gooc' for global.",
    aliases: ["looc", "gooc"],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;
        let {logInfo, logWarn, logError} = params.log;

        // Error checking for valid message
        if (!data) {
            userManager.send(user.id, "You need to provide something to ooc!<sl>");
            return;
        }

        // Broadcast the 'message' to all users in the room
        const sendInRoom = (user, data) => {
            userManager.send(user.id, `You ooc: ${data}<sl>`);
            // Get all users in the same room
            let usersInRoom = userManager.getRoomUsers(user.zoneId, user.roomId).filter((roomUser) => roomUser.id !== user.id) || [];
            // The message that other users in the room will see
            userManager.send(
                usersInRoom.map((person) => person.id),
                `<sl>[p:${user.morphedName || user.firstName + " " + user.lastName}] OOC, "${data}"<sl>`
            );
        };

        // Broadcast the 'message' to all users in the room and adjacent rooms
        const sendLocally = (user, data) => {
            userManager.send(user.id, `You ${data}<sl>`);
            // Get all users in the same room
            let usersInRoom = userManager.getRoomUsers(user.zoneId, user.roomId).filter((roomUser) => roomUser.id !== user.id) || [];
            // The message that other users in the room will see
            userManager.send(
                usersInRoom.map((person) => person.id),
                `<sl>[p:${user.morphedName || user.firstName + " " + user.lastName}] LOOC, "${data}"<sl>`
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
                    `<sl>(from nearby) [p:${user.morphedName || user.firstName + " " + user.lastName}] LOOC, "${data}"<sl>`
                );
            });
        };

        // Broadcast the message to all users
        const sendGlobally = (user, message) => {
            // The message that the current user will see
            userManager.send(user.id, `(globally) You ${message}<sl>`);
            // Get all users in the same room
            let allUsers = userManager.getActiveUsers().filter((activeUser) => activeUser.id !== user.id) || [];
            // The message that other users on the server will see
            userManager.send(
                allUsers.map((person) => person.id),
                `<sl>(from somewhere) [p:${user.morphedName || user.firstName + " " + user.lastName}] GOOC, "${message}"<sl>`
            );
        };

        switch (command) {
            case "looc":
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not looc, please use [c:user create] to create an account.<sl>`);
                    return;
                }
                sendLocally(user, data);

                logInfo('communication', {type:'looc', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
            case "gooc":
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not gooc, please use [c:user create] to create an account.<sl>`);
                    return;
                }
                sendGlobally(user, data);

                logInfo('communication', {type:'gooc', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
            default:
                sendInRoom(user, data);

                logInfo('communication', {type:'ooc', ipAddress: user.client.remoteAddress, firstName: user.firstName, lastName: user.lastName, zoneId: user.zoneId, roomId: user.roomId, message: data});
                break;
        }
    },
};
