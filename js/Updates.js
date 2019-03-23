/**
 * Diese Datei prüft auf verfügbare Updates.
 */

 module.exports = class{

	constructor(){
		// Bibilotheken
		this.request = require( 'request' );
		this.electron = require( 'electron' );
		this.storage = require('electron-json-storage');

		this.package_json_url = 'https://api.github.com/repos/kimb-technologies/KIMB-Notes-Desktop/contents/package.json';
		this.releases_url = 'https://github.com/kimb-technologies/KIMB-Notes-Desktop/releases/latest';

		this.githubchecked = false;
		this.hasUpdate = false;
	}

	/**
	 * Nach Updates für KIMB-Notes gucken und wenn vorhanden, User hinweisen
	 * 	Prüft ob heute schon angefragt, fragt an, wenn nötig und löst Meldung aus.
	 */
	checkUpdates(){
		var THIS = this;

		//nach Daten gucken
		this.storage.has( 'Updates', function(error, hasIt) {
			if( error ){ throw error; }

			if( hasIt ){
				//Daten lesen
				THIS.storage.get( 'Updates' , function(error, data) {
					if (error){ throw error; }

					var versionchange = true;
					if( data.hasOwnProperty( 'thisVersion' ) ){
						var versionchange = data.thisVersion != THIS.electron.app.getVersion();
					}
					
					// Anfrage älter als 24 h?
					// Oder fuer andere Version
					if(
							data.requestTime + 86400000 < Date.now()
						||
							versionchange
					){
						//neu fragen
						THIS.githubAPIrequest();
					}
					else{
						THIS.hasUpdate = data.hasUpdate;

						//Hinweis
						THIS.updateInfo();
					}
					
				});
			}
			else{
				//keine Daten, also nachfragen
				THIS.githubAPIrequest();
			}
		});

		
	}

	/**
	 * Stellt Anfrage an GitHub API
	 * 	Setzt dabei this.githubchecked und this.hasUpdate
	 * 	Schribt in Storage
	 */
	githubAPIrequest(){
		var THIS = this;

		//Parameter
		var option = {
			url: this.package_json_url,
			headers: {
				'User-Agent': 'KIMB-Notes-Desktop by KIMB-technologies'
			}
		};

		//Antwort verarbeiten
		function response(e, resp, body){
			if (!e && resp.statusCode == 200) {
				THIS.githubchecked = true;

				//Antwort parsen
				body = JSON.parse( body );
				//base64 to ASCII
				var package_json = Buffer.from(body.content, 'base64').toString();
				//aktuelle Package JSON parsen
				package_json = JSON.parse( package_json );

				THIS.hasUpdate = THIS.compareVersions(THIS.electron.app.getVersion(), package_json.version );

				//Daten speichern
				THIS.storage.set('Updates', { requestTime : Date.now(), hasUpdate : THIS.hasUpdate, thisVersion : THIS.electron.app.getVersion() }, function(error) {
					if (error){ throw error; }
				});

				//Hinweis
				THIS.updateInfo();
			}
		}

		//Anfrage durchführen
		this.request(option, response)
	}

	/**
	 * Update Hinweis erzeugen, wird von checkUpdates() aufgerufen
	 * 	Hinweis wird nur gezeigt, falls Update vorhanden!!
	 */
	updateInfo(){
		if( this.hasUpdate ){
			var THIS = this;
			this.electron.dialog.showMessageBox({
				type : "info",
				title : "Update verfügbar",
				message : "Es ist eine neue Version von KIMB-Notes-Desktop verfügbar!",
				buttons : ["Herunterladen", "Später"]
			}, function ( num ) {
				if( num == 0 ){
					//Link aufrufen
					THIS.electron.shell.openExternal( THIS.releases_url );
				}
			});
		}
	}

	/**
	 * Returns true if version string (three parts diveded by .)
	 * 'online' ist higher than 'sys'
	 */
	compareVersions( sys, online ){
		//prefixes like v removed
		online = online.replace( /[^0-9\.]/i, '' );
		sys = sys.replace( /[^0-9\.]/i, '' );
		//split to 3 ints
		online = online.split('.');
		sys = sys.split('.');
		//parse int strings to numbers
		online = online.map( (s) => parseInt(s) );
		sys = sys.map( (s) => parseInt(s) );

		return ( online[0] > sys[0] ) ||
			( online[0] == sys[0] && online[1] > sys[1] ) ||
			( online[0] == sys[0] && online[1] == sys[1] && online[2] > sys[2] );
	}
}