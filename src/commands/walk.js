/**
 * Command name: walk
 * Description: This command allows you to move in a specific direction or perform various movements.
 *
 * Usage:
 * "walk <direction>": User moves in the specified direction.
 * "<action> <direction>": User moves in the specified direction with a specified action. Actions can be 'walk', 'swim', 'fly', 'run', etc.
 * "<direction>": User moves in the specified direction.
 *
 * Directions can be full words like 'north', 'south', etc., or their abbreviations:
 * "n" for "north"
 * "s" for "south"
 * "e" for "east"
 * "w" for "west"
 *
 * E.g:
 * "walk north" - User walks towards the north.
 * "run south" - User runs towards the south.
 * "n" - User moves towards the north.
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
    name: "walk",
    description: "This command allows you to move in a specific direction or perform various movements. Movements can be actions like 'walk', 'swim', 'fly', 'run', etc. Directions can be full words like 'north', 'south', etc., or their abbreviations like 'n' for north, 's' for south, etc. You can also use directional commands independently to move in that direction. For example, 'north' or 'n' will move you north.",
    help: "Use '<movement type> <direction>' or '<direction>' to move. Example: 'walk north', 'fly up' or simply 'north'. You can also use abbreviations for directions.",
    aliases: ["go", "n", "north", "s", "south", "e", "east", "w", "west", "u", "up", "d", "down", "ne", "northeast", "nw", "northwest", "se", "southeast", "sw", "southwest", "swim", "fly", "crawl", "jog", "run", "fall", "skip", "glide", "dance", "wiggle", "float", "trip", "escape", "fight", "claw", "jump", "sneak"],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;

        // Fetch current room
        const zoneId = user.zoneId;
        const roomId = user.roomId;
        let currentRoom = roomManager.loadRoom(zoneId, roomId);

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

        const roomNotReadyMessages = [
            "This room is currently in the midst of a magical makeover. Beware of flying broomsticks!",
            "It seems this room is still brewing in the cauldron of creation. Mind the bubbling potions!",
            "This room is currently off on a quest to find its missing pixels. It's bound to return with a sparkle!",
            "This room got lost in the enchanted forest of development. Don't worry, fairies are on the rescue mission!",
            "This room is still under construction, but the gnomes are on strike. They demand more enchanted snacks!",
            "This room is still being woven into existence by the spiders of fate. They're spinning their finest webs!",
            "This room has fallen victim to a pesky time loop spell. It'll catch up with reality soon enough!",
            "This room is currently dancing to the rhythm of the construction wizard's magic wand. It's a sight to behold!",
            "This room is taking a detour through the realm of dreams. It's dreaming up the perfect ambiance!",
            "This room is lost in translation between realms. It's trying to find its way back with a treasure map!",
            "This room is tangled in a web of enchantment. It's waiting for the spiders to finish knitting their magic!",
            "This room is still rehearsing its grand entrance with the invisible orchestra. Encore, encore!",
            "This room is playing hide and seek with the construction gnomes. They're masters of camouflage!",
            "This room is still under construction, but the dwarves are on a coffee break. They take their brew very seriously!",
            "This room is currently moon-walking through the astral plane. It's trying to find its way back to reality!",
            "This room is in the midst of a magical metamorphosis. It's evolving into something truly fantastical!",
            "This room has been caught in a time dilation spell. It's aging like a fine wine, but construction will resume shortly!",
            "This room is experiencing a temporary glitch in the matrix. The wizards are debugging as we speak!",
            "This room is still a work in progress, but the dragons are busy guarding the treasure chest. Safety first!",
            "This room is currently on a quest to find the missing puzzle pieces. It's bound to be a masterpiece once complete!",
        ];


        // If command is a direction alias, move that direction
        if (directionMap[command]) {
            data = command;
        }

        let direction = '';

        // Check if command is a value in directionMap
        if (_.includes(_.values(directionMap), command)) {
            direction = command;
        } else {
            // If not, check if data is a key in directionMap
            direction = directionMap[data] || data;
        }

        // If direction is not valid, send error message
        if (!Object.values(directionMap).includes(direction)) {
            userManager.send(user.id, `Invalid direction.<sl>`);
            return;
        }

        // Get the exit for the specified direction
        const exit = currentRoom.exits[direction];

        // If exit does not exist, send error message
        if (!exit) {
            userManager.send(user.id, `There is no exit in that direction.<sl>`);
            return;
        }

        // Get the zoneId and roomId for the next room
        const [nextZoneId, nextRoomId] = exit.split(":");

        // Load the next room, if it does not exist send error message
        if (!roomManager.exists(nextZoneId, nextRoomId)) {
            userManager.send(user.id, `${_.sample(roomNotReadyMessages)}<sl>`);
            return;
        }

        // Adjust the tense of the command (verb)
        const verbTenseMap = {
            walk: "walks",
            go: "goes",
            swim: "swims",
            fly: "flies",
            crawl: "crawls",
            jog: "jogs",
            run: "runs",
            fall: "falls",
            skip: "skips",
            glide: "glides",
            dance: "dances",
            wiggle: "wiggles",
            float: "floats",
            trip: "trips",
            escape: "escapes",
            fight: "fights",
            claw: "claws",
            jump: "jumps",
            sneak: "sneaks",
        };
        const verbTense = verbTenseMap[command] || "walks";

        // Move the user to the next room
        if (userManager.moveUser(user.id, nextZoneId, nextRoomId)) {
            // Message to display when leaving current room
            const leavingMessage = `<sl>[p:<player_name>] ${verbTense} out of the room headed ${direction}.<sl>`;

            // Get the people in the current room
            const currentRoomPeople = userManager.getRoomUsers(zoneId, roomId).filter((currentRoomUser) => currentRoomUser.id !== user.id) || [];

            // Send leaving message to everyone in the current room
            userManager.send(currentRoomPeople.map((person) => person.id), leavingMessage);

            // Message to display upon entering the target room
            const enteringMessage = `<sl>[p:<player_name>] ${verbTense} in from ${["up", "down"].includes(direction) ? "" : "the "}${getOppositeDirection(direction)}.<sl>`;

            const nextRoomPeople = userManager.getRoomUsers(nextZoneId, nextRoomId).filter((nextRoomUser) => nextRoomUser.id !== user.id) || [];

            // Send entering message to everyone in the destination room
            userManager.send(nextRoomPeople.map((person) => person.id), enteringMessage);

            // Send movement message to player
            userManager.send(user.id, `You ${Object.keys(verbTenseMap).find((key) => verbTenseMap[key] === verbTense)} ${direction}.<sl>`);
        }
    },
};

// Get the opposite direction
function getOppositeDirection(direction) {
    const opposites = {
        north: "south",
        south: "north",
        east: "west",
        west: "east",
        up: "below",
        down: "above",
        northeast: "southwest",
        northwest: "southeast",
        southeast: "northwest",
        southwest: "northeast",
    };
    return opposites[direction] || "";
}
