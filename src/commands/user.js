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
    description: "This command allows you to create and login to user accounts.",
    help: "Use [c:user create firstName lastName password] to create an account, [c:user login firstName lastName password] to login to an account.",
    aliases: [],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;


        if (!user.temporary) {
            userManager.send(user.id, "You are already logged in to an account, please reconnect to use a different account.<sl>");
            return;
        }

        if (!data) {
            userManager.send(user.id, `Usage: ${this.help}<sl>`);
            return;
        }

        const args = data.split(' ');

        if (!['create', 'login'].includes(args[0])) {
            userManager.send(user.id, `Usage: ${this.help}<sl>`);
            return;
        } else if (['create', 'login'].includes(args[0]) && args.length !== 4) {
            userManager.send(user.id, `Usage: ${this.help}<sl>`);
            return;
        }

        switch (args[0]) {
            case 'create': {
                // Get the input parameters for the create command
                const firstName = args[1];
                const lastName = args[2];
                const password = args[3];

                try {
                    // Validate firstName and lastName against non-alphabetic characters
                    if (!(/^[a-zA-Z-' ]+$/u.test(firstName)) || !(/^[a-zA-Z-' ]+$/u.test(lastName))) {
                        userManager.send(user.id, "Names can only contain alphabetic characters, spaces, hyphens, and apostrophes.<sl>");
                        return;
                    }

                    // Hash the password, get back the hashed password as password, and salt.
                    let hashedData = userManager.hashPassword(password);

                    // Clone the user and update its relevant properties
                    let tempUser = {...user, ...hashedData, firstName, lastName, temporary: false};

                    let persistedUser = userManager.create(tempUser);
                    if (!persistedUser) {
                        userManager.send(user.id, "Someone please tell admin my user creation is broken.<sl>");
                        return;
                    }

                    // Instead of reassigning user, update its properties in-place
                    Object.assign(user, persistedUser);

                } catch (error) {
                    userManager.send(user.id, error.message);
                    return;
                }
                break;
            }
            case 'login': {
                const firstName = args[1];
                const lastName = args[2];
                const password = args[3];
                try {
                    const persistedUser = userManager.verifyAndLoadUser(firstName, lastName, password);
                    // If all checks pass, update in-memory user
                    Object.assign(user, persistedUser);
                    userManager.send(user.id, "Logged in successfully.<sl>");
                } catch (error) {
                    userManager.send(user.id, error.message);
                    return;
                }
                break;
            }
            default:
                userManager.send(user.id, "Unknown action.<sl>");
                break;
        }
    }
}
