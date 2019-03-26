/**
 * Die Hauptdatei des Systems 
 */

// ****
// Komponentenimporte
// ****

// Electron API
const electron = require('electron');
//	Electron API Links
	const ipc = electron.ipcMain;
	const dialog = electron.dialog;

//Systemkonfiguration
const config = require( __dirname + '/js/config.js' );
//Bildschirm Position
const BildschirmPosition = require( 'electron-window-position' );

// ****
// Allgemeines Fensterverhalten
// ****

//globale Referenz auf das Febster, damit es nicht vom Garbage Collector gefressen wird
let mainWindow, mainTray = null;

let quitokval = false;
function quitok(v){
	if( typeof v !== "undefined" ){
		quitokval = v;
	}
	return quitokval;
}

function createWindow () {
	// Fenster soll oben links im Fenster geöffnet werden
	var windowPos = new BildschirmPosition().getActiveScreenCenter( 900, 700 );

	// Hauptfenster erstellen
	mainWindow = new electron.BrowserWindow({
		x: windowPos.x, 
		y: windowPos.y,
		minWidth: 340,
		width: 900,
		height: 700,
		minHeight: 500,
		icon: __dirname + '/assets/icons/png/64x64.png',
		backgroundColor: '#f5f5f5',
		show: false,
		webPreferences : {
			nodeIntegration: true,
			webviewTag: true
		}
	});

	//Haupdatei laden
	mainWindow.loadURL('file://' + __dirname + '/index.html' );

	//Fenster erst zeigen, wenn Inhalt fertig
	mainWindow.once( 'page-title-updated', function() {
		mainWindow.show();
	});
	
	// Fenster schliessen => verbergen?
  	mainWindow.on('close', function (event) {
		if(!quitok()){
			event.preventDefault();
			// Fenster ausblenden
			mainWindow.hide();
		}
	});
	//alles zu => ende
	mainWindow.on('closed', function (event) {
		mainWindow = null;
	});

	//Menü laden
  	electron.Menu.setApplicationMenu(
		electron.Menu.buildFromTemplate(
			require('./js/menue.js')(quitok)
		)
	);

	if( mainTray === null ){
		//Tray
		mainTray = require( './js/tray.js')( mainWindow, quitok, createWindow );
	}
}
// Fenster erst erstellen, wenn electron vollständig geladen ist
electron.app.on('ready', createWindow);

// Programm beenden, wenn Fenster geschlossen, außer bei Mac
electron.app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		electron.app.quit();
	}
});

// aus dem Mac OS Dock erwachen lassen
electron.app.on('activate', function () {
	if( mainWindow === null ){
		createWindow();
	}
});

// ****
// Updates
// ****
const claUpdates = new require( __dirname + '/js/Updates.js' );
var Updates = new claUpdates();
//	Nach Updates gucken und wenn verfügbar Nachricht
Updates.checkUpdates();

// ****
// Load Functions
// ****

const {askForUserData, saveUserData, deleteUserData} = require(__dirname + '/js/functions.js' );

// Messages IPC
ipc.on('delete-userdata', deleteUserData);
ipc.on('ask-for-user-data', askForUserData);
ipc.on('save-user-data', saveUserData);