/**
 * Command name: who
 * Description: This command lists all active users in the server.
 * Use 'who' to see a list of all active users.
 *
 * The structure of the 'params' object is:
 * - `command`: The command used to trigger the method.
 * - `user`: The user object identifying who is interacting.
 * - `userManager`: Manager to handle user related requirements.
 *
 * The user object contains:
 * - `firstName`: The first name of the user.
 * - `lastName`: The last name of the user.
 * - `id`: The user's ID.
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 */
module.exports = {
    name: "who",
    description: "This command lists all active users in the server.",
    help: "Use 'who' to see a list of all active users in the server.",
    execute(params) {
        let userManager = params.userManager;

        // Get all active users
        let allActiveUsers = userManager.getActiveUsers();

        if(allActiveUsers.length) {
            let message = 'Online users:<sl>' + allActiveUsers.map(user => `[p:${user.firstName} ${user.lastName}]`).join(', ');

            // Send a message to the user containing the list of online users
            userManager.send(params.user.id, message+'<sl>');
        } else {
            userManager.send(params.user.id, 'No users are currently online.');
        }
    }
};