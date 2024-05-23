/**
 * Command name: welcome
 * Description: Display the welcome message for new users.
 * Optionally, a specific page of the welcome message can be displayed if page numbers are provided.
 *
 * Usage:
 * "welcome <page>": Display a specified page of the welcome message.
 * "welcome": Without an argument, it defaults to displaying the first page of the welcome message.
 *
 * E.g:
 * "welcome 2" - Displays the second page of the welcome messages.
 * "welcome" - Displays the first page of the welcome message if no argument is provided.
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 * The structure of the 'params' object is:
 * - `user`: The user object identifying who is interacting.
 * - `userManager`: Manager to handle user related requirements.
 * - `data`: The additional data provided with the command (page number in this case).
 */

const fs = require("fs");

const SETTINGS_FILE = `${process.cwd()}/${process.env.DB_PATH}/settings.json`;

module.exports = {
    name: 'welcome',
    description: 'Display the welcome message for new users.',
    help: '[c:welcome <page>]. Display the welcome message for new users. Optionally, specify a page number to view a specific page of the welcome message.',
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;

        readAndParseSettings().then(settings => {
            if (!args[0]) args[0] = "1";
            let pageNumber = calculatePageNumber(args, settings.welcomeMessage.length);
            manageUserMessages(userManager, user, pageNumber, settings);
        }).catch(err => {
            userManager.send(user.id, "An error occurred while reading the settings file.<sl>");
        });
    }
};

async function readAndParseSettings() {
    try {
        const data = await fs.promises.readFile(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error occurred:", err);
        throw err;
    }
}

function calculatePageNumber(args, totalPages) {
    let pageNumber = args && args.length > 0 && !isNaN(args[0]) ? parseInt(args[0]) : 1;
    return Math.max(1, Math.min(pageNumber, totalPages));
}

function manageUserMessages(userManager, user, pageNumber, settings) {
    const pageContent = settings.welcomeMessage[pageNumber - 1].content;
    userManager.send(user.id, '<sl>' + pageContent.join("<dl>") + `<sl>Page ${pageNumber} of ${settings.welcomeMessage.length}.`);

    if (pageNumber < settings.welcomeMessage.length) {
        userManager.send(user.id, `<sl>To view the next page, use [c:welcome ${pageNumber + 1}]<sl>`);
    } else {
        userManager.send(user.id, `<sl>End of welcome page.<sl>`);
    }
}