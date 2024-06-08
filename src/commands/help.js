/**
 * Command name: help
 * Description: Lists all commands or provides detailed help on a specific command.
 *
 * Usage:
 * "help": User will receive a list of all available commands and their descriptions.
 * "help <command>": User will receive detailed help on command <command> which also includes a list of aliases for this command.
 *
 * @param {object} params - An object containing different parameters to control the execution of this command.
 */
module.exports = {
    name: 'help',
    description: "This command lists all available commands with their brief descriptions or provides detailed help on a specific command when followed by the command's name.",
    help: "Use [c:help] to get a list of all commands with their descriptions or [c:help <command>] to get a detailed description and usage for a specific command. Using [c:help <command>] will also show available aliases.",
    aliases: ["?"],
    execute(params) {
        let command = params.command;
        let user = params.user;
        let userManager = params.userManager;
        let roomManager = params.roomManager;
        let data = params.data;
        let commandHandler = params.commandHandler;

        // Get all unique commands from CommandHandler object
        const mainCommands = commandHandler.getMainCommands();

        // Helper function to construct detailed help message for a specific command
        const getDetailedCommandHelp = (commandObj) => {
            let helpMessage = `<yellow>${commandObj.name}<reset>\r\n${commandObj.description}\r\n${commandObj.help}\r\n`;
            if (commandObj.aliases.length) {
                helpMessage += `Aliases: ${commandObj.aliases.join(', ')}\r\n`;
            }
            return helpMessage;
        };

        // Helper function to collect unique command names and avoid duplicates through aliases
        const getMainCommandsHelp = () => mainCommands.map(commandObj => `<yellow>${commandObj.name}<reset>: ${commandObj.description}\r\n`).join('');

        if (data) {
            // User typed 'help <command>', display detailed help including aliases
            const commandObj = mainCommands.find(cmd => cmd.name === data || cmd.aliases.includes(data));
            commandObj ? userManager.send(user.id, getDetailedCommandHelp(commandObj)) : userManager.send(user.id, `Unknown command: ${data}`);
        } else {
            // User typed 'help', list all main commands with their descriptions
            userManager.send(user.id, getMainCommandsHelp());
        }
    }
};