class StatsGathering {
  constructor(server, { api }) {
    this.server = server;
    this.api = api;
    this.playerInfos = {};
    this.clearState();
    window.getPlayerInfos = () => this.playerInfos;
  }

  clearState() {
    this.enabled = this.api.isEnabled();
    this.startDate = null;
    this.originalPlayers = [];
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

  mapPlayer(p) {
    return {
      matchName: p.name,
      playerId: this.playerInfos[p.name] && this.playerInfos[p.name].playerId,
    };
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
      player: this.mapPlayer(this.lastKick),
    };

    if (this.lastKick.team !== team) {
      goalDescription.own = true;
    } else if (this.assistKick.id !== this.lastKick.id && this.assistKick.team === team) {
      goalDescription.assist = this.mapPlayer(this.assistKick);
    }

    this.goals.push(goalDescription);

    this.assistKick = {};
    this.lastKick = {};
  }

  sendStats(scores) {
    if (!this.enabled) {
      return;
    }

    const playersRed = this.originalPlayers.filter(p => p.team === 1).map(p => this.mapPlayer(p));
    const playersBlue = this.originalPlayers.filter(p => p.team === 2).map(p => this.mapPlayer(p));

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

    // this.api.sendMatch(matchData);
    console.log(matchData);
  }

  startGatheringStats() {
    this.clearState();

    if (!this.enabled) {
      return;
    }

    this.startDate = new Date().toISOString();
    this.originalPlayers = this.server.players;
  }

  isPlayerNickUnique(player) {
    const playersWithSameNick = this.server.players.filter(p => p.name === player.name);

    if (playersWithSameNick.length > 1) {
      this.server.sendChat('Unable to track your stats, you need to change your nick', player.id);
      return false;
    }

    return true;
  }

  async lookupPlayerData(player) {
    if (!this.enabled) {
      return;
    }

    if (!this.isPlayerNickUnique(player)) {
      return;
    }

    const playerInfo = await this.api.lookupPlayer(player);

    if (playerInfo) {
      this.playerInfos[player.name] = playerInfo;
    }
  }

  async register(player, login, password) {
    if (!this.enabled) {
      return;
    }

    if (!this.isPlayerNickUnique(player)) {
      return;
    }

    if (!login || !password) {
      this.server.sendChat('You have to provide both login and password.', player.id);
      return;
    }

    const playerInfo = await this.api.registerPlayer(player, login, password);

    if (playerInfo) {
      this.playerInfos[player.name] = playerInfo;
    }
  }

  async login(player, login, password) {
    if (!this.enabled) {
      return;
    }

    if (!this.isPlayerNickUnique(player)) {
      return;
    }

    if (!login || !password) {
      this.server.sendChat('You have to provide both login and password.', player.id);
      return;
    }

    const playerInfo = await this.api.loginPlayer(player, login, password);

    if (playerInfo) {
      this.playerInfos[player.name] = playerInfo;
    }
  }

  whois(player, nick) {
    if (!this.enabled) {
      this.server.sendChat('Stats gathering is disabled.', player.id);
      return;
    }

    const playersInLobby = this.server.players.map(p => p.name);

    if (playersInLobby.length === 0) {
      this.server.sendChat('Unable to execute whois command.', player.id);
      return;
    }

    if (nick) {
      if (!playersInLobby.includes(nick)) {
        this.server.sendChat('Unable to check identity of player not present in lobby.', player.id);
        return;
      }

      const playerInfo = this.playerInfos[nick];

      if (playerInfo) {
        this.server.sendChat(`Player ${nick} is logged in as ${playerInfo.login}.`, player.id);
        return;
      }

      this.server.sendChat(`Player ${nick} is not logged in.`, player.id);
    } else {
      const infos = playersInLobby.reduce((acc, p) => {
        const playerInfo = this.playerInfos[p];

        if (playerInfo) {
          return acc.concat(`Player ${p} is logged in as ${playerInfo.login}.`);
        }

        return acc;
      }, []);

      if (infos.length === 0) {
        this.server.sendChat('No logged in players in lobby.', player.id);
        return;
      }

      this.server.sendChat(infos.join('\n'), player.id);
    }
  }
}

module.exports = {
  plugin: StatsGathering,
  hooks: {
    onGameStart: ['startGatheringStats'],
    onPlayerBallKick: ['registerNewKick'],
    onTeamGoal: ['addNewGoal'],
    onTeamVictory: ['sendStats'],
    onPlayerJoin: ['lookupPlayerData'],
  },
  commands: {
    register: {
      help: 'register new player',
      usage: [
        '!register [login] [password]',
      ],
    },
    login: {
      help: 'log in existing player',
      usage: [
        '!login [login] [password]',
      ],
    },
    whois: {
      help: 'check identity of specific player or all players in the lobby',
      usage: [
        '!whois - to see identity of all logged players in lobby',
        '!whois [nick] - to see identity of specific logged player',
      ],
    },
  },
};
