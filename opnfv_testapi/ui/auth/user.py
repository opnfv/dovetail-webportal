##############################################################################
# Copyright (c) 2015 Orange
# guyrodrigue.koffi@orange.com / koffirodrigue@gmail.com
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################

from tornado import gen
from tornado import web

from opnfv_testapi.common import message
from opnfv_testapi.common import raises
from opnfv_testapi.db import api as dbapi
from opnfv_testapi.resources import models
from opnfv_testapi.ui.auth import base
from opnfv_testapi.ui.auth import constants as auth_const


class ProfileHandler(base.BaseHandler):
    def __init__(self, application, request, **kwargs):
        super(ProfileHandler, self).__init__(application, request, **kwargs)
        self.table_cls = User

    @web.asynchronous
    @gen.coroutine
    def get(self):
        openid = self.get_secure_cookie('openid')
        if openid:
            try:
                user = yield dbapi.db_find_one(self.table, {'openid': openid})
                self.finish_request({
                    "openid": user.get('openid'),
                    "email": user.get('email'),
                    "fullname": user.get('fullname'),
                    "role": user.get('role', 'user'),
                    "type": self.get_secure_cookie('signin_type'),
                    "organizationName": user.get('organizationName'),
                    "organizationWebsite": user.get('organizationWebsite'),
                    "companyName": user.get('companyName'),
                    "companyLogo": user.get('companyLogo'),
                    "companyWebsite": user.get('companyWebsite'),
                    "primaryContactName": user.get('primaryContactName'),
                    "primaryBusinessEmail": user.get('primaryBusinessEmail'),
                    "primaryPostalAddress": user.get('primaryPostalAddress'),
                    "primaryPhoneNumber": user.get('primaryPhoneNumber')

                })
            except Exception:
                pass
        raises.Unauthorized('Unauthorized')

    @gen.coroutine
    def put(self):
        db_keys = []
        openid = self.get_secure_cookie(auth_const.OPENID)

        if openid:
            query = {'openid': openid}
            user = yield dbapi.db_find_one(self.table, query)
            if not user:
                raises.NotFound(message.not_found(self.table, query))

            self._update(query=query, db_keys=db_keys)
        else:
            raises.Unauthorized(message.no_auth())


class User(models.ModelBase):
    def __init__(self, _id=None, openid=None, email=None, fullname=None,
                 role='user', u_type=None, organizationName=None,
                 organizationWebsite=None, companyName=None, companyLogo=None,
                 companyWebsite=None, primaryContactName=None,
                 primaryBusinessEmail=None, primaryPostalAddress=None,
                 primaryPhoneNumber=None):
        self._id = _id
        self.openid = openid
        self.email = email
        self.fullname = fullname
        self.role = role
        self.type = u_type

        self.organizationName = organizationName
        self.organizationWebsite = organizationWebsite
        self.companyName = companyName
        self.companyLogo = companyLogo
        self.companyWebsite = companyWebsite
        self.primaryContactName = primaryContactName
        self.primaryBusinessEmail = primaryBusinessEmail
        self.primaryPostalAddress = primaryPostalAddress
        self.primaryPhoneNumber = primaryPhoneNumber
