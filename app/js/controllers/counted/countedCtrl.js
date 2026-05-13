/**
 * Created by Marcel on 07/04/2016.
 */

Lantern.controller('CountedCtrl', ['$scope', '$rootScope', '$filter', '$location', '$cookies', 'Farmer', 'User', 'Project','ApiRest',
  function($scope, $rootScope, $filter, $location, $cookies, Farmer, User, Project, ApiRest) {

    $scope.calculInProgress = 0

    $scope.dateStart = moment(moment()).startOf("month").format("DD-MM-YYYY")
    $scope.dateEnd = moment(moment()).endOf("month").format("DD-MM-YYYY")

    function formalizeDate(date) {
      return moment(date, "DD-MM-YYYY").get('year') + "-" + (moment(date, "DD-MM-YYYY").get('month') + 1) + "-" + moment(date, "DD-MM-YYYY").get('date')
    }

    $scope.user = ""
    $scope.project = ""
    $scope.actionNames = []
    $scope.selectedActions = []

    $scope.init = function() {
      $scope.user = ""
      $scope.project = ""
      $scope.showSection = false
      $scope.farmers = []
      $scope.activeFarmers = []

    }

    ApiRest.get('/requests/findtechnicians/', {
    }, function (data) {
      $scope.users = data
    }, null, true)    

    // 2021-02-03, replace old big request ( $scope.projects = Project.queryTrue();
    ApiRest.get('/projects/all/lantern/', 
    null, 
    function (projectsResponse) {
      $scope.projects = projectsResponse
    }, null, true)   

    $scope.userSelected = function(user) {
      getFarmerByRange(user.id, false)
      $scope.showSection = true
      $scope.user = user
    }
    $scope.projectSelected = function(project) {
      getFarmerByRange(project.id, true)
      $scope.showSection = true
      $scope.project = project
    }

    $scope.actionSelected = function() {
      $scope.activeFarmers =[]
      if($scope.selectedActions.length > 0) {
        $scope.activeFarmers = $scope.farmers.filter(farmer => $scope.selectedActions.some(action => action.id === farmer.request.action_type.id))
      } else {
        $scope.activeFarmers = $scope.farmers
      }
    }

    function getFarmerByRange(user_id, project) {

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
      }]

      if (project) {
        filtersFarmer.push({
          "name": "project_id",
          "value": user_id
        })
      } else {
        filtersFarmer.push({
          "name": "tech_writer_id",
          "value": user_id
        })
      }

      // {
      //   "name": "project_id",
      //   "value": user_id
      // }
      Farmer.getFarmersBy({
        filters: [filtersFarmer]
      }, function(farmers) {
        $scope.farmers = []
        $scope.actionNames = []
        $scope.activeFarmers = []
        $scope.selectedActions = []

        var farmerActions = []
        angular.forEach(farmers, function(farmer) {
          farmer.sortByTime = farmer.day + farmer.start_time + farmer.end_time
          $scope.farmers.push(farmer)
          $scope.activeFarmers.push(farmer)
          farmerActions.push(farmer.request.action_type);
        })

        var ids = []
        farmerActions.forEach(obj => {
          if (!ids.includes(obj.id)) {
            var action = {}
            action.id = obj.id
            action.value = obj.etape_type.value + ' / ' + obj.value
            $scope.actionNames.push(action);
            ids.push(obj.id)
          }
        })
        $scope.countTimeTotal()
        $scope.calculInProgress--
      })
    }
    //getFarmerByRange()

    $scope.$watch('dateStart', function() {
      if ($scope.dateStart == "") {
        $scope.dateStart = $scope.dateStartTemp
      }
      if ($scope.user.id != null) {
        getFarmerByRange($scope.user.id, false)
      } else if ($scope.project.id != null) {
        getFarmerByRange($scope.project.id, true)

      }

      $scope.dateStartTemp = $scope.dateStart

    })
    $scope.dateStartTemp = $scope.dateStart
    $scope.dateEndTemp = $scope.dateEnd
    $scope.$watch('dateEnd', function() {
      if ($scope.is_month_moving) {
        // if  move to another month avoid to request data twice
        $scope.is_month_moving = false
        return;
      }
      if ($scope.dateEnd == "") {
        $scope.dateEnd = $scope.dateEndTemp
      }
      if ($scope.user.id != null) {
        getFarmerByRange($scope.user.id, false)
      } else if ($scope.project.id != null) {
        getFarmerByRange($scope.project.id, true)

      }

      $scope.dateEndTemp = $scope.dateEnd

    })

    $scope.is_month_moving = false
    $scope.moveDate = 0
    $scope.moveMonth = function(previous) {
      if (previous) {
        $scope.moveDate += 1
      } else {
        $scope.moveDate -= 1
      }
      $scope.is_month_moving = true
      $scope.dateStart = moment(moment().subtract($scope.moveDate, 'months')).startOf("month").format("DD-MM-YYYY")
      $scope.dateEnd = moment(moment().subtract($scope.moveDate, 'months')).endOf("month").format("DD-MM-YYYY")
    }

    $scope.countTimeOne = function (farmer, format) {
      var start = moment(farmer.working_time_start)
      var end = moment(farmer.working_time_end)
      if (end.hours() < start.hours()
          && end.date() == start.date() 
          )  {
        end.set('date', end.date() + 1)
      }

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
      angular.forEach($scope.activeFarmers, function(farmer) {
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

    $scope.exportSeances = function() {
      if ($scope.project != '') {
        var name = $scope.project.name
      } else {
        var name = $scope.user.firstname + '_' + $scope.user.lastname
      }
      name += '_' + $scope.dateStart + '_' + $scope.dateEnd
      var header = '<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">';
      var blob = new Blob([header + document.getElementById('exportable').innerHTML], {
        type: "data:application/vnd.ms-excel;charset=UTF-8"
      });
      saveAs(blob, name + ".xls");
    };

  }
])
