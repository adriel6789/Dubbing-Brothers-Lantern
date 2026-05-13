/**
 * Created by Marcel on 07/04/2016.
 */

Lantern.controller('CountedTechCtrl', ['$scope', '$rootScope', '$filter', '$location', '$cookies', 'Farmer', 'User', 'Session',
  function($scope, $rootScope, $filter, $location, $cookies, Farmer, User, Session) {

    $scope.calculInProgress = 0
    $scope.is_month_moving = true;

    $scope.dateStart = moment(moment()).startOf("month").format("DD-MM-YYYY");
    $scope.dateEnd = moment(moment()).endOf("month").format("DD-MM-YYYY");
    var role = Session.role();
    $scope.role = role;

    function formalizeDate(date) {
      return moment(date, "DD-MM-YYYY").get('year') + "-" + (moment(date, "DD-MM-YYYY").get('month') + 1) + "-" + moment(date, "DD-MM-YYYY").get('date')
    }

    User.getCurrentUserDetails({}, user =>
    {
       $scope.user = user;
    });

    function getFarmerByRange() {
      $scope.calculInProgress++
        var dateStartFilter = formalizeDate($scope.dateStart)
      var dateEndFilter = formalizeDate($scope.dateEnd)

      var filtersFarmer = [{
          "name": "is_finished",
          "value": "1"
        }, {
          "name": "working_time_start",
          "value": "not null"
        }, {
          "name": "working_time_end",
          "value": "not null"
        }, {
          "name": "period_day",
          "value": dateStartFilter + "," + dateEndFilter
        }, {
          "name": "is_not_done",
          "value": "0"
        }

      ]
      if ($rootScope.canDisplay(8)) {
        filtersFarmer.push({
          "name": "tech_writer_id",
          "value": $.cookie('user_id')
        })
      }
      Farmer.getFarmersBy({
        filters: [filtersFarmer]
      }, function(farmers) {
        $scope.farmers = []
        angular.forEach(farmers, function(farmer) {
          farmer.sortByTime = farmer.day + farmer.start_time + farmer.end_time
          $scope.farmers.push(farmer)
        })

        $scope.countTimeTotal()
        $scope.calculInProgress--
      })
    }

    // get datas at initialization
    //getFarmerByRange()

    $scope.$watch('dateStart', function() {
      if ($scope.dateStart == "") {
        $scope.dateStart = moment(moment()).startOf("month").format("DD-MM-YYYY")
      }
      getFarmerByRange()
    })
    $scope.$watch('dateEnd', function() {
      if ($scope.is_month_moving) {
        // if  move to another month avoid to request data twice
        $scope.is_month_moving = false
        return;
      }      
      if ($scope.dateEnd == "") {
        $scope.dateEnd = moment(moment()).endOf("month").format("DD-MM-YYYY")
      }
      getFarmerByRange()
    })

    $scope.moveDate = 0
    $scope.moveMonth = function(previous) {
      if (previous) {
        $scope.moveDate += 1
      } else {
        $scope.moveDate -= 1
      }
      $scope.is_month_moving = true;
      $scope.dateStart = moment(moment().subtract($scope.moveDate, 'months')).startOf("month").format("DD-MM-YYYY")
      $scope.dateEnd = moment(moment().subtract($scope.moveDate, 'months')).endOf("month").format("DD-MM-YYYY")
    }

    $scope.countTimeOne = function(farmer, format) {
      var start = moment(farmer.working_time_start)
      var end = moment(farmer.working_time_end)
      var diff = end.diff(start, 'minutes')
      if (farmer.break_time != null) {
        diff -= farmer.break_time
      }
      var duration = moment.duration(diff, 'minutes')
      if (format == 'minutes') {
        return duration.asMinutes()
      } else if (format == 'hours') {
        return n(parseInt(duration.asHours())) + "h" + n(duration.minutes())
      } else {
        return duration
      }
    }

    $scope.countTimeTotal = function() {
      $scope.calculInProgress++
        var total = {}
      total.minutes = 0
      angular.forEach($scope.farmers, function(farmer) {
        total.minutes += $scope.countTimeOne(farmer).asMinutes()
      })
      var duration = moment.duration(total.minutes, 'minutes')
      total.hours = n(parseInt(total.minutes / 60)) + "h" + n(duration.minutes())
      $scope.calculInProgress--
        return total

    }

    function n(n) {
      return n > 9 ? "" + n : "0" + n
    }
  }
])
