Lantern.controller('ProductMediaItemsProdCtrl', ['$scope', '$cookies', '$filter', '$stateParams', 'ngDialog',
 'Request', 'Product', 'MediaItems', '$location', 'ValueListService', 'Valuelist', 'ApiRest', '$rootScope',
  function($scope, $cookies, $filter, $stateParams, ngDialog, 
    Request, Product, MediaItems, $location, ValueListService, Valuelist, ApiRest, $rootScope) {
    $scope.mediaItems = [];
    MediaItems.findbyproduct({
      product_id: $stateParams.id
    }, function(items) {
      items.forEach(function(item) {
        if (item.layout != null && item.layout != "") {
          item.layout = item.layout.split("+");
        }
        item.reference = item.reference == 1;
        if (item.media_seal_security_version == null) {
          item.media_seal_security_version = '';
        }
        $scope.mediaItems.push(item);
      });
    });

    $scope.product = Product.get({
      productId: $stateParams.id
    });

    $scope.media_seal_security_versions = null;
    Valuelist.query({
      tableName: 'media_seal_security_version'
    }, function(response) {
      var t = [{
        id: -1,
        name: null,
        value: ''
      }];
      i = 1;
      response.forEach(function(elem) {
        t[i] = {
          id: elem.id,
          name: elem.name,
          value: elem.value
        };
        i++;
      });
      $scope.media_seal_security_versions = t;
    });

    $scope.supports = ValueListService.getDigiMediaSupports();

    $scope.workflow_types = [{
      id: 1,
      value: "Dubbing"
    }, {
      id: 2,
      value: "Mastering"
    }, {
      id: 3,
      value: "Servicing"
    }];

    $scope.speeds = ValueListService.getSpeeds()

    $scope.layouts = ValueListService.getLayouts()

    $scope.origins = [{
      name: "Interne"
    }, {
      name: "Client"
    }];

    $scope.newItem = new MediaItems();

    $scope.createItem = function(item) {
      item.product_id = $stateParams.id;
      if (item.nature == "Audio" && item.layout != undefined) {
        item.layout = item.layout.join("+");
      }
      item.$save({}, function() {
        if (item.layout != null && item.layout != "") {
          item.layout = item.layout.split("+");
        }
        item.reference = item.reference == 1;
        $scope.mediaItems.unshift(item);
        $scope.newItem = new MediaItems();
      });
    };

    $scope.removeItem = function(item) {
      MediaItems.delete({
        itemId: item.id
      }, function() {
        $scope.mediaItems = MediaItems.findbyproduct({
          product_id: $stateParams.id
        }, function(items) {
          items.forEach(function(item) {
            if (item.layout != null && item.layout != "") {
              item.layout = item.layout.split("+");
            }
            item.reference = item.reference == 1;
          });
        });
      });
    };

    $scope.editMediaItemReference = function(item) {
      var upItem = new MediaItems();
      upItem.reference = item.reference;
      upItem.$update({
        itemId: item.id
      });
    };

    $scope.editMediaItem = function(item, support) {
      if (support) {
        var selected = $filter('filter')($scope.supports, {
          support: item.support
        });
        item.nature = ($scope.supports && selected.length) ? selected[0].nature : 'Error';
      }
      if (item.nature == "Audio" && item.layout != null && item.layout != "") {
        item.layout = item.layout.join("+");
      }
      var upItem = new MediaItems();
      upItem = item;
      delete upItem.product;
      upItem.$update({
        itemId: item.id
      }, function(itemResp) {
        if (itemResp.layout != null && item.layout != "") {
          itemResp.layout = itemResp.layout.split("+");
        }
        item = itemResp
      });
    };

    $scope.editMediaItemPath = function(item) {
      var upItem = new MediaItems();
      upItem.path = item.path;
      upItem.$update({
        itemId: item.id
      });
    };

    $scope.editMediaItemCodeSecurite = function(item) {
      ApiRest.put('/mediaitems/mediasealsecuritycode', {}, {
        id: item.id,
        codeSecurite: item.media_seal_security_code
      }, function(itemResp) {
        if (itemResp.layout != null && item.layout != "") {
          itemResp.layout = itemResp.layout.split("+");
        }
        item = itemResp
      });
    
    }

    $scope.selectSupportNewElement = function(item, model) {
      $scope.newItem.nature = item.nature;
    };

    if($stateParams.search != null) {
      $scope.textSearchFilter = $stateParams.search;
    }

    $scope.showBtnLayout = [];
    $scope.changeLayout = function(itemId) {
      $scope.showBtnLayout[itemId] = true;
    }

    $scope.editLayout = function(item) {
      var upItem = new MediaItems();
      upItem = item;
      delete upItem.product;
      item.layout = item.layout.join("+");
      upItem.$update({
        itemId: item.id
      }, function(itemResp) {
        $scope.showBtnLayout[item.id] = false;
        if (itemResp.layout != null && item.layout != "") {
          itemResp.layout = itemResp.layout.split("+");
        }
        item = itemResp
      });
    }


  }
]);
