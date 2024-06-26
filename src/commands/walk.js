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
    description: "This command allows you to move in a specific direction or perform various movements.",
    help: "Movements can be actions like 'walk', 'swim', 'fly', 'run', etc. Directions can be full words like 'north', 'south', etc., or their abbreviations like 'n' for north, 's' for south, etc. You can also use directional commands independently to move in that direction. For example, [c:north] or [c:n] will move you north. Use [c:<movement type> <direction>] or [c:<direction>] to move. Example: [c:walk north], [c:fly up] or simply [c:north]. You can also use abbreviations for directions.",
    aliases: ["go", "n", "north", "s", "south", "e", "east", "w", "west", "u", "up", "d", "down", "ne", "northeast", "nw", "northwest", "se", "southeast", "sw", "southwest", "abate", "amble", "bang", "bolt", "bounce", "bound", "burst", "bust", "cant", "canter", "caper", "careen", "cavort", "circle", "clamber", "claw", "cleave", "climb", "coil", "collapse", "crawl", "creep", "crouch", "crush", "curve", "dance", "dart", "dash", "descend", "dip", "dive", "double", "edge", "erupt", "escape", "fade", "fall", "fight", "flit", "float", "flop", "flounce", "flow", "flutter", "fly", "frisk", "frolic", "gallop", "galumph", "glide", "hike", "hobble", "hop", "hopscotch", "hover", "hunch", "hurry", "hurtle", "jog", "jump", "kneel", "kowtow", "lean", "leap", "lie", "limp", "list", "loll", "lope", "lounge", "lower", "lunge", "lurch", "march", "meander", "parade", "pirouette", "pivot", "plod", "plummet", "plunge", "pop", "pounce", "prance", "promenade", "prowl", "pull", "race", "ramble", "retreat", "revolve", "rip", "rocket", "roll", "run", "rush", "sag", "sail", "saunter", "scamper", "scatter", "scoot", "scurry", "scuttle", "shamble", "shiver", "shoot", "shuffle", "sidestep", "sink", "skid", "skip", "skitter", "slide", "slink", "slither", "slog", "slouch", "slump", "smash", "snap", "sneak", "snuggle", "soar", "spin", "spiral", "sprawl", "spring", "sprint", "squat", "squirm", "stagger", "stalk", "stamp", "stoop", "stomp", "straggle", "stride", "stroll", "strut", "stumble", "swagger", "sway", "swerve", "swim", "swing", "swoop", "tear", "tilt", "tip", "tiptoe", "toddle", "traipse", "tramp", "tread", "trip", "trot", "trudge", "twirl", "twist", "vault", "waddle", "wade", "waft", "wander", "wane", "weave", "wheel", "whip", "whirl", "whisk", "whiz", "wiggle", "wobble", "wriggle", "writhe", "zag", "zigzag"],
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
            userManager.send(user.id, `Invalid direction.`);
            return;
        }

        // Get the exit for the specified direction
        const exit = currentRoom.exits[direction];

        // If exit does not exist, send error message
        if (!exit) {
            userManager.send(user.id, `There is no exit in that direction.`);
            return;
        }

        // Get the zoneId and roomId for the next room
        const [nextZoneId, nextRoomId] = exit.split(":");

        // Load the next room, if it does not exist send error message
        if (!roomManager.exists(nextZoneId, nextRoomId)) {
            userManager.send(user.id, `${_.sample(roomNotReadyMessages)}`);
            return;
        }

        // Adjust the tense of the command (verb)
        const verbTenseMap = {
            abate: "abates",
            amble: "ambles",
            bang: "bangs",
            bolt: "bolts",
            bounce: "bounces",
            bound: "bounds",
            burst: "bursts",
            bust: "busts",
            canter: "canters",
            careen: "careens",
            cavort: "cavorts",
            circle: "circles",
            clamber: "clambers",
            claw: "claws",
            cleave: "cleaves",
            climb: "climbs",
            coil: "coils",
            collapse: "collapses",
            crawl: "crawls",
            creep: "creeps",
            crouch: "crouches",
            crush: "crushes",
            curve: "curves",
            dance: "dances",
            dart: "darts",
            dash: "dashes",
            descend: "descends",
            dip: "dips",
            dive: "dives",
            double: "doubles",
            drop: "drops",
            edge: "edges",
            erupt: "erupts",
            escape: "escapes",
            fade: "fades",
            fall: "falls",
            fight: "fights",
            flit: "flits",
            float: "floats",
            flop: "flops",
            flounce: "flounces",
            flow: "flows",
            flutter: "flutters",
            fly: "flies",
            frisk: "frisks",
            frolic: "frolics",
            gallop: "gallops",
            galumph: "galumphs",
            glide: "glides",
            hike: "hikes",
            hobble: "hobbles",
            hop: "hops",
            hopscotch: "hopscotches",
            hover: "hovers",
            hunch: "hunches",
            hurry: "hurries",
            hurtle: "hurtles",
            jog: "jogs",
            jump: "jumps",
            kneel: "kneels",
            kowtow: "kowtows",
            lean: "leans",
            leap: "leaps",
            lie: "lies",
            limp: "limps",
            list: "lists",
            loll: "lolls",
            lope: "lopes",
            lounge: "lounges",
            lower: "lowers",
            lunge: "lunges",
            lurch: "lurches",
            march: "marches",
            meander: "meanders",
            parade: "parades",
            pirouette: "pirouettes",
            pivot: "pivots",
            plod: "plods",
            plummet: "plummets",
            plunge: "plunges",
            pop: "pops",
            pounce: "pounces",
            prance: "prances",
            promenade: "promenades",
            prowl: "prowls",
            pull: "pulls",
            race: "races",
            ramble: "rambles",
            retreat: "retreats",
            revolve: "revolves",
            rip: "rips",
            rocket: "rockets",
            roll: "rolls",
            run: "runs",
            rush: "rushes",
            sag: "sags",
            sail: "sails",
            saunter: "saunters",
            scamper: "scampers",
            scatter: "scatters",
            scoot: "scoots",
            scurry: "scurries",
            scuttle: "scuttles",
            shamble: "shambles",
            shiver: "shivers",
            shoot: "shoots",
            shuffle: "shuffles",
            sidestep: "sidesteps",
            sink: "sinks",
            skid: "skids",
            skip: "skips",
            skitter: "skitters",
            slide: "slides",
            slink: "slinks",
            slither: "slithers",
            slog: "slogs",
            slouch: "slouches",
            slump: "slumps",
            smash: "smashes",
            snap: "snaps",
            sneak: "sneaks",
            snuggle: "snuggles",
            soar: "soars",
            spin: "spins",
            spiral: "spirals",
            sprawl: "sprawls",
            spring: "springs",
            sprint: "sprints",
            squat: "squats",
            squirm: "squirms",
            stagger: "staggers",
            stalk: "stalks",
            stamp: "stamps",
            stomp: "stomps",
            stoop: "stoops",
            straggle: "straggles",
            stride: "strides",
            stroll: "strolls",
            strut: "struts",
            stumble: "stumbles",
            swagger: "swaggers",
            sway: "sways",
            swerve: "swerves",
            swim: "swims",
            swing: "swings",
            swoop: "swoops",
            tear: "tears",
            tilt: "tilts",
            tip: "tips",
            tiptoe: "tiptoes",
            toddle: "toddles",
            traipse: "traipses",
            tramp: "tramps",
            tread: "treads",
            trip: "trips",
            trot: "trots",
            trudge: "trudges",
            twirl: "twirls",
            twist: "twists",
            vault: "vaults",
            waddle: "waddles",
            wade: "wades",
            waft: "wafts",
            walk: "walks",
            wander: "wanders",
            wane: "wanes",
            weave: "weaves",
            wheel: "wheels",
            whip: "whips",
            whirl: "whirls",
            whisk: "whisks",
            whiz: "whizzes",
            wiggle: "wiggles",
            wobble: "wobbles",
            wriggle: "wriggles",
            writhe: "writhes",
            zag: "zags",
            zigzag: "zigzags"
        };

        const verbTense = verbTenseMap[command] || "walks";

        // Move the user to the next room
        if (userManager.moveUser(user.id, nextZoneId, nextRoomId)) {
            // Message to display when leaving current room
            const leavingMessage = `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verbTense} out of the room headed ${direction}.`;

            // Get the people in the current room
            const currentRoomPeople = userManager.getRoomUsers(zoneId, roomId).filter((currentRoomUser) => currentRoomUser.id !== user.id) || [];

            // Send leaving message to everyone in the current room
            userManager.send(currentRoomPeople.map((person) => person.id), leavingMessage);

            // Message to display upon entering the target room
            const enteringMessage = `[p:${user.morphedName || user.firstName + " " + user.lastName}] ${verbTense} in from ${["up", "down"].includes(direction) ? "" : "the "}${getOppositeDirection(direction)}.`;

            const nextRoomPeople = userManager.getRoomUsers(nextZoneId, nextRoomId).filter((nextRoomUser) => nextRoomUser.id !== user.id) || [];

            // Send entering message to everyone in the destination room
            userManager.send(nextRoomPeople.map((person) => person.id), enteringMessage);

            // Send movement message to player
            userManager.send(user.id, `You ${Object.keys(verbTenseMap).find((key) => verbTenseMap[key] === verbTense)} ${direction}.`);
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
