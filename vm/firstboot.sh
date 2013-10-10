#!/bin/bash
LXC=`grep -q lxc /proc/1/environ && echo 'yes' || echo 'no'`

export DEBIAN_FRONTEND=noninteractive
apt-get install -y \
    update-manager-core \
    python-software-properties
add-apt-repository -y ppa:j/pandora
apt-get update

if [ "$LXC" == "no" ]; then
apt-get install -y \
    acpid \
    ntp
fi

apt-get install -y \
    openssh-server \
    vim \
    wget \
    pwgen \
    nginx \
    rabbitmq-server \
    bzr \
    git \
    subversion \
    mercurial \
    python-setuptools \
    python-pip \
    python-virtualenv \
    python-imaging \
    python-dev \
    python-imaging \
    python-numpy \
    python-psycopg2 \
    python-pyinotify \
    python-simplejson \
    python-lxml \
    python-html5lib \
    python-ox \
    python-gst0.10 \
    gstreamer0.10-plugins-good \
    gstreamer0.10-plugins-bad \
    oxframe \
    libavcodec-extra-53 \
    libav-tools \
    ffmpeg2theora \
    imagemagick \
    ipython \
    postfix \
    postgresql \
    postgresql-contrib

sudo -u postgres createuser -S -D -R pandora
sudo -u postgres createdb  -T template0 --locale=C --encoding=UTF8 -O pandora pandora
echo "CREATE EXTENSION pg_trgm;" | sudo -u postgres psql pandora

#rabbitmq
RABBITPWD=$(pwgen -n 16 -1)
rabbitmqctl add_user pandora $RABBITPWD
rabbitmqctl add_vhost /pandora
rabbitmqctl set_permissions -p /pandora pandora ".*" ".*" ".*"

#pandora
bzr branch http://code.0x2620.org/pandora /srv/pandora
bzr branch http://code.0x2620.org/oxjs /srv/pandora/static/oxjs
virtualenv --system-site-packages /srv/pandora
/srv/pandora/bin/pip install -r /srv/pandora/requirements.txt

HOST=$(hostname -s)
HOST_CONFIG="/srv/pandora/pandora/config.$HOST.jsonc"
SITE_CONFIG="/srv/pandora/pandora/config.jsonc"
test -e $HOST_CONFIG && cp $HOST_CONFIG $SITE_CONFIG
test -e $SITE_CONFIG || cp /srv/pandora/pandora/config.pandora.jsonc $SITE_CONFIG

cat > /srv/pandora/pandora/local_settings.py << EOF
DATABASES = {
    'default': {
        'NAME': 'pandora',
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'USER': 'pandora',
        'PASSWORD': '',
    }
}
BROKER_PASSWORD = "$RABBITPWD"
XACCELREDIRECT = True

DEBUG = False
TEMPLATE_DEBUG = DEBUG
JSON_DEBUG = False
EOF

MANAGE="sudo -H -u pandora python manage.py"

cd /srv/pandora/pandora
$MANAGE syncdb --noinput
$MANAGE migrate
echo "DB_GIN_TRGM = True" >> /srv/pandora/pandora/local_settings.py
$MANAGE sqlfindindex
$MANAGE sync_itemsort
echo "UPDATE django_site SET domain = '$HOST.local', name = '$HOST.local' WHERE 1=1;" | $MANAGE dbshell

mkdir /srv/pandora/data
chown -R pandora:pandora /srv/pandora
$MANAGE update_static
$MANAGE collectstatic -l --noinput

cp /srv/pandora/etc/init/* /etc/init/

/srv/pandora/ctl start

#logrotate
cp "/srv/pandora/etc/logrotate.d/pandora" "/etc/logrotate.d/pandora"

#nginx
cp "/srv/pandora/etc/nginx/pandora" "/etc/nginx/sites-available/default"

read -r -d '' GZIP <<EOI
gzip_static  on;\\
\tgzip_http_version 1.1;\\
\tgzip_vary on;\\
\tgzip_comp_level 6;\\
\tgzip_proxied any;\\
\tgzip_types text/plain text/css application/json text/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/javascript text/x-js;\\
\tgzip_buffers 16 8k;\\
\tgzip_disable "MSIE [1-6]\.(?!.*SV1)";
EOI

sed -i -e "s#gzip_disable \"msie6\";#${GZIP}#g" /etc/nginx/nginx.conf

service nginx restart

if [ "$LXC" == "yes" ]; then
    sed -i "s/-D/--no-rlimits -D/g" /etc/init/avahi-daemon.conf
fi

if [ "$LXC" == "no" ]; then
cat > /usr/local/bin/fixtime <<EOF
#!/bin/bash
while [ 1 ]; do
    /usr/sbin/ntpdate pool.ntp.org >/dev/null
    sleep 600
done
EOF
chmod +x /usr/local/bin/fixtime
fi

cat > /usr/local/bin/genissue <<EOF
#!/bin/bash
HOST=\$(rgrep .local /var/log/syslog | grep "Host name is" | tail -n 1 | awk '{print \$12}' | sed 's/\.$//')
echo Welcome to pan.do/ra. Connect via one of these URLs:
echo 
if [ -n "$HOST" ]; then
    echo "  http://\$HOST/"
fi
for ip in \$(ifconfig  | grep 'inet addr:'| grep -v '127.0.0.1' | cut -d: -f2 | awk '{ print \$1 }'); do
    echo "  http://\$ip/"
done
echo
EOF
chmod +x /usr/local/bin/genissue
/usr/local/bin/genissue > /etc/issue

cat > /etc/rc.local << EOF
#!/bin/sh -e
#vm has one network interface and that might change, make it not persistent
rm -f /etc/udev/rules.d/70-persistent-net.rules

#update issue
/usr/local/bin/genissue > /etc/issue
EOF

if [ "$LXC" == "no" ]; then
cat >> /etc/rc.local << EOF

#vm can be suspended, this help to keep the time in sync
/usr/local/bin/fixtime &
EOF
fi
chmod +x /etc/rc.local

cat > /home/pandora/.vimrc <<EOF
set nocompatible
set encoding=utf-8
set showcmd
set autochdir

set tabstop=4 shiftwidth=4
set expandtab

set si
set sw=4
set sts=4
set backspace=indent,eol,start

set hlsearch
set incsearch
set ignorecase
set smartcase

set modeline

nmap <C-V> "+gP
imap <C-V> <ESC><C-V>i
vmap <C-C> "+y

filetype plugin indent on
syntax on

nmap <C-H> :tabprev<CR>
nmap <C-L> :tabnext<CR>

hi SpellBad ctermbg=0

nnoremap <F2> :set invpaste paste?<CR>
set pastetoggle=<F2>
set showmode
EOF
apt-get clean
