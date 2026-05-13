/**
 * Created by Marcel on 23/03/2015.
 */

Lantern.controller('ListClientsCtrl', ['$scope', 'ngDialog', 'ClientService', 'Notification', '$rootScope',
  function($scope, ngDialog, ClientService, Notification, $rootScope) {
    // private methods
    // html: views/production/listClients.html
    const rest = {}
    $scope.clients = []
    rest.getClients = function() {
      ClientService.getClients({ direct: true }, function(response) {
        response.forEach((client) => {
          if (client.type_id) {
            $scope.clients.push(client)
          }
        })
        $scope.imagesFromBase = $rootScope.imagesFromBase
      }, function(error) {
        Notification.error(ResponseToastService.error);
      })
    }

    rest.init = function() {
      rest.getClients()
    }()

    // public methods
    $scope.createOrEditClient = function(client) {
      $scope.oldClient = client;
      $scope.newClient = null;

      if (client)
      {
        $scope.newClient = angular.copy(client);
        $scope.newClient.type_id = parseInt(client.type_id);
      }

      const dialog = ngDialog.open({
        template: 'views/Dialog/createClientDialog.html',
        scope: $scope,
        controller: 'CreateClientDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        rest.getClients()
      })
    }
  }
])