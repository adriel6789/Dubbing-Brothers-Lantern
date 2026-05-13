
Lantern.controller('EditWorkflowDialogCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$filter', 'ngDialog', 
'Valuelist', 'Workflow', 'Request', 'TechnicalSpec', 'StepsList', 'Step', 'Client',  'ValueListService','ClientService', 'Session',
    function ($rootScope, $scope, $cookies, $stateParams, $filter, ngDialog, 
        Valuelist, Workflow, Request, TechnicalSpec, StepsList, Step, Client, ValueListService, ClientService, Session) {
        if ($rootScope.canDisplay(7)) {
            $scope.subproject_workflow = $scope.subproject;
            $scope.workflowToEdit.ownStepslist = objectInArray($scope.workflowToEdit.ownStepslist)
            var workflowCopy = angular.copy($scope.workflowToEdit);

            $scope.original_products = [];
            $scope.branch_id = Session.branchId()

            $scope.workflowProducts.forEach(function (workflow_product) {
                $scope.subproject_workflow.ownProduct.forEach(function (product) {
                    var found = false;

                    if (product.id == workflow_product.id && !found) {
                        found = true;
                        product.selected = true;
                        $scope.original_products.push(product);
                    }
                });
            });

            function enableServicingType() {
                if ($scope.workflowToEdit.workflow_type.name == 'servicing') {
                    if ($scope.workflowToEdit.servicing_type.id != null) {
                        var searchServicing = $filter('filter')($scope.servicing_types, {id: $scope.workflowToEdit.servicing_type.id}, true);
                        if (searchServicing != null && searchServicing.length == 1) {
                            $scope.workflowToEdit.servicing_type = searchServicing[0];
                        }
                    }
                }
            }

            $scope.selectServicingType = function (item) {
                $scope.workflowToEdit.servicing_type = item;
            };

            //Fix pour le support du booleen sur le DolbyE
            if ($scope.workflowToEdit.dolbye != null && $scope.workflowToEdit.dolbye == 1) {
                $scope.workflowToEdit.dolbye = true;
            }


            $scope.workflow_types = ValueListService.getWorkflowTypes()
            $scope.formatmixs = ValueListService.getFormatMix()
            $scope.normesmix = Valuelist.query({tableName: 'norme_mix'});
            $scope.exploitation_types = ValueListService.getExploitationTypes()
            $scope.speeds = Valuelist.query({tableName: 'speed'});
            $scope.languages = Valuelist.query({tableName: 'languages'});
            $scope.doublage_types = ValueListService.getDoublageTypes()

            /* Partie Servicing */
            $scope.servicing_types = Valuelist.query({tableName: 'servicing_types'});
            //Filtre pour récupérer le type diffuseur

            $scope.diffuseurs  = []

            const gotClients = function () {
              Object.keys($rootScope.broadcasters).forEach(function (id) {
                $scope.diffuseurs.push({ id: id, name: $rootScope.broadcasters[id].name})
              })
              enableServicingType()
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
            $scope.dub_places = []
            ValueListService.getDubPlaces(
                ValueListService.manageDubPlacesReceived(function (dubplaces) {
                const dubPlacesList = []
                  Object.keys(dubplaces).forEach(function (name) {
                    dubPlacesList.push({
                      value: dubplaces[name].value,
                      name: dubplaces[name].name,
                      loc_value: dubplaces[name].loc_value
                    })
                  })
                  $scope.dub_places = dubPlacesList
                  $scope.dubPlacesByLocValue = $rootScope.dubPlacesByLocValue
                  $scope.mainLocationList =  $rootScope.mainLocationList
                  if ($scope.branch_id == 2) {
                    $scope.workflowToEdit.main_location = { key: $scope.workflowToEdit.main_location_id, value: $scope.mainLocationList[$scope.workflowToEdit.main_location_id] }
                  }
                 

                }), 
            {})
          
          

            var filtersStepsLists = [
                {
                    "name": "client_id",
                    "value": $scope.subproject.project.client.id
                }
            ];
            StepsList.getStepsListBy({filters: [filtersStepsLists]},function(responses){
              $scope.stepsLists = [];
              angular.forEach(responses, function(step){
                if(step.title == null){
                  step.title = "No Title";
                }
                $scope.stepsLists.push(step);
              });
            });


            $scope.selectAll = function () {
                $scope.subproject_workflow.ownProduct.forEach(function (product) {
                    product.selected = !$scope.masterCheckbox;
                });
            };


            $scope.updateWorkflow = function () {
                var productsSelected = $filter('filter')($scope.subproject_workflow.ownProduct, {selected: true});

                var allProducts = [];
                if (productsSelected.length != 0) {
                    productsSelected.forEach(function (product) {
                        allProducts.push(product.id);
                    });
                }

                const updateWorkflow = new Workflow();
                updateWorkflow.exploitation_id = $scope.workflowToEdit.exploitation_id;
                updateWorkflow.format_mix_id = $scope.workflowToEdit.format_mix_id;
                updateWorkflow.norme_mix_id = $scope.workflowToEdit.norme_mix_id;
                updateWorkflow.doublage_type_id = $scope.workflowToEdit.doublage_type_id;
                updateWorkflow.language_id = $scope.workflowToEdit.language_id;
                updateWorkflow.prod_version = $scope.workflowToEdit.prod_version;
                updateWorkflow.speed_id = $scope.workflowToEdit.speed_id;
                updateWorkflow.servicing_type_id = $scope.workflowToEdit.servicing_type_id;
                updateWorkflow.diffuseur_id = $scope.workflowToEdit.diffuseur_id;
                updateWorkflow.resolution_id = $scope.workflowToEdit.resolution_id;
                updateWorkflow.language_labo = $scope.workflowToEdit.language_labo;
                updateWorkflow.layout_id = $scope.workflowToEdit.layout_id;
                updateWorkflow.dolbye = $scope.workflowToEdit.dolbye;
                updateWorkflow.dynamic_process = $scope.workflowToEdit.dynamic_process;
                updateWorkflow.type_audio_process = $scope.workflowToEdit.type_audio_process;
                updateWorkflow.subtitle = $scope.workflowToEdit.subtitle;
                updateWorkflow.projector_aspect = $scope.workflowToEdit.projector_aspect;
                updateWorkflow.dcp_standard = $scope.workflowToEdit.dcp_standard;
                updateWorkflow.nature_subtitle = $scope.workflowToEdit.nature_subtitle;
                // updateWorkflow.dub_place = $scope.workflowToEdit.dub_place;
                updateWorkflow.dub_place = $scope.workflowToEdit.dub_place.value;
                updateWorkflow.dub_place_value = $scope.workflowToEdit.dub_place.loc_value;
                if ($scope.workflowToEdit.main_location) {
                    updateWorkflow.main_location_id = $scope.workflowToEdit.main_location.key
                }
                updateWorkflow.products_ids = allProducts.join(",");


                let error = "";
                if (updateWorkflow.exploitation_id != workflowCopy.exploitation_id) {
                    error += $rootScope._T["hbtvjrk1"] + " - ";
                }
                if (updateWorkflow.format_mix_id != workflowCopy.format_mix_id) {
                    error += $rootScope._T["vob2snrb"] + " - ";
                }
                if (updateWorkflow.norme_mix_id != workflowCopy.norme_mix_id) {
                    error += $rootScope._T["w4ftlimj"] + " - ";
                }
                if (updateWorkflow.doublage_type_id != workflowCopy.doublage_type_id) {
                    error += $rootScope._T["ny77u59l"] + " - ";
                }
                if (updateWorkflow.language_id != workflowCopy.language_id) {
                    error += $rootScope._T["awbb7v9i"] + " - ";
                }
                if (updateWorkflow.speed_id != workflowCopy.speed_id) {
                    error += $rootScope._T["noa1wtgc"] + " - ";
                }
                if (updateWorkflow.prod_version != workflowCopy.prod_version) {
                    error += $rootScope["zb2ecoll"] + " - ";
                }
                if (updateWorkflow.servicing_type_id != workflowCopy.servicing_type_id) {
                    error += $rootScope._T["fa1lnlij"] + " - ";
                }
                if (updateWorkflow.diffuseur_id != workflowCopy.diffuseur_id) {
                    error += $rootScope._T["irlv7lue"] + " - ";
                }
                if (updateWorkflow.resolution_id != workflowCopy.resolution_id) {
                    error += $rootScope._T["wrctg8ou"] + " - ";
                }
                if (updateWorkflow.language_labo != workflowCopy.language_labo) {
                    error += $rootScope._T["awbb7v9i"] + " - ";
                }
                if (updateWorkflow.layout_id != workflowCopy.layout_id) {
                    error += "Layout - ";
                }
                if (updateWorkflow.dolbye != workflowCopy.dolbye) {
                    error += "DolbyE - ";
                }
                if (updateWorkflow.dynamic_process != workflowCopy.dynamic_process) {
                    error += $rootScope._T["0c1vz2jl"] + " - ";
                }
                if (updateWorkflow.type_audio_process != workflowCopy.type_audio_process) {
                    error += $rootScope._T["yg1lcn96"] + " - ";
                }
                if (updateWorkflow.subtitle != workflowCopy.subtitle) {
                    error += $rootScope._T["7xhlusz8"] + " - ";
                }
                if (updateWorkflow.projector_aspect != workflowCopy.projector_aspect) {
                    error += $rootScope._T["gknlq48m"] + " - ";
                }
                if (updateWorkflow.dcp_standard != workflowCopy.dcp_standard) {
                    error += $rootScope["ov1sc0ni"] + " - ";
                }
                if (updateWorkflow.nature_subtitle != workflowCopy.nature_subtitle) {
                    error += $rootScope._T["luewrctg"] + " - ";
                }
                /*
                if (updateWorkflow.dub_place != workflowCopy.dub_place) {
                    error += $rootScope._T["nytpo4zw"] + " - ";
                }
                */
                if (error != "") {
                    error = error.substring(0, error.length - 3);
                    swal({
                        title: $rootScope._T["g2lm6cmr"],
                        text: $rootScope._T["pgp0w7dp"] + error + $rootScope._T["s5pjgj1f"],
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: $rootScope._T["9mwt5lz1"],
                        closeOnConfirm: false
                    },
                    function () {
                        updateWorkflow.$update({"workflowId": $scope.workflowToEdit.id}, function () {
                            if ($scope.workflowToEdit.ownStepslist[0] != null) {
                                $scope.deleteList($scope.workflowToEdit.ownStepslist[0].id);
                            }
                            $scope.associateActionList($scope.workflowToEdit, $scope.subproject, false);
                            swal({
                                title: $rootScope._T["70jumwe9"],
                                text: $rootScope._T["xyfqr9z7"],
                                type: "success",
                                confirmButtonText: $rootScope._T["settpdr0"]
                            });
                            ngDialog.closeAll();
                        });
                    });
                } else {
                    updateWorkflow.$update({"workflowId": $scope.workflowToEdit.id}, function () {
                        swal({
                            title: $rootScope._T["70jumwe9"],
                            text: $rootScope._T["xyfqr9z7"],
                            type: "success",
                            confirmButtonText: $rootScope._T["settpdr0"]
                        });
                        ngDialog.closeAll();
                    });
                }
            };
            $scope.isCheckingExistRequest = false;  
            $scope.updateProductWorkflow = function (product) {
                $scope.isCheckingExistRequest = true; // lock the buttons update workflow or delete workflow until the action of checking an existing requestis done
                if (product.selected == false) {
                    var filters = [
                        {
                            "name": "product_id",
                            "value": product.id
                        },
                        {
                            "name": "workflow_id",
                            "value": $scope.workflowToEdit.id
                        }
                    ];

                    Request.getRequestsBy({filters: [filters]}, function (requests) {
                        if (requests.length != 0) {
                            swal({
                                title: $rootScope._T["je3ce42j"],
                                text: $rootScope._T["lh0ycosz"],
                                type: "error",
                                confirmButtonText: $rootScope._T["n682c0uh"],
                                closeOnConfirm: true
                            });
                            product.selected = true;
                        }
                        $scope.isCheckingExistRequest = false;

                    });
                }else{
                    $scope.isCheckingExistRequest = false; // si produit est selectionné on en reactive le bouton
                }
            };

            $scope.createActionList = function (workflow, subproject) {

                //Recherche des normes qui matchent
                var filtersSpec = [
                    {
                        "name": "client_id",
                        "value": subproject.project.client_id
                    },
                    {
                        "name": "client_spec",
                        "value": 1
                    }
                ];

                var validSpecs = [];

                TechnicalSpec.queryByFilters({filters: [filtersSpec]}, function (specs) {
                    angular.forEach(specs, function (spec) {
                        var insertNorme = true;
                        if (spec.exploitation_id != null) {
                            if (spec.exploitation_id != workflow.exploitation_id) {
                                insertNorme = false;
                            }
                        }

                        if (spec.language_id != null) {
                            if (spec.language_id != workflow.language_id) {
                                insertNorme = false;
                            }
                        }

                        if (spec.doublage_type_id != null) {
                            if (spec.doublage_type_id != workflow.doublage_type_id) {
                                insertNorme = false;
                            }
                        }

                        if (spec.spec_mix_id != null) {
                            if (spec.spec_mix_id != workflow.spec_mix_id) {
                                insertNorme = false;
                            }
                        }

                        if (spec.format_mix_id != null) {
                            if (spec.format_mix_id != workflow.format_mix_id) {
                                insertNorme = false;
                            }
                        }

                        if (spec.speed_id != null) {
                            if (spec.speed_id != workflow.speed_id) {
                                insertNorme = false;
                            }
                        }

                        if (spec.version != null) {
                            if (spec.version != workflow.version) {
                                insertNorme = false;
                            }
                        }

                        if (insertNorme) {
                            validSpecs.push(spec);
                        }
                    });

                    //Creation d'une nouvelle liste
                    var listEtapes = new StepsList();
                    listEtapes.workflow_id = workflow.id;

                    listEtapes.$save({}, function (list) {
                        angular.forEach(validSpecs, function (spec) {
                            //Duplication des normes
                            TechnicalSpec.copy({param2: spec.id}, function (newSpec) {
                                //Association des normes et sauvegarde de l'étape
                                var step = new Step();
                                step.stepslist_id = list.id;
                                step.etape_type_id = newSpec.etape_type_id;
                                step.action_type_id = newSpec.action_type_id;
                                step.techspec_id = newSpec.id;
                                step.$save({});
                            });

                        });

                        $scope.workflowToEdit.ownStepslist.push(listEtapes);
                    });



                });



            };

            $scope.generationList = false;

            $scope.deleteList = function(list_id) {
                StepsList.delete({id: list_id});
                $scope.workflowToEdit.ownStepslist = [];
            }

            $scope.associateActionList = function (workflow, subproject, useModel) {
                $scope.generationList = true;

                //Recherche des normes qui matchent
                var filtersSpec = [
                    {
                        "name": "client_id",
                        "value": subproject.project.client_id
                    },
                    {
                        "name": "client_spec",
                        "value": 1
                    }
                ];

                var validSpecs = [];
                $rootScope.showLoading++;
                TechnicalSpec.queryByFilters({filters: [filtersSpec]}, function (specs) {
                    $rootScope.showLoading--;
                    angular.forEach(specs, function (spec) {
                        //On vérifie que l'étape / action est bien dans la liste prévue
                        var actionInList = false;
                        if (useModel) {
                            angular.forEach($scope.workflowToEdit.stepslist.ownStep, function (step) {
                                countSteps++;
                                if (spec.etape_type_id == step.etape_type_id) {
                                    actionInList = true;
                                }
                            });
                        } else {
                            actionInList = true;
                        }

                        if (actionInList) {
                            var insertNorme = true; //TEMP
                            if (spec.exploitation_id != null) {
                                if (spec.exploitation_id != workflow.exploitation_id) {
                                    insertNorme = false;
                                }
                            }

                            if (spec.language_id != null) {
                                if (spec.language_id != workflow.language_id) {
                                    insertNorme = false;
                                }
                            }

                            if (spec.doublage_type_id != null) {
                                if (spec.doublage_type_id != workflow.doublage_type_id) {
                                    insertNorme = false;
                                }
                            }

                            if (spec.spec_mix_id != null) {
                                if (spec.spec_mix_id != workflow.spec_mix_id) {
                                    insertNorme = false;
                                }
                            }

                            if (spec.format_mix_id != null) {
                                if (spec.format_mix_id != workflow.format_mix_id) {
                                    insertNorme = false;
                                }
                            }

                            if (spec.speed_id != null) {
                                if (spec.speed_id != workflow.speed_id) {
                                    insertNorme = false;
                                }
                            }

                            if (spec.version != null) {
                                if (spec.version != workflow.version) {
                                    insertNorme = false;
                                }
                            }

                            if (spec.subproject_nature_id != null) {
                                if (spec.subproject_nature_id != subproject.nature.id) {
                                    insertNorme = false;
                                }
                            }

                            if (insertNorme) {
                                validSpecs.push(spec);
                            }
                        }
                    });

                    //Creation d'une nouvelle liste
                    if (validSpecs.length != 0) {
                        var listEtapes = new StepsList();
                        listEtapes.workflow_id = workflow.id;

                        var count = 0;
                        $rootScope.showLoading++;
                        listEtapes.$save({}, function (list) {
                            $rootScope.showLoading--;
                            angular.forEach(validSpecs, function (spec) {
                                //Duplication des normes
                                TechnicalSpec.copy({param2: spec.id}, function (newSpec) {
                                    //Association des normes et sauvegarde de l'étape
                                    var step = new Step();
                                    step.stepslist_id = list.id;
                                    step.etape_type_id = newSpec.etape_type_id;
                                    step.action_type_id = newSpec.action_type_id;
                                    step.techspec_id = newSpec.id;
                                    $rootScope.showLoading++;
                                    step.$save({}, function () {
                                        $rootScope.showLoading--;
                                        count++;
                                        if (count == validSpecs.length) {
                                            $scope.workflowToEdit.ownStepslist.push(listEtapes);
                                            $scope.generationList = false;
                                        }
                                    });
                                });

                            });
                        });
                    } else {
                        swal("Oh oh !", $rootScope._T["ys33ceqd"], "error");
                    }

                });

            };

            $scope.openList = function (stepsList_id) {
                //ngDialog.closeAll();

                $scope.currentStepsList = StepsList.get({id: stepsList_id});

                var dialog = ngDialog.open({
                    className: 'ngdialog-theme-large',
                    template: 'views/Dialog/StepsList.html',
                    scope: $scope,
                    controller: 'StepsListDialogCtrl',
                    closeByDocument:false
                });
            };

            $scope.deleteWorkflow = function() {
                var productsSelected = $filter('filter')($scope.subproject_workflow.ownProduct, {'selected':true});
                var count = 0; size = productsSelected.length; is_request = false;
                if(size > 0) { // 1. verfier si on 1 à n produit selectionnés
                  
                    angular.forEach($scope.subproject_workflow.ownProduct, function(product) {
                        if (product.selected == true) {  // 2. on boucle sur n produits selectionnés
                            var filters = [
                                {
                                    "name": "product_id",
                                    "value": product.id
                                },
                                {
                                    "name": "workflow_id",
                                    "value": $scope.workflowToEdit.id
                                }
                            ];
                             // 3. on si il y a des requests pour chaque produit lié à ce workflow selectionnés
                            Request.getRequestsBy({filters: [filters]}, function (requests) {
                                count++
                                if (requests.length != 0) {   // 3.1 on affiche un message d'erreur si il y a une requests  lié à  ce produit et ce workflow selectionnés
                                    is_request = true
                                    swal({
                                        title: $rootScope._T["je3ce42j"],
                                        text: $rootScope._T["yh5uzaxy"],
                                        type: "error",
                                        confirmButtonText: $rootScope._T["3kwfv0dr"],
                                        closeOnConfirm: true
                                    });
                                }
                                if(count == size && !is_request) { // 3.2 Si on a boucler sur tous les produits selectionnés sans aucune request lié à produit et  workflow selectionnés ===> alors on supprime le workflow 
                                    Workflow.delete({workflowId:$scope.workflowToEdit.id},function(){
                                        swal({
                                            title: $rootScope._T["cp76uafb"],
                                            text: $rootScope._T["eu8wassb"],
                                            type: "success",
                                            confirmButtonText: "Ok",
                                            closeOnConfirm: true},function(){
                                            ngDialog.closeAll()
                                        })
                                    })
                                }
                            });
                        }
                    })
                } else {
                    // 4. Si on a aucun produit selectionné parmi la liste des produits ==> on supprime le workflow meme si il y a des requests existantes  ===> on perd alors les liasons entre les demandes et workflows 
                    Workflow.delete({workflowId:$scope.workflowToEdit.id},function(){
                        swal({
                            title: $rootScope._T["cp76uafb"],
                            text: $rootScope._T["eu8wassb"],
                            type: "success",
                            confirmButtonText: "Ok",
                            closeOnConfirm: true},function(){
                            ngDialog.closeAll()
                        })
                    })
                }

            }
        }
        else
        {
            alert($rootScope._T["t5hjtmmv"]);
        }

    }]);
