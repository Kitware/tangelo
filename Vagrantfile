# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"
  config.vm.network :forwarded_port, host: 9000, guest: 8080
  config.vm.network :forwarded_port, guest: 5984, host: 6984
  config.vm.provision :shell, :path => "scripts/vagrant-provisioning.sh"
end
