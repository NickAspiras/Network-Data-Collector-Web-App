#!/bin/sh
#!/bin/bash
cd "."
pwd
sudo apt install npm
npm install && npm audit fix
sudo npm install nodemon --unsafe-perm=true --allow-root && npm audit fix
sudo npm install n --unsafe-perm=true --allow-root && npm audit fix
sudo npm install -g nodemon --unsafe-perm=true --allow-root && npm audit fix
sudo npm install -g n --unsafe-perm=true --allow-root && npm audit fix
sudo n stable
sudo npm install puppeteer --unsafe-perm=true --allow-root && npm audit fix --force
sudo npm install nodemailer --unsafe-perm=true --allow-root && npm audit fix --force
