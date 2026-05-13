
Lantern.controller('StepsListDialogCtrl', ['$scope', '$cookies', '$stateParams', '$filter', 'ngDialog', 'StepsList', 'Step',
    function ($scope, $cookies, $stateParams, $filter, ngDialog, StepsList, Step)
    {
        $scope.deleteStep = function(step) {
            Step.delete({id: step.id}, function() {
                $scope.currentStepsList = StepsList.get({id: $scope.currentStepsList.id}, function(list) {
                    if (list.ownStep.length == 0) {
                        StepsList.delete({id: list.id});
                        $scope.workflowToEdit.ownStepslist = [];
                    }
                });
            });
        }

        $scope.deleteList = function(list_id) {
            StepsList.delete({id: list_id});
            $scope.currentStepsList.ownStep = [];
            $scope.workflowToEdit.ownStepslist = [];
        }
    }]);
