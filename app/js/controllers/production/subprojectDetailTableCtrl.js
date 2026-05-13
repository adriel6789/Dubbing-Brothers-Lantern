Lantern.controller('SubprojectDetailTableCtrl', ['$rootScope', '$scope', '$q', '$location', '$cookies', '$state', '$stateParams', '$filter', 'ngDialog', 
'Project', 'Subproject', 'Workflow', 'Request', 'Return', 'VisDataSet', 'Product', 'Attachments', 'ContextualInfo', 'SubProjectsService', 'EVENTS', 'WorkflowHelperService',
  function ($rootScope, $scope, $q, $location, $cookies, $state, $stateParams, $filter, ngDialog, Project, 
    Subproject, Workflow, Request, Return, VisDataSet, Product, Attachments, ContextualInfo, SubProjectsService, EVENTS, WorkflowHelperService) {
    var rest = {};
    var helper = {};
    $rootScope.$broadcast(EVENTS.loadingProgress);

    rest.getSubProjects = function() {
      SubProjectsService.getSubProjects({
        id: $stateParams.id
      }, function(subproject) {
        $scope.subproject = subproject;
        var allWorkflows = [];
        angular.forEach(subproject.ownProduct, function(product) {
          product.hasRequests = false;
          product.isSelected = false;
          angular.forEach(product.sharedWorkflow, function(workflow) {
            $scope.limit[product.id + "_" + workflow.id] = 2;
            workflow.color = colorizeWorkflow(workflow);
            workflow.isSelected = false;
            workflow.description = WorkflowHelperService.describeWorkflow(workflow);

            //Check exist
            var exist = false;
            allWorkflows.forEach(function(wf) {
              if (wf.id == workflow.id) {
                exist = true;
              }
            });

            if (!exist) {
              allWorkflows.push(workflow);
            }
          });
        });

        $scope.subproject_workflows = allWorkflows;
        if ($scope.subproject_workflows.length >= 1) {
          $scope.workflowSelected(allWorkflows[0]);
        } else {
          swal({
            title: $rootScope._T["vd9534ss"],
            text: $rootScope._T["eojdz4rh"],
            type: "warning",
            showCancelButton: true,
            confirmButtonText: $rootScope._T["w7redrmn"],
            cancelButtonText: $rootScope._T["adoyhyi2"],
            closeOnConfirm: true
          }, function() {
            $scope.createWorkflow()
          });
        }

        $scope.projet = subproject.project;
        $rootScope.$broadcast(EVENTS.loadingDone);

      });
    };

    $scope.limit = [];
    $scope.defaults = {
      orientation: ['top', 'bottom'],
      autoResize: [true, false],
      showCurrentTime: [true, false],
      showCustomTime: [true, false],
      showMajorLabels: [true, false],
      showMinorLabels: [true, false],
      align: ['left', 'center', 'right'],
      stack: [true, false],

      moveable: [true, false],
      zoomable: [true, false],
      selectable: [true, false],
      editable: [true, false]
    };

    $scope.options = {
      align: 'center',
      autoResize: true,
      editable: false,
      selectable: false,
      start: moment().add(-5, 'weeks'),
      end: moment().add(1, 'weeks'),
      orientation: 'bottom',
      showCurrentTime: true,
      showMajorLabels: true,
      showMinorLabels: true,
      zoomable: false,
      locale: 'fr'
    };

    $scope.url_api = URL_API;

    $scope.getTimelineByProductAndWorkflow = function(product, selectedWorkflowFilter) {
      var data = {};
      angular.forEach(product.sharedWorkflow, function(workflow) {
        if (workflow.id == selectedWorkflowFilter.id) {
          data = workflow.data;
        }
      });
      return data;
    };

    rest.init = function() {
      rest.getSubProjects();
    }();

    $scope.createProduct = function() {
      $scope.subproject_id = $scope.subproject.id;
      $scope.subproject_nature = $scope.subproject.nature;
      $scope.subproject_season = $scope.subproject.season;

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        template: 'views/Dialog/wizardCreation.html',
        scope: $scope,
        width: '80%',
        resolve: {
          stepForce: function() {
            return true;
          }
        },
        controller: 'WizardCreationCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        $state.reload();
      });
    };

    $scope.createSubProject = function() {
      $scope.project_id = $scope.projet.id;
       Project.get({
        projectId: $scope.projet.id
       }, function (project) {
         $scope.newProject = project;
        $scope.projectForSubProject = project;
        var dialog = ngDialog.open({
          className: 'ngdialog-theme-demand popup',
          template: 'views/Dialog/wizardCreation.html',
          scope: $scope,
          width: '80%',
          resolve: {
            stepForce: function() {
              return true;
            }
          },
          controller: 'WizardCreationCtrl',
          closeByDocument: false
        });

        dialog.closePromise.then(function() {
          //$state.reload();
        });
      })

    };

    $scope.createWorkflow = function() {
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        template: 'views/Dialog/createWorkflow.html',
        scope: $scope,
        width: '80%',
        controller: 'CreateWorkflowDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        $state.reload();
      });
    };

    $scope.editWorkflow = function(workflow) {
      $scope.workflowToEdit = workflow;
      $scope.workflowProducts = $filter('workflowFilter')($scope.subproject.ownProduct, workflow);

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand dialogwidth80p',
        template: 'views/Dialog/editWorkflow.html',
        scope: $scope,
        controller: 'EditWorkflowDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        $state.reload();
      });
    };


    //   $scope.getProjectWorkflow = function(product, workflow) {
    //     if (product.ownWorkflow != null && workflow != null) {
    //       var theReturn = null;
    //       product.ownWorkflow.forEach(function(product_workflow) {
    //         if (
    //           product_workflow.workflow_type_id == workflow.workflow_type_id &&
    //           product_workflow.norme_mix_id == workflow.norme_mix_id &&
    //           product_workflow.format_mix_id == workflow.format_mix_id &&
    //           product_workflow.language_id == workflow.language_id &&
    //           product_workflow.version == workflow.version
    //         ) {
    //           //console.log('found !');
    //           //console.log(product_workflow);
    //           theReturn = product_workflow;
    //         }
    //       });
    //       return theReturn;
    //     }
    //   };


    $scope.selectAllProducts = function(subproject) {
      subproject.ownProduct.forEach(function(value, key) {
        value.selected = subproject.master;
      })
    }
    $scope.unSelectAllProducts = function() {
      $scope.subproject.master = false;
      $scope.subproject.ownProduct.forEach(function(value, key) {
        value.selected = false;
      })
    }

    $scope.isProductSelected = function(products) {
      var selected = false;
      if (products != null) {
        products.forEach(function(value, key) {
          if (value.selected == true) selected = true;
        })
      }
      return selected;
    };

    $scope.allWorkflowsSelected = true;

    $scope.newRequestFromProduct = function(products) {
      var productsSelected = $filter('filter')(products, {
        selected: true
      });
      var count = 0;
      var size = productsSelected.length;
      if (productsSelected.length != 0) {
        var allProductsId = [];
        productsSelected.forEach(
          function(product, index) {
            //Stocker l'ID des products
            allProductsId.push(product.id);
            count++;
            if (count == size) {
              $scope.unSelectAllProducts();
            }

          }
        )

      }
    };

    $scope.workflowSelected = function(workflow) {

      $scope.unSelectAllProducts();
      $scope.selectedWorkflowFilter = workflow;
      $scope.allWorkflowsSelected = false



      $scope.subproject.ownProduct.forEach(function(product) {
        if (product.requestsWorkflow == null) {
          product.requestsWorkflow = {}
        }
        if (product.requestsWorkflow[workflow.id] == null) {
          product.requestsWorkflow[workflow.id] = {}

          var filters = [{
            "name": "product_id",
            "value": product.id
          }, {
            "name": "workflow_id",
            "value": workflow.id
          }];

          Request.getRequestsBy({
            filters: [filters]
          }, function(requests) {
            var requestsPrepaAudio = []
            var requestsEnregistrement = []
            var requestsMixage = []
            var requestsMontage = []
            var requestsFabrication = []
            angular.forEach(requests, function(request) {
              if (request.action_type.etape_type.name == 'prepa_audio') {
                requestsPrepaAudio.push(request)
              } else if (request.action_type.etape_type.name == 'enregistrement') {
                requestsEnregistrement.push(request)
              } else if (request.action_type.etape_type.name == 'mixage') {
                requestsMixage.push(request)
              } else if (request.action_type.etape_type.name == 'montage') {
                requestsMontage.push(request)
              } else if (request.action_type.etape_type.name == 'fabrication') {
                requestsFabrication.push(request)
              }
            })
            product.requestsWorkflow[workflow.id].lastPrepaAudio = requestsPrepaAudio[requestsPrepaAudio.length - 1]
            product.requestsWorkflow[workflow.id].lastEnregistrement = requestsEnregistrement[requestsEnregistrement.length - 1]
            product.requestsWorkflow[workflow.id].lastMixage = requestsMixage[requestsMixage.length - 1]
            product.requestsWorkflow[workflow.id].lastMontage = requestsMontage[requestsMontage.length - 1]
            product.requestsWorkflow[workflow.id].lastFabrication = requestsFabrication[requestsFabrication.length - 1]
          })

          //Récupération des retours associés aux produits
          product.ownReturns = Return.querybyproductid({
            product_id: product.id
          });
          //Récupération des PJ associées aux produits
          product.ownAttachments = Attachments.byProductId({
            product_id: product.id
          });

          //Récupération des infos contextuelles
          product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: product.id
          });
        }
      })

    };

    function getRequestByWorkflowAndProduct(workflow, product) {

      var filtersRequest = [{
        "name": "workflow_id",
        "value": workflow.id
      }, {
        "name": "product_id",
        "value": product.id
      }];
      return Request.getRequestsBy({
        filters: [filtersRequest]
      }, function(requests) {
        var data = [];
        workflow.requestsNotDone = 0;

        var content_part1 = "<i>(pas de valeur)</i>";
        if (workflow.format_mix != null) {
          content_part1 = workflow.format_mix.value;
        } else if (workflow.type_servicing) {
          content_part1 = workflow.type_servicing.value;
        }
        var content_part2 = "<i>(pas de valeur)</i>";
        if (workflow.norme_mix != null) {
          content_part2 = workflow.norme_mix.value;
        } else if (workflow.diffuseur != null) {
          content_part2 = workflow.diffuseur.value;
        }
        workflow.content = "<label style='color: black'>" + content_part1 + " - " + content_part2 + "</label><br>";

        requests.forEach(function(request) {

          var item = {};
          var contentReturn = "";

          product.hasRequests = true;

          var colorFlag = "black"; // non planifiée
          var tooltipFlag = $rootScope._T["5j1nv2tu"]
          if (request.is_done == 1 && request.is_not_done == 0 && request.is_sent_back == 1) {
            colorFlag = "green"; // terminée
            tooltipFlag = $rootScope._T["46z910du"]
          } else if (request.is_not_done == 1) {
            colorFlag = "darkorange" // replanifiée
            tooltipFlag = $rootScope._T["9d3vvwuk"]
          } else if ((request.is_planned == 1 || request.is_in_progress == 1) && !(request.is_done == 1 || request.is_not_done == 1)) {
            colorFlag = "deepskyblue" // planifiée
            tooltipFlag = $rootScope._T["5dd4lerz"]
          }

          if (request.ownReturn.length != 0) {
            tooltipFlag += " - " + $rootScope._T["g3740ab1"];
            contentReturn = '<i class="glyphicon glyphicon-flag" style="color: red" title="' + tooltipFlag + '"></i> ';
          }

          request.tooltipFlag = tooltipFlag;

          var content = "";
          if ($rootScope.canDisplay(4)) {
            content = contentReturn +
              '<i class="glyphicon glyphicon-record" style="color: ' + colorFlag + '" title="' + tooltipFlag + '"></i> ' +
              '<a href="#/requests/detail/' + request.id + '">' +
              request.action_type.etape_type.value + " - " + request.action_type.value +
              '</a>';
          } else {
            if (request.action_type.etape_type == null) console.log("Error RID : " + request.id);
            content = contentReturn +
              '<i class="glyphicon glyphicon-record" style="color: ' + colorFlag + '" title="' + tooltipFlag + '"></i> ' +
              '<a href="#/requests/detail/' + request.id + '">' +
              request.action_type.etape_type.value + " - " + request.action_type.value +
              '</a>';
          }

          if (request.is_done != 1) {
            workflow.content += content + "<br>";
            workflow.requestsNotDone += 1;
          }

          var start = request.date_creation;
          if (request.closing_date != null) {
            start = request.closing_date;
          } else if (request.planification_date != null) {
            start = request.planification_date;
          }
          item = {
            content: content,
            start: start
          };

          data.push(item);
        });

        workflow.data = {
          items: VisDataSet(data)
        };


      });

    }

    $scope.isWorkflowSelected = function(workflow) {
      var show = false;
      $scope.subproject_workflows.forEach(function(wf) {
        if (wf.id == workflow.id) {
          workflow.isSelected = wf.isSelected;
          if (wf.isSelected) {
            show = true;

          }
        }
      });
      return show;
    };




    $scope.doneEditing = function(element, product) {
      updatedProduct = new Product();
      updatedProduct[element] = product[element];
      updatedProduct.$update({
        productId: product.id
      }, function(data) {
        //Mettre un indicateur d'update
      }, function(data) {
        return "Error " + data.status + " : " + data.statusText;
      });
    };

    $scope.lastRequest = function(product, workflow) {
      var last_request = null;

      var workflowsSelected = $filter('filter')(product.sharedWorkflow, {
        id: workflow.id
      }, true);
      if (workflowsSelected.length > 0) {
        if (workflowsSelected[0].ownRequests != null && workflowsSelected[0].ownRequests.length > 0) {
          last_request = workflowsSelected[0].ownRequests[workflowsSelected[0].ownRequests.length - 1];
        }
      }

      return last_request;
    };

    $scope.count = function(objects) {
      var count = 0;
      angular.forEach(objects, function() {
        count++;
      });
      return count;
    };

    $scope.lastRequestStep = function(product, workflow, etape) {
      var last_request = null;
      if ($scope.last_request == null) {
        $scope.last_request = {}
      }
      if ($scope.last_request[product.id] == null) {
        $scope.last_request[product.id] = {}
      }
      if ($scope.last_request[product.id][workflow.id] == null) {
        $scope.last_request[product.id][workflow.id] = {}
      }
      if ($scope.last_request[product.id][workflow.id][etape] == null) {
        $scope.last_request[product.id][workflow.id][etape] = {}

        var workflowsSelected = $filter('filter')(product.sharedWorkflow, {
          id: workflow.id
        }, true);
        if (workflowsSelected.length > 0) {
          if (workflowsSelected[0].ownRequests == null) {
            workflowsSelected[0].ownRequests = getRequestByWorkflowAndProduct(workflowsSelected[0], product)
          } else if (workflowsSelected[0].ownRequests != null && workflowsSelected[0].ownRequests.length > 0) {
            var requestsSelected = $filter('filter')(workflowsSelected[0].ownRequests, {
              action_type: etape
            }, true);
            if (requestsSelected.length > 0) {
              last_request = requestsSelected[requestsSelected.length - 1]
            }
          }
        }

        $scope.last_request[product.id][workflow.id][etape] = last_request

      } else if ($scope.last_request != null &&
        $scope.last_request[product.id] != null &&
        $scope.last_request[product.id][workflow.id] != null &&
        $scope.last_request[product.id][workflow.id][etape] != null) {
        last_request = $scope.last_request[product.id][workflow.id][etape]
      }

      return last_request;
    };

    $scope.countReturn = function(product, workflow) {
      var count = 0;
      if (product.ownReturns != null) {
        product.ownReturns.forEach(function(aReturn) {
          if (aReturn.workflow_id == workflow.id) {
            if (aReturn.is_ignored == 0 && aReturn.is_resolved == 0) {
              count++;
            }
          }
        });
      }

      return count;
    }

    $scope.attachmentsOnWorkflow = function(product, workflow) {
      var allAttachments = [];
      if (product.ownAttachments != null) {
        product.ownAttachments.forEach(function(attachment) {
          if (attachment.workflow_id == workflow.id) {
            allAttachments.push(attachment);
          }
        });
      }
      return allAttachments;
    };

    $scope.returnContextInfo = function(product, name, workflow) {
      var info = {};
      var found = false;
      if (product.ownContextualInfos != null) {
        product.ownContextualInfos.forEach(function(contextinfo) {
          if (contextinfo.workflow_id == workflow.id && contextinfo.name == name && !found) {
            info = contextinfo;
            found = true;
          }
        });
      }
      return info;
    };

    var validDateFormat = ["DD/MM/YYYY", "DD/MM/YY", "DD/M/YYYY", "DD/M/YY", "D/MM/YYYY", "D/MM/YY", "D/M/YYYY", "D/M/YY", "DD/MM", "DD/M", "D/MM", "D/M", "DD-MM-YYYY", "DD-MM-YY", "DD-M-YYYY", "DD-M-YY", "D-MM-YYYY", "D-MM-YY", "D-M-YYYY", "D-M-YY", "DD-MM", "DD-M", "D-MM", "D-M"];

    $scope.validateContextualDueDate = function(data) {
        if (moment(data, validDateFormat, true).isValid() || data == "") {
          return true;
        } else {
          return $rootScope._T["n5ix7my4"]
        }
    }

    $scope.doneEditingContextual = function(context, product, workflow, element) {
      if (context.id != null && context.id != 0) {
        updatedContext = new ContextualInfo();
        updatedContext.value = context.value;
        if (element == "due_date" && updatedContext.value != "") {
          updatedContext.value = moment(updatedContext.value, validDateFormat, true).format("DD/MM/YYYY");
        }
        updatedContext.$update({
          id: context.id
        }, function(data) {
          //Mettre un indicateur d'update
          product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: product.id
          });
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      } else {
        newContext = new ContextualInfo();
        newContext.value = this.$data;
        if (element == "due_date" && newContext.value != "") {
          newContext.value = moment(newContext.value, validDateFormat, true).format("DD/MM/YYYY");
        }
        newContext.name = element;
        newContext.product_id = product.id;
        newContext.workflow_id = workflow.id;
        newContext.$save({}, function(data) {
          //Récupération des infos contextuelles
          product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: product.id
          });
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      }
    };

    $scope.excelPasteProd = function() {
      //Transformation des lignes en tableau
      var allLines = $scope.excelData.split("\n");
      var products_in_workflow = $filter('workflowFilter')($scope.subproject.ownProduct, $scope.selectedWorkflowFilter);
      var ordered_products = $filter('orderBy')(products_in_workflow, 'episode_number');

      //vérification du nombre de lignes copiées et du nombre de produits
      if (allLines.length == ordered_products.length) {
        //On copie chaque ligne dans le champs produit correspondant
        allLines.forEach(function(line, index) {

          var product = ordered_products[index];

          if ($scope.excelSelectProd == "title_vo") {
            product[$scope.excelSelectProd] = line;

            //Post pour mettre à jour le produit
            updatedProduct = new Product();
            updatedProduct[$scope.excelSelectProd] = product[$scope.excelSelectProd];
            updatedProduct.$update({
              productId: product.id
            }, function(data) {
              //Mettre un indicateur d'update
            }, function(data) {
              return "Error " + data.status + " : " + data.statusText;
            });
          } else {
            var context = $scope.returnContextInfo(product, $scope.excelSelectProd, $scope.selectedWorkflowFilter);

            if (context.id != null && context.id != 0) {

              updatedContext = new ContextualInfo();
              updatedContext.value = line;
              updatedContext.$update({
                id: context.id
              }, function(data) {
                //Mettre un indicateur d'update
                product.ownContextualInfos = ContextualInfo.byProductId({
                  product_id: product.id
                });
              }, function(data) {
                return "Error " + data.status + " : " + data.statusText;
              });
            } else {

              newContext = new ContextualInfo();
              newContext.value = line;
              newContext.name = $scope.excelSelectProd;
              newContext.product_id = product.id;
              newContext.workflow_id = $scope.selectedWorkflowFilter.id;
              newContext.$save({}, function(data) {
                //Récupération des infos contextuelles
                product.ownContextualInfos = ContextualInfo.byProductId({
                  product_id: product.id
                });
              }, function(data) {
                return "Error " + data.status + " : " + data.statusText;
              });
            }
          }

        });
        $scope.excelData = null;
        $scope.excelSelectProd = null;
      } else {
        swal({
          title: $rootScope._T["v3mc4wkm"],
          text: $rootScope._T["nr33ypyv"],
          type: "error"
        });
      }

    }

    $scope.editSubproject = function(subproject) {
      $scope.subprojectToEdit = subproject;

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/subprojectEditDialog.html',
        scope: $scope,
        controller: 'EditSubprojectDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        $state.reload();
      });

    }
  }
]);
