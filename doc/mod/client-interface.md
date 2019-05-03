# Using the Game Client Interface
Besides the TCP connection used for game network traffic redirection, TERA Toolbox also establishes a separate connection to the client used for exchanging commands and data. This is used, for example, to redirect the server list and add network proxy servers. Note that this connection is maintained asynchronously within the game client process, so its CPU usage will most likely not affect the client's performance at all (as it's run on a different CPU core). Besides its usage by the core of TERA Toolbox, the client interface also exposes an API for usage by mods. In general, the game client interface can be accessed by mods through `mod.clientInterface`.

## Generic Information
The `info` object contains some useful information about the linked game client process:
- `mod.clientInterface.info.pid`: The Windows process ID of the linked game client process.
- `mod.clientInterface.info.region`: The linked game client's region (e.g. `na` for USA); see `mod.region`
- `mod.clientInterface.info.language`: The loaded DataCenter language identifier (e.g. `EUR` for EU-English, `USA` for US-English, etc.)
- `mod.clientInterface.info.path`: The full (absolute) path of the folder that contains the linked game client's `TERA.exe` (should always be the `Binaries` subfolder within the client's installation root folder).
- `mod.clientInterface.info.majorPatchVersion`: The major patch version of the linked game client, as specified in `ReleaseRevision.txt`.
- `mod.clientInterface.info.minorPatchVersion`: The minor patch version of the linked game client, as specified in `ReleaseRevision.txt`.
- `mod.clientInterface.info.protocolVersion`: The protocol version (== DataCenter version), as sent in `C_CHECK_VERSION`.
- `mod.clientInterface.info.sysmsg`: SystemMessage name -> ID map.

## Flashing the Game Window
A module can make the game window flash (just like if a broker negotiation request had been received while it's minimized) by calling `mod.clientInterface.flashWindow(count = 5, interval = 0, allowFocused = false)`. By default (calling `mod.clientInterface.flashWindow()` without arguments), it'll behave identically to an incoming broker negotiation request.

For a module using this feature in a real-world scenario, check out [Flasher](https://github.com/tera-toolbox-mods/flasher).

## Configuring Camera Shaking Behavior
Camera shaking feels annoying, or might even cause medical issues, for some people. It cannot be fully disabled using the game's settings, but TERA Toolbox offers this feature through `mod.clientInterface.configureCameraShake(enabled, power = 1.0, speed = 1.0)`. As an example, `mod.clientInterface.configureCameraShake(false)` simply disables camera shaking altogether. The optional `power` and `speed` params allow you to control the strength (multiples of the default settings) of camera shaking effects, if enabled. You can even set them to really high values if you want!

## Querying Data from the Game Client's DataCenter [TBD: further documentation]
Using the game client interface, a module can query arbitrary data from the game's currently loaded DataCenter file, with multi-region support (even running game clients from multiple different regions in parallel). Note that you can use either `mod.queryData` or `mod.clientInterface.queryData`, with the former being just a redirect to the latter for shorter code.

### Example 1: Printing the name of each NPC that is spawned
Note how the resulting node's attributes are accessed. As the query is performed on the game's loaded DataCenter file, the printed names are inherently localized to the language that the player has selected.
```js
mod.hook('S_SPAWN_NPC', 11, event => {
    // Note: you can also use async/await here, obviously
    mod.queryData('/StrSheet_Creature/HuntingZone@id=?/String@templateId=?', [event.huntingZoneId, event.templateId]).then(result => {
        mod.log(`Spawned NPC "${result.attributes.name}" (${event.huntingZoneId},${event.templateId})!`);
    }); 
});
```

### Example 2: Querying the type of a skill
Note the `@templateId=?&id=?` - if you want to apply multiple filters per node, concatenate them using `&`.
```js
mod.queryData('/SkillData@huntingZoneId=?/Skill@templateId=?&id=?', [0, 16060, 10100]).then(result => {
    mod.log(`Skill type: ${result.attributes.type}`);
}); 
```

### Example 3: Querying and building a list of all item names
Note the `true` here - listing all matching nodes instead of just the first one. This returns a (possibly empty) array of nodes instead of a single node.
```js
mod.queryData('/StrSheet_Item/String/', [], true).then(results => {
    let ItemNames = {};
    results.forEach(entry => ItemNames[entry.attributes.id] = entry.attributes.string);
}); 
```

### Example 4: Extracting all effects of an abnormality
Note how we're looping through the resulting node's children.
```js
mod.queryData('/Abnormality/Abnormal@id=?/', [701420]).then(result => {
    mod.log(`Abnormality ${result.attributes.id} has the following effects:`);

    // Note: abnormalities only have AbnormalityEffect children, so we don't need to check the child's name (here: effect.name) necessarily.
    result.children.forEach(effect => mod.log(`> Type ${effect.attributes.type}, Value ${effect.attributes.value}`);
});
```

### Example 5: Implementing a command that prints all huntingZones associated with the player's current zone ID
Option A: using `Promise.then()`
```js
mod.command.add('huntingzones', () => {
    mod.queryData('/ContinentData/Continent@id=?/HuntingZone/', [mod.game.me.zone], true).then(results => {
        results.forEach(data => mod.log(data.attributes.id));
    });
});
```

Option B: using `async/await`
```js
mod.command.add('huntingzones', async () => {
    const results = await mod.queryData('/ContinentData/Continent@id=?/HuntingZone/', [mod.game.me.zone], true);
    results.forEach(data => mod.log(data.attributes.id));
});
```

### Example 6: Building a list of all items that are tier 12 or higher 
Note how we're using a different operator (`>=`) here. Currently supported operators: `=`, `!=`, `>=`, `>`, `<=`, and `<`.
```js
mod.queryData('/ItemData/Item@rank>=?/', [12], true).then(results => {
    results.forEach(entry => mod.log(`Item ${entry.attributes.id} is tier ${entry.attributes.rank}`));
});
```

### Example 7: Optimization - ignoring child nodes
Note the `false` that indicates that we're only interested in the queried node's attributes, not its children.
```js
mod.queryData('/SkillData@huntingZoneId=?/Skill@templateId=?', [0, 16060], true, false).then(results => {
    results.forEach(entry => mod.log(entry)); // will not have the 'children' member
});
```

### Example 8: Optimization - filtering attributes
Note the list of attribute names that narrows down the returned attributes.
```js
mod.queryData('/ItemData/Item@rank>=?/', [12], true, false, ['id', 'combatItemType']).then(results => {
    results.forEach(entry => mod.log(entry.attributes)); // will only contain 'id' and 'combatItemType'
});
```

### Error Handling
If the query fails (e.g. you specify an incorrect query string, missing/mismatching argument count, mismatching argument data types, ...), the promise will be rejected/an exception will be thrown when awaiting it.

### Performance
In general, it's recommended to cache as much data as possible. If your mod needs a list of all item names, for example, you should query it in your mod's constructor (when the user will still be in login/character selection for quite some time) and cache it.

This is _not_ because of CPU utilization considerations (those barely have any effect as explained earlier), but because the client interface needs to temporarily allocate memory within the game's process in order to gather and send the query results back to TERA Toolbox. Due to it being a 32-bit process, the available amount of memory is tightly limited.

Note that this also means that you cannot rely on very large queries (e.g. querying all of `SkillData` at once) succeeding. Please consider this limitation and test your mod thoroughly!
