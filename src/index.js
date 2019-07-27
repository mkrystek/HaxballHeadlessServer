/* eslint-disable no-console,no-restricted-syntax */
/* global window, HBInit */
const Server = require('./server');

window.onHBLoaded = () => {
  const room = HBInit({
    roomName: '',
    maxPlayers: 100,
    public: false,
    playerName: '',
    password: '',
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
