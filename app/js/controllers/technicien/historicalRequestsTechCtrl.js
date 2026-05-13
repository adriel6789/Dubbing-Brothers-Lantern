Lantern.controller('HistoricalRequestsTechCtrl', ['$rootScope', '$scope', '$q', '$filter', '$cookies', '$state', '$stateParams', '$sce', 
'ngDialog', 'Request', 'Observation', 'Return', 'Comment', 'MediaItems', 'RequestGroup', 'Farmer', 'Attachments', 'User', 'Group', 'Client', 
'Workflow', 'FileUploader', '$window', 'Notification', '$location', 'Session',
  function($rootScope, $scope, $q, $filter, $cookies, $state, $stateParams, $sce, 
    ngDialog, Request, Observation, Return, Comment, MediaItems, RequestGroup, Farmer, Attachments, User, Group, Client, 
    Workflow, FileUploader, $window, Notification, $location, Session) {

    var user_id = $.cookie('user_id');
    var role = Session.role();
    $scope.role = role;

    if ($rootScope.canDisplay(1)) {
      var filtersFarmer = [{
        "name": "is_finished",
        "value": "1"
      }];
      var filtersInternal = [{
        "name": "is_sent_back",
        "value": "1"
      }];
    } else {
      var filtersFarmer = [{
        "name": "is_finished",
        "value": "1"
      }, {
        "name": "tech_writer_id",
        "value": user_id
      }];
      var filtersInternal = [{
        "name": "is_sent_back",
        "value": "1"
      }, {
        "name": "tech_writer_id",
        "value": user_id
      }];
    }

    $scope.requestsFound = [];
    $scope.rangeDateValues = {};
    $scope.rangeDateValues.dateStart = moment(moment()).startOf("week").format("DD-MM-YYYY")
    $scope.rangeDateValues.dateEnd = moment(moment()).endOf("week").format("DD-MM-YYYY")

    $scope.$watchCollection('rangeDateValues', function() {
      const range_dates_request = {
                                  "name": "range_dates_request",
                                  "value": JSON.stringify($scope.rangeDateValues)
                                  };
      filtersFarmer[2]= range_dates_request;
      filtersInternal[2]= range_dates_request;
      $scope.requestsFound = [];
      applyPromise();
    })


    function getRequests() {
      var deferred = $q.defer();
      $rootScope.showLoading++;
      var p1 = Farmer.getFarmersBy({
        filters: [filtersFarmer]
      }, function(farmers) {
        $rootScope.showLoading--;
        $scope.requestsFromFarmer = [];
        var groupDone = [];
        farmers.forEach(function(farmer) {
          //if (farmer.request.in_group != 1) {
          var hasReturns = false;
          if (farmer.request != null) {
            if (farmer.request.ownReturn != null) {
              if (farmer.request.ownReturn.length != 0) {
                hasReturns = true;
              }
            }
            farmer.request.hasReturns = hasReturns;
          }
          var req = farmer.request;
          if (req != null) {
            req.farmer = farmer;
            var index = $scope.requestsFound.indexOf(req.id);
            if (index == -1) {
              $scope.requestsFound.push(req.id);
              $scope.requestsFromFarmer.push(req);
            }
          }
        });
      });


      $rootScope.showLoading++;
      var p2 = Request.getRequestsBy({
        filters: [filtersInternal]
      }, function(requests) {
        $rootScope.showLoading--;
        $scope.requestsFromInternal = [];
        var groupDone = [];
        requests.forEach(function(request) {
          var hasReturns = false;
          if (requests != null) {
            if (request.ownReturn != null && request.ownReturn) {
              request.hasReturns = true;
            }
          }

          var index = $scope.requestsFound.indexOf(request.id);
          if (index == -1) {
            $scope.requestsFound.push(request.id);
            $scope.requestsFromInternal.push(request);
          }
        });
      });

      $q.all([
        p1.$promise,
        p2.$promise
      ]).then(function() {
        deferred.resolve();
      });

      return deferred.promise;
    }

    
    applyPromise = function () {
      const dateEnd = ($scope.rangeDateValues.dateEnd != '' )? moment($scope.rangeDateValues.dateEnd,'DD-MM-YYYY').format('YYYY-MM-DD'): null;
      const dateStart = ($scope.rangeDateValues.dateStart != '')? moment($scope.rangeDateValues.dateStart,'DD-MM-YYYY').format('YYYY-MM-DD'): null;
      
      var promise = getRequests();
      promise.then(function() {
        $scope.requests = $scope.requestsFromFarmer.concat($scope.requestsFromInternal);
        angular.forEach($scope.requests, function(request) {
          angular.forEach(request.ownFarmerbookings, function(farmer) {
            if( request.closing_date == null && farmer.working_time_start != null ){
              if (
                  (dateStart == null &&  dateEnd == null)
                  || (dateStart != null && dateEnd == null && moment(farmer.working_time_start).isAfter(dateStart)) 
                  || (dateStart == null && dateEnd != null && moment(farmer.working_time_start).isBefore(dateEnd)) 
                  || (dateStart != null && dateEnd != null && moment(farmer.working_time_start).isAfter(dateStart) && moment(farmer.working_time_start).isBefore(dateEnd)) 
                ){
                  request.closing_date = farmer.working_time_start;
                  return
              }
            }
          });
          request.workflow.color = colorizeWorkflow(request.workflow);
          if (request.closing_date == null) {
            request.closing_date = request.date_creation
          }
          request.closing_date_moment = moment(request.closing_date).format("dddd Do MMMM YYYY");
        });

      });
    }
  }
]);