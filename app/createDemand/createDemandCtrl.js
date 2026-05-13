/**action
* Created by Marcel on 06/09/2018.
* Updated on 06/09/2018.
* popup de création de request
*/
Lantern.controller('CreateDemandCtrl', ['$filter', '$rootScope', '$scope', 'ApiRest', 'Request', 'RequestService', 
'FileUploader', 'ProductService', '$q', 'ValueListService', 'StepsList', 'ngDialog', 'MediaItems', 'Return',
 'Comment', 'RequestGroup', 'NotificationService', 'TableauSuivi', 'PersonsService', 'Session',
 'WorkflowHelperService','dataSync','PhelixAlula','Valuelist',
  function($filter, $rootScope, $scope, ApiRest, Request, RequestService, FileUploader, ProductService, $q, 
    ValueListService, StepsList, ngDialog, MediaItems, Return, Comment, RequestGroup, NotificationService, 
    TableauSuivi, PersonsService,Session, WorkflowHelperService,dataSync,PhelixAlula, Valuelist) {
    $scope.form = {};
    $scope.form.action = null;
    $scope.form.artistic_director_id = null;
    $scope.dt = "";
    $scope.delai_souhaite = [];
    $scope.dateStartEnd = [];
    $scope.uploader = {};
    let allEtapes = null
    $scope.etapes_actions = []
    $scope.HourOptions = getHourOptions($rootScope.user_entity.person.branch_id)
    $scope.transformHourInI18nFormat = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)
    $scope.etapes = $rootScope.etapes
    $scope.etapes_actions = []
    /**
    * Local variables
    */
    let rest = {};
    let service = {};
    let product_ids, workflow_ids, request_ids, return_ids, etape_action_id;
    let loading, productsChosen;
    let workflowsChosen = [];
    let requestToCreate = new Request();
    let allRequestsToCreate = [];
    let workflows = [];
    let etapesActions = [];
    let step = 1;
    let isMultiWorkflow = false;
    let errorOnWorkflow = false;
    let isDuplicateRequests = {};
    let checkIfDuplicateRequestLoading = false;
    let techspec_id;
    let productsMediaItems = {}
    let projectMediaItems = [];
    let returns = [];
    let parentRequests = [];
    let isEditRequest = false;
    let creationInProgress = false;
    let requestsCreated = [];
    let linkSaved = false;
    let linkError = false;
    let noLink = false;
    let artisticDirectors = [];
    let simplemde;

    
    const plannings = {}
    $rootScope.plannings.forEach(function (element) {
      plannings[element.id] = element.name
    })

    /**
    * Local functions
    */

    const setProductIds = (productIds) => product_ids = productIds ? productIds.split(",") : [];
    const getProductIds = () => product_ids;

    const setWorkflowIds = (workflowIds) => workflow_ids = workflowIds ? workflowIds.split(",") : [];
    const getWorkflowIds = () => workflow_ids;

    const setRequestIds = (requestIds) => request_ids = requestIds ? requestIds.split(",") : [];
    const getRequestIds = () => request_ids;

    const setReturnIds = (returnIds) => return_ids = returnIds ? returnIds.split(",") : [];
    const getReturnIds = () => return_ids;

    const setEtapeActionId = (etapeActionId) => etape_action_id = parseInt(etapeActionId);
    const getEtapeActionId = () => etape_action_id;

    const setLoading = (isLoading) => loading = isLoading;
    const getLoading = () => loading;

    const isMultiWorkflowAllowed = () => getWorkflows().length > 1 && getRequestIds().length == 0 && getReturnIds().length == 0;

    const setCheckIfDuplicateRequestLoading = (isLoading) => checkIfDuplicateRequestLoading = isLoading;
    const getCheckIfDuplicateRequestLoading = () => checkIfDuplicateRequestLoading;

    const setProducts = productsArray => productsChosen = productsArray;
    const getProducts = () => productsChosen;

    const getMainProduct = products => products && products.length > 0 ? products[0]:null;
    const getSubproject = () => getMainProduct(getProducts()).subproject;
    const getProject = () => getSubproject().project;

    const getWorkflows = () => workflows;

    const getAllRequestsToCreate = () => allRequestsToCreate;

    const getStep = () => step;
    const setStep = newStep => step = newStep;


    const getMultiWorkflow = () => isMultiWorkflow;
    const isWorkflowChosen = workflowId => $filter('filter')(workflowsChosen, {id: workflowId}, true).length != 0;
    const isWorkflowTypeDifferent = workflow_type_id => workflowsChosen.length > 0 && workflowsChosen[0].workflow_type_id != workflow_type_id;
    const setErrorOnWorkflow = value => errorOnWorkflow = value;
    const getErrorOnWorkflow = () => errorOnWorkflow;
    const getWorkflowsChosen = () => workflowsChosen;

    const getActionChosen = () => $scope.form.action;

    const getRequestToCreate = () => requestToCreate;

    const getPlanning = () => {
      if (requestToCreate && requestToCreate.etape_type_id) {
        if ($scope.etapes[requestToCreate.etape_type_id].loc_value) {
          const main_location_found = $scope.dubPlacesByLocValue[$rootScope.actions[requestToCreate.action_type_id].branch_id][$scope.etapes[requestToCreate.etape_type_id].loc_value].id
          return $rootScope.planningsByMainLocationAndService[main_location_found][requestToCreate.planning_id].name
        } else {
          return plannings[requestToCreate.planning_id]
        }
      } else {
        return plannings[requestToCreate.planning_id]
      }
    }
    const getIsDuplicateRequests = () => isDuplicateRequests;

    const showCreateRequestForm = () => getActionChosen() && ((!getCheckIfDuplicateRequestLoading() && getIsDuplicateRequests().duplicate != undefined && !getIsDuplicateRequests().duplicate) || getEditRequest());

    const getTechspec = () => techspec_id;

    const getProductMediaItems = productId => productsMediaItems[productId];
    const getProjectMediaItems = () => projectMediaItems;

    const getReturns = () => returns;

    const getEditRequest = () => isEditRequest;

    const getRequestsCreated = () => requestsCreated;

    const setCreationInProgress = (inProgress) => creationInProgress = inProgress;
    const getCreationInProgress = () => creationInProgress;

    const getArtisticDirectors = () => artisticDirectors;

    const resetWorkflowsChosen = () => {
      workflowsChosen = [];
      isEditRequest = false;
    }

    const setMultiWorkflow = value => {
      isMultiWorkflow = value;
      resetWorkflowsChosen();
      resetEtapeAction();
    }


    const getEtapesActions = () => {
      
      if (workflowsChosen.length > 0) {
        if (workflowsChosen[0].workflow_type_id == 1) {
          const workflow_managed = workflowsChosen[0]
          let filteredEtapesActions = [];
          angular.forEach($rootScope.etapesActionsBase[1], function (action) {
            const etape = action.etape
            let insertAction = true
            if (etape.loc_value) {
              
              // les actions enregistrement ne peuvent être faites que si le workflow correspond à l'étape
              if (action.etape.name == 'enregistrement' || action.etape.name == 'montage') {
                if ((etape.loc_value & parseInt(workflow_managed.dub_place_value)) != 0) {
                  // if ( parseInt(workflow_managed.dub_place_value) == 3) {
                    // action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                  // }
                  insertAction = true
                }
              }
              // en fonction du site principal, on va afficher ou non certains éléments (volume principalement)
              // les planning de type volume et qui distinguent entre les sites, affiche en fonction du site principal du workflow
              if (action.planning == 'volume' && $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].id == workflow_managed.main_location_id) {
                 // action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                insertAction = true
              }
            } else {
              insertAction = true
            }
            if (action.service === "belgique") {
              if ((parseInt(workflowsChosen[0].dub_place_value) & 2) == 0) {
                insertAction = false;
              }
            }
            if (insertAction) {
              filteredEtapesActions.push(action);
            }
          });
          return filteredEtapesActions;
        } else {
          return etapesActions[workflowsChosen[0].workflow_type_id];
        }
      } else {
        return [];
      }
    }

    const checkIfDuplicateRequest = () => {
      isDuplicateRequests['duplicate'] = false;
      setCheckIfDuplicateRequestLoading(true);
      isDuplicateRequests['products'] = {};

      let duplicateRequestsPromise = [];

      angular.forEach(workflowsChosen, function(workflow) {
        angular.forEach(productsChosen, function(product) {
          isDuplicateRequests['products'][product.id] = {};
          isDuplicateRequests['products'][product.id]['detail'] = product;
          isDuplicateRequests['products'][product.id]['requests'] = [];
          let filters = [{
            "name": "product_id",
            "value": product.id
          }, {
            "name": "workflow_id",
            "value": workflow.id
          }, {
            "name": "action_type_id",
            "value": $scope.form.action.id
          }];
          duplicateRequestsPromise.push(RequestService.getRequestsByDefer(filters));
        });
      });

      $q.all(duplicateRequestsPromise).then(function(duplicateRequestsResponse) {
        angular.forEach(duplicateRequestsResponse, function(duplicateRequests) {
          angular.forEach(duplicateRequests, function(request) {
            if(request.is_done == '0') {
              isDuplicateRequests['products'][request.product_id]['requests'].push(request);
              isDuplicateRequests['duplicate'] = true;
            }
          });
        });
        setCheckIfDuplicateRequestLoading(false);
      });

    }

    const forceCreateDuplicate = () => isDuplicateRequests['duplicate'] = false;

    const addEtapeActionToRequest = (action, isEditMode) => {
      $scope.form.action = action;
      requestToCreate.etape_type_id = action.etape.id;
      requestToCreate.action_type_id = action.id;
      requestToCreate.planning_id = action.service;
      requestToCreate.loc_value = action.etape.loc_value 
      requestToCreate.etape_type_id = action.etape_type_id

      if (isEditMode == null || isEditMode == false) {
        if (action.planning == "volume") {
          requestToCreate.show_tech = true;
        } else {
          requestToCreate.show_tech = false;
        }
        checkIfDuplicateRequest();
        initUploaderForProducts();
        loadMediaItems();
        if (action.etape.name == 'enregistrement') {
          initArtisticDirector();
        }
      }
      if (!isMultiWorkflow) {
        checkExistingTechnicalSpec();
      }
    }

    const initArtisticDirector = () => $scope.form.artistic_director_id = productsChosen[0].artistic_director_id;

    const initSimplemde = () => {
      simplemde = new SimpleMDE({
        autoDownloadFontAwesome: false,
        toolbar: ["bold", "italic", "strikethrough", "|", "heading-1", "heading-2", "heading-3", "|", "quote", "unordered-list", "ordered-list", "table", "horizontal-rule", "|", "preview", "guide"],
        spellChecker: false,
        status: false,
        autofocus: true,
        placeholder: $rootScope._T["pflzu0pb"],
        element: document.getElementById("infoForTech")
      });
      if (requestToCreate.info_for_tech != null) {
        simplemde.value(requestToCreate.info_for_tech);
      } else {
        simplemde.value("");
      }
    }

    const checkExistingTechnicalSpec = () => {
      if (workflowsChosen.length == 1 && workflowsChosen[0] != null) {
        techspec_id = null;
        if (workflowsChosen[0].ownStepslist != null) {
          workflowsChosen[0].ownStepslist = objectInArray(workflowsChosen[0].ownStepslist);
        }
        if ($scope.form.action != null && workflowsChosen[0].ownStepslist.length != 0 && workflowsChosen[0].ownStepslist[0] != null) {
          StepsList.get({
            id: workflowsChosen[0].ownStepslist[0].id
          }, function(stepsList) {
            angular.forEach(stepsList.ownStep, function(step) {
              if (step.action_type_id == $scope.form.action.id) {
                techspec_id = step.techspec_id;
              }
            });
          });
        }
      }
    }

    const initUploaderForProducts = () => {
      angular.forEach(workflowsChosen, function(workflow) {
        angular.forEach(productsChosen, function(product) {
          if (!$scope.uploader) $scope.uploader = {}
          if (!$scope.uploader[product.id+requestToCreate.action_type_id+workflow.id]) {
            $scope.uploader[product.id+requestToCreate.action_type_id+workflow.id] = new FileUploader();
            $scope.uploader[product.id+requestToCreate.action_type_id+workflow.id].url = URL_API + "/attachments/";
            $scope.uploader[product.id+requestToCreate.action_type_id+workflow.id].headers = {
              'auth-token': $.cookie('token'),
              'app-code': Session.appCode(),
              'branch': $rootScope.user_entity.person.branch_id
            }

          }
        });
      });
    }

    const resetEtapeAction = () => {
      isEditRequest = false;
      $scope.form.action = null;
      requestToCreate.etape_type_id = null;
      requestToCreate.action_type_id = null;
      requestToCreate.planning_id = null;
      $scope.form = {};
      $scope.dt = "";
      $scope.delai_souhaite = [];
      $scope.dateStartEnd = [];
      isDuplicateRequests = {};
    }

    const setReturns = () => {
      if (return_ids.length > 0) {
        requestToCreate.returnsIds = return_ids.join();
        returns = [];
        angular.forEach(return_ids, function(id) {
          Return.get({
            id: id
          }, function(aReturn) {
            returns.push(aReturn);
          });
        });
      }
    }

    const setParentRequests = () => {
      if (request_ids.length > 0) {
        angular.forEach(request_ids, function(request_id) {
          Request.get({
            requestId: request_id
          }, function(request) {
            let product = $filter('filter')(productsChosen, {id: request.product.id}, true);
            if (product.length > 0) {
              product[0].parent_request_id = request.id;
              product[0].itemsInParentRequest = getItemsOfParentRequest(request);
            }
          })
        });
      }
    }

    const getItemsOfParentRequest = parentRequest => {
      let itemsInParentRequest = [];
      if (parentRequest.media_items.length > 0) {
        angular.forEach(parentRequest.media_items, function(item_id) {
          let item = $filter('filter')(projectMediaItems, {id: item_id}, true);
          if (item.length > 0) {
            if (item[0].reference == 1) {
              item[0].reference = true;
            } else {
              item[0].reference = false;
            }
            itemsInParentRequest.push(item[0]);
          }
        });
      }
      return itemsInParentRequest
    }

    const deleteRequest = index => {
      isEditRequest = false;
      allRequestsToCreate.splice(index, 1);
    }

    const editRequest = request => {
      if (!isAddMoreDisabled()) {
        swal({
          title: $rootScope._T["ccp7efqg"],
          text: $rootScope._T["mweuj98x"],
          type: "warning",
          showCancelButton: true,
          confirmButtonText: $rootScope._T["w7redrmn"],
          cancelButtonText: $rootScope._T["adoyhyi2"],
          closeOnConfirm: true
        }, function(isConfirm) {
          if (isConfirm) {
            addMoreActions();
            setEditRequest(request);
          } else {
            setEditRequest(request);
          }
        });
      } else {
        setEditRequest(request);
      }
    }

    const setEditRequest = request => {
      resetWorkflowsChosen();
      isMultiWorkflow = false;
      requestToCreate = angular.copy(request.requestToCreate);
      if (!Array.isArray(requestToCreate.delai_souhaite)) {
        requestToCreate.delai_souhaite = requestToCreate.delai_souhaite.split(",");
      }
      addWorkflowToRequest(requestToCreate.workflowChosen);
      addEtapeActionToRequest(requestToCreate.actionChosen, true);

      $scope.form.action = requestToCreate.actionChosen;

      if (requestToCreate.actionChosen.etape.name == 'enregistrement') {
        $scope.form.artistic_director_id = requestToCreate.artistic_director_id;
      }
      isEditRequest = true;
      if (requestToCreate.delai_souhaite != null && requestToCreate.delai_souhaite.length > 0) {
          angular.forEach(requestToCreate.delai_souhaite, function(timestamp) {
              let parse = parseInt(timestamp);
              if (!isNaN(parse)) {
                  $scope.delai_souhaite.push(parse);
              }
          });
          if($scope.delai_souhaite.length > 0)
            $scope.dt = $scope.delai_souhaite[0];
          $scope.dateStartEnd = requestToCreate.dateStartEnd;
      } else {
        $scope.delai_souhaite = [];
        $scope.dateStartEnd = [];
        $scope.dt = "";
      }

      if (simplemde !== undefined && requestToCreate.info_for_tech != null) {
        simplemde.value(requestToCreate.info_for_tech);
      } else if(simplemde !== undefined) {
        simplemde.value("");
      }

    };

    const isAddMoreDisabled = () => !showCreateRequestForm();

    const isSendRequestsEnabled = () => showCreateRequestForm() || (allRequestsToCreate.length > 0 && !getActionChosen());

    const addMoreActions = () => {
      if (!isAddMoreDisabled()) {
        let mainWorkflow_id = workflowsChosen[0].id;
        angular.forEach(workflowsChosen, function(workflow) {
          let request = angular.copy(requestToCreate);
          request.delai_souhaite = angular.copy($scope.delai_souhaite);
          request.dateStartEnd = angular.copy($scope.dateStartEnd);
          if (!Array.isArray(request.delai_souhaite)) {
            request.delai_souhaite = request.delai_souhaite.split(",");
          }
          request.workflowChosen = workflow;
          request.workflow_id = workflow.id;
          request.project = getProject().id;
          request.subproject = getSubproject().id;
          request.actionChosen = getActionChosen();
          if (simplemde !== undefined) {
            request.info_for_tech = simplemde.value();
          }

          if (request.actionChosen.etape.name == 'enregistrement') {
            request.artistic_director_id = $scope.form.artistic_director_id;
          }

          var data = {
            id: request.action_type_id + '' + request.etape_type_id + '' + request.project + '' + request.subproject + '' + request.workflowChosen.id,
            requestToCreate: request
          };
          let index = -1;
          for (let i = 0; i < allRequestsToCreate.length; i++) {
            if (allRequestsToCreate[i].id == data.id) {
              index = i;
            }
          };
          if (index < 0) {
            allRequestsToCreate.push(data);
          } else {
            allRequestsToCreate[index] = data;
          }
          if (isEditRequest) {
            isEditRequest = false;
          };
        });

        resetRequestToCreate();
      }
    }

    const sendRequests = () => {

      setCreationInProgress(true);
      if (!isAddMoreDisabled()) {
        addMoreActions();
      };
      allRequestsToCreate.forEach(function(request) {
        createRequest(request);
      });
    }

    // save the links workflow with joblines in the DB
    const createUpdateDBLinkedPhelixJoblines = data => {
        PhelixAlula.saveDBLinkedPhelixJoblines({},data, function (response) {
        });
    };

    const createRequest = async data => {
      if (isSendRequestsEnabled()) {
        let requestItems = angular.copy(data.requestToCreate.itemsInRequest);
        delete data.requestToCreate.itemsInRequest;
        delete data.requestToCreate.workflowChosen;
        delete data.requestToCreate.actionChosen;
        data.requestToCreate.dateStartEnd.forEach(function (item) {
          if (item.end_time_h) {
            item.end_time_h = item.end_time_h.value
          }
          if (item.start_time_h) {
            item.start_time_h = item.start_time_h.value
          }
        })
        let idsRequests = [];
        let requestsCreatedByAction = [];
        if (productsChosen.length > 1) {
          data.requestToCreate.in_group = true;
        } else {
          data.requestToCreate.in_group = false;
        }

        for (let product of productsChosen) {
          let request = angular.copy(data.requestToCreate);
          delete request.delai_souhaite;
          request.user_id = $.cookie('user_id');
          request.product_id = product.id;
          request.info_for_tech_product = product.info_for_tech_product;
          let comment_for_planning = request.comment_for_planning;
          delete request.comment_for_planning;
          let show_tech = request.show_tech;
          delete request.show_tech;
          delete request.loc_value
          if (product.parent_request_id != null) {
            request.parent_request_id = product.parent_request_id;
          }

          if (requestItems != null && requestItems[product.id] != null) {
            let items = [];
            requestItems[product.id].forEach(function(item) {
              items.push(item.id);
            });
            if (items.length != 0) {
              request.media_items = items.toString();
            }
          }
          // see bonsServices.factory('Request' in services.js
          await request.$save(function(requestSaved) {
            requestsCreated.push(requestSaved);
            requestsCreatedByAction.push(requestSaved);
            if (comment_for_planning != "" && comment_for_planning != null) {
              let newComment = new Comment();
              newComment.text = comment_for_planning;
              newComment.user_id = $.cookie('user_id');
              newComment.request_id = requestSaved.id;
              newComment.show_tech = show_tech;
              newComment.$save();
            }

            // en enregistre les logs uniquement pour les planning auditorium
                if(requestSaved.planning_id != undefined && requestSaved.planning_id == "auditorium"){
                    let objectDates = {};
                    objectDates.addedDates = [];
                    // on regroupe les dates
                    angular.forEach(requestSaved.ownFarmerbookings, function(date_wished_added) {
                        let day = moment(date_wished_added.day).format("DD/MM/YYYY");
                        objectDates.addedDates.push(day);
                    });

                  let ObjectParams = {
                                planning_service: requestSaved.planning_id, // "auditorium"
                                client_id: requestSaved.product.subproject.project.client_id,
                                request_id: requestSaved.id,
                                user_id: Session.userId(),
                                project_id: requestSaved.project,
                                subproject: requestSaved.subproject,
                                product_id: requestSaved.product_id,
                                etape_id: requestSaved.etape_type_id,
                                action_id: requestSaved.action_type_id,
                                date_added: null,
                                date_removed: null,
                                type_product: requestSaved.product.description_id,
                                type_operation: 'Création demande'
                            };
                  // Verifier et enregistrer les logs
                 RequestService.checkIsPlanningAlert(objectDates,ObjectParams);
                }

            newActivityLogRequest(new Comment(), $.cookie('user_id'), requestSaved.id, $rootScope._T["irfc6bfr"]);
            idsRequests.push(requestSaved.id);

            if ($scope.uploader && Object.keys($scope.uploader).length != 0) {
              $scope.uploader[requestSaved.product.id+requestSaved.action_type_id+requestSaved.workflow_id].onSuccessItem = function (item, response, status, headers) {
                if (response.error != null) {
                  swal({
                    title: $rootScope._T["u2x0u77c"],
                    text: $rootScope._T["0yc3hrfk"],
                    type: "error",
                    confirmButtonText: "OK"
                  });
                }
              };
              $scope.uploader[requestSaved.product.id+requestSaved.action_type_id+requestSaved.workflow_id].onErrorItem = function (item, response, status, headers) {
                if (response.error != null) {
                  swal({
                    title: $rootScope._T["u2x0u77c"],
                    text: $rootScope._T["0yc3hrfk"],
                    type: "error",
                    confirmButtonText: "OK"
                  });
                }
              };
              $scope.uploader[requestSaved.product.id+requestSaved.action_type_id+requestSaved.workflow_id].queue.forEach(function (item) {
                if (item.formData[0] == null) {
                  item.formData.push({
                    request_id: requestSaved.id
                  });
                  item.upload();
                }
              });
            }
            if (requestsCreatedByAction.length == productsChosen.length) {
              if (productsChosen.length != 1) {
                RequestService.regroupDefer(idsRequests[0]);
              }
              setStep(2);
              setCreationInProgress(false);

              var notifDesc = $rootScope._T["bxxh9ox6"]
              if (data.requestToCreate.important != null) {
                notifDesc += "<br/> <strong>" + $rootScope._T["4orz1fdr"] + "</strong>";
              }
              var services = "planning"
              if (requestSaved.planning_id == 'digital-media') {
                services += ",digitalmedia"
              }
              sendStandardNotif(
                new NotificationService(),
                requestsCreatedByAction,
                services,
                $rootScope._T["y9ckxgru"],
                notifDesc,
                $filter,
                "creation",
                $rootScope
              );
              if (getSubproject().tableausuivi_id == null) {
                //Création d'un nouveau tableau à la volée
                var newTab = new TableauSuivi();
                newTab.subproject_id = getSubproject().id;
                newTab.$save({}, function() {
                  getSubproject().tableausuivi_id = newTab.id;
                  broadcastNewDemand(data.requestToCreate);
                });
              } else {
                broadcastNewDemand(data.requestToCreate);
              }
            }
            // create /update the linked request joblines Phelix
            try {
                let requiredWorkflowValues = [  requestSaved.product.record_job_id,
                                                requestSaved.id, // request_id
                                                requestSaved.workflow.doublage_type_id, 
                                                requestSaved.workflow.workflow_type_id,
                                                requestSaved.workflow.format_mix_id, 
                                                requestSaved.user_id,
                                                requestSaved.product.subproject.project.client_id,
                                                requestSaved.action_type_id,
                                                requestSaved.workflow.language_id
                                                ];
                    
              let is_valid_workflow_values_phelix = $rootScope.check_valid_workflow_values_phelix(requiredWorkflowValues,requestSaved.workflow.workflow_type_id, requestSaved.workflow.doublage_type_id,requestSaved.workflow.format_mix_id,requestSaved.product.subproject.project.client_id,requestSaved.action_type_id, requestSaved.workflow.language_id);
              if(is_valid_workflow_values_phelix){ 
                let dataPhelix = {
                                  request_id:requestSaved.id,
                                  record_id:requestSaved.product.record_job_id,
                                  workflow_type_id:requestSaved.workflow.workflow_type_id, 
                                  doublage_type_id:requestSaved.workflow.doublage_type_id,
                                  format_mix_id:requestSaved.workflow.format_mix_id, 
                                  user_id:requestSaved.user_id,
                                  language_id:requestSaved.workflow.language_id
                                };
                createUpdateDBLinkedPhelixJoblines(dataPhelix);
              }
            }catch(error){
              console.error(error);
            }
          }, function() {
            swal({
              title: $rootScope._T["t9coa94k"],
              text: $rootScope._T["zvxj32q7"],
              type: "error",
              confirmButtonText: "OK"
            });
          })
        }
      } else {
        sweetAlert($rootScope._T["mx7q7rbm"], $rootScope._T["69a1wluw"], "error");
      }
    }

    const broadcastNewDemand = data => {
      $rootScope.$broadcast('createNewDemand', {
        action_id: data.action_type_id,
        workflow_id: data.workflow_id,
        tableausuivi_id: getSubproject().tableausuivi_id
      });
    }

    const resetRequestToCreate = () => {
      resetEtapeAction();
      requestToCreate = new Request();
    }

    const addRemoveMediaItem = (mediaItem, product) => {
      let index = getItemIndexInRequestAndProduct(mediaItem, product);
      if (index >= 0) {
        requestToCreate.itemsInRequest[product.id].splice(index, 1);
      } else {
        requestToCreate.itemsInRequest[product.id].push(mediaItem);
      }
    }

    const getItemIndexInRequestAndProduct = (mediaItem, product) => {
      let index = -1;
      if (requestToCreate.itemsInRequest != null && requestToCreate.itemsInRequest[product.id] != null) {
        for (let i = 0; i < requestToCreate.itemsInRequest[product.id].length; ++i) {
          if (requestToCreate.itemsInRequest[product.id][i].id == mediaItem.id) {
            index = i;
            break;
          }
        }
      }
      return index;
    }

    const showWorkflowsOnSelectedProducts = () => {
      for(let i = 0; i < productsChosen.length; i++) {
        let product = productsChosen[i];
        if (!product || !product.sharedWorkflow || product.sharedWorkflow.length == 0) {
          workflows = [];
          break;
        } else {
          angular.forEach(product.sharedWorkflow, function(workflow) {
            product.sharedWorkflow = objectInArray(product.sharedWorkflow);
            workflow.color = colorizeWorkflow(workflow);
            workflow.description = WorkflowHelperService.describeWorkflow(workflow);
            if (workflows.length == 0) {
              workflows = product.sharedWorkflow;
            } else {
              let temp = [];
              angular.forEach(workflows, function(workflow) {
                if ($filter('filter')(product.sharedWorkflow, {id: workflow.id}, true).length == 1) {
                  temp.push(workflow);
                }
              })
              workflows = temp;
            }
          });
        }
      }
    }

    const addWorkflowToRequest = workflow => {
      ValueListService.filterEtapes(1, JSON.parse(JSON.stringify($rootScope.allEtapes)) , workflow, function (etapes_actions) {
        $scope.etapes_actions = etapes_actions
      })
      resetEtapeAction();
      if (isMultiWorkflow) {
        if (!isWorkflowChosen(workflow.id)) {
          if (isWorkflowTypeDifferent(workflow.workflow_type_id)) {
            resetWorkflowsChosen();
          }
          workflowsChosen.push(workflow);
        } else {
          workflowsChosen = workflowsChosen.filter(function(wf) { return wf.id != workflow.id; });
        }
      } else {
        resetWorkflowsChosen();
        workflowsChosen.push(workflow);
      }
      setErrorOnWorkflow(false);
    }

    const autoSelectWorkflows = () => {
      if (workflow_ids.length > 0) {
        angular.forEach(workflow_ids, function(workflowId) {
          let workflowChosen = $filter('filter')(workflows, {
            'id': workflowId
          }, true);
          if (workflowChosen[0] != null) {
            addWorkflowToRequest(workflowChosen[0]);
          } else {
            setErrorOnWorkflow(true);
          }
        });
      }
    }

    const autoSelectEtapeAction = () => {
      if (etape_action_id != null && workflowsChosen.length > 0) {
        let action = $filter('filter')($scope.etapes_actions, {
          'id': etape_action_id
        }, true);
        if (action.length > 0) {
          addEtapeActionToRequest(action[0]);
        }
      }
    }

    const initMediaItems = () => {
      angular.forEach(productsChosen, function(product) {
        if (product) {
          productsMediaItems[product.id] = []
          productsMediaItems[product.id] = MediaItems.findbyproduct({
            product_id: product.id
          }, function(items) {
            productsMediaItems[product.id] = getItemsDescription(productsMediaItems[product.id]);
          });
        }
      })
      projectMediaItems = MediaItems.findbyproject({
        project_id: getProject().id
      }, function() {
        projectMediaItems = getItemsDescription(projectMediaItems);
        setParentRequests();
      });
    }

    const loadMediaItems = () => {
      if (requestToCreate.itemsInRequest == null) {
        requestToCreate.itemsInRequest = {}
      }
      productsChosen.forEach(function(product) {
        if (requestToCreate.itemsInRequest[product.id] == null) {
          requestToCreate.itemsInRequest[product.id] = []
        }
        if (product.itemsInParentRequest != null) {
          product.itemsInParentRequest = getItemsDescription(product.itemsInParentRequest);
          product.itemsInParentRequest.forEach(function(item) {
            requestToCreate.itemsInRequest[product.id].push(item);
          });
        } else {
          if (workflowsChosen[0].workflow_type_id != 3) {
            let items = getMediaItemsByMatch("doublage", getActionChosen().etape.name, getActionChosen().name, productsMediaItems[product.id]);
            requestToCreate.itemsInRequest[product.id] = getItemsDescription(items);
          }
        }
      })
    }

    const showLink = () => {
      if (noLink) {
        return false;
      } else if (linkSaved || linkError) {
        return false;
      } else if (requestsCreated && productsChosen) {
        return (requestsCreated.length / productsChosen.length) > 1;
      } else {
        return false;
      }
    }

    const getLinkSaved = () => linkSaved;
    const getLinkError = () => linkError;
    const getNoLink = () => noLink;

    const linkRequests = link => {
      if (link) {
        let requestsToLink = [];
        angular.forEach(requestsCreated, function(request) {
          requestsToLink.push(request.id);
        });
        let request_ids = requestsToLink.toString();
        RequestService.linkRequests({"request_ids": request_ids}, function(success) {
          linkSaved = true;
          linkError = false;
          noLink = false;
        }, function(error) {
          linkError = true;
          linkSaved = false;
          noLink = false;
        });
      } else {
        linkSaved = false;
        linkError = false;
        noLink = true;
      }
    }


    const initByStep = () => {
      let etapesActionsPromises = [];
      for (let i = 1; i <= 3; i++) {
          if ($rootScope.etapesActionsBase[i]) {
            etapesActions[i] =  $rootScope.etapesActionsBase[i]
          } else {
              etapesActionsPromises.push(ValueListService.getEtapeActionByWorkflowDefer(i));
          }
      }

      PersonsService.getArtisticDirectors(function(directors) {
        artisticDirectors = directors;
      });

      $q.all(etapesActionsPromises).then(function(etapesActionsResponse) {
        // ValueListService.initEtapesActions(etapesActionsResponse)

        let productPromises = [];
        angular.forEach(getProductIds(), function (productId) {
          productPromises.push(ProductService.getProductDefer(productId));
        });

        $q.all(productPromises).then(function(productResponse) {
          setProducts(productResponse);

          setReturns();

          initMediaItems();

          showWorkflowsOnSelectedProducts();
          autoSelectWorkflows();
          autoSelectEtapeAction();
          setLoading(false);
        });

      });

    }

    const init = () => {
      setLoading(true);
      setProductIds($scope.ngDialogData.product_ids);
      setWorkflowIds($scope.ngDialogData.workflow_ids);
      setRequestIds($scope.ngDialogData.request_ids);
      setReturnIds($scope.ngDialogData.return_ids);
      setEtapeActionId($scope.ngDialogData.etape_action_id);
      ValueListService.filterEtapes(1, JSON.parse(JSON.stringify($rootScope.allEtapes)) , $scope.ngDialogData.workflow, function (etapes_actions) {
        $scope.etapes_actions = etapes_actions
      })
      initByStep();

    }
    $scope.getPresetTimes = presetTimeBase(Session.branchId())
    init();

    $scope.isLoading = () => getLoading();
    $scope.getProject = () => $scope.getSubproject().project;
    $scope.getSubproject = () => getMainProduct(getProducts()).subproject;
    $scope.getProducts = () => getProducts();
    $scope.getMainProduct = () => getMainProduct(getProducts());
    $scope.getAllRequestsToCreate = () => getAllRequestsToCreate();
    $scope.getWorkflows = () => getWorkflows();
    $scope.getStep = () => getStep();
    $scope.setMultiWorkflow = value => setMultiWorkflow(value);
    $scope.getMultiWorkflow = () => getMultiWorkflow();
    $scope.isMultiWorkflowAllowed = () => isMultiWorkflowAllowed();
    $scope.addWorkflowToRequest = workflow => addWorkflowToRequest(workflow);
    $scope.isWorkflowChosen = workflowId => isWorkflowChosen(workflowId);
    $scope.getErrorOnWorkflow = () => getErrorOnWorkflow();
    $scope.getWorkflowsChosen = () => getWorkflowsChosen();
    $scope.getActionChosen = () => getActionChosen();
    $scope.getEtapesActions = () => getEtapesActions();
    $scope.addEtapeActionToRequest = action => addEtapeActionToRequest(action);
    $scope.getRequestToCreate = () => getRequestToCreate();
    $scope.getPlanning = () => getPlanning();
    $scope.getIsDuplicateRequests = () => getIsDuplicateRequests();
    $scope.isDuplicateRequestLoading = () => getCheckIfDuplicateRequestLoading();
    $scope.forceCreateDuplicate = () => forceCreateDuplicate();
    $scope.showCreateRequestForm = () => showCreateRequestForm();
    $scope.getTechspec = () => getTechspec();
    $scope.getProductMediaItems = productId => getProductMediaItems(productId);
    $scope.getProjectMediaItems = () => getProjectMediaItems();
    $scope.addRemoveMediaItem = (mediaItem, product) => addRemoveMediaItem(mediaItem, product);
    $scope.getItemIndexInRequestAndProduct = (mediaItem, product) => getItemIndexInRequestAndProduct(mediaItem, product);
    $scope.getReturns = () => getReturns();
    $scope.isAddMoreDisabled = () => isAddMoreDisabled();
    $scope.isSendRequestsEnabled = () => isSendRequestsEnabled();
    $scope.addMoreActions = () => addMoreActions();
    $scope.sendRequests = () => sendRequests();
    $scope.resetRequestToCreate = () => resetRequestToCreate();
    $scope.deleteRequest = index => deleteRequest(index);
    $scope.editRequest = request => editRequest(request);
    $scope.getEditRequest = () => getEditRequest();
    $scope.getRequestsCreated = () => getRequestsCreated();
    $scope.isCreationInProgress = () => getCreationInProgress();
    $scope.showLink = () => showLink();
    $scope.isLinkSaved = () => getLinkSaved();
    $scope.isLinkError = () => getLinkError();
    $scope.isNoLink = () => getNoLink();
    $scope.linkRequests = link => linkRequests(link);
    $scope.getArtisticDirectors = () => getArtisticDirectors();
    $scope.initSimplemde = () => initSimplemde();

    /** since 2020/02, table is cached, so refreshing requires to clean the cache */
    $scope.cleanTable = function () {

      dataSync.stopSynchro();
      let subproject_id = getSubproject().id;
      delete($rootScope.subprojects[subproject_id])
    } 

    $scope.showTechnicalSpecModal = function() {
      $scope.isProd = true;
      $scope.techspec_id = techspec_id;
      ngDialog.open({
        template: 'views/Dialog/TechnicianTechnicalSpecDialog.html',
        className: 'ngdialog-theme-default dialogwidth80p',
        scope: $scope,
        controller: 'TechnicalSpecCtrl',
        closeByDocument: false
      });
    }

    $scope.allDates = {
      day: null,
      start_time_h: null,
      start_time_m: null,
      end_time_h: null,
      end_time_m: null
    };

    $scope.isShowDatesDetails = true;

    $scope.showDatesDetails = function() {
      $scope.isShowDatesDetails = !$scope.isShowDatesDetails;
    }

    $scope.changeDay = function(dt) {
      let day = moment(dt).format("YYYY-MM-DD HH:mm:ss");
      let dates = $filter('filter')($scope.dateStartEnd, {
        'day': day
      }, true);
      if (dates.length > 0) {
        let index = $scope.dateStartEnd.indexOf(dates[0]);
        $scope.dateStartEnd.splice(index, 1);
      } else {
        let data = {
          day: day,
          start_time_h: $scope.allDates.start_time_h,
          start_time_m: $scope.allDates.start_time_m,
          end_time_h: $scope.allDates.end_time_h,
          end_time_m: $scope.allDates.end_time_m
        };
        $scope.dateStartEnd.push(data);
      }
    }

    // return preset times
    $scope.setTime = function(date, preset) {
      setTimeDateWishByBranch(Session.branchId(), date, preset)
      if (date.day == null) {
        $scope.setAllTimes(0);
      }
    }

    $scope.setAllTimes = function(i) {
      angular.forEach($scope.dateStartEnd, function(date) {
        if (i == 1) {
          date.start_time_h = $scope.allDates.start_time_h;
        } else if (i == 2) {
          date.start_time_m = $scope.allDates.start_time_m;
        } else if (i == 3) {
          date.end_time_h = $scope.allDates.end_time_h;
        } else if (i == 4) {
          date.end_time_m = $scope.allDates.end_time_m;
        } else {
          date.start_time_h = $scope.allDates.start_time_h;
          date.start_time_m = $scope.allDates.start_time_m;
          date.end_time_h = $scope.allDates.end_time_h;
          date.end_time_m = $scope.allDates.end_time_m;
        }
      });
    }

    $scope.isDifferentWeek = function(date, previousDate) {
      return moment(date).format("w") != moment(previousDate).format("w");
    }

    var store_holydays = null;

      if(localStorage.getItem('holydays') === null){
        var holiday = function(){
          var deferred = $q.defer();
          Request.getHolydays(
            function(result){
              deferred.resolve(result)
            }
          );
          return deferred.promise;
        }
        
        $scope.holydays = holiday().then(function (holydays) {
            var str_holydays = JSON.stringify(holydays);
            localStorage.setItem('holydays', str_holydays);
             store_holydays = localStorage.getItem('holydays');
             holidays();
        }, function (error) {
          console.error(error)
        });
      }else{
        store_holydays = localStorage.getItem('holydays');
        holidays();
      }
  
      
  
      $scope.options = {
        //dateDisabled: disabled,
        'startingDay': 1,
        customClass: getDayClass
      };
  
      /* function disabled(data) {
        var date = data.date;
        var mode = data.mode;
        return mode === 'day' && (store_holydays.indexOf(moment(date).format("YYYY-MM-DD")) > -1);
      } */
      function holidays(){
        $scope.events = [];
        let store_holydays_parse = JSON.parse(store_holydays);
        for(var i=0; i < store_holydays_parse.length; i++){
          $scope.events.push({date: store_holydays_parse[i], status: 'ferie'})
        }
      }
  
      function getDayClass(data) {
        var date = data.date;
        var mode = data.mode;
        if (mode === 'day') {
          var dayToCheck = new Date(moment(date).format("YYYY-MM-DD")).setHours(0, 0, 0, 0);
          if ($scope.events != undefined) {
            for (var i = 0; i < $scope.events.length; i++) {
              var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);
              if (dayToCheck === currentDay) {
                return $scope.events[i].status;
              }
            }
          }
        }
        return '';
      }

  }]);
