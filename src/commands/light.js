/**
 * Command name: light
 * Description: Light, ignite, kindle, fire, spark, start, or burn items. Extinguish, douse, quench, or snuff items.
 * The command aliases correspond to different ways of lighting or extinguishing an item.
 *
 * "light": Light an item from the user's inventory or the room.
 * "ignite": Light an item from the user's inventory or the room.
 * "kindle": Light an item from the user's inventory or the room.
 * "fire": Light an item from the user's inventory or the room.
 * "spark": Light an item from the user's inventory or the room.
 * "start": Light an item from the user's inventory or the room.
 * "burn": Light an item from the user's inventory or the room.
 * "douse": Extinguish an item from the user's inventory or the room.
 * "quench": Extinguish an item from the user's inventory or the room.
 * "snuff": Extinguish an item from the user's inventory or the room.
 * "extinguish": Extinguish an item from the user's inventory or the room.
 *
 * Usage:
 * "light <item>": Light a single item from the user's inventory or the room.
 * "light <item>:all": Light all matching items from the user's inventory or the room.
 * "extinguish <item>": Extinguish a single item from the user's inventory or the room.
 * "extinguish <item>:all": Extinguish all matching items from the user's inventory or the room.
 *
 * Example:
 * "light torch" - Lights a torch from the user's inventory or the room.
 * "light torch:all" - Lights all torches from the user's inventory or the room.
 * "extinguish torch" - Extinguishes a torch from the user's inventory or the room.
 * "extinguish torch:all" - Extinguishes all torches from the user's inventory or the room.
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
    name: "light",
    description: "Light, ignite, kindle, fire, spark, start, or burn items. Extinguish, douse, quench, or snuff items.",
    aliases: ["ignite", "kindle", "fire", "spark", "start", "burn", "douse", "quench", "snuff", "extinguish"],
    help: 'Use [c:light <item>] to light an item. Use [c:extinguish <item>] to extinguish an item.',
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
        let baseItemName = parsedData[0].toLowerCase();
        let itemIndex = null;
        let lightAll = false;

        // Check if the item name includes an index or "all" (e.g., "torch:1" or "torch:all")
        if (baseItemName.includes(":")) {
            const parts = baseItemName.split(":");
            baseItemName = parts[0];
            if (parts[1].toLowerCase() === "all") {
                lightAll = true;
            } else {
                itemIndex = parseInt(parts[1], 10) - 1;
            }
        }

        const allowedTypes = ["lantern", "torch", "candle", "lamp", "bonfire", "campfire"];
        const isLighting = ["light", "ignite", "kindle", "fire", "spark", "start", "burn"].includes(command);

        // Fetch items from the user's inventory and the room
        const userItems = itemManager.findItems({owner: user.id}).filter(item => allowedTypes.includes(item.type));
        const roomItems = itemManager.findItems({location: `${user.zoneId}:${user.roomId}`}).filter(item => allowedTypes.includes(item.type));

        // Combine items from both sources
        const allItems = userItems.concat(roomItems);

        // Filter items by partial name match (case-insensitive)
        const filteredItems = allItems.filter(item =>
            item.name.toLowerCase().includes(baseItemName) ||
            baseItemName.split(' ').every(part => item.name.toLowerCase().includes(part))
        );

        // Debugging logs
        console.log('allItems', allItems);
        console.log('filteredItems', filteredItems);

        if (filteredItems.length === 0) {
            userManager.send(user.id, `You do not see any "${baseItemName}" here or in your inventory.`);
            return false;
        } else if (filteredItems.length > 1 && itemIndex === null && !lightAll) {
            const itemList = filteredItems.map((item, index) => `"${item.name}:${index + 1}"`).join(", ");
            userManager.send(user.id, `More than one "${baseItemName}" found. Please specify: ${itemList}`);
            return false;
        }

        // Handle lighting/extinguishing all matching items
        if (lightAll) {
            filteredItems.forEach(item => {
                item.lit = isLighting;
                itemManager.saveItem(item);
                const actionPast = isLighting ? 'lights' : 'extinguishes';
                userManager.send(
                    userManager.getRoomUsers(user.zoneId, user.roomId).map((u) => u.id),
                    `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${actionPast} [i:${item.name}].`
                );
            });
            const action = isLighting ? 'light' : 'extinguish';
            userManager.send(user.id, `You ${action} all matching items.`);
            return true;
        }

        // Select the target item
        const targetItem = itemIndex !== null ? filteredItems[itemIndex] : filteredItems[0];

        if (!targetItem) {
            userManager.send(user.id, `You do not see any "${baseItemName}:${itemIndex + 1}" here or in your inventory.`);
            return false;
        }

        if (isLighting && targetItem.lit) {
            userManager.send(user.id, `The "${targetItem.name}" is already lit.`);
            return false;
        }

        if (!isLighting && !targetItem.lit) {
            userManager.send(user.id, `The "${targetItem.name}" is already extinguished.`);
            return false;
        }

        // Update the item's lit state
        targetItem.lit = isLighting;
        itemManager.saveItem(targetItem);

        const action = isLighting ? 'light' : 'extinguish';
        const actionPast = isLighting ? 'lights' : 'extinguishes';
        userManager.send(user.id, `You ${action} the ${targetItem.name}.`);
        userManager.send(
            userManager.getRoomUsers(user.zoneId, user.roomId).map((u) => u.id),
            `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${actionPast} [i:${targetItem.name}].`
        );

        return true;
    }
};
