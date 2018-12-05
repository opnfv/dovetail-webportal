##############################################################################
# Copyright (c) 2019
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################
from opnfv_testapi.resources import models
from opnfv_testapi.tornado_swagger import swagger

from datetime import datetime


@swagger.model()
class Review(models.ModelBase):
    def __init__(self, _id=None, test_id=None, reviewer_openid=None,
                 reviewer_email=None, reviewer_name=None, creation_date=None,
                 outcome=None):
        self._id = _id
        self.test_id = test_id
        self.reviewer_openid = reviewer_openid
        self.reviewer_email = reviewer_email
        self.reviewer_name = reviewer_name
        self.creation_date = datetime.now()
        self.outcome = outcome


@swagger.model()
class Reviews(models.ModelBase):
    """
        @property reviews:
        @ptype tests: C{list} of L{Review}
    """
    def __init__(self):
        self.reviews = list()

    @staticmethod
    def attr_parser():
        return {'reviews': Review}
