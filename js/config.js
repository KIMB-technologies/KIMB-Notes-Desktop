/**
 * Systemkonfigurationsdatei 
 */

const isRunningInAsar = require( 'electron-is-running-in-asar' );

module.exports = {
	// Menüpunkt Entwicklung anzeigen
	devMode : !isRunningInAsar()
}