Lantern.controller('AddReturnsToRequestDialogCtrl', ['$scope', '$timeout', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location', 'Project', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Attachments', 'Session', '$window', 'Request', 'RequestService', 'NotificationService',
  function($scope, $timeout, $rootScope, $anchorScroll, $http, $q, $state, $location, Project, $cookies, $stateParams, $filter, ngDialog, ApiRest, Session, $window, Request, RequestService, NotificationService) {

    let loading = true;
    let disableButtons = false;
    let allRequests;

    const isLoading = () => loading;
    const getRequests = () => allRequests;
    const isDisableButtons = () => disableButtons;

    let filters = [{
      "name": "is_done",
      "value": "0"
    }, {
      "name": "workflow_id",
      "value": $scope.workflow.id
    }, {
      "name": "product_id",
      "value": $scope.product.id
    }];

    Request.getRequestsBy({
      filters: [filters]
    }, function(requests) {
      allRequests = requests;
      loading = false;
    });

    const addReturnsToSelectedRequest = request => {
      disableButtons = true;
      RequestService.updateRequestDefer(request.id, {'returnsIds': $scope.allReturnsId}).then(function (updatedRequest) {
        let nbRet = $scope.allReturnsId.split(",").length;
        let notifDesc;
        if (nbRet > 1) {
          notifDesc = nbRet + $rootScope._T['fwib6ju4']
        } else {
          notifDesc = $rootScope._T['q3t1xqa4']
        }
        sendStandardNotif(
          new NotificationService(),
          [request],
          "planning,technicien",
          $rootScope._T['6rfsyio2'],
          notifDesc,
          $filter,
          "addReturns",
          $rootScope
        );
        swal({
          title: $rootScope._T["x96o7eux"],
          text: $rootScope._T["9zla4um0"],
          type: "success"
        }, function() {
          $scope.closeThisDialog();
        });
      }, function (error) {
        swal({
          title: $rootScope._T["t9coa94k"],
          text: $rootScope._T["wb48phm5"],
          type: "error"
        }, function() {
          $scope.closeThisDialog();
        });
        console.error(error);
      });
    }

    $scope.isLoading = () => isLoading();
    $scope.getRequests = () => getRequests();
    $scope.isDisableButtons = () => isDisableButtons();
    $scope.addReturnsToSelectedRequest = request => addReturnsToSelectedRequest(request);

  }
]);
