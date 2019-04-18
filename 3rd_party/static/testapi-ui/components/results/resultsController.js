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

    angular
        .module('testapiApp')
        .directive('modalFileModel', ['$parse', function ($parse) {
            return {
               restrict: 'A',
               link: function(scope, element, attrs) {
                  var model = $parse(attrs.modalFileModel);
                  var modelSetter = model.assign;

                  element.bind('change', function(){
                     scope.$apply(function(){
                        modelSetter(scope.$parent, element[0].files[0]);
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
        ctrl.getVersionList = getVersionList;
        ctrl.getUserProducts = getUserProducts;
        ctrl.associateProductVersion = associateProductVersion;
        ctrl.getProductVersions = getProductVersions;
        ctrl.prepVersionEdit = prepVersionEdit;
        ctrl.gotoSUT = gotoSUT;
        ctrl.gotoResultDetail = gotoResultDetail;
        ctrl.toggleCheck = toggleCheck;
        ctrl.toReview = toReview;
        ctrl.toPrivate = toPrivate;
        ctrl.removeSharedUser = removeSharedUser;
        ctrl.addSharedUser = addSharedUser;
        ctrl.openSharedModal = openSharedModal;
        ctrl.downloadLogs = downloadLogs;
        ctrl.deleteTest = deleteTest;
        ctrl.deleteApplication = deleteApplication;
        ctrl.openApplicationModal = openApplicationModal;
        ctrl.toApprove = toApprove;
        ctrl.toDisapprove = toDisapprove;
        ctrl.toUndo = toUndo;
        ctrl.openConfirmModal = openConfirmModal;
        ctrl.openApplicationView = openApplicationView;
        ctrl.submitApplication = submitApplication;
        ctrl.openReviewsModal = openReviewsModal;
        ctrl.doReview = doReview;

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
        ctrl.isReviewer = $scope.auth.currentUser.role.indexOf('reviewer') != -1;
        ctrl.isAdministrator = $scope.auth.currentUser.role.indexOf('administrator') != -1;

        ctrl.currentUser = $scope.auth.currentUser ? $scope.auth.currentUser.openid : null;

        // Should only be on user-results-page if authenticated.
        if (!$scope.auth.isAuthenticated) {
            $state.go('home');
        }

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
            // ctrl.getUserProducts();
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

        function deleteApplication (result) {
            var resp = confirm('Are you sure you want to delete this application?');
            if (!resp)
                return;

            $http.get(testapiApiUrl + "/cvp/applications?test_id=" + result.id).then(function(response) {
                    ctrl.application = response.data.applications[0];
                    var app_id = ctrl.application._id;
                    var delUrl = testapiApiUrl + "/cvp/applications/" + app_id;
                    $http.delete(delUrl)
                        .then(function(ret) {
                        if (ret.data.code && ret.data.code != 0) {
                            alert(ret.data.msg);
                            return;
                        }
                        result['status'] = 'private';
                    });

                }, function(error) {
                    /* do nothing */
                });

        }

        function submitApplication(result) {
            var file = $scope.logoFile;
            var logo_name = null;
            if (typeof file !== 'undefined') {
                var fd = new FormData();
                fd.append('file', file);
                fd.append('company_name', ctrl.organization_name)

                $http.post(testapiApiUrl + "/cvp/applications/uploadlogo", fd, {
                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}
                }).then(function(resp) {
                    if (resp.data.code && resp.data.code != 0) {
                        alert(resp.data.msg);
                        return;
                    } else {
                        logo_name = resp.data.filename;
                        var data = {
                            "organization_name": ctrl.organization_name,
                            "organization_web": ctrl.organization_web,
                            "product_name": ctrl.product_name,
                            "product_spec": ctrl.product_spec,
                            "product_documentation": ctrl.product_documentation,
                            "product_categories": ctrl.product_categories,
                            "prim_name": ctrl.prim_name,
                            "prim_email": ctrl.prim_email,
                            "prim_address": ctrl.prim_address,
                            "prim_phone": ctrl.prim_phone,
                            "description": ctrl.description,
                            "sut_version": ctrl.sut_version,
                            "sut_label": ctrl.sut_label,
                            "sut_hw_version": ctrl.sut_hw_version,
                            "ovp_version": result.version,
                            "ovp_category": ctrl.ovp_category,
                            "company_logo": logo_name,
                            "approve_date": "",
                            "approved": "false",
                            "test_id": result.id,
                            "lab_location": ctrl.lab_location,
                            "lab_email": ctrl.lab_email,
                            "lab_address": ctrl.lab_address,
                            "lab_phone": ctrl.lab_phone
                        };

                        if(ctrl.organization_name == null ||
                        ctrl.organization_web == null ||
                        ctrl.product_name == null ||
                        ctrl.product_spec == null ||
                        ctrl.product_documentation == null ||
                        ctrl.prim_name == null ||
                        ctrl.prim_email == null ||
                        ctrl.prim_address == null ||
                        ctrl.prim_phone == null ||
                        ctrl.description == null ||
                        ctrl.sut_version == null ||
                        ctrl.sut_label == null ||
                        ctrl.sut_hw_version == null ||
                        ctrl.ovp_category == null) {

                            alert('There are empty required fields in the application form');

                        } else if (ctrl.lab_location == 'third') {
                            if (ctrl.lab_name == null ||
                            ctrl.lab_email == null ||
                            ctrl.lab_address == null ||
                            ctrl.lab_phone == null) {
                                 alert('There are empty required fields in the application form');
                            } else {

                            $http.post(testapiApiUrl + "/cvp/applications", data).then(function(resp) {
                                if (resp.data.code && resp.data.code != 0) {
                                    alert(resp.data.msg);
                                    return;
                                }
                                toggleCheck(result, 'status', 'review');
                            }, function(error) {
                                /* do nothing */
                            });

                            }

                        } else {

                            $http.post(testapiApiUrl + "/cvp/applications", data).then(function(resp) {
                                if (resp.data.code && resp.data.code != 0) {
                                    alert(resp.data.msg);
                                    return;
                                }
                                toggleCheck(result, 'status', 'review');
                            }, function(error) {
                                /* do nothing */
                            });

                        }
                    }
                }, function(error) {
                    /* do nothing */
                });
                logo_name = file.name;
            }

            if (typeof file === 'undefined') {
                alert('There are empty required fields in the application form');
            }
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
                    template: 'testapi-ui/components/results/modal/applicationModal.html',
                    scope: $scope,
                    className: 'ngdialog-theme-default custom-background',
                    width: 950,
                    showClose: true,
                    closeByDocument: true
                });
        }

        function openApplicationView(result) {
           $http.get(testapiApiUrl + "/cvp/applications?test_id=" + result.id).then(function(response) {
                    ctrl.application = response.data.applications[0];
                }, function(error) {
                    /* do nothing */
                });

            ctrl.tempResult = result;
                ngDialog.open({
                    preCloseCallback: function(value) {
                    },
                    template: 'testapi-ui/components/results/modal/applicationView.html',
                    scope: $scope,
                    className: 'ngdialog-theme-default custom-background',
                    width: 950,
                    showClose: true,
                    closeByDocument: true
                });
        }

        function getReviews(test) {
            var reviews_url = testapiApiUrl + '/reviews?test_id=' + test;
            ctrl.reviewsRequest =
                $http.get(reviews_url).success(function (data) {
                    ctrl.reviews = data.reviews;
                }).error(function (error) {
                    ctrl.reviews = null;
                });
        }

        function openReviewsModal(test) {
            getReviews(test);
            ngDialog.open({
                preCloseCallback: function(value) {
                },
                template: 'testapi-ui/components/results/modal/reviewsModal.html',
                scope: $scope,
                className: 'ngdialog-theme-default custom-background',
                width: 950,
                showClose: true,
                closeByDocument: true
            });
        }

        function doReview(test, outcome) {
            var createUrl = testapiApiUrl + "/reviews";
            var data = {
                'test_id': test.id,
                'outcome': outcome
            };

            $http.post(createUrl, JSON.stringify(data), {
                transformRequest: angular.identity,
                headers: {'Content-Type': 'application/json'}}).then(function(ret) {
                    if (ret.data.code && ret.data.code != 0) {
                        alert(ret.data.msg);
                    } else {
                        if (outcome === null) {
                            test.voted = 'false';
                        } else {
                            test.voted = 'true';
                        }
                    }
            }, function(error) {
                alert('Error when creating review');
            });
        }

        function toApprove(test) {
            var resp = confirm('Once you approve a test result, your action will become visible. Do you want to proceed?');
            if (resp) {
                doReview(test, 'positive');
            }
        }

        function toDisapprove(test) {
            var resp = confirm('Once you disapprove a test result, your action will become visible. Do you want to proceed?');
            if (resp) {
                doReview(test, 'negative');
            }
        }

        function toUndo(test) {
            var resp = confirm('Once you undo your previous vote, your action will become visible. Do you want to proceed?');
            if (resp) {
                doReview(test, null);
            }
        }

        function toReview(result, value){
            var resp = confirm('Once you submit a test result for review, it will become readable to all OVP reviewers. Do you want to proceed?');
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
                    }
            }, function(error){
                alert("Error  when update data");
            });
        }

        function toReview(result, value){
            var resp = confirm('Once you submit a test result for review, it will become readable to all OVP reviewers. Do you want to proceed?');
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
                    template: 'testapi-ui/components/results/modal/sharedModal.html',
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
                var createTestUrl = testapiApiUrl + "/tests"

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

           var uploadUrl = testapiApiUrl + "/results/upload";
           uploadFileToUrl(file, uploadUrl);
        };

        /**
         * This will contact the TestAPI API to get a listing of test run
         * results.
         */
        function update() {
            ctrl.showError = false;
            // Construct the API URL based on user-specified filters.
            var content_url = testapiApiUrl + '/tests';
            var start = $filter('date')(ctrl.startDate, 'yyyy-MM-dd');
            var end = $filter('date')(ctrl.endDate, 'yyyy-MM-dd');
            ctrl.PageName = null;
            content_url += '?page=' + ctrl.currentPage;
            content_url += '&per_page=' + ctrl.itemsPerPage;
            if (start) {
                content_url =
                    content_url + '&from=' + start + ' 00:00:00';
            }
            if (end) {
                content_url = content_url + '&to=' + end + ' 23:59:59';
            }
            if (ctrl.isUserResults) {
                content_url += '&signed';
                ctrl.PageName = 'MyResults';
            } else {
                content_url += '&status={"$ne":"private"}&review';
            }

            ctrl.resultsRequest =
                $http.get(content_url).success(function (data) {
                    ctrl.data = data;
                    ctrl.totalItems = ctrl.data.pagination.total_pages * ctrl.itemsPerPage;
                    ctrl.currentPage = ctrl.data.pagination.current_page;
                    ctrl.numPages = ctrl.data.pagination.total_pages;
                    if (ctrl.PageName === 'MyResults') {
                        for (var i=0; i<data.tests.length; i++) {
                            if (data.tests[i].owner !== ctrl.currentUser) {
                                var sharing = false;
                                if (data.tests[i].shared !== null){
                                    for (var j=0; j<data.tests[i].shared.length; j++) {
                                        if (data.tests[i].shared[j] === ctrl.currentUser){
                                            sharing = true;
                                            }
                                        }
                                }
                                if (sharing == false){
                                    data.tests.splice(i,1);
                                    i = i - 1;
                                }
                            }
                        }
                        ctrl.data = data;
                    }
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

        /**
         * Retrieve an array of available capability files from the TestAPI
         * API server, sort this array reverse-alphabetically, and store it in
         * a scoped variable.
         * Sample API return array: ["2015.03.json", "2015.04.json"]
         */
        function getVersionList() {
            if (ctrl.versionList) {
                return;
            }
            var content_url = testapiApiUrl + '/guidelines';
            ctrl.versionsRequest =
                $http.get(content_url).success(function (data) {
                    ctrl.versionList = data.sort().reverse();
                }).error(function (error) {
                    raiseAlert('danger', error.title,
                               'Unable to retrieve version list');
                });
        }

        /**
         * Get products user has management rights to or all products depending
         * on the passed in parameter value.
         */
        function getUserProducts() {
            if (ctrl.products) {
                return;
            }
            var contentUrl = testapiApiUrl + '/products';
            ctrl.productsRequest =
                $http.get(contentUrl).success(function (data) {
                    ctrl.products = {};
                    angular.forEach(data.products, function(prod) {
                        if (prod.can_manage) {
                            ctrl.products[prod.id] = prod;
                        }
                    });
                }).error(function (error) {
                    ctrl.products = null;
                    ctrl.showError = true;
                    ctrl.error =
                        'Error retrieving Products listing from server: ' +
                        angular.toJson(error);
                });
        }

        /**
         * Send a PUT request to the API server to associate a product with
         * a test result.
         */
        function associateProductVersion(result) {
            var verId = (result.selectedVersion ?
                         result.selectedVersion.id : null);
            var testId = result.id;
            var url = testapiApiUrl + '/results/' + testId;
            ctrl.associateRequest = $http.put(url, {'product_version_id':
                                                    verId})
                .success(function (data) {
                    result.product_version = result.selectedVersion;
                    if (result.selectedVersion) {
                        result.product_version.product_info =
                            result.selectedProduct;
                    }
                    result.productEdit = false;
                }).error(function (error) {
                    raiseAlert('danger', error.title, error.detail);
                });
        }

        /**
         * Get all versions for a product.
         */
        function getProductVersions(result) {
            if (!result.selectedProduct) {
                result.productVersions = [];
                result.selectedVersion = null;
                return;
            }

            var url = testapiApiUrl + '/products/' +
                result.selectedProduct.id + '/versions';
            ctrl.getVersionsRequest = $http.get(url)
                .success(function (data) {
                    result.productVersions = data;

                    // If the test result isn't already associated to a
                    // version, default it to the null version.
                    if (!result.product_version) {
                        angular.forEach(data, function(ver) {
                            if (!ver.version) {
                                result.selectedVersion = ver;
                            }
                        });
                    }
                }).error(function (error) {
                    raiseAlert('danger', error.title, error.detail);
                });
        }

        /**
         * Instantiate variables needed for editing product/version
         * associations.
         */
        function prepVersionEdit(result) {
            result.productEdit = true;
            if (result.product_version) {
                result.selectedProduct =
                    ctrl.products[result.product_version.product_info.id];
            }
            result.selectedVersion = result.product_version;
            ctrl.getProductVersions(result);
        }



        function gotoResultDetail(testId, innerID) {
            $state.go('resultsDetail', {'testID': testId, 'innerID': innerID});
        }

        function gotoSUT(testId) {
            $state.go('sut', {'testID': testId});
        }

    }
})();
