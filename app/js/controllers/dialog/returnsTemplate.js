Lantern.controller('ReturnsTemplateCtrl', ['$scope', '$timeout', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location', 'Project', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Product', 'Valuelist', 'Subproject', 'Record', 'Request', 'Workflow', 'Return', 'MediaItems', 'RequestGroup', 'Attachments', 'Client', 'User', 'Group', 'FileUploader', 'Favorite', 'StepsList', 'Notification', 'ContextualInfo', 'Comment', 'ApiRest', 'Session',
  function($scope, $timeout, $rootScope, $anchorScroll, $http, $q, $state, $location, Project, $cookies, $stateParams, $filter, ngDialog, Product, Valuelist, Subproject, Record, Request, Workflow, Return, MediaItems, RequestGroup, Attachments, Client, User, Group, FileUploader, Favorite, StepsList, Notification, ContextualInfo, Comment, ApiRest, Session) {
    var rest = {};

    $scope.getReturns = function(product) {
      var productReturns = [];

      var filters = [{
        "name": "product_id",
        "value": product.id
      }];
      productReturns = Return.getReturnsBy({
        filters: [filters]
      });

      return productReturns;
    }

    rest.init = function() {
      $scope.product.returns = $scope.getReturns($scope.product);
    }();

  }
]);
