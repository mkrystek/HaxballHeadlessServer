/* global window, fetch */

class StatsGathering {
  constructor(server) {
    this.server = server;
    this.clearState();
  }

  clearState() {
    this.enabled = window.localStorage.getItem('statsAPI') !== undefined;
    this.startDate = null;
    this.assistKick = {};
    this.lastKick = {};
    this.goalsRed = 0;
    this.goalsBlue = 0;
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

    if (team === 1) {
      this.goalsRed += 1;
    } else {
      this.goalsBlue += 1;
    }

    const goalDescription = {
      goalDate: new Date().toISOString(),
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

  sendStats() {
    if (!this.enabled) {
      return;
    }

    const playersRed = this.server.players.filter(p => p.team === 1).map(p => p.name);
    const playersBlue = this.server.players.filter(p => p.team === 2).map(p => p.name);

    const matchData = {
      startDate: this.startDate,
      endDate: new Date().toISOString(),
      playersRed,
      playersBlue,
      stadium: this.server.stadium,
      goalsBlue: this.goalsBlue,
      goalsRed: this.goalsRed,
      goalsDescription: this.goals,
    };

    const headers = window.localStorage.getItem('statsAPIKey') === undefined
      ? { 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json', 'X-Api-Key': window.localStorage.getItem('statsAPIKey') };
    fetch(window.localStorage.getItem('statsAPI'), { method: 'POST', headers, body: JSON.stringify(matchData) })
      .then((res) => {
        if (res.ok) {
          this.server.sendChat('Match results sent to stats server');
        } else {
          this.server.sendChat(`Unable to send match results to stats server, response: ${res.status}`);
        }
      })
      .catch(e => this.server.sendChat(`Unable to send match results to stats server, reason: ${e.message}`));
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
