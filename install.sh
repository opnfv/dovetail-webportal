#!/bin/bash
##############################################################################
# Copyright (c) 2019 opnfv.
#
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################

usage="
Script to install opnfv_tesgtapi automatically.
This script should be run under root.

usage:
    bash $(basename "$0") [-h|--help] [-t <test_name>]

where:
    -h|--help         show this help text"

# Ref :-  https://openstack.nimeyo.com/87286/openstack-packaging-all-definition-data-files-config-setup
if [ -z "$VIRTUAL_ENV" ];
then
    if [[ $(whoami) != "root" ]];
    then
        echo "Error: This script must be run as root!"
        exit 1
    fi
else
    sed -i -e 's#/etc/opnfv_testapi =#etc/opnfv_testapi =#g' setup.cfg
fi

python setup.py install
if [ ! -z "$VIRTUAL_ENV" ]; then
    sed -i -e 's#etc/opnfv_testapi =#/etc/opnfv_testapi =#g' setup.cfg
fi
