Lantern.controller('requestsCtrl',
  ['$rootScope', '$scope', '$filter', '$state',
  'Valuelist', 'ngDialog', 'NotificationService', '$location', 'Session',
  'ApiRest', 'requestDemandsService', '$timeout', '$stateParams', 'cfpLoadingBar',
  function ($rootScope, $scope, $filter, $state,
    Valuelist, ngDialog, NotificationService, $location, Session,
    ApiRest, requestDemandsService, $timeout, $stateParams, cfpLoadingBar) {
    // ne semble plus utilisé (phv 20230808)
    cfpLoadingBar.start();
    var rest = {};
    $scope.reduce = false;
    $scope.showOnlyMyRequests = false;
    $scope.hideOnHoldRequests = true;
    rest.getRequestDemands = function () {
      var params = {};
      if ($scope.showOnlyMyRequests) {
        params.id = Session.userId();
      }

      if ($scope.hideOnHoldRequests) {
        params.on_hold = $scope.hideOnHoldRequests;
      }
      ApiRest.get('/requestdemands', params, function(response) {
        $scope.requests = requestDemandsService.filterGroup(response);
      }, function(error) {
        console.log(error);
      });
    };
    rest.init = function() {
      rest.getRequestDemands();
    }();

    $scope.loadRequests = function (showOnly, hideOnHold) {
      $scope.showOnlyMyRequests = showOnly;
      $scope.hideOnHoldRequests = hideOnHold;
      rest.getRequestDemands();
    };

    $scope.selectGroup = function(group) {

      group.requests.forEach(function(requestInGroup) {

        var allRequest = $filter('filter')($scope.requests, {
          id: requestInGroup.id
        }, true);

        if (allRequest != null && allRequest.length == 1) {
          allRequest[0].selected = !allRequest[0].selected;
        }
        requestInGroup.selected = !requestInGroup.selected;
      });
    };

    $scope.textFilter = $.cookie('requestSearch');
    $scope.saveSearch = function (text) {
      var date = new Date();
      date.setTime(date.getTime() + (300 * 1000));
      $.cookie('requestSearch', text, {
        expires: date,
        path: '/'
      });
      $scope.textFilter = text;
    };

    
    $scope.startDate = null;
    $scope.endDate = null;

    $scope.filterRequest = function (method) {

      $scope.startTimestamp = ""
      $scope.endTimestamp = ""

      switch (method) {
        case "previous":
          $scope.filterDate = 4;
          var startTemp = moment().startOf('isoWeek').subtract(1, "weeks")
          var endTemp = moment().endOf('isoWeek').subtract(1, "weeks")
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          break;

        case "current":
          $scope.filterDate = 3;

          var startTemp = moment().startOf('isoWeek')
          var endTemp = moment().endOf('isoWeek')
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          break;

        case "next":
          $scope.filterDate = 5;

          var startTemp = moment().startOf('isoWeek').add(1, "weeks")
          var endTemp = moment().endOf('isoWeek').add(1, "weeks")
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          break;

        case "tomorrow":
          $scope.filterDate = 2;

          var startTemp = moment().add(1, "days")
          var endTemp = moment().add(1, "days")
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          break;

        case "today":
          $scope.filterDate = 1;

          $scope.startDate = moment().format('DD/MM/YYYY')
          $scope.endDate = moment().format('DD/MM/YYYY')

          var startTemp = moment()
          var endTemp = moment()
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          break;

        default:
          $scope.filterDate = 0;

          $scope.startDate = ""
          $scope.endDate = ""
          $scope.startTimestamp = ""
          $scope.endTimestamp = ""
          break;
      }

      $scope.filterChoosen = method

    };    
  }
]);
