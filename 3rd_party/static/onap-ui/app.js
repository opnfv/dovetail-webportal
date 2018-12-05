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

    /** Main app module where application dependencies are listed. */
    angular
        .module('testapiApp', [
            'ui.router','ui.bootstrap', 'cgBusy',
            'ngResource', 'angular-confirm', 'ngDialog', 'xeditable'
        ]);

    angular
        .module('testapiApp')
        .config(configureRoutes);

    configureRoutes.$inject = ['$stateProvider', '$urlRouterProvider'];

    /**
     * Handle application routing. Specific templates and controllers will be
     * used based on the URL route.
     */
    function configureRoutes($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider.
            state('home', {
                url: '/',
                templateUrl: 'onap-ui/components/home/home.html',
                controller: 'HomeController as ctrl'
            }).
            state('directory', {
                url: '/directory/:companyID&:logo',
                templateUrl: 'onap-ui/components/directory/directory.html',
                controller: 'DirectoryController as ctrl'
            }).
            state('userResults', {
                url: '/user_results',
                templateUrl: 'onap-ui/components/results/results.html',
                controller: 'ResultsController as ctrl'
            }).
            state('communityResults', {
                url: '/community_results',
                templateUrl: 'onap-ui/components/results/results.html',
                controller: 'ResultsController as ctrl'
            }).
            state('resultsDetail', {
                url: '/results/:testID&:innerID',
                templateUrl: 'onap-ui/components/results-report' +
                             '/resultsReport.html',
                controller: 'ResultsReportController as ctrl'
            }).
            state('profile', {
                url: '/profile',
                templateUrl: 'onap-ui/components/profile/profile.html',
                controller: 'ProfileController as ctrl'
            }).
            state('authFailure', {
                url: '/auth_failure',
                templateUrl: 'onap-ui/components/home/home.html',
                controller: 'AuthFailureController as ctrl'
            }).
            state('logout', {
                url: '/logout',
                templateUrl: 'onap-ui/components/logout/logout.html',
                controller: 'LogoutController as ctrl'
            }).
            state('sut', {
                url: '/suts/:testID',
                templateUrl: '/onap-ui/components/sut/sut.html',
                controller: 'SutController as ctrl'
            }).
            state('application', {
                url: '/application',
                templateUrl: '/onap-ui/components/application/application.html',
                controller: 'ApplicationController as ctrl'
            });
    }

    angular
        .module('testapiApp')
        .config(disableHttpCache);

    disableHttpCache.$inject = ['$httpProvider'];

    /**
     * Disable caching in $http requests. This is primarily for IE, as it
     * tends to cache Angular IE requests.
     */
    function disableHttpCache($httpProvider) {
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get.Pragma = 'no-cache';
    }

    angular
        .module('testapiApp')
        .run(setup);

    setup.$inject = [
        '$http', '$rootScope', '$window', '$state', 'testapiApiUrl'
    ];

    /**
     * Set up the app with injections into $rootscope. This is mainly for auth
     * functions.
     */
    function setup($http, $rootScope, $window, $state, testapiApiUrl) {

        $rootScope.auth = {};
        $rootScope.auth.doSignIn = doSignIn;
        $rootScope.auth.doSignOut = doSignOut;
        $rootScope.auth.doSignCheck = doSignCheck;


        var sign_in_url = testapiApiUrl + '/auth/signin';
        var sign_out_url = testapiApiUrl + '/auth/signout';
        var profile_url = testapiApiUrl + '/profile';

        /** This function initiates a sign in. */
        function doSignIn(type) {
            $rootScope.auth.type = type;
            $window.location.href = sign_in_url+"?type="+type;
        }

        /** This function will initate a sign out. */
        function doSignOut() {
            var resp = confirm("Are you sure to sign out?");
            if (!resp)
                return;
            $rootScope.auth.currentUser = null;
            $rootScope.auth.isAuthenticated = false;
            $window.location.href = sign_out_url+"?type="+$rootScope.auth.type;
        }

        /**
         * This function checks to see if a user is logged in and
         * authenticated.
         */
        function doSignCheck() {
            return $http.get(profile_url, {withCredentials: true}).
                success(function (data) {
                    $rootScope.auth.currentUser = data;
                    $rootScope.auth.isAuthenticated = true;
                    $rootScope.auth.type = data.type;
                }).
                error(function () {
                    $rootScope.auth.currentUser = null;
                    $rootScope.auth.isAuthenticated = false;
                });
        }

        $rootScope.auth.doSignCheck();
    }

    angular
        .element(document)
        .ready(loadConfig);

    /**
     * Load config and start up the angular application.
     */
    function loadConfig() {

        var $http = angular.injector(['ng']).get('$http');

        /**
         * Store config variables as constants, and start the app.
         */
        function startApp(config) {
            // Add config options as constants.
            angular.forEach(config, function(value, key) {
                angular.module('testapiApp').constant(key, value);
            });

            angular.bootstrap(document, ['testapiApp']);
        }

        $http.get('onap-ui/config.json').success(function (data) {
            startApp(data);
        }).error(function () {
            startApp({});
        });
    }
})();
