/**
 * Created by Marcel on 06/08/2015.
 */

Lantern.controller('StepDetailCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$location', 'Valuelist', 'Client', 'StepsList', 'Step',
    function ($rootScope, $scope, $cookies, $stateParams, $location, Valuelist, Client, StepsList, Step)
    {
        var role = $.cookie('role');
        if ($rootScope.canDisplay(15))
        {
            $scope.entity = new StepsList();
            $scope.steps = [];
            $scope.stepsToDelete = [];
            $scope.action_types = [];
            $scope.isEdit = false;

            $scope.position = 0;

            if($stateParams.idStep != null){

                StepsList.get({id:$stateParams.idStep}, function(response){
                    $scope.entity = response;
                    $scope.client = Client.queryById({clientId:response.client_id});


                    Valuelist.getEtapeActionByWorkflow({workflow_type_id:response.type_workflow}, function(etapes){
                        $scope.etapes_types = etapes;
                    });
                    $scope.action_types = [];
                    $scope.isEdit = true;

                    var filter = [{
                        "name": "stepslist_id",
                        "value" : response.id
                    }];

                    Step.getStepsBy({filters:[filter]}, function(steps){
                        var i = 0;
                        steps.forEach(function(step){
                            $scope.action_types[i] = Valuelist.getActionTypesByEtape({etape_id: step.etape_type_id});

                            $scope.steps.push(step);
                            i++;
                        });
                    });
                    $scope.position = $scope.steps.length;
                });
            }
            else if($stateParams.idClient != null){
                $scope.client = Client.queryById({clientId:$stateParams.idClient});
            }

            $scope.workflow_types = Valuelist.query({tableName: 'workflow_types'});

            $scope.showSelectedEtape = function (item, index) {
                $scope.action_types[index] = item.actions;
            };

            $scope.addStep = function(){
                var step = new Step();
                $scope.position++;
                step.position = $scope.position;
                $scope.steps.push(step);
            };

            $scope.deleteStep = function(index){
                if($scope.isEdit){
                    var step = $scope.steps[index];
                    if(step.id != null){
                        $scope.stepsToDelete.push(step);
                    }
                }
                $scope.steps.splice(index, 1);
            };

            $scope.createStepList = function(){
                $scope.entity.client_id = $scope.client.id;

                $scope.entity.$save({},function(stepList){
                    $scope.steps.forEach(function(step){
                        step.stepslist_id = stepList.id;
                        step.$save();
                    });
                    swal({
                            title: $rootScope._T["70jumwe9"],
                            text: $rootScope._T["gp4nqhxw"],
                            type: "success"
                        },
                        function(){
                            window.location.href = "#/stepDetailEdit/"+stepList.id;
                        });
                });
            };

            $scope.editStepList = function(){
                delete $scope.entity.ownStep;
                $scope.entity.$update({id:$scope.entity.id},function(stepList){

                    $scope.stepsToDelete.forEach(function(step){
                        Step.delete({id:step.id});
                    });
                    $scope.steps.forEach(function(step){
                        if(step.id != null){
                            step.$update({id:step.id});
                        }
                        else {
                            step.stepslist_id = stepList.id;
                            step.$save();
                        }
                    });
                    swal({
                            title: $rootScope._T["70jumwe9"],
                            text: $rootScope._T["rrf5gppc"],
                            type: "success"
                        },
                        function(){
                            //window.location.href = "#/technicalSpecList/"+$scope.client.id;
                        });
                });
            };

            $scope.deleteStepList = function(){
                swal({
                        title: $rootScope._T["8jirwer6"],
                        text: $rootScope._T["57lusljt"],
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: $rootScope._T["mnlbxblr"],
                        closeOnConfirm: false
                    },
                    function(){
                        $scope.stepsToDelete.forEach(function(step){
                            Step.delete({id:step.id});
                        });
                        $scope.steps.forEach(function(step){
                            if(step.id != null){
                                Step.delete({id:step.id});
                            }
                        });

                        StepsList.delete({id:$scope.entity.id});

                        swal({
                                title: $rootScope._T["dt8uc6cm"],
                                text: $rootScope._T["gv7dx6qb"],
                                type: "success"
                            },
                            function(){
                                window.location.href = "#/stepList/"+$scope.client.id;
                            });
                    });
            };

            $scope.selectWorkflow = function(type_workflow){
                $scope.entity.type_workflow = type_workflow;
                Valuelist.getEtapeActionByWorkflow({workflow_type_id:type_workflow}, function(etapes){
                    $scope.etapes_types = etapes;
                });

            };

        }
        else
        {
          alert($rootScope._T["t5hjtmmv"]);
          $location.path( getPathRole(role) );
        }
    }]);
