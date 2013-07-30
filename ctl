#!/bin/sh
if [ -z "$1" ]; then
    echo "Usage: $0 (start|stop|restart|reload)"
    exit 1
else
    action="$1"
fi
if [ `whoami` != 'root' ]; then
    echo you have to be root or run $0 with sudo
    exit 1
fi
for service in pandora pandora-tasks pandora-encoding pandora-cron; do
    service $service $action
done
