/**
 * Command name: take
 * Description: Take, collect, extract, fetch, get, grab, remove, retrieve, or withdraw items.
 * The command aliases correspond to different ways of taking an item.
 *
 * "take": Take an item from the room or a container.
 * "collect": Take an item from the room or a container.
 * "extract": Take an item from the room or a container.
 * "fetch": Take an item from the room or a container.
 * "get": Take an item from the room or a container.
 * "grab": Take an item from the room or a container.
 * "remove": Take an item from the room or a container.
 * "retrieve": Take an item from the room or a container.
 * "withdraw": Take an item from the room or a container.
 *
 * Usage:
 * "take <item>": Take a single item from the room.
 * "take <quantity> <item>": Take multiple items from the room.
 * "take <item> from <container>": Take an item from a container in the room or the user's inventory.
 *
 * Example:
 * "take sword" - Takes a sword from the room.
 * "take 5 coins" - Takes 5 coins from the room.
 * "take sword from chest" - Takes a sword from a chest in the room or the user's inventory.
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
    name: "take",
    description: "Take, collect, extract, fetch, get, grab, remove, retrieve, or withdraw items.",
    aliases: ["collect", "extract", "fetch", "get", "grab", "remove", "retrieve", "withdraw"],
    help: 'Use [c:take <item>] to take an item. Use [c:take <quantity> <item>] to take multiple items. Use [c:take <item> from <container>] to take an item from a container.',
    execute: async (params) => {
        const {command, user, userManager, roomManager, itemManager, data} = params;

        if (!data) {
            userManager.send(user.id, "Please specify an item to take.");
            return false;
        }

        // Parse the command input
        const parsedData = data.match(/"([^"]+)"|(\S+)/g) || [];
        let quantity = 1;
        let itemName = parsedData[0];
        let containerName = parsedData.slice(1).join(" ").replace(/\s*(from|in|into|on|onto)\s*/g, '').trim();

        // Check if the first element is a quantity or "all"
        if (parsedData[0].toLowerCase() === "all") {
            quantity = "all";
            itemName = parsedData[1];
            containerName = parsedData.slice(2).join(" ").replace(/\s*(from|in|into|on|onto)\s*/g, '').trim();
        } else if (parsedData[0].toLowerCase().includes(":all")) {
            quantity = "all";
            itemName = parsedData[0].split(":")[0];
            containerName = parsedData.slice(1).join(" ").replace(/\s*(from|in|into|on|onto)\s*/g, '').trim();
        } else if (!isNaN(parsedData[0])) {
            quantity = parseInt(parsedData[0], 10);
            itemName = parsedData[1];
            containerName = parsedData.slice(2).join(" ").replace(/\s*(from|in|into|on|onto)\s*/g, '').trim();
        }

        const itemParts = itemName.split(':');
        const baseItemName = itemParts[0];
        const itemIndex = isNaN(itemParts[1]) ? null : parseInt(itemParts[1], 10) - 1;

        let roomItems = itemManager.findItems({location: `${user.zoneId}:${user.roomId}`, name: baseItemName});
        let containerItems = [];

        if (containerName) {
            const roomContainers = itemManager.findItems({
                location: `${user.zoneId}:${user.roomId}`,
                name: containerName,
                container: true
            });
            const userContainers = itemManager.findItems({owner: user.id, name: containerName, container: true});
            const containers = roomContainers.concat(userContainers);

            if (containers.length === 0) {
                userManager.send(user.id, `Container "${containerName}" not found.`);
                return false;
            } else if (containers.length > 1) {
                const containerList = containers.map((container, index) => `"${container.name}:${index + 1}"`).join(", ");
                userManager.send(user.id, `More than one "${containerName}" found. Please specify: ${containerList}`);
                return false;
            }

            const container = containers[0];
            if (!container.open) {
                userManager.send(user.id, `The "${container.name}" is closed.`);
                return false;
            }

            containerItems = itemManager.findItems({location: container.id, name: baseItemName});
        }

        const allItems = containerName ? containerItems : roomItems;

        if (allItems.length === 0) {
            userManager.send(user.id, `No "${baseItemName}" found ${containerName ? 'in the container' : 'in the room'}.`);
            return false;
        } else if (quantity !== "all" && allItems.length < quantity && itemIndex === null) {
            userManager.send(user.id, `Not enough "${baseItemName}" found ${containerName ? 'in the container' : 'in the room'}.`);
            return false;
        } else if (allItems.length > 1 && itemIndex === null && quantity === 1) {
            const itemList = allItems.map((item, index) => `"${item.name}:${index + 1}"`).join(", ");
            userManager.send(user.id, `More than one "${baseItemName}" found ${containerName ? 'in the container' : 'in the room'}. Please specify: ${itemList}`);
            return false;
        }

        let itemsToTake = [];
        if (itemIndex !== null) {
            const itemToTake = allItems[itemIndex];
            if (!itemToTake) {
                userManager.send(user.id, `No "${itemName}" found ${containerName ? 'in the container' : 'in the room'}.`);
                return false;
            }
            itemsToTake.push(itemToTake);
        } else if (quantity === "all") {
            itemsToTake = allItems;
        } else {
            itemsToTake = allItems.slice(0, quantity);
        }

        itemsToTake.forEach(item => {
            item.owner = user.id;
            item.location = null;
            itemManager.saveItem(item);
        });

        userManager.send(user.id, `You take ${itemsToTake.length} ${baseItemName}(s).`);
        userManager.send(
            userManager.getRoomUsers(user.zoneId, user.roomId).map((u) => u.id),
            `[p:${user.morphedName || user.firstName + " " + user.lastName}] takes ${itemsToTake.length} [i:${baseItemName}](s).`
        );

        return true;
    }
};
