/**
 * Command name: user
 * Description: This command allows you to create and login to user accounts.
 *
 * Usage:
 * "user create firstName lastName password": Create a user account with the set values.
 * "user login firstName lastName password": Login to a user account with the matching values.
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
    name: "user",
    description: "This command allows you to create, login or modify player accounts.",
    help: "Use [c:user create firstName lastName password] to create an account, [c:user login firstName lastName password] to login to an account, [c:user get <key>] to see player values or [c:user set <key> <value>] to set player values.",
    aliases: [],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;

        if (!data) {
            userManager.send(user.id, `Usage: ${this.help}<sl>`);
            return;
        }

        const args = data.split(" ");

        if (!["create", "login", "set", "get"].includes(args[0])) {
            userManager.send(user.id, `Usage: ${this.help}<sl>`);
            return;
        } else if (["create", "login"].includes(args[0]) && args.length !== 4) {
            userManager.send(user.id, `Usage: ${this.help}<sl>`);
            return;
        }

        switch (args[0]) {
            case "create": {
                if (!user.temporary) {
                    userManager.send(user.id, "You are already logged in to an account, please reconnect to use a different account.<sl>");
                    return;
                }

                // Get the input parameters for the create command
                const firstName = args[1];
                const lastName = args[2];
                const password = args[3];
                const origFirstName = user.firstName;
                const origLastName = user.lastName;

                try {
                    // Validate firstName and lastName against non-alphabetic characters
                    if (!/^[a-zA-Z-' ]+$/u.test(firstName) || !/^[a-zA-Z-' ]+$/u.test(lastName)) {
                        userManager.send(user.id, "Names can only contain alphabetic characters, spaces, hyphens, and apostrophes.<sl>");
                        return;
                    }

                    // Hash the password, get back the hashed password as password, and salt.
                    let hashedData = userManager.hashPassword(password);

                    const role = "player";
                    const title = "Fresh Soul";
                    const description = "In the shifting light, you catch sight of a form that seems to waver between worlds, its presence a delicate balance between the tangible and the ephemeral. This is no mere apparition, but a soul newly awakened to the sensations of the mortal realm. Their features, once indistinct and ghostly, now hold a clarity and definition that speaks to their newfound embodiment. Eyes, once distant and unfocused, now brim with a quiet intensity, their gaze sweeping the world with a hunger for experience. Each movement is infused with a sense of purpose, as if the very act of walking upon solid ground is a testament to their triumph over the ethereal veil. Though their journey may be just beginning, there is a strength and resilience in their bearing that hints at the depth of their spirit and the potential that lies within.";
                    const clothing = "Garments that cling to the body with reassuring solidity, grounding the character in the realm of the living.";
                    const holding = "An empty hand, now capable of grasping and manipulating objects in the physical world.";
                    const wielding = " A small, smooth stone that fits comfortably in the hand, perfect for absentmindedly tossing or skipping across a calm pond.";
                    const temporary = false;

                    // Clone the user and update its relevant properties
                    let tempUser = {
                        ...user,
                        ...hashedData,
                        firstName,
                        lastName,
                        temporary,
                        role,
                        title,
                        description,
                        clothing,
                        holding,
                        wielding,
                    };

                    let persistedUser = userManager.create(tempUser);
                    if (!persistedUser) {
                        userManager.send(user.id, "Someone please tell admin my user creation is broken.<sl>");
                        return;
                    }

                    // Instead of reassigning user, update its properties in-place
                    Object.assign(user, persistedUser);

                    userManager.send(user.id, `Account created, you are now [p:${user.firstName} ${user.lastName}].<sl>Please use [c:user get] and [c:user set] to update your profile description and title as needed.<sl>`);

                    userManager.broadcast(`[p:${origFirstName} ${origLastName}] is now known as [p:${user.firstName} ${user.lastName}]]<sl>`);
                } catch (error) {
                    userManager.send(user.id, error.message);
                    return;
                }
                break;
            }
            case "login": {
                if (!user.temporary) {
                    userManager.send(user.id, "You are already logged in to an account, please reconnect to use a different account.<sl>");
                    return;
                }

                const firstName = args[1];
                const lastName = args[2];
                const password = args[3];
                const origFirstName = user.firstName;
                const origLastName = user.lastName;

                try {
                    const persistedUser = userManager.verifyAndLoadUser(firstName, lastName, password);
                    // If all checks pass, update in-memory user
                    Object.assign(user, persistedUser);
                    user.eventEmitter.emit("user_move");
                    userManager.send(user.id, `Logged in successfully, you are now [p:${user.firstName} ${user.lastName}].<sl>`);
                    userManager.broadcast(`[p:${origFirstName} ${origLastName}] is now known as [p:${user.firstName} ${user.lastName}]<sl>`);
                } catch (error) {
                    userManager.send(user.id, error.message);
                    return;
                }
                break;
            }

            case "get": {
                if (user.temporary) {
                    userManager.send(user.id, "You are a visitor, none of your settings can be changed. Please consider creating an account with [c:user create].<sl>");
                    return;
                }

                const fields = ["description", "title", "clothing", "holding", "wielding"];
                if (!args[1]) {
                    userManager.send(user.id, `Usage: [c:user get <key>]. keys are: ${fields.join(", ")}<sl>`);
                    return;
                }

                if (_.has(user, args[1])) {
                    let value = _.get(user, args[1]);
                    userManager.send(user.id, `${args[1]}: ${value}`, false);
                    userManager.send(user.id, `<sl>`);
                } else {
                    userManager.send(user.id, `The key ${args[1]} does not exist.<sl>`);
                }
                break;
            }
            case "set": {
                if (user.temporary) {
                    userManager.send(user.id, "You are a visitor, none of your settings can be changed. Please consider creating an account with [c:user create].<sl>");
                    return;
                }

                const fields = ["description", "title", "clothing", "holding", "wielding"];
                if (!args[1]) {
                    userManager.send(user.id, `Usage: [c:user set <key> <value string>]. keys are: ${fields.join(", ")}<sl>`);
                    return;
                }

                if (_.has(user, args[1])) {
                    if (!args.slice(2).join(" ")) {
                        userManager.send(user.id, `A value is required for every key, no empty spots.<sl>`);
                        return;
                    }

                    _.set(user, args[1], args.slice(2).join(" "));
                    userManager.save(user);
                    userManager.send(user.id, `${args[1]} set to: ${args.slice(2).join(" ")}`, false);
                    userManager.send(user.id, `<sl>`);
                } else {
                    userManager.send(user.id, `The key ${args[1]} does not exist.<sl>`);
                }
                break;
            }
            default:
                userManager.send(user.id, "Unknown action.<sl>");
                break;
        }
    },
};
