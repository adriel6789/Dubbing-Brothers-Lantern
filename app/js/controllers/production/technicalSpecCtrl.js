/**
 * Created by Marcel on 06/08/2015.
 * 
 * modal appelé de différentes pages dont le popup de gestion et de création de demande
 */

Lantern.controller('TechnicalSpecCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$location', 
'Valuelist', 'Client', 'TechnicalSpec', 'TechnicalSpecInput', 'TechnicalSpecOutput','ValueListService','ClientService',
    function ($rootScope, $scope, $cookies, $stateParams, $location, 
        Valuelist, Client, TechnicalSpec, TechnicalSpecInput, TechnicalSpecOutput, ValueListService, ClientService)
    {
            $scope.entity = new TechnicalSpec();
            $scope.inputs = [];
            $scope.inputsToDelete = [];
            $scope.outputs = [];
            $scope.outputsToDelete = [];
            $scope.isEdit = false;

            if($scope.isTechnician == true){
              $stateParams.idSpec = $scope.techspec_id;
            }

            if($scope.isProd == true){
              $stateParams.idSpec = $scope.techspec_id;
            }

            if($stateParams.idSpec != null){

                TechnicalSpec.queryBy({id:$stateParams.idSpec}, function(response){
                    $scope.entity = new TechnicalSpec();
                    $scope.entity = response;
                    $scope.client = Client.queryById({clientId:response.client_id});
                    Valuelist.getEtapeActionByWorkflow({workflow_type_id:response.type_workflow}, function(etapes){
                        $scope.etapes_types = etapes;
                    });
                    $scope.action_types = [];
                    $scope.action_types = Valuelist.getActionTypesByEtape({etape_id: response.etape_type_id});
                    $scope.isEdit = true;

                    var filter = [{
                        "name": "techspec_id",
                        "value" : response.id
                    }];

                    TechnicalSpecInput.getSpecInputBy({filters:[filter]}, function(inputs){
                        inputs.forEach(function(input){
                            $scope.inputs.push(input);
                        });
                    });

                    TechnicalSpecOutput.getSpecOutputBy({filters:[filter]}, function(outputs){
                        outputs.forEach(function(output){
                            $scope.outputs.push(output);
                        });
                    });
                });
            }
            else if($stateParams.idClient != null){
                $scope.client = Client.queryById({clientId:$stateParams.idClient});
            }

            $scope.workflow_types = ValueListService.getWorkflowTypes()
            $scope.formatmixs = ValueListService.getFormatMix()
            $scope.normesmix = Valuelist.query({tableName: 'norme_mix'});
            $scope.exploitation_types = ValueListService.getExploitationTypes()
            $scope.languages = Valuelist.query({tableName: 'languages'});
            $scope.speeds = Valuelist.query({tableName: 'speed'});
            $scope.subproject_natures = Valuelist.query({tableName: 'subproject_nature'});
            $scope.doublage_types = ValueListService.getDoublageTypes()

            // Partie servicing
            $scope.servicing_types = Valuelist.query({tableName: 'servicing_types'});
            //Filtre pour récupérer le type diffuseur
            //TODO ne pas mettre en dur la valeur de l'ID
            $scope.diffuseurs  = []
            const gotClients = function () {
              Object.keys($rootScope.broadcasters).forEach(function (id) {
                $scope.diffuseurs.push({ id: id, name: $rootScope.broadcasters[id].name})
              })
            }
            ClientService.getClientsByBroadcaster(gotClients)

            $scope.resolutions = Valuelist.query({tableName: 'resolution_types'});
            $scope.languages_labo = ValueListService.getLanguageLabo()
            $scope.layouts = Valuelist.query({tableName: 'layouts_types'});
            $scope.dynamic_processes = ValueListService.getDynamicProcesses()
            $scope.audio_processes = ValueListService.getAudioProcesses()
            $scope.subtitles = ValueListService.getTypesSubtitle()
            $scope.projector_aspects = ValueListService.getProjectorAspects()
            $scope.dcp_standards = ValueListService.getDCPStandards()
            $scope.nature_subtitle = ValueListService.getNatureSubtitle()
            // Fin servicing

            $scope.showSelectedEtape = function (item) {
                $scope.action_types = item.actions;
            };


            $scope.itemNull = function(element, name) {
              if(element === undefined) {
                $scope.entity[name] = null
              }
            };

            $scope.itemNullInput = function(input, name, id) {
              if(id != null && input === undefined) {
                angular.forEach($scope.inputs, function(input) {
                  if(input.id == id){
                    input[name] = null
                  }
                })
              }
            }

            $scope.addInput = function(){
                var input = new TechnicalSpecInput();
                $scope.inputs.push(input);
            };

            $scope.deleteInput = function(index){
                if($scope.isEdit) {
                    var input = $scope.inputs[index];
                    if (input.id != null) {
                        $scope.inputsToDelete.push(input);
                    }
                }
                $scope.inputs.splice(index, 1);
            };

            $scope.addOutput = function(outputToDuplicate){
                var output = new TechnicalSpecOutput();
                if(outputToDuplicate != null) {
                  output = angular.copy(outputToDuplicate)
                  delete output.id
                  delete output.position
                }
                output.layouts = [];
                $scope.outputs.push(output);
            };

            $scope.deleteOutput = function(output){
                if($scope.isEdit){
                    //var output = $scope.outputs[index];
                    if(output.id != null){
                        $scope.outputsToDelete.push(output);
                    }
                }
                output.hidden = true
            };

            $scope.addLayout = function(index){
                if($scope.outputs[index].layouts.length < 32) {
                    var layout = "";
                    $scope.outputs[index].layouts.push(layout);
                }
            };

            $scope.deleteLayout = function(index){
                $scope.outputs[index].layouts.pop();
            };

            $scope.createSpec = function(){
                $scope.entity.client_id = $scope.client.id;
                $scope.entity.client_spec = 1;
                $scope.entity.$save({},function(spec){
                    $scope.inputs.forEach(function(input){
                        input.techspec_id = spec.id;
                        input.$save();
                    });
                    $scope.outputs.forEach(function(output){
                        if(output.hidden != 1) {
                            output.techspec_id = spec.id;
                            output.$save();
                        }
                    });
                    swal({
                            title: $rootScope._T["70jumwe9"],
                            text: $rootScope._T["vafiq0rk"],
                            type: "success"
                        },
                        function(){
                            window.location.href = "#/technicalSpecEdit/"+spec.id;
                        });
                });
            };

            $scope.editSpec = function(){
                $scope.entity.$update({id:$scope.entity.id},function(spec){
                    $scope.inputs.forEach(function(input, key){
                      input.position = key
                        if(input.id != null){
                            input.$update({id:input.id});
                        }
                        else {
                            input.techspec_id = spec.id;
                            input.$save();
                        }
                    });
                    $scope.inputsToDelete.forEach(function(input){
                        TechnicalSpecInput.delete({id:input.id});
                    });

                    $scope.outputs.forEach(function(output, key){
                      output.position = key
                      if(!output.hidden) {
                          if(output.id != null){
                              output.$update({id:output.id});
                          }
                          else {
                              output.techspec_id = spec.id;
                              output.$save();
                          }
                      }

                    });
                    $scope.outputsToDelete.forEach(function(output){
                        TechnicalSpecOutput.delete({id:output.id});
                    });

                    swal({
                            title: $rootScope._T["70jumwe9"],
                            text: $rootScope._T["j5wqbxmx"],
                            type: "success"
                        },
                        function(){
                            //window.location.href = "#/technicalSpecList/"+$scope.client.id;
                        });
                });
            };

            $scope.deleteSpec = function(){
                swal({
                        title: $rootScope._T["w72rbx7r"],
                        text: $rootScope._T["p3bosstx"],
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: $rootScope._T["mnlbxblr"],
                        closeOnConfirm: false
                    },
                    function(){
                        $scope.inputsToDelete.forEach(function(input){
                            TechnicalSpecInput.delete({id:input.id});
                        });
                        $scope.inputs.forEach(function(input){
                            if(input.id != null){
                                TechnicalSpecInput.delete({id:input.id});
                            }
                        });

                        $scope.outputsToDelete.forEach(function(output){
                            TechnicalSpecOutput.delete({id:output.id});
                        });
                        $scope.outputs.forEach(function(output){
                            if(output.id != null){
                                TechnicalSpecOutput.delete({id:output.id});
                            }
                        });

                        TechnicalSpec.delete({id:$scope.entity.id});

                        swal({
                                title: $rootScope._T["dt8uc6cm"],
                                text: $rootScope._T["xbasodhh"],
                                type: "success"
                            },
                            function(){
                                window.location.href = "#/technicalSpecList/"+$scope.client.id;
                            });
                    });
            };

            $scope.selectWorkflow = function(type_workflow){
                $scope.entity.etape_type_id = "";
                $scope.entity.action_type_id = "";
                $scope.entity.type_workflow = type_workflow;

                Valuelist.getEtapeActionByWorkflow({workflow_type_id:type_workflow}, function(etapes){
                    $scope.etapes_types = etapes;
                });

            };


    }]);
