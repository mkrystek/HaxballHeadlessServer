/* eslint-disable no-console,no-restricted-syntax */
/* global document, window, HBInit */
const Server = require('./server');

function setOption(optionName, message) {
  // eslint-disable-next-line no-alert
  window.localStorage.setItem(optionName, window.prompt(message));
}

function registerOptionSetting(name, optionName) {
  const button = document.createElement('button');
  button.innerHTML = `Set ${name}`;
  button.addEventListener('click', () => setOption(optionName, `Provide new ${name}`));
  document.body.prepend(button);
}

registerOptionSetting('room password', 'password');
registerOptionSetting('host player name', 'serverName');
registerOptionSetting('room name', 'roomName');

window.onHBLoaded = () => {
  const ROOM_NAME = window.localStorage.getItem('roomName') || 'Headless Server Room';
  const SERVER_NAME = window.localStorage.getItem('serverName') || 'Server';
  const PASSWORD = window.localStorage.getItem('password') || undefined;

  const room = HBInit({
    roomName: ROOM_NAME,
    maxPlayers: 100,
    public: false,
    playerName: SERVER_NAME,
    password: PASSWORD,
  });

  const server = new Server.Server(room);

  const pluginHooks = {};

  function addHook(eventName, hook) {
    if (eventName === 'onPlayerChat') {
      console.error('Direct interception of chat not allowed.');
      return;
    }

    if (!room[eventName]) {
      room[eventName] = (...args) => {
        pluginHooks[eventName].forEach(pluginHook => pluginHook(...args));
      };
    }

    if (!pluginHooks[eventName]) {
      pluginHooks[eventName] = [];
    }

    pluginHooks[eventName].push(hook);
  }

  function loadHooks(hookProvider, hooks) {
    for (const [eventName, eventHooks] of Object.entries(hooks || {})) {
      for (const eventHook of eventHooks) {
        addHook(eventName, hookProvider[eventHook].bind(hookProvider));
      }
    }
  }

  function loadPlugin(pluginName) {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const { plugin: Plugin, hooks, commands } = require(`./plugins/${pluginName}/plugin`);

    const plugin = new Plugin(server);

    loadHooks(plugin, hooks);

    for (const [commandName, commandDescriptor] of Object.entries(commands || {})) {
      server.addCommand(plugin, commandName, commandDescriptor);
    }
  }

  loadHooks(server, Server.hooks);
  loadPlugin('Help');
  loadPlugin('ScoreTracking');
  loadPlugin('ReadyPlayers');
  loadPlugin('Vote');
  loadPlugin('AnnounceWinners');
  loadPlugin('ReconnectToMatch');
};