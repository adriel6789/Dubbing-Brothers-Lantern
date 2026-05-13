
function joblinesPhelixApi($rootScope, PhelixAlula,NgTableParams, $filter,Session,ApiRest,Notification) {
  let ctrl = this;
  ctrl.is_updated_Joblines = false;
  ctrl.is_condition_phelix_valid = false;

  ctrl.checkRequiredCondition = function(){
    let requiredWorkflowValues = [  ctrl.paramsWorkflow.record_id,
                                    ctrl.paramsWorkflow.doublage_type_id, 
                                    ctrl.paramsWorkflow.workflow_type_id,
                                    ctrl.paramsWorkflow.format_mix_id];
     return $rootScope.check_valid_workflow_values_phelix(requiredWorkflowValues, ctrl.paramsWorkflow.workflow_type_id, ctrl.paramsWorkflow.doublage_type_id, ctrl.paramsWorkflow.format_mix_id, ctrl.clientId, ctrl.actionTypeId);
  }
 // To refactor later 
  ctrl.listJoblinesPhelix = function (param) {
    console.log('param',param)
    ctrl.contentJoblines = []
    ctrl.contentJoblinesUnmatch = []
    ctrl.data = []
    ctrl.columns = []
    ctrl.columnsUnmatch = []
    let keyUnmatch = []
    PhelixAlula.listMatchingJoblinesPhelix( param,function (jobs) {
      if( jobs[0] != undefined && jobs[0]['error'] != undefined ){
          Notification.error($rootScope._T[jobs[0]['error']]);
          let errorString = JSON.stringify(jobs[0]['params']);
          // Show the error message using SweetAlert
          swal({
            title: $rootScope._T[jobs[0]['error']],
            text: errorString,
            type: "error",
          });
          return false;
      }
                jobs.forEach(function (job,key) {
                  if(key ==0) ctrl.columns = Object.keys(job);
                 ctrl.contentJoblines.push(job)
                });
    ctrl.tableParams = new NgTableParams(
                                          {page: 1,count: 20},
                                          { total:ctrl.contentJoblines.length, getData: function($defer, params) {
                                                      // use build-in angular filter
                                                      ctrl.data = params.sorting() ? $filter('orderBy')(ctrl.contentJoblines, params.orderBy()) : ctrl.contentJoblines;
                                                      ctrl.data = params.filter() ? $filter('filter')(ctrl.data, params.filter()) : ctrl.data;
                                                      ctrl.data = ctrl.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
                                                      $defer.resolve(ctrl.data);
                                                    }
                                          }); 
                                       
      PhelixAlula.listAllJoblinesPhelix( param,function (jobs) {
                  // set the headers fields
                  jobs.forEach(function (job,key) {
                    if(key ==0) ctrl.columnsUnmatch = Object.keys(job);
                  ctrl.contentJoblinesUnmatch.push(job)
                  });
                  // remove Joblines unmached with the Lantern workflow 
                  ctrl.contentJoblinesUnmatch.forEach(function (el,k) {
                      ctrl.contentJoblines.forEach(function (element) {
                            if(element.Job_ID ==el.Job_ID){
                                keyUnmatch.push(k)
                            }
                          });
                  })
                  const keyUnmatch_sorted = Object.values(keyUnmatch).sort((a, b) => b - a);
                  // remove Joblines unmached with the Lantern workflow 
                  keyUnmatch_sorted.forEach(function (i) {
                    ctrl.contentJoblinesUnmatch.splice(i,1);
                   })

      ctrl.tableParamsUnmatch = new NgTableParams(
                                            {page: 1,count: 20},
                                            { total:ctrl.contentJoblinesUnmatch.length, getData: function($defer, params) {
                                                        // use build-in angular filter
                                                        ctrl.dataUnmatch = params.sorting() ? $filter('orderBy')(ctrl.contentJoblinesUnmatch, params.orderBy()) : ctrl.contentJoblinesUnmatch;
                                                        ctrl.dataUnmatch = params.filter() ? $filter('filter')(ctrl.dataUnmatch, params.filter()) : ctrl.dataUnmatch;
                                                        ctrl.dataUnmatch = ctrl.dataUnmatch.slice((params.page() - 1) * params.count(), params.page() * params.count());
                                                        $defer.resolve(ctrl.dataUnmatch);
                                                      }
                                            }); 

      });
    });
  };
  

  // save the links workflow with joblines in the DB
  ctrl.createUpdateDBLinkedPhelixJoblines = function (element_id,type_element,date_EDD) {
    let data ={user_id: Session.userId()};
    if(type_element =='request') data.request_id = element_id;
    if(type_element =='manual_date') data.tableausuivicell_id = element_id;
    Object.assign(data, ctrl.paramsWorkflow);
      PhelixAlula.saveDBLinkedPhelixJoblines({},data, function (response) {
         // update fields EDD on phelix side 
        if(type_element =='manual_date')
        ctrl.updatePhelixJoblinesEDDManually(data.tableausuivicell_id,date_EDD); 
        console.log("response",response)
      });
  };

  // update fields EDD / Workability/ Status  on phelix side 
  ctrl.updatePhelixJoblinesfieldsAuto = function (requestId) {
    let data = { request_id:requestId }
      PhelixAlula.updatePhelixJoblinesfieldsAuto({},data, function (response) {
        //TODO
        console.log("response",response)
      });
  };

  // update fields EDD on phelix side 
  ctrl.updatePhelixJoblinesEDDManually = function (tableausuivicellId,manual_date) {
    let data = { 
                tableausuivicell_id:tableausuivicellId,
                date: manual_date,
                is_ad_light:(ctrl.isAdLight != undefined ? ctrl.isAdLight:0)
                }
      PhelixAlula.updatePhelixJoblinesEDDManually({},data, function (response) {
        if( response[0] != undefined && response[0]['Error_Phelix'] != undefined ){
          Notification.error($rootScope._T["7mzovc61"]);
          let errorString = JSON.stringify(response[0]['Error_Phelix']);
          // Show the error message using SweetAlert
          swal({
            title: $rootScope._T["7mzovc61"],
            text: errorString,
            type: "error",
          });
        }else{
          Notification.success($rootScope._T["nyh55ouc"]);
          ctrl.is_updated_Joblines = true;
        }
        // show the updated joblines
        ctrl.listJoblinesPhelix(ctrl.paramsWorkflow);
        Notification.success($rootScope._T["tqrrbbit"]);
      });
  };

  if(ctrl.paramsWorkflow != undefined &&  ctrl.paramsWorkflow != null){
     ctrl.is_condition_phelix_valid = ctrl.checkRequiredCondition();
     if(ctrl.is_condition_phelix_valid)ctrl.listJoblinesPhelix(ctrl.paramsWorkflow);
  }

  ctrl.selected_date = "";
  if(ctrl.contentCell != undefined && ctrl.isAdLight != undefined  ){
    ctrl.selected_date = (ctrl.isAdLight ? ctrl.contentCell.phelix_edd_manual_ad_light : ctrl.contentCell.phelix_edd_manual)
  }

  ctrl.saveEDDManual = function(cell, product,selected_date){
    selected_date = new moment(selected_date).format("YYYY-MM-DD HH:mm:ss")
    let phelix_edd_manual_vcontent = (ctrl.isAdLight? 'phelix_edd_manual_ad_light':'phelix_edd_manual');
    cell[phelix_edd_manual_vcontent] = selected_date;
    if (cell.id) {
      ApiRest.put('/tableausuivicells', {}, {
        id: cell.id,
        [phelix_edd_manual_vcontent]: cell[phelix_edd_manual_vcontent],
        tableausuivicolumn_id: cell.tableausuivicolumn_id,
        checked: false,
      }, function(newCell) {
        ctrl.contentCell[phelix_edd_manual_vcontent] = newCell[phelix_edd_manual_vcontent];
        // create /  update Phelix joblines EDD
        ctrl.createUpdateDBLinkedPhelixJoblines(newCell.id,'manual_date',newCell[phelix_edd_manual_vcontent]) 
      }, function(error) {
        Notification.error(ResponseToastService.error.message);
      });
    } else {
      
      ApiRest.post('/tableausuivicells', {}, {
        product_id: product.id,
        [phelix_edd_manual_vcontent] : cell[phelix_edd_manual_vcontent] ,
        tableausuivicolumn_id: cell.tableausuivicolumn_id,
        checked: false,
      }, function(newCell) {
        ctrl.contentCell[phelix_edd_manual_vcontent] = newCell[phelix_edd_manual_vcontent];
        // update Phelix joblines EDD
        ctrl.createUpdateDBLinkedPhelixJoblines(newCell.id,'manual_date',newCell[phelix_edd_manual_vcontent]) 
      }, function(error) {
        Notification.error(ResponseToastService.error.message);
      });
    }
  };
}

Lantern.component("joblinesPhelixApi", {
  templateUrl: "components/joblinesPhelixApi.html",
  controller: joblinesPhelixApi,
  bindings: {
    paramsWorkflow: "<",
    contentProduct: "<",
    requestId: "<",
    tableausuivicellId: "<",
    expectedDeliveryDate: "<",
    contentCell: "<",
    clientId: "<",
    actionTypeId: "<",
    isAdLight: "<",
  },
});
