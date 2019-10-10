/* eslint-disable no-console, class-methods-use-this */
/* global window, fetch */

const getAPIBaseAddress = () => window.localStorage.getItem('statsAPI');
const getAPIKey = () => window.localStorage.getItem('statsAPIKey');

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

    const headers = getHeaders('text/plain');

    try {
      const res = await fetch(`${getAPIBaseAddress()}/room`, {
        method: 'POST',
        headers,
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
    const headers = getHeaders();

    try {
      const res = await fetch(`${getAPIBaseAddress()}/matches`, {
        method: 'POST',
        headers,
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
}

module.exports = {
  Api,
  hooks: {
    onRoomLink: ['sendRoomLink'],
  },
};
