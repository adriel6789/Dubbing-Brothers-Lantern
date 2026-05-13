Lantern.component('suiviCellManual', {
  
  // Binds the attibute data to the component controller.
  bindings: {
    cell: '=',
    product: '=',
    column: '=',
    role: '=',
  },
  controller: function($rootScope, $filter, $scope, Notification, ApiRest, ContextualInfo, SuiviProdService,ngDialog) {
    $scope.hasContextInfo  = SuiviProdService.hasContextInfo()
    $scope.hasValidDate  = SuiviProdService.hasValidDate()
    $scope.hasValidItem  = SuiviProdService.hasValidItem()
    $scope.hasValidNote  = SuiviProdService.hasValidNote()
    $scope.hasClientNumber  = SuiviProdService.hasClientNumber()

    
    $scope.$on('suivi-cell-manual-sync', function(event, data) {
      
      let column_id = $scope.$ctrl.cell.tableausuivicolumn_id;
      let product_id = $scope.$ctrl.cell.product_id
      if (data && data[product_id] && data[product_id][column_id]
        
        ) {
          let list_field = Object.keys(data[product_id][column_id]);
          list_field.forEach( function (field) {
              if ($scope.$ctrl.cell[field] && data[product_id][column_id][field]) {
                $scope.$ctrl.cell[field] = data[product_id][column_id][field]
              }
          })
      }
    })  

    $scope.$watch('checked',function(newV, oldV){
      $scope.checked = newV;
    });

    $scope.popoverTrick = false;
    $scope.closePopover = function() {
      $scope.popoverTrick = !$scope.popoverTrick;
    }

    $scope.saveChange = function(cell, product) {
      if (!$scope.checked) {
        $scope.checked = cell.checked;
      };
      if (cell.id) {
        ApiRest.put('/tableausuivicells/cells/check', {}, {
          id: cell.id,
          checked: $scope.checked,
          checked_date : moment().format('YYYY-MM-DD HH:mm:ss'),
          plain_value: cell.plain_value,
          tableausuivicolumn_id: cell.tableausuivicolumn_id,
        }, function(newCell) {
          cell.checked = newCell.checked;
          cell.checked_date = newCell.checked_date;
          Notification.success($rootScope._T["tqrrbbit"]);
          $scope.closePopover();
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      } else {
        ApiRest.post('/tableausuivicells/cells/check', {}, {
          checked: $scope.checked,
          product_id: product.id,
          checked_date : moment().format('YYYY-MM-DD HH:mm:ss'),
          tableausuivicolumn_id: cell.tableausuivicolumn_id,
          plain_value: cell.plain_value
        }, function(newCell) {
          cell.checked = newCell.checked;
          cell.checked_date = newCell.checked_date;
          Notification.success($rootScope._T["tqrrbbit"]);
          $scope.closePopover();
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      }
    };

    $scope.setCheck = function(checked) {
      $scope.checked = checked == '1' ? '0' : '1';
    }

    // Prep enre
    $scope.savePrepEnr = function(cell, product){
      if (!$scope.checked) {
        $scope.checked = cell.checked;
      };
      if (cell.id) {
        ApiRest.put('/tableausuivicells', {}, {
          id: cell.id,
          checked: $scope.checked,
          checked_date : moment().format('YYYY-MM-DD HH:mm:ss'),
          plain_value: cell.plain_value,
          sent_date : cell.sent_date,
          reception_date : cell.reception_date,
          prod_validation_date :cell.prod_validation_date,
          note: cell.note,
          tableausuivicolumn_id: cell.tableausuivicolumn_id,
        }, function(newCell) {
          cell.checked = newCell.checked;
          cell.checked_date = newCell.checked_date;
          Notification.success($rootScope._T["tqrrbbit"]);
          $scope.closePopover();
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      } else {
        ApiRest.post('/tableausuivicells', {}, {
          product_id: product.id,
          checked: $scope.checked,
          checked_date : moment().format('YYYY-MM-DD HH:mm:ss'),
          sent_date : cell.sent_date,
          reception_date : cell.reception_date,
          prod_validation_date :cell.prod_validation_date,
          tableausuivicolumn_id: cell.tableausuivicolumn_id,
          plain_value: cell.plain_value,
          note: cell.note
        }, function(newCell) {
          cell.checked = newCell.checked;
          cell.checked_date = newCell.checked_date;
          Notification.success($rootScope._T["tqrrbbit"]);
          $scope.closePopover();
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      }
    };

    $scope.returnContextInfo = function(product, name, workflow) {
      var info = {};
      var found = false;
      if (product.ownContextualInfos != null) {
        product.ownContextualInfos.forEach(function(contextinfo) {
          if (contextinfo.workflow_id == workflow.id && contextinfo.name == name && !found) {
            info = contextinfo;
            if (name == "ordre_diff") {
              info.value = parseInt(info.value);
            }
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
        if ((element == "due_date" || element == "diff_date" || element == "sortie_france") && updatedContext.value != "") {
          updatedContext.value = moment(updatedContext.value, validDateFormat, true).format("DD/MM/YYYY");
        }
        updatedContext.$update({
          id: context.id
        }, function(data) {
          //Mettre un indicateur d'update
          product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: product.id
          });
          $scope.closePopover();
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      } else {
        newContext = new ContextualInfo();
        newContext.value = this.$data;
        if ((element == "due_date" || element == "diff_date" || element == "sortie_france") && newContext.value != "") {
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
          $scope.closePopover();
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      }
    };
   
    let paramsWorkflow = null;
    // set ngdialog popup for Phelix
    $scope.eddPhelixDialog = function(is_adight) {
            $scope.isAdLight = is_adight;
            ngDialog.open({
            className: 'ngdialog-theme-demand popup',
            width: '80%',
            template: 'views/Dialog/template_phelixEDD.html',
            // className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback:function(){
              $scope.isCallBuildParamWorkflow = false; 
              paramsWorkflow = null;
            } 
        });
  };

  $scope.isCallBuildParamWorkflow = false;

  $scope.buildParamWorkflow = function(product, workflow_id,is_ad_light) {
    try {
      if(!$scope.isCallBuildParamWorkflow && product.sharedWorkflow!= undefined && workflow_id != undefined){
        let index = product.sharedWorkflow.map(function(o) { return o.id; }).indexOf(workflow_id);
          paramsWorkflow  =  { record_id: product.record_job_id,
                                workflow_type_id: product.sharedWorkflow[index].workflow_type_id,
                                doublage_type_id: product.sharedWorkflow[index].doublage_type_id,
                                format_mix_id: product.sharedWorkflow[index].format_mix_id,
                                language_id: product.sharedWorkflow[index].language_id,
                                is_ad_light: is_ad_light
                              };
      $scope.isCallBuildParamWorkflow =true;
      }
    return paramsWorkflow;
    } catch (error) {
      console.error('error',error)
    }
  }

  $scope.isValidDoublageTypeId = function(product, workflow_id) {
    try {
        if(product.sharedWorkflow!= undefined && workflow_id != undefined){
          let index = product.sharedWorkflow.map(function(o) { return o.id; }).indexOf(workflow_id);
          //valid condition : FRP and format_mix_id = 2 (5.1) OR all language - FRP and  format_mix_id = 4 (ATMOS)
          if(product.sharedWorkflow[index].doublage_type_id == 2  && (
            (product.sharedWorkflow[index].language_id == "1" && product.sharedWorkflow[index].format_mix_id == "2" ) ||
            (product.sharedWorkflow[index].language_id != "1" && product.sharedWorkflow[index].format_mix_id == "4" ) 
            )){
              return true;
            }else
              return false;
          }
    } catch (error) {
      console.error('error',error)
    }
  }
  
  },


  // le template permet une dérivation entre
  // app/partials/Components/suiviCellManual.html
  // app/partials/Components/suivi_preview_cells/suiviCellManual.html
  templateUrl: 'partials/Components/suiviCellManual.html'
});

Lantern.component('suiviCellUserColor',{
  bindings: {
    cell: '=',
    product: '=',
    column: '=',
    role: '=',
  },
  controller: function ($filter, $scope, Notification, ApiRest, ContextualInfo) {
    $scope.popoverTrickUC = false;

    $scope.closePopover = function() {
      $scope.popoverTrickUC = !$scope.popoverTrickUC;
    }    

    $scope.saveUserColorComment = function (cell,colored) {   
      if (colored == 0) cell.colornote = ''
      ApiRest.put('/tableausuivicells', { }, {
        product_id: cell.product_id,
        tableausuivicolumn_id: cell.tableausuivicolumn_id,
        colored: colored,
        colornote: cell.colornote,
        checked: cell.checked
      }, function(success) {
        cell.colored = colored;
        $scope.closePopover();
      }, function(error) {
        $scope.closePopover();
      });
 
    }
    $scope.$on('date-user-color-sync', function(event, data) {
      let column_id = $scope.$ctrl.cell.tableausuivicolumn_id;
      let product_id = $scope.$ctrl.cell.product_id
      if (data && data[product_id] && data[product_id][column_id]
        
        ) {
          let list_field = Object.keys(data[product_id][column_id]);
          list_field.forEach( function (field) {
              if ($scope.$ctrl.cell[field] && data[product_id][column_id][field]) {
                $scope.$ctrl.cell[field] = data[product_id][column_id][field]
              }
          })
      }

    })

  },
  templateUrl: 'partials/Components/suivi/user_color.html'

})
