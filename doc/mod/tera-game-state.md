# Using tera-game-state
Tightly integrated into the network proxy core of TERA Toolbox comes the `tera-game-state` mod, which tracks certain events and provides a higher-level abstraction layer with both events and state variables. It is guaranteed to be installed and initialized before any other module is loaded and can be accessed at all times through `mod.game`.

Please note that it is generally encouraged to rely on `tera-game-state` as much as possible, in order to avoid duplicate processing of packets and to reduce the number of incompatibilities (and, in consequence, the required maintenance effort for you as a module developer!) introduced by breaking changes in game updates. Furthermore, as it provides a thoroughly tested abstraction layer, it is very likely to properly handle all possible edge cases, resulting in more robust code.

As an example, you should always use `mod.game.on('enter_game', () => ...);` instead of hooking `S_LOGIN` if possible.

You can find the documentation of `tera-game-state` [here](https://github.com/tera-toolbox/tera-game-state/blob/master/README.md).
