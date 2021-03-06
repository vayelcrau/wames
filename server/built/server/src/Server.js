"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = require("./Database");
const express = require("express");
const io = require("socket.io");
const http = require("http");
const AUtil = require("./util/Anagram.js");
var Events;
(function (Events) {
    Events["ERROR"] = "error";
    Events["REGISTER_USER"] = "register-user";
    Events["NEW_GAMES"] = "new-games";
    Events["CREATE_GAME"] = "create-game";
    Events["SET_USERNAME"] = "user-id";
    Events["UPDATE_GAME_STATE"] = "update-game-state";
})(Events || (Events = {}));
class Server {
    constructor() {
        this.sockets_list = [];
        this.setListeners = this.setListeners.bind(this);
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = io(this.server);
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + './index.html');
        });
        const port = process.env.PORT || 3000;
        this.server.listen(port, () => console.log("Listening on port ", port));
        this.io.on('connection', this.setListeners);
    }
    setListeners(socket) {
        console.log('A socket connected from ', socket.handshake.address);
        socket.on(Events.REGISTER_USER, (user_id, callback) => {
            console.log('Registering user: ', user_id);
            Database_1.default.registerUser(user_id, res => {
                console.log('Resolved user: ', res);
                if (!(res instanceof Error)) {
                    socket.user = res;
                    socket.registered = true;
                    this.sockets_list.push(socket);
                    Database_1.default.getUserAnagramGames(res, (games) => {
                        socket.emit(Events.NEW_GAMES, games);
                    });
                }
                callback(res);
            });
        });
        socket.on(Events.CREATE_GAME, (target_usernames, callback) => {
            console.log('Creating game from: ', socket.user.username, ' for: ', target_usernames);
            Database_1.default.getUsersByName(target_usernames, (users) => {
                let target_users = users;
                target_users.push(socket.user);
                const game = AUtil.generateGame(target_users);
                Database_1.default.createAnagramGame(game, (db_game) => {
                    const room = db_game.uuid;
                    this.sockets_list.filter(list_socket => target_users.map(target_user => target_user.user_id).includes(list_socket.user.user_id))
                        .forEach(target_socket => {
                        console.log(target_socket.user.username, ' joined game ', db_game.uuid);
                        target_socket.join(room);
                    });
                    socket.broadcast.to(room).emit(Events.NEW_GAMES, [db_game]);
                    callback(game);
                });
            });
        });
        socket.on(Events.SET_USERNAME, (username, callback) => {
            console.log('Setting username for: ', socket.user.username, ' to: ', username);
            const new_user = {
                user_id: socket.user.user_id,
                username: username
            };
            Database_1.default.setUsername(new_user, (res) => {
                if (!(res instanceof Error)) {
                    socket.user = new_user;
                }
                callback(res);
            });
        });
        socket.on(Events.UPDATE_GAME_STATE, (uuid, new_state) => {
            console.log('Updating game id ', uuid, ' from: ', socket.user.username, ' with: ', new_state);
            const unview = !(Object.keys(new_state).length == 1 && Object.keys(new_state)[0] == 'viewed');
            Database_1.default.updateAnagramGame(socket.user, uuid, new_state, () => {
                socket.broadcast.to(uuid).emit(Events.UPDATE_GAME_STATE, uuid, socket.user, new_state, unview);
            });
        });
        socket.on('disconnect', () => {
            console.log('A user disconnected!');
            //this.sockets = this.sockets.filter(list_socket => !list_socket.disconnected);
        });
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map