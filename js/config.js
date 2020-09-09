/**
 * Systemkonfigurationsdatei 
 */

module.exports = {
	// Menüpunkt Entwicklung anzeigen
	devMode : process.argv[2] === '--dev' || process.argv[process.argv.length-1] === '--dev'
}