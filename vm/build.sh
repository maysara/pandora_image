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
sudo  vmbuilder vbox ubuntu --suite=precise \
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
    --ppa j/pandora \
    --addpkg openssh-server \
    --addpkg acpid \
    --addpkg vim \
    --addpkg wget \
    --addpkg pwgen \
    --addpkg nginx \
    --addpkg rabbitmq-server \
    --addpkg bzr \
    --addpkg git \
    --addpkg subversion \
    --addpkg mercurial \
    --addpkg update-manager-core \
    --addpkg python-software-properties \
    --addpkg python-setuptools \
    --addpkg python-pip \
    --addpkg python-virtualenv \
    --addpkg python-imaging \
    --addpkg python-dev \
    --addpkg python-imaging \
    --addpkg python-numpy \
    --addpkg python-psycopg2 \
    --addpkg python-pyinotify \
    --addpkg python-simplejson \
    --addpkg python-lxml \
    --addpkg python-html5lib \
    --addpkg python-ox \
    --addpkg python-gst0.10 \
    --addpkg gstreamer0.10-plugins-good \
    --addpkg gstreamer0.10-plugins-bad \
    --addpkg oxframe \
    --addpkg libavcodec-extra-53 \
    --addpkg libav-tools \
    --addpkg ffmpeg2theora \
    --addpkg imagemagick \
    --firstboot=$base/firstboot.sh \
    $extra
