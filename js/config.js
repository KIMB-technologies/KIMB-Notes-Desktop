/**
 * Systemkonfigurationsdatei 
 */
var isInAsar;

if(process && process.type === 'renderer'){
	const ipc = require('electron').ipcRenderer;
	ipc.send('running-in-asar');

	ipc.on('running-in-asar', function (event, data ) {
		isInAsar = data;
	});
}
else{		
	isInAsar = require( 'electron-is-running-in-asar' )();
}


module.exports = {
	// Menüpunkt Entwicklung anzeigen
	devMode : !isInAsar
}