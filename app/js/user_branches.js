Lantern.controller('UserBranchesCtrl', [
  '$scope',
  'Session',
  '$state',
  '$rootScope',
  function ($scope, Session, $state, $rootScope) {
    let branches = Session.userBranches()

    $scope.userBranches = branches ? Session.userBranches() : []
    $scope.userBranch = {'id' : Session.branchId()};

    $scope.setUserBranch = function () {
      Session.setBranch($scope.userBranch.id)
      window.location.reload();
    }

    $scope.showBranchList = $scope.userBranches.length > 1
  }
])
