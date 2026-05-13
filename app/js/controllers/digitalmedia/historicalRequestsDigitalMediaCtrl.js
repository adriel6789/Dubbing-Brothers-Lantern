Lantern.controller('historicalRequestsDigitalMediaCtrl', ['$rootScope', '$scope', '$filter', '$cookies', '$state', '$stateParams', 'Request', 'User', '$window', '$location', 'Session',
  function($rootScope, $scope, $filter, $cookies, $state, $stateParams, Request, User, $window, $location, Session) {

    const role = Session.role();
    $scope.role = role;
    let service = 'digital-media'
    if ($stateParams.service) {
      service = $stateParams.service
    } else {
      if ($rootScope.canDisplay(16)) {
        service = 'digital-media'
      } else if ($rootScope.canDisplay(256)) {
        service = 'qc'
      } else if ($rootScope.canDisplay(512)) {
        service = 'prepa'
      }
    }
    $scope.calculInProgress = 0;
    $scope.requests = [];

    $scope.dateStart = moment(moment()).startOf("month").format("DD-MM-YYYY");
    $scope.dateEnd = moment(moment()).endOf("month").format("DD-MM-YYYY");

    function formalizeDate(date) {
      return moment(date, "DD-MM-YYYY").format("YYYY-MM-DD");
    }

    let getDate = false
    $scope.$watch('dateStart', function() {
      if ($scope.dateStart == "") {
        $scope.dateStart = $scope.dateStartTemp;
      }
      if ($scope.dateEnd && moment($scope.dateStart, "DD-MM-YYYY").isBefore(moment($scope.dateEnd, "DD-MM-YYYY"))  ) {
        getDate = true
        getRequestsByRange();
      }
      

      $scope.dateStartTemp = $scope.dateStart;

    })
    $scope.dateStartTemp = $scope.dateStart
    $scope.dateEndTemp = $scope.dateEnd
    $scope.$watch('dateEnd', function() {
      if ($scope.dateEnd == "") {
        $scope.dateEnd = $scope.dateEndTemp;
      }
      if (!getDate ) {
        getRequestsByRange()
      }
      getDate = false

      $scope.dateEndTemp = $scope.dateEnd;

    })

    $scope.moveDate = 0;
    $scope.moveMonth = function(previous) {
      if (previous) {
        $scope.moveDate += 1;
      } else {
        $scope.moveDate -= 1;
      }
      $scope.dateStart = moment(moment().subtract($scope.moveDate, 'months')).startOf("month").format("DD-MM-YYYY");
      $scope.dateEnd = moment(moment().subtract($scope.moveDate, 'months')).endOf("month").format("DD-MM-YYYY");
    }

    function n(n) {
      return n > 9 ? "" + n : "0" + n;
    }

    function getRequestsByRange() {

      $scope.calculInProgress++
      var dateStartFilter = formalizeDate($scope.dateStart);
      var dateEndFilter = formalizeDate($scope.dateEnd);

      var filtersRequests = [{
        "name": "planning_id",
        "value": service
      }, {
        "name": "period_closing_date",
        "value": dateStartFilter + "," + dateEndFilter
      }, {
        "name": "is_done",
        "value": "1"
      }, {
        "name": "is_canceled",
        "value": "0"
      }];


      Request.getRequestsBy({
        filters: [filtersRequests]
      }, function(requests) {
        $scope.requests = [];
        angular.forEach(requests, function(request) {
          $scope.requests.push(request);
        })
        $scope.calculInProgress--;
      });
    }

  }
]);
