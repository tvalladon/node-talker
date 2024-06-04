/**
 * Command name: say
 * Description: This command lets you broadcast a message in various scopes.
 *
 * Usage:
 * "say <message>": Broadcast a message to the same room.
 * "yell <message>": Broadcast a message to the same and adjacent rooms.
 * "shout <message>": Broadcast a message globally across the server.
 *
 * E.g:
 * "say Hi everyone" - User sends a message in the current room.
 * "yell Help!" - User yells a message in the current and adjacent rooms.
 * "shout Hello World" - User shouts a message globally across the server.
 *
 * Abbreviated commands are also available for convenience.
 * Single quote (') for "say"
 * Double quotes (") for "yell"
 * Exclamation mark (!) for "shout"
 *
 * E.g:
 * "' Hi everyone" - Equivalent to "say Hi everyone"
 * "! Hello World" - Equivalent to "shout Hello World"
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
    name: "say",
    description: "This command lets you broadcast a message in various scopes.",
    help: "Use [c:say <message>], [c:yell <message>], or [c:shout <message>] to broadcast a message. Each command broadcasts to a different range: 'say' for the same room, 'yell' for local rooms, and 'shout' for global.",
    aliases: ["'", "yell", '"', "shout", "!"],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;

        // Error checking for valid message
        if (!data) {
            userManager.send(user.id, "You need to provide something to say!<sl>");
            return;
        }

        // Broadcast the 'action' to all users in the room
        const sendInRoom = (user, data) => {
            userManager.send(user.id, `You say: ${data}<sl>`);
            // Get all users in the same room
            let usersInRoom = userManager.getRoomUsers(user.zoneId, user.roomId).filter((roomUser) => roomUser.id !== user.id) || [];
            // The message that other users in the room will see
            userManager.send(
                usersInRoom.map((person) => person.id),
                `<sl>[p:${user.firstName} ${user.lastName}] says, "${data}"<sl>`
            );
        };

        // Broadcast the 'action' to all users in the room
        const sendLocally = (user, data) => {
            userManager.send(user.id, `You yell: ${data}<sl>`);
            // Get all users in the same room
            let usersInRoom = userManager.getRoomUsers(user.zoneId, user.roomId).filter((roomUser) => roomUser.id !== user.id) || [];
            // The message that other users in the room will see
            userManager.send(
                usersInRoom.map((person) => person.id),
                `<sl>[p:${user.firstName} ${user.lastName}] yells, "${data}"<sl>`
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
                    `<sl>(from nearby) [p:${user.firstName} ${user.lastName}] yells, "${data}"<sl>`
                );
            });
        };

        const sendGlobally = (user, message) => {
            // Broadcast the message to all users
            // The message that the current user will see
            userManager.send(user.id, `(globally) You shout: ${message}<sl>`);
            // Get all users in the same room
            let allUsers = userManager.getActiveUsers().filter((activeUser) => activeUser.id !== user.id) || [];
            // The message that other users on the server will see
            userManager.send(
                allUsers.map((person) => person.id),
                `<sl>[p:${user.firstName} ${user.lastName}] shouts, "${message}"<sl>`
            );
        };

        switch (command) {
            case "yell":
            case '"':
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not yell, please use [c:user create] to create an account.<sl>`);
                    return;
                }
                sendLocally(user, data);
                break;
            case "shout":
            case "!":
                if (user.role === "visitor") {
                    userManager.send(user.id, `Visitors can not shout, please use [c:user create] to create an account.<sl>`);
                    return;
                }
                sendGlobally(user, data);
                break;
            default:
                sendInRoom(user, data);
                break;
        }
    },
};
