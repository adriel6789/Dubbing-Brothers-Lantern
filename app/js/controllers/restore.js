Lantern.controller('RestoreCtrl', ['$rootScope', 'Session', 'AuthService', 'EVENTS','$stateParams',
  function($rootScope, Session, AuthService, EVENTS, $stateParams) {
    AuthService.authExterne({
      token: $stateParams.token,
      app_code: $stateParams.app_code
    },function(response){
      $rootScope.$broadcast(EVENTS.loginSucceeded);
    }, function(error){
      console.log('error  :', error)
    })

  }

]);
