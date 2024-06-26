/**
 * models.user.js
 */
const uuid = require("uuid");
const _ = require("lodash");
const events = require("events");

class User {
    constructor() {
        const firstNames = _.get(process.env, "USERNAME_FIRST", "").split(",");
        const lastNames = _.get(process.env, "USERNAME_LAST", "").split(",");

        this.id = uuid.v4();
        this.zoneId = "-999"; // Starting zone when user logs in
        this.roomId = "001"; // Starting room when user logs in
        this.status = "login"; // Set status to loggingIn to start with
        this.firstName = _.trim(_.sample(firstNames)); // Random first name
        this.lastName = _.trim(_.sample(lastNames)); // Random last name
        this.title = "Ethereal Wanderer";
        this.clothing = "A veil of mist that surrounds the ghostly form, concealing and revealing in equal measure.";
        this.holding = "A compass that points towards mystical energies and ley lines, guiding the ghostly traveler through the astral plane.";
        this.wielding = "A lantern that emits a soft, ghostly glow, providing ambient light that illuminates the surroundings with an otherworldly ambiance.";
        this.role = "visitor";
        this.password = "";
        this.temporary = true; // Temporary users are not saved to the database
        this.online = false; // User is not online initially
        this.client = null; // to hold the reference to the client
        this.description = `When you look at the newcomer's ghostly form, you see a spectral figure emerging from the swirling mists of the astral plane. Its shape shifts and coalesces in the ephemeral glow, solidifying into an enigmatic guise. This ethereal presence holds the promise of boundless imagination and adventure, inviting fellow travelers to explore the realms of myth and magic together.`;
        this.morphedName = ""; // To store the morphed name
        this.morphedDescription = ""; // To store the morphed description

        this.eventEmitter = new events.EventEmitter();
    }
}

module.exports = User;
