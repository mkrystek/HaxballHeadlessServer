class ReconnectToMatch {
  constructor(server) {
    this.server = server;
  }

  addPlayerToMatch(player) {
    if (this.server.gameStarted) {
      if (this.server.redTeam.has(player.name)) {
        this.server.room.setPlayerTeam(player.id, 1);
      } else if (this.server.blueTeam.has(player.name)) {
        this.server.room.setPlayerTeam(player.id, 2);
      }
    }
  }
}

module.exports = {
  plugin: ReconnectToMatch,
  hooks: {
    onPlayerJoin: ['addPlayerToMatch'],
  },
};
