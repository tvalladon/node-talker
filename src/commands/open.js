/**
 * Command name: open
 * Description: Open or close a container.
 * The command aliases correspond to different ways of opening or closing a container.
 *
 * "open": Open a container.
 * "close": Close a container.
 *
 * Usage:
 * "open <container>": Opens the specified container if it's in the room or the user's inventory.
 * "close <container>": Closes the specified container if it's in the room or the user's inventory.
 *
 * Example:
 * "open chest" - Opens a chest in the room or the user's inventory.
 * "close chest" - Closes a chest in the room or the user's inventory.
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 * The structure of the `params` object is:
 * - `command`: The command or alias used to trigger the function.
 * - `user`: The user object identifying who is interacting.
 * - `userManager`: Manager to handle user-related requirements.
 * - `roomManager`: Manager to handle room-related queries.
 * - `itemManager`: Manager to handle item-related queries.
 * - `data`: The additional data provided with the command.
 */

const _ = require("lodash");

module.exports = {
    name: "open",
    description: "Open or close a container.",
    aliases: ["close"],
    help: 'Use [c:open <container>] to open a container, or [c:close <container>] to close a container.',
    execute: async (params) => {
        const {command, user, userManager, roomManager, itemManager, data} = params;

        if (!data) {
            userManager.send(user.id, `Please specify a container to ${command}.`);
            return false;
        }

        const containerName = data.toLowerCase();
        const zoneId = user.zoneId;
        const roomId = user.roomId;

        // Fetch containers from the user's inventory and the room
        const userContainers = itemManager.findItems({owner: user.id, container: true});
        const roomContainers = itemManager.findItems({location: `${zoneId}:${roomId}`, container: true});

        // Combine containers from both sources
        const allContainers = userContainers.concat(roomContainers);

        // Filter containers by partial name match (case-insensitive)
        const filteredContainers = allContainers.filter(container =>
            container.name.toLowerCase().includes(containerName) ||
            containerName.split(' ').every(part => container.name.toLowerCase().includes(part))
        );

        if (filteredContainers.length === 0) {
            userManager.send(user.id, `No container named "${containerName}" found.`);
            return false;
        } else if (filteredContainers.length > 1) {
            const containerList = filteredContainers.map((container, index) => `"${container.name}:${index + 1}"`).join(", ");
            userManager.send(user.id, `More than one "${containerName}" found. Please specify: ${containerList}`);
            return false;
        }

        const targetContainer = filteredContainers[0];

        // Determine if the command is to open or close the container
        const isOpening = command === "open";

        if (isOpening && targetContainer.open) {
            userManager.send(user.id, `The "${targetContainer.name}" is already open.`);
            return false;
        }

        if (!isOpening && !targetContainer.open) {
            userManager.send(user.id, `The "${targetContainer.name}" is already closed.`);
            return false;
        }

        // Update the container's state
        targetContainer.open = isOpening;
        itemManager.saveItem(targetContainer);

        // Notify the user and others in the room
        const action = isOpening ? 'open' : 'close';
        userManager.send(user.id, `You ${action} the ${targetContainer.name}.`);
        userManager.send(
            userManager.getRoomUsers(zoneId, roomId).map((u) => u.id),
            `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${action}s [i:${targetContainer.name}].`
        );

        return true;
    }
};
