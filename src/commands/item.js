/**
 * Command name: item
 * Description: This command allows you to create and modify items.
 *
 * Usage:
 * "item create <item name> [quantity]": Creates a new item with the specified name and optional quantity.
 * "item edit <item name> <property> <value>": Edits a property of the specified item.
 * "item delete <item name>": Deletes the specified item.
 *
 * Examples:
 * "item create \"brass hand lantern\""
 * "item create \"brass hand lantern\" 5"
 * "item edit \"brass hand lantern\" description \"A sturdy brass lantern providing ample light.\""
 * "item delete \"brass hand lantern\""
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 * The structure of the `params` object is:
 * - `command`: The command or alias used to trigger the function.
 * - `user`: The user object identifying who is interacting.
 * - `userManager`: Manager to handle user related requirements.
 * - `roomManager`: Manager to handle room related queries.
 * - `itemManager`: Manager to handle item related queries.
 * - `data`: The additional data provided with the command.
 */

const _ = require("lodash");

module.exports = {
    name: "item",
    description: "This command allows you to create and modify items.",
    help: 'Use [c:item create "<item name>" [quantity]] to create an item. Use [c:item edit "<item name>" <property> "<value>"] to edit an item. Use [c:item delete "<item name>"] to delete an item.',
    aliases: ["arrange", "assemble", "blend", "brew", "build", "carve", "cast", "chisel", "compose", "concoct", "construct", "craft", "create", "cut", "draft", "engender", "engineer", "engrave", "establish", "etch", "fabricate", "fashion", "fix", "forge", "form", "formulate", "frame", "generate", "hew", "imprint", "incise", "initiate", "inscribe", "institute", "invent", "knit", "make", "manufacture", "mark", "mill", "mint", "model", "mold", "notch", "orchestrate", "originate", "plant", "prepare", "press", "produce", "sew", "sculpt", "shape", "spawn", "stamp", "stitch", "structure", "synthesize", "tailor", "trace", "weave", "weld"],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let itemManager = params.itemManager;
        let data = params.data;
        let {logInfo, logWarn, logError} = params.log;

        // Role check to ensure only players with a role other than "visitor" can run this command
        if (user.role === 'visitor') {
            userManager.send(user.id, 'Visitors cannot use item tools, please use [c:user create] to create an account.');
            return;
        }

        if (!data) {
            userManager.send(user.id, `Usage: ${this.help}`);
            return;
        }

        const args = data.match(/(?:[^\s"]+|"[^"]*")+/g).map(arg => arg.replace(/"/g, ''));
        const action = args[0];
        const roomPeople = userManager.getRoomUsers(user.zoneId, user.roomId).filter((currentRoomUser) => currentRoomUser.id !== user.id) || [];

        const verbTenseMap = {
            arrange: "arranges",
            assemble: "assembles",
            blend: "blends",
            brew: "brews",
            build: "builds",
            carve: "carves",
            cast: "casts",
            chisel: "chisels",
            compose: "composes",
            concoct: "concocts",
            construct: "constructs",
            craft: "crafts",
            create: "creates",
            cut: "cuts",
            draft: "drafts",
            engender: "engenders",
            engineer: "engineers",
            engrave: "engraves",
            establish: "establishes",
            etch: "etches",
            fabricate: "fabricates",
            fashion: "fashions",
            fix: "fixes",
            forge: "forges",
            form: "forms",
            formulate: "formulates",
            frame: "frames",
            generate: "generates",
            hew: "hews",
            imprint: "imprints",
            incise: "incises",
            initiate: "initiates",
            inscribe: "inscribes",
            institute: "institutes",
            invent: "invents",
            knit: "knits",
            make: "makes",
            manufacture: "manufactures",
            mark: "marks",
            mill: "mills",
            mint: "mints",
            model: "models",
            mold: "molds",
            notch: "notches",
            orchestrate: "orchestrates",
            originate: "originates",
            plant: "plants",
            prepare: "prepares",
            press: "presses",
            produce: "produces",
            sew: "sews",
            sculpt: "sculpts",
            shape: "shapes",
            spawn: "spawns",
            stamp: "stamps",
            stitch: "stitches",
            structure: "structures",
            synthesize: "synthesizes",
            tailor: "tailors",
            trace: "traces",
            weave: "weaves",
            weld: "welds",
        };

        let verb = verbTenseMap[command] || "creates";

        switch (action) {
            case 'create':
            case 'new':
                if (!args[1]) {
                    userManager.send(user.id, 'Please specify the name of the item to create using quotes. Example: [c:item create "brass hand lantern"].');
                    return;
                }

                // Ensure item name is enclosed in quotes
                const createNameMatch = data.match(/"([^"]+)"/);
                if (!createNameMatch) {
                    userManager.send(user.id, 'Please specify the name of the item to create using quotes. Example: [c:item create "brass hand lantern"]');
                    return;
                }
                const createItemName = createNameMatch[1];

                // Handle optional quantity
                let quantity = 1;
                if (args.length > 2 && !isNaN(args[2])) {
                    quantity = parseInt(args[2], 10);
                }

                // Create the items using itemManager
                for (let i = 0; i < quantity; i++) {
                    itemManager.createItem({name: createItemName, creator: user.id, owner: user.id});
                }
                const itemQuantityMessage = quantity > 1 ? `${quantity} items` : '1 item';
                userManager.send(user.id, `Successfully created ${itemQuantityMessage} named "${createItemName}".`);
                const itemQuantityRoomMessage = quantity > 1 ? `${quantity} new` : 'a new';
                userManager.send(roomPeople.map((person) => person.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verb} ${itemQuantityRoomMessage} [i:${createItemName}].`);

                // Log the item creation
                logInfo(`User ${user.id} (${user.morphedName || user.firstName + " " + user.lastName}) created ${itemQuantityMessage} named "${createItemName}".`);
                break;

            case 'edit':
            case 'modify':
            case 'change':
            case 'alter':
                if (!args[1] || !args[2] || args.length < 4) {
                    userManager.send(user.id, 'Please specify the item name, property, and value to edit.');
                    return;
                }

                const fullArgs = data.match(/(?:[^\s"]+|"[^"]*")+/g);
                const editItemNameMatch = fullArgs[1].match(/"([^"]+)"/);
                const editItemName = editItemNameMatch ? editItemNameMatch[1] : fullArgs[1];
                const property = fullArgs[2];
                const value = fullArgs.slice(3).join(" ").replace(/"/g, '');

                if (!editItemName || !property || !value) {
                    userManager.send(user.id, 'Please specify the item name, property, and value to edit.');
                    return;
                }

                // Check if the item name includes a selection index
                const selectedItemMatch = editItemName.match(/(.*):(all|\d+)$/);
                if (selectedItemMatch) {
                    const selectedItemName = selectedItemMatch[1];
                    const selectedIndex = selectedItemMatch[2];

                    // Find items by name and owner
                    const itemsToEdit = itemManager.findItems({name: selectedItemName, owner: user.id});
                    if (itemsToEdit.length === 0) {
                        userManager.send(user.id, `Selected item "${editItemName}" not found in your inventory.`);
                        return;
                    }

                    if (selectedIndex === 'all') {
                        itemsToEdit.forEach(item => {
                            itemManager.updateItem(item.id, {[property]: value});
                        });
                        userManager.send(user.id, `Successfully updated ${itemsToEdit.length} items named "${selectedItemName}".`);
                        userManager.send(roomPeople.map((person) => person.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verb} on ${itemsToEdit.length} [i:${selectedItemName}] items.`);
                        // Log the item update
                        logInfo(`User ${user.id} (${user.morphedName || user.firstName + " " + user.lastName}) updated ${itemsToEdit.length} items named "${selectedItemName}".`);
                    } else {
                        const selectedItem = itemsToEdit[parseInt(selectedIndex, 10) - 1];
                        if (!selectedItem) {
                            userManager.send(user.id, `Selected item "${editItemName}" not found in your inventory.`);
                            return;
                        }
                        itemManager.updateItem(selectedItem.id, {[property]: value});
                        userManager.send(user.id, `Item "${selectedItem.name}" updated successfully.`);
                        userManager.send(roomPeople.map((person) => person.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verb} on [i:${selectedItem.name}].`);
                        // Log the item update
                        logInfo(`User ${user.id} (${user.morphedName || user.firstName + " " + user.lastName}) updated item "${selectedItem.name}" (ID: ${selectedItem.id}) with property "${property}" set to "${value}".`);
                    }
                    return;
                }

                // Find items by name and owner
                const itemsToEdit = itemManager.findItems({name: editItemName, owner: user.id});
                if (itemsToEdit.length === 0) {
                    userManager.send(user.id, `Item "${editItemName}" not found in your inventory.`);
                    return;
                } else if (itemsToEdit.length > 1) {
                    // If more than one item found, list them and ask user to select
                    const itemList = itemsToEdit.map((item, index) => `"${item.name}:${index + 1}"`).join(", ");
                    userManager.send(user.id, `More than one "${editItemName}" found. Please include selection:\n${itemList}`);
                    return;
                }

                const itemToEdit = itemsToEdit[0]; // Only one item found
                itemManager.updateItem(itemToEdit.id, {[property]: value});
                userManager.send(user.id, `Item "${itemToEdit.name}" updated successfully.`);
                userManager.send(roomPeople.map((person) => person.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verb} on [i:${itemToEdit.name}].`);
                // Log the item update
                logInfo(`User ${user.id} (${user.morphedName || user.firstName + " " + user.lastName}) updated item "${itemToEdit.name}" (ID: ${itemToEdit.id}) with property "${property}" set to "${value}".`);
                break;

            case 'delete':
                verb = "destroys";  // Set verb to "destroys" for delete action
                if (!args[1]) {
                    userManager.send(user.id, 'Please specify the name of the item to delete.');
                    return;
                }

                const deleteItemNameMatch = args[1].match(/"([^"]+)"/);
                const deleteItemName = deleteItemNameMatch ? deleteItemNameMatch[1] : args[1];

                // Check if the item name includes a selection index
                const deleteSelectedItemMatch = deleteItemName.match(/(.*):(all|\d+)$/);
                if (deleteSelectedItemMatch) {
                    const selectedItemName = deleteSelectedItemMatch[1];
                    const selectedIndex = deleteSelectedItemMatch[2];

                    // Find items by name and owner
                    const itemsToDelete = itemManager.findItems({name: selectedItemName, owner: user.id});
                    if (itemsToDelete.length === 0) {
                        userManager.send(user.id, `Selected item "${deleteItemName}" not found in your inventory.`);
                        return;
                    }

                    if (selectedIndex === 'all') {
                        itemsToDelete.forEach(item => {
                            itemManager.deleteItem(item.id);
                        });
                        userManager.send(user.id, `Successfully deleted ${itemsToDelete.length} items named "${selectedItemName}".`);
                        userManager.send(roomPeople.map((person) => person.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verb} ${itemsToDelete.length} [i:${selectedItemName}] items.`);
                        // Log the item deletion
                        logInfo(`User ${user.id} (${user.morphedName || user.firstName + " " + user.lastName}) deleted ${itemsToDelete.length} items named "${selectedItemName}".`);
                    } else {
                        const selectedItem = itemsToDelete[parseInt(selectedIndex, 10) - 1];
                        if (!selectedItem) {
                            userManager.send(user.id, `Selected item "${deleteItemName}" not found in your inventory.`);
                            return;
                        }
                        itemManager.deleteItem(selectedItem.id);
                        userManager.send(user.id, `Item "${selectedItem.name}" deleted successfully.`);
                        userManager.send(roomPeople.map((person) => person.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verb} [i:${selectedItem.name}].`);
                        // Log the item deletion
                        logInfo(`User ${user.id} (${user.morphedName || user.firstName + " " + user.lastName}) deleted item "${selectedItem.name}" (ID: ${selectedItem.id}).`);
                    }
                    return;
                }

                // Find items by name and owner
                const itemsToDelete = itemManager.findItems({name: deleteItemName, owner: user.id});
                if (itemsToDelete.length === 0) {
                    userManager.send(user.id, `Item "${deleteItemName}" not found in your inventory.`);
                    return;
                } else if (itemsToDelete.length > 1) {
                    // If more than one item found, list them and ask user to select
                    const deleteItemList = itemsToDelete.map((item, index) => `"${item.name}:${index + 1}"`).join(", ");
                    userManager.send(user.id, `More than one "${deleteItemName}" found. Please include selection:\n${deleteItemList}`);
                    return;
                }

                const itemToDelete = itemsToDelete[0]; // Only one item found
                itemManager.deleteItem(itemToDelete.id);
                userManager.send(user.id, `Item "${itemToDelete.name}" deleted successfully.`);
                userManager.send(roomPeople.map((person) => person.id), `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verb} [i:${itemToDelete.name}].`);
                // Log the item deletion
                logInfo(`User ${user.id} (${user.morphedName || user.firstName + " " + user.lastName}) deleted item "${itemToDelete.name}" (ID: ${itemToDelete.id}).`);
                break;
        }
    }
};
