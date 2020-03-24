import { AnagramObject, AnagramState, User } from '../types';

import DB from './Database';

import * as express from 'express';
import * as io from 'socket.io';
import * as http from 'http';

import { Socket } from 'socket.io';
import * as AUtil from './util/Anagram.js';

enum Events {
    ERROR = 'error',
    REGISTER_USER = 'register-user',
    NEW_GAMES = 'new-games',
    CREATE_GAME = 'create-game',
    SET_USERNAME = 'user-id',
    UPDATE_GAME_STATE = 'update-game-state'
}

interface LooseSocket extends Socket {
    registered: boolean,
    user: User
}

export default class Server {
    private app;
    private server;
    private io;

    private sockets: LooseSocket[] = [];

    constructor() {
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

    setListeners(socket: LooseSocket) {
        console.log('A socket connected from ', socket.handshake.address);

        socket.on(Events.REGISTER_USER, (user: User, callback: (ret: AnagramObject[] | Error) => void) => {
            console.log('Registering user: ', user);

            if (socket.registered) {
                callback(Error("Socket already registered!"));
            } else {

                DB.registerUser(user, res => {
                    if (!(res instanceof Error)) {
                        socket.user = user;
                        socket.registered = true;

                        DB.getUserAnagramGames(user, callback);
                    } else {
                        callback(res);
                    }
                });
            }
        });

        socket.on(Events.CREATE_GAME, (target_usernames: string[], callback: (game: AnagramObject) => void) => {
            DB.getUsersByName(target_usernames, (users: User[]) => {
                let target_users = users;
                target_users.push(socket.user);

                const game = AUtil.generateGame(target_users);

                DB.createAnagramGame(game, (db_game: AnagramObject) => {
                    const room = db_game.uuid;

                    this.sockets.filter(list_socket =>
                        target_users.includes(list_socket.user))
                        .forEach(target_socket => {
                            target_socket.join(room);
                        });

                    socket.broadcast.to(room).emit(Events.NEW_GAMES, [db_game]);

                    callback(game);
                });
            });
        });

        socket.on(Events.SET_USERNAME, (username: string, callback: (res: User | Error) => void) => {
            const new_user: User = {
                user_id: socket.user.user_id,
                username: username
            };

            DB.setUsername(new_user, (res: User | Error) => {
                if (!(res instanceof Error)) {
                    socket.user = new_user;
                }

                callback(res);
            });
        });

        socket.on(Events.UPDATE_GAME_STATE, (uuid: string, new_state: AnagramState) => {
            DB.updateAnagramGame(socket.user, uuid, new_state, (updated_game: AnagramObject) => {
                socket.broadcast.to(uuid).emit(Events.UPDATE_GAME_STATE, uuid, socket.user, new_state);
            });
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected! ' + socket.user.user_id);

            this.sockets = this.sockets.filter(list_socket => list_socket !== socket);
        });
    }
}