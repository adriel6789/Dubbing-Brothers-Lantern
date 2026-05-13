/**
 * Created by Marcel Tessier on 06/07/15.
 * note 20211110 il semble que ce n'est jamais appelé ni utilisé
 * appelé par $rootScope.checkNotification, mais ce dernier n'est jamais appelé
 */
Lantern.controller('AdvancedNotificationDialogCtrl', ['$rootScope', '$scope', '$filter', 'ngDialog', 'Request', '$q', 'User', 'Group', 'Client', 'Notification', '$state', 'Session', 'DynamicFormService',
  function($rootScope, $scope, $filter, ngDialog, Request, $q, User, Group, Client, Notification, $state, Session, DynamicFormService) {

    let dynamicForm = DynamicFormService.getFormData();
    
    var role = Session.role();
    if ($rootScope.canDisplay(7)) {
      $scope.method = [];

      $scope.edit = false;

      $scope.request = Request.get({
        "requestId": $scope.notif.request_id
      }, function() {
        console.log($scope.request);
      });

      $scope.editField = function() {
        $scope.edit = true;
      };

      $scope.goToRequest = function(request_id) {
        if (!$scope.edit) {
          $state.go('app.requestsDetail', {
            id: request_id
          });
          ngDialog.close();
        } else {
          swal({
              title: $rootScope._T["bmsngkry"],
              text: $rootScope._T["3zf31ukh"],
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: $rootScope._T["nhrq4bd1"],
              cancelButtonText: $rootScope._T["xt5s2d78"],
              closeOnConfirm: true
            },
            function() {
              $state.go('app.requestsDetail',{
                id : request_id
              });
              ngDialog.close();
            });
        }
      };


      $scope.doneEditing = function(notif) {
        var updatedRequest = new Request();
        var value = $scope.notif.field_name;
        if ($scope.notif.id_form != null) {
          var temp = value.split("_");

          if (temp[temp.length - 1] === $scope.notif.request_id) {
            updatedRequest = new Request();
            var res = value.split("_");


            var variable = value.substring(0, value.length - (res[res.length - 1].length + 1));

            updatedRequest[variable] = $scope.method[variable];

            updatedRequest.$update({
              requestId: $scope.notif.request_id
            }, function(data) {
              swal($rootScope._T["70jumwe9"], $rootScope._T["mnv2l8o5"], "success");
              $scope.edit = false;
              Notification.deleteByCommonId({
                'common_id': $scope.notif.common_id
              });
            }, function(data) {
              swal($rootScope._T["9a5vpf3c"], $rootScope._T["tylmoe7m"], "error");
              return "Error " + data.status + " : " + data.statusText;
            });

          } else {
            updatedRequest = new Request();
            updatedRequest[value] = $scope.method[value];
            updatedRequest.$update({
              requestId: $scope.notif.request_id
            }, function(data) {
              swal($rootScope._T["70jumwe9"], $rootScope._T["mnv2l8o5"], "success");
              $scope.edit = false;
              Notification.deleteByCommonId({
                'common_id': $scope.notif.common_id
              });
            }, function(data) {
              swal($rootScope._T["9a5vpf3c"], $rootScope._T["tylmoe7m"], "error");
              return "Error " + data.status + " : " + data.statusText;
            });
          }
        } else {
          //if ($scope.product[value]) {
          $scope.requests.forEach(function(request) {
            updatedRequest = new Request();
            updatedRequest[value] = $scope.mainRequest[value];
            updatedRequest.$update({
              requestId: request.id
            }, function(data) {
              //Mettre un indicateur d'update
            }, function(data) {
              return "Error " + data.status + " : " + data.statusText;
            });
          });

        }
      };



      $scope.getRequests = function() {
        var deferred = $q.defer();

        if ($scope.usersMastering != null) {
          deferred.resolve();
          return deferred.promise;
        }
        var users = User.query(function(users) {
          var formattedUsers = [];
          users.forEach(function(user) {
            var t = {
              "id": user.id,
              "name": user.firstname + ' ' + user.lastname
            };

            formattedUsers.push(t);
          });
          $scope.usersMastering = formattedUsers;
        });
        var groups = Group.query(function(groups) {
          var formattedGroups = [];
          groups.forEach(function(group) {
            var t = {
              "id": group.id,
              "name": group.name
            };

            formattedGroups.push(t);
          });
          $scope.groupsMastering = formattedGroups;
        });

        var groupsInternal = Group.internal(function(groups) {
          var formattedGroups = [];
          groups.forEach(function(group) {
            var t = {
              "id": group.id,
              "name": group.name
            };

            formattedGroups.push(t);
          });
          $scope.groupsInternalMastering = formattedGroups;
        });

        var clients = Client.query(function(clients) {
          var formattedClients = [];
          clients.forEach(function(client) {
            var t = {
              "id": client.id,
              "name": client.name
            };

            formattedClients.push(t);
          });
          $scope.clientsMastering = formattedClients;
        });



        $q.all([users.$promise, groups.$promise, clients.$promise, groupsInternal.$promise]).then(function() {
          deferred.resolve();
        });
        return deferred.promise;
      };

      function formSwitch(data, product) {
        var options = [];
        if (data.type.view == "ui-select-global" || data.type.view == "ui-select-multiple") {
          switch (data.type.api) {
            case "clients":
              options = $scope.clientsMastering;
              break;
            case "users":
              options = $scope.usersMastering;
              break;
            case "groups":
              options = $scope.groupsMastering;
              break;
            case "groupsInternal":
              options = $scope.groupsInternalMastering;
              break;
            case "options":
              options = data.type.options;
              break;
            default:
              break;
          }
        }
        if (product != null) {
          //var variable = data.name.substring(0, data.name.length - (product.id.length + 1));
          $scope.method[data.name] = product[data.name];
        } else {
          if (data.type.view != "ui-select-multiple") {
            $scope.method[data.name] = $scope.mainRequest[data.name];
          }
        }
        if (options == '' && data.type.options != null) {
          return data.type.options;
        }
        return options;
      }




      var promise = $scope.getRequests();
      promise.then(function() {

        var form;
        dynamicForm.forEach(function(forms) {
          if (forms.id == $scope.notif.id_form) {
            form = forms;
          }
        });

        form.generalForm.forEach(function(data) {

          if (data.name == $scope.notif.field_name) {
            data.type.options = formSwitch(data, $scope.request);
            $scope.field = data;
            return true;
          }
        });

        if ($scope.field == null) {
          if (form.productForm != null) {
            form.productForm.forEach(function(data) {

              var name = $scope.notif.field_name.substring(0, $scope.notif.field_name.length - ($scope.notif.request_id.length + 1));

              if (data.name == name) {
                data.type.options = formSwitch(data, $scope.request);
                $scope.field = data;
                return true;
              }
            });
          }
        }
      });
    } else {
      alert($rootScope._T["t5hjtmmv"]);
      $location.path(getPathRole(role));
    }


  }
]);
