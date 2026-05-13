Lantern.controller('AttachmentsDialogCtrl', ['$scope', '$timeout', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location', 'Project', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Attachments', 'ApiRest', 'Session', '$window',
  function($scope, $timeout, $rootScope, $anchorScroll, $http, $q, $state, $location, Project, $cookies, $stateParams, $filter, ngDialog, Attachments, ApiRest, Session, $window) {
    var rest = {};

    rest.init = function() {

    }();

    $scope.download = function(attachment) {
      $window.open(URL_API + "/attachments/download/" + attachment.id + "?filesize=" + attachment.filesize + "&token=" + $.cookie('token'), '_blank');
    };

  }
]);
