const path = require('path');
const fs = require('fs');
const UIStatePath = path.join(__dirname, '..', 'config-ui.json');

function loadState() {
    let result = null;
    try {
        result = fs.readFileSync(UIStatePath, 'utf8');
    } catch (_) {
        return {
           width: 880,
           height: 500,
           isMaximized: false
        };
    }

    return JSON.parse(result);
}

function saveState(newState) {
    fs.writeFileSync(UIStatePath, JSON.stringify(newState, null, 4));
}

module.exports = { loadState, saveState };
