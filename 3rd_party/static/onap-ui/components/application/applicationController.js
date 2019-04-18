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

        function init() {
            ctrl.applications = [];

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

        ctrl.toggleApproveApp = function(id, approved, owner) {
            if (approved === 'true') {
                var text = 'Are you sure you want to approve this application?';
            } else {
                var text = 'Are you sure you want to remove approval of this application?';
            }

            var resp = confirm(text);
            if (!resp)
                return;

            var updateUrl = testapiApiUrl + "/cvp/applications/" + id;
            var data = {};
            data['item'] = 'approved';
            data['approved'] = approved;
            data['owner'] = owner;

            $http.put(updateUrl, JSON.stringify(data), {
                transformRequest: angular.identity,
                headers: {'Content-Type': 'application/json'}}).then(function(ret) {
                    if (ret.data.code && ret.data.code != 0) {
                        alert(ret.data.msg);
                        return;
                    }
                    getApplication();
            }, function(error) {
                alert('Error when update data');
            });
        }

        function getApplication() {
            $http.get(testapiApiUrl + "/onap/cvp/applications?page=" + ctrl.currentPage + "&signed&per_page=" + ctrl.itemsPerPage + "&applications").then(function(response) {
                ctrl.applications = response.data.applications;
                ctrl.totalItems = response.data.pagination.total_pages * ctrl.itemsPerPage;
                ctrl.currentPage = response.data.pagination.current_page;
                ctrl.numPages = response.data.pagination.total_pages;
            }, function(error) {
                /* do nothing */
            });
        }

        init();
    }
})();
