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

        ctrl.changeProfileDetails = changeProfileDetails;

        // Must be authenticated to view this page.
        if (!$scope.auth.isAuthenticated) {
            $state.go('home');
        }

        ctrl.authRequest = $scope.auth.doSignCheck();
        ctrl.profile = $scope.auth.currentUser;

        function changeProfileDetails(profile, key, newValue){
            var updateUrl = testapiApiUrl + "/profile";

            var data = {};
            data[key] = newValue;

            $http.put(updateUrl, JSON.stringify(data), {
                transformRequest: angular.identity,
                headers: {'Content-Type': 'application/json'}}).then(function(ret) {
                    if (ret.data.code && ret.data.code != 0) {
                        alert(ret.data.msg);
                    } else {
                        profile[key] = newValue;
                    }
            }, function(error) {
                alert("Error  when update data");
            });
        }
    }
})();
