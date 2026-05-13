Lantern.controller('SuiviProdHelpDialogCtrl', ['$scope', '$timeout', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location', '$cookies', '$stateParams', '$filter', 'ngDialog',
  function($scope, $timeout, $rootScope, $anchorScroll, $http, $q, $state, $location, $cookies, $stateParams, $filter, ngDialog) {

    $scope.helpDay = moment().format('DD');
    $scope.helpMonth = moment().format('MMM');

  }
]);
