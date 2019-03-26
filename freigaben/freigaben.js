/**
 * Die Hauptdatei für das Freigabenfenster
 */

// ****
// Komponentenimporte
// ****

// Electron API
const electron = require('electron');
//Bildschirm Position
const BildschirmPosition = require( 'electron-window-position' );


// ****
// Allgemeines Fensterverhalten
// ****

//globale Referenz auf das Febster, damit es nicht vom Garbage Collector gefressen wird
let freigWindow;

function createWindow ( parent ) {
	// Fenster soll oben links im Fenster geöffnet werden
	var windowPos = new BildschirmPosition().getActiveScreenCenter( 500, 500 );

	// Hauptfenster erstellen
	freigWindow = new electron.BrowserWindow({
		x: windowPos.x, 
		y: windowPos.y,
		minWidth: 340,
		width: 500,
		height: 500,
		minHeight: 300,
		icon: __dirname + '/../assets/icons/png/64x64.png',
		backgroundColor: '#f5f5f5',
		show: false,
		autoHideMenuBar: true,
		parent: parent,
		webPreferences : {
			nodeIntegration: true,
			webviewTag: true
		}
	});

	//Haupdatei laden
	freigWindow.loadURL('file://' + __dirname + '/freigaben.html' );

	//Fenster erst zeigen, wenn Inhalt fertig
	freigWindow.once( 'page-title-updated', function() {
		freigWindow.show();
	});
	
	// Fenster geschlossen?
  	freigWindow.on('closed', function () {
		// Fenster kann weg
		freigWindow = null
	});

	//kein Menü
  	freigWindow.setMenu(null);
}

// Fenster erstellen Funkion
module.exports = createWindow;
