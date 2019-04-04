const Themes = ['black', 'white', 'pink'];

jQuery(($) => {
    const { Renderer } = require('tera-mod-ui');
    let mod = new Renderer;

    let setting_types = {};
    function buildStructure(structure) {
        $('#settings').empty();
        setting_types = {};

        structure.forEach(setting => {
            // Set up setting container
            let settingContainer = $('<tr/>');
            settingContainer.append($('<td/>', { id: `label_${setting.key}`, class: 'setting_key' }).text(setting.name));

            // Set up value selector based on setting type
            let valueSelector = null;
            switch (setting.type) {
                case 'bool': {
                    valueSelector = $('<input/>', { type: 'checkbox', id: `value_${setting.key}` });
                    break;
                }
                case 'range': {
                    valueSelector = $('<input/>', { type: 'range', id: `value_${setting.key}`, min: setting.min, max: setting.max, step: setting.step });
                    break;
                }
                case 'number': {
                    valueSelector = $('<input/>', { type: 'number', id: `value_${setting.key}`, min: setting.min, max: setting.max, step: setting.step });
                    break;
                }
                case 'string': {
                    valueSelector = $('<input/>', { type: 'text', id: `value_${setting.key}`, minlength: setting.minlength, maxlength: setting.maxlength, size: setting.size });
                    break;
                }
                case 'select': {
                    valueSelector = $('<select/>', { id: `value_${setting.key}` });
                    setting.options.forEach(option => valueSelector.append($('<option/>', { value: option.key, text: option.name })));
                    break;
                }
            }

            setting_types[setting.key] = setting.type;
            settingContainer.append($('<td/>', { class: 'setting_value' }).append(valueSelector));

            // Append setting to list
            $('#settings').append(settingContainer);

            // Subscribe to updates
            $(`#value_${setting.key}`).change(() => {
                let value = null;
                switch (setting.type) {
                    case 'bool': {
                        value = $(`#value_${setting.key}`).is(':checked');
                        break;
                    }
                    case 'range': {
                        value = Number($(`#value_${setting.key}`).val());
                        break;
                    }
                    case 'number': {
                        value = Number($(`#value_${setting.key}`).val());
                        break;
                    }
                    case 'string': {
                        value = $(`#value_${setting.key}`).val();
                        break;
                    }
                    case 'select': {
                        value = $(`#value_${setting.key}`).val();
                        break;
                    }
                }

                settings[setting.key] = value;
                mod.send('update', setting.key, value);
            });
        });
    }

    let settings = {};
    function updateSettings(newSettings) {
        settings = newSettings;

        Object.keys(settings).forEach(key => {
            const valueSelector = $(`#value_${key}`);
            switch (setting_types[key]) {
                case 'bool': {
                    valueSelector.prop('checked', settings[key]);
                    break;
                }
                case 'range': {
                    valueSelector.prop('value', settings[key]);
                    break;
                }
                case 'number': {
                    valueSelector.prop('value', settings[key]);
                    break;
                }
                case 'string': {
                    valueSelector.prop('value', settings[key]);
                    break;
                }
                case 'select': {
                    valueSelector.val(settings[key]);
                    break;
                }
            }
        });
    }

    mod.on('init', (name, theme, structure, settings) => {
        $('head').append(`<link rel="stylesheet" href="themes/${Themes.indexOf(theme) < 0 ? Themes[0] : theme}.css">`);
        $('#title').text(`${name} - Settings`);
        buildStructure(structure);
        updateSettings(settings);
    });

    mod.on('update', settings => {
        updateSettings(settings);
    });

    // Ready!
    $('#close-btn').click(() => {
        mod.close();
    });

    mod.send('init');
});
