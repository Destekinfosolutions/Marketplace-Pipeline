
#!/bin/bash
# Navigate to your project jenkins/workspace/ directory
cd /var/lib/jenkins/workspace/nodeapp
# Copy files using rsync
cp -r * /var/nodeapp/test
# Navigate to your project directory
cd /var/nodeapp/test

# Find the process ID (PID) using port 3000
PID=$(lsof -t -i:3000)

# If the PID is not empty, kill the process
if [ -n "$PID" ]; then
  su -c "kill -9 $PID" -s /bin/bash root
fi

# Navigate to your project directory
cd /var/nodeapp/test
# stop pm2 process
pm2 stop ecosystem.config.js

# install node dependency
npm install
# start pm2 process
pm2 start ecosystem.config.js

# Find the process ID (PID) using port 3000
PID=$(lsof -t -i:3000)
# You may want to check if the process is still running after the deploy
if [ -n "$PID" ]; then
  echo "The process is still running with PID $PID."
else
  echo "Deployment successful.  process running on port 3000."
fi
