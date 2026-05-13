
Lantern.controller('ShowReceiveElementsCtrl', ['$scope', '$cookies', '$stateParams', '$location', '$filter', 'ngDialog', 'MediaItems',
    function ($scope, $cookies, $stateParams, $location, $filter, ngDialog, MediaItems)
    {
        //console.log($scope.itemsForProductId);

        // $scope.mediaItemsReceived = MediaItems.findbyorigin({origin: 'client', product_id: $scope.itemsForProductId});
        $scope.mediaItemsReceived = MediaItems.findbyproject({ project_id: $scope.mainRequest.product.subproject.project_id })

        $scope.goManage = function () {
            $location.path('/products/' + $scope.itemsForProductId + '/mediaItems');
            ngDialog.close();
        };
    }]);
