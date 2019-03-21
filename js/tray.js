const {Menu, Tray, app} = require('electron')

const {freigabenDialog} = require( __dirname + '/functions.js' );

module.exports = function(mainWindow, quitok) {
	let tray = new Tray( __dirname + '/../assets/icons/' + ( process.platform === 'win32' ? 'win/notes.ico' : 'png/64x64.png' ) );
	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'KIMB-Notes-Desktop',
			click: () => mainWindow.show()
		},
		{
			label: "Freigaben",
			click: () => freigabenDialog()
		},
		{type: 'separator'},
		{
			label: "Beenden",
			click: () => { 
				quitok(true);
				app.quit();
			}
		}
	])
	tray.setToolTip('KIMB-Notes-Desktop');
	tray.setContextMenu(contextMenu);
};