Lantern.controller('CreateClientDialogCtrl', ['$rootScope', '$scope', '$rootScope', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Client', 'FileUploader',
  function($rootScope, $scope, $rootScope, $cookies, $stateParams, $filter, ngDialog, Client, FileUploader) {
    $scope.inProgress = false;

    $scope.uploader = new FileUploader();
    $scope.uploadFile = function(event) {
      var filename = event.target.files[0];
      var fileReader = new FileReader();
      fileReader.onload = function() { 
        $("#image-file-data").val(fileReader.result).change();
        $scope.oldClient.url = fileReader.result;
      };
      fileReader.readAsDataURL(filename);
    };

    $scope.typeClient = [{
      id: 1,
      value: $rootScope._T["m9dhu6hl"]
    }, {
      id: 2,
      value: $rootScope._T["irlv7lue"]
    }]

    $scope.saveClient = function() {
      $scope.inProgress = true;

      var client = new Client();
      client.name = $scope.newClient.name;
      client.url = $scope.newClient.url;
      client.type_id = $scope.newClient.type_id;

      if ($scope.newClient.id != null) {
        // Update values in clients list view
        $scope.oldClient.name = $scope.newClient.name;
        $scope.oldClient.url = $scope.newClient.url;
        $scope.oldClient.type_id = $scope.newClient.type_id;

        client.$update({
          clientId: $scope.newClient.id
        }, function() {
          $scope.inProgress = false;          
          ngDialog.closeAll();
        })
      } else {
        // Create client
        client.$save(function() {
          $scope.clients = $scope.clients.unshift(client);
          $scope.inProgress = false;
          ngDialog.closeAll();
        })
      }
    };
  }
]);
