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
        .controller('ResultsReportController', ResultsReportController);

    ResultsReportController.$inject = [
        '$scope', '$http', '$stateParams', '$window',
        'testapiApiUrl'
    ];

    /**
     * TestAPI Results Report Controller
     * This controller is for the '/results/<test run ID>' page where a user can
     * view details for a specific test run.
     */
    function ResultsReportController($scope, $http, $stateParams, $window,
        testapiApiUrl) {

        var ctrl = this;

        ctrl.testStatus = 'total';
        ctrl.case_list = [];
        ctrl.data = {};
        ctrl.statistics = {
            'total': 0, 'pass': 0, 'fail': 0,
            'mandatory': {'total': 0, 'pass': 0, 'fail': 0, 'area': 0},
            'optional': {'total': 0, 'pass': 0, 'fail': 0, 'area': 0}
        };

        ctrl.gotoDoc = gotoDoc;
        ctrl.openAll = openAll;
        ctrl.folderAll = folderAll;
        ctrl.gotoResultLog = gotoResultLog;
        ctrl.changeStatus = changeStatus;

        /** The testID extracted from the URL route. */
        ctrl.testId = $stateParams.testID;
        ctrl.innerId = $stateParams.innerID;
        ctrl.validation = '';
        ctrl.vnf_type = '';
        ctrl.vnf_checksum = '';
        ctrl.version = '';

        /** The HTML template that all accordian groups will use. */
        ctrl.detailsTemplate = 'onap-ui/components/results-report/partials/' +
                               'reportDetails.html';

        $scope.load_finish = false;

        function changeStatus(value) {
            ctrl.testStatus = value;
        }

        function extend(case_list) {
            angular.forEach(case_list, function(ele) {
                ctrl.case_list.push(ele);
            });
        }

        function strip(word) {
            return word.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }

        function gotoResultLog(case_name) {
            function openFile(log_url) {
                var is_reachable = false;

                $.ajax({
                    url: log_url,
                    async: false,
                    success: function (response) {
                        is_reachable = true;
                    },
                    error: function (response) {
                        alert("Log file could not be found. Please confirm this case has been executed successfully.");
                    }
                });

                if (is_reachable == true) {
                    window.open(log_url);
                }
            }

            var log_url = "/logs/" + ctrl.testId + "/results/";
            if (ctrl.version == '2019.04') {
                var case_area = case_name.split(".")[0];
                log_url += case_area + "_logs/" + case_name + ".out";
                openFile(log_url);
            } else {
                var test_url = testapiApiUrl + '/onap/tests/' + ctrl.innerId;
                $http.get(test_url).then(function(test_resp){
                    var result_url = testapiApiUrl + '/results/' + test_resp.data.results[0];
                    $http.get(result_url).then(function(result_resp){
                        var keepGoing = true;
                        angular.forEach(result_resp.data.testcases_list, function(testcase, index) {
                            if (keepGoing == true) {
                                if (testcase.name == case_name) {
                                    log_url += testcase.portal_key_file;
                                    openFile(log_url);
                                    keepGoing = false;
                                }
                            }
                        });
                        if (keepGoing == true) {
                            alert("Log file could not be found. Please confirm this case has been executed successfully.");
                        }
                    }, function(result_error) {
                        alert('Error when get result record');
                    });
                }, function(test_error) {
                    alert('Error when get test record');
                });
            }
        }

        $scope.$watch('load_finish', function() {
            if ($scope.load_finish == true) {
                var case_url = 'onap-ui/components/results-report/data/' + ctrl.version + '/' + ctrl.vnf_type + '-testcases.json'
                $http.get(case_url).then(function(response) {
                    ctrl.data = response.data;

                    angular.forEach(ctrl.data.mandatory, function(value, name) {
                        ctrl.data.mandatory[name].folder = true;
                        ctrl.data.mandatory[name].pass = 0;
                        ctrl.data.mandatory[name].fail = 0;
                        angular.forEach(value.cases, function(sub_case) {
                            ctrl.statistics.total += 1;
                            ctrl.statistics.mandatory.total += 1;
                            if (ctrl.case_list.indexOf(sub_case) > -1) {
                                ctrl.data.mandatory[name].pass += 1;
                                ctrl.statistics.mandatory.pass += 1;
                                ctrl.statistics.pass += 1;
                            } else {
                                ctrl.data.mandatory[name].fail += 1;
                                ctrl.statistics.mandatory.fail += 1;
                                ctrl.statistics.fail += 1;
                            }
                        });
                    });

                    angular.forEach(ctrl.data.optional, function(value, name) {
                        ctrl.data.optional[name].folder = true;
                        ctrl.data.optional[name].pass = 0;
                        ctrl.data.optional[name].fail = 0;
                        angular.forEach(value.cases, function(sub_case) {
                            ctrl.statistics.total += 1;
                            ctrl.statistics.optional.total += 1;
                            if (ctrl.case_list.indexOf(sub_case) > -1) {
                                ctrl.data.optional[name].pass += 1;
                                ctrl.statistics.optional.pass += 1;
                                ctrl.statistics.pass += 1;
                            } else {
                                ctrl.data.optional[name].fail += 1;
                                ctrl.statistics.optional.fail += 1;
                                ctrl.statistics.fail += 1;
                            }

                        });
                    });

                    ctrl.statistics.mandatory.area = Object.keys(ctrl.data.mandatory).length;
                    ctrl.statistics.optional.area = Object.keys(ctrl.data.optional).length;
                }, function(error) {
                    alert('error to get test case info');
                });
            }
        });

        function generate_format_data() {
            var test_url = testapiApiUrl + '/onap/tests/' + ctrl.innerId;
            $http.get(test_url).then(function(test_resp) {
                ctrl.validation = test_resp.data.validation;

                angular.forEach(test_resp.data.results, function(result, index) {
                    var result_url = testapiApiUrl + '/results/' + result;
                    $http.get(result_url).then(function(result_resp) {

                        ctrl.version = result_resp.data.version;
                        ctrl.vnf_type = result_resp.data.vnf_type;

                        angular.forEach(result_resp.data.testcases_list, function(testcase, index) {
                            var sub_case_list = get_sub_case_list_2019_04(testcase);
                            extend(sub_case_list);
                        });

                        if (index == test_resp.data.results.length - 1) {
                            $scope.load_finish = true;
                        }
                    }, function(result_error) {
                        /* do nothing */
                    });
                });

            }, function(test_error) {
                alert('Error when get test record');
            });
        }

        function get_sub_case_list_2019_04(result) {
            var case_list = [];
            if (result.sub_testcase.length == 0 && result.result == "PASS") {
                case_list.push(result.name);
            } else {
                angular.forEach(result.sub_testcase, function(subtest, index) {
                    if (subtest.result == "PASS") {
                        case_list.push(subtest.name)
                    }
                });
            }
            return case_list;
        }

        function gotoDoc(sub_case) {
            /* not implemented */
        }

        function openAll() {
            angular.forEach(ctrl.data.mandatory, function(ele, id) {
                ele.folder = false;
            });
            angular.forEach(ctrl.data.optional, function(ele, id) {
                ele.folder = false;
            });
        }

        function folderAll() {
            angular.forEach(ctrl.data.mandatory, function(ele, id) {
                ele.folder = true;
            });
            angular.forEach(ctrl.data.optional, function(ele, id) {
                ele.folder = true;
            });
        }

        generate_format_data();
    }

})();
