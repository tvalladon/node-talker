# Node Talker

Node Talker is a server framework for text-based multiplayer online games. It allows for the creation and management of various game elements such as rooms, items, and user interactions through a command-based system.

## Features

- Environment variable configuration using `dotenv`
- Error handling with `error-stack-parser`
- Room, item, and user management
- Command-based interactions
- Logging system
- Client connection handling

## Installation

To clone the repository and install the dependencies, run:

```sh
git clone <repository_url>
cd node-talker-main
npm install
```

## Usage

To start the server, use:

```sh
npm start
```

For development mode with automatic restarts on file changes, use:

```sh
npm run start:dev
```

## Commands

### act.js
Handles action/emote commands, allowing users to perform actions that can be seen by other players.
- **Aliases**: `lact`, `gact`, `me`, `lme`, `gme`

### dice.js
Manages dice roll commands for contested actions, broadcasting the results within various scopes (same room, local rooms, or globally).
- **Aliases**: `ldice`, `gdice`

### help.js
Provides help and documentation about available commands and their usage.
- **Aliases**: `?`

### item.js
Handles item-related commands, such as examining, picking up, or using items.
- **Aliases**: `arrange`, `assemble`, `blend`, `brew`, `build`, `carve`, `cast`, `chisel`, `compose`, `concoct`, `construct`, `craft`, `create`, `cut`, `draft`, `engender`, `engineer`, `engrave`, `establish`, `etch`, `fabricate`, `fashion`, `fix`, `forge`, `form`, `formulate`, `frame`, `generate`, `hew`, `imprint`, `incise`, `initiate`, `inscribe`, `institute`, `invent`, `knit`, `make`, `manufacture`, `mark`, `mill`, `mint`, `model`, `mold`, `notch`, `orchestrate`, `originate`, `plant`, `prepare`, `press`, `produce`, `sew`, `sculpt`, `shape`, `spawn`, `stamp`, `stitch`, `structure`, `synthesize`, `tailor`, `trace`, `weave`, `weld`

### look.js
Manages look commands, allowing users to examine their surroundings or specific objects.
- **Aliases**: `l`, `read`, `examine`, `inspect`, `view`, `check`, `study`, `observe`, `scrutinize`, `survey`, `glance`, `explore`, `focus`, `glimpse`, `stare`, `peek`, `analyze`, `notice`, `identify`

### morph.js
Handles commands related to changing the player's form or appearance.
- **Aliases**: `transform`, `shift`, `transfigure`

### ooc.js
Manages out-of-character (OOC) communication commands, allowing users to chat OOC within the game.
- **Aliases**: `looc`, `gooc`

### say.js
Handles in-character (IC) communication commands, enabling users to speak to others in the same room.
- **Aliases**: `yell`, `shout`, `!`

### user.js
Manages user-related commands, such as logging in, logging out, and user information.
- **Aliases**: None

### walk.js
Handles movement commands, allowing users to move between rooms.
- **Aliases**: `go`, `n`, `north`, `s`, `south`, `e`, `east`, `w`, `west`, `u`, `up`, `d`, `down`, `ne`, `northeast`, `nw`, `northwest`, `se`, `southeast`, `sw`, `southwest`, `abate`, `amble`, `bang`, `bolt`, `bounce`, `bound`, `burst`, `bust`, `cant`, `canter`, `caper`, `careen`, `cavort`, `circle`, `clamber`, `claw`, `cleave`, `climb`, `coil`, `collapse`, `crawl`, `creep`, `crouch`, `crush`, `curve`, `dance`, `dart`, `dash`, `descend`, `dip`, `dive`, `double`, `drop`, `edge`, `erupt`, `escape`, `fade`, `fall`, `fight`, `flit`, `float`, `flop`, `flounce`, `flow`, `flutter`, `fly`, `frisk`, `frolic`, `gallop`, `galumph`, `glide`, `hike`, `hobble`, `hop`, `hopscotch`, `hover`, `hunch`, `hurry`, `hurtle`, `jog`, `jump`, `kneel`, `kowtow`, `lean`, `leap`, `lie`, `limp`, `list`, `loll`, `lope`, `lounge`, `lower`, `lunge`, `lurch`, `march`, `meander`, `parade`, `pirouette`, `pivot`, `plod`, `plummet`, `plunge`, `pop`, `pounce`, `prance`, `promenade`, `prowl`, `pull`, `race`, `ramble`, `retreat`, `revolve`, `rip`, `rocket`, `roll`, `run`, `rush`, `sag`, `sail`, `saunter`, `scamper`, `scatter`, `scoot`, `scurry`, `scuttle`, `shamble`, `shiver`, `shoot`, `shuffle`, `sidestep`, `sink`, `skid`, `skip`, `skitter`, `slide`, `slink`, `slither`, `slog`, `slouch`, `slump`, `smash`, `snap`, `sneak`, `snuggle`, `soar`, `spin`, `spiral`, `sprawl`, `spring`, `sprint`, `squat`, `squirm`, `stagger`, `stalk`, `stamp`, `stoop`, `stomp`, `straggle`, `stride`, `stroll`, `strut`, `stumble`, `swagger`, `sway`, `swerve`, `swim`, `swing`, `swoop`, `tear`, `tilt`, `tip`, `tiptoe`, `toddle`, `traipse`, `tramp`, `tread`, `trip`, `trot`, `trudge`, `twirl`, `twist`, `vault`, `waddle`, `wade`, `waft`, `wander`, `wane`, `weave`, `wheel`, `whip`, `whirl`, `whisk`, `whiz`, `wiggle`, `wobble`, `wriggle`, `writhe`, `zag`, `zigzag`

### welcome.js
Provides a welcome message to new users or upon connecting.
- **Aliases**: None

### who.js
Lists currently connected users.
- **Aliases**: None

## Dependencies

- `dotenv`: Loads environment variables from a `.env` file.
- `error-stack-parser`: Parses error stack traces.
- `lodash`: Utility library.
- `moment`: Date manipulation library.
- `nodemon`: Tool for automatically restarting the server during development.
- `uuid`: Library for generating unique identifiers.

## Environment Variables

The server configuration can be managed using environment variables defined in a `.env` file. Refer to `dot-env-default` for the default variables.

## License

This project is licensed under the MIT [License](LICENSE).
