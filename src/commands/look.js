/**
 * Command name: look
 * Description: Allows the user to look around in the current room or at specific entities.
 * The command aliases correspond to different ways of observing:
 *
 * "look": Observe the current room.
 * "look self": Observe oneself.
 * "look <direction>": Observe in a specific cardinal direction.
 * "look <object>": Observe a specific item or character in the room.
 *
 * Where direction can be one of the following: 'north', 'south', 'east', 'west', 'up', 'down',
 'northeast', 'northwest', 'southeast', 'southwest'
 * And, <object> can be a specific character or item within the room or oneself.
 *
 * Usage:
 * "look": User observes the current room, including present entities and exits.
 * "look north": User observes what is to the north.
 * "look self": User observes themselves.
 * "look <object>": User observes a specific prop, item or character.
 *
 * Single character or abbreviated directions are also available for convenience:
 * "n" for "north"
 * "se" for "southeast"
 * "nw" for "northwest"
 *
 * E.g:
 * "look" - User looks around in the current room.
 * "look self" - User checks themselves.
 * "look n" - User checks what's in the north.
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 * The structure of the `params` object is:
 * - `command`: The command or alias used to trigger the function.
 * - `user`: The user object idenfying who is interacting.
 * - `userManager`: Manager to handle user related requirements.
 * - `roomManager`: Manager to handle room related queries.
 * - `data`: The additional data provided with the command.
 */

const _ = require("lodash");

module.exports = {
    name: "look",
    description: 'Allows the user to look around in the current room or at specific entities.',
    help: "Use this command to observe your surroundings. You can look in a direction with [c:look <direction>], at yourself with [c:look self], at others with [c:look <player name>], at room props with [c:look <prop name>], at specific items or characters.",
    aliases: ["l", "read", "examine", "inspect", "view", "check", "study", "observe", "scrutinize", "survey", "glance", "explore", "focus", "glimpse", "stare", "peek", "analyze", "notice", "identify"],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let itemManager = params.itemManager;
        let data = params.data;
        let {logInfo, logWarn, logError} = params.log;

        const patterns = [/^at /, /^in /, /^inside /, /^around /, /^over /, /^under /, /^through /, /^the /];

        if (command === "l") command = "look";

        patterns.forEach((pattern) => {
            data = _.replace(data, pattern, "");
        });

        // Fetch room data
        const zoneId = user.zoneId;
        const roomId = user.roomId;
        let currentRoom = roomManager.loadRoom(zoneId, roomId);

        // Action lookup arrays
        const actionLookup = {
            room: {
                look: "looks at the",
                read: "reads the",
                examine: "examines the",
                inspect: "inspects the",
                view: "views the",
                check: "checks the",
                study: "studies the",
                observe: "observes the",
                scrutinize: "scrutinizes the",
                survey: "surveys the",
                glance: "glances at",
                explore: "explores the",
                focus: "focuses on the",
                glimpse: "glimpses the",
                stare: "stares at",
                peek: "peeks at the",
                analyze: "analyzes the",
                notice: "notices the",
                identify: "identifies the",
            },
            self: {
                look: "looks at",
                read: "reads",
                examine: "examines",
                inspect: "inspects",
                view: "views",
                check: "checks",
                study: "studies",
                observe: "observes",
                scrutinize: "scrutinizes",
                survey: "surveys",
                glance: "glances at",
                explore: "explores",
                focus: "focuses on",
                glimpse: "glimpses",
                stare: "stares at",
                peek: "peeks at",
                analyze: "analyzes",
                notice: "notices",
                identify: "identifies",
            },
            direction: {
                look: "looks to the",
                read: "reads the wind from the",
                examine: "examines to the",
                inspect: "inspects the exit",
                view: "views",
                check: "checks",
                study: "studies",
                observe: "observes",
                scrutinize: "scrutinizes",
                survey: "surveys",
                glance: "glances",
                explore: "explores",
                focus: "focuses",
                glimpse: "glimpses",
                stare: "stares",
                peek: "peeks",
                analyze: "analyzes",
                notice: "notices",
                identify: "identifies",
            },
            prop: {
                look: "looks at the",
                read: "reads the",
                examine: "examines the",
                inspect: "inspects the",
                view: "views the",
                check: "checks the",
                study: "studies the",
                observe: "observes the",
                scrutinize: "scrutinizes the",
                survey: "surveys the",
                glance: "glances at the",
                explore: "explores the",
                focus: "focuses on the",
                glimpse: "glimpses the",
                stare: "stares at the",
                peek: "peeks at the",
                analyze: "analyzes the",
                notice: "notices the",
                identify: "identifies the",
            },
            player: {
                look: "looks over at",
                read: "tried to read",
                examine: "examines",
                inspect: "inspects",
                view: "views",
                check: "checks over",
                study: "studies",
                observe: "observes",
                scrutinize: "scrutinizes",
                survey: "surveys",
                glance: "glances at",
                explore: "tries to explore",
                focus: "focuses on",
                glimpse: "glimpses",
                stare: "stares at",
                peek: "peeks at",
                analyze: "analyzes",
                notice: "notices",
                identify: "identifies",
            },
        };

        const directions = ["north", "south", "east", "west", "up", "down", "northeast", "northwest", "southeast", "southwest", "n", "s", "e", "w", "u", "d", "ne", "nw", "se", "sw"];
        const roomProps = currentRoom.props;
        const roomPeople = userManager.getActiveUsers().filter((activeUser) => activeUser.zoneId === zoneId && activeUser.roomId === roomId && activeUser.id !== user.id) || [];
        const roomItems = currentRoom.items || [];
        const roomNPCs = currentRoom.npc || [];

        // Mapping from short to long form directions
        const directionMap = {
            n: "north",
            s: "south",
            e: "east",
            w: "west",
            u: "up",
            d: "down",
            ne: "northeast",
            nw: "northwest",
            se: "southeast",
            sw: "southwest",
        };

        const lookAtRoom = () => {
            if (!currentRoom) {
                userManager.send(user.id, "You're in an undefined space. Please use [c:rescue].");
                return true;
            }

            const roomName = currentRoom.name;
            const props = roomProps;
            const unparsedDescription = currentRoom.description;
            const roomDescription = parseProps(unparsedDescription, props);
            const roomExits = currentRoom.exits || {};

            const peopleInRoomNames = roomPeople.map((person) => `[p:${person.morphedName || person.firstName + " " + person.lastName}]`) || [];

            let fullRoomDescription = `<yellow>{ <cyan>${roomName}<reset> <yellow>}<reset>${user.role === "administrator" ? ' [' + currentRoom.zoneId + ':' + currentRoom.roomId + ']' : ''}`;
            fullRoomDescription += `\n${roomDescription}`;
            fullRoomDescription += `\nExits: ${Object.keys(roomExits).map((exit) => `[e:${exit}]`).join(" ")}`;
            fullRoomDescription += `\nPeople: <red>${peopleInRoomNames.length > 0 ? peopleInRoomNames.join(", ") : "none"}<reset>`;

            // Add items in the room to the description
            const roomItems = itemManager.findItems({location: `${user.zoneId}:${user.roomId}`});
            if (roomItems.length > 0) {
                fullRoomDescription += "\nItems: <green>";
                roomItems.forEach(item => {
                    fullRoomDescription += `[i:${item.name}] `;
                });
                fullRoomDescription += "<reset>";
            }

            userManager.send(user.id, fullRoomDescription);

            if (params.context !== "emit") {
                userManager.send(
                    roomPeople.map((person) => person.id),
                    `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${actionLookup["room"][command]} room.`
                );
            }
            return true;
        };

        // display the user's own details
        const lookAtSelf = () => {
            let output = `You look at yourself and see:\r\n`;

            if (user.morphedName) {
                output += `<ht>Name: <green>${user.morphedName}<reset>\r\n`;
                output += `<ht>Description: <green>${user.morphedDescription}<reset>\r\n`;
            } else {
                output += `<ht>Title: <green>${user.title}<reset>\r\n`;
                output += `<ht>First Name: <green>${user.firstName}<reset>\r\n`;
                output += `<ht>Last Name: <green>${user.lastName}<reset>\r\n`;
                output += `<ht>Clothing: <green>${user.clothing}<reset>\r\n`;
                output += `<ht>Holding: <green>${user.holding}<reset>\r\n`;
                output += `<ht>Wielding: <green>${user.wielding}<reset>\r\n`;
                output += `<ht>Description: <green>${user.description}<reset>\r\n`;
            }

            userManager.send(user.id, output);

            userManager.send(
                roomPeople.map((person) => person.id),
                `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${actionLookup["self"][command]} themselves.`
            );
            return true;
        };


        const lookInDirection = (direction) => {
            let roomExits = currentRoom.exits;
            if (!roomExits || !roomExits[direction]) {
                userManager.send(user.id, `There is no exit ${direction}.`);
                return;
            }

            let [nextZoneId, nextRoomId] = roomExits[direction].split(":");

            let nextRoom = roomManager.loadRoom(nextZoneId, nextRoomId);

            if (!nextRoom) {
                userManager.send(user.id, `Something clouds your vision ${direction}.`);
                return;
            }

            let nextRoomName = nextRoom.name;
            let nextRoomExits = nextRoom.exits || {};
            let nextRoomPeople = userManager.getActiveUsers().filter((activeUser) => activeUser.zoneId === nextZoneId && activeUser.roomId === nextRoomId) || [];

            let exitMessage = Object.keys(nextRoomExits).length ? ` with ${Object.keys(nextRoomExits).length} exits` : "";
            let peopleMessage = nextRoomPeople.length ? ` ${nextRoomPeople.length} people` : "";

            userManager.send(user.id, `${_.capitalize(direction)} you see <cyan>${nextRoomName}<reset>${exitMessage}${peopleMessage}.`);
            userManager.send(
                roomPeople.map((person) => person.id),
                `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${actionLookup["direction"][command]} ${_.capitalize(direction)}.`
            );
        };

        // Function to look at a prop based on its name
        const lookAtProp = (propName) => {
            const propDescription = currentRoom.props[propName];

            if (!propDescription) {
                userManager.send(user.id, `There is no ${propName} here.`);
            }

            userManager.send(user.id, `${propDescription}`);
            userManager.send(
                roomPeople.map((person) => person.id),
                `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${actionLookup["prop"][command]} ${_.capitalize(propName)}.`
            );
        };

        const lookAtPerson = (name) => {
            // Split the input into potential name parts
            let nameParts = name.toLowerCase().split(" ");

            // Get an array of people in the same room, excluding the current user
            let peopleInRoom = userManager.getActiveUsers().filter((activeUser) => activeUser.zoneId === zoneId && activeUser.roomId === roomId && activeUser.id !== user.id) || [];

            // Filter to find matching people in the same room
            let peopleFound = peopleInRoom.filter((user) => {
                let fullName = (user.firstName + " " + user.lastName).toLowerCase();
                let morphedName = user.morphedName ? user.morphedName.toLowerCase() : "";

                // Check if the input name matches full name, morphed name, or any part of them
                return (
                    nameParts.every(part => fullName.includes(part)) ||
                    (user.morphedName && nameParts.every(part => morphedName.includes(part)))
                );
            });

            let output = '';

            if (peopleFound.length === 1) {
                // When exactly one person is found, output their details
                let personFound = peopleFound[0];
                if (personFound.morphedName) {
                    output += `You look at ${personFound.morphedName} and see:\r\n`;
                    output += `<ht>Name: <green>${personFound.morphedName}<reset>\r\n`;
                    output += `<ht>Description: <green>${personFound.morphedDescription}<reset>\r\n`;
                } else {
                    output += `You look at ${personFound.firstName} ${personFound.lastName} and see:\r\n`;
                    output += `<ht>Title: <green>${personFound.title}<reset>\r\n`;
                    output += `<ht>First Name: <green>${personFound.firstName}<reset>\r\n`;
                    output += `<ht>Last Name: <green>${personFound.lastName}<reset>\r\n`;
                    output += `<ht>Clothing: <green>${personFound.clothing}<reset>\r\n`;
                    output += `<ht>Holding: <green>${personFound.holding}<reset>\r\n`;
                    output += `<ht>Wielding: <green>${personFound.wielding}<reset>\r\n`;
                    output += `<ht>Description: <green>${personFound.description}<reset>\r\n`;
                }
                userManager.send(user.id, output);

                userManager.send(
                    roomPeople.map((person) => person.id),
                    `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${actionLookup["player"][command]} [p:${personFound.morphedName || personFound.firstName + " " + personFound.lastName}].`
                );
                return true;
            } else if (peopleFound.length > 1) {
                // When more than one person is found, ask "which one?"
                userManager.send(user.id, `Multiple people match that description. Which one? Use the full name if needed: [c:look first last]`);
                return false;
            } else {
                return false;
            }
        };

        const lookAtItem = (itemName) => {
            const zoneId = user.zoneId;
            const roomId = user.roomId;
            let targetItem = null;

            // Parse item name and index if provided
            const itemParts = itemName.split(':');
            const baseItemName = itemParts[0].toLowerCase();
            const itemIndex = isNaN(itemParts[1]) ? null : parseInt(itemParts[1], 10) - 1;

            // Fetch items from the user's inventory and the room
            const userItems = itemManager.findItems({owner: user.id});
            const roomItems = itemManager.findItems({location: `${zoneId}:${roomId}`});

            // Combine items from both sources
            const allItems = userItems.concat(roomItems);

            // Filter items by partial name match (case-insensitive)
            const filteredItems = allItems.filter(item =>
                item.name.toLowerCase().includes(baseItemName) ||
                baseItemName.split(' ').every(part => item.name.toLowerCase().includes(part))
            );

            if (filteredItems.length === 0) {
                userManager.send(user.id, `You do not see any "${baseItemName}" here or in your inventory.`);
                return false;
            } else if (filteredItems.length > 1 && itemIndex === null) {
                const itemList = filteredItems.map((item, index) => `"${item.name}:${index + 1}"`).join(", ");
                userManager.send(user.id, `More than one "${baseItemName}" found. Please specify: ${itemList}`);
                return false;
            }

            // Select the target item
            targetItem = itemIndex !== null ? filteredItems[itemIndex] : filteredItems[0];

            if (!targetItem) {
                userManager.send(user.id, `You do not see any "${itemName}" here or in your inventory.`);
                return false;
            }

            // Display item details
            let itemDescription = `You see [i:${targetItem.name}].\n${targetItem.description}`;

            // If the item is a container, show whether it is open or closed, and list contents if open
            if (targetItem.container) {
                if (targetItem.open) {
                    const containerItems = itemManager.findItems({location: targetItem.id});
                    if (containerItems.length > 0) {
                        itemDescription += "\nIt contains: ";
                        containerItems
                            .sort((a, b) => a.name.localeCompare(b.name))  // Alphabetize the contents
                            .forEach(item => {
                                itemDescription += `[i:${item.name}] `;
                            });
                    } else {
                        itemDescription += "\nIt is empty.";
                    }
                } else {
                    itemDescription += "\nThe container is closed.";
                }
            }

            userManager.send(user.id, itemDescription);
            userManager.send(
                roomPeople.map((person) => person.id),
                `[p:${user.morphedName || user.firstName + " " + user.lastName}] examines [i:${targetItem.name}].`
            );

            return true;
        };

        const lookAtNPC = (npc) => {
            userManager.send(user.id, `You see ${npc} here.`);
        };

        const parseProps = (description, props) => {
            if (!description || !props) {
                return description;
            }

            let parsedDescription = description;

            Object.keys(props).forEach((propKey) => {
                let regex = new RegExp(`\\b${propKey}\\b`, "gi");
                parsedDescription = parsedDescription.replace(regex, `[i:${propKey}]`);
            });

            return parsedDescription;
        };

        // Main flow logic
        if (!data) {
            lookAtRoom();
            return true;
        } else if (["self", "myself", "me"].includes(data)) {
            lookAtSelf();
            return true;
        } else if (directions.includes(data)) {
            lookInDirection(directionMap[data] || data);
            return true;
        } else if (currentRoom.props.hasOwnProperty(data)) {
            lookAtProp(data);
            return true;
        } else {
            // Normalize the data for case-insensitive comparison
            const baseData = data.split(':')[0].toLowerCase();

            // Fetch items from the user's inventory and the room
            const userItems = itemManager.findItems({owner: user.id});
            const roomItems = itemManager.findItems({location: `${zoneId}:${roomId}`});

            // Combine items from both sources
            const allItems = userItems.concat(roomItems);

            // Filter items by partial name match (case-insensitive)
            const matchingItems = allItems.filter(item =>
                item.name.toLowerCase().includes(baseData) ||
                baseData.split(' ').every(part => item.name.toLowerCase().includes(part))
            );

            if (matchingItems.length > 0) {
                return lookAtItem(data);
            } else if (roomPeople.some(person => person.morphedName?.toLowerCase().includes(baseData) || person.firstName.toLowerCase().includes(baseData) || person.lastName.toLowerCase().includes(baseData))) {
                return lookAtPerson(data);
            } else if (roomNPCs.some(npc => npc.toLowerCase().includes(baseData))) {
                return lookAtNPC(data);
            } else {
                userManager.send(user.id, `Not sure what you are trying to look at, please be more specific.`);
            }
        }
        return true;
    }
};
