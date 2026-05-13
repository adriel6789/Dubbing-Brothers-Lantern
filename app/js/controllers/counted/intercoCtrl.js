/**
 * Created by Hamza on 16/11/2021.
 */

 Lantern.controller('intercoCtrl', ['$scope', '$rootScope', '$filter', '$location', '$cookies', 'Farmer', 'User', 'Project','ApiRest',
 function($scope, $rootScope, $filter, $location, $cookies, Farmer, User, Project, ApiRest) {
    
   $scope.calculInProgress = 0

   $scope.dateStart = moment(moment()).startOf("month").format("DD-MM-YYYY")
   $scope.dateEnd = moment(moment()).endOf("month").format("DD-MM-YYYY")

   function formalizeDate(date) {
     return moment(date, "DD-MM-YYYY").get('year') + "-" + (moment(date, "DD-MM-YYYY").get('month') + 1) + "-" + moment(date, "DD-MM-YYYY").get('date')
   }
   $scope.actionsValue = []
   $scope.etapes = []
   $scope.etape = []
   $scope.etapeAction = []
   $scope.user = ""
   $scope.project = ""
   $scope.action = ""
   $scope.allProject = false

   $scope.init = function() {
     $scope.user = ""
     $scope.project = ""
     $scope.action = ""
     $scope.showSection = false
     $scope.showFacturationSection = false
     $scope.farmers = []
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

  ApiRest.get('/valuelists/values/', {
  }, function (data) {
    $scope.values = data
    Object.keys($scope.values.workflow_type).forEach(function (id) {
      ApiRest.get('/valuelists/ActionsByEtape/', {workflow_type_id: id}, function(etapes_actions) {
        $scope.etapes_actions[id] = {}
        etapes_actions.forEach(function (element) {
          $scope.etapes[element.id] = element
          $scope.etapes_actions[id][element.id] = element
          element.actions.forEach(function (action) {
            $scope.actions[action.id] = action
          })
          var i=0
          angular.forEach($scope.actions, function(actionValue) {
              $scope.actionsValue[i] = actionValue
            i++
          })
        })
        var i=0
        var j=0
        angular.forEach($scope.etapes, function(etapes) {
          if(etapes.actions !== undefined){
            $scope.etapes[i] = etapes.actions
          }
          angular.forEach($scope.etapes[i], function(etape) {
            if(etapes.value !== undefined){
              $scope.etape[j] = etape
              $scope.etapeAction[j] = {value: etapes.value+"/"+$scope.etape[j].value, id: etape.id}
            }
            j++
          })
        i++
        })
        $scope.etapeAction.sort((a,b) => {
          return a.value > b.value ? 1 : -1
        })
      })  
    })
  }, null, true)

   $scope.userSelected = function(user) {
     getFarmerByRange(user.id, false)
     $scope.showFacturationSection = false
     $scope.showSection = true
     $scope.user = user
   }
   $scope.projectSelected = function(project) {
     getFarmerByRange(project.id, true)
     $scope.showFacturationSection = false
     $scope.showSection = true
     $scope.project = project
   }
   $scope.actionSelected = function(action) {
    getFarmerByRange(false, false, action.id)
    $scope.showFacturationSection = false
    $scope.showSection = true
    $scope.action = action
  }
   $scope.searchAllProject = function(){
    getFarmerByRange()
    $scope.showFacturationSection = false
    $scope.showSection = true
    $scope.allProject = true;
   }
   $scope.searchAllProjectFacturation = function(){
    getFarmerByRange()
    $scope.showSection = false
    $scope.showFacturationSection = true
    $scope.allProject = true;
   }

   function getFarmerByRange(user_id, project, action) {
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
     } else if(user_id){
       filtersFarmer.push({
         "name": "tech_id",
         "value": user_id
       })
     }else if(action){
      filtersFarmer.push({
        "name": "action_id",
        "value": action
      })
     }else{
      filtersFarmer.push({
        "name": "all_project",
        "value": $scope.allProject
      })
     }

     // {
     //   "name": "project_id",
     //   "value": user_id
     // }
     Farmer.getSonodiFacturations({
      filters: [filtersFarmer]
    }, function(interco_values) {
      $scope.interco_values = []
      angular.forEach(interco_values, function(interco_value) {
        $scope.interco_values.push(interco_value)
      })
    })

     Farmer.getIntercoFarmersBy({
       filters: [filtersFarmer]
     }, function(farmers) {
       $scope.farmers = []
       angular.forEach(farmers, function(farmer) {
          if(farmer.display_name == "name"){
            farmer.lantern_project_name = farmer.name
          }else if(farmer.display_name == "code_name"){
            farmer.lantern_project_name = farmer.code_name
          }else if(farmer.display_name == "code_name_2"){
            farmer.lantern_project_name = farmer.code_name_2
          }else if(farmer.display_name == "code_name_3"){
            farmer.lantern_project_name = farmer.code_name_3
          }
         farmer.sortByTime = farmer.day + farmer.start_time + farmer.end_time
         if(farmer.vsn_name == 'serie'){
           farmer.human_description = $rootScope._T["x50ezpgc"] +" "+ farmer.season + " - "+ $rootScope._T["xfsk2tek"] +" "+ farmer.episode_number
         }else if(farmer.vsn_name == 'film'){
          farmer.human_description = farmer.vsn_name +" - "+ farmer.vpd_value
         }else{
          farmer.human_description = farmer.vsn_name +" - "+ farmer.description_text
         }
         $scope.farmers.push(farmer)

        if(farmer.vett_id == 9){
          if(farmer.start_time != null && farmer.end_time != null){
            var start_time_hour = parseInt(farmer.start_time.slice(0, -3), 10)
            var start_time_minute = parseInt(farmer.start_time.slice(-2), 10)
            var end_time_hour = parseInt(farmer.end_time.slice(0, -3), 10)
            var end_time_minute = parseInt(farmer.end_time.slice(-2), 10)
            var minute_estimate = end_time_minute-start_time_minute
            var hour_estimate = end_time_hour-start_time_hour
            if((end_time_minute-start_time_minute) < 0){
              minute_estimate = 60+end_time_minute-start_time_minute
              hour_estimate = hour_estimate-1
            }
            if((end_time_hour-start_time_hour) < 0){
              hour_estimate = hour_estimate+24
            }
            farmer.estimate_time = (hour_estimate)+'h'+(minute_estimate)
            farmer.estimate_time_minute =(hour_estimate*60) + (minute_estimate)
          }
        }

       })
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
     } else if ($scope.action.id != null) {
      getFarmerByRange(false, false, $scope.action.id)
     } else if ($scope.allProject != null) {
      getFarmerByRange()
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
     } else if ($scope.action.id != null) {
       getFarmerByRange(false, false, $scope.action.id)
     } else if ($scope.allProject != null) {
      getFarmerByRange()
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

   function n(n) {
     return n > 9 ? "" + n : "0" + n
   }

   $scope.exportSeances = function() {
     if ($scope.project != '') {
       var name = $scope.project.name
     } else if ($scope.user != ''){
       var name = $scope.user.firstname + '_' + $scope.user.lastname
     } else if ($scope.action != ''){
       var name = $scope.action.value
     } else {
      var name = "all_project"
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
