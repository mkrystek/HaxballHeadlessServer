// ==UserScript==
// @name Haxball Headless Server
// @version 0.13.0
// @author Xylem
// @match https://*.haxball.com/headless
// @updateURL https://raw.githubusercontent.com/Xylem/HaxballHeadlessServer/master/dist/main.meta.js
// @downloadURL https://raw.githubusercontent.com/Xylem/HaxballHeadlessServer/master/dist/main.user.js
// ==/UserScript==

function main(){!function(e){var t={};function s(i){if(t[i])return t[i].exports;var r=t[i]={i:i,l:!1,exports:{}};return e[i].call(r.exports,r,r.exports,s),r.l=!0,r.exports}s.m=e,s.c=t,s.d=function(e,t,i){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(s.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)s.d(i,r,function(t){return e[t]}.bind(null,r));return i},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=0)}([function(e,t,s){const i=s(1),r=s(2);function a(e,t){const s=document.createElement("button");s.innerHTML=`Set ${e}`,s.addEventListener("click",()=>(function(e,t){window.localStorage.setItem(e,window.prompt(t))})(t,`Provide new ${e}`)),document.body.prepend(s)}a("room password","password"),a("room name","roomName"),a("stats API address","statsAPI"),a("stats API key","statsAPIKey"),window.onHBLoaded=()=>{const e=window.localStorage.getItem("roomName")||"Headless Server Room",t=window.localStorage.getItem("password")||void 0,a=HBInit({roomName:e,maxPlayers:100,public:!1,noPlayer:!0,password:t}),o=new i.Server(a),n=new r.Api(o),h={};function d(e,t){"onPlayerChat"!==e?(a[e]||(a[e]=(...t)=>{h[e].forEach(e=>e(...t))}),h[e]||(h[e]=[]),h[e].push(t)):console.error("Direct interception of chat not allowed.")}function l(e,t){for(const[s,i]of Object.entries(t||{}))for(const t of i)d(s,e[t].bind(e))}function c(e,t={}){const{plugin:i,hooks:r,commands:a}=s(3)(`./${e}/plugin`),n=new i(o,t);l(n,r);for(const[e,t]of Object.entries(a||{}))o.addCommand(n,e,t)}l(o,i.hooks),l(n,r.hooks),c("Help"),c("ScoreTracking"),c("ReadyPlayers"),c("Vote"),c("AnnounceWinners"),c("ReconnectToMatch"),c("StatsGathering",{api:n}),c("ReplayRecorder",{api:n})}},function(e,t){e.exports={Server:class{constructor(e){this.room=e,this.redTeam=new Set,this.blueTeam=new Set,this.playerAuth={},this.gameStarted=!1,this.commands={},this.setStadium("Huge"),this.setScoreLimit(3),this.setTimeLimit(5),this.room.setTeamsLock(!0),this.room.onPlayerChat=(e,t)=>{if(!t.startsWith("!"))return!0;const s=t.split(" "),i=s.shift().substring(1);return this.commands[i]?(this.commands[i].action({...e,auth:this.playerAuth[e.id]},...s),!1):(this.sendChat(`Command !${i} does not exist`,e.id),!0)}}get players(){return this.room.getPlayerList().map(e=>({...e,auth:this.playerAuth[e.id]}))}rememberPlayerAuth(e){this.playerAuth[e.id]=e.auth}deletePlayerAuth(e){delete this.playerAuth[e.id]}setStadium(e){this.gameStarted||(this.stadium=e,this.room.setDefaultStadium(e))}setTimeLimit(e){this.gameStarted||(this.timeLimit=e,this.room.setTimeLimit(e))}setScoreLimit(e){this.gameStarted||(this.scoreLimit=e,this.room.setScoreLimit(e))}startGame(){if(this.gameStarted)return;const{players:e}=this;this.gameStarted=!0,e.sort(()=>Math.random()-.5),e.forEach((e,t)=>{const s=t%2+1;this.room.setPlayerTeam(e.id,s),1===s?this.redTeam.add(e.auth):this.blueTeam.add(e.auth)}),this.room.startGame()}sendChat(e,t){this.room.sendAnnouncement(e,t,parseInt("#efc131".slice(1),16),"italic",0)}addCommand(e,t,s){this.commands[t]={action:e[t].bind(e),help:s.help,usage:s.usage}}stopGameIfTeamIsEmpty(){if(this.gameStarted){const{players:e}=this,t=e.filter(e=>1===e.team),s=e.filter(e=>2===e.team);0!==t.length&&0!==s.length||this.stopGame()}}stopGame(){this.gameStarted=!1,this.players.forEach(e=>{this.room.setPlayerTeam(e.id,0)}),this.redTeam.clear(),this.blueTeam.clear(),this.room.stopGame()}},hooks:{onPlayerJoin:["rememberPlayerAuth"],onPlayerLeave:["stopGameIfTeamIsEmpty","deletePlayerAuth"],onGameStop:["stopGame"]}}},function(e,t){const s=()=>window.localStorage.getItem("statsAPI"),i=()=>window.localStorage.getItem("statsAPIKey"),r=e=>`${s()}/${e}`,a=(e="application/json")=>void 0===i()?{"Content-Type":e}:{"Content-Type":e,"X-Api-Key":i()};e.exports={Api:class{constructor(e){this.server=e}isEnabled(){return void 0!==s()}async sendRoomLink(e){if(this.isEnabled())try{const t=await fetch(r("room"),{method:"POST",headers:a("text/plain"),body:e});t.ok||console.error(`Unable to post link to room, response: ${t.status}`)}catch(e){console.error(`Unable to post link to room, reason: ${e.message}`)}}async sendMatch(e){try{const t=await fetch(r("matches"),{method:"POST",headers:a(),body:JSON.stringify(e)});t.ok?this.server.sendChat("Match results sent to stats server"):this.server.sendChat(`Unable to send match results to stats server, response: ${t.status}`)}catch(e){this.server.sendChat(`Unable to send match results to stats server, reason: ${e.message}`)}}async lookupPlayer(e){try{const t=await fetch(r("auth/getByAuth"),{method:"POST",headers:a(),body:JSON.stringify({auth:e.auth})});if(200===t.status){const{playerId:s,login:i}=await t.json();return this.server.sendChat(`Welcome back, ${i}! If this is not you, consider logging in or registering.`,e.id),s}this.server.sendChat("Unable to verify your identity. Consider logging in or registering.",e.id)}catch(t){this.server.sendChat(`Unable to get playerID of player ${e.name}, reason: ${t.message}`,e.id)}return null}async registerPlayer(e,t,s){try{const i=await fetch(r("auth/register"),{method:"POST",headers:a(),body:JSON.stringify({login:t,password:s,auth:e.auth})});if(201===i.status){const{playerId:s}=await i.json();return this.server.sendChat(`Successfully registered as ${t}.`,e.id),s}const o=409===i.status?`Unable to perform registration, player with login ${t} already exists.`:`Unable to perform registration, response: ${i.status}.`;this.server.sendChat(o,e.id)}catch(t){this.server.sendChat(`Unable to perform registration, reason: ${t.message}`,e.id)}return null}async loginPlayer(e,t,s){try{const i=await fetch(r("auth/login"),{method:"POST",headers:a(),body:JSON.stringify({login:t,password:s,auth:e.auth})});if(200===i.status){const{playerId:s}=await i.json();return this.server.sendChat(`Welcome back, ${t}!`,e.id),s}this.server.sendChat(`Unable to log in player, response: ${i.status}.`,e.id)}catch(t){this.server.sendChat(`Unable to log in player, reason: ${t.message}`,e.id)}return null}async sendMatchReplay(e){try{const t=await fetch(r("replays"),{method:"POST",headers:a("text/plain"),body:e});201!==t.status&&console.error(`Unable to send match replay (${t.status}), reason: ${await t.text()}`)}catch(e){console.error(`Unable to send match replay, reason: ${e.message}`)}}},hooks:{onRoomLink:["sendRoomLink"]}}},function(e,t,s){var i={"./AnnounceWinners/plugin":4,"./Help/plugin":5,"./ReadyPlayers/plugin":6,"./ReconnectToMatch/plugin":7,"./ReplayRecorder/plugin":8,"./ScoreTracking/plugin":9,"./StatsGathering/plugin":10,"./Vote/plugin":11};function r(e){var t=a(e);return s(t)}function a(e){if(!s.o(i,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return i[e]}r.keys=function(){return Object.keys(i)},r.resolve=a,e.exports=r,r.id=3},function(e,t){e.exports={plugin:class{constructor(e){this.server=e}announce(e){let t;t=e.red>e.blue?1:2;const s=this.server.players.filter(e=>e.team===t);this.server.sendChat(`Winners: ${s.map(e=>e.name).join(", ")}`)}},hooks:{onTeamVictory:["announce"]}}},function(e,t){e.exports={plugin:class{constructor(e){this.server=e}greet(e){this.server.sendChat("Say `!help` for help",e.id)}help(e,t){if(!t)return this.server.sendChat("Say:",e.id),void Object.keys(this.server.commands).forEach(t=>{this.server.sendChat(`!${t} - ${this.server.commands[t].help}`,e.id)});this.server.commands[t]?(this.server.sendChat(`Help for !${t}:`,e.id),this.server.commands[t].usage.forEach(t=>{this.server.sendChat(t,e.id)})):this.server.sendChat(`Command !${t} does not exist`,e.id)}},hooks:{onPlayerJoin:["greet"]},commands:{help:{help:"display this message - say !help [command] to learn about command usage (e.g. !help help)",usage:["!help - list all commands","!help [command] - learn about specific command usage (e.g. !help help)"]}}}},function(e,t){e.exports={plugin:class{constructor(e){this.server=e,this.readyPlayers=new Set}checkGameRunning(e){return!!this.server.gameStarted&&(this.server.sendChat("Game is already running!",e.id),!0)}checkGameStart(){const{players:e}=this.server;if(!this.server.gameStarted&&e.length&&e.every(e=>this.readyPlayers.has(e.id))){if(e.length%2==1)return void this.server.sendChat("All players ready but teams would be uneven. Waiting.");this.server.startGame()}}ready(e){this.checkGameRunning(e)||(this.readyPlayers.add(e.id),this.server.sendChat(`${e.name} is ready!`),this.waiting(),this.checkGameStart())}notready(e){this.checkGameRunning(e)||(this.readyPlayers.delete(e.id),this.server.sendChat(`${e.name} is not ready!`),this.waiting())}waiting(e){if(this.checkGameRunning(e))return;const t=this.server.players.filter(e=>!this.readyPlayers.has(e.id));t.length>0?this.server.sendChat(`Still waiting for ${t.map(e=>e.name).join(", ")}`,e):this.server.sendChat("Everyone is ready!",e)}playerLeft(e){this.readyPlayers.delete(e.id),this.checkGameStart()}gameStopped(){this.readyPlayers.clear()}},hooks:{onPlayerLeave:["playerLeft"],onGameStop:["gameStopped"]},commands:{ready:{help:"set your status to ready",usage:["!ready - mark yourself as ready to start a match"]},notready:{help:"set your status to not ready",usage:["!notready - mark yourself as not ready to start a match"]},waiting:{help:"list players that are not ready",usage:["!waiting - list all players which are not ready yet"]}}}},function(e,t){e.exports={plugin:class{constructor(e){this.server=e}addPlayerToMatch(e){this.server.gameStarted&&(this.server.redTeam.has(e.auth)?this.server.room.setPlayerTeam(e.id,1):this.server.blueTeam.has(e.auth)&&this.server.room.setPlayerTeam(e.id,2))}},hooks:{onPlayerJoin:["addPlayerToMatch"]}}},function(e,t){e.exports={plugin:class{constructor(e,{api:t}){this.room=e.room,this.api=t,this.isRecordingActive=!1}stopRecording(){return this.isRecordingActive=!1,this.room.stopRecording()}onMatchStart(){this.isRecordingActive&&this.stopRecording(),this.api.isEnabled()&&(this.isRecordingActive=!0,this.room.startRecording())}onMatchEnd(){if(this.isRecordingActive&&this.api.isEnabled()){const e=this.stopRecording();null!==e&&this.api.sendMatchReplay(btoa(e))}}},hooks:{onGameStart:["onMatchStart"],onTeamVictory:["onMatchEnd"]}}},function(e,t){e.exports={plugin:class{constructor(e){this.server=e,this.clearState()}clearState(){this.assistKick={},this.lastKick={},this.goals={red:[],blue:[]}}registerNewKick(e){this.assistKick=this.lastKick,this.lastKick=e}addNewGoal(e){const t=1===e?this.goals.red:this.goals.blue,s=this.server.room.getScores(),i=Math.ceil(s.time);let r=i%60;const a=(i-r)/60;let o;r=String(r).padStart(2,"0"),o=this.lastKick.team!==e?`${this.lastKick.name} (OG) - ${a}:${r}`:this.assistKick.team!==e||this.lastKick.id===this.assistKick.id?`${this.lastKick.name} - ${a}:${r}`:`${this.lastKick.name}, A: ${this.assistKick.name} - ${a}:${r}`,t.push(o),this.assistKick={},this.lastKick={},this.server.sendChat(o)}printScore(){this.server.sendChat(`${this.goals.red.join(", ")} ${this.goals.red.length} - ${this.goals.blue.length} ${this.goals.blue.join(", ")}`)}},hooks:{onGameStart:["clearState"],onPlayerBallKick:["registerNewKick"],onTeamGoal:["addNewGoal"],onTeamVictory:["printScore"]}}},function(e,t){e.exports={plugin:class{constructor(e,{api:t}){this.server=e,this.api=t,this.playerIds={},this.clearState()}clearState(){this.enabled=this.api.isEnabled(),this.startDate=null,this.assistKick={},this.lastKick={},this.goals=[]}registerNewKick(e){this.enabled&&(this.assistKick=this.lastKick,this.lastKick=e)}addNewGoal(e){if(!this.enabled)return;const t=this.server.room.getScores(),s={goalTime:Math.ceil(t.time),team:1===e?"red":"blue",player:this.lastKick.name};this.lastKick.team!==e?s.own=!0:this.assistKick.id!==this.lastKick.id&&this.assistKick.team===e&&(s.assist=this.assistKick.name),this.goals.push(s),this.assistKick={},this.lastKick={}}sendStats(e){if(!this.enabled)return;const t=e=>({matchName:e.name,playerId:this.playerIds[e.auth]}),s=this.server.players.filter(e=>1===e.team).map(t),i=this.server.players.filter(e=>2===e.team).map(t),r={startDate:this.startDate,endDate:(new Date).toISOString(),duration:Math.ceil(e.time),playersRed:s,playersBlue:i,stadium:this.server.stadium,goalsBlue:e.blue,goalsRed:e.red,goalsDescription:this.goals};this.api.sendMatch(r)}startGatheringStats(){this.clearState(),this.enabled&&(this.startDate=(new Date).toISOString())}async lookupPlayerData(e){if(!this.enabled)return;const t=await this.api.lookupPlayer(e);t&&(this.playerIds[e.auth]=t)}async register(e,t,s){if(!this.enabled)return;if(!t||!s)return void this.server.sendChat("You have to provide both login and password.",e.id);const i=await this.api.registerPlayer(e,t,s);i&&(this.playerIds[e.auth]=i)}async login(e,t,s){if(!this.enabled)return;if(!t||!s)return void this.server.sendChat("You have to provide both login and password.",e.id);const i=await this.api.loginPlayer(e,t,s);i&&(this.playerIds[e.auth]=i)}},hooks:{onGameStart:["startGatheringStats"],onPlayerBallKick:["registerNewKick"],onTeamGoal:["addNewGoal"],onTeamVictory:["sendStats"],onPlayerJoin:["lookupPlayerData"]},commands:{register:{help:"register new player",usage:["!register [login] [password]"]},login:{help:"log in existing player",usage:["!login [login] [password]"]}}}},function(e,t,s){const i=s(12),r=e=>/^[-+]?(\d+|Infinity)$/.test(e)?Number(e):NaN;e.exports={plugin:class{constructor(e){this.server=e,this.voteTime=60}voteEnded(){delete this.voteInProgress}vote(e,t,s){if(this.server.gameStarted)return void this.server.sendChat("Game is in progress, can't vote now!",e.id);if(!t)return void(this.voteInProgress?this.voteInProgress.writeVoteStats(e):this.server.sendChat("There is no vote in progress.",e.id));if(this.voteInProgress)return void this.server.sendChat("Another vote is already in progress!",e.id);const a=new Set(["Classic","Easy","Small","Big","Rounded","Hockey","Big Hockey","Big Easy","Big Rounded","Huge"]);let o,n;switch(t){case"stadium":if(!a.has(s))return void this.server.sendChat(`Stadium name must be one of ${Array.from(a).join(", ")}!`,e.id);n=`change stadium to ${s}`,o=()=>this.server.setStadium(s);break;case"time":{const t=r(s);if(Number.isNaN(t)||t<0)return void this.server.sendChat("Time must be a non-negative integer!",e.id);n=`change time limit to ${s}`,o=()=>this.server.setTimeLimit(t);break}case"score":{const t=r(s);if(Number.isNaN(t)||t<0)return void this.server.sendChat("Score must be a non-negative integer!",e.id);n=`change score limit to ${s}`,o=()=>this.server.setScoreLimit(t);break}case"start":n="force start the game",o=()=>this.server.startGame();break;default:return void this.server.sendChat(`Can't vote on ${t}!`,e.id)}this.server.sendChat(`${e.name} started a vote to ${n}!`),this.server.sendChat(`Vote with !yes or !no - ${this.voteTime}s remaining`),this.voteInProgress=new i(this.server,this,e,n,o,this.voteTime)}yes(e){this.voteInProgress?this.voteInProgress.voteYes(e):this.server.sendChat("There's nothing to vote on!",e.id)}no(e){this.voteInProgress?this.voteInProgress.voteNo(e):this.server.sendChat("There's nothing to vote on!",e.id)}stopVote(){this.voteInProgress&&this.voteInProgress.stopVote()}},hooks:{onGameStart:["stopVote"]},commands:{vote:{help:"hold a vote",usage:["!vote - print details of current vote","!vote stadium [stadiumName] - change stadium","!vote time [time] - change time limit","!vote score [score] - change score limit","!vote start - force start game"]},yes:{help:"say yes to current vote",usage:["!yes - agree to current vote"]},no:{help:"say yes to current vote",usage:["!no - disagree with current vote"]}}}},function(e,t){e.exports=class{constructor(e,t,s,i,r,a){this.server=e,this.voteManager=t,this.actionDescription=i,this.votedYes=new Set([s.id]),this.votedNo=new Set,this.onSuccess=r,this.voteTimeout=setTimeout(()=>{this.server.sendChat("Voting time elapsed!"),this.stopVote()},1e3*a),this.checkVote()}stopVote(){clearTimeout(this.voteTimeout),setTimeout(()=>this.voteManager.voteEnded(),0)}checkVote(){const{players:e}=this.server;this.votedYes.size>e.length/2?(this.server.sendChat(`Voted to ${this.actionDescription}`),this.onSuccess(),this.stopVote()):this.votedNo.size>e.length/2&&(this.server.sendChat(`Voted to not ${this.actionDescription}`),this.stopVote())}writeVoteStats(e){this.server.sendChat(`Vote to ${this.actionDescription} - Y: ${this.votedYes.size} / N: ${this.votedNo.size}`,e)}voteYes(e){this.votedYes.has(e.id)||(this.votedYes.add(e.id),this.writeVoteStats(),this.checkVote())}voteNo(e){this.votedNo.has(e.id)||(this.votedNo.add(e.id),this.writeVoteStats(),this.checkVote())}playerLeft(e){this.votedYes.delete(e.id),this.votedNo.delete(e.id),this.checkVote()}}}])}const script=document.createElement("script");script.textContent="("+main.toString()+")();",document.body.appendChild(script);