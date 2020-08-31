/**
 * Inhaltes des Fensters
 * 	Login nud KIMB-Notes öffnen
 */

// Electron API
const electron = require( 'electron' );
	// Links auf Electron
	//	Für die IPC Messages
	const ipc = electron.ipcRenderer
	//	System Dialog
	const dialog = electron.remote.dialog

// URLs testen
const validUrl = require('valid-url');
// Hashing
const sjcl = require('sjcl');
//Webrequests
const request = require( 'request' );
//Funktion zum Öffnen von WebViews
const openWebView = require(__dirname + '/openWebView.js');

//Struktur für Userdaten
var userdata = {
	"server" : "",
	"username" : "",
	"userid" : "",
	"authcode" : ""
};

/**
 * WebRequest an Server stellen
 * Unter userdata.server muss korrekter Server angegeben sein!!
 * @param {String} task Aufgabenbereich der Anfage (login, list, view, admin)
 * @param {JSON} post Daten die per POST übertragen werden sollen
 * @param {function (JSON)} callback (optional) Funktion nach erfolgreicher Anfage, JSON Rückgabe als Parameter
 * @param {function (JSON)} errcallback (optional) Funktion bei fehlerhafter Anfrage, Parameter Fehlerobjekt und Status-Code
 */
function web_request( task, post, callback, errcallback ){
	var file = ( task !== 'share' ? 'rest' : 'ajax' );
	request.post({
			url: userdata.server + '/' + file + '.php?' + task, 
			form : post,
			jar: true
		},
		function (error, response, body) {
			if(
				error !== null || (response && response.statusCode) != 200
			){
				//Fehler weitergeben
				if( typeof errcallback === "function" ){
					errcallback( error, (response && response.statusCode) );
				}
				else{
					//Fehlermeldung
					dialog.showErrorBox(
						'Fehler',
						'Konnte nicht mit Server verbinden: "'
							+ (( error !== null ) ? error.message : 'Statuscode ' + (response && response.statusCode) ) + '"'
					);
				}
			}
			else{
				if( typeof callback === "function" ){
					//Daten zurueckgeben
					callback( body );
				}
			}
	    });
}

/**
 * SYSTEM
 */

//Loginmanager
function mainLoginManager(){

	//check for Login Data
	//	sends messages to main.js to get Userinformation form there
	//	calls next functions, sets userdata as far as possible
	function checkForLoginData(){
		//IPC ask for Data
		ipc.send('ask-for-user-data')

		//IPC on Data back
		ipc.on('ask-for-user-data-back', function (event, data ) {
			//eingeloggt?
			if( data.loggedIn ){
				userdata = data.userdata;
				openNotesTool();
			}
			else{
				loginform();
			}
		});
	}

	//loginform
	function loginform(){
		//schon mal etwas im Formular gehabt?
		var lastinput = localStorage.getItem( 'lastinput' ) ;
		//	leer?
		if( lastinput !== null && lastinput != '' ){
			//Arraynparsen
			lastinput = JSON.parse( lastinput );
			//setzen
			$( "input#serverurl" ).val( lastinput[0] );
			$( "input#username" ).val( lastinput[1] );
		}

		//zeige Formular
		$( 'div.credentials' ).removeClass( 'disable' );
		$( 'div.message.loading' ).addClass( 'disable' );

		var password;
		
		//Höre auf Click/ Enter
		$('input#password').keypress(function (e) {
			if (e.which == 13) {
				checkUserDataGetAuthcode();
			}
		});
		$( 'button#loginsubmit' ).click( checkUserDataGetAuthcode );
		function checkUserDataGetAuthcode(){
			//check User Data and get Authcode
			$( 'div.message.loading' ).removeClass( 'disable' );
			
			//aus Formular holen
			userdata.server = $( "input#serverurl" ).val();
			//http(s) davor, wenn nicht da
			if( userdata.server.substr(0,7) != 'http://' && userdata.server.substr(0,8) != 'https://' ){
				userdata.server = 'https://' + userdata.server;
				
			}

			userdata.username = $( "input#username" ).val();
			password = $( "input#password" ).val();
			//	sichern, später vorschlagen
			localStorage.setItem( 'lastinput', JSON.stringify( [ userdata.server, userdata.username ] ) );

			//Hinweis, dass keine Verschlüsselte Verbindung
			if( userdata.server.substr(0,7) == 'http://' ){
				dialog.showMessageBox({
					type : "warning",
					title : "Unverschlüsselte Verbindung",
					message : "Die Verbindung zum angegebenen Server ist nicht verschlüsselt, dadurch werden die Inhalte der Notizen nicht geschützt!",
					buttons : ["Trotzdem anmelden", "Abbrechen"]
				}).then(res => {
					if( res.response === 0 ){
						//Login
						serverconnlogin();
					}
					else{
						//Ladebalken weg
						$( 'div.message.loading' ).addClass( 'disable' );						
					}
				});
			}
			else{
				serverconnlogin();
			}

			function serverconnlogin(){
				if(
					validUrl.isUri(  userdata.server )
					&&
					userdata.username.replace( /[^a-z]/, '' ) === userdata.username && userdata.username != ''
					&& 
					password != ''
				){
					//Passwort Hashen
					password = sjcl.codec.hex.fromBits( sjcl.hash.sha256.hash( password ));

					//Authcode holen
					web_request( 'auth',
						{ username : userdata.username , password : password  },
						function ( data ) {
							try{
								//erstmal String zu JSON
								data = JSON.parse( data );
							
								if(
									typeof data === "object"
									&&
									typeof data.status === "string"
									&&
									typeof data.error !== "undefined"
									&&
									typeof data.data !== "undefined"
								){
									//Login okay?
									if( data.status === "okay" ){
										//UserID und Authcode sichern
										userdata.userid = data.data.id;
										userdata.authcode = data.data.authcode;

										//Passwort aus DOM löschen
										$( "input#password" ).val('');

										//Daten sichern
										ipc.send( 'save-user-data', userdata );
													
										//Formular ausblenden
										$( 'div.credentials' ).addClass( 'disable' );

										//NotesTool öffnen
										openNotesTool();
									}
									else{
										$( 'div.message.loading' ).addClass( 'disable' );
										dialog.showErrorBox( 'Login nicht erfolgreich!', 'Bitte prüfen Sie Username und Passwort!' );
									}
								}
								else{
									throw new Error( 'Fehler' );
								}
							} catch(e){
								$( 'div.message.loading' ).addClass( 'disable' );
								dialog.showErrorBox( 'Fehlerhafte Serverantowort', 'Der angegebene Server hat nicht wie ein KIMB-Notes-Server geantowrtet!' );
							}
						});
				}
				else{
					$( 'div.message.loading' ).addClass( 'disable' );
					dialog.showErrorBox( 'Formulareingaben', 'Bitte füllen Sie allen Felder korrekt!' );
				}
			}
		}
	}

	//open Notes
	function openNotesTool(){
		//using webview and authcode
		var url = userdata.server + '/' + '#' + userdata.username + ':' + userdata.authcode;
		openWebView( url, ( webview ) => {
			webview.executeJavaScript( '{ displayAsApp(); $("h1").hide(); }' );
		});
	}

	//Erstmal nach bekannten Daten gucken.
	checkForLoginData();
}
//Logindaten suchen, Login versuchen, Notes öffnen,
//	wenn keine Daten gefunden, Formular zeigen
mainLoginManager();

//Authcode löschen, dann Fenster neu laden
function deleteAuthCode(){
	function logoutProblemDialog(){
		dialog.showMessageBox({
			type : "error",
			title : "Logout fehlgeschlagen",
			message : "Sie konnten nicht ausgeloggt werden, dies kann an einer fehlenden Internetverbindung oder an einem gelöschten Account auf dem Server liegen.",
			detail : "Möchten Sie eingeloggt bleiben oder sich trotzdem neu anmelden, dies führt dazu, dass der Authentifikationslink auf dem Server gültig bleibt.",
			buttons : ["Eingeloggt bleiben", "Neu anmelden"]
		}).then(res => {
			if( res.response === 1 ){
				//Ausloggen
				ipc.send( 'delete-userdata' );
			}
		});
	}

	//überhaupt Userdaten?
	if( userdata.server != '' ){
		//Code löschen
		web_request( 'account',
			{ userid : userdata.userid, authcode : userdata.authcode, art : 'del', id : sjcl.codec.hex.fromBits( sjcl.hash.sha256.hash( userdata.authcode )) },
			function ( data ) {
				//erstmal String zu JSON
				data = JSON.parse( data );

				//Antwort okay?
				if( data.status === "okay" ){
					//Ausloggen
					ipc.send( 'delete-userdata' );
				}
				else{
					logoutProblemDialog();
				}
		}, function(){
			logoutProblemDialog();
		});
	}
	else{
		dialog.showErrorBox( 'Kein Login', 'Es konnte kein Login gefunden werden!' );
	}
}

// IPC Messages
ipc.on( 'delete-authcode', deleteAuthCode );
ipc.on( 'webview-devtools', () => { $( "webview#mainWebview" )[0].openDevTools() } );