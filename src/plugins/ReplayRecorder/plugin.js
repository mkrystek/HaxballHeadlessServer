/* global btoa */

class ReplayRecorder {
  constructor(server, { api }) {
    this.room = server.room;
    this.api = api;
    this.isRecordingActive = false;
  }

  stopRecording() {
    this.isRecordingActive = false;
    return this.room.stopRecording();
  }

  onMatchStart() {
    if (this.isRecordingActive) {
      this.stopRecording();
    }

    if (this.api.isEnabled()) {
      this.isRecordingActive = true;
      this.room.startRecording();
    }
  }

  onMatchEnd() {
    if (this.isRecordingActive && this.api.isEnabled()) {
      const content = this.stopRecording();

      if (content !== null) {
        this.api.sendMatchReplay(btoa(content));
      }
    }
  }
}

module.exports = {
  plugin: ReplayRecorder,
  hooks: {
    onGameStart: ['onMatchStart'],
    onTeamVictory: ['onMatchEnd'],
  },
};
