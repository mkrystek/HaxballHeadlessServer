/* eslint-disable no-console, class-methods-use-this */
/* global window, fetch */

const getAPIBaseAddress = () => window.localStorage.getItem('statsAPI');
const getAPIKey = () => window.localStorage.getItem('statsAPIKey');

const getAPIAddress = path => `${getAPIBaseAddress()}/${path}`;

const getHeaders = (contentType = 'application/json') => {
  if (getAPIKey() === undefined) {
    return { 'Content-Type': contentType };
  }

  return { 'Content-Type': contentType, 'X-Api-Key': getAPIKey() };
};

class Api {
  constructor(server) {
    this.server = server;
  }

  isEnabled() {
    return getAPIBaseAddress() !== undefined;
  }

  async sendRoomLink(link) {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const res = await fetch(getAPIAddress('room'), {
        method: 'POST',
        headers: getHeaders('text/plain'),
        body: link,
      });

      if (!res.ok) {
        console.error(`Unable to post link to room, response: ${res.status}`);
      }
    } catch (e) {
      console.error(`Unable to post link to room, reason: ${e.message}`);
    }
  }

  async sendMatch(matchData) {
    try {
      const res = await fetch(getAPIAddress('matches'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(matchData),
      });

      if (res.ok) {
        this.server.sendChat('Match results sent to stats server');
      } else {
        this.server.sendChat(`Unable to send match results to stats server, response: ${res.status}`);
      }
    } catch (e) {
      this.server.sendChat(`Unable to send match results to stats server, reason: ${e.message}`);
    }
  }

  async lookupPlayer(player) {
    try {
      const res = await fetch(getAPIAddress('auth/getByAuth'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          auth: player.auth,
        }),
      });

      if (res.status === 200) {
        const { playerId, login } = await res.json();
        this.server.sendChat(`Welcome back, ${login}! If this is not you, consider logging in or registering.`, player.id);
        return playerId;
      }
      this.server.sendChat('Unable to verify your identity. Consider logging in or registering.', player.id);
    } catch (e) {
      this.server.sendChat(`Unable to get playerID of player ${player.name}, reason: ${e.message}`, player.id);
    }

    return null;
  }

  async registerPlayer(player, login, password) {
    try {
      const res = await fetch(getAPIAddress('auth/register'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          login,
          password,
          auth: player.auth,
        }),
      });

      if (res.status === 201) {
        const { playerId } = await res.json();
        this.server.sendChat(`Successfully registered as ${login}.`, player.id);
        return playerId;
      }

      const message = res.status === 409
        ? `Unable to perform registration, player with login ${login} already exists.`
        : `Unable to perform registration, response: ${res.status}.`;
      this.server.sendChat(message, player.id);
    } catch (e) {
      this.server.sendChat(`Unable to perform registration, reason: ${e.message}`, player.id);
    }

    return null;
  }

  async loginPlayer(player, login, password) {
    try {
      const res = await fetch(getAPIAddress('auth/login'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          login,
          password,
          auth: player.auth,
        }),
      });

      if (res.status === 200) {
        const { playerId } = await res.json();
        this.server.sendChat(`Welcome back, ${login}!`, player.id);
        return playerId;
      }

      this.server.sendChat(`Unable to log in player, response: ${res.status}.`, player.id);
    } catch (e) {
      this.server.sendChat(`Unable to log in player, reason: ${e.message}`, player.id);
    }

    return null;
  }
}

module.exports = {
  Api,
  hooks: {
    onRoomLink: ['sendRoomLink'],
  },
};
