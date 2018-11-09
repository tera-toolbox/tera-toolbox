Original command module by Pinkie Pie (https://discord.gg/RR9zf85), modified and added auto-updating functionality.

## Usage
Type `/proxy` into chat to switch to the command line, then enter the specified command. To pass strings containing spaces as arguments, enclose them in quotes (`""` or `''`). To enclude quotes or backslashes in arguments, precede them with a backslash `\`.

### Examples
```
/proxy mymod
```
```
/proxy mymod dostuff
```
```
/proxy mymod 123 456 'Hello ponies!'
```
```
/proxy mymod "This is a string containing 'quotes', \"similar quotes\", and \\backslashes."
```

## Developers
To use Command in your module, you can just use `mod.command`. It is guaranteed to be installed by my proxy, even if the user attempts to delete it.

### Examples
```js
module.exports = function MyMod(mod) {
	mod.command.add('mymod', (x, y, z) => {
		mod.command.message('Parameters: ' + [x, y, z].join(', '))
	})
}
```

#### Sub-Commands:
```js
module.exports = function SubCommandTest(mod) {
	mod.command.add('test', {
		$default() { mod.command.message('Usage: test [echo|hello]') },
		echo(...args) {
			if(args[0] === undefined) mod.command.message('Usage: test echo [msg]')
			else mod.command.message(args.join(' '))
		},
		hello: {
			$default() { mod.command.message('Usage: test hello [blue|red]') },
			blue() { mod.command.message('<font color="#5555ff">Hello ponies!</font>') },
			red() { mod.command.message('<font color="#ff5555">Hello ponies!</font>') }
		}
	})
}
```

## Command
### Methods
#### `add(command, callback[, context])`
Adds one or more command hooks. All commands must be unique and are case insensitive.

`command` may be a string or an array of strings.

`callback` may be a function or an object. Callback receives a variable number of input string arguments. If an object is provided, the object's keys are registered as sub-commands which may in turn be either a callback or another object. Two special keys are usable for sub-commands:
* `$none` called if there were no arguments.
* `$default` called if no other hook was matched.

`context` optional `this` to pass to callbacks. Default is unspecified.

#### `remove(command)`
Removes one or more command hooks.

`command` may be a string or an array of strings.

#### `message(msg)`
Sends a message in the `[Proxy]` channel. May contain HTML.

#### `exec(str)`
Executes a raw command string. If `str` is an array then it will be interpreted as arguments instead.

Returns `true` on command found, `false` otherwise. May throw an exception if the callback contains an error.
