#!/usr/bin/env bash

apt-get update
apt-get install -y build-essential
apt-get install -y cmake-curses-gui
apt-get install -y git
apt-get install -y python-pip
apt-get install -y python-dev
pip install cherrypy
pip install pymongo
rm -rf tangelo
sudo -u vagrant git clone https://github.com/Kitware/tangelo.git
rm -rf tangelo-build
sudo -u vagrant mkdir tangelo-build
cd tangelo-build
sudo -u vagrant cmake \
   -DSERVER_HOSTNAME:STRING=0.0.0.0 \
   -DDEPLOY_EXAMPLES:BOOL=ON \
   ../tangelo
sudo -u vagrant make
sudo -u vagrant deploy/tangelo start
