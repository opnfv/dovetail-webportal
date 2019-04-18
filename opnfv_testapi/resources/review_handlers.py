##############################################################################
# Copyright (c) 2019 Intracom Telecom
# mokats@intracom-telecom.com
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################
from datetime import datetime
import logging

from tornado import web, gen

from opnfv_testapi.common.config import CONF
from opnfv_testapi.common import message, raises
from opnfv_testapi.db import api as dbapi
from opnfv_testapi.resources import handlers, review_models
from opnfv_testapi.tornado_swagger import swagger
from opnfv_testapi.ui.auth import constants as auth_const


class GenericReviewHandler(handlers.GenericApiHandler):
    def __init__(self, review, request, **kwargs):
        super(GenericReviewHandler, self).__init__(review, request, **kwargs)
        self.table = 'reviews'
        self.table_cls = review_models.Review


class ReviewsCLHandler(GenericReviewHandler):
    @swagger.operation(nickname="queryReviews")
    @web.asynchronous
    @gen.coroutine
    def get(self):
        def descend_limit():
            descend = self.get_query_argument('descend', 'true')
            return -1 if descend.lower() == 'true' else 1

        def last_limit():
            return self.get_int('last', self.get_query_argument('last', 0))

        def page_limit():
            return self.get_int('page', self.get_query_argument('page', 0))

        limitations = {
            'sort': {'_id': descend_limit()},
            'last': last_limit(),
            'page': page_limit(),
            'per_page': CONF.api_results_per_page
        }

        query = yield self.set_query()
        yield self._list(query=query, **limitations)
        logging.debug('list end')

    @swagger.operation(nickname="createReview")
    @web.asynchronous
    def post(self):
        openid = self.get_secure_cookie(auth_const.OPENID)
        if openid:
            self.json_args['reviewer_openid'] = openid

        if self.json_args['outcome'] is None:
            self._del()
        else:
            self._post()

    @gen.coroutine
    def _post(self):
        query = {'openid': self.json_args['reviewer_openid']}
        user = yield dbapi.db_find_one('users', query)
        if not user:
            raises.Forbidden(message.unauthorized())
        role = self.get_secure_cookie(auth_const.ROLE)
        if 'reviewer' not in role.split(','):
            if role is not 'reviewer':
                raises.Unauthorized(message.no_auth())
        test = yield dbapi.db_find_one(
            'tests', {'id': self.json_args['test_id']})
        if test['owner'] == self.json_args['reviewer_openid']:
            self.finish_request({'code': 403,
                                 'msg': 'No permision to review own results'})
            return
        query = {
            'reviewer_openid': self.json_args['reviewer_openid'],
            'test_id': self.json_args['test_id']
        }
        review = yield dbapi.db_find_one(self.table, query)
        if review:
            if review['outcome'] != self.json_args['outcome']:
                yield dbapi.db_update(self.table, query,
                                      {'$set': {
                                          'outcome': self.json_args['outcome'],
                                          'creation_date': datetime.now()}})
            self.finish_request()
        else:
            self.json_args['reviewer_name'] = user['fullname']
            self.json_args['reviewer_email'] = user['email']
            self._create(miss_fields=[], carriers=[])

    @gen.coroutine
    def _del(self):
        query = {'openid': self.json_args['reviewer_openid']}
        user = yield dbapi.db_find_one('users', query)
        if not user:
            raises.Forbidden(message.unauthorized())
        role = self.get_secure_cookie(auth_const.ROLE)
        if 'reviewer' not in role.split(','):
            if role is not 'reviewer':
                raises.Unauthorized(message.no_auth())
        test = yield dbapi.db_find_one(
            'tests', {'id': self.json_args['test_id']})
        if test['owner'] == self.json_args['reviewer_openid']:
            self.finish_request({'code': 403,
                                 'msg': 'No permision to review own results'})
            return
        query = {
            'reviewer_openid': self.json_args['reviewer_openid'],
            'test_id': self.json_args['test_id']
        }
        yield dbapi.db_delete(self.table, query)
        self.finish_request()
