// windows-only, synchronous version of `hostile` with slight modifications
var fs = require('fs');
var path = require('path');

var HOSTS = process.platform !== 'win32'
  ? '/etc/hosts'
  : path.join(
    process.env.SystemRoot || path.join(process.env.SystemDrive || 'C:', 'Windows'),
    '/System32/drivers/etc/hosts'
  );

exports.get = function () {
	var lines = [];
	try {
		fs.readFileSync(HOSTS, {encoding: 'utf8'})
		.replace(/\r?\n$/, '')
		.split(/\r?\n/)
		.forEach(function (line) {
			var matches = /^\s*?([^#]+?)\s+([^#]+?)$/.exec(line);
			if (matches && matches.length === 3) {
				// Found a hosts entry
				var ip = matches[1];
				var host = matches[2];
				lines.push([ip, host]);
			} else {
				// Found a comment, blank line, or something else
				lines.push(line);
			}
		});
	} catch (e) {
		// ENOENT: File doesn't exist (equivalent to empty file)
		// Otherwise, throw
		if (e.code !== 'ENOENT') {
			throw e;
		}
	}
	return lines;
};

exports.set = function (ip, host) {
	var lines = exports.get();

	// Try to update entry, if host already exists in file
	var didUpdate = false;
	lines = lines.map(function (line) {
		if (Array.isArray(line) && line[1] === host) {
			line[0] = ip;
			didUpdate = true;
		}
		return line;
	});

	// If entry did not exist, let's add it
	if (!didUpdate) {
		lines.push([ip, host]);
	}

	exports.writeFile(lines);
};

exports.setMany = function (hostList) {
  var lines = exports.get(), host, didUpdate, unchanged = true;
  // Try to update entries, if host already exists in file
  for (var i = 0, l = hostList.length; i < l; i++) {
    didUpdate = false;
    host = hostList[i];
    lines = lines.map(function (line) {
      if (Array.isArray(line) && line[1] === host[1]) {
        unchanged = (line[0] == host[0]);
        line[0] = host[0];
        line[2] = 2; // A flag for error reporting to say this line was changed
        didUpdate = true;
      }
    });
    
    // If entry did not exist, let's add it
    if (!didUpdate) {
      lines.push([host[0], host[1], 1]); // The 1 is a flag for error reporting to say this line is new
      unchanged = false;
    }
  }

  if (!unchanged) { exports.writeFile(lines); }
};

exports.remove = function (ip, host) {
	var lines = exports.get();

	// Try to remove entry, if it exists
	lines = lines.filter(function (line) {
		return !(Array.isArray(line) && line[0] === ip && line[1] === host);
	});

	exports.writeFile(lines);
};

exports.removeMany = function (hostList) {
  var lines = exports.get(), unchanged = true;
  
  // Try to remove entries, if they exist
  for (let i = 0, l = hostList.length; i < l; i++) {
    let host = hostList[i];
    lines = lines.filter(function (line) {
      return unchanged=!(Array.isArray(line) && line[0] === host[0] && line[1] === host[1]);
    });
  }
  
  if (!unchanged) { exports.writeFile(lines); }
};

exports.writeFile = function (lines) {
	var data = '', isWindows = process.platform === 'win32', list = [];
	lines.forEach(function (line) {
		if (Array.isArray(line)) {
			if (line[2]) { list.push(line); }
			line = line[0] + ' ' + line[1];
		}
		data += line + (isWindows ? '\r\n' : '\n');
	});

	// Get mode (or set to rw-rw-rw-); check read-only
	var mode;
	try {
		mode = fs.statSync(HOSTS).mode;
		if (!(mode & 128)) { // 0200 (owner, write)
			// FIXME generate fake EACCES
			var err = new Error('EACCES: Permission denied');
			err.code = 'EACCES';
			err.path = HOSTS;
			err.list = list;
			throw err;
		}
	} catch (e) {
		if (e.code === 'ENOENT') {
			mode = 33206; // 0100666 (regular file, rw-rw-rw-)
		} else {
			throw e;
		}
	}

	// Write file
	// In a try-catch of its own for some added safety
	// due to not checking who the owner is on non-Windows systems
	try {
		fs.writeFileSync(HOSTS, data, {mode: mode});
	} catch (e) {
		e.list = list;
		throw e;
	}
};
