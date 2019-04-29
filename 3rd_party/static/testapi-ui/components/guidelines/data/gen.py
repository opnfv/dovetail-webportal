##############################################################################
# Copyright (c) 2019 opnfv.
#
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################

import json

with open('danube.json') as f:
    data = json.load(f)
mapping = {}
for i in data['mandatory']['value']:
    for j in i['value']:
        for k in j['value']:
            mapping[k] = True
for i in data['optional']['value']:
    for j in i['value']:
        for k in j['value']:
            mapping[k] = False

with open('mandatory.json', 'w') as f:
    f.write(json.dumps(mapping))
