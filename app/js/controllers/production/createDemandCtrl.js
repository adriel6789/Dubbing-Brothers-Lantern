/**
 * Created by Marcel on 09/03/2015.
 * note phv 20210208
 * DEPRECATED, encore appelé à dans index.html, mais jamais utilisé
 * derniere correction avant nouvelle page  Date:   Tue Mar 14 18:24:45 2017 +0100
 * remplacé par app/createDemand/createDemandCtrl.js commit 8717360cb4a70ee9c4b1a46236dbdcf2264e8edd
 * date de remplacement:  Fri Sep 7 15:40:39 2018 +0200
 * supprimé l'appel dans index.html
 */

Lantern.controller('CreateDemandCtrl', ['$scope', '$timeout', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location', 'Project', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Product', 'Valuelist', 'Subproject', 'Record', 'Request', 'Workflow', 'Return', 'MediaItems', 'Attachments', 'Client', 'User', 'Group', 'FileUploader', 'Favorite', 'StepsList', 'NotificationService', 'ContextualInfo', 'Comment', 'DynamicFormService', 'WorkflowHelperService', 'RequestService',
    function ($scope, $timeout, $rootScope, $anchorScroll, $http, $q, $state, $location, Project, $cookies, $stateParams, $filter, ngDialog, Product, Valuelist, Subproject, Record, Request, Workflow, Return, MediaItems, Attachments, Client, User, Group, FileUploader, Favorite, StepsList, NotificationService, ContextualInfo, Comment, DynamicFormService, WorkflowHelperService, RequestService)
    {
        let dynamicForm = DynamicFormService.getFormData();

        var role = $.cookie('role');
        if ($rootScope.canDisplay(3)) {
            var exploitation_types = Valuelist.query({tableName: 'exploitation_types'});
            Valuelist.query({tableName: 'format_mix'});
            Valuelist.query({tableName: 'norme_mix'});
            var selectedWorkflow = null;
            var masteringRequiredFields = [];

            $scope.step = 1


            $scope.uploader = [];

            var filters = [{
              "name": "user_id",
              "value": $.cookie("user_id")
            }];
            Request.getRequestsBy({filters: [filters]}, function(requests){
                $scope.allMyRequests = []
                angular.forEach(requests, function(request) {
                    request.human_description = request.product.human_description
                    if(request.is_sent_back != 1) {
                        $scope.allMyRequests.push(request);
                    } else {
                        var remainFarmer = false;
                        angular.forEach(request.ownFarmerbookings, function(farmer) {
                          if (farmer.is_done != 1) {
                            remainFarmer = true;
                          }
                        });
                        if (remainFarmer) {
                          $scope.allMyRequests.push(request);
                        }
                    }
                })
            })


            $scope.action_types = [];
            $scope.allReturns = [];
            var dropzone = [];
            $scope.createDemandSuccessful = false;
            $scope.projectChoosen = ''; // film ou série
            $scope.subProjectChoosen = ''; // saison
            $scope.productChoosen = ''; // épisode
            $scope.workflowChoosen = ''; // workflow
            $scope.actionChoosen = ''; // etape action
            $scope.entity = new Request();
            $scope.method = new Request();
            $scope.method.delai_souhaite = [];
            $scope.show_tech = false

            //$scope.entity.user_id = $.cookie('user_id');
            $scope.projects = [];

            $scope.loadFromUrl = false;

            $scope.initForm = function() {
              $scope.projects = [];
                $scope.selectedDemand = '';
                $scope.entity = new Request();
                $scope.method = new Request();
                $scope.method.delai_souhaite = [];
                $scope.show_tech = true

                $scope.workflows = [];
                $scope.uploader = [];
                $scope.action_types = [];
                $scope.masteringGeneralForm = [];
                $scope.masteringProductForm = [];
                masteringRequiredFields = [];
                $scope.loadFromUrl = false;

                $scope.createDemandSuccessful = false;

                $scope.entity.subproject = null;
                $scope.showSubProjects = false;


                $scope.entity.etape_type_id = null;
                $scope.action_type_main = null;
                $scope.entity.action_type_id = null;
                $scope.entity.typeWork = null;

                $scope.step = 1;

              //  $scope.etape_desc = null;

                $scope.products = [];
                $scope.entity.products = [];
                $scope.showProducts = false;
                $scope.demandGeneral = false;
                $scope.displayTab = false;

                //TODO Temp fix en attente de la refonte des étapes / actions
                $scope.updateActionType = function (action) {
                    if (action != null) {
                        $scope.entity.action_type_id = action.id;
                        $scope.entity.service = action.service;
                        $scope.entity.etape_type_id = action.etape.id
                    }
                };

                var filters = [{
                    "name" : "user_id",
                    "value" : $.cookie('user_id')

                }];
                Favorite.queryByFilters({filters:[filters]},function(response){
                  $scope.projects = []
                    response.forEach(function(fav){
                        if(fav.project_id != null){
                            Project.queryFalse({projectId: fav.project_id},function(project){
                                if(project.code_name == null){
                                    project.code_name = "";
                                }
                                if(project.code_name_2 == null){
                                    project.code_name_2 = "";
                                }
                                if(project.code_name_3 == null){
                                    project.code_name_3 = "";
                                }
                                if(project.ownSubproject.length > 0){
                                  $scope.projects.push(project);
                                }

                                if($.cookie('saveProject') != null && project.id == $.cookie('saveProject')) {
                                  $scope.entity.project = $.cookie('saveProject')
                                  $scope.showSelectedProject(project)
                                  if($.cookie('saveSubProject') != null) {
                                    $scope.entity.subproject = $.cookie('saveSubProject')
                                    angular.forEach($scope.subprojects, function(subproject) {
                                      if(subproject.id == $.cookie('saveSubProject')) {
                                        $scope.showSelectedSeason(subproject)
                                      }
                                    })
                                  }
                                }
                            });
                        }
                    });
                });
            };
            $scope.initForm();

            $scope.invertValue = function(scope) {
                $scope.show_tech = !$scope.show_tech
            }

            function isAllRequiredOkFunc() {
                var allOk = true;
                masteringRequiredFields.forEach(function(field){
                    if(field.type == "switch"){
                        if($scope.method[field.name] == false){
                            allOk = false
                        }
                    }
                    else if(field.type == "checkbox"){
                        if($scope.method[field.name] == false){
                            allOk = false
                        }
                    }
                    else {
                        if($scope.method[field.name] == null){
                            allOk = false;
                        }
                    }
                });
                return allOk;
            }

            $scope.createDemand = function () {
                if(isAllRequiredOkFunc()) {
                    var entityForDemand = angular.extend($scope.entity, $scope.method);
                    var masteringGeneralForm = $scope.masteringGeneralForm;
                    var masteringProductForm = $scope.masteringProductForm;
                    var loopForServices = 1;
                    if (entityForDemand.services != null) {
                        loopForServices = entityForDemand.services.length;
                    }
                    for (var i = 0; i < loopForServices; i++) {
                        addDemand(entityForDemand, masteringGeneralForm, masteringProductForm, i);
                    }
                }
                else {
                    sweetAlert($rootScope._T["mx7q7rbm"], $rootScope._T["pjnj67kf"], "error");
                }
            };

            $scope.editMediaItemReference = function(item){
                var upItem = new MediaItems();
                upItem.reference = item.reference;
                upItem.$update({itemId: item.id});
            };

            async function addDemand(entity, masteringGeneralForm, masteringProductForm, loopIndex) {

                var numberProduct = entity.products.length;
                var count = 0;
                var idsRequests = [];
                var requestsCreated = [];
                var project_id = entity.project;
                var subproject_id = entity.subproject;

                if (numberProduct != 1) {
                    entity.in_group = true;
                } else {
                    entity.in_group = false;
                }

                for (let product of entity.products) {
                    var request = angular.copy(entity);


                    //Récupération des champs pour mastering si plusieurs produits
                    if (masteringProductForm != null) {
                        masteringProductForm.forEach(function (form) {
                            form.forEach(function (element) {
                                if (request[element.name] != null)
                                    delete request[element.name];

                                var res = element.name.split("_");
                                if (res[res.length - 1] == product.id) {
                                    var variable = element.name.substring(0, element.name.length - (product.id.length + 1));
                                    if (element.type.view == "ui-select-multiple") {
                                        request[variable] = entity[element.name].join(',')
                                    }
                                    else {
                                        request[variable] = entity[element.name];
                                    }
                                }
                            });
                        });
                    }

                    if (masteringGeneralForm != null) {
                        if (request.services != null) {
                            request.service_id = request.services[loopIndex];
                            delete request.services;
                            masteringGeneralForm.forEach(function (form) {
                                if (request[form.name] != null) {
                                    if (form.type.view == "ui-select-multiple") {
                                        request[form.name] = request[form.name].join(',')
                                    }
                                }
                            });
                        }
                    }

                    request.planning_id = $scope.entity.service;
                    request.user_id = $.cookie('user_id');
                    delete request.service;

                    if(request.delai_souhaite.length > 0){
                      request.delai_souhaite = request.delai_souhaite.join(',');
                    }

                    //Recuperation du product_id
                    request.product_id = product.id;
                    request.info_for_tech_product = product.info_for_tech_product;

                    $scope.comment_for_planning = request.comment_for_planning;




                    if(product.parent_request_id != null) {
                      request.parent_request_id = product.parent_request_id
                    }

                    //Clean de la requete
                    delete request.project;
                    delete request.subproject;
                    delete request.products;
                    delete request.comment_for_planning;




                    //Recup des mediaItems
                    if (product.itemsInRequest != null) {
                        var items = [];
                        product.itemsInRequest.forEach(function (item) {
                            items.push(item.id);
                        });
                        if (items.length != 0) {
                            request.media_items = items.toString();
                        }
                    }


                    await request.$save({}, function (requestSaved) {
                        //Sauvegarde pour la notif
                        requestsCreated.push(requestSaved);
                        count++;

                        var date = new Date();
                        date.setTime(date.getTime() + (1800 * 1000));
                        $.cookie('saveProject', $scope.entity.project, {expires: date, path: '/'});
                        $.cookie('saveSubProject', $scope.entity.subproject, {expires: date, path: '/'});

                        if($scope.comment_for_planning != "" && $scope.comment_for_planning != null) {
                          var newComment = new Comment();
                          newComment.text = $scope.comment_for_planning;
                          newComment.user_id = $.cookie('user_id');
                          newComment.request_id = requestSaved.id;
                          newComment.show_tech = $scope.show_tech
                          newComment.$save();
                        }

                        newActivityLogRequest(new Comment(), $.cookie('user_id'), requestSaved.id, "Création de la demande")

                        idsRequests.push(requestSaved.id);
                        if ($scope.uploader.length != 0) {
                            $scope.uploader[requestSaved.product_id].queue.forEach(function (item) {

                              if(item.formData[0] == null){
                                item.formData.push({request_id: requestSaved.id});
                                $rootScope.showLoading++;
                                item.upload();
                                item.onComplete = function(){
                                  $rootScope.showLoading--;
                                }
                              }
                              else {
                                Attachments.postCopy({attachment_id: item.formData[0].id, request_id: requestSaved.id})
                                /*Attachments.get({id : item.formData[0].id}, function(response){
                                  var temp = new Attachments();
                                  temp.request_id = requestSaved.id;
                                  temp.path = response.path;
                                  temp.original_name = response.original_name;
                                  temp.internal_path = response.internal_path;
                                  temp.filesize = response.filesize;
                                  temp.is_exist = true;
                                  temp.$save();

                                });*/
                              }
                            });
                        }
                        if (count == numberProduct) {
                            if (numberProduct != 1) {
                              RequestService.regroupDefer(idsRequests[0]);
                            }
                            $scope.createDemandComplete();

                            var notifDesc = $rootScope._T["bxxh9ox6"]
                            if (entity.important != null) {
                              notifDesc += "<br/> <strong>" + $rootScope._T["4orz1fdr"] + "</strong>";
                            }

                            var services = "planning"
                            if(entity.service == 'digital-media'){
                                services += ",digitalmedia"
                            }
                            sendStandardNotif(
                              new NotificationService(),
                              requestsCreated,
                              services,
                              $rootScope._T["y9ckxgru"],
                              notifDesc,
                              $filter,
                              "creation",
                              $rootScope
                            );
                        }
                    }, function () {
                        swal({
                            title: $rootScope._T["t9coa94k"],
                            text: $rootScope._T["zvxj32q7"],
                            type: "error",
                            confirmButtonText: "OK"
                        });
                    });

                };

            }

            $scope.createDemandComplete = function(){
              swal({
                      title: $rootScope._T["70jumwe9"],
                      text: $rootScope._T["v9i994zv"],
                      type: "success",
                      showCancelButton: true,
                      html:true,
                      confirmButtonText: $rootScope._T["56rctuxg"],
                      cancelButtonText: $rootScope._T["y0tzlw7g"],
                      closeOnConfirm: false,
                      closeOnCancel: true
                  },
                  function(isConfirm){
                      if (isConfirm) {
                          swal({
                              title: $rootScope._T["3vgzgmv3"],
                              text: $rootScope._T["ma7zuw2z"],
                              type: "info",
                              confirmButtonText: $rootScope._T["j9qvsk4n"]
                          });
                          $scope.partialReset();
                          $scope.goToAnchor("up");
                          $scope.$apply();

                      } else {
                          ngDialog.closeAll()
                          $scope.initForm();
                          $scope.goToAnchor("up");
                          $scope.$apply();
                      }
                  });
            };



            $scope.showSelectedProject = function (item, model) {
                $scope.createDemandSuccessful = false;
                $scope.projectChoosen = item;
                $scope.actionChoosen = '';
                $scope.subProjectChoosen = '';
                $scope.workflowChoosen = '';
                $scope.subprojects = [];
                item.ownSubproject.forEach(function(subprojects){
                  if(subprojects.ownProduct.length > 0){
                    $scope.subprojects.push(subprojects);
                  }
                });
                if($scope.subprojects.length > 0){
                    $scope.showDemandPlanning = true
                    $scope.entity.subproject = null;
                    $scope.showSubProjects = true;

                    $scope.entity.etape_type_id = null;
                    $scope.entity.action_type_id = null;
                    $scope.entity.typeWork = null;

                    $scope.products = [];
                    if(!$scope.loadFromUrl)
                        $scope.entity.products = [];
                    $scope.showProducts = false;
                    $scope.demandGeneral = false;
                    $scope.displayTab = false;
                  }
                  if(!$rootScope.isMobile() && !$scope.loadFromUrl){
                      $scope.step = 2
                  }

            };

            $scope.showSelectedSeason = function (item, model) {
                $scope.subProjectChoosen = item;
                $scope.products = [];
                $scope.workflowChoosen = '';
                $scope.actionChoosen = '';
                item.ownProduct.forEach(function(product){
                  if(product.episode_number != null || product.description_text != null){
                    $scope.products.push(product);
                  }
                });
                if($scope.products.length > 0) {
                    if(!$scope.loadFromUrl)
                        $scope.entity.products = [];
                $scope.entity.etape_type_id = null;
                $scope.entity.action_type_id = null;
                $scope.entity.typeWork = null;
                $scope.entity.workflow_id = '';
                $scope.method = new Request();
                $scope.method.delai_souhaite = [];
                $scope.workflows = [];
              }
            };

            function setWorkflowUnselect() {
              angular.forEach($scope.workflows, function(value, key) {
                  value.isSelected = false;
              });
            }

            function showSelectedWorkflow(workflow) {
              angular.forEach($scope.workflows, function(value, key) {
                if(value.id == workflow.id){
                  value.isSelected = true;
                }
                else {
                  value.isSelected = false;
                }
              });
            }

            $scope.addRemoveProductToEntity = function(product) {
              var productInEntityIndex = $scope.entity.products.indexOf(product)
              if(productInEntityIndex != -1) {
                $scope.entity.products.splice(productInEntityIndex, 1)
                product.isInEntity = false
              } else {
                $scope.entity.products.push(product)
                product.isInEntity = true
              }

            }

            $scope.$watchCollection('entity.products', function(data) {
              if (!$scope.loadFromUrl) {
                  $scope.workflowChoosen = '';
                  $scope.entity.workflow_id = '';
              }
              $scope.actionChoosen = '';
              $scope.entity.etape_type_id = null;
              $scope.entity.action_type_id = null;
              $scope.entity.typeWork = null;
              $scope.method = new Request();
              $scope.method.delai_souhaite = [];
              $scope.demandGeneral = false;
              $scope.displayTab = false;
                    $scope.workflows = [];

                    showWorkflows();
                    setWorkflowUnselect();


            });

            // $scope.$watch("entity.products", function (data) {
            //     if (!$scope.loadFromUrl) {
            //         $scope.entity.workflow_id = '';
            //     }
            //     $scope.entity.etape_type_id = null;
            //     $scope.entity.action_type_id = null;
            //     $scope.entity.typeWork = null;
            //     $scope.method = new Request();
            //     $scope.method.delai_souhaite = [];
            //     $scope.workflows = [];
            //     $scope.demandGeneral = false;
            //     $scope.displayTab = false;
            //
            //     showWorkflows();
            //     setWorkflowUnselect();
            //
            // });

            $scope.$watchCollection("method.delai_souhaite", function (data) {


            });

            $scope.addAllProducts = function () {
              if($scope.subprojects[0].nature.id == 2){ //série
                $scope.entity.products = $filter('orderBy')($scope.products, "episode_number");
              } else {
                $scope.entity.products = $filter('orderBy')($scope.products, "description_text");
              }

              $scope.entity.products.forEach(function(product) {
                product.isInEntity = true
              })
              $scope.step += 1
            };

            function showWorkflows(){
              $scope.workflows = [];

              $scope.productsChoosen = $scope.entity.products;
              angular.forEach($scope.productsChoosen, function(product) {
                  angular.forEach(product.sharedWorkflow, function (workflow) {
                          //Check exist
                          var exist = false;
                          $scope.workflows.forEach(function (wf) {
                              if (wf.id == workflow.id) {
                                  exist = true;
                              }
                          });

                          if (!exist) {
                            workflow.color = colorizeWorkflow(workflow);


                            workflow.description = WorkflowHelperService.describeWorkflow(workflow);


                              $scope.workflows.push(workflow);
                          }
                  });
              });
            }



            $scope.selectWorkflow = function (workflow) {
                $scope.workflowChoosen = workflow

                $scope.entity.workflow_id = workflow.id;

                //$scope.etapes_types = Valuelist.getEtapeActionByWorkflow({workflow_type_id:workflow.workflow_type_id});
                Valuelist.getEtapeActionByWorkflow({workflow_type_id:workflow.workflow_type_id}, function(etapes){
                  $scope.etapes_actions = []
                  angular.forEach(etapes, function(etape) {
                    angular.forEach(etape.actions, function(action) {
                      action.etape_value = etape.value
                      action.etape = {}
                      action.etape.id = etape.id
                      action.etape.name = etape.name
                      action.etape.value = etape.value

                      var insertAction = true;

                      //On filtre les actions pour la belqique : on ne les fait pas apparaitre si la langue du workflow n'est pas hybride ou belgique
                      if (action.service === "belgique") {
                        if (!(workflow.dub_place === "Hybride" || workflow.dub_place === "Belgique")) {
                          insertAction = false;
                        }
                      }

                      if (insertAction) {
                        $scope.etapes_actions.push(action)
                      }
                    })
                  })
                })
                //$scope.action_types = [];
                $scope.entity.action_type_id = "";
                $scope.entity.etape_type_id = "";

                $scope.masteringGeneralForm = [];
                $scope.masteringProductForm = [];
                $scope.method = new Request();
                $scope.method.delai_souhaite = [];

                showSelectedWorkflow(workflow);

                $scope.selectedDemand = workflow.workflow_type_id;

                showDemand(workflow);
            };

            $scope.allWorkflowSelected = function(){
                var show = true;
                $scope.workflows.forEach(function(wf){
                    if(wf.isSelected){
                        show = false;
                    }
                });
                return show;
            };

            function checkWorkflowOnProduct(products, workflow) {
                var error = false;
                var total = products.length;
                var count = 0;
                products.forEach(function (product) {
                    Workflow.findWorkflowOnProduct({product_id: product.id, workflow_id: workflow.id}, function (workflow) {
                        if (workflow.id == null || workflow.id == 0) {
                            error = true;
                        }

                        count++;
                        if (count == total) {
                            if (error) {
                                $scope.errorOnWorkflow = true;
                            } else {
                                $scope.errorOnWorkflow = false;
                                if(!$scope.loadFromUrl)
                                    $scope.step += 1
                            }
                            return error;
                        }

                    });
                });
            }

$scope.nextStep = function(index) {
    $scope.step += index
}


              function showDemand (workflow) {

                //A récupérer depuis l'URL, méthode fausse
                //$scope.allReturns = Return.querybyproductid({id: $scope.productChoosen.id});
                $scope.entity.workflow_id = workflow.id;
                $scope.entity.product_id = $scope.productChoosen.id;

                $scope.entity.products.forEach(function (product) {
                    $scope.uploader[product.id] = new FileUploader();
                    $scope.uploader[product.id].url = URL_API + "/attachments.json/";
                    $scope.uploader[product.id].headers = {'auth-token': $.cookie('token')}
                });

                if($stateParams.request_id != null && $scope.productFromUrl != null){
                  Attachments.byRequestId({
                    request_id: $stateParams.request_id
                  }, function(a) {
                    //data.pj = a.length;
                    a.forEach(function(item) {
                      var file = new FileUploader.FileItem($scope.uploader[$scope.productFromUrl.id], {
                        lastModifiedDate: new Date(),
                        name: item.original_name,
                        size: item.filesize
                      });

                      file.formData.push({
                        id: item.id,
                        path: item.path
                      });
                      file.progress = 100;
                      file.isUploaded = true;
                      file.isSuccess = true;

                      $scope.uploader[$scope.productFromUrl.id].queue.push(file);
                    })
                  });
                }
                $scope.entity.etape_type_id = null;
                $scope.entity.action_type_id = null;
                $scope.entity.typeWork = null;
                selectedWorkflow = workflow;

                $scope.workflows.forEach(function (wf) {
                    if (wf.id == workflow.id) {
                        wf.selectedWorkflow = 1;
                        selectedWorkflow = wf;
                    } else {
                        wf.selectedWorkflow = 0;
                    }
                });


                if (checkWorkflowOnProduct($scope.entity.products, workflow)) {
                    $scope.errorOnWorkflow = true;

                }

                // Si doublage
                if ($scope.selectedDemand == 1) {
                    showRecord();
                }
                // Si Mastering
                else if ($scope.selectedDemand == 2) {
                    showMastering();
                }
                // Si Servicing
                else if ($scope.selectedDemand == 3) {
                    showServicing();
                }
            };

            $scope.loadMediaItemsFromProject = function (product) {

              product.mediaItems = MediaItems.findbyproject({project_id: $scope.entity.project}, function(){
                product.mediaItems.forEach(function(item){
                  product.itemsInRequest.forEach(function(itemReq){
                    if(itemReq.id == item.id){
                      item.is_selected = 1;
                    }
                  });
                });
              });
            }

            $scope.loadMediaItemsFromProduct = function(product) {
              product.mediaItems = MediaItems.findbyproduct({product_id: product.id}, function(items){
                product.mediaItems.forEach(function(item) {
                  product.itemsInRequest.forEach(function(itemReq){
                    if(itemReq.id == item.id){
                      item.is_selected = 1;
                    }
                  });
                });
              });
            }

            $scope.showNext = function() {
              switch ($scope.step) {
                case 1:
                  return ($scope.entity.project != null)
                  break;
                case 2:
                  return ($scope.entity.subproject != null)
                  break;
                case 3:
                  return ($scope.entity.products.length > 0)
                  break;
                case 4:
                  return ($scope.entity.workflow_id != "")
                  break;
                case 5:
                  return ($scope.entity.action_type_id != null && $scope.entity.action_type_id != "")
                  break;
                case 6:
                  return true
                  break;
                default:
                return false

              }
            }

            function loadMediaItems(){
                $scope.entity.products.forEach(function (product) {
                    product.itemsInRequest = []
                  if(product.itemsInParentRequest != null){
                  product.itemsInParentRequest.forEach(function(item){
                    product.itemsInRequest.push(item);
                  });
                  }
                  else {
                    product.mediaItems = MediaItems.findbyproduct({product_id: product.id}, function () {
                        var hasVCube = false;
                        var hasPyramix = false;

                        if($scope.selectedDemand != 3){
                          var items = getMediaItemsByMatch("doublage", $scope.etape_name, $scope.action_name, product.mediaItems)
                          product.itemsInRequest = items
                      }

                    });
                  }

                });

            }

            $scope.refreshMediaItems = function(product){
              product.itemsInRequest = []
              if(product.itemsInParentRequest == null){
                product.mediaItems = MediaItems.findbyproduct({product_id: product.id}, function () {
                    var hasVCube = false;
                    var hasPyramix = false;
                    if($scope.selectedDemand != 3){
                      var items = getMediaItemsByMatch("doublage", $scope.etape_name, $scope.action_name, product.mediaItems)
                      product.itemsInRequest = items
                  }
                });
              }
            }

            $scope.partialReset = function(){
                $scope.masteringGeneralForm = [];
                $scope.masteringProductForm = [];
                $scope.method = new Request();
                $scope.method.delai_souhaite = [];

                $scope.action_types = [];
                $scope.entity.action_type_id = "";
                $scope.entity.etape_type_id = "";
                $scope.actionChoosen = null
                $scope.step = 4
            };

            /**
             * Section Record/Doublage
             */
            function showRecord() {
                //loadMediaItems();
            }


            $scope.showSelectedEtape = function (item, model) {
                //$scope.method.action_type_id = '';

                $scope.masteringGeneralForm = [];
                $scope.masteringProductForm = [];
                $scope.method = new Request();
                $scope.method.delai_souhaite = [];

                $scope.etape_name = item.name

                $scope.action_types = [];
                $scope.entity.action_type_id = "";
                $scope.action_types = Valuelist.getActionTypesByEtape({etape_id: item.id});
            };

            /**
             * Section Mastering
             */

            function showMastering() {
                loadMediaItems();
                $scope.typeMastering = "mastering";
            }

            $scope.getRequests = function () {
                var deferred = $q.defer();

                if ($scope.usersMastering != null) {
                    deferred.resolve();
                    return deferred.promise;
                }
                var users = User.query(function (users) {
                    var formattedUsers = [];
                    users.forEach(function (user) {
                        var t = {
                            "id": user.id,
                            "name": user.firstname + ' ' + user.lastname
                        };

                        formattedUsers.push(t);
                    });
                    $scope.usersMastering = formattedUsers;
                });
                var groups = Group.query(function (groups) {
                    var formattedGroups = [];
                    groups.forEach(function (group) {
                        var t = {
                            "id": group.id,
                            "name": group.name
                        };

                        formattedGroups.push(t);
                    });
                    $scope.groupsMastering = formattedGroups;
                });

                var groupsInternal = Group.internal(function (groups) {
                    var formattedGroups = [];
                    groups.forEach(function (group) {
                        var t = {
                            "id": group.id,
                            "name": group.name
                        };

                        formattedGroups.push(t);
                    });
                    $scope.groupsInternalMastering = formattedGroups;
                });

                var clients = Client.query(function (clients) {
                    var formattedClients = [];
                    clients.forEach(function (client) {
                        var t = {
                            "id": client.id,
                            "name": client.name
                        };

                        formattedClients.push(t);
                    });
                    $scope.clientsMastering = formattedClients;
                });



                $q.all([users.$promise, groups.$promise, clients.$promise, groupsInternal.$promise]).then(function () {
                    deferred.resolve();
                });

                return deferred.promise;
            };

            $scope.showSelectedWork = function (item, model) {
                $scope.masteringGeneralForm = [];
                $scope.masteringProductForm = [];
                $scope.method = new Request();
                $scope.method.delai_souhaite = [];

            };

            $scope.showSelectedAction = function (item, model) {
              $scope.isDuplicateRequests = {}
              $scope.isDuplicateRequests['duplicate'] = false
              $scope.isDuplicateRequests['products'] = {}
              angular.forEach($scope.entity.products, function(product) {
                $scope.isDuplicateRequests['products'][product.id] = {}
                $scope.isDuplicateRequests['products'][product.id]['detail'] = product

                var filters = [
                    {
                        "name": "product_id",
                        "value": product.id
                    },
                    {
                        "name": "workflow_id",
                        "value": $scope.entity.workflow_id
                    },
                    {
                        "name": "action_type_id",
                        "value": item.id
                    }
                ];

                Request.getRequestsBy({filters: [filters]}, function (requests) {
                    $scope.isDuplicateRequests['products'][product.id]['requests'] = requests
                    if(requests.length > 0) {
                      $scope.isDuplicateRequests['duplicate'] = true
                    }
                })
              })


                $scope.method = new Request();
                $scope.method.delai_souhaite = [];

                $scope.actionChoosen = item

                $scope.etape_name = item.etape.name

                $scope.action_name = item.name
                if(item.planning == "volume") {
                  $scope.show_tech = true
                } else {
                  $scope.show_tech = false
                }

                loadMediaItems();

                $scope.masteringGeneralForm = [];
                $scope.masteringProductForm = [];

                if(item.form != null){
                    dynamicForm.forEach(function(form) {
                        if (form.id == item.form) {
                            $scope.showSelectedForm(form);
                        }
                    });
                }
            };

            $scope.showSelectedForm = function (item, model) {

                var type = item;
                var promise = $scope.getRequests();

                promise.then(function () {
                    type.generalForm.forEach(function (data) {
                        if (data.required) {
                            var json = {"name" : data.name,"type": data.type.view}
                            masteringRequiredFields.push(json);
                        }
                        data.type.options = formSwitch(data);
                    });
                    if (type.productForm != null) {
                        $scope.entity.products.forEach(function (product) {
                            var temp = [];
                            type.productForm.forEach(function (element) {
                                var temporary = {};
                                angular.copy(element, temporary);
                                temporary.name = element.name + "_" + product.id;

                                if (temporary.required) {
                                    var json = {"name" : temporary.name,"type": temporary.type.view}
                                    masteringRequiredFields.push(json);
                                }

                                if (product.episode_number != null) {
                                    temporary.text = product.episode_number;
                                }
                                else {
                                    temporary.text = product.description_text;
                                }
                                temporary.type.options = formSwitch(temporary);
                                temp.push(temporary);
                            });
                            $scope.masteringProductForm.push(temp);
                        });
                    }
                    $scope.masteringGeneralForm = type.generalForm;

                    //Chargement des infos de contexte (dynamique)
                    type.productForm.forEach(function (element) {
                        if (element.ref_context != null) {
                            $scope.loadContextInfos(element.ref_context);
                        }
                    });
                });

            };


            function formSwitch(data) {
                var options = '';
                if (data.type.view == "ui-select-global" || data.type.view == "ui-select-multiple") {
                    switch (data.type.api) {
                        case "clients":
                            options = $scope.clientsMastering;
                            break;
                        case "users":
                            options = $scope.usersMastering;
                            break;
                        case "groups":
                            options = $scope.groupsMastering;
                            break;
                        case "groupsInternal":
                            options = $scope.groupsInternalMastering;
                            break;
                        default :
                            break;
                    }
                }
                if (options == '' && data.type.options != null) {
                    return data.type.options;
                }
                return options;
            }


            /**
             * Section Servicing
             */
            function showServicing() {
                loadMediaItems();
                $scope.typeMastering = "servicing";
            }

            /**
             *
             * Section de ta mère
             */

            $scope.addMediaItem = function (mediaItem, request) {
                //Check non présent
                var check = $filter('filter')(request.itemsInRequest, {id: mediaItem.id}, true);
                if (check == null || check.length == 0) {
                    request.itemsInRequest.push(mediaItem);
                    mediaItem.is_selected = 1;
                }
            };

            $scope.removeMediaItem = function (product, itemToDelete) {
                var index = product.itemsInRequest.indexOf(itemToDelete)
                product.itemsInRequest.splice(index, 1);

                var filter = $filter('filter')(product.mediaItems, {id:itemToDelete.id}, true)
                if(filter.length > 0){
                  filter[0].is_selected = 0
                }
            };

            function loadFromUrl() {
                if($rootScope.isMobile() && ($stateParams.product_id != null || $stateParams.product_ids != null)){
                    $scope.step = 5
                }
              if ($stateParams.product_id != null) {
                    $scope.loadFromUrl = true;
                    Product.get({productId: $stateParams.product_id}, function (product) {
                        $scope.entity.products = [];
                        product.itemsInParentRequest = [];
                        $scope.entity.products.push(product);
                        $scope.productFromUrl = product;
                        Subproject.get({id: product.subproject.id}, function (subproject) {
                            $scope.entity.subproject = subproject.id;
                            $scope.subProjectChoosen = subproject;
                                showWorkflows();
                            if ($stateParams.workflow_id != null) {
                                $scope.entity.workflow_id = $stateParams.workflow_id;

                                Workflow.get({workflowId: $stateParams.workflow_id}, function (workflow) {
                                    $scope.workflowFromUrl = workflow;
                                    $scope.selectedDemand = workflow.workflow_type_id;
                                    $scope.selectWorkflow(workflow);

                                });
                            }
                            if($stateParams.request_id != null){
                              $scope.entity.parent_request_id = $stateParams.request_id;
                              $scope.parent_request = Request.get({requestId:$stateParams.request_id}, function(pRequest){

                                if (pRequest.media_items != null) {
                                  var itemsArray = pRequest.media_items.split(",");
                                  itemsArray.forEach(function(item) {
                                    var newItem = MediaItems.get({
                                      itemId: item
                                    }, function(i) {
                                        if(i.original_request_id == $stateParams.request_id){
                                            if (i.reference == 1) {
                                              i.reference = true;
                                            } else {
                                              i.reference = false;
                                            }
                                            i.is_selected;
                                            product.itemsInParentRequest.push(i);
                                            loadMediaItems();
                                        }


                                    });

                                  });
                                }
                              });

                            }

                            if ($stateParams.returns != null) {
                                $scope.entity.returnsIds = $stateParams.returns;
                                $scope.returns = [];
                                angular.forEach($stateParams.returns.split(","), function(id) {
                                    Return.get({id: id}, function(aReturn) {
                                        $scope.returns.push(aReturn);
                                    });
                                });
                            }
                        });

                        $scope.entity.project = product.subproject.project.id;
                    });
                }

                else if($stateParams.product_ids != null) {
                  $scope.loadFromUrl = true;
                  $scope.loadFromMultipleProducts = true;
                  $scope.entity.products = [];
                  var count = $stateParams.product_ids.split(",").length;
                  var i = 0;
                  var products_sort = [];
                  angular.forEach($stateParams.product_ids.split(","), function(product_id) {
                    Product.get({productId: product_id}, function (product) {
                      products_sort.push(product);
                      i += 1;
                      if(count == i){
                        if(products_sort[0].subproject.nature.id == 2){ //série
                          $scope.entity.products = $filter('orderBy')(products_sort, "episode_number");
                        } else {
                          $scope.entity.products = $filter('orderBy')(products_sort, "description_text");
                        }
                      }
                    });
                  });


                  Subproject.get({id: $stateParams.subproject_id}, function (subproject) {
                      $scope.entity.subproject = subproject;
                      $scope.subProjectChoosen = subproject;

                      showWorkflows();
                      if ($stateParams.workflow_id != null) {
                          $scope.entity.workflow_id = $stateParams.workflow_id;


                          Workflow.get({workflowId: $stateParams.workflow_id}, function (workflow) {
                              $scope.workflowFromUrl = workflow;
                              $scope.selectedDemand = workflow.workflow_type_id;
                              $scope.selectWorkflow(workflow);
                          });
                      }

                      $scope.entity.project = subproject.project;

                    })
                }
                else if ($stateParams.request_ids) {
                  $scope.loadFromUrl = true
                  $scope.loadFromMultipleRequests = true
                  $scope.entity.products = [];
                  var count = $stateParams.request_ids.split(",").length
                  var i = 0
                  var products_sort = []
                  angular.forEach($stateParams.request_ids.split(","), function(request_id) {
                    Request.get({requestId: request_id}, function (request) {
                      Product.get({productId:request.product.id},function(product){
                        product.parent_request_id = request.id
                        product.itemsInParentRequest = []
                        if (request.media_items != null) {
                          var itemsArray = request.media_items.split(",");
                          itemsArray.forEach(function(item) {
                            var newItem = MediaItems.get({
                              itemId: item
                            }, function(i) {
                              if (i.reference == 1) {
                                i.reference = true;
                              } else {
                                i.reference = false;
                              }

                              i.is_selected;
                              product.itemsInParentRequest.push(i);

                              loadMediaItems()

                            });
                          });
                        }
                        products_sort.push(product)
                        i += 1
                        if(count == i){
                          if(products_sort[0].subproject.nature.id == 2){ //série
                            $scope.entity.products = $filter('orderBy')(products_sort, "episode_number")
                          } else {
                            $scope.entity.products = $filter('orderBy')(products_sort, "description_text")
                          }
                        }
                      })

                    })
                  })

                  Subproject.get({id: $stateParams.subproject_id}, function (subproject) {
                    $scope.entity.subproject = subproject;
                    $scope.subProjectChoosen = subproject;
                      showWorkflows()
                      if ($stateParams.workflow_id != null) {
                          $scope.entity.workflow_id = $stateParams.workflow_id
                          Workflow.get({workflowId: $stateParams.workflow_id}, function (workflow) {
                              $scope.workflowFromUrl = workflow
                              $scope.selectedDemand = workflow.workflow_type_id
                              $scope.selectWorkflow(workflow)
                              selectedWorkflow = workflow
                          });
                      }
                      $scope.entity.project = subproject.project
                    })

                }
            }
            loadFromUrl();

            $scope.showStepsList = function(stepsList_id) {
                $scope.currentStepsList = StepsList.get({id: stepsList_id});

                var dialog = ngDialog.open({
                    className: 'ngdialog-theme-large',
                    template: 'views/Dialog/StepsList.html',
                    scope: $scope,
                    controller: 'StepsListDialogCtrl',
                    closeByDocument:false
                });
            };
            $scope.techspec_id_found = true;

            $scope.$watch('entity.action_type_id', function (action_id) {
                $scope.techspec_id = null;
                $scope.techspec_id_found = true;
                if(selectedWorkflow != null && selectedWorkflow.ownStepslist != null) {
                  selectedWorkflow.ownStepslist = objectInArray(selectedWorkflow.ownStepslist)
                }
                if (action_id != null && action_id != 0 && selectedWorkflow.ownStepslist.length != 0 && selectedWorkflow.ownStepslist[0] != null) {
                    StepsList.get({id: selectedWorkflow.ownStepslist[0].id}, function (stepsList) {
                        angular.forEach(stepsList.ownStep, function (step) {
                            if (step.action_type_id == action_id) {
                                $scope.techspec_id = step.techspec_id;
                            }
                        });

                        if($scope.techspec_id == null){
                          $scope.techspec_id_found = false;
                        }
                    });
                } else {
                  $scope.techspec_id_found = false;
                }
            });

            $scope.excelPasteDyn = function() {
                //Transformation des lignes en tableau
                var allLines = $scope.excelData.split("\n");

                //vérification du nombre de lignes copiées et du nombre de produits
                if (allLines.length == $scope.products.length) {
                    //On copie chaque ligne dans le champs produit correspondant
                    allLines.forEach(function(line, index) {
                        $scope.method[$scope.masteringProductForm[index][$scope.excelSelectDyn].name] = line;
                    });
                    $scope.excelData = null;
                    $scope.excelSelectDyn = null;
                } else {
                    swal({
                        title: $rootScope._T["v3mc4wkm"],
                        text: $rootScope._T["nr33ypyv"],
                        type: "error"
                    });
                    $scope.excelSelectDyn = null;
                }
            };

            $scope.excelPasteProd = function() {
                //Transformation des lignes en tableau
                var allLines = $scope.excelData.split("\n");

                //vérification du nombre de lignes copiées et du nombre de produits
                if (allLines.length == $scope.products.length) {
                    //On copie chaque ligne dans le champs produit correspondant
                    allLines.forEach(function(line, index) {
                        var product = $scope.entity.products[index];
                        product[$scope.excelSelectProd] = line;

                        //Post pour mettre à jour le produit
                        updatedProduct = new Product();
                        updatedProduct[$scope.excelSelectProd] = product[$scope.excelSelectProd];
                          updatedProduct.$update({productId: product.id}, function (data) {
                              //Mettre un indicateur d'update
                          }, function (data) {
                              return "Error " + data.status + " : " + data.statusText;
                          });

                    });
                    $scope.excelData = null;
                    $scope.excelSelectDyn = null;
                } else {
                    swal({
                        title: $rootScope._T["v3mc4wkm"],
                        text: $rootScope._T["nr33ypyv"],
                        type: "error"
                    });
                    $scope.excelSelectDyn = null;
                }
            }

            $scope.doneEditing = function(element, product){
              updatedProduct = new Product();
              updatedProduct[element] = product[element];
                updatedProduct.$update({productId: product.id}, function (data) {
                    //Mettre un indicateur d'update
                }, function (data) {
                    return "Error " + data.status + " : " + data.statusText;
                });
            };

            $scope.createWorkflow = function() {
                $scope.newWorkflowFromCreateDemand = true
                $scope.subproject_workflow = Subproject.get({id:$scope.subProjectChoosen.id},function(res){
                    var dialog = ngDialog.open({
                        className: 'ngdialog-theme-demand dialogwidth80p',
                        template: 'views/Dialog/createWorkflow.html',
                        scope: $scope,
                        controller: 'CreateWorkflowDialogCtrl',
                        closeByDocument:false
                    });

                    dialog.closePromise.then(function() {
                        //$state.reload();
                        var size = $scope.entity.products.length
                        var count = 0
                        angular.forEach($scope.entity.products, function(product) {
                            Product.queryFalse({productId:product.id},function(aProduct){
                                product.sharedWorkflow = aProduct.sharedWorkflow
                                count++
                                if(size == count) {
                                    showWorkflows()
                                }
                            })
                        })
                    });
                });
            };

            $scope.loadContextInfos = function(ref_context) {
                $scope.entity.products.forEach(function(product, index) {
                    if (product.id != null && $scope.entity.workflow_id != null) {
                        var filters = [
                            {
                                "name": "workflow_id",
                                "value": $scope.entity.workflow_id
                            },
                            {
                                "name": "product_id",
                                "value": product.id
                            },
                            {
                                "name": "name",
                                "value": ref_context
                            }];
                        var allInfos = ContextualInfo.getContextualInfosBy({filters: [filters]}, function() {
                            if (allInfos != null) {
                                var dynField = $filter('filter')($scope.masteringProductForm[index], {ref_context: ref_context});
                                if (dynField.length == 1 && allInfos.length == 1) {
                                    $scope.method[dynField[0].name] = allInfos[0].value;
                                }
                            }
                        });

                    }
                });

            };


            $scope.showTechnicalSpecModal = function() {
              $scope.isProd = true;
              ngDialog.open({
                template: 'views/Dialog/TechnicianTechnicalSpecDialog.html',
                className: 'ngdialog-theme-default dialogwidth80p',
                scope: $scope,
                controller: 'TechnicalSpecCtrl',
                closeByDocument:false
              });
            };

            $scope.addAttachmentsToProduct = function(product) {
                $scope.currentProduct = product;

                var dialog = ngDialog.open({
                    className: 'ngdialog-theme-large',
                    template: 'views/Dialog/addAttachmentsDialog.html',
                    scope: $scope,
                    controller: 'AddAttachmentsDialogCtrl',
                    closeByDocument:false
                });
            };

            $scope.goToAnchor = function(eID) {
              var old = $location.hash();
              $location.hash(eID);
              $anchorScroll();
              $location.hash(old);
            }

            $rootScope.plannings.forEach(function (element) {
              $scope.plannings[element.id] = element.name
            })

            /* Section popup */
            $scope.showNextButton = function(nbOfSteps) {

                var show = false
                if($scope.step == 1 && $scope.projectChoosen != '') {
                    show = true
                } else if($scope.step == 2 && $scope.subProjectChoosen != null && $scope.entity.products != 0) {
                    show = true
                } else if($scope.step == 3 && $scope.workflowChoosen != '' && $scope.errorOnWorkflow == false) {
                    show = true
                } else if($scope.step == 4 && $scope.etape_name != null && !$scope.isDuplicateRequests.duplicate) {
                    show = true
                } else if($scope.step >= 5 && nbOfSteps > $scope.step) {
                    show = true
                }

                return show
            }
        }
        else
        {
          alert($rootScope._T["t5hjtmmv"]);
          $location.path( getPathRole(role) );
        }

    }]);
