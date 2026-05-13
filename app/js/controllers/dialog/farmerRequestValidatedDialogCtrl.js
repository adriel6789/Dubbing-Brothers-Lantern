Lantern.controller('FarmerRequestValidatedDialog', ['$rootScope', '$scope', '$location', '$filter', 'ngDialog', '$stateParams', 'Farmer', 'Request', 'Comment', 'FarmerService',
  function($rootScope, $scope, $location, $filter, ngDialog, $stateParams, Farmer, Request, Comment, FarmerService) {
    if ($rootScope.canDisplay(9)) {

      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth() + 1; //January is 0!
      var yyyy = today.getFullYear();
      if (dd < 10) {
        dd = '0' + dd;
      }
      if (mm < 10) {
        mm = '0' + mm;
      }
      var today = yyyy + '-' + mm + '-' + dd;

      var tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dd = addZero(tomorrow.getDate());
      mm = addZero(tomorrow.getMonth() + 1); //January is 0!
      yyyy = tomorrow.getFullYear();

      tomorrow = yyyy + '-' + mm + '-' + dd;
      $scope.tomorrow = tomorrow;
      $scope.today = today;



      if ($scope.currentFarmer != null) {
        if ($scope.currentFarmer.working_time_start != null) {
          $scope.currentFarmer.working_time_start = $scope.currentFarmer.working_time_start.substr(11, 5);
        }
        if ($scope.currentFarmer.working_time_end != null) {
          $scope.currentFarmer.working_time_end = $scope.currentFarmer.working_time_end.substr(11, 5);
        }
      } else {
        $scope.currentFarmer = "";
        $scope.currentFarmer.break_time = "";
        $scope.currentFarmer.working_time_start = "";
        $scope.currentFarmer.working_time_end = "";
      }

      $scope.showValidate = function() {
        var show = false;
        if ($scope.currentFarmer != null) {
          if ($scope.currentFarmer.working_time_start != null && $scope.currentFarmer.working_time_end != null) {
            if ($scope.currentFarmer.working_time_start.length == 5 && $scope.currentFarmer.working_time_end.length == 5) {
              var start = $scope.currentFarmer.working_time_start.split(':');
              if (start.length == 2 && (start[0] >= 0 || start[0] <= 23) && (start[1] >= 0 && start[1] <= 59)) {
                var end = $scope.currentFarmer.working_time_end.split(':');
                if (end.length == 2 && (end[0] >= 0 || end[0] <= 23) && (end[1] >= 0 && end[1] <= 59)) {
                  if ($scope.currentFarmer.break_time >= 0 && $scope.currentFarmer.break_time <= 999) {
                    if ($scope.currentFarmer.is_done == 1) {
                      show = true;
                    }
                    if ($scope.currentFarmer.is_partial == 1) {
                      show = true;
                    }
                  } else if ($scope.currentFarmer.break_time == "" || $scope.currentFarmer.break_time == null) {
                    if ($scope.currentFarmer.is_done == 1) {
                      show = true;
                    }
                    if ($scope.currentFarmer.is_partial == 1) {
                      show = true;
                    }
                  }
                }
              }
            }
          } else if($scope.mainRequest.action_type.etape_type.name != "enregistrement"
            && $scope.mainRequest.action_type.etape_type.name != "mixage"
            && $scope.mainRequest.action_type.etape_type.name != "montage"){
            if ($scope.currentFarmer.is_done == 1 || $scope.currentFarmer.is_partial == 1) {
              show = true;
            }
          }
        }
        return show;
      };

      $scope.validate = function () {
        let reghhmm = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
        let regnum = /^[0-9]*$/
        let updateFarmer = new Farmer();
        $.cookie("returnDemand", "true", {path: '/', expires: 1});

        let updateFarmers = function () {
          if (reghhmm.test($scope.currentFarmer.working_time_start) && reghhmm.test($scope.currentFarmer.working_time_end) && ($scope.currentFarmer.break_time == null || regnum.test($scope.currentFarmer.break_time))) {

            var startMoment = moment($scope.currentFarmer.working_time_start, "HH:mm")
            var endMoment = moment($scope.currentFarmer.working_time_end, "HH:mm")

            var dayOfEndTime = $scope.today
            if (startMoment.format('HH:mm') >= endMoment.format('HH:mm')) {
              dayOfEndTime = $scope.tomorrow
            }

            updateFarmer.working_time_start = today + " " + $scope.currentFarmer.working_time_start;
            updateFarmer.working_time_end = dayOfEndTime + " " + $scope.currentFarmer.working_time_end;
            updateFarmer.break_time = $scope.currentFarmer.break_time;

            if ($scope.currentFarmer.is_partial == 1) {
              updateFarmer.is_done = 1;
              updateFarmer.is_partial = 1;
            } else {
              updateFarmer.is_done = 1;
              updateFarmer.is_partial = 0;
            }
            updateFarmer.is_not_done = 0;
            
            updateFarmer.closing_date = todaySQL;


            updateFarmer.$directUpdate({
              id: $scope.currentFarmer.id
            }, function (resp) {
              //newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, "Séance farmer terminée")
              swal($rootScope._T["70jumwe9"], $rootScope._T["afpcgsyb"], "success");
              ngDialog.close();

              //$location.path("/requestsValidated");
            });


          } else if (
            $scope.mainRequest.action_type.etape_type.name != "enregistrement"
            && $scope.mainRequest.action_type.etape_type.name != "mixage"
            && $scope.mainRequest.action_type.etape_type.name != "montage") {
            // note phv 20210106, ne concerne que la France
            updateFarmer.working_time_start = null;
            updateFarmer.working_time_end = null;
            updateFarmer.break_time = null;


            if ($scope.currentFarmer.is_partial == 1) {
              updateFarmer.is_done = 1;
              updateFarmer.is_partial = 1;
            } else {
              updateFarmer.is_done = 1;
              updateFarmer.is_partial = 0;
            }

            updateFarmer.is_not_done = 0;

            updateFarmer.closing_date = todaySQL;

            updateFarmer.$directUpdate({
              id: $scope.currentFarmer.id
            }, function () {
              //newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, "Séance farmer terminée")
              swal($rootScope._T["70jumwe9"], $rootScope._T["afpcgsyb"], "success");
              ngDialog.close();
              //$location.path("/requestsValidated");
            });
          } else {
            $.cookie("returnDemand", "false", { path: '/', expires: 1 });

            swal($rootScope._T["mx7q7rbm"], $rootScope._T["rq4jyhn6"], "error");
          }
        }  

        var unTreatedFarmer = false;
        if ($scope.currentFarmer.is_done == 1 && $scope.currentFarmer.is_partial != 1) {
            if (FarmerService.isMoreFarmersUntreatedInRequest($scope.currentFarmer, $scope.mainRequest)) {
              unTreatedFarmer = true;
            }
        }
        if (unTreatedFarmer) {
          swal({
            title: $rootScope._T["3fcctg13"],
            text: $rootScope._T["raeeid4w"],
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: $rootScope._T["ouyrbtz3"],
            cancelButtonText: $rootScope._T["5erp771v"]
          }, function () {
            updateFarmers();
          });
        } else {
          updateFarmers();
        }

      };
    }

  }
]);
