/**
 * Command name: inventory
 * Description: List the items in your inventory.
 * The command aliases correspond to different ways of viewing the inventory.
 *
 * "inventory": View the user's inventory.
 * "i": View the user's inventory.
 * "inv": View the user's inventory.
 *
 * Usage:
 * "inventory": Lists all items in the user's inventory.
 *
 * Example:
 * "inventory" - Lists all items the user is currently carrying.
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 * The structure of the `params` object is:
 * - `command`: The command or alias used to trigger the function.
 * - `user`: The user object identifying who is interacting.
 * - `userManager`: Manager to handle user-related requirements.
 * - `itemManager`: Manager to handle item-related queries.
 */

const _ = require("lodash");

module.exports = {
    name: "inventory",
    description: "List the items in your inventory.",
    aliases: ["i", "inv"],
    help: 'Use [c:inventory] to see a list of items you are currently carrying.',
    execute: async (params) => {
        const {user, userManager, itemManager} = params;

        // Fetch items from the user's inventory
        const inventoryItems = itemManager.findItems({owner: user.id});

        if (inventoryItems.length === 0) {
            userManager.send(user.id, "Your inventory is empty.");
            return true;
        }

        // Build the inventory list
        let inventoryList = "You are carrying: ";
        inventoryItems
            .sort((a, b) => a.name.localeCompare(b.name))  // Alphabetize the inventory
            .forEach(item => {
                inventoryList += `[i:${item.name}] `;
            });

        userManager.send(user.id, inventoryList.trim());
        return true;
    }
};
