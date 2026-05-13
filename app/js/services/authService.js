bonsServices.factory('AuthService', ['$http','$resource', 'Session', 'USER_ROLES', '$rootScope', 'EVENTS','ApiRest','$localstorage', '$location',
  function($http,$resource, Session, USER_ROLES, $rootScope, EVENTS, ApiRest, $localstorage, $location) {
    let authService = {};
    authService.auth = function(params, successCallback, errorCallback) {
      var onSuccess = function(result) {
        if (result.error) {
          Session.clean();
          return errorCallback();
        } else {
          Session.create(result);
          ApiRest.updateToken(result.token);
          $rootScope.$broadcast(EVENTS.loginSucceeded);
          return successCallback(result);
        }
      };
      if (params.authToken) {
        ApiRest.get('/users/restore', {
          token: params.authToken,
          app_code: 'bons-travaux-auto'
        },onSuccess);
        $location.search('authToken', null);
      } else {
        ApiRest.post('/users/login', {}, {
          email: params.email,
          pass: params.pass,
          app_code: 'bons-travaux-auto'
        },onSuccess);
      }
    };

    authService.logout = function(){
      ApiRest.get("/users/logout", {}, function(response) { }, function(error) {});
    }

    authService.getSetUpInfo = function(
        params,
        successCallback,
        errorCallback
      ) {
        ApiRest.get(
          "/persons/setupinfo",
          params,
          function(response) {
            return successCallback(response);
          },
          function(error) {
            return errorCallback(error);
          }
        );
      };

      authService.authExterne = function(params, successCallback, errorCallback) {
          var login = $resource(URL_API + '/users/restore/', {});
          login.get(params, function(result) {
              if (result.error) {
                  Session.clean();
                  return errorCallback(result.error);
              } else {
                  Session.clean();
                  result.token = params.token;
                  result.user_id = result.id;
                  Session.create(result);
                  ApiRest.updateToken(result.token);
                  return successCallback(result);
              }
          });
          return login;
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
