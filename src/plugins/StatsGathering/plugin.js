class StatsGathering {
  constructor(server, { api }) {
    this.server = server;
    this.api = api;
    this.clearState();
  }

  clearState() {
    this.enabled = this.api.isEnabled();
    this.startDate = null;
    this.assistKick = {};
    this.lastKick = {};
    this.goals = [];
  }

  registerNewKick(player) {
    if (!this.enabled) {
      return;
    }

    this.assistKick = this.lastKick;
    this.lastKick = player;
  }

  addNewGoal(team) {
    if (!this.enabled) {
      return;
    }

    const scores = this.server.room.getScores();
    const goalTime = Math.ceil(scores.time);

    const goalDescription = {
      goalTime,
      team: team === 1 ? 'red' : 'blue',
      player: this.lastKick.name,
    };

    if (this.lastKick.team !== team) {
      goalDescription.own = true;
    } else if (this.assistKick.id !== this.lastKick.id && this.assistKick.team === team) {
      goalDescription.assist = this.assistKick.name;
    }

    this.goals.push(goalDescription);

    this.assistKick = {};
    this.lastKick = {};
  }

  sendStats(scores) {
    if (!this.enabled) {
      return;
    }

    const playersRed = this.server.players.filter(p => p.team === 1).map(p => p.name);
    const playersBlue = this.server.players.filter(p => p.team === 2).map(p => p.name);

    const matchData = {
      startDate: this.startDate,
      endDate: new Date().toISOString(),
      duration: Math.ceil(scores.time),
      playersRed,
      playersBlue,
      stadium: this.server.stadium,
      goalsBlue: scores.blue,
      goalsRed: scores.red,
      goalsDescription: this.goals,
    };

    this.api.sendMatch(matchData);
  }

  startGatheringStats() {
    this.clearState();

    if (!this.enabled) {
      return;
    }

    this.startDate = new Date().toISOString();
  }
}

module.exports = {
  plugin: StatsGathering,
  hooks: {
    onGameStart: ['startGatheringStats'],
    onPlayerBallKick: ['registerNewKick'],
    onTeamGoal: ['addNewGoal'],
    onTeamVictory: ['sendStats'],
  },
};
