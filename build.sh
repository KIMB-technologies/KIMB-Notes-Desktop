#!/bin/bash

npm install

if [ "$TRAVIS_OS_NAME" = "linux" ]; then

	# Install wine to run package-win
	sudo apt-get install wine-stable 
	# Setup ~/.wine by running a command
	wine hostnamene

	npm run package-win
	zip -r -9 application/KIMB-Notes-Desktop-win32-x64.zip application/KIMB-Notes-Desktop-win32-x64

	npm run package-linux
	zip -r -9 application/KIMB-Notes-Desktop-linux-x64.zip application/KIMB-Notes-Desktop-linux-x64

fi;

if [ "$TRAVIS_OS_NAME" = "osx" ]; then

	npm run package-mac
	npm run create-dmg

fi;
