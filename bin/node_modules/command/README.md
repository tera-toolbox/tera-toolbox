Command module by Pinkie Pie (https://discord.gg/RR9zf85)

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
To use Command in your module, first require it, then call the factory `Command(dispatch)` to get an instance of `Command`.

### Examples
```js
const Command = require('command')

module.exports = function MyMod(dispatch) {
	const command = Command(dispatch)

	command.add('mymod', (x, y, z) => {
		command.message('Parameters: ' + [x, y, z].join(', '))
	})
}
```

#### Sub-Commands:
```js
const Command = require('command')

module.exports = function SubCommandTest(dispatch) {
	const command = Command(dispatch)

	command.add('test', {
		$default() { command.message('Usage: test [echo|hello]') },
		echo(...args) {
			if(args[0] === undefined) command.message('Usage: test echo [msg]')
			else command.message(args.join(' '))
		},
		hello: {
			$default() { command.message('Usage: test hello [blue|red]') },
			blue() { command.message('<font color="#5555ff">Hello ponies!</font>') },
			red() { command.message('<font color="#ff5555">Hello ponies!</font>') }
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