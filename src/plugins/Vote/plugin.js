const Vote = require('./vote');

const filterInt = (value) => {
  if (/^[-+]?(\d+|Infinity)$/.test(value)) {
    return Number(value);
  }

  return NaN;
};

class VoteManager {
  constructor(server) {
    this.server = server;
    this.voteTime = 60;
  }

  voteEnded() {
    delete this.voteInProgress;
  }

  vote(player, action, value) {
    if (this.server.gameStarted) {
      this.server.sendChat('Game is in progress, can\'t vote now!', player.id);
      return;
    }

    if (!action) {
      if (this.voteInProgress) {
        this.voteInProgress.writeVoteStats(player);
      } else {
        this.server.sendChat('There is no vote in progress.', player.id);
      }

      return;
    }

    if (this.voteInProgress) {
      this.server.sendChat('Another vote is already in progress!', player.id);
      return;
    }

    const allowedStadiums = new Set(['Classic', 'Easy', 'Small', 'Big', 'Rounded', 'Hockey', 'Big Hockey', 'Big Easy', 'Big Rounded', 'Huge']);
    let onSuccess;
    let actionDescription;

    switch (action) {
      case 'stadium': {
        if (!allowedStadiums.has(value)) {
          this.server.sendChat(`Stadium name must be one of ${Array.from(allowedStadiums)
            .join(', ')}!`, player.id);
          break;
        }

        actionDescription = `change stadium to ${value}`;

        onSuccess = () => this.server.setStadium(value);
        break;
      }
      case 'time': {
        const time = filterInt(value);

        if (Number.isNaN(time) || time < 0) {
          this.server.sendChat('Time must be a non-negative integer!', player.id);
          break;
        }

        actionDescription = `change time limit to ${value}`;

        onSuccess = () => this.server.setTimeLimit(time);
        break;
      }
      case 'score': {
        const score = filterInt(value);

        if (Number.isNaN(score) || score < 0) {
          this.server.sendChat('Score must be a non-negative integer!', player.id);
          break;
        }

        actionDescription = `change score limit to ${value}`;

        onSuccess = () => this.server.setScoreLimit(score);
        break;
      }
      case 'start': {
        actionDescription = 'force start the game';

        onSuccess = () => this.server.startGame();
        break;
      }
      default: {
        this.server.sendChat(`Can't vote on ${action}!`, player.id);
        return;
      }
    }

    this.server.sendChat(`${player.name} started a vote to ${actionDescription}!`);
    this.server.sendChat(`Vote with !yes or !no - ${this.voteTime}s remaining`);

    this.voteInProgress = new Vote(
      this.server,
      this,
      player,
      actionDescription,
      onSuccess,
      this.voteTime,
    );
  }

  yes(player) {
    if (!this.voteInProgress) {
      this.server.sendChat('There\'s nothing to vote on!', player.id);
      return;
    }

    this.voteInProgress.voteYes(player);
  }

  no(player) {
    if (!this.voteInProgress) {
      this.server.sendChat('There\'s nothing to vote on!', player.id);
      return;
    }

    this.voteInProgress.voteNo(player);
  }

  stopVote() {
    if (this.voteInProgress) {
      this.voteInProgress.stopVote();
    }
  }
}

module.exports = {
  plugin: VoteManager,
  hooks: {
    onGameStart: ['stopVote'],
  },
  commands: {
    vote: {
      help: 'hold a vote',
      usage: [
        '!vote - print details of current vote',
        '!vote stadium [stadiumName] - change stadium',
        '!vote time [time] - change time limit',
        '!vote score [score] - change score limit',
        '!vote start - force start game',
      ],
    },
    yes: {
      help: 'say yes to current vote',
      usage: [
        '!yes - agree to current vote',
      ],
    },
    no: {
      help: 'say yes to current vote',
      usage: [
        '!no - disagree with current vote',
      ],
    },
  },
};
