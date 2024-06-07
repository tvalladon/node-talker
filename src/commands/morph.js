/**
 * Command name: morph
 * Description: Allows the user to set their morphed name and description, or revert back to their normal form.
 *
 * Usage:
 * "morph set name <name>": Sets the user's morphed name.
 * "morph set description <description>": Sets the user's morphed description.
 * "morph revert": Reverts the user back to their normal form, clearing both morphed name and morphed description.
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 */
module.exports = {
    name: 'morph',
    description: "This command allows the user to set their morphed name and description, or revert back to their normal form.",
    help: "Use [c:morph set name <name>] to set your morphed name. Use [c:morph set description <description>] to set your morphed description. Use [c:morph revert] to revert back to your normal form, clearing both morphed name and morphed description.",
    aliases: ["transform", "shift", "transfigure"],
    execute(params) {
        const command = params.command;
        const user = params.user;
        const userManager = params.userManager;
        let data = params.data;

        if (!data) {
            userManager.send(user.id, "Usage: morph set name <name> | morph set description <description> | morph revert<sl>");
            return;
        }

        const args = data.split(' ');
        const action = args.shift().toLowerCase() || '';
        const field = (args.shift() || '').toLowerCase();
        const value = args.join(' ');

        const allUsers = userManager.getActiveUsers();

        if (action === 'set' && field === 'name') {
            // Check if the desired morphed name is already in use by checking both first+last names and morphed names
            const nameInUse = allUsers.some(activeUser => {
                const fullName = `${activeUser.firstName} ${activeUser.lastName}`.toLowerCase();
                const morphedName = activeUser.morphedName ? activeUser.morphedName.toLowerCase() : '';
                return fullName === value.toLowerCase() || morphedName === value.toLowerCase();
            });

            if (nameInUse) {
                userManager.send(user.id, `The name [p:${value}] is already in use. Please choose a different name.<sl>`);
                return;
            }
        }

        const roomPeople = allUsers.filter(activeUser => activeUser.zoneId === user.zoneId && activeUser.roomId === user.roomId && activeUser.id !== user.id);

        if (action === 'set') {
            if (field === 'name') {
                user.morphedName = value;
                userManager.send(user.id, `Your morphed name has been set to [p:${value}].<sl>`);
                roomPeople.forEach(person => {
                    userManager.send(person.id, `[p:${user.firstName} ${user.lastName}] has morphed into [p:${user.morphedName}].<sl>`);
                });
            } else if (field === 'description') {
                user.morphedDescription = value;
                userManager.send(user.id, `Your morphed description has been set.<sl>`);
            } else {
                userManager.send(user.id, "Invalid field. Usage: morph set name <name> | morph set description <description><sl>");
            }
        } else if (action === 'revert') {
            roomPeople.forEach(person => {
                userManager.send(person.id, `[p:${user.morphedName}] has reverted to [p:${user.firstName} ${user.lastName}].<sl>`);
            });
            user.morphedName = "";
            user.morphedDescription = "";
            userManager.send(user.id, "You have reverted back to your normal form.<sl>");
        } else {
            userManager.send(user.id, "Invalid action. Usage: morph set name <name> | morph set description <description> | morph revert<sl>");
        }
    }
};
