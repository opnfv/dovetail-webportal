#!/bin/bash
NGINX_CONF=/etc/nginx/sites-enabled/default
LFN_HOME=/www/static/lfn-ui/index.html

if [ "$testapi_url" != "" ]; then
    sed -i "s/server cvpapi:8010/server $testapi_url/" $NGINX_CONF
fi

if [ -f "$LFN_HOME" ] && [ "$local_deployment" == 'True' ]; then
    sed -i "s|https://verified.opnfv.org|http://ovp.localhost|" $LFN_HOME
    sed -i "s|https://verified.onap.org|http://onap.localhost|" $LFN_HOME
fi

service supervisor start

tail -f /var/log/supervisor/supervisord.log
