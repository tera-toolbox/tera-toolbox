const { ipcRenderer } = require('electron');

jQuery(($) => {
    // --------------------------------------------------------------------
    // ----------------------------- MAIN ---------------------------------
    // --------------------------------------------------------------------
    // Disable mouse wheel clicks
    $(document).on('auxclick', 'a', (e) => {
        if (e.which !== 2)
            return true;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    });

    // Status display
    ipcRenderer.on('caption', (_, caption) => {
        $('#caption').text(caption);
    });
    ipcRenderer.on('info', (_, info) => {
        $('#info').text(info);
    });
});
