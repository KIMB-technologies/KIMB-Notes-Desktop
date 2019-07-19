#!/bin/bash

# Install wine to run package-win
npm install wine-darwin
# Setup ~/.wine by running a command
./node_modules/.bin/wine hostnamene

npm install electron

npm run package-win
zip -r -9 application/KIMB-Notes-Desktop-win32-x64.zip application/KIMB-Notes-Desktop-win32-x64

npm run package-linux
zip -r -9 application/KIMB-Notes-Desktop-linux-x64.zip application/KIMB-Notes-Desktop-linux-x64

npm run package-mac
npm run create-dmg
