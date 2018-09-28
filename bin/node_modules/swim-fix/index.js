// Fixes a bug where staying still in the water will spam duplicate location packets, causing the server to disconnect the player

module.exports = function SwimFix(mod) {
	let lastPos = null

	mod.hook('C_PLAYER_LOCATION', 5, {order: -90}, event => {
		if(lastPos &&
			lastPos.w === event.w &&
			lastPos.lookDirection === event.lookDirection &&
			lastPos.loc.equals(event.loc) &&
			lastPos.dest.equals(event.dest) &&
			lastPos.jumpDistance === event.jumpDistance &&
			lastPos.inShuttle === event.inShuttle &&
			lastPos.type === event.type
		)
			return false

		lastPos = event
	})
}
