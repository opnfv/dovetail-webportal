#!/bin/bash
##############################################################################
# Copyright (c) 2019 opnfv.
#
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################

number=`docker images | awk 'NR != 1' | grep testapi | wc -l`
if [ $number -gt 0 ]; then
    images=`docker images -a | awk 'NR != 1' | grep testapi | awk '{print $1}'`
    echo "begin to rm images $images"
    docker images | awk 'NR != 1' | grep testapi | awk '{print $3}' | xargs docker rmi -f &>/dev/null
fi
