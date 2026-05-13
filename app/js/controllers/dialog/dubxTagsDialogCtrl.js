Lantern.controller('DubxTagsDialogCtrl', [
  '$scope',
  function ($scope) {
    $scope.usedTags = $scope.product && $scope.product.dubx_tags ? $scope.product.dubx_tags.usedTags : [];
    $scope.allTags = $scope.product && $scope.product.dubx_tags ? $scope.product.dubx_tags.allTags : [];
    // $scope.product.dubx_tags.allTags.filter((t) => $scope.usedTags.every((t2) => t2.name != t.name))
    $scope.selectedTag = null;
    $scope.selectedReel = null;
    $scope.selectedLang = null;
    $scope.uploadErrorMessage = null;
    $scope.reels = [];
    $scope.dubxLangs = $scope.product && $scope.product.dubx_langs ? $scope.product.dubx_langs : [];
      
    if ($scope.product && $scope.product.reels_count > 0) {
      let i = 1;
      while (i <= $scope.product.reels_count) $scope.reels.push(i++);
    }

    $scope.uploadDubx = function () {
      $scope.uploadErrorMessage = null;
      $scope.dubxUploaderFileItem.formData.push({
        dubxProductId: $scope.product.id,
      });
      $scope.dubxUploaderFileItem.formData.push({
        dubxTag: $scope.selectedTag.name,
      });

      if ($scope.selectedReel)
        $scope.dubxUploaderFileItem.formData.push({
          dubxReel: $scope.selectedReel,
        });

      if ($scope.selectedLang)
        $scope.dubxUploaderFileItem.formData.push({
          dubxLang: $scope.selectedLang,
        });

      $scope.dubxUploader.uploadItem($scope.dubxUploaderFileItem);
    };

    $scope.dubxUploader.onSuccessItem = function (item, response, status, headers) {
      $scope.closeThisDialog();
    };

    $scope.dubxUploader.onErrorItem = function (item, response, status, headers) {
      $scope.uploadErrorMessage = response && response.error && response.error.message ? response.error.message : 'Something failed';
    };
  },
]);
