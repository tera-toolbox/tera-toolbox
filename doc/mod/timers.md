# Using the Timer API
TERA Toolbox offers a timer API that is identical to Node.JS's native timers, except for the fact that timers and intervals are managed **and automatically cleared when leaving the game**, e.g. logging out to character lobby, closing the client, and so on. This relieves the module developer of making sure all timers are properly terminated, as it is typically undesired to have timers started while ingame trigger after leaving the ingame state.

The timer API is accessible through `mod.setTimeout`, `mod.clearTimeout`, `mod.setInterval`, and `mod.clearInterval`, with almost identical behavior to their [native Node.JS counterparts](https://nodejs.org/api/timers.html). Note that, unlike native, you *cannot* call `mod.clearInterval()` on a timer that you've started using `mod.setTimeout` and vice-versa. Proper usage of matching set/clear calls is required.

There are also `mod.clearAllTimeouts()` and `mod.clearAllIntervals()` in case you want to kill all pending timers, and `mod.activeTimeouts` as well as `mod.activeIntervals` (both are JS `Set`s) in case you want to read active timeouts. **Do not modify those variables!**
