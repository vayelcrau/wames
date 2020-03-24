import { AnagramObject, AnagramState, User } from '../types';

import monk, { IMonkManager, ICollection } from 'monk';

class DB {
    private db: IMonkManager = monk(process.env.DB_URI);
    private anagrams: ICollection;
    private users: ICollection;

    constructor() {
        this.anagrams = this.db.get('anagram-games');
        this.users = this.db.get('users');
    }

    // ANAGRAM METHODS

    createAnagramGame(game_object: AnagramObject, callback?: (doc: AnagramObject) => void) {
        this.anagrams.insert(game_object)
            .then(callback)
            .catch(console.error);
    }

    updateAnagramGame(updating_user: User, game_uuid: string, updated_state: AnagramState, callback: (updated_doc: AnagramObject | undefined) => void) {
        this.anagrams.findOneAndUpdate(
            { uuid: game_uuid },
            { $set: {['states.' + updating_user.user_id]: updated_state} }
        )
            .then(callback)
            .catch(console.error);
    }

    getUserAnagramGames(user: User, callback: (docs: AnagramObject[]) => void) {
        this.anagrams.find({
            ['states.' + user.user_id]: { $exists: true }
        })
            .then(callback)
            .catch(console.error);
    }

    // USER METHODS
    registerUser(user: User, callback: (res: User | Error) => void) {
        this.users.find({
            user_id: user.user_id
        })
            .then(docs => {
                if (docs.length > 0) {
                    callback(Error("User already registered!"));
                } else {
                    this.users.insert({
                        user_id: user.user_id,
                    })
                        .then(user => {
                            this.setUsername(user, callback);
                        })
                        .catch(console.error);
                }
            })
            .catch(console.error);
    }

    setUsername(user: User, callback: (res: User | Error) => void) {
        if (user.username === '') return;

        this.users.find({
            username: user.username
        })
            .then(docs => {
                if (docs.length > 0) {
                    callback(Error("Username is taken!"))
                } else {
                    this.users.findOneAndUpdate(
                        {user_id: user.user_id},
                        {username: user.username}
                    )
                        .then(callback)
                        .catch(console.error);
                }
            })
            .catch(console.error);
    }

    getUserByName(username: string, callback: (user: User) => void) {
        this.users.findOne({
            username: username
        })
            .then(callback)
            .catch(console.error);
    }

    getUsersByName(usernames: string[], callback: (users: User[]) => void) {
        this.users.find({
            $or: usernames.reduce((acc: Partial<User>[], cur: string) => {
                acc.push({
                    username: cur
                });

                return acc;
            }, [])
        })
            .then(callback)
            .catch(console.error);
    }
}

export default new DB();