##############################################################################
# Copyright (c) 2015 Orange
# guyrodrigue.koffi@orange.com / koffirodrigue@gmail.com
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Apache License, Version 2.0
# which accompanies this distribution, and is available at
# http://www.apache.org/licenses/LICENSE-2.0
##############################################################################

from opnfv_testapi.resources import handlers
from opnfv_testapi.resources import result_handlers
from opnfv_testapi.resources import test_handlers
from opnfv_testapi.resources import application_handlers
from opnfv_testapi.resources import pod_handlers
from opnfv_testapi.resources import project_handlers
from opnfv_testapi.resources import scenario_handlers
from opnfv_testapi.resources import sut_handlers
from opnfv_testapi.resources import testcase_handlers
from opnfv_testapi.ui.auth import sign
from opnfv_testapi.ui.auth import user

mappings = [
    (r"/versions", handlers.VersionHandler),

    (r"/api/v1/results", result_handlers.ResultsCLHandler),
    (r"/api/v1/results/upload", result_handlers.ResultsUploadHandler),
    (r"/api/v1/results/([^/]+)", result_handlers.ResultsGURHandler),

    (r"/api/v1/tests", test_handlers.TestsCLHandler),
    (r"/api/v1/tests/([^/]+)", test_handlers.TestsGURHandler),

    (r"/api/v1/cvp/applications/getlogo/([^/]+)",
     application_handlers.ApplicationsGetLogoHandler),
    (r"/api/v1/cvp/applications/uploadlogo",
     application_handlers.ApplicationsLogoHandler),
    (r"/api/v1/cvp/applications", application_handlers.ApplicationsCLHandler),
    (r"/api/v1/cvp/applications/([^/]+)",
     application_handlers.ApplicationsGURHandler),

    (r"/api/v1/suts/hardware/([^/]+)", sut_handlers.HardwareHandler),

    (r"/api/v1/pods", pod_handlers.PodCLHandler),
    (r"/api/v1/pods/([^/]+)", pod_handlers.PodGURHandler),
    (r"/api/v1/scenarios", scenario_handlers.ScenarioCLHandler),
    (r"/api/v1/scenarios/([^/]+)", scenario_handlers.ScenarioGURHandler),
    (r"/api/v1/projects", project_handlers.ProjectCLHandler),
    (r"/api/v1/projects/([^/]+)", project_handlers.ProjectGURHandler),
    (r"/api/v1/projects/([^/]+)/cases", testcase_handlers.TestcaseCLHandler),
    (r"/api/v1/projects/([^/]+)/cases/([^/]+)",
        testcase_handlers.TestcaseGURHandler),

    (r'/api/v1/auth/signin', sign.SigninHandler),
    (r'/api/v1/auth/signin_return', sign.SigninReturnHandler),
    (r'/api/v1/auth/signin_return_jira', sign.SigninReturnJiraHandler),
    (r'/api/v1/auth/signin_return_cas', sign.SigninReturnCasHandler),
    (r'/api/v1/auth/signout', sign.SignoutHandler),
    (r'/api/v1/profile', user.ProfileHandler),

]
