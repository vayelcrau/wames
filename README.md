# word games
Casual cross platform multiplayer word games.

To push to the `heroku` branch, use `yarn heroku` from the root directory.

## Roadmap

### Client Side

- more robust state management
- menu which includes setting custom username and portal to pick games
- consider using game engine for games
- animation, visual effects, particles
    * hand-drawn feedback displays
    * particles (possibly using [react-native-particles](https://github.com/nanndoj/react-native-particles#readme))
    * animation (possibly using [React Native Animations](https://reactnative.dev/docs/0.60/animations))
- artwork for games

### Server Side

- secure connection & authentication
- authenticate/store session & user ids

### Misc

- more robust client-server [socket.io](https://socket.io/) communication structure
- 'portals' or 'shortcut links' to join games
- continuous integration to test builds before deploying to heroku