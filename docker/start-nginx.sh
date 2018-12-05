#!/bin/bash
NGINX_CONF=/etc/nginx/sites-enabled/default

if [ "$testapi_url" != "" ]; then
    sed -i "s/server lfnapi:8010/server $testapi_url/" $NGINX_CONF
fi

service supervisor start

tail -f /var/log/supervisor/supervisord.log
