/**
 * Command name: drop
 * Description: Drop, deposit, place, put, stash, or store items.
 * The command aliases correspond to different ways of dropping an item.
 *
 * "drop": Drop an item from the user's inventory.
 * "deposit": Drop an item from the user's inventory.
 * "insert": Drop an item from the user's inventory.
 * "place": Drop an item from the user's inventory.
 * "put": Drop an item from the user's inventory.
 * "stash": Drop an item from the user's inventory.
 * "store": Drop an item from the user's inventory.
 *
 * Usage:
 * "drop <item>": Drop a single item from the user's inventory.
 * "drop <quantity> <item>": Drop multiple items from the user's inventory.
 * "drop <item> in <container>": Drop an item into a container in the room or the user's inventory.
 *
 * Example:
 * "drop sword" - Drops a sword from the user's inventory.
 * "drop 5 coins" - Drops 5 coins from the user's inventory.
 * "drop sword in chest" - Drops a sword into a chest in the room or the user's inventory.
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
    name: "drop",
    description: "Drop, deposit, place, put, stash, or store items.",
    aliases: ["deposit", "insert", "place", "put", "stash", "store", "withdraw"],
    help: 'Use [c:drop <item>] to drop an item. Use [c:drop <quantity> <item>] to drop multiple items. Use [c:drop <item> in <container>] to drop an item into a container.',
    execute: async function (params) {
        const {command, user, userManager, roomManager, itemManager, data} = params;

        // Role check to ensure only players with a role other than "visitor" can run this command
        if (user.role === 'visitor') {
            userManager.send(user.id, 'Visitors cannot use item tools, please use [c:user create] to create an account.');
            return;
        }

        if (!data) {
            userManager.send(user.id, `Usage: ${this.help}`);
            return;
        }

        // Parse the command input
        const parsedData = data.match(/"([^"]+)"|(\S+)/g) || [];
        let quantity = 1;
        let itemToDropName = parsedData[0];
        let containerName = parsedData.slice(1).join(" ").replace(/\s*(in|into|on|onto)\s*/g, '').trim();

        // Check if the first element is a quantity or "all"
        if (parsedData[0].toLowerCase() === "all") {
            quantity = "all";
            itemToDropName = parsedData[1];
            containerName = parsedData.slice(2).join(" ").replace(/\s*(in|into|on|onto)\s*/g, '').trim();
        } else if (parsedData[0].toLowerCase().includes(":all")) {
            quantity = "all";
            itemToDropName = parsedData[0].split(":")[0];
            containerName = parsedData.slice(1).join(" ").replace(/\s*(in|into|on|onto)\s*/g, '').trim();
        } else if (!isNaN(parsedData[0])) {
            quantity = parseInt(parsedData[0], 10);
            itemToDropName = parsedData[1];
            containerName = parsedData.slice(2).join(" ").replace(/\s*(in|into|on|onto)\s*/g, '').trim();
        }

        const itemToDropParts = itemToDropName.split(':');
        const itemName = itemToDropParts[0];
        const itemIndex = isNaN(itemToDropParts[1]) ? null : parseInt(itemToDropParts[1], 10) - 1;

        const userItems = itemManager.findItems({owner: user.id, name: itemName});
        if (userItems.length === 0) {
            userManager.send(user.id, `You do not have any "${itemName}" in your inventory.`);
            return false;
        } else if (quantity !== "all" && userItems.length < quantity && itemIndex === null) {
            userManager.send(user.id, `You do not have enough "${itemName}" in your inventory.`);
            return false;
        } else if (userItems.length > 1 && itemIndex === null && quantity === 1) {
            const itemList = userItems.map((item, index) => `"${item.name}:${index + 1}"`).join(", ");
            userManager.send(user.id, `More than one "${itemName}" found in your inventory. Please specify: ${itemList}`);
            return false;
        }

        let itemsToDrop = [];
        if (itemIndex !== null) {
            const itemToDrop = userItems[itemIndex];
            if (!itemToDrop) {
                userManager.send(user.id, `You do not have any "${itemToDropName}" in your inventory.`);
                return false;
            }
            itemsToDrop.push(itemToDrop);
        } else if (quantity === "all") {
            itemsToDrop = userItems;
        } else {
            itemsToDrop = userItems.slice(0, quantity);
        }

        let targetLocation = `${user.zoneId}:${user.roomId}`;
        if (containerName) {
            const containerParts = containerName.split(':');
            const baseContainerName = containerParts[0];
            const containerIndex = isNaN(containerParts[1]) ? null : parseInt(containerParts[1], 10) - 1;

            const roomContainers = itemManager.findItems({
                location: targetLocation,
                name: baseContainerName,
                container: true
            });
            const userContainers = itemManager.findItems({owner: user.id, name: baseContainerName, container: true});
            const containers = roomContainers.concat(userContainers);

            if (containers.length === 0) {
                userManager.send(user.id, `Container "${baseContainerName}" not found.`);
                return false;
            } else if (containers.length > 1 && containerIndex === null) {
                const containerList = containers.map((item, index) => `"${item.name}:${index + 1}"`).join(", ");
                userManager.send(user.id, `More than one "${baseContainerName}" found. Please specify: ${containerList}`);
                return false;
            }

            const container = containerIndex !== null ? containers[containerIndex] : containers[0];
            if (!container) {
                userManager.send(user.id, `Container "${containerName}" not found.`);
                return false;
            }
            if (!container.open) {
                userManager.send(user.id, `The "${container.name}" is not open.`);
                return false;
            }

            itemsToDrop.forEach(item => {
                item.location = container.id;
                item.owner = null;
                itemManager.saveItem(item);
            });

            userManager.send(userManager.getRoomUsers(user.zoneId, user.roomId).map((u) => u.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] places ${itemsToDrop.length} [i:${itemName}](s) into [i:${container.name}].`);
        } else {
            itemsToDrop.forEach(item => {
                item.location = targetLocation;
                item.owner = null;
                itemManager.saveItem(item);
            });

            userManager.send(userManager.getRoomUsers(user.zoneId, user.roomId).map((u) => u.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] drops ${itemsToDrop.length} [i:${itemName}](s).`);
        }

        return true;
    }
};
