class Server {
  constructor(room) {
    this.room = room;
    this.redTeam = new Set();
    this.blueTeam = new Set();
    this.gameStarted = false;
    this.commands = {};

    this.setStadium('Huge');
    this.setScoreLimit(3);
    this.setTimeLimit(5);
    this.room.setTeamsLock(true);

    this.room.onPlayerChat = (player, message) => {
      if (!message.startsWith('!')) {
        return true;
      }

      const args = message.split(' ');
      const commandName = args.shift()
        .substring(1);

      if (!this.commands[commandName]) {
        this.sendChat(`Command !${commandName} does not exist`, player.id);
        return true;
      }

      this.commands[commandName].action(player, ...args);

      return false;
    };
  }

  static get allowedStadiums() {
    return new Set(['Classic', 'Easy', 'Small', 'Big', 'Rounded', 'Hockey', 'Big Hockey', 'Big Easy', 'Big Rounded', 'Huge']);
  }

  get players() {
    return this.room.getPlayerList()
      .filter(player => player.id !== 0);
  }

  setStadium(stadiumName) {
    if (this.gameStarted) return;

    this.stadium = stadiumName;
    this.room.setDefaultStadium(stadiumName);
  }

  setTimeLimit(timeLimit) {
    if (this.gameStarted) return;

    this.timeLimit = timeLimit;
    this.room.setTimeLimit(timeLimit);
  }

  setScoreLimit(scoreLimit) {
    if (this.gameStarted) return;

    this.scoreLimit = scoreLimit;
    this.room.setScoreLimit(scoreLimit);
  }

  startGame() {
    if (this.gameStarted) {
      return;
    }

    const { players } = this;

    this.gameStarted = true;

    players.sort(() => Math.random() - 0.5);
    players.forEach((player, i) => {
      const team = (i % 2) + 1;

      this.room.setPlayerTeam(player.id, team);
      if (team === 1) {
        this.redTeam.add(player.name);
      } else {
        this.blueTeam.add(player.name);
      }
    });

    this.room.startGame();
  }

  sendChat(message, player) {
    this.room.sendChat(message, player);
  }

  addCommand(plugin, commandName, commandDescriptor) {
    this.commands[commandName] = {
      action: plugin[commandName].bind(plugin),
      help: commandDescriptor.help,
      usage: commandDescriptor.usage,
    };
  }

  stopGameIfTeamIsEmpty() {
    if (this.gameStarted) {
      const { players } = this;
      const redPlayers = players.filter(p => p.team === 1);
      const bluePlayers = players.filter(p => p.team === 2);

      if (redPlayers.length === 0 || bluePlayers.length === 0) {
        this.stopGame();
      }
    }
  }

  stopGame() {
    this.gameStarted = false;
    this.players.forEach((player) => {
      this.room.setPlayerTeam(player.id, 0);
    });
    this.redTeam.clear();
    this.blueTeam.clear();
    this.room.stopGame();
  }
}

module.exports = {
  Server,
  hooks: {
    onPlayerLeave: ['stopGameIfTeamIsEmpty'],
    onGameStop: ['stopGame'],
  },
};
