#!/bin/bash
##############################################################################
# Copyright (c) 2019 opnfv.
#
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################

proc_number=`ps -ef | grep opnfv-testapi | grep -v grep | wc -l`
if [ $proc_number -gt 0 ]; then
    procs=`ps -ef | grep opnfv-testapi | grep -v grep`
    echo "begin to kill opnfv-testapi $procs"
    ps -ef | grep opnfv-testapi | grep -v grep | awk '{print $2}' | xargs kill -kill &>/dev/null
fi

number=`docker ps -a | awk 'NR != 1' | grep testapi | wc -l`
if [ $number -gt 0 ]; then
    containers=number=`docker ps -a | awk 'NR != 1' | grep testapi`
    echo "begin to rm containers $containers"
    docker ps -a | awk 'NR != 1' | grep testapi | awk '{print $1}' | xargs docker rm -f &>/dev/null
fi
