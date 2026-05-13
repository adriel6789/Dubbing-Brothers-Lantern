Lantern.controller('LoginCtrl', ['$rootScope', '$scope', '$state', '$location', 'AuthService', 'EVENTS', 'Session', 'StatistiqueService', '$interval',
  function($rootScope, $scope, $state, $location, AuthService, EVENTS, Session, StatistiqueService, $interval) {

    $scope.global = {};
    $scope.global.email = Session.rememberMe() ? Session.rememberMe() : "";
    $scope.global.pass = "";
    $scope.global.authToken = $location.search().authToken;
    $scope.year = moment().format("YYYY");

    $scope.login = function() {
      $rootScope.showLoading++;
      $scope.errorAuth = false;
      AuthService.auth($scope.global, function success() {
        $scope.successAuth = false;
      }, function error() {
        $rootScope.showLoading--;
        $scope.global.pass = "";
        $scope.errorAuth = true;
      });
    };

    if($scope.global.authToken) $scope.login();

    function getStatistiques () {
        StatistiqueService.getStatsWithBranch().then(counts => {
            $scope.requestsCount = counts.created_requests;
            $scope.projectsCount = counts.created_projects;
            $scope.notifsCount = counts.created_notifs;
            $scope.farmersCount = counts.created_farmers;
        })
    }
    getStatistiques();
      // $interval(() => {
      //   getStatistiques();
      // }, 30000);

    $scope.loginViaSaloon = function() {
      let redirectUrl =  SALOON_URL +'/#!/login?app_code='+APP_CODE+'&redirect='+window.location.href;
      window.open(redirectUrl,"_self");
    };
  }

]);
