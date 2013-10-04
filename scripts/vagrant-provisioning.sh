#!/usr/bin/env bash

# 10gen repo for mongo
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/mongodb.list

# Install needed packages
apt-get update
apt-get install -y \
    build-essential \
    cmake-curses-gui \
    git \
    python-pip \
    python-dev \
    python-sphinx \
    vim \
    curl \
    couchdb \
    mongodb-10gen \
    uglifyjs

# Configure couch to work under port forwarding
cp /vagrant/scripts/vagrant-couchdb-local.ini /etc/couchdb/local.ini

# Restart couch. Note that '/etc/init.d/couchdb stop' does not seem to work, nor does 'couchdb -d'.
# See http://serverfault.com/questions/79453/why-cant-i-access-my-couchdb-instance-externally-on-ubuntu-9-04-server
# and http://maythesource.com/2012/06/15/killing-couchdb-on-ubuntu-10-04/
ps -U couchdb -o pid= | xargs kill -9
/etc/init.d/couchdb start

# Install python packages
pip install cherrypy pymongo ws4py autobahn

# Make the Tangelo build dir
cd /vagrant
rm -rf build
sudo -u vagrant mkdir build
cd build

# Configure Tangelo
sudo -u vagrant cmake \
    -DSERVER_HOSTNAME:STRING=0.0.0.0 \
    -DDEPLOY_DOCUMENTATION:BOOL=ON \
    ..

# Build Tangelo
sudo -u vagrant make

# Start Tangelo service
sudo -u vagrant deploy/tangelo start
echo 'provisioning complete'
echo 'serving CouchDB on the host machine at http://localhost:6984'
echo 'serving Tangelo on the host machine at http://localhost:9000'
