/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^GL|\$locale$" }] */

var _flowFactoryProvider;

var GL = angular.module("GL", [
    "angular.filter",
    "ngAria",
    "ngIdle",
    "ngRoute",
    "ui.bootstrap",
    "ui.select",
    "tmh.dynamicLocale",
    "flow",
    "monospaced.qrcode",
    "pascalprecht.translate",
    "ngCsv",
    "ngResource",
    "ngSanitize",
    "ngFileSaver",
    "ng-showdown"
]).
  config(["$compileProvider", function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
}]).
  config(["$httpProvider", function($httpProvider) {
    $httpProvider.interceptors.push("globaleaksRequestInterceptor");
}]).
  config(["$locationProvider", function($locationProvider) {
    $locationProvider.hashPrefix("");
}]).
  config(["$showdownProvider", function($showdownProvider) {
    $showdownProvider.setOption("sanitize", true);
    $showdownProvider.setOption("openLinksInNewWindow", true);
}]).
  config(["$provide", function($provide) {
    $provide.decorator("$templateRequest", ["$delegate", function($delegate) {
      // This decorator is required in order to inject the "true" for setting ignoreRequestError
      // in relation to https://docs.angularjs.org/error/$compile/tpload
      var fn = $delegate;

      $delegate = function(tpl) {
        for (var key in fn) {
          $delegate[key] = fn[key];
        }

        return fn.apply(this, [tpl, true]);
      };

      return $delegate;
    }]);

    $provide.decorator("$exceptionHandler", ["$delegate", "$injector", "stacktraceService", function ($delegate, $injector, stacktraceService) {
      return function(exception, cause) {
          var $rootScope = $injector.get("$rootScope");

          if (typeof $rootScope.exceptions_count === "undefined") {
            $rootScope.exceptions_count = 0;
          }

          $rootScope.exceptions_count += 1;

          if ($rootScope.exceptions_count >= 3) {
            // Give each client the ability to forward only the first 3 exceptions
            // scattered; this is also important to avoid looping exceptions to
            // cause looping POST requests.
            return;
          }

          $delegate(exception, cause);

          stacktraceService.fromError(exception).then(function(result) {
            var errorData = angular.toJson({
              errorUrl: $injector.get("$location").path(),
              errorMessage: exception.toString(),
              stackTrace: result,
              agent: navigator.userAgent
            });

            return $rootScope.Utils.notifyException(errorData);
          });
      };
    }]);
}]).
  config(["$qProvider", function($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}]).
  config(["$rootScopeProvider", function($rootScopeProvider) {
    // Raise the default digest loop limit to 30 because of the template recursion used by fields:
    // https://github.com/angular/angular.js/issues/6440
    $rootScopeProvider.digestTtl(30);
}]).
  config(["$routeProvider", function($routeProvider) {
    function requireAuth(role) {
      return ["Access", function(Access) { return Access.isAuthenticated(role); }];
    }

    function fetchResources(role, lst) {
      return ["$location", "$q", "$rootScope", "Access", "GLTranslate", "AdminAuditLogResource", "AdminContextResource", "AdminQuestionnaireResource", "AdminStepResource", "AdminFieldResource", "AdminFieldTemplateResource", "AdminUserResource", "AdminNodeResource", "AdminNotificationResource", "AdminRedirectResource", "AdminTenantResource", "FieldAttrs", "TipsCollection", "JobsAuditLog", "AdminSubmissionStatusResource", "ReceiverTips", "UserPreferences", function($location, $q, $rootScope, Access, GLTranslate, AdminAuditLogResource, AdminContextResource, AdminQuestionnaireResource, AdminStepResource, AdminFieldResource, AdminFieldTemplateResource, AdminUserResource, AdminNodeResource, AdminNotificationResource, AdminRedirectResource, AdminTenantResource, FieldAttrs, TipsCollection, JobsAuditLog, AdminSubmissionStatusResource, ReceiverTips, UserPreferences) {
        var resourcesPromises = {
          auditlog: function() { return AdminAuditLogResource.query().$promise; },
          node: function() { return AdminNodeResource.get().$promise; },
          contexts: function() { return AdminContextResource.query().$promise; },
          field_attrs: function() { return FieldAttrs.get().$promise; },
          fieldtemplates: function() { return AdminFieldTemplateResource.query().$promise; },
          users: function() { return AdminUserResource.query().$promise; },
          notification: function() { return AdminNotificationResource.get().$promise; },
          redirects: function() { return AdminRedirectResource.query().$promise; },
          tenants: function() { return AdminTenantResource.query().$promise; },
          tips: function() { return TipsCollection.query().$promise; },
          jobs: function() { return JobsAuditLog.query().$promise; },
          questionnaires: function() { return AdminQuestionnaireResource.query().$promise; },
          submission_statuses: function() { return AdminSubmissionStatusResource.query().$promise; },
          rtips: function() { return ReceiverTips.get().$promise; },
          preferences: function() { return UserPreferences.get().$promise; }
        };

        return Access.isAuthenticated(role).then(function() {
          var promises = {};

          for (var i = 0; i < lst.length; i++) {
             var name = lst[i];
             promises[name] = resourcesPromises[name]();
          }

          return $q.all(promises).then(function(resources) {
            $rootScope.resources = resources;

            if ($rootScope.resources.preferences) {
              GLTranslate.addUserPreference($rootScope.resources.preferences.language);

              if ($rootScope.resources.preferences.password_change_needed) {
                $location.path("/actions/forcedpasswordchange");
              } else if ($rootScope.resources.preferences.require_two_factor) {
                $location.path("/actions/forcedtwofactor");
              }
            }
          });
        });
      }];
    }

    $routeProvider.
      when("/wizard", {
        templateUrl: "views/wizard/main.html",
        controller: "WizardCtrl",
        header_title: "Platform wizard"
      }).
      when("/submission", {
        templateUrl: "views/whistleblower/submission.html",
        controller: "SubmissionCtrl",
        header_title: ""
      }).
      when("/activation", {
        templateUrl: "views/signup/activation.html",
        controller: "SignupActivationCtrl",
        header_title: "Signup"
      }).
      when("/status/:tip_id", {
        templateUrl: "views/recipient/tip.html",
        controller: "TipCtrl",
        header_title: "Report",
        resolve: {
          access: requireAuth("receiver"),
          resources: fetchResources("receiver", ["preferences"])
        }
      }).
      when("/actions/forcedpasswordchange", {
        templateUrl: "views/actions/forced_password_change.html",
        controller: "ForcedPasswordChangeCtrl",
        header_title: "Change your password",
        resolve: {
          access: requireAuth("*"),
          resources: fetchResources("*", ["preferences"])
        }
      }).
      when("/actions/forcedtwofactor", {
        templateUrl: "views/actions/forced_two_factor.html",
        controller: "EnableTwoFactorAuthCtrl",
        header_title: "Enable two factor authentication",
        resolve: {
          access: requireAuth("*"),
          resources: fetchResources("*", ["preferences"])
        }
      }).
      when("/recipient/home", {
        templateUrl: "views/recipient/home.html",
        header_title: "Home",
        sidebar: "views/recipient/sidebar.html",
        resolve: {
          access: requireAuth("receiver"),
          resources: fetchResources("receiver", ["preferences"])
        }
      }).
      when("/recipient/preferences", {
        templateUrl: "views/partials/preferences.html",
        controller: "PreferencesCtrl",
        header_title: "Preferences",
        sidebar: "views/recipient/sidebar.html",
        resolve: {
          access: requireAuth("receiver"),
          resources: fetchResources("receiver", ["preferences"]),
        }
      }).
      when("/recipient/content", {
        templateUrl: "views/recipient/content.html",
        controller: "AdminCtrl",
        header_title: "Site settings",
        sidebar: "views/recipient/sidebar.html",
        resolve: {
          access: requireAuth("receiver"),
          resources: fetchResources("receiver", ["node", "preferences"])
        }
      }).
      when("/recipient/reports", {
        templateUrl: "views/recipient/tips.html",
        controller: "ReceiverTipsCtrl",
        header_title: "Reports",
        resolve: {
          access: requireAuth("receiver"),
          resources: fetchResources("receiver", ["preferences", "rtips"])
        }
      }).
      when("/admin/home", {
        templateUrl: "views/admin/home.html",
        controller: "AdminCtrl",
        header_title: "Home",
        sidebar: "views/admin/sidebar.html",
        resolve: {
           access: requireAuth("admin"),
           resources: fetchResources("admin", ["node", "preferences", "users"])
        }
      }).
      when("/admin/preferences", {
        templateUrl: "views/partials/preferences.html",
        controller: "PreferencesCtrl",
        header_title: "Preferences",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences"])
        }
      }).
      when("/admin/content", {
        templateUrl: "views/admin/content.html",
        controller: "AdminCtrl",
        header_title: "Site settings",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences"])
        }
      }).
      when("/admin/contexts", {
        templateUrl: "views/admin/contexts.html",
        controller: "AdminCtrl",
        header_title: "Contexts",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["contexts", "node", "preferences", "questionnaires", "users"])
        }
      }).
      when("/admin/questionnaires", {
        templateUrl: "views/admin/questionnaires.html",
        controller: "AdminCtrl",
        header_title: "Questionnaires",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["fieldtemplates", "field_attrs", "node", "preferences", "questionnaires", "users"])
        }
      }).
      when("/admin/users", {
        templateUrl: "views/admin/users.html",
        controller: "AdminCtrl",
        header_title: "Users",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences", "users"])
        }
      }).
      when("/admin/notifications", {
        templateUrl: "views/admin/notifications.html",
        controller: "AdminCtrl",
        header_title: "Notification settings",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences", "notification"])
        }
      }).
      when("/admin/network", {
        templateUrl: "views/admin/network.html",
        controller: "AdminCtrl",
        header_title: "Network settings",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences", "redirects"])
        }
      }).
      when("/admin/advanced", {
        templateUrl: "views/admin/advanced.html",
        controller: "AdminCtrl",
        header_title: "Advanced settings",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences", "questionnaires", "users"])
        }
      }).
      when("/admin/auditlog", {
        templateUrl: "views/admin/auditlog.html",
        controller: "AdminCtrl",
        header_title: "Audit log",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["auditlog", "jobs", "node", "preferences", "tips", "users"])
        }
      }).
      when("/admin/sites", {
        templateUrl: "views/admin/sites.html",
        controller: "AdminCtrl",
        header_title: "Sites management",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences", "tenants"])
        }
      }).
      when("/admin/casemanagement", {
        templateUrl: "views/admin/casemanagement.html",
        controller: "AdminCtrl",
        header_title: "Case management",
        sidebar: "views/admin/sidebar.html",
        resolve: {
          access: requireAuth("admin"),
          resources: fetchResources("admin", ["node", "preferences", "submission_statuses"])
        }
      }).
      when("/custodian/home", {
        templateUrl: "views/custodian/home.html",
        header_title: "Home",
        sidebar: "views/custodian/sidebar.html",
        resolve: {
          access: requireAuth("custodian"),
          resources: fetchResources("custodian", ["preferences"])
        }
      }).
      when("/custodian/preferences", {
        templateUrl: "views/partials/preferences.html",
	controller: "PreferencesCtrl",
        header_title: "Preferences",
        sidebar: "views/custodian/sidebar.html",
        resolve: {
          access: requireAuth("custodian"),
          resources: fetchResources("custodian", ["preferences"])
        }
      }).
      when("/custodian/content", {
        templateUrl: "views/custodian/content.html",
        controller: "AdminCtrl",
        header_title: "Site settings",
        sidebar: "views/custodian/sidebar.html",
        resolve: {
          access: requireAuth("custodian"),
          resources: fetchResources("custodian", ["node", "preferences"])
        }
      }).
      when("/custodian/requests", {
        templateUrl: "views/custodian/identity_access_requests.html",
        header_title: "Requests",
        resolve: {
          access: requireAuth("custodian"),
          resources: fetchResources("custodian", ["preferences"])
        }
      }).
      when("/login", {
        templateUrl: "views/login/main.html",
        controller: "LoginCtrl",
        header_title: "Log in"
      }).
      when("/admin", {
        templateUrl: "views/login/main.html",
        controller: "LoginCtrl",
        header_title: "Log in"
      }).
      when("/login/passwordreset", {
        templateUrl: "views/passwordreset/main.html",
        controller: "PasswordResetCtrl",
        header_title: "Password reset"
      }).
      when("/login/passwordreset/requested", {
        templateUrl: "views/passwordreset/requested.html",
        header_title: "Password reset"
      }).
      when("/login/passwordreset/failure/token", {
        templateUrl: "views/passwordreset/failure_token.html",
        header_title: "Password reset"
      }).
      when("/login/passwordreset/failure/recovery", {
        templateUrl: "views/passwordreset/failure_recovery.html",
        header_title: "Password reset"
      }).
      when("/password/reset", {
        templateUrl: "views/empty.html",
        controller: "PasswordResetCompleteCtrl",
        header_title: "Password reset"
      }).
      when("/password/reset/2fa", {
        templateUrl: "views/passwordreset/2fa.html",
        controller: "PasswordResetCompleteCtrl",
        header_title: "Password reset"
      }).
      when("/password/reset/recovery", {
        templateUrl: "views/passwordreset/recovery.html",
        controller: "PasswordResetCompleteCtrl",
        header_title: "Password reset"
      }).
      when("/email/validation/success", {
        templateUrl: "views/email_validation_success.html",
        controller: "EmptyCtrl",
        header_title: ""
      }).
      when("/email/validation/failure", {
        templateUrl: "views/email_validation_failure.html",
        controller: "EmptyCtrl",
        header_title: ""
      }).
      when("/", {
        templateUrl: "views/home.html",
        header_title: ""
      }).
      otherwise({
        redirectTo: "/"
      });
}]).
  config(["$translateProvider", function($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: "l10n/",
      suffix: ""
    });

    $translateProvider.useInterpolation("noopInterpolation");
    $translateProvider.useSanitizeValueStrategy("escape");
}]).
  config(["$uibModalProvider", function($uibModalProvider) {
    $uibModalProvider.options.animation = false;
    $uibModalProvider.options.backdrop = "static";
    $uibModalProvider.options.keyboard = false;
    $uibModalProvider.options.focus = true;
    $uibModalProvider.options.size = "lg";
}]).
  config(["$uibTooltipProvider", function($uibTooltipProvider) {
    $uibTooltipProvider.options({placement: "auto", appendToBody: true, trigger: "mouseenter"});
}]).
  config(["tmhDynamicLocaleProvider", function(tmhDynamicLocaleProvider) {
    var map = {
      "ba": "bas",
      "ca@valencia": "ca-es-valencia",
      "dv": "en",
      "sl-si": "sl",
      "sr_RS@latin": "sr-latn",
      "sr_ME@latin": "sr-latn-me",
      "tt": "ru",
      "ug": "ug-arab",
      "ug@Cyrl": "ug",
      "ug@Latin": "ug"
    };

    tmhDynamicLocaleProvider.addLocalePatternValue("map", map);

    tmhDynamicLocaleProvider.localeLocationPattern("{{map[locale] ? 'lib/js/locale/angular-locale_' + map[locale] +'.js' : 'lib/js/locale/angular-locale_' + locale +'.js'}}");
}]).
  config(["flowFactoryProvider", function (flowFactoryProvider) {
    // Trick to move the flowFactoryProvider config inside run block.
    _flowFactoryProvider = flowFactoryProvider;
}]).
  config(["IdleProvider", "KeepaliveProvider", "TitleProvider", function(IdleProvider, KeepaliveProvider, TitleProvider) {
    IdleProvider.idle(300);
    IdleProvider.timeout(3600);
    KeepaliveProvider.interval(600);
    TitleProvider.enabled(false);
}]).
  run(["$rootScope", "$http", "$route", "$routeParams", "$window", "$location",  "$filter", "$translate", "$uibModal", "$templateCache", "Idle", "Authentication", "SessionResource", "PublicResource", "Utils", "AdminUtils", "fieldUtilities", "CONSTANTS", "GLTranslate", "Access",
      function($rootScope, $http, $route, $routeParams, $window, $location, $filter, $translate, $uibModal, $templateCache, Idle, Authentication, SessionResource, PublicResource, Utils, AdminUtils, fieldUtilities, CONSTANTS, GLTranslate, Access) {
    $rootScope.started = false;

    $rootScope.page = "homepage";
    $rootScope.Authentication = Authentication;
    $rootScope.GLTranslate = GLTranslate;
    $rootScope.Utils = Utils;
    $rootScope.fieldUtilities = fieldUtilities;
    $rootScope.AdminUtils = AdminUtils;
    $rootScope.CONSTANTS = CONSTANTS;

    $rootScope.showLoadingPanel = false;

    _flowFactoryProvider.defaults = {
      chunkSize: 1000 * 1024,
      forceChunkSize: true,
      testChunks: false,
      simultaneousUploads: 1,
      generateUniqueIdentifier: function () {
        return Math.random() * 1000000 + 1000000;
      },
      headers: function() {
        return $rootScope.Authentication.get_headers();
      }
    };

    $rootScope.setPage = function(page) {
      $location.path("/");
      $rootScope.page = page;
      $rootScope.Utils.set_title();
    };

    $rootScope.setHomepage = function() {
      $window.location = "/";
    };

    $rootScope.dismissError = function () {
      delete $rootScope.error;
    };

    $rootScope.open_confidentiality_modal = function () {
      $uibModal.open({
        controller: "ConfirmableModalCtrl",
        templateUrl: "views/modals/security_awareness_confidentiality.html",
        scope: $rootScope
      });
    };

    $rootScope.open_disclaimer_modal = function () {
      $uibModal.open({
        templateUrl: "views/modals/disclaimer.html",
        controller: "ConfirmableModalCtrl",
	resolve: {
          arg: null,
          confirmFun: function() { return function() { $rootScope.setPage("submissionpage"); }; },
          cancelFun: null
	}
      });
    };

    $rootScope.evaluateConfidentialityModalOpening = function () {
      if (!$rootScope.connection.tor &&
          !$rootScope.connection.https &&
          !$rootScope.confidentiality_warning_opened &&
          ["localhost", "127.0.0.1"].indexOf($location.host()) === -1) {
        $rootScope.confidentiality_warning_opened = true;
        return $rootScope.open_confidentiality_modal();
      }
    };

    $rootScope.openSubmission = function () {
      if ($rootScope.public.node.disclaimer_text) {
        return $rootScope.open_disclaimer_modal();
      }

      return $rootScope.setPage("submissionpage");
    };

    $rootScope.init = function () {
      return PublicResource.get(function(result, getResponseHeaders) {
        var elem;

        $rootScope.public = result;

        if ($rootScope.public.node.css) {
          elem = document.getElementById("load-custom-css");
          if (elem === null) {
            elem = document.createElement("link");
            elem.setAttribute("id", "load-custom-css");
            elem.setAttribute("rel", "stylesheet");
            elem.setAttribute("type", "text/css");
            elem.setAttribute("href", "s/css");
            document.getElementsByTagName("head")[0].appendChild(elem);
          }
        }

	if ($rootScope.public.node.script) {
          elem = document.getElementById("load-custom-script");
          if (elem === null) {
            elem = document.createElement("script");
            elem.setAttribute("id", "load-custom-script");
            elem.setAttribute("src", "s/script");
            document.getElementsByTagName("body")[0].appendChild(elem);
          }
        }

        if ($rootScope.public.node.favicon) {
          document.getElementById("favicon").setAttribute("href", "s/favicon");
        }

        $rootScope.contexts_by_id = $rootScope.Utils.array_to_map(result.contexts);
        $rootScope.receivers_by_id = $rootScope.Utils.array_to_map(result.receivers);
        $rootScope.questionnaires_by_id = $rootScope.Utils.array_to_map(result.questionnaires);

        $rootScope.submission_statuses = result.submission_statuses;
        $rootScope.submission_statuses_by_id = $rootScope.Utils.array_to_map(result.submission_statuses);

        angular.forEach($rootScope.questionnaires_by_id, function(element, key) {
          $rootScope.fieldUtilities.parseQuestionnaire($rootScope.questionnaires_by_id[key], {});
          $rootScope.questionnaires_by_id[key].steps = $filter("orderBy")($rootScope.questionnaires_by_id[key].steps, "order");
        });

        angular.forEach($rootScope.contexts_by_id, function(element, key) {
          $rootScope.contexts_by_id[key].questionnaire = $rootScope.questionnaires_by_id[$rootScope.contexts_by_id[key].questionnaire_id];
          if ($rootScope.contexts_by_id[key].additional_questionnaire_id) {
            $rootScope.contexts_by_id[key].additional_questionnaire = $rootScope.questionnaires_by_id[$rootScope.contexts_by_id[key].additional_questionnaire_id];
          }
        });

        $rootScope.connection = {
          "tor": getResponseHeaders()["X-Check-Tor"] === "true" || $location.host().match(/\.onion$/),
        };

        $rootScope.privacy_badge_open = !$rootScope.connection.tor;

        Utils.route_check();

        $rootScope.languages_enabled = {};
        $rootScope.languages_enabled_selector = [];
        $rootScope.languages_supported = {};
        angular.forEach($rootScope.public.node.languages_supported, function(lang) {
          $rootScope.languages_supported[lang.code] = lang;
          if ($rootScope.public.node.languages_enabled.indexOf(lang.code) !== -1) {
            $rootScope.languages_enabled[lang.code] = lang;
            $rootScope.languages_enabled_selector.push(lang);
          }
        });

        GLTranslate.addNodeFacts($rootScope.public.node.default_language, $rootScope.public.node.languages_enabled);
        Utils.set_title();

        $rootScope.started = true;

      }).$promise;
    };

    //////////////////////////////////////////////////////////////////

    var hasRegistered = false;
    $rootScope.$watch(function() {
      if (hasRegistered) return;
      hasRegistered = true;
      $rootScope.$$postDigest(function() {
        hasRegistered = false;
        GL.mockEngine.run();
      });
    });

    $rootScope.$watch(function() {
      var count=0;
      for(var i=0; i<$http.pendingRequests.length; i++) {
        if ($http.pendingRequests[i].url.indexOf("api/session") === -1) {
          count += 1;
        }
      }
      return count;
    }, function(count) {
      $rootScope.showLoadingPanel = count > 0;
    });

    $rootScope.$watch("GLTranslate.state.language", function(new_val, old_val) {
      if(new_val !== old_val) {
	if (old_val && old_val !== "*") {
          $location.search("lang", new_val);
          GLTranslate.setLang(new_val);
          $rootScope.reload();
        }
      }
    });

    $rootScope.$on("$locationChangeStart", function() {
      var lang = $location.search().lang;
      if (lang) {
        if (lang !== GLTranslate.state.language) {
          $window.location.href = $location.absUrl();
          $window.location.reload();
        }
      }

      if ($location.path() === "/" &&
          $rootScope.Authentication.session &&
          $rootScope.Authentication.session.role !== "whistleblower") {
        // Get sure to reset the user session when visiting the public interface
	// This is intended as protection in relation to possible XSS and XSRF
	// on components implementing markdown and direct html input.
        $rootScope.Authentication.session = undefined;
      }
    });

    $rootScope.$on("$routeChangeStart", Utils.route_check);

    $rootScope.$on("$routeChangeSuccess", function (event, current) {
      if (current.$$route) {
        delete $rootScope.error;
        $rootScope.header_title = current.$$route.header_title;
        $rootScope.sidebar = current.$$route.sidebar;
	Utils.set_title();
      }
    });

    $rootScope.$on("$routeChangeError", function(event, current, previous, rejection) {
      if (rejection === Access.FORBIDDEN) {
        $rootScope.Authentication.loginRedirect(false);
      }
    });

    $rootScope.$on("REFRESH", function() {
      $rootScope.reload();
    });

    $rootScope.keypress = function(e) {
       if (((e.which || e.keyCode) === 116) || /* F5 */
           ((e.which || e.keyCode) === 82 && (e.ctrlKey || e.metaKey))) {  /* (ctrl or meta) + r */
         e.preventDefault();
         $rootScope.$emit("REFRESH");
       }
    };

    $rootScope.reload = function(new_path) {
      delete $rootScope.error;

      $rootScope.init().then(function() {
        $route.reload();

        if (new_path) {
          $location.path(new_path).replace();
        }
      });
    };

    $rootScope.$on("Keepalive", function() {
      if ($rootScope.Authentication.session) {
        return SessionResource.get();
      }
    });

    $rootScope.$on("IdleTimeout", function() {
      if ($rootScope.Authentication.session) {
        return $rootScope.Authentication.loginRedirect(false);
      }
    });

    Idle.watch();

    $rootScope.init();
}]).
  factory("globaleaksRequestInterceptor", ["$injector", function($injector) {
    return {
     "request": function(config) {
       var $rootScope = $injector.get("$rootScope");

       angular.extend(config.headers, $rootScope.Authentication.get_headers());

       return config;
     },
     "responseError": function(response) {
       /*/
          When the response has failed write the rootScope
          errors array the error message.
       */
       var $rootScope = $injector.get("$rootScope");
       var $q = $injector.get("$q");
       var $location = $injector.get("$location");

       if (response.status === 405) {
         var errorData = angular.toJson({
           errorUrl: $location.path(),
           errorMessage: response.statusText,
           stackTrace: [{
             "url": response.config.url,
             "method": response.config.method
           }],
           agent: navigator.userAgent
         });

         $rootScope.Utils.notifyException(errorData);
       }

       if (response.data !== null) {
         var error = {
           "message": response.data.error_message,
           "code": response.data.error_code,
           "arguments": response.data.arguments
         };

         /* 10: Not Authenticated */
         if (error.code === 10) {
           $rootScope.Authentication.loginRedirect(false);
         } else if (error.code === 6 && $rootScope.Authentication.session) {
           if ($rootScope.Authentication.session.role !== "whistleblower") {
             $location.path($rootScope.Authentication.session.homepage);
           }
         }

         $rootScope.error = error;
       }

       return $q.reject(response);
     }
   };
}]).
  factory("noopInterpolation", ["$interpolate", "$translateSanitization", function ($interpolate, $translateSanitization) {
  // simple noop interpolation service

  var $locale,
      $identifier = "noop";

  return {
    setLocale: function(locale) {
      $locale = locale;
    },
    getInterpolationIdentifier : function () {
      return $identifier;
    },
    useSanitizeValueStrategy: function (value) {
      $translateSanitization.useStrategy(value);
      return this;
    },
    interpolate: function (value/*, interpolationParams, context, sanitizeStrategy, translationId*/) {
      return value;
    }
  };
}]).
  factory("stacktraceService", function() {
    return({
      fromError: StackTrace.fromError
    });
});
