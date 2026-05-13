Lantern.controller('SuiviProdCtrl', ['$rootScope', '$scope', '$q', '$cookies', '$state', '$stateParams', '$filter', 
'$location', 'ngDialog', 'Project', 'Subproject', 'Workflow', 'Request', 'Return', 'TableauSuivi', 
'TableauSuiviCell', 'TableauSuiviColumn', 'Valuelist', 'Session', 'ApiRest', '$timeout', '$element',
 'HelperService', 'Notification', 'ResponseToastService', 'ProjectsService', 'ProductService', 'SuiviProdService',
  'TableauSuiviUserPref', 'RequestService', 'ContextualInfo', 'Attachments', 'CreateRequestService', 
  'User', 'Favorite', 'MetricsTemplate', '$localstorage',
  'NotificationService', 'WorkflowHelperService',
  'dataSync','$route','RoomService', 'PersonsService', 'ValueListService', 'ReturnService',
  function($rootScope, $scope, $q, $cookies, $state, $stateParams, $filter, $location, ngDialog, Project, 
    Subproject, Workflow, Request, Return, TableauSuivi, TableauSuiviCell, TableauSuiviColumn, Valuelist, 
    Session, ApiRest, $timeout, $element, HelperService, Notification, ResponseToastService, ProjectsService, 
    ProductService, SuiviProdService, TableauSuiviUserPref, RequestService, ContextualInfo, Attachments, CreateRequestService, 
    User, Favorite, MetricsTemplate, $localstorage,
    NotificationService, WorkflowHelperService,
    dataSync,$route, RoomService, PersonsService, ValueListService, ReturnService
    ) {
    $scope.userAccessRights = $rootScope.userAccessRights
    $scope.role = Session.role();
    $scope.test = false;
    $scope.showList = false;
    $scope.subProjectFavorites = []
    $scope.ReorderIsDisabled = false;
    $scope.qcByProducts = {}
    let validDateFormat = ["DD/MM/YYYY", "DD/MM/YY", "DD/M/YYYY", "DD/M/YY", "D/MM/YYYY", "D/MM/YY", "D/M/YYYY", "D/M/YY", "DD/MM", "DD/M", "D/MM", "D/M", "DD-MM-YYYY", "DD-MM-YY", "DD-M-YYYY", "DD-M-YY", "D-MM-YYYY", "D-MM-YY", "D-M-YYYY", "D-M-YY", "DD-MM", "DD-M", "D-MM", "D-M"];

    /** Data are stored, this function allows refreshing of the current table only. See in suiviProd.html */
    $scope.cleanTable = function () {
      dataSync.stopSynchro();
      delete($rootScope.subprojects[$scope.subproject.id])
      $scope.showLoading = true;
      rest.init();      
    }

    function waitForVariableDefined(callback) {
      if ($rootScope.user_entity && $rootScope.user_entity.person) {
        callback();
      } else {
        const unwatch = $rootScope.$watch('user_entity', function (newVal) {
          if (newVal) {
            unwatch(); // Stop watching once the variable is defined
            callback(newVal);
          }
        })
      }
    }
    function checkUserState () {
      waitForVariableDefined(function () {
        ValueListService.getPlanningTypes()
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
            $scope.mainLocationList =  $rootScope.mainLocationList
            $scope.dubPlacesByLocValue = $rootScope.dubPlacesByLocValue
          }), {})
    
        $scope.canDisplay = $rootScope.canDisplay
        $scope.branch_id = Session.branchId()
        RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
        ValueListService.getFormatMixFromDatabase(ValueListService.gotFormatMixFromDatabase,function () {})
      });
    }

    checkUserState()


    
    $scope.dub_places = []


    let rest = {};
    let service = {};

    $scope.onDropComplete = function(index, obj, evt) {
      service.onDropComplete(index, obj, evt)
    };
    PersonsService.getTechnicians(function (result) {
      PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
    }, PersonsService.manageTechniciansError)

    
    PersonsService.getStageManagers(function (result) {
      // $rootScope.stageManagersById
    }, PersonsService.manageStageManagersError)

    $scope.onDragStart = function(index, obj, evt) {
      service.columnMoved = JSON.parse(obj.position);
      $scope.columns[service.columnMoved].move = true;

    };


    $scope.$on('draggable:end', function() {
      if ($scope.columns[service.columnMoved]) {
        $scope.columns[service.columnMoved].move = false;
      };
    });

    let reorder_asked = {'start' : 0, 'end': 0 };

    $scope.reOrderEdited = false;


    rest.getTableau = function(tableausuivi_id, callbackSuccess) {
      ApiRest.get('/tableausuivicells/columns', {
        tableau_id: tableausuivi_id,
        user_id: Session.userId()
      }, 
      function(columns) {
        var totalColumns = columns.length;
        var count = 0;
        var cellsCall = function() {
          if (count < totalColumns) {
            if (columns[count].workflow) {
              columns[count].workflow.color = colorizeWorkflow(columns[count].workflow);
              columns[count].workflow.description = WorkflowHelperService.describeWorkflow(columns[count].workflow);
            };
            count += 1;
            cellsCall();
          } else {
            return callbackSuccess(columns);
          }
        };
        cellsCall();
      }, function(error) {
        Notification.error(ResponseToastService.error.message);
      });
    };

    // not used anymore, to remove in june 2020
    rest.getCells = function(tableausuivicolumn_id, callbackSuccess) {
      ApiRest.get('/tableausuivicells/cells', {
        tableausuivicolumn_id: tableausuivicolumn_id,
      }, 
      function(cells) {
        return callbackSuccess(cells);
      }, function(error) {});
    };
    

    /** deprecated, remove in may 2020 */
    rest.movePositionColumn = function(columnId, position, hide) {

      ApiRest.put('/tableausuivicolumnsdisplay', {}, {
        column_id: columnId,
        position: position,
        hide: hide,
        user_id: Session.userId(),
      }, function(cells) {
        return;
      }, function(error) {
        return;
      });
    };

    rest.saveNewOrder = function (order,done) {
      ApiRest.put('/tableausuivicolumnsdisplay/neworder/'+Session.userId()+'/', {}, 
        order, 
        function (result) {
         return done();
        }, 
        function (error) {
          return done();
        }
      );

    }

    rest.getChargeProd = function (project_id,done) {
      ApiRest.get('/users/findFavoriteUsers/bons-travaux-auto/charge_prod/'+project_id,{},
      function (response) {
        return done(response)
      }, 
      function (error) {return done([])}

      );
    }
    
    rest.getSubproject = function (subproject_id, done) {
      ApiRest.get('/subprojects/light/'+subproject_id,{},
        function (response) {
            return done(response);
        }

      )
    }
    
    rest.getSubprojectVideoElements = function (subproject_id,done) {
      ApiRest.get('/subprojects/videoelements/'+subproject_id,{},
        function (response) {
            return done(response);
        }

      )
    }

    rest.getReorder = function(columnId, successCallback, errorCallback) {
      ApiRest.get('/tableausuivicolumnsdisplay', {
        column_id: columnId
      }, function(success) {
        return successCallback(success);
      }, function(error) {
        return errorCallback(error);
      });
    };

    rest.hideColumn = function(params, successCallback, errorCallback) {
      ApiRest.put('/tableausuivicolumnsdisplay', {}, params, function(cells) {
        return successCallback();
      }, function(error) {
        return errorCallback();
      });
    };

    service.onDropComplete = function(index, obj, evt) {

      var otherObj = $scope.columns[index];
      var otherIndex = $scope.columns.indexOf(obj);
      var objOtherIndex = angular.copy($scope.columns[otherIndex]);

      reorder_asked.start = otherIndex;
      reorder_asked.end = index;

      $scope.columns.splice(otherIndex,1);
      $scope.columns.splice(index,0,objOtherIndex);
      $scope.reOrderEdited = true;

      // move columns in the table
      for (var j = 0; j < $scope.subproject.ownProduct.length; j++) {
        array_move($scope.subproject.ownProduct[j].cells,reorder_asked.start,reorder_asked.end);
      }

    };

    service.cancelReorder = function () {
      var otherObj = $scope.columns[reorder_asked.start];
      var otherIndex = reorder_asked.end
      var objOtherIndex = angular.copy($scope.columns[otherIndex]);
      $scope.columns.splice(otherIndex,1);
      $scope.columns.splice(reorder_asked.start,0,objOtherIndex);
      // move columns in the table
      for (var j = 0; j < $scope.subproject.ownProduct.length; j++) {
        array_move($scope.subproject.ownProduct[j].cells,reorder_asked.end,reorder_asked.start);
      }
      $scope.reOrderEdited = false;
    }    

    service.getCells = function(product, cell) {
      product.cells.push(cell);
      return product;
    };

    service.colorTable = function(table) {
      angular.forEach(table.ownTableausuivicolumn, function(column) {
        if (column.workflow != null) {
          column.workflow.description = WorkflowHelperService.describeWorkflow(column.workflow);
          column.workflow.color = colorizeWorkflow(column.workflow);
        }
      })
    };

    service.orderByPosition = function(property) {
      var sortOrder = 1;
      if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
      }
      return function(a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
      }
    };

    service.initWorkflow = function(product) {
      if (product.sharedWorkflow.length > 0) {
        product.sharedWorkflow.forEach(function(workflow) {
          var search = $filter('filter')($scope.workflows, {
            'id': workflow.id
          });
          if (search.length == 0) {
            const dub_place = { value: workflow.dub_place, loc_value: workflow.dub_place_value }
            workflow.dub_place = dub_place
            workflow.color = colorizeWorkflow(workflow);
            workflow.description = WorkflowHelperService.describeWorkflow(workflow);
            $scope.workflows.push(workflow);
          }
        });
      }
    };


    service.initProducts = function () {
      let product_attachment = {}     
      let list_products = []
      let product_context = {}   
      
      $scope.subproject.ownProduct.forEach(function(product) {  
        if (product.description_text) {
          product.description_text = product.description_text.replaceAll('_',' ').replaceAll('-',' ')
        } 
        list_products.push( parseInt(product.id,10))
      })
      searchContextual_info(list_products,product_context, function () {
        $scope.subproject.ownProduct.forEach(function(product) {
          product.ownContextualInfos = product_context[product.id]
        })
        searchAttachments(list_products,product_attachment, function () {
          $scope.subproject.ownProduct.forEach(function(product) {
            product.ownAttachments = product_attachment[product.id]
            if (product.air_date != null && product.air_date != "") {
              product.air_date = moment(product.air_date, "YYYY-MM-DD").format("DD/MM/YYYY");
            }
            
            if (product.tmdb_id != null && product.auto_voxo == 1 && product.sharedWorkflow.length == 0) {
              product.mergeable_voicematch = true
            } else if (product.tmdb_id == null) {
              product.mergeable_lantern = true
            }
          });
        })
      })
      
    };

    function searchContextual_info (products,product_context,done) {
      let string_products = products.join(",")
      ContextualInfo.byProducts({
        products: string_products
      }, function (result) {
          Object.keys(result).forEach(
            function (product_id) {
              product_context[product_id] = result[product_id];
            }
          )
          return done();
      });
    }    

    function searchAttachments (products,product_attachment,done) {
      let string_products = products.join(",")
      Attachments.byProducts({
        products: string_products
      }, function (result) {
          Object.keys(result).forEach(
            function (product_id) {
              product_attachment[product_id] = result[product_id];
            }
          )
          return done();
      });
    }       

    service.initModel = function(columns) {
      if (columns.length <= 0 && $scope.workflows.length > 0) {
        $scope.showList = true;
        $scope.done = false;
        $scope.delete = false;
        $scope.doneDelete = false;
        $scope.modify = false;
        $scope.doneModify = false;
        $scope.apply = false;
        $scope.doneApply = false;
        var dialog = ngDialog.open({
          className: 'ngdialog-theme-demand popup',
          width: '80%',
          scope: $scope,
          template: 'views/Dialog/createCustomTemplate.html',
          controller: 'CreateCustomTemplateCtrl',
          closeByDocument: false,
          resolve: {
            workflows: function() {
              return $scope.workflows;
            }
          }
        });
      };
    };

    $scope.initModel = function() {
      service.initModel([]);
    };

    $rootScope.$on('closeDialogWindow', function() {
      $scope.showList = false;
      // rechargement de la page à la fermeture de la page de dialogue
        rest.init();
    });

    $scope.finish = function(product) {
      swal({
        title: $rootScope._T["g2lm6cmr"],
        text: $rootScope._T["x0nhkmsu"],
        type: "warning",
        showCancelButton: true,
        cancelButtonText: $rootScope._T["ficbz281"],
        confirmButtonColor: "green",
        confirmButtonText: $rootScope._T["5ygcxbsu"],
        closeOnConfirm: true
      }, function() {
        ApiRest.put('/products/update', {}, {
          id: product.id,
          finish: '1'
        }, function(response) {
          product.finish = true;
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      });
    };

    $scope.finishSelected = function(products) {
      var productsSelected = $filter('filter')(products, {
        selected: true
      });

      if (productsSelected.length != 0) {
        swal({
          title: $rootScope._T["g2lm6cmr"],
          text: $rootScope._T["gqjumiph"],
          type: "warning",
          showCancelButton: true,
          cancelButtonText: $rootScope._T["ficbz281"],
          confirmButtonColor: "green",
          confirmButtonText: $rootScope._T["5ygcxbsu"],
          closeOnConfirm: true
        }, function() {
          productsSelected.forEach(function(product, index) {
              ApiRest.put('/products/update', {}, {
                id: product.id,
                finish: '1'
              }, function(response) {
                product.finish = true;
              }, function(error) {
                Notification.error(ResponseToastService.error.message);
              });
            })
          $scope.unSelectAllProducts();
        });
      }
    };

    $scope.saveReOrder = function() {
      $scope.ReorderIsDisabled= true
      let order_list = [];
      for (var i = 0; i < $scope.columns.length; i++) {
          order_list.push({column_id: $scope.columns[i].id, position:i, hide:$scope.columns[i].hide});
      };
      rest.saveNewOrder(order_list, function () {
        $scope.reOrderEdited = false;
        $scope.ReorderIsDisabled= false;
      });
      
    };

    rest.addCustomTemplateName = function(params, successCallback, errorCallback) {
      ApiRest.post('/tableausuivicustomtemplatename', {}, params, function(response) {
        return successCallback(response);
      }, function(error) {
        Notification.error(ResponseToastService.error.message);
        return errorCallback(error);
      });
    };

    $scope.resetReOrder = function() {

      service.cancelReorder();
      $scope.reOrderEdited = false;
    };

    rest.addCustomTemplate = function(params, successCallback, errorCallback) {
      ApiRest.post('/tableausuivicustomtemplate', {}, params, function() {
        return successCallback();
      }, function(error) {
        Notification.error(ResponseToastService.error.message);
        return errorCallback();
      });
    }

    $scope.addCustomTemplate = function(name) {

      swal({
          title: $rootScope._T["voe0w8y0"],
          text: $rootScope._T["qqm7uk6z"],
          type: "input",
          showCancelButton: true,
          closeOnConfirm: false,
          animation: "slide-from-top",
          inputPlaceholder: $rootScope._T["ojzac96a"]
        },
        function(inputValue) {
          if (inputValue === false) return false;

          if (inputValue === "") {
            swal.showInputError($rootScope._T["1w75449x"]);
            return false
          }

          rest.addCustomTemplateName({
            tableausuivi_id: $scope.subproject.tableausuivi_id,
            name: inputValue,
            user_id: Session.userId()
          }, function(template) {
            let count = 0;
            for (var i = 0; i < $scope.columns.length; i++) {
              var column = $scope.columns[i];
              if (column.hide != "1" && column.action_id != null && column.workflow != null) {
                rest.addCustomTemplate({
                  template_id: template.id,
                  action_id: column.action_id ? column.action_id : null,
                  workflow_type_id: column.workflow ? column.workflow.workflow_type.id : null,
                  norme_mix_id: column.workflow ? column.workflow.norme_mix_id : null,
                  doublage_type_id: column.workflow ? column.workflow.doublage_type_id : null,
                  position: count,
                }, function() {
                  if (i == $scope.columns.length) {
                    swal($rootScope._T["0oteqgw0"], "", "success");
                  }
                }, function() {
                  swal($rootScope._T["x299xny7"], "", "error");
                });
                count += 1;
              }
            };
          }, function(response) {
            if (response.error.code == 409) {
              swal.showInputError($rootScope._T["rb0kk6rk"]);
            };
          });
        });
    };

    $scope.etapes_actions = []
    const etapesBaseByWorkflowTypeId = {}
    const filterEtapes = function (workflow_type_id, etapes, workflow_managed) {
      let illimited = true
      if (workflow_managed.dub_place == 'Hybride' || workflow_managed.dub_place == 'Belgique' || workflow_managed.dub_place.value == 'Hybride' || workflow_managed.dub_place.value == 'Belgique' || parseInt(workflow_managed.dub_place_value) & 2) {
        illimited = false
      }
      let place_value = ''
      const etapes_actions = []
      etapesBaseByWorkflowTypeId[workflow_type_id] = etapes
      $scope.etapes_actions = [] 
      angular.forEach(etapes, function(etape) {
        angular.forEach(etape.actions, function(action) {
          action.etape_value = etape.value
          action.etape = {}
          action.etape.id = etape.id
          action.etape.name = etape.name
          action.etape.value = etape.value
          action.etape.loc_value = etape.loc_value
          if (etape.loc_value) {
            // les actions enregistrement ne peuvent être faites que si le workflow correspond à l'étape
            if (action.planning == 'farmer') {
              if (action.etape.name == 'enregistrement' || action.etape.name == 'montage') {
                if ((etape.loc_value & parseInt(workflow_managed.dub_place_value)) != 0) {
                 // if ( parseInt(workflow_managed.dub_place_value) == 3) {
                    action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                 //  }
                  etapes_actions.push(action)
                }
                
              } else {
                if ($rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].id == workflow_managed.main_location_id) {
                  action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                  etapes_actions.push(action)
                }
              }
              
            }

            // en fonction du site principal, on va afficher ou non certains éléments (volume principalement)
            // les planning de type volume et qui distinguent entre les sites, affiche en fonction du site principal du workflow
            if (action.planning == 'volume') {
              if ($rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].id == workflow_managed.main_location_id) {
                action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                etapes_actions.push(action)
              }
            }
          } else {
            if (illimited) {
              if (action.service != 'belgique') {
                etapes_actions.push(action)
              }
            } else {
              if (action.etape.name === "enregistrement") {
                if (action.service == 'belgique') {
                  etapes_actions.push(action)
                }
              } else {
                etapes_actions.push(action)
              }
            }
          }
        })
      })
      $scope.etapes_actions = etapes_actions
    }

    let allEtapes = null
    $scope.loadEtapesActions = function(workflow_type_id, workflow_managed) {
      if (etapesBaseByWorkflowTypeId[workflow_type_id]) {
        ValueListService.initEtapesActions(JSON.parse(JSON.stringify(allEtapes)))
        ValueListService.filterEtapes(workflow_type_id, JSON.parse(JSON.stringify(allEtapes)), workflow_managed, function (etapes_actions) {
          $scope.etapes_actions = etapes_actions
        })
      } else {
        ValueListService.getEtapeActionByWorkflow({
          workflow_type_id: workflow_type_id
        }, function(etapes) {
          allEtapes = etapes
          ValueListService.initEtapesActions(JSON.parse(JSON.stringify(allEtapes)))
          ValueListService.filterEtapes(workflow_type_id, JSON.parse(JSON.stringify(etapes)), workflow_managed, function (etapes_actions) {
            $scope.etapes_actions = etapes_actions
          })
        })
      }
    }

    $scope.hideColumn = function(index) {
      if (!$scope.reOrderEdited) {
        $scope.reOrderEdited = !$scope.reOrderEdited
      }

      var hide = $scope.columns[index].hide == false ? '1' : '0';
      $scope.columns[index].hide = hide;

      for (var i = 0; i < $scope.subproject.ownProduct.length; i++) {
        $scope.subproject.ownProduct[i].cells.forEach(function(cell) {
          if (cell.column_id == $scope.columns[index].id) {
            cell.hide = hide;
          };
        });
      };
    };

    /** Main function rest.init and related variables */

    $scope.action_main = null;
    $scope.workflow_main = null;
    $scope.workflow_filtered = null;
    $scope.workflow_order = null;
    $scope.order_products_by = "episode_number";
    $scope.workflows = [];
    $scope.hide_reception_doublage = false;
    $scope.hide_reception_mastering = false;
    $scope.hide_reception_servicing = false;
    $scope.product_batch = 0;
    $scope.hidden_products = [];
    $scope.show_product_info = false;

    $scope.show_in_metrics = false;
    $scope.edit_metrics_labels = false;
    $scope.metrics_templates_all_clients = false;
    $scope.load_metrics_template_id = null;
    $scope.loaded_metrics_template = null;
    $scope.loaded_metrics_template_dn = null;
    $scope.metrics_template_list_id_name = [];
    $scope.save_metrics_template_name = "";

    $scope.client_numbers = "";

    $scope.qcReturnForThisProduct = function (product_id) {
      if ($scope.qcByProducts[product_id] && $scope.qcByProducts[product_id].nb_issues > 0) {
        $scope.qcByProducts[product_id].detail = ''
        Object.keys($scope.qcByProducts[product_id].wfs).forEach((wf_id) => {
          $scope.qcByProducts[product_id].wfs[wf_id].forEach((detail) => {
            $scope.qcByProducts[product_id].detail += detail.doublage + ' ' + detail.lang + ' ' + detail.type_qc + ' ' + detail.status + ' <br />------<br />'
          })
        })
        if ($scope.qcByProducts[product_id].status == 'PASS') {
          $scope.qcByProducts[product_id].bg = 'green'
        } else {
          $scope.qcByProducts[product_id].bg = 'red'
        }
        return true;
      }
      return false
    }

    $scope.saveMetricsProjectStatus = function() {
        var _subproject = new Subproject();
    	_subproject.show_in_metrics = $scope.show_in_metrics ? 1 : 0;
    	_subproject.$update({id: $scope.subproject.id}, function (data) {
			}, function (data) {
        });
    }

    $scope.saveAllMetricsLabels = function() {
        var tableauSuiviColumn = new TableauSuiviColumn();

    	tableauSuiviColumn.columns = [];
    	$scope.columns.forEach(function(value, key) {
    		tableauSuiviColumn.columns.push({id: value.id,
    											metrics_label: (value.metrics_label==null) ? (value.action ? (value.action.etape_type.value_short+' ' +value.action.value_short) : value.name) : value.metrics_label,
                          metrics_order : value.metrics_order,
    											show_in_metrics: value.show_in_metrics});
        });
        tableauSuiviColumn.$saveAllMetricsLabels({}, function() {});
    }

    $scope.saveMetricsLabel = function(column) {
    	if(column.show_in_metrics && column.metrics_label==null)
    		column.metrics_label = column.metrics_label_old =
    			column.action ? (column.action.etape_type.value_short+' ' +column.action.value_short) : column.name;

    	var tableauSuiviColumn = new TableauSuiviColumn();
    	tableauSuiviColumn.columnId = column.id;
      tableauSuiviColumn.showInMetrics = column.show_in_metrics ? 1 : 0;
    	tableauSuiviColumn.metricsLabel = column.metrics_label;
    	tableauSuiviColumn.$updateColumnMetricsDetails({}, function (data) {
        data.columns.forEach(c => {
          var col = $scope.columns.find(c2 => c2.id == c.id);
          if (col)
            col.metrics_order = c.metrics_order
        });
			}, function (data) {
      });
    }

    $scope.setHasChangedLabel = function(index) {
    	$scope.columns[index].has_changed_label = true;
    }

    $scope.saveMetricsLabelBtn = function(index) {
    	$scope.columns[index].has_changed_label = false;
    	$scope.columns[index].metrics_label_old = $scope.columns[index].metrics_label;
    }

    $scope.resetMetricsLabelBtn = function(index) {
    	$scope.columns[index].has_changed_label = false;
    	$scope.columns[index].metrics_label = $scope.columns[index].metrics_label_old;
    }

    $scope.loadMetricsTemplate = function() {
        MetricsTemplate.getTemplate({
			templateId: $scope.load_metrics_template_id,
			subprojectId: $scope.subproject.id
		}, function (metrics_template) {
			$scope.loaded_metrics_template = metrics_template;

			var used_metrics_template_position = [];
			var columns_not_found = [];
			for(var i=0; i<metrics_template.length; i++) {
				columns_not_found[i] = metrics_template[i];

				var action_id = metrics_template[i].action_id ? metrics_template[i].action_id : -1;

				if(used_metrics_template_position[action_id]==null)
					used_metrics_template_position[action_id] = [];

				for(var j=0; j<$scope.columns.length; j++) {
					if((($scope.columns[j].workflow==undefined && metrics_template[i].workflow_type_id==null)
						|| ($scope.columns[j].workflow!=undefined &&
							$scope.columns[j].workflow.workflow_type_id==metrics_template[i].workflow_type_id)) &&
						(($scope.columns[j].action==undefined && metrics_template[i].action_id==null)
						|| ($scope.columns[j].action!=undefined && $scope.columns[j].action.id==metrics_template[i].action_id)) &&
						!used_metrics_template_position[action_id].includes(j)) {
						used_metrics_template_position[action_id].push(j);
						columns_not_found[i] = null;

						$scope.columns[j].show_in_metrics = true;
						$scope.columns[j].metrics_label = metrics_template[i].label;
            $scope.columns[j].metrics_order = metrics_template[i].position;

						break;
					}
				}
			}

      var metricsColumns = [];
      $scope.columns.forEach(column => { if (column.show_in_metrics) metricsColumns.push(column); });
      metricsColumns.sort(function(a, b){return a.metrics_order - b.metrics_order});

      for (var i = 0; i < metricsColumns.length ; i++)
        metricsColumns[i].metrics_order = i;

			$scope.saveAllMetricsLabels();

      columns_not_found = columns_not_found.filter(el => el != null);

      var columns_not_found_str = "<ul>";
      for(var i=0; i<columns_not_found.length; i++) {
        columns_not_found_str += "<li>&bull; "+columns_not_found[i].label+"</li>";
      }
      columns_not_found_str += "</ul>";

		  if(!columns_not_found.length) {
				swal({
          title: $rootScope._T["jroayk03"],
					text: "",
					type: "warning",
					confirmButtonText: $rootScope._T["y0tzlw7g"],
					closeOnConfirm: true
				}, function() {
				});
			} else {
				swal({
          title: $rootScope._T["mmgvp8wl"],
					html: true,
					text: columns_not_found_str,
					type: "warning",
					confirmButtonText: $rootScope._T["y0tzlw7g"],
					closeOnConfirm: true
				}, function() {
				});
			}
		})
    }

    $scope.loadMetricsTemplateList = function() {
      MetricsTemplate.getTemplatesList({
        templateId: $scope.load_metrics_template_id,
        clientId: (!$scope.metrics_templates_all_clients ? $scope.subproject.project.client_id : null)
      },
      function (metrics_template_list_id_name_client_name) {
        $scope.metrics_template_list_id_name = metrics_template_list_id_name_client_name;
        storeSubProjectInRoot( $stateParams.id,'metrics_template_list_id_name',$scope.metrics_template_list_id_name);
      });
	}

	$scope.saveMetricsTemplate = function() {
		MetricsTemplate.getTemplatesList({
			templateId: null,
			clientId: $scope.subproject.project.client_id
		}, function (metrics_template_list_id_name_client_name) {
			for(var i=0; i<metrics_template_list_id_name_client_name.length; i++) {
				if(metrics_template_list_id_name_client_name[i]["name"]==$scope.save_metrics_template_name) {
					swal({
            title: $rootScope._T["q1opubn6"],
            text: $rootScope._T["mr4i5lzn"] + " " + metrics_template_list_id_name_client_name[i]["name"] + " " + $rootScope._T["1jj2ctnq"] + " " +
              metrics_template_list_id_name_client_name[i]["client_name"] + " " + $rootScope._T["p4n47oe7"],
						type: "warning",
						confirmButtonText: $rootScope._T["y0tzlw7g"],
						closeOnConfirm: true
					}, function() {
					});
					return;
				}
			}
			$scope.saveMetricsTemplate_defered();
		});
	}

    $scope.saveMetricsTemplate_defered = function() {
        var metricsTemplate = new MetricsTemplate();

    	metricsTemplate.name = $scope.save_metrics_template_name;
    	metricsTemplate.client_id = $scope.subproject.project.client_id;

    	metricsTemplate.columns = [];
    	var pos = 0;
    	$scope.columns.forEach(function(value, key) {
    		if(value.show_in_metrics) {
    			metricsTemplate.columns.push({action_id: value.action ? value.action.id : null,
    											position: value.metrics_order, label: value.metrics_label,
    											workflow_id: value.workflow_id});
			}
			pos++;
        });

        if(!metricsTemplate.columns.length) {
    		swal({
          title: $rootScope._T["e98ff0zr"],
          text: "",
          type: "warning",
          confirmButtonText: $rootScope._T["y0tzlw7g"],
          closeOnConfirm: true
        }, function() {
			});

			return;
        }

    	metricsTemplate.$post(function (data) {
    			$scope.save_metrics_template_name = "";
    			swal({
                title: $rootScope._T["vo0pui57"],
		            text: "",
		            type: "warning",
		            confirmButtonText: $rootScope._T["y0tzlw7g"],
		            closeOnConfirm: true
		          }, function() {
		         });
    			$scope.loadMetricsTemplateList();
			}, function (data) {
        });
    }

    $scope.metrics_preview_dialog = function() {
		var dialog = ngDialog.open({
          className: 'ngdialog-theme-demand popup',
          width: '90%',
          scope: $scope,
          template: 'views/Dialog/metricsPreviewDialog.html',
          controller: 'MetricsPreviewCtrl',
          closeByDocument: false,
          resolve: {
            workflows: function() {
              return $scope.workflows;
            }
          }
        });
	};

	$scope.metrics_import_client_numbers_dialog = function(column) {
		$scope.client_product = angular.copy($scope.subproject.ownProduct);
		$scope.client_product = $filter('orderBy')($scope.client_product, "episode_number");

		$scope.client_column = column;
		var dialog = ngDialog.open({
          className: 'ngdialog-theme-demand popup',
          width: '80%',
          scope: $scope,
          template: 'views/Dialog/metricsClientNumbersDialog.html',
          controller: 'MetricsPreviewCtrl',
          closeByDocument: false,
          resolve: {
            workflows: function() {
              return $scope.workflows;
            }
          }
        });
	};

	$scope.metrics_import_client_numbers = function() {
		var cells = [];

		for(var i=0; i<$scope.client_product.length; i++) {
			for(var j=0; j<$scope.client_product[i].cells.length; j++) {
				if($scope.client_product[i].cells[j].action!=null &&
					$scope.client_product[i].cells[j].action.name.indexOf("client_number_") == 0 &&
					($scope.client_column.id==$scope.client_product[i].cells[j].column_id)) {
					cells.push({plain_value: $scope.client_product[i].cells[j].plain_value,
									id: $scope.client_product[i].cells[j].id,
									tableausuivicolumn_id: $scope.client_product[i].cells[j].tableausuivicolumn_id,
									product_id: $scope.client_product[i].cells[j].product_id});
				}
			}
		}

		$scope.client_numbers = "";

		TableauSuiviCell.importClientNumbers({
			cells: cells
		}, function() {
			rest.init();
			swal({
        title: $rootScope._T["v6rq4xn9"],
				text: "",
				type: "warning",
				confirmButtonText: $rootScope._T["y0tzlw7g"],
				closeOnConfirm: true
			}, function() {
			});
        }, function(error) {
        });
	};

	$scope.update_clients_cells = function() {
		var rows = $scope.client_numbers.split("\n");
		for(var i=0; i<rows.length; i++) {
			if($scope.client_product[i]==undefined)
				break;

			var row = rows[i];
			for(var j=0; j<$scope.client_product[i].cells.length; j++) {
				if($scope.client_column.id==$scope.client_product[i].cells[j].column_id) {
						$scope.client_product[i].cells[j].plain_value = row;
						break;
				}
			}
		}
	};


    rest.init = function() {
      $scope.subproject = null;

      let subproject = retrieveSubProjectFromRoot($stateParams.id,'subproject');
      if (subproject) {  
        $scope.showLoading = false;  
        $scope.columns = null;    
        $scope.subproject = subproject;
        dataSync.setCurrentSubprojectId($scope.subproject.id)
        buildFromCache( function () {
          dataSync.addPage2watch($location.path());
          dataSync.startSync(1,$scope,synchronizeList )
        });
      } else {
        $scope.showLoading = true;
        buildTableFromAPI(function () {
          dataSync.addPage2watch($location.path());
          dataSync.setCurrentSubprojectId($scope.subproject.id)
          dataSync.setSubprojectDate("farmers",$scope.subproject.id);
          dataSync.startSync(0,$scope, synchronizeList )
        });

      }
    };

    /*
        store requests and farmers
        send data to server to check if there is new booking or new request
        must store any action_type
        if column action-> allow_request 
    */

    storeFarmersBooking = function  () {
      $scope.farmers = {'requests' : {}, 'actions':{}}
      $scope.subproject.ownProduct.forEach( function (product) {
          $scope.farmers.requests[product.id] = {}
          product.cells.forEach(function (cell) {
            if (cell.action.allow_request == "1") {
                $scope.farmers.actions[cell.action.id] = 1;
            }
            cell.requests.forEach(function (request) {
              $scope.farmers.requests[product.id][request.id] = request
              $scope.farmers.requests[product.id][request.id].farmerbooking = {}
              request.ownFarmerbookings.forEach(function (farmer_booking) {
                $scope.farmers.requests[product.id][request.id].farmerbooking[farmer_booking.id] = farmer_booking;
              })
            })

          })
      })
    }

    buildTableFromAPI_metrics = function (subproject,fromCache) {
      $scope.load_metrics_template_id = subproject.metrics_template_id;
      if (fromCache) {
        $scope.metrics_template_list_id_name = retrieveSubProjectFromRoot( $stateParams.id,'metrics_template_list_id_name');
      } else {
        $scope.loadMetricsTemplateList();
      }
      $scope.show_in_metrics = subproject.show_in_metrics == 1;
    }



    buildTable_prepareColumns = function () {
        let has_new_columns = false;
        let new_columns_display = [];
        
        $scope.columns.forEach(function (column) {
            column.show_in_metrics = (column.show_in_metrics==1);
            column.metrics_label_old = column.metrics_label;
            column.has_changed_label = false;          
            if (!column.user_defined) {
              if (Session.userId() !=   column.user_id) {
                has_new_columns = true;
                if (column.action) {
                  new_columns_display.push(column.action.etape_type.value + " "  +  column.action.service + " " + column.action.value_short )
                } else {
                  new_columns_display.push(column.id + " "  + column.name )
                }
              }
            }
        })
        if (has_new_columns) {
            let text = new_columns_display.join("\r\n")
            if (new_columns_display.length > 10) {
                text = $rootScope._T["h1gptpg4"] + " " + new_columns_display.length;
            }
            swal({
              title: $rootScope._T["5h79219o"],
              text:  text,
              type: "warning",
              showCancelButton: false,
              confirmButtonText: $rootScope._T["w7redrmn"],
              closeOnConfirm: true
            }, function(isConfirm) {     
              if (isConfirm) {
                $scope.saveReOrder();
              }        
            });
        }
       
        if ($scope.workflows.length == 0 && $rootScope.canDisplay(3)) {
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
      
    
    }

    buildTableFromAPI_loadTable = function () {
          $scope.tableau =  {
              id: $scope.subproject.tableausuivi_id,
              ownTableausuivicolumn: $scope.columns
          }
          ApiRest.get('/tableausuiviuserpref/userPref', {
            tableausuivi_id: $scope.subproject.tableausuivi_id,
            user_id: Session.userId()
          }, 
          function(tableausuiviuserpref) {
            if (tableausuiviuserpref != null && tableausuiviuserpref != "") {
              $scope.hide_reception_doublage = tableausuiviuserpref.hide_reception_doublage == '1' ? true : false;
              $scope.hide_reception_mastering = tableausuiviuserpref.hide_reception_mastering == '1' ? true : false;
              $scope.hide_reception_servicing = tableausuiviuserpref.hide_reception_servicing == '1' ? true : false;
              $scope.show_product_info = tableausuiviuserpref.show_product_info == '1' ? true : false;
              $scope.product_batch = parseInt(tableausuiviuserpref.product_batch) || 0;

              if (tableausuiviuserpref.hidden_products != null && tableausuiviuserpref.hidden_products != "") {
                $scope.hidden_products = tableausuiviuserpref.hidden_products.split(',');
                $scope.subproject.ownProduct.forEach(function(product) {
                  if ($scope.hidden_products.indexOf(product.id) > -1) {
                    product.hideBatch = true;
                  }
                });
              } else {
                $scope.hidden_products = [];
              }

              $scope.order_products = parseInt(tableausuiviuserpref.order_products) || 0;
              
              $scope.orderProducts($scope.order_products);
              
              storeSubProjectInRoot_scope_variables($stateParams.id,
                        ['hide_reception_doublage',
                         'hide_reception_mastering',
                         'hide_reception_servicing',
                         'show_product_info',
                         'product_batch',
                         'hidden_products',
                         'order_products'
                      ]
              );
              

            } else {
              var newTableausuiviuserpref = new TableauSuiviUserPref();
              newTableausuiviuserpref.tableausuivi_id = $scope.subproject.tableausuivi_id;
              newTableausuiviuserpref.user_id = Session.userId();
              newTableausuiviuserpref.hide_reception_doublage = false;
              newTableausuiviuserpref.hide_reception_mastering = false;
              newTableausuiviuserpref.hide_reception_servicing = false;
              newTableausuiviuserpref.show_product_info = $scope.subproject.ownProduct.length == 1 ? true : false;
              newTableausuiviuserpref.product_batch = 0;
              newTableausuiviuserpref.hidden_products = null;
              newTableausuiviuserpref.order_products = 0;
              newTableausuiviuserpref.$save({});
            }
      }, function(error) {
      });
      

    }

    buildTableFromAPI_loadFavoritesProjects = function () {
      rest.getFavoritesProjects(function(projectFavorites) {
        $scope.subProjectFavorites = [];
        angular.forEach(projectFavorites, function(projectFavorite) {
          angular.forEach(projectFavorite.ownSubproject, function(ownSubproject) {

            if (ownSubproject.tableausuivi_id != null || (ownSubproject.tableausuivi_id == null && ownSubproject.tmdb_id == null)) {
              var subProject = {};
              subProject.project_name = projectFavorite.name_format;
              subProject.id = ownSubproject.id;

              if (ownSubproject.nature.name == "serie") {
                subProject.name = $rootScope._T["6vwtywcc"] + " " + ownSubproject.season;
              } else {
                subProject.name = ownSubproject.nature.value;
              }
              $scope.subProjectFavorites.push(subProject);
              if (ownSubproject.id == $stateParams.id) {
                $scope.subproject_selected = subProject;
              }
            }
          })
        });
        if ($scope.subproject_selected == null) {
          let subProject = {};
          subProject.project_name = $scope.subproject.project.name;
          subProject.id = $scope.subproject.id;

          if ($scope.subproject.nature.name == "serie") {
            subProject.name = $rootScope._T["6vwtywcc"] + " " + $scope.subproject.season;
          } else {
            subProject.name = $scope.subproject.nature.value;
          }
          $scope.subProjectFavorites.push(subProject);
          $scope.subproject_selected = subProject;
        }
        $scope.showSelectProject = true;
        storeSubProjectInRoot_scope_variables($stateParams.id,['showSelectProject'])
        storeSubProjectInRoot( $stateParams.id,'subProjectFavorites',$scope.subProjectFavorites);
        storeSubProjectInRoot( $stateParams.id,'subproject_selected',$scope.subproject_selected);

      });

    }

    buildFromCache = function (done) {
 
      $scope.columns = retrieveSubProjectFromRoot( $stateParams.id,'columns');
      //Chargement du projet
      if ($scope.subproject.ownProduct && $scope.subproject.ownProduct.length > 0) {
        $scope.project = $scope.subproject.project;
      }

      $scope.subProjectFavorites = retrieveSubProjectFromRoot( $stateParams.id,'subProjectFavorites');
      $scope.subproject_selected = retrieveSubProjectFromRoot( $stateParams.id,'subproject_selected');
      $scope.showLoading = false;
      retrieveSubProjectFromRoot_scope_variables($stateParams.id)
      // pas la peine, possède son propre cache partagé entre tous les projets, plus efficace
      // faudra une mise à jour en temps réel
      $scope.tabChargeProd = retrieveSubProjectFromRoot( $stateParams.id,'tabChargeProd');
        // display workflow
      $scope.subproject.ownProduct.forEach(function(product) {
        service.initWorkflow(product);   
      })          
      buildTable_prepareColumns();
      service.initModel($scope.columns);
      //  Recharger la page avec les filtre workflow selectionné
      if(sessionStorage.getItem("cache_pushfilterWorkflow") != undefined){
        $scope.filterWorkflow();
      }  

      buildTableFromAPI_metrics($scope.subproject,'cache');

      // $scope.getChargeProd($scope.subproject.project);      
      if (!$scope.subProjectFavorites || $scope.subProjectFavorites.length == 0) {
        buildTableFromAPI_loadFavoritesProjects();
      }        
      $scope.tableau =  {
        id: $scope.subproject.tableausuivi_id,
        ownTableausuivicolumn: $scope.columns
      }        

      $scope.getSubprojectVideoElements($scope.subproject.id);
      
      return done()
    }


    buildTableFromAPI = function (done) {
 
      rest.getSubproject( $stateParams.id,
      function(response) {
        $scope.subproject = response.subproject;   
        $scope.columns = response.columns;
        $scope.showLoading = false;
        $scope.project = $scope.subproject.project;
        storeSubProjectInRoot( $stateParams.id,'subproject',$scope.subproject);
        storeSubProjectInRoot( $stateParams.id,'columns',$scope.columns);
        
        // display workflow
        $scope.subproject.ownProduct.forEach(function(product) {
          service.initWorkflow(product);   
        })          
        buildTable_prepareColumns();
        service.initModel($scope.columns);
        //  Recharger la page avec les filtre workflow selectionné
        if(sessionStorage.getItem("cache_pushfilterWorkflow") != undefined){
          $scope.filterWorkflow();
        }  

        buildTableFromAPI_metrics($scope.subproject);

        $scope.getSubprojectVideoElements($scope.subproject.id);

        // $scope.getChargeProd($scope.subproject.project);

        //very awful hack to destray as soon as possible
        // due to display too late color in table headers
        const requestsList = {}
        $scope.subproject.ownProduct.forEach(function(product) {
          product.cells.forEach((cell) => {
            cell.requests.forEach((request) => {
              requestsList[request.id] = true
            })
          })
          service.initWorkflow(product);   
        })
        if ($scope.subProjectFavorites.length == 0) {
          buildTableFromAPI_loadFavoritesProjects();
        }    
        ReturnService.getAllReturnsQCByRequests(Object.keys(requestsList), function (response) {
          $scope.qcByProducts = response.data
        })
        
        service.initProducts();

        if ($scope.subproject.tableausuivi_id != null) {
          buildTableFromAPI_loadTable();
        } else {
          //Création d'un nouveau tableau à la volée
          var newTab = new TableauSuivi();
          newTab.subproject_id = $scope.subproject.id;
          newTab.$save({}, function() {
            rest.init();
          });
        }
        return done();
      });  


    }

    $scope.selectWorkflow = function(workflow) {
      var selectedWorkflow = $filter('filter')($scope.workflows, {
        selected: true
      }, true);
      if (selectedWorkflow != null) {
        selectedWorkflow.forEach(function(workflow) {
          workflow.selected = false;
        })
      }
      workflow.selected = true;
      let workflow_already_stored = false;
      if ($rootScope.etapesActionsBase) {
        if ($rootScope.etapesActionsBase[workflow.workflow_type_id]) {
          workflow_already_stored = true;
        }
      }
      $scope.workflow_main = workflow;
      $scope.loadEtapesActions(workflow.workflow_type_id, workflow);
    };

    $scope.cancelSelectWorkflow = function() {
      var selectedWorkflow = $filter('filter')($scope.workflows, {
        selected: true
      }, true);
      if (selectedWorkflow != null) {
        selectedWorkflow.forEach(function(workflow) {
          workflow.selected = false;
        })
      }
      $scope.workflow_main = null;
    };

    $scope.orderProducts = function(order_products) {
      if (order_products != 0) {
        $scope.workflow_order = $filter('filter')($scope.workflows, {
          'id': order_products
        })[0];
        $scope.order_products_by = "ordre_diff";
        $scope.subproject.ownProduct = $filter('orderBy')($scope.subproject.ownProduct, "episode_number");
        let index = $scope.subproject.ownProduct.length;
        $scope.subproject.ownProduct.forEach(function(product) {
          
          var info = $filter('filter')(product.ownContextualInfos, {
            'workflow_id': order_products,
            'name': "ordre_diff"
          })[0];
          if (info) {
            product.ordre_diff = parseInt(info.value);
          } else {
            product.ordre_diff = index;
          }
          index++;
        });
      } else {
        $scope.workflow_order = null;
        $scope.order_products_by = "episode_number";
      }
    }

    $scope.saveDisplayOrder = function(workflowId) {
      $scope.order_products = workflowId;
      var updatedTableausuiviuserpref = new TableauSuiviUserPref();
      updatedTableausuiviuserpref.tableausuivi_id = $scope.tableau.id;
      updatedTableausuiviuserpref.user_id = Session.userId();
      updatedTableausuiviuserpref.order_products = workflowId;
      updatedTableausuiviuserpref.hidden_products = null;
      updatedTableausuiviuserpref.$update({}, function() {
        $scope.orderProducts(workflowId);
      });
    }

    $scope.pushfilterWorkflow = (sessionStorage.getItem("cache_pushfilterWorkflow") != undefined &&  JSON.parse(sessionStorage.getItem("cache_pushfilterWorkflow")).length > 0 ) ? JSON.parse(sessionStorage.getItem("cache_pushfilterWorkflow")) : [];
    
    if (sessionStorage.getItem("cache_scope_workflows") != undefined 
        && JSON.parse(sessionStorage.getItem("cache_scope_workflows")).length > 0 ){
        $scope.workflows = JSON.parse(sessionStorage.getItem("cache_scope_workflows"))
    }


    $scope.filterWorkflow = function(workflow) {
      if(workflow != undefined){
        if(workflow.selectedfilter == undefined || workflow.selectedfilter == false ){
          workflow.selectedfilter = true;
        }else{
          workflow.selectedfilter = false;
        }

        for (var t = 0; t < $scope.pushfilterWorkflow.length; t++) {
            if(workflow.id == $scope.pushfilterWorkflow[t].id && workflow.selectedfilter == false) {
              $scope.pushfilterWorkflow.splice(t, 1);
              break;
            }
        }

        if(workflow.selectedfilter){
          $scope.pushfilterWorkflow.push(workflow);
          $scope.workflow_filtered = workflow;
        }
        sessionStorage.setItem('cache_pushfilterWorkflow', JSON.stringify($scope.pushfilterWorkflow))
        sessionStorage.setItem('cache_scope_workflows',JSON.stringify($scope.workflows));
      }

      for (var i = 0; i < $scope.columns.length; i++) {
        var filtered;
        for (var k = 0; k < $scope.pushfilterWorkflow.length; k++) {
          if($scope.columns[i].workflow_id == $scope.pushfilterWorkflow[k].id) {
            filtered = false; break;
          } else {
            filtered = true;
          }
        }
        $scope.columns[i].filtered = filtered;
          for (var j = 0; j < $scope.subproject.ownProduct.length; j++) {
            $scope.subproject.ownProduct[j].cells.forEach(function(cell) {
              if (cell.column_id == $scope.columns[i].id) {
                cell.filtered = filtered;
              };
            });
          };
      };
    };


    $scope.removeFilterWorkflow = function(index,workflow) {
      $scope.workflows.forEach(function(workfl) {
          if(workfl.id == workflow.id) {
              delete workfl.selectedfilter;
          }
        });
      $scope.pushfilterWorkflow.splice(index, 1);
      sessionStorage.setItem('cache_pushfilterWorkflow',JSON.stringify($scope.pushfilterWorkflow));
      sessionStorage.setItem('cache_scope_workflows',JSON.stringify($scope.workflows));
      $scope.filterWorkflow();
    }

    $scope.cancelFilterWorkflow = function() {
      $scope.workflow_filtered = null;
      $scope.pushfilterWorkflow = [];
      // on supprime les filtres workflow
      $scope.workflows.forEach(function(workflow) {
          delete workflow.selectedfilter;
      });
      sessionStorage.removeItem('cache_pushfilterWorkflow');
      sessionStorage.removeItem('cache_scope_workflows');


      for (var i = 0; i < $scope.columns.length; i++) {
        $scope.columns[i].filtered = false;
        for (var j = 0; j < $scope.subproject.ownProduct.length; j++) {
          $scope.subproject.ownProduct[j].cells.forEach(function(cell) {
            if (cell.column_id == $scope.columns[i].id) {
              cell.filtered = false;
            };
          });
        };
      };

    };

    $scope.selectAction = function(action) {
      $scope.action_main = action;
    };

    $scope.addColumn = function(type, params) {
      if($scope.load_metrics_template_id!=null && $scope.loaded_metrics_template_dn==null) {
		$scope.loaded_metrics_template_dn = MetricsTemplate.getTemplate({
			templateId: $scope.load_metrics_template_id,
			subprojectId: $scope.subproject.id
		}, function (metrics_template) {
		});
	  }

	  let metrics_template = ($scope.loaded_metrics_template!=null) ? $scope.loaded_metrics_template : $scope.loaded_metrics_template_dn;
    if (!$scope.tableau) {
      $scope.tableau =  {
        id: $scope.subproject.tableausuivi_id,
        ownTableausuivicolumn: $scope.columns
      }
    }
      SuiviProdService.addColumn(type, params, $scope.tableau, $scope.workflow_main, $scope.action_main,
        function (response) {
          dataSync.stopSynchro();
          delete($rootScope.subprojects[$scope.subproject.id])
          $scope.showLoading = true;            
          rest.init();

          if (metrics_template!=null) {
          	let columns_new_etape_pos = 0;
          	$scope.columns.forEach(function(value, key) {
          		if (
                (value.workflow==undefined && type=='user') ||
          				(
                    (value.workflow!=undefined && type!='user') 
                    && (value.workflow.workflow_type_id==$scope.workflow_main.workflow_type_id && value.action_id==$scope.action_main.id)
                  )
                ) 
              {
							  columns_new_etape_pos++;
					    }
          	});

          	let templates_new_etape_pos = 0;
            for (var i=0; i < metrics_template.length; i++) {
              let pass1 = (type!='user' && metrics_template[i].workflow_type_id == $scope.workflow_main.workflow_type_id &&
                    metrics_template[i].action_id == $scope.action_main.id);
              let pass2 = (type=='user' && metrics_template[i].workflow_type_id==null);
              let pass3 = (type=='user' && metrics_template[i].action_id==null);

              if ((pass1 || pass2 || pass3) && templates_new_etape_pos == columns_new_etape_pos) {
                swal({
                  title: $rootScope._T["do98mf5r"],
                  html: true,
                  text: $rootScope._T["n5p1i4vg"] + " <b>" + metrics_template[i].label + "</b>  " + $rootScope._T["tz0lzyzs"] + " " +
                      ($scope.action_main ? $scope.action_main.etape_value : $rootScope._T["dl0vituf"]) + "?",
                  type: "warning",
                  confirmButtonText: $rootScope._T["w7redrmn"],
                  closeOnConfirm: true,
                  showCancelButton: true,
                  cancelButtonText: $rootScope._T["adoyhyi2"],
                }, function(confirm) {
                  if (confirm) {
                    $scope.columns[$scope.columns.length-1].show_in_metrics = true;
                    $scope.columns[$scope.columns.length-1].metrics_label = metrics_template[i].label;
                    $scope.saveMetricsLabel($scope.columns[$scope.columns.length-1]);
                  }
                })
                return;
              } else if (pass1 || pass2 || pass3) {
                templates_new_etape_pos++;
              }
            }
			    }
        }, function(error) {
        })
    };


    $scope.deleteColumn = function(column) {

      swal({
        title: $rootScope._T["g2lm6cmr"],
        text: $rootScope._T["gb40eko8"],
        type: "warning",
        showCancelButton: true,
        cancelButtonText: $rootScope._T["ficbz281"],
        confirmButtonColor: "#DD6B55",
        confirmButtonText: $rootScope._T["5ygcxbsu"],
        closeOnConfirm: true
      }, function() {
        TableauSuiviColumn.delete({
          id: column.id
        }, function() {
          dataSync.stopSynchro();
          delete($rootScope.subprojects[$scope.subproject.id])
          $scope.showLoading = true;          
          rest.init();
        });
      });

    };

    $scope.getCellValue = function(product, column) {
      if (product != null && product.cells != null) {
        var cell = $filter('filter')(product.cells, {
          'tableausuivicolumn_id': column.id
        });
        if (cell.lenth === 1) {
          return cell[0];
        } else if (cell.length > 1) {
          console.error("Length of cell should not me > than 1");
        } else {
          return null;
        }
      }
    }

    $scope.saveCellComment = function(cell) {
      if (cell.id) {
        ApiRest.put('/tableausuivicells/cells/check', {}, {
          id: cell.id,
          comment: cell.comment
        }, function(cell) {
          Notification.success($rootScope._T["pl76bc05"]);
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      } else {
        ApiRest.post('/tableausuivicells/cells/check', {}, {
          comment: cell.comment,
          product_id: cell.product_id,
          tableausuivicolumn_id: cell.tableausuivicolumn_id
        }, function(cell) {
          Notification.success($rootScope._T["pl76bc05"]);
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      }
    }

    rest.getFavoritesProjects = function(callback) {
      $scope.favorites = [];
      ProjectsService.getFavoritesProjects({
        user_id: Session.userId()
      }, function(favoritesProjects) {
        return callback(favoritesProjects);
      }, function(error) {
        Notification.error(ResponseToastService.error.message);
      });
    };

    // watcher drag and drop events

    $scope.goToProductionMonitoring = function(subProject) {
      $state.go("app.suiviProd", {
        id: subProject.id
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

    $scope.selectAllProducts = function(subproject) {
      subproject.ownProduct.forEach(function(value, key) {
        value.selected = subproject.master;
      });
    };

    $scope.unSelectAllProducts = function() {
      $scope.subproject.master = false;
      $scope.subproject.ownProduct.forEach(function(value, key) {
        value.selected = false;
      })
    }

    $scope.cancelDemandesInProduct = function(products, column) {
      if (!$rootScope.canDisplay(3) || column != null && (column.action == null || column.action.allow_request != 1)) {
        return;
      }  
      var productsSelected = $filter('filter')(products, {
        selected: true
      }); 
      if (productsSelected.length != 0) {
        let responses_promises = [] 
        let requests2cancel = {}
        angular.forEach(productsSelected, function(product) {

            let filters = [
              {"name": "product_id","value": product.id} 
             ,{"name": "etape_type_id","value": column.action.etape_type_id}
             ,{"name": "workflow_id","value": column.workflow.id}              
            ];

            responses_promises.push(RequestService.getRequestsByDefer(filters));
        })
        $q.all(responses_promises).then(function(ServiceRequestsResponse) {
          angular.forEach(ServiceRequestsResponse, function(responseList) {

            angular.forEach(responseList, function(response) {
              if ((!response.is_canceled || response.is_canceled == 0) && response.action_type.name ==  column.action.name) {
                requests2cancel[response.id] = response
              }
            });
          });

        }).finally(function () {
            if (Object.keys(requests2cancel).length == 0) {
                swal({
                  position: 'top-end',
                  icon: 'success',
                  title: $rootScope._T["ih9swapn"],
                  showConfirmButton: false,
                  timer: 1500
                })
                return false;
            }

            var dates_request_list = []
            var liste = []
            let str_liste;
            if (Object.keys(requests2cancel).length > 15) {
              str_liste =  Object.keys(requests2cancel).length  + " " +  $rootScope._T['we628ulu'];
            } else {
              Object.keys(requests2cancel).forEach(
                  function (request_id) {
                    liste.push(request_id);
                    dates_request_list.push(  request_id + "("+column.workflow.id+")" );
                  }
              )
              str_liste =  dates_request_list.join("\r\n")   
            }
            swal(
              {
              title: $rootScope._T["m0g3bdny"],
              text: str_liste,
              type: "warning",
              showCancelButton: true,
              confirmButtonText: $rootScope._T["w7redrmn"],
              cancelButtonText: $rootScope._T["adoyhyi2"],
              closeOnConfirm: true
            },
            
            function(isConfirm) {  
              if (isConfirm) {
                
                let status_responses = [];
                let services = "planning,production";
                liste.forEach(
                    function (request_id) {
                      status_responses.push(RequestService.setStatusRequestDefer("cancel", requests2cancel[request_id]) )
                      // la response de restler est mal faite et ne renvoie pas de message utilisable en cas d'erreur
                      // si un contenu est mal supprimé, il sera réaffiché plus tard
                      requests2cancel[request_id].ownFarmerbookings.forEach(
                        function (element) {
                          $( "#" +  request_id+ "-"+element.id).remove();
                        }
                      )    
                    }
                );

                $q.all(status_responses).then(function(status_responses) {
                  let titleNotif = $rootScope._T["p8tmmghz"]
                  sendStandardNotif(new NotificationService(), requests2cancel, services, $rootScope._T["yp9tp27g"], titleNotif, $filter, "cancel", $rootScope);
                }) 
                return false; 
              } 
            }            
            );

        } );
            
      
      }
      return false;
    }


    /**
     * opening popup to create a request
     * 
     * see also  app/js/services/createRequestService.js for more details
     * 
     */
    $scope.newRequestFromProduct = function(products, column) {
      if ($scope.edit_metrics_labels) return;

      if(column != null && column.action && column.action.name.indexOf('client_number_') == 0) {
      	$scope.metrics_import_client_numbers_dialog(column);
      }

      if (!$rootScope.canDisplay(3) || column != null && (column.action == null || column.action.allow_request != 1)) {
        return;
      }
      if (column) {
        $scope.loadEtapesActions(column.workflow.workflow_type_id, column.workflow)
      }
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
              if (column != null) {
                CreateRequestService.createRequestDialog(allProductsId.join(), column.workflow_id, null, null, column.action_id,reloadTable, column.workflow);
              } else {
                CreateRequestService.createRequestDialog(allProductsId.join(), null, null, null, null,reloadTable, null);
              }
              $scope.unSelectAllProducts();
            }

          })
      } else {
        Notification.error($rootScope._T["rm26qmaz"])
      }
    };

    
    $scope.validateDate = function(data) {
      if (moment(data, validDateFormat, true).isValid() || data == "") {
        return true;
      } else {
        return $rootScope._T["n5ix7my4"]
      }
    }

    $scope.doneEditing = function(element, product) {
      var data = {};
      if (element == "air_date" && product[element] != "") {
        data[element] = moment(product[element], validDateFormat, true).format("YYYY-MM-DD");
      } else {
        data[element] = product[element];
      }
      ProductService.updateProduct({
        id: product.id
      }, data, function(product) {
        Notification.success($rootScope._T["xidwkts7"])
      }, function(error) {
        Notification.error($rootScope._T["zrlc1k8e"])
      });
    };

    service.deleteTemplate = function() {
      $scope.done = false;
      $scope.delete = true;
      $scope.doneDelete = false;
      $scope.modify = false;
      $scope.doneModify = false;
      $scope.apply = false;
      $scope.doneApply = false;
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '80%',
        scope: $scope,
        template: 'views/Dialog/createCustomTemplate.html',
        controller: 'CreateCustomTemplateCtrl',
        closeByDocument: false,
        resolve: {
          workflows: function() {
            return $scope.workflows;
          }
        }
      });
    };

    $scope.deleteTemplate = function() {
      service.deleteTemplate([]);
    };

    service.modifyTemplate = function() {
      $scope.done = false;
      $scope.delete = false;
      $scope.doneDelete = false;
      $scope.modify = true;
      $scope.doneModify = false;
      $scope.apply = false;
      $scope.doneApply = false;
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '80%',
        scope: $scope,
        template: 'views/Dialog/createCustomTemplate.html',
        controller: 'CreateCustomTemplateCtrl',
        closeByDocument: false,
        resolve: {
          workflows: function() {
            return $scope.workflows;
          }
        }
      });
    };

    $scope.modifyTemplate = function() {
      service.modifyTemplate([]);
    };

    service.applyTemplate = function() {
      $scope.done = false;
      $scope.delete = false;
      $scope.doneDelete = false;
      $scope.modify = false;
      $scope.doneModify = false;
      $scope.apply = true;
      $scope.doneApply = false;
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '80%',
        scope: $scope,
        template: 'views/Dialog/createCustomTemplate.html',
        controller: 'CreateCustomTemplateCtrl',
        closeByDocument: false,
        resolve: {
          workflows: function() {
            return $scope.workflows;
          }
        }
      });
    };

    $scope.applyTemplate = function() {
      service.applyTemplate([]);
    };

    service.showProductReturns = function(product) {
      $scope.product = product;
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '80%',
        scope: $scope,
        template: 'views/Dialog/returnsTemplate.html',
        controller: 'ReturnsTemplateCtrl',
        closeByDocument: false
      });
    };

    $scope.showProductReturns = function(product) {
      service.showProductReturns(product);
    };

    service.showProductAttachments = function(product) {
      
      $scope.product = product;
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '80%',
        scope: $scope,
        template: 'views/Dialog/attachmentsDialog.html',
        controller: 'AttachmentsDialogCtrl',
        closeByDocument: false
      });
    };

    $scope.showProductAttachments = function(product) {
      service.showProductAttachments(product);
    };

    service.showExportClient = function() {
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '80%',
        scope: $scope,
        template: 'views/Dialog/exportClientDialog.html',
        controller: 'ExportClientDialogCtrl',
        closeByDocument: false
      });
    };

    $scope.showExportClient = function() {
      service.showExportClient();
    };

    $scope.hideReceptionColumn = function(workflow_type_name) {

      if (workflow_type_name == "doublage" && $scope.hide_reception_doublage) {
        return true;
      } else if (workflow_type_name == "mastering" && $scope.hide_reception_mastering) {
        return true;
      } else if (workflow_type_name == "servicing" && $scope.hide_reception_servicing) {
        return true;
      }

      if ($scope.workflow_filtered && $scope.workflow_filtered.workflow_type.name != workflow_type_name) {
        return true;
      }

      var found = false;
      angular.forEach($scope.workflows, function(workflow) {
        if (workflow && workflow.workflow_type && workflow.workflow_type.name == workflow_type_name) {
          found = true;
        }
      });

      return !found;
    }

    $scope.saveHideReceptionColumn = function() {
      var updatedTableausuiviuserpref = new TableauSuiviUserPref();
      updatedTableausuiviuserpref.tableausuivi_id = $scope.tableau.id;
      updatedTableausuiviuserpref.user_id = Session.userId();
      updatedTableausuiviuserpref.hide_reception_doublage = $scope.hide_reception_doublage;
      updatedTableausuiviuserpref.hide_reception_mastering = $scope.hide_reception_mastering;
      updatedTableausuiviuserpref.hide_reception_servicing = $scope.hide_reception_servicing;
      updatedTableausuiviuserpref.$update({}, function() {
      });
    }

    $scope.saveProductBatch = function(product_batch) {
      var updatedTableausuiviuserpref = new TableauSuiviUserPref();
      updatedTableausuiviuserpref.tableausuivi_id = $scope.tableau.id;
      updatedTableausuiviuserpref.user_id = Session.userId();
      updatedTableausuiviuserpref.product_batch = product_batch || 0;
      updatedTableausuiviuserpref.hidden_products = null;
      updatedTableausuiviuserpref.$update({}, function() {
        dataSync.stopSynchro();
        delete($rootScope.subprojects[$scope.subproject.id])
        $scope.showLoading = true;
        rest.init();
      });
    }

    $scope.hideBatchProducts = function(products, indexStart, indexEnd) {
      for (var i = indexStart; i <= indexEnd; i++) {
        products[i].hideBatch = !products[i].hideBatch;
        if (products[i].hideBatch) {
          $scope.hidden_products.push(products[i].id);
        } else {
          var index = $scope.hidden_products.indexOf(products[i].id);
          if (index > -1) {
            $scope.hidden_products.splice(index, 1);
          }
        }
      }
      $scope.hidden_products.sort();
      var updatedTableausuiviuserpref = new TableauSuiviUserPref();
      updatedTableausuiviuserpref.tableausuivi_id = $scope.tableau.id;
      updatedTableausuiviuserpref.user_id = Session.userId();
      updatedTableausuiviuserpref.hidden_products = $scope.hidden_products.toString();
      updatedTableausuiviuserpref.$update({}, function() {
      });
    }

    $scope.openProductColumn = function() {
      $scope.show_product_info = !$scope.show_product_info;
      var updatedTableausuiviuserpref = new TableauSuiviUserPref();
      updatedTableausuiviuserpref.tableausuivi_id = $scope.tableau.id;
      updatedTableausuiviuserpref.user_id = Session.userId();
      updatedTableausuiviuserpref.show_product_info = $scope.show_product_info;
      updatedTableausuiviuserpref.$update({}, function() {
      });
    }

    $scope.createWorkflow = function() {
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        template: 'views/Dialog/createWorkflow.html',
        scope: $scope,
        width: '80%',
        controller: 'CreateWorkflowDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          dataSync.stopSynchro();
          delete($rootScope.subprojects[$scope.subproject.id])
          $scope.showLoading = true;
          rest.init();
        }
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

      dialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape") {
          dataSync.stopSynchro();
          delete($rootScope.subprojects[$scope.subproject.id])
          $scope.showLoading = true;
          rest.init();
        }
      });
    };

    $scope.createProduct = function() {
      $scope.subproject_id = $scope.subproject.id;
      $scope.subproject_nature = $scope.subproject.nature;
      $scope.subproject_season = $scope.subproject.season;
      $scope.project_name = $scope.subproject.project.name;

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

      dialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          dataSync.stopSynchro();
          delete($rootScope.subprojects[$scope.subproject.id])
          $scope.showLoading = true;
          rest.init();
        }
      });
    };

    $scope.editSubproject = function(subproject) {
      $scope.subprojectToEdit = subproject;

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/subprojectEditDialog.html',
        width: '30%',
        scope: $scope,
        controller: 'EditSubprojectDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape") {
          dataSync.stopSynchro();
          delete($rootScope.subprojects[$scope.subproject.id])
          $scope.showLoading = true;
          rest.init();
        }
      });
    }

    $scope.setCodeSecuriteSubproject = function(subproject) {
      $scope.subprojectToSetCodeSecurite = subproject;

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        appendClassName: 'ngdialog-code-securite',
        width: '95%',
        template: 'views/Dialog/subprojectCodeSecuriteSetDialog.html',
        scope: $scope,
        controller: 'SetCodeSecuriteSubprojectDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function(data) {
        delete($rootScope.subprojects[$scope.subproject.id])
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          dataSync.stopSynchro();
          $scope.showLoading = true;
          rest.init();
        }
      });

    }

    service.showHelpDialog = function() {
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '80%',
        height: '80%',
        scope: $scope,
        template: 'views/Dialog/suiviProdHelpDialog.html',
        controller: 'SuiviProdHelpDialogCtrl',
        closeByDocument: false
      });


    };

    $scope.showHelpDialog = function() {
      service.showHelpDialog();
    };

    /** charge prod search */
    $scope.getChargeProd = function(project) {
      return false;
      // cool it works, and we can store data in rootscope for better request
      if ( $rootScope.chargeprod[project.id] ) {
        $scope.tabChargeProd = $rootScope.chargeprod[project.id]
      } else {
        rest.getChargeProd(project.id,function (users) {
          if (!$rootScope.chargeprod[project.id]) $rootScope.chargeprod[project.id] = []
          $scope.tabChargeProd = []
          users.forEach(function (user) {
            $scope.tabChargeProd.push(user)
            $rootScope.chargeprod[project.id].push(user)
          })
        });
      }
    }
    /** end of charge prod search */

    /** video element search */
    $scope.getSubprojectVideoElements = function(subproject_id) {
        rest.getSubprojectVideoElements(subproject_id, function(mediaitems) {
          $scope.subprojectVideoElements = mediaitems;
          $scope.subprojectVideoElements.forEach(function(item) {
            item.new_media_seal_security_code = '';
            item.new_media_seal_security_version = item.media_seal_security_version;
            item.selected = "0";
            item.media_seal_code_changed = false;
          })
        });
    }
    /** end of video element search */

    $scope.mergeProducts = function(product) {
      let mergeableProducts = $filter('filter')($scope.subproject.ownProduct, {
        mergeable_lantern: true,
        selected: true
      }, true);
      if (mergeableProducts.length != 1) {
        swal(
          $rootScope._T["d9g8hhdy"],
          $rootScope._T["4pca9x2n"],
          "error"
        );
      } else {
        let mergeableProduct = mergeableProducts[0];
        let productName, mergeableProductName;
        if ($scope.subproject.nature.name == 'serie') {
          productName = product.episode_number;
          mergeableProductName = mergeableProduct.episode_number;
        } else if ($scope.subproject.nature.name != 'serie' && $scope.subproject.nature.name == 'film') {
          productName = product.description.value;
          mergeableProductName = mergeableProduct.description.value;
        } else if ($scope.subproject.nature.name != 'serie' && $scope.subproject.nature.name != 'film') {
          productName = product.description_text
          mergeableProductName = mergeableProduct.description_text;
        }

        swal({
          title: $rootScope._T["g2lm6cmr"],
          text: $rootScope._T["qt25e6w3"] + " " + productName + " " + $rootScope._T["zp59b9h2"] + " " + mergeableProductName + " ?",
          type: "warning",
          showCancelButton: true,
          cancelButtonText: $rootScope._T["ficbz281"],
          confirmButtonColor: "green",
          confirmButtonText: $rootScope._T["5ygcxbsu"],
          closeOnConfirm: true
        }, function() {
          let data = {};
          data.tmdb_id = product.tmdb_id;
          if (product.air_date != null && product.air_date != "" && (mergeableProduct.air_date == null || mergeableProduct.air_date == "" || mergeableProduct.air_date == "0000-00-00" || mergeableProduct.air_date == "Invalid date")) {
            data.air_date = moment(product.air_date, validDateFormat, true).format("YYYY-MM-DD");
          }
          data.name = product.name;
          data.still_path = product.still_path;
          data.show_id = product.show_id;
          ProductService.updateProduct({
            id: mergeableProduct.id
          }, data, function(success) {
            ProductService.deleteProduct({
              id: product.id
            }, function(success) {
              dataSync.stopSynchro();
              delete($rootScope.subprojects[$scope.subproject.id])
              $scope.showLoading = true;
              
              Notification.success($rootScope._T["ts0f72vr"])
              rest.init();
            }, function(error) {
              Notification.error($rootScope._T["zrlc1k8e"])
            });
          }, function(error) {
            Notification.error($rootScope._T["zrlc1k8e"])
          });
        });
      }
    }

    $scope.enabledMerge = function() {
      let selectedProducts = $filter('filter')($scope.subproject.ownProduct, {
        selected: true
      }, true);
      let mergeableProducts = $filter('filter')($scope.subproject.ownProduct, {
        mergeable_lantern: true,
        selected: true
      }, true);
      return selectedProducts.length == 1 && mergeableProducts.length == 1;
    }

    storeSubProjectInRoot = function (subproject_id,name,element) {

      if (!$rootScope.subprojects[subproject_id]) {
        $rootScope.subprojects[subproject_id] = {variables:{} }
      }
      $rootScope.subprojects[subproject_id][name] = element;
    }

    // sauvegarde en vrac d'une série de variables
    storeSubProjectInRoot_scope_variables = function (subproject_id,variables) {
      variables.forEach(
          function (element) {  
            $rootScope.subprojects[subproject_id].variables[element] = $scope[element]
          }
      )

    }
    
    retrieveSubProjectFromRoot = function (subproject_id,name) {
      
      if ($rootScope.subprojects && $rootScope.subprojects[subproject_id]) {
        return $rootScope.subprojects[subproject_id][name]
      }
      return false;
    }

    retrieveSubProjectFromRoot_scope_variables = function (subproject_id) {
      Object.keys($rootScope.subprojects[subproject_id].variables).forEach(
        function (element) {
          $scope[element] = $rootScope.subprojects[subproject_id].variables[element];
        }

      )

    }

    /**
     * Librairies to synchronizing data with database
     * see also app\js\services\dataSyncService.js
     */

    /** contextInfos */

    doneContextInfo = function (product_context) {
      $scope.subproject.ownProduct.forEach(function(product) {
        if (product_context && product_context[product.id]) {
          product.ownContextualInfos = product_context[product.id];
        }
         
      })
    }

    syncContextInfo = function ($scope,apiService) {

      let list_products = []
      $scope.subproject.ownProduct.forEach(function(product) {
         list_products.push( parseInt(product.id,10))
      })
      let string_products = list_products.join(",")
      apiService(string_products,function (result) {
           return doneContextInfo(result);
      });
    }

    /** contextInfos */

    doneAttachments = function (product_attachment) {
      $scope.subproject.ownProduct.forEach(function(product) {
        if (product_attachment && product_attachment[product.id]) {
          product.ownAttachments = product_attachment[product.id];
        }
        product.ownAttachments = product_attachment[product.id];
      })
    }

    syncAttachments = function ($scope,apiService) {
      let list_products = []
      $scope.subproject.ownProduct.forEach(function(product) {
         list_products.push( parseInt(product.id,10))
      })
      let string_products = list_products.join(",")
      apiService(string_products,function (result) {
           return doneAttachments(result);
      });
    }   

    doneReturns = function (products_returns) {
      $scope.subproject.ownProduct.forEach(function(product) {
        if (product.id && products_returns && products_returns[product.id]) {
          product.nb_returns = products_returns[product.id];
        }  
      
      })
    }
    
    syncReturns = function ($scope,apiService) {
      let list_products = []
      $scope.subproject.ownProduct.forEach(function(product) {
         list_products.push( parseInt(product.id,10))
      })
      apiService(list_products,function (result) {
           return doneReturns(result);
      });
    }     

    /** update farmer's dates and check if new requests, in this last case open a popup to refresh the current table */
    doneFarmers = function (result) {
      //update farmer date
      if (result.farmers) {
        $rootScope.$broadcast('date-wish-update-sync', result);
      }
      //if there is more requests, send swal  to reload the table
      if (result.requests) {
        checkNewRequests(result.requests);
      }
    }

    syncFarmers = function ($scope,apiService) {
      let list_products = []
      $scope.subproject.ownProduct.forEach(function(product) {
         list_products.push( parseInt(product.id,10))
      })      
      apiService($scope.subproject.ownProduct,function (result) {
        return doneFarmers(result);
      });

    }

    doneSuiviCells = function (result) {
      $rootScope.$broadcast('date-user-color-sync', result);
      $rootScope.$broadcast('suivi-cell-manual-sync', result);
    }

    syncSuiviCells = function ($scope,apiService) {
      let data_requested = {
        list_products : [],
        list_columns : []
      }
      let once = false;
      $scope.subproject.ownProduct.forEach(function(product) {
        data_requested.list_products.push(product.id);
        // same data are prsent many times, so we get columns once
        if (!once) {
          product.cells.forEach(function (cell) {
            data_requested.list_columns.push(cell.tableausuivicolumn_id)
          })
        }
        once = true;
       // 
      })
      apiService(data_requested,function (result) {
        return doneSuiviCells(result);
      });      
    }


    let synchronizeList = {
      'contextInfos': syncContextInfo,
      'attachments' : syncAttachments,
      'returns'     : syncReturns,
      'farmers'     : syncFarmers,
      'suivicells'   : syncSuiviCells
    }

    checkNewRequests = function  (newrequests) {
      let request_list = Object.keys(newrequests);
      let current_requests = {};
      $scope.subproject.ownProduct.forEach( function (product) {
          product.cells.forEach(function (cell) {
            cell.requests.forEach(function (request) {
              current_requests[request.id] = true;
            })
          })
      })
      let has_newrequest = false;
      request_list.forEach(
        function (request_id) {
            if (!current_requests[request_id]) {
              has_newrequest = true;
            }
        }
      );

      if (has_newrequest) {
      
        swal({
          title: "Nouvelles demandes ajoutées",
          text:  "veuillez rafraichir le tableau",
          type: "warning",
          showCancelButton: false,
          confirmButtonText: "Oui",
          closeOnConfirm: true
        }, function(isConfirm) {     
          if (isConfirm) {
              dataSync.stopSynchro();
              delete($rootScope.subprojects[$scope.subproject.id])
              $scope.showLoading = true;
              rest.init();
          }        
        });         
      }
    }

    /**
     *  passing to a popup to reload table when the popup is closed
     */
    reloadTable = function () {
      dataSync.stopSynchro();
      delete($rootScope.subprojects[$scope.subproject.id])
      $scope.showLoading = true;
      rest.init();
    }

    /**
     * Note that new sync (see app/js/services/dataSyncService.js) is delayed, so we can stop any existing synchronization
     * 
     */

    $scope.$on('$locationChangeStart', function( event ) {
      if (dataSync.getCurrentWatchedPage() != $location.path()) {   
          dataSync.stopSynchro(function () {
            dataSync.addPage2watch($location.path());
          });
      }
    });    

    /** Démarrage de la page */
    rest.init();

    $scope.filterByProductType = function(type) {
      $scope.filterProductType = type;
    }
  }
]);
