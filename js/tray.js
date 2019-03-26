const {Menu, Tray, app, nativeImage} = require('electron')
const path = require('path');

const {freigabenDialog} = require( __dirname + '/functions.js' );

module.exports = function(mainWindow, quitok, createWindow) {
	var iconpath = path.join( __dirname, '/../assets/icons/', ( process.platform === 'win32' ? 'win/notes.ico' : 'png/64x64.png' ) );
	try {
		var icon = nativeImage.createFromPath( iconpath );
	} catch (error) {
		var icon = nativeImage.createEmpty();
	}
	let tray = new Tray( icon );
	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'KIMB-Notes-Desktop',
			click: () => {
				if( mainWindow !== null ){
					mainWindow.show()
				}
				else{
					createWindow();
				}
			}
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

	return tray;
};