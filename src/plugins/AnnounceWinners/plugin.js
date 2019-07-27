class AnnounceWinners {
  constructor(server) {
    this.server = server;
  }

  announce(scores) {
    let winningTeam;

    if (scores.red > scores.blue) {
      winningTeam = 1;
    } else {
      winningTeam = 2;
    }

    const winners = this.server.players.filter(p => p.team === winningTeam);
    this.server.sendChat(`Winners: ${winners.map(p => p.name)
      .join(', ')}`);
  }
}

module.exports = {
  plugin: AnnounceWinners,
  hooks: {
    onTeamVictory: ['announce'],
  },
};
