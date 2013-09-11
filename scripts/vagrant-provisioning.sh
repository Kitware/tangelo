#!/usr/bin/env bash

# Install needed packages
apt-get update
apt-get install -y build-essential cmake-curses-gui git python-pip python-dev python-sphinx

# Install python packages
pip install cherrypy pymongo sphinx_bootstrap_theme

# Make the Tangelo build dir
cd /vagrant
rm -rf build
sudo -u vagrant mkdir build
cd build

# Configure Tangelo
sudo -u vagrant cmake \
   -DSERVER_HOSTNAME:STRING=0.0.0.0 \
   -DDEPLOY_EXAMPLES:BOOL=ON \
   -DDEPLOY_DOCUMENTATION:BOOL=ON \
   ..

# Build Tangelo
sudo -u vagrant make

# Start Tangelo service
sudo -u vagrant deploy/tangelo start
