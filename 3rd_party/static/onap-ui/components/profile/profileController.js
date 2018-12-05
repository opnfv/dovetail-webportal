/*
 *
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
        .controller('ProfileController', ProfileController);

    ProfileController.$inject = [
        '$scope', '$state', '$http', 'testapiApiUrl'
    ];

    /**
     * TestAPI Profile Controller
     * This controller handles user's profile page, where a user can view
     * account-specific information.
     */
    function ProfileController($scope, $state, $http, testapiApiUrl) {

        var ctrl = this;

//        ctrl.changeLabel = changeLabel;

        // Must be authenticated to view this page.
        if (!$scope.auth.isAuthenticated) {
            $state.go('home');
        }

        ctrl.authRequest = $scope.auth.doSignCheck();

        ctrl.organizationName = "Intracom Telecom";
        ctrl.organizationWebsite = "www.intracom-telecom.com";
        ctrl.ventorName = "Ericsson";
        ctrl.ventorEmail = "info@ericsson.com";
        ctrl.ventorPhone = "(+30) 666 666 666";
        ctrl.companyName = "Intracom Telecom";
        ctrl.companyLogo = "Intracom";
        ctrl.primaryContactName = "George L";
        ctrl.primaryBusinessEmail = "pgeo@intracom-telecom.com";
        ctrl.primaryPostalAddress = "19.3 Km L. Markopoulou, Peania";
        ctrl.primaryPhoneNumber = "(+30) 777 777 777";


        var data = {
             "organizationName": ctrl.organizationName,
             "organizationWebsite": ctrl.organizationWebsite,
             "ventorName": ctrl.ventorName,
             "ventorEmail": ctrl.ventorEmail,
             "ventorPhone": ctrl.ventorPhone,
             "companyName": ctrl.companyName,
             "companyLogo": ctrl.companyLogo,
             "primaryContactName": ctrl.primaryContactName,
             "primaryBusinessEmail": ctrl.primaryBusinessEmail,
             "primaryPostalAddress": ctrl.primaryPostalAddress,
             "primaryPhoneNumber": ctrl.primaryPhoneNumber
        };
        ctrl.profile = data;
        $http.post(testapiApiUrl + "/profile", data).then(function(resp){
                    if(resp.data.code && resp.data.code != 0) {
                        alert(resp.data.msg);
                        return;
                    }
                    getProfile();
		}, function(error){
        });
//        $http.get(testapiApiUrl + "/onap/profile").then(function(response) {
//            ctrl.profile = response.data.profile;
//        }, function(error) {
//                /* do nothing */
//        });
        function getProfile() {
        $http.get(testapiApiUrl + "/onap/profile?page=").then(function(response) {
        ctrl.profile = response.data.profile;
        ctrl.totalItems = response.data.pagination.total_pages * ctrl.itemsPerPage;
        ctrl.currentPage = response.data.pagination.current_page;
        ctrl.numPages = response.data.pagination.total_pages;
        }, function(error) {
            /* do nothing */
        });

        }

//          function changeLabel(result, key, data){
//          toggleCheck(result, key, data);
//          }

      }


})();
