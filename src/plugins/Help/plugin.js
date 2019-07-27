class Help {
  constructor(server) {
    this.server = server;
  }

  greet(player) {
    this.server.sendChat('Say `!help` for help', player.id);
  }

  help(player, commandName) {
    if (!commandName) {
      this.server.sendChat('Say:', player.id);

      Object.keys(this.server.commands)
        .forEach((command) => {
          this.server.sendChat(`!${command} - ${this.server.commands[command].help}`, player.id);
        });

      return;
    }

    if (!this.server.commands[commandName]) {
      this.server.sendChat(`Command !${commandName} does not exist`, player.id);
      return;
    }

    this.server.sendChat(`Help for !${commandName}:`, player.id);
    this.server.commands[commandName].usage.forEach((helpLine) => {
      this.server.sendChat(helpLine, player.id);
    });
  }
}

module.exports = {
  plugin: Help,
  hooks: {
    onPlayerJoin: ['greet'],
  },
  commands: {
    help: {
      help: 'display this message - say !help [command] to learn about command usage (e.g. !help help)',
      usage: [
        '!help - list all commands', '!help [command] - learn about specific command usage (e.g. !help help)',
      ],
    },
  },
};
