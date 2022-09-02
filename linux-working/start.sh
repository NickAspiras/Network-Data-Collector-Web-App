#!/bin/sh
#!/bin/bash
cd .
killall -9 node
xdg-open 'http://localhost:1771' && xdg-open 'http://localhost:1771/single' && nodemon index.js
exit
