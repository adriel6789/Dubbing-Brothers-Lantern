Lantern.controller('SettingsUserDialogCtrl', ['$scope', '$rootScope', '$filter', 'User', 'UsersService', 'ValueListService',
    function ($scope, $rootScope, $filter, User, UsersService, ValueListService) {
      ValueListService.getPlanningTypes()
      $scope.user_role = $.cookie("role");
      $scope.planningFiltered = []
      $scope.plannings.forEach((planning) => {
        // so digi qc and prepa :)
        if ($rootScope.canDisplay(784)) {
          if (planning.service == $rootScope.user_entity.permissions[0].roles[0].name) {
            $scope.planningFiltered.push(planning)
          }
          // digital-media is written with and without dash and it is too difficult and dangerous to homogeneize
          if ($rootScope.user_entity.permissions[0].roles[0].name == 'digitalmedia' && planning.service == 'digital-media') {
            $scope.planningFiltered.push(planning)
          }
        } else {
          $scope.planningFiltered.push(planning)
        }

      })
      function getViewPlanning(){
          $scope.viewPlanning = [];
          if($.cookie('planningHome') != null) {
              var index = $.cookie('planningHome');
              var tabId = index.split(',');

              tabId.forEach(function (id) {
                $scope.viewPlanning[id] = true;
              });
          }
      }

      $scope.setViewPlanning = function(){
          var index = [];
          
          angular.forEach($scope.plannings, function (planning) {
            if ($scope.viewPlanning[planning.id] === true) {
              index.push(planning.id);
            }
          });
          $.cookie('planningHome', index.join(), {path: '/', expires: 60});

          UsersService.updateParameter({ lantern_plannings: index.join() }, function resolved(response) {}, function rejected() {})
      };

      $scope.updateNotifByMail = function () {
        UsersService.updateParameter({ notif_mail: $scope.notificationsByMail }, function resolved(response) {}, function rejected() {})
      };

      User.getCurrentUserDetails({}, function (user) {
          if (user.notif_mail == 1) {
              $scope.notificationsByMail = true;
          }
      });

      getViewPlanning();

    }]);
