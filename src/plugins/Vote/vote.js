class Vote {
  constructor(server, voteManager, initiatingPlayer, actionDescription, onSuccess, voteTime) {
    this.server = server;
    this.voteManager = voteManager;
    this.actionDescription = actionDescription;
    this.votedYes = new Set([initiatingPlayer.id]);
    this.votedNo = new Set();
    this.onSuccess = onSuccess;
    this.voteTimeout = setTimeout(() => {
      this.server.sendChat('Voting time elapsed!');
      this.stopVote();
    }, voteTime * 1000);
    this.checkVote();
  }

  stopVote() {
    clearTimeout(this.voteTimeout);
    this.voteManager.voteEnded();
  }

  checkVote() {
    const { players } = this.server;

    if (this.votedYes.size > players.length / 2) {
      this.server.sendChat(`Voted to ${this.actionDescription}`);
      this.onSuccess();
    } else if (this.votedNo.size > players.length / 2) {
      this.server.sendChat(`Voted to not ${this.actionDescription}`);
    }

    this.stopVote();
  }

  writeVoteStats(player) {
    this.server.sendChat(`Vote to ${this.actionDescription} - Y: ${this.votedYes.size} / N: ${this.votedNo.size}`, player);
  }

  voteYes(player) {
    if (!this.votedYes.has(player.id)) {
      this.votedYes.add(player.id);
      this.writeVoteStats();
      this.checkVote();
    }
  }

  voteNo(player) {
    if (!this.votedNo.has(player.id)) {
      this.votedNo.add(player.id);
      this.writeVoteStats();
      this.checkVote();
    }
  }

  playerLeft(player) {
    this.votedYes.delete(player.id);
    this.votedNo.delete(player.id);
    this.checkVote();
  }
}

module.exports = Vote;
