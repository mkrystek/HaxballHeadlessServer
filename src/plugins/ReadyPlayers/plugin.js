class ReadyPlayers {
  constructor(server) {
    this.server = server;
    this.readyPlayers = new Set();
  }

  checkGameRunning(player) {
    if (this.server.gameStarted) {
      this.server.sendChat('Game is already running!', player.id);
      return true;
    }

    return false;
  }

  checkGameStart() {
    const { players } = this.server;

    if (
      !this.server.gameStarted
      && players.length
      && players.every(p => this.readyPlayers.has(p.id))
    ) {
      if (players.length % 2 === 1) {
        this.server.sendChat('All players ready but teams would be uneven. Waiting.');
        return;
      }

      this.server.startGame();
    }
  }

  ready(player) {
    if (this.checkGameRunning(player)) return;
    this.readyPlayers.add(player.id);
    this.server.sendChat(`${player.name} is ready!`);
    this.waiting();
    this.checkGameStart();
  }

  notready(player) {
    if (this.checkGameRunning(player)) return;
    this.readyPlayers.delete(player.id);
    this.server.sendChat(`${player.name} is not ready!`);
    this.waiting();
  }

  waiting(player) {
    if (this.checkGameRunning(player)) return;
    const notReadyPlayers = this.server.players.filter(p => !this.readyPlayers.has(p.id));

    if (notReadyPlayers.length > 0) {
      this.server.sendChat(`Still waiting for ${notReadyPlayers.map(p => p.name)
        .join(', ')}`, player);
    } else {
      this.server.sendChat('Everyone is ready!', player);
    }
  }

  playerLeft(player) {
    this.readyPlayers.delete(player.id);
    this.checkGameStart();
  }

  gameStopped() {
    this.readyPlayers.clear();
  }
}

module.exports = {
  plugin: ReadyPlayers,
  hooks: {
    onPlayerLeave: ['playerLeft'],
    onGameStop: ['gameStopped'],
  },
  commands: {
    ready: {
      help: 'set your status to ready',
      usage: [
        '!ready - mark yourself as ready to start a match',
      ],
    },
    notready: {
      help: 'set your status to not ready',
      usage: [
        '!notready - mark yourself as not ready to start a match',
      ],
    },
    waiting: {
      help: 'list players that are not ready',
      usage: [
        '!waiting - list all players which are not ready yet',
      ],
    },
  },
};
