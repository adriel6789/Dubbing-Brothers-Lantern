Lantern.controller('RecordsPrevisionalListTechCtrl', ['$scope', '$filter', '$cookies', '$stateParams', 'Request', 'RequestGroup', 'Farmer', 'User', '$location', 'Session','$rootScope',
  function ($scope, $filter, $cookies, $stateParams, Request, RequestGroup, Farmer, User, $location, Session, $rootScope) {

    var modifs = 0;
    var role = Session.role();
    $scope.role = role;
    var user_id = $.cookie('user_id')
    $scope.transformHourInI18nFormat = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)

    $scope.days = []
    for (var i = 0; i < 12; i++) {
      $scope.days[i] = moment().add(i, "days")
    }

    $scope.farmers = [];


    const filters1 = [{
      "name": "rw",
      "value": user_id
    }, {
      "name": "period_day",
      "value": $scope.days[0].format("YYYY-MM-DD") + "," + $scope.days[$scope.days.length - 1].format("YYYY-MM-DD")
    }];
    Farmer.getFarmersBy({
      filters: [filters1],
      groupByBID: true
    }, function (farmers) {
      farmers.forEach(function (farmer) {
        var isFarmerPresent = $filter('filter')($scope.farmers, {
          'id': farmer.id
        }, true).length > 0
        if (!isFarmerPresent) {
          $scope.farmers.push(farmer);
        }


      });
      /*
      var filters2 = [{
        "name": "tech_reader_id",
        "value": user_detail.id
      }, {
        "name": "period_day",
        "value": $scope.days[0].format("YYYY-MM-DD") + "," + $scope.days[$scope.days.length - 1].format("YYYY-MM-DD")
      }];
      Farmer.getFarmersBy({
        filters: [filters2],
        groupByBID: true
      }, function (farmers) {
        farmers.forEach(function (farmer) {
          var isFarmerPresent = $filter('filter')($scope.farmers, {
            'id': farmer.id
          }, true).length > 0
          if (!isFarmerPresent) {
            $scope.farmers.push(farmer);
          }
        });
      });
      */


    });

    $scope.selectAll = function () {
      modifs = 1;
      demandes.forEach(function (demande) {
        demande.selected = !$scope.masterCheckbox;
      });
    }


  }
]);


