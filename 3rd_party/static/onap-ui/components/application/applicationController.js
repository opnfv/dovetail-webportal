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
            ctrl.id_type = "Linux Foundation";
            ctrl.user_id = null;
            ctrl.description = null;
            ctrl.sut_version = null;
            ctrl.sut_hw_version = null;
            ctrl.onap_version = "2018.11";
            ctrl.onap_category = "Infrastructure";
            ctrl.company_logo = null;
            ctrl.approve_date = null;
            ctrl.approved = "false";
            ctrl.test_id = null;
            ctrl.lab_location = "internal";
            ctrl.lab_name = null;
            ctrl.lab_email = null;
            ctrl.lab_address = null;
            ctrl.lab_phone = null;
            ctrl.applications = [];
            ctrl.showApplications = [];

            ctrl.totalItems = null;
            ctrl.currentPage = 1;
            ctrl.itemsPerPage = 5;
            ctrl.numPages = null;
            ctrl.lab_tpl = "lab.tpl.html";
            ctrl.product_tpl = "product.tpl.html";
            //ctrl.lab_html=$sce.trustAsHtml('<div>{{app.lab_email}}</div><div>{{app.lab_address}}</div><div>{{app.lab_phone}}</div>');

            ctrl.vnf_version = null;
            ctrl.vnf_name = null;
            ctrl.vnf_type = null;
            ctrl.vnf_description = null;
            ctrl.vnfd_id = null;
            ctrl.vnfd_model_lang = "TOSCA";
            ctrl.vnf_test_period = "Functional";
            ctrl.vendor_name = null;
            ctrl.vendor_phone = null;
            ctrl.vendor_email = null;

            getApplication();
        }


        ctrl.submitForm = function() {
            var data = {
                "id_type": ctrl.id_type,
                "user_id": ctrl.user_id,
                "description": ctrl.description,
                "sut_version": ctrl.sut_version,
                "sut_hw_version": ctrl.sut_hw_version,
                "onap_version": ctrl.onap_version,
                "onap_category": ctrl.onap_category,
                "company_logo": ctrl.company_logo,
                "approve_date": ctrl.approve_date,
                "approved": ctrl.approved,
                "test_id": ctrl.test_id,
                "lab_location": ctrl.lab_location,
                "lab_email": ctrl.lab_email,
                "lab_address": ctrl.lab_address,
                "lab_phone": ctrl.lab_phone,
                "vnf_version": ctrl.vnf_version,
                "vnf_name": ctrl.vnf_name,
                "vnf_type": ctrl.vnf_type,
                "vnf_description": ctrl.vnf_description,
                "vnfd_id": ctrl.vnfd_id,
                "vnfd_model_lang": ctrl.vnfd_model_lang,
                "vnf_test_period": ctrl.vnf_test_period,
                "vendor_name": ctrl.vendor_name,
                "vendor_phone": ctrl.vendor_phone,
                "vendor_email": ctrl.vendor_email
            };
            $http.post(testapiApiUrl + "/onap/cvp/applications", data).then(function(resp) {
                if (resp.data.code && resp.data.code != 0) {
                    alert(resp.data.msg);
                    return;
                }
                getApplication();
            }, function(error) {
                /* do nothing */
            });
        }

        ctrl.openConfirmModal = function() {
            var resp = confirm("Are you sure to submit?");
            if (resp) {
                ctrl.submitForm();
            }
        }

        ctrl.cancelSubmit = function() {
            ngDialog.close();
        }

        ctrl.updatePage = function() {
            getApplication();
        }

        ctrl.deleteApp = function(id) {
            var resp = confirm('Are you sure to delete this application?');
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
        }

        init();
    }
})();
