/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
    'use strict';

    angular
        .module('testapiApp')
        .controller('ApplicationController', ApplicationController);

    ApplicationController.$inject = [
        '$http', '$stateParams', '$window', '$sce',
        '$uibModal', 'testapiApiUrl', 'raiseAlert', 'ngDialog', '$scope'
    ];

    /**
     */
    function ApplicationController($http, $stateParams, $window, $sce,
        $uibModal, testapiApiUrl, raiseAlert, ngDialog, $scope) {

        var ctrl = this;
        ctrl.uploadLogo = uploadLogo;

        function init() {
            ctrl.applications = [];
            ctrl.approvedTests = [];

            ctrl.totalItems = null;
            ctrl.currentPage = 1;
            ctrl.itemsPerPage = 5;
            ctrl.numPages = null;

            ctrl.lab_tpl = "lab.tpl.html";
            ctrl.product_tpl = "product.tpl.html";

            getApplication();
        }

        ctrl.updatePage = function() {
            getApplication();
        }

        ctrl.deleteApp = function(id) {
            var resp = confirm('Are you sure you want to delete this application?');
            if (!resp)
                return;

            var delUrl = testapiApiUrl + "/cvp/applications/" + id;
            $http.delete(delUrl)
            .then(function(ret) {
                if (ret.data.code && ret.data.code != 0) {
                    alert(ret.data.msg);
                    return;
                }
                getApplication();
            });
        }

        ctrl.approveApp = function(id) {
            var resp = confirm('Are you sure you want to approve this application?');
            if (!resp)
                return;

            var updateUrl = testapiApiUrl + "/cvp/applications/" + id;
            var data = {};
            data['item'] = 'approved';
            data['approved'] = 'true';

            $http.put(updateUrl, JSON.stringify(data), {
                transformRequest: angular.identity,
                headers: {'Content-Type': 'application/json'}}).then(function(ret) {
                    if (ret.data.code && ret.data.code != 0) {
                        alert(ret.data.msg);
                        return;
                    }
            }, function(error) {
                alert('Error when update data');
            });
        }

        function uploadLogo() {
            var file = $scope.logoFile;
            var fd = new FormData();
            fd.append('file', file);

            $http.post(testapiApiUrl + "/cvp/applications/uploadlogo", fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function(resp) {
                if (resp.data.code && resp.data.code != 0) {
                    alert(resp.data.msg);
                    return;
                }
            }, function(error) {
                /* do nothing */
            });

        };

        function getApplication() {
            $http.get(testapiApiUrl + "/onap/cvp/applications?page=" + ctrl.currentPage + "&signed&per_page=" + ctrl.itemsPerPage).then(function(response) {
                ctrl.applications = response.data.applications;
                ctrl.totalItems = response.data.pagination.total_pages * ctrl.itemsPerPage;
                ctrl.currentPage = response.data.pagination.current_page;
                ctrl.numPages = response.data.pagination.total_pages;
            }, function(error) {
                /* do nothing */
            });

            $http.get(testapiApiUrl + "/onap/tests?status=approved&signed").then(function(response) {
                ctrl.approvedTests = response.data.tests;
            }, function(error) {
                /* do nothing */
            });
        }

        init();
    }
})();
