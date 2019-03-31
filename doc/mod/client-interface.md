# Using the Game Client Interface
Besides the TCP connection used for game network traffic redirection, proxy also establishes a separate connection to the client used for exchanging commands and data. This is used, for example, to redirect the server list and add proxy servers. Note that this connection is maintained asynchronously within the game client process, so its CPU usage will most likely not affect the client's performance at all (as it's run on a different CPU core). Besides its usage by proxy's core, the client interface also exposes an API for usage by proxy mods.

## Flashing the Game Window
A module can make the game window flash (just like if a broker negotiation request has been received while it's minimized) by calling `mod.clientInterface.flashWindow(count = 5, interval = 0, allowFocused = false)`. By default (calling `mod.clientInterface.flashWindow()` without arguments), it'll behave identical to an incoming broker negotiation request.

For a module using this feature in a real-world scenario, check out [Flasher](https://github.com/caali-hackerman/flasher).

## Querying Data from the Game Client's DataCenter [TBD: further documentation]
Using the game client interface, a module can query arbitrary data from the game's currently loaded DataCenter file, with multi-region support (even running game clients from multiple different regions in parallel), as follows:

Example 1: Printing the name of each NPC that is spawned
```js
mod.hook('S_SPAWN_NPC', 11, event => {
    // Note: you can also use async/await here, obviously
    mod.queryData('/StrSheet_Creature/HuntingZone@id=?/String@templateId=?', [event.huntingZoneId, event.templateId]).then(result => {
        mod.log(`Spawned NPC "${result.attributes.name}" (${event.huntingZoneId},${event.templateId})!`);
    }); 
});
```
Example 2: Querying the type of a skill
```js
mod.queryData('/SkillData@huntingZoneId=?/Skill@templateId=?&id=?', [0, 16060, 10100]).then(result => {
    mod.log(`Skill type: ${result.attributes.type}`);
}); 
```

Example 3: Querying and building a list of all item names (note the "true" here - listing all matching nodes instead of just the first one)
```js
mod.queryData('/StrSheet_Item/String/', [], true).then(result => {
    let ItemNames = {};
    result.forEach(entry => ItemNames[entry.attributes.id] = entry.attributes.string);
}); 
```

Example 4: Extracting all effects of an abnormality
```js
mod.queryData('/Abnormality/Abnormal@id=?/', [701420]).then(result => {
    mod.log(`Abnormality ${result.attributes.id} has the following effects:`);

    // Note: abnormalities only have AbnormalityEffect children, so we don't need to check the child's name (here: effect.name) necessarily.
    result.children.forEach(effect => mod.log(`> Type ${effect.attributes.type}, Value ${effect.attributes.value}`);
});
```

Example 5a: Implementing a command that prints all huntingZones associated with the player's current zone ID (with `Promise.then()`)
```js
    mod.command.add('huntingzones', () => {
        mod.queryData('/ContinentData/Continent@id=?/HuntingZone/', [mod.game.me.zone], true).then(results => {
            results.forEach(data => mod.log(data.attributes.id));
        });
    });
```

Example 5b: Implementing a command that prints all huntingZones associated with the player's current zone ID (with `async/await`)
```js
    mod.command.add('huntingzones2', async () => {
        const results = await mod.queryData('/ContinentData/Continent@id=?/HuntingZone/', [mod.game.me.zone], true);
        results.forEach(data => mod.log(data.attributes.id));
    });
```
