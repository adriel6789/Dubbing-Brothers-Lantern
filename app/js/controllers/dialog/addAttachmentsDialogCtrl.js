
Lantern.controller('AddAttachmentsDialogCtrl', ['$scope', '$cookies', '$stateParams', '$location', '$filter', 'ngDialog', 'Attachments', 'FileUploader','$window',
    function ($scope, $cookies, $stateParams, $location, $filter, ngDialog, Attachments, FileUploader, $window)
    {
      $scope.onLoad = true;
      $scope.productAttachments = Attachments.byProductId({product_id : $scope.currentProduct.id},function(attachments){
        angular.forEach(attachments, function(attachment) {
          attachment.isSelected = false;
        });
        $scope.onLoad = false;
      });

      $scope.selectAll = function(selectAllAttachment) {
        $scope.productAttachments.forEach(function(item){
          item.isSelected = selectAllAttachment;
        });
      };

      $scope.download = function(item) {
          $window.open(URL_API + "/attachments/download/" + item.formData[0].id +"?filesize="+ item.file.size+"&token="+$.cookie('token'), '_blank');
      };

      $scope.addSelectedAttachments = function() {
        $scope.productAttachments.forEach(function(item) {
          if(item.isSelected){
          var file = new FileUploader.FileItem($scope.uploader[$scope.currentProduct.id], {
            lastModifiedDate: new Date(),
            name: item.original_name,
            size: item.filesize
          });

          file.formData.push({
            //request_id: item.request_id,
            id: item.id,
            path: URL_API + item.path
          });
          file.progress = 0;
          file.isUploaded = false;
          file.isSuccess = false;

          $scope.uploader[$scope.currentProduct.id].queue.push(file);

          ngDialog.closeAll();
        }
        else {
          ngDialog.closeAll();
        }
      });

    };
  }]);
