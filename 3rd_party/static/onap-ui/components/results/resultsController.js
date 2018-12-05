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
        .controller('ResultsController', ResultsController);

    angular
        .module('testapiApp')
        .directive('fileModel', ['$parse', function ($parse) {
            return {
               restrict: 'A',
               link: function(scope, element, attrs) {
                  var model = $parse(attrs.fileModel);
                  var modelSetter = model.assign;

                  element.bind('change', function(){
                     scope.$apply(function(){
                        modelSetter(scope, element[0].files[0]);
                     });
                  });
               }
            };
         }]);

    ResultsController.$inject = [
        '$scope', '$http', '$filter', '$state', 'testapiApiUrl','raiseAlert', 'ngDialog', '$resource'
    ];

    /**
     * TestAPI Results Controller
     * This controller is for the '/results' page where a user can browse
     * a listing of community uploaded results.
     */
    function ResultsController($scope, $http, $filter, $state, testapiApiUrl, raiseAlert, ngDialog, $resource) {
        var ctrl = this;

        ctrl.uploadFile=uploadFile;
        ctrl.update = update;
        ctrl.open = open;
        ctrl.clearFilters = clearFilters;
        ctrl.associateMeta = associateMeta;
        ctrl.gotoSUT = gotoSUT;
        ctrl.gotoResultDetail = gotoResultDetail;
        ctrl.toggleCheck = toggleCheck;
        ctrl.changeLabel = changeLabel;
        ctrl.toReview = toReview;
        ctrl.toPrivate = toPrivate;
        ctrl.removeSharedUser = removeSharedUser;
        ctrl.addSharedUser = addSharedUser;
        ctrl.openSharedModal = openSharedModal;
        ctrl.downloadLogs = downloadLogs;
        ctrl.deleteTest = deleteTest;
        ctrl.openApplicationModal = openApplicationModal;
        ctrl.submitApplication = submitApplication;
        ctrl.openConfirmModal = openConfirmModal;

        /** Mappings of Interop WG components to marketing program names. */
        ctrl.targetMappings = {
            'platform': 'Openstack Powered Platform',
            'compute': 'OpenStack Powered Compute',
            'object': 'OpenStack Powered Object Storage'
        };

        /** Initial page to be on. */
        ctrl.currentPage = 1;

        /**
         * How many results should display on each page. Since pagination
         * is server-side implemented, this value should match the
         * 'results_per_page' configuration of the TestAPI server which
         * defaults to 20.
         */
        ctrl.itemsPerPage = 20;

        /**
         * How many page buttons should be displayed at max before adding
         * the '...' button.
         */
        ctrl.maxSize = 5;

        /** The upload date lower limit to be used in filtering results. */
        ctrl.startDate = '';

        /** The upload date upper limit to be used in filtering results. */
        ctrl.endDate = '';

        /** The date format for the date picker. */
        ctrl.format = 'yyyy-MM-dd';

        ctrl.userName = null;

        /** Check to see if this page should display user-specific results. */
        // ctrl.isUserResults = $state.current.name === 'userResults';
        // need auth to browse
        ctrl.isUserResults = $state.current.name === 'userResults';

        ctrl.currentUser = $scope.auth.currentUser ? $scope.auth.currentUser.openid : null;
        console.log($scope.auth);

        // Should only be on user-results-page if authenticated.
        if (ctrl.isUserResults && !$scope.auth.isAuthenticated) {
            $state.go('home');
        }

        ctrl.pageHeader = ctrl.isUserResults ?
            'Private test results' : 'Community test results';

        ctrl.pageParagraph = ctrl.isUserResults ?
            'Your most recently uploaded test results are listed here.' :
            'The most recently uploaded community test results are listed ' +
            'here.';

        ctrl.uploadState = '';

        if (ctrl.isUserResults) {
            ctrl.authRequest = $scope.auth.doSignCheck()
                .then(ctrl.update);
        } else {
            ctrl.update();
        }

        function downloadLogs(id) {
            // var logsUrl = testapiApiUrl + "/logs/log_" + id+".tar.gz";
            var logsUrl = "/logs/" + id+"/results/";
            window.location.href = logsUrl;
            // $http.get(logsUrl);
        }

        function deleteTest(inner_id) {
          var resp = confirm('Are you sure to delete this test?');
          if (!resp)
            return;

          var delUrl = testapiApiUrl + "/tests/" + inner_id;
          $http.get(delUrl)
            .then( function(resp) {
              var results = resp.data.results;
              $http.delete(delUrl)
                .then( function(ret) {
                  if(ret.data.code && ret.data.code != 0) {
                    alert(ret.data.msg);
                    return;
                  }
                  ctrl.update();
                  angular.forEach(results, function(ele) {
                    delUrl = testapiApiUrl + "/results/" + ele;
                    $http.delete(delUrl);
                  });
                });
            });
        }

        function submitApplication(result) {
            var data = {
                "description": ctrl.description,
                "sut_version": ctrl.sut_version,
                "sut_hw_version": ctrl.sut_hw_version,
                "onap_version": ctrl.onap_version,
                "onap_category": ctrl.onap_category,
                "company_logo": ctrl.company_logo,
                "approve_date": null,
                "approved": "false",
                "test_id": result._id,
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
            }, function(error) {
                /* do nothing */
            });
            ngDialog.close();
        }

        function openConfirmModal(result) {
            var resp = confirm("Are you sure to submit?");
            if (resp) {
                ctrl.submitApplication(result);
            }
        }

        function openApplicationModal(result) {
            ctrl.tempResult = result;
                ngDialog.open({
                    preCloseCallback: function(value) {
                    },
                    template: 'onap-ui/components/results/modal/applicationModal.html',
                    scope: $scope,
                    className: 'ngdialog-theme-default custom-background',
                    width: 950,
                    showClose: true,
                    closeByDocument: true
                });
        }

        function toggleCheck(result, item, newValue) {
            var id = result._id;
            var updateUrl = testapiApiUrl + "/tests/"+ id;

            var data = {};
            data['item'] = item;
            data[item] = newValue;

            $http.put(updateUrl, JSON.stringify(data), {
                transformRequest: angular.identity,
                headers: {'Content-Type': 'application/json'}}).then(function(ret){
                    if(ret.data.code && ret.data.code != 0) {
                        alert(ret.data.msg);
                    }
                    else {
                        result[item] = newValue;
                        console.log('update success');
                    }
            }, function(error){
                alert("Error  when update data");
            });
        }

        function changeLabel(result, key, data){
            toggleCheck(result, key, data);
        }

        function toReview(result, value){
            var resp = confirm('Once you submit a test result for review, it will become readable to all ONAPVP reviewers. Do you want to proceed?');
            if(resp){
                toggleCheck(result, 'status', value);
            }
        }

        function toPrivate(result, value){
            var resp = confirm('Do you want to proceed?');
            if(resp){
                toggleCheck(result, 'status', value);
            }
        }

        function openSharedModal(result){
            ctrl.tempResult = result;
                ngDialog.open({
                    preCloseCallback: function(value) {
                    },
                    template: 'onap-ui/components/results/modal/sharedModal.html',
                    scope: $scope,
                    className: 'ngdialog-theme-default',
                    width: 950,
                    showClose: true,
                    closeByDocument: true
                });
        }

        function addSharedUser(result, userId){
            var tempList = copy(result.shared);
            tempList.push(userId);
            toggleCheck(result, 'shared', tempList);
            ngDialog.close();
        }

        function removeSharedUser(result, userId){
            var tempList = copy(result.shared);
            var idx = tempList.indexOf(userId);
            if(idx != -1){
                tempList.splice(idx, 1);
                toggleCheck(result, 'shared', tempList);
            }
        }

        function copy(arrList){
            var tempList = [];
            angular.forEach(arrList, function(ele){
                tempList.push(ele);
            });
            return tempList;
        }

        function uploadFileToUrl(file, uploadUrl){
            var fd = new FormData();
            fd.append('file', file);

            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function(data){

                if(data.data.code && data.data.code != 0){
                    alert(data.data.msg);
                    return;
                }

                ctrl.uploadState = "";
                data.data.filename = file.name;
                var createTestUrl = testapiApiUrl + "/onap/tests"

                $http.post(createTestUrl, data.data).then(function(data){
                    if (data.data.code && data.data.code != 0) {
                        alert(data.data.msg);
                    } else {
                        ctrl.update();
                    }
                }, function(error){
                });

             }, function(error){
                ctrl.uploadState = "Upload failed. Error code is " + error.status;
            });
        }

        function uploadFile(){
           var file = $scope.resultFile;
           console.log('file is ' );
           console.dir(file);

           var uploadUrl = testapiApiUrl + "/onap/results/upload";
           uploadFileToUrl(file, uploadUrl);
        };

        /**
         * This will contact the TestAPI API to get a listing of test run
         * results.
         */
        function update() {
            ctrl.showError = false;
            // Construct the API URL based on user-specified filters.
            var content_url = testapiApiUrl + '/onap/tests' +
                '?page=' + ctrl.currentPage;
            var start = $filter('date')(ctrl.startDate, 'yyyy-MM-dd');
            if (start) {
                content_url =
                    content_url + '&from=' + start + ' 00:00:00';
            }
            var end = $filter('date')(ctrl.endDate, 'yyyy-MM-dd');
            if (end) {
                content_url = content_url + '&to=' + end + ' 23:59:59';
            }
            if (ctrl.isUserResults) {
                content_url = content_url + '&signed'+'&per_page='+ ctrl.itemsPerPage;
            }
            ctrl.resultsRequest =
                $http.get(content_url).success(function (data) {
                    ctrl.data = data;
                    ctrl.totalItems = ctrl.data.pagination.total_pages * ctrl.itemsPerPage;
                    ctrl.currentPage = ctrl.data.pagination.current_page;
                    ctrl.numPages = ctrl.data.pagination.total_pages;
                    console.log(ctrl.data);
                }).error(function (error) {
                    ctrl.data = null;
                    ctrl.totalItems = 0;
                    ctrl.showError = true;
                    ctrl.error =
                        'Error retrieving results listing from server: ' +
                        angular.toJson(error);
                });
        }

        /**
         * This is called when the date filter calendar is opened. It
         * does some event handling, and sets a scope variable so the UI
         * knows which calendar was opened.
         * @param {Object} $event - The Event object
         * @param {String} openVar - Tells which calendar was opened
         */
        function open($event, openVar) {
            $event.preventDefault();
            $event.stopPropagation();
            ctrl[openVar] = true;
        }

        /**
         * This function will clear all filters and update the results
         * listing.
         */
        function clearFilters() {
            ctrl.startDate = null;
            ctrl.endDate = null;
            ctrl.update();
        }

        /**
         * This will send an API request in order to associate a metadata
         * key-value pair with the given testId
         * @param {Number} index - index of the test object in the results list
         * @param {String} key - metadata key
         * @param {String} value - metadata value
         */
        function associateMeta(index, key, value) {
            var testId = ctrl.data.results[index].id;
            var metaUrl = [
                testapiApiUrl, '/results/', testId, '/meta/', key
            ].join('');

            var editFlag = key + 'Edit';
            if (value) {
                ctrl.associateRequest = $http.post(metaUrl, value)
                    .success(function () {
                        ctrl.data.results[index][editFlag] = false;
                    }).error(function (error) {
                        raiseAlert('danger', error.title, error.detail);
                    });
            }
            else {
                ctrl.unassociateRequest = $http.delete(metaUrl)
                    .success(function () {
                        ctrl.data.results[index][editFlag] = false;
                    }).error(function (error) {
                        if (error.code == 404) {
                            // Key doesn't exist, so count it as a success,
                            // and don't raise an alert.
                            ctrl.data.results[index][editFlag] = false;
                        }
                        else {
                            raiseAlert('danger', error.title, error.detail);
                        }
                    });
            }
        }

        function gotoResultDetail(testId, innerID) {
            $state.go('resultsDetail', {'testID': testId, 'innerID': innerID});
        }

        function gotoSUT(testId) {
            $state.go('sut', {'testID': testId});
        }

    }
})();
