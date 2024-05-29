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
        const patterns = [/^at /, /^in /, /^inside /, /^around /, /^over /, /^under /, /^through /, /^the /];
        let data = params.data;

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
                userManager.send(user.id, "You're in an undefined space. Please use [c:rescue]<sl>");
                return true;
            }

            const roomName = currentRoom.name;
            const props = roomProps;
            const unparsedDescription = currentRoom.description;
            const roomDescription = parseProps(unparsedDescription, props);
            const roomExits = currentRoom.exits || {};

            const peopleInRoomNames = roomPeople.map((user) => `[p:${user.firstName} ${user.lastName}]`) || [];

            userManager.send(user.id, `<yellow>{ <cyan>${roomName}<reset> <yellow>}<reset>${user.role === "administrator" ? ' [' + currentRoom.zoneId + ':' + currentRoom.roomId + ']' : ''}<sl>`);
            userManager.send(user.id, `${roomDescription}<sl>`);
            userManager.send(
                user.id,
                `Exits: ${Object.keys(roomExits)
                    .map((exit) => `[e:${exit}]`)
                    .join(" ")}<sl>`
            );

            userManager.send(user.id, `People: <red>${peopleInRoomNames.length > 0 ? peopleInRoomNames.join(", ") : "none"}<reset><sl>`);
            if (params.context !== "emit")
                userManager.send(
                    roomPeople.map((person) => person.id),
                    `<sl>[p:${user.firstName} ${user.lastName}] ${actionLookup["room"][command]} room.<sl>`
                );
            return true;
        };

        // display the user's own details
        const lookAtSelf = () => {
            userManager.send(user.id, `You look at yourself and see:<sl>`);
            userManager.send(user.id, `<ht>Title: <green>${user.title}<reset><sl>`);
            userManager.send(user.id, `<ht>First Name: <green>${user.firstName}<reset><sl>`);
            userManager.send(user.id, `<ht>Last Name: <green>${user.lastName}<reset><sl>`);
            userManager.send(user.id, `<ht>Clothing: <green>${user.clothing}<reset><sl>`);
            userManager.send(user.id, `<ht>Holding: <green>${user.holding}<reset><sl>`);
            userManager.send(user.id, `<ht>Wielding: <green>${user.wielding}<reset><sl>`);
            userManager.send(user.id, `<ht>Description: <green>${user.description}<reset><sl>`);
            userManager.send(
                roomPeople.map((person) => person.id),
                `<sl>[p:${user.firstName} ${user.lastName}] ${actionLookup["self"][command]} themselves.<sl>`
            );
            return true;
        };

        const lookInDirection = (direction) => {
            let roomExits = currentRoom.exits;
            if (!roomExits || !roomExits[direction]) {
                userManager.send(user.id, `There is no exit ${direction}.<sl>`);
                return;
            }

            let [nextZoneId, nextRoomId] = roomExits[direction].split(":");

            let nextRoom = roomManager.loadRoom(nextZoneId, nextRoomId);

            if (!nextRoom) {
                userManager.send(user.id, `Something clouds your vision ${direction}.<sl>`);
                return;
            }

            let nextRoomName = nextRoom.name;
            let nextRoomExits = nextRoom.exits || {};
            let nextRoomPeople = userManager.getActiveUsers().filter((activeUser) => activeUser.zoneId === nextZoneId && activeUser.roomId === nextRoomId) || [];

            let exitMessage = Object.keys(nextRoomExits).length ? ` with ${Object.keys(nextRoomExits).length} exits` : "";
            let peopleMessage = nextRoomPeople.length ? ` ${nextRoomPeople.length} people` : "";

            userManager.send(user.id, `${_.capitalize(direction)} you see <cyan>${nextRoomName}<reset>${exitMessage}${peopleMessage}.<sl>`);
            userManager.send(
                roomPeople.map((person) => person.id),
                `<sl>[p:${user.firstName} ${user.lastName}] ${actionLookup["direction"][command]} ${_.capitalize(direction)}.<sl>`
            );
        };

        // Function to look at a prop based on its name
        const lookAtProp = (propName) => {
            const propDescription = currentRoom.props[propName];

            if (!propDescription) {
                userManager.send(user.id, `There is no ${propName} here.<sl>`);
            }

            userManager.send(user.id, `${propDescription}<sl>`);
            userManager.send(
                roomPeople.map((person) => person.id),
                `<sl>[p:${user.firstName} ${user.lastName}] ${actionLookup["prop"][command]} ${_.capitalize(propName)}.<sl>`
            );
        };

        const lookAtPerson = (name) => {
            // Split the input into potential first name and last name
            let [firstName, lastName] = name.toLowerCase().split(" ");

            // Get an array of people in the same room, excluding the current user
            let peopleInRoom = userManager.getActiveUsers().filter((activeUser) => activeUser.zoneId === zoneId && activeUser.roomId === roomId && activeUser.id !== user.id) || [];

            // Filter to find matching people in the same room
            let peopleFound = peopleInRoom.filter((user) => {
                if (lastName) {
                    // If looking for a full name
                    return user.firstName.toLowerCase() === firstName && user.lastName.toLowerCase() === lastName;
                } else {
                    // If looking for either first or last name
                    return user.firstName.toLowerCase() === firstName || user.lastName.toLowerCase() === firstName;
                }
            });

            if (peopleFound.length === 1) {
                // When exactly one person is found, outputs his/her details
                let personFound = peopleFound[0];
                userManager.send(user.id, `You look at ${personFound.firstName} ${personFound.lastName} and see:<sl>`);
                userManager.send(user.id, `<ht>Title: <green>${personFound.title}<reset><sl>`);
                userManager.send(user.id, `<ht>First Name: <green>${personFound.firstName}<reset><sl>`);
                userManager.send(user.id, `<ht>Last Name: <green>${personFound.lastName}<reset><sl>`);
                userManager.send(user.id, `<ht>Clothing: <green>${personFound.clothing}<reset><sl>`);
                userManager.send(user.id, `<ht>Holding: <green>${personFound.holding}<reset><sl>`);
                userManager.send(user.id, `<ht>Wielding: <green>${personFound.wielding}<reset><sl>`);
                userManager.send(user.id, `<ht>Description: <green>${personFound.description}<reset><sl>`);
                userManager.send(
                    roomPeople.map((person) => person.id),
                    `<sl>[p:${user.firstName} ${user.lastName}] ${actionLookup["player"][command]} [p:${personFound.firstName} ${personFound.lastName}].<sl>`
                );
                return true;
            } else if (peopleFound.length > 1) {
                // When more than one person is found, ask "which one?"
                userManager.send(user.id, `Multiple people match that description. Which one? Use the full name if needed: [c:look first last]<sl>`);
                return false;
            } else {
                return false;
            }
        };

        const lookAtItem = (item) => {
            // Your logic for examining an item
            userManager.send(user.id, `You see an ${item} here.<sl>`);
        };

        const lookAtNPC = (npc) => {
            userManager.send(user.id, `You see ${npc} here.<sl>`);
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
        } else if (roomItems.includes(data)) {
            lookAtItem(data);
            return true;
        } else if (roomNPCs.includes(data)) {
            lookAtNPC(data);
            return true;
        } else if (lookAtPerson(data)) {
            return true;
        }
        userManager.send(user.id, `Not sure what you are trying to look at, please be more specific.<sl>`);
        return true;
    },
};
