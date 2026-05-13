bonsServices.factory('AuthService', ['$http', 'Session', 'USER_ROLES', '$rootScope', 'EVENTS','ApiRest',
  function($http, Session, USER_ROLES, $rootScope, EVENTS, ApiRest) {
    var authService = {};
    authService.auth = function(params, successCallback, errorCallback) {
      ApiRest.post('/users/login', {}, {
        email: params.email,
        pass: params.pass,
        app_code: 'bons-travaux-auto'
      }, function(result) {
        if (result.error) {
          Session.clean();
          return errorCallback();
        } else {
          Session.create(result);
          ApiRest.updateToken(result.token);
              $rootScope.$broadcast(EVENTS.loginSucceeded);
          return successCallback(result);
        }
      });
    };

    authService.isAuthenticated = function() {
      return Session.token() ? true : false;
    };

    authService.isAuthorized = function(authorizedRoles) {
      if (!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      };

      if (!authService.isAuthenticated() && authorizedRoles.indexOf(USER_ROLES.guest) > -1) {
        return true;
      } else {
        return (authorizedRoles.indexOf(Session.role()) !== -1);
      }
    };

    authService.checkPermission = function(authorizedRoles, role) {
      return authorizedRoles.indexOf(role) > -1 ? true : false;
    };

    return authService;
  }
]);
