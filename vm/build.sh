#!/bin/sh
size=1048576 #in MB
arch=amd64   #i368 or amd64
password=pandora

hypervisor=vbox #vbox or kvm

extra=""

#make available as pandora.local
extra="--addpkg avahi-daemon"

#to create and include in libvirt:
#hypervisor=kvm
#extra="--libvirt qemu:///system"

base=$(pwd)
sudo  vmbuilder $hypervisor ubuntu --suite=precise \
    --verbose --debug \
    --arch $arch \
    --flavour generic \
    --dest $base/pandora \
    --hostname pandora \
    --swapsize 512 \
    --rootsize $size \
    --user pandora \
    --pass $password \
    --components main,universe,multiverse \
    --firstboot=$base/firstboot.sh \
    $extra
