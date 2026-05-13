
Lantern.controller('WorkingTimeDialogCtrl', ['$scope', '$cookies', '$stateParams', '$state', '$filter', 'ngDialog', 'Farmer',
    function ($scope, $cookies, $stateParams, $state, $filter, ngDialog, Farmer)
    {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        var today = yyyy + '-' + mm + '-' + dd;

        $scope.validateTime = function () {
            var newFarmer = new Farmer();
            newFarmer.break_time = $scope.farmerEdit.break_time;
            newFarmer.working_time_start = today + " " + $scope.farmerEdit.working_time_start;
            newFarmer.working_time_end = today + " " + $scope.farmerEdit.working_time_end;
            newFarmer.id = $scope.farmerEdit.id;
            newFarmer.$update({id: $scope.farmerEdit.id}, function () {
                ngDialog.close();
            });
        };
    }]); 