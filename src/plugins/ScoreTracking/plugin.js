class ScoreTracking {
  constructor(server) {
    this.server = server;
    this.clearState();
  }

  clearState() {
    this.assistKick = {};
    this.lastKick = {};
    this.goals = {
      red: [],
      blue: [],
    };
  }

  registerNewKick(player) {
    this.assistKick = this.lastKick;
    this.lastKick = player;
  }

  addNewGoal(team) {
    const scoringTeam = team === 1 ? this.goals.red : this.goals.blue;
    const scores = this.server.room.getScores();
    const time = Math.ceil(scores.time);

    let seconds = time % 60;
    const minutes = (time - seconds) / 60;
    seconds = String(seconds)
      .padStart(2, '0');

    let goalDescription;
    if (this.lastKick.team !== team) {
      goalDescription = `${this.lastKick.name} (OG) - ${minutes}:${seconds}`;
    } else if (this.assistKick.team !== team || this.lastKick.id === this.assistKick.id) {
      goalDescription = `${this.lastKick.name} - ${minutes}:${seconds}`;
    } else {
      goalDescription = `${this.lastKick.name}, A: ${this.assistKick.name} - ${minutes}:${seconds}`;
    }

    scoringTeam.push(goalDescription);

    this.assistKick = {};
    this.lastKick = {};

    this.server.sendChat(goalDescription);
  }

  printScore() {
    this.server.sendChat(`${this.goals.red.join(', ')} ${this.goals.red.length} - ${this.goals.blue.length} ${this.goals.blue.join(', ')}`);
  }
}

module.exports = {
  plugin: ScoreTracking,
  hooks: {
    onGameStart: ['clearState'],
    onPlayerBallKick: ['registerNewKick'],
    onTeamGoal: ['addNewGoal'],
    onTeamVictory: ['printScore'],
  },
};
