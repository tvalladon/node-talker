/**
 * The ItemManager class is responsible for creating, managing, and retrieving
 * items within the application. It uses a Map to store items and provides
 * utility methods to load and check item existence.
 *
 * @module ItemManager
 */
const fs = require("fs");
const path = require("path");
const Item = require("../models/item");
const Base = require("./base");

const allowedTypes = [
    "bauble", "head", "clothing", "armor", "bag", "pants", "weapon", "tool", "shield", "footwear", "gloves", "accessory", "jewelry", "consumable", "potion", "scroll", "food", "drink", "furniture", "key", "book", "map", "material", "resource", "component", "spell", "ingredient", "artifact", "relic", "gadget", "toy", "instrument", "decoration", "currency", "gem", "orb", "amulet", "ring", "cloak", "belt", "helmet", "boots", "gauntlets", "lantern", "torch", "rod", "staff", "wand", "bag", "satchel", "backpack", "trap", "lockpick", "ammunition", "bomb", "device", "machine", "equipment", "siege", "banner", "emblem", "token", "charm", "talisman", "totem", "idol", "statue", "trophy", "fossil", "specimen", "collectible", "memorabilia", "souvenir", "keepsake", "heirloom", "ritual", "sacrifice", "offering", "vessel", "utility", "miscellaneous"
];

class ItemManager extends Base {
    constructor(params) {
        super(); // Call the constructor of the base class

        this.items = new Map();
        this.itemPath = params.itemPath;
    }

    /**
     * Formats item ID to have leading zeros and formulates the item filename.
     *
     * @param {string} itemId - Item ID.
     * @returns {string} - Formatted item filename.
     */
    getItemFilename(itemId) {
        return `${itemId}.json`;
    }

    /**
     * Loads an item specified by item ID.
     * Checks if item is already loaded and if not, reads the item data from file system.
     *
     * @param {string} itemId - Item ID.
     * @returns {Item|boolean} - An instance of Item or false if error occurs or item doesn't exist.
     */
    loadItem(itemId) {
        try {
            // Check if the item is already loaded
            if (this.items.has(itemId)) {
                return this.items.get(itemId);
            }

            const filename = this.getItemFilename(itemId);
            const filePath = path.join(this.itemPath, filename);

            // Check if the item file exists
            if (!fs.existsSync(filePath)) {
                return false;
            }

            // Delete the previous cache before requiring the file.
            delete require.cache[require.resolve(filePath)];

            const itemData = require(filePath);
            const item = new Item();
            Object.assign(item, itemData);

            // Add the loaded item to the map
            this.items.set(itemId, item);

            return item;
        } catch (error) {
            this.logInfo(`Error loading item ${itemId}: ${error.message}`);
            return false;
        }
    }

    /**
     * Saves an item to the file system.
     *
     * @param {Item} item - The item to save.
     */
    saveItem(item) {
        const filename = this.getItemFilename(item.id);
        const filePath = path.join(this.itemPath, filename);
        fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
    }

    /**
     * Creates a new item and adds it to the items map.
     *
     * @param {Object} itemData - Data to initialize the item with.
     * @returns {Item} The created item.
     */
    createItem(itemData) {
        const item = new Item();
        Object.assign(item, itemData);
        this.items.set(item.id, item);
        this.saveItem(item);
        return item;
    }

    /**
     * Removes an item from the items map and deletes its file.
     *
     * @param {string} itemId - The ID of the item to remove.
     * @returns {boolean} Whether the item was successfully removed.
     */
    deleteItem(itemId) {
        if (this.items.has(itemId)) {
            const filename = this.getItemFilename(itemId);
            const filePath = path.join(this.itemPath, filename);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            this.items.delete(itemId);
            return true;
        }
        return false;
    }

    /**
     * Gets an item by its ID.
     *
     * @param {string} itemId - The ID of the item to retrieve.
     * @returns {Item|undefined} The item if found, otherwise undefined.
     */
    getItem(itemId) {
        return this.items.get(itemId);
    }

    /**
     * Updates an item with new data.
     *
     * @param {string} itemId - The ID of the item to update.
     * @param {Object} newData - The new data to update the item with.
     * @returns {Item|boolean} The updated item if successful, otherwise false.
     */
    updateItem(itemId, newData) {
        if (newData.type && !allowedTypes.includes(newData.type)) {
            throw new Error(`Invalid item type. Allowed types are: ${allowedTypes.join(", ")}`);
        }

        // Load the item if it is not already loaded
        if (!this.items.has(itemId)) {
            const item = this.loadItem(itemId);
            if (!item) {
                throw new Error(`Item with ID ${itemId} not found.`);
            }
        }

        const item = this.items.get(itemId);
        Object.assign(item, newData);

        // Ensure only one of owner, location, or container is set
        if (item.owner && item.location) {
            throw new Error("An item cannot have both an owner and a location.");
        }

        this.saveItem(item);
        return item;
    }

    /**
     * Checks if an item can be owned or located and updates accordingly.
     *
     * @param {Item} item - The item to check.
     * @param {string} ownerId - The owner ID to set.
     * @param {string} location - The location to set.
     */
    setItemOwnershipOrLocation(item, ownerId, location) {
        if (ownerId) {
            item.owner = ownerId;
            item.location = null;
        } else if (location) {
            item.location = location;
            item.owner = null;
        }
        this.saveItem(item);
    }

    /**
     * Finds items based on a specified criteria.
     *
     * @param {Object} criteria - The criteria to search items by.
     * @returns {Array} The items that match the criteria.
     */
    findItems(criteria) {
        const tempItems = new Map();

        // Load all item files into temp storage
        const itemFiles = fs.readdirSync(this.itemPath);
        itemFiles.forEach(file => {
            const itemId = path.basename(file, '.json');
            if (!this.items.has(itemId)) {
                const item = this.loadItem(itemId);
                if (item) {
                    tempItems.set(itemId, item);
                }
            }
        });

        // Combine tempItems and this.items for searching
        const allItems = new Map([...this.items, ...tempItems]);
        const itemsArray = Array.from(allItems.values());

        // Search through items based on criteria
        const matchingItems = itemsArray.filter(item => {
            return Object.keys(criteria).every(key => {
                if (key === 'name' || key === 'description') {
                    return item[key].toLowerCase().includes(criteria[key].toLowerCase());
                }
                return item[key] === criteria[key];
            });
        });

        return matchingItems;
    }
}

module.exports = ItemManager;
