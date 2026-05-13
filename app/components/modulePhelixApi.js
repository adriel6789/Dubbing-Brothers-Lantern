
function modulePhelixApi($rootScope, PhelixAlula, Session,Notification,ProductService) {
    let ctrl = this;
    ctrl.phelixItem =[];
    ctrl.phelixItemList = [];
    ctrl.isShowSaveTitle = false;
    $rootScope.phelixListProductDeleted = [];

    addRemoveElementListProduct = function (key_id,selectedItem) {
      try {
        if(selectedItem.length > 0 && $rootScope.phelixListProduct != null && key_id != undefined){
         let index = $rootScope.phelixListProduct.map(function(o) { return o.Record_ID; }).indexOf(selectedItem[0].Record_ID);
           $rootScope.phelixListProductDeleted[key_id] = selectedItem[0]
           $rootScope.phelixListProduct.splice(index, 1);
          if($rootScope.phelix_exclude_ids.indexOf(selectedItem[0].Record_ID)< 0 )$rootScope.phelix_exclude_ids.push(selectedItem[0].Record_ID)
        }else if($rootScope.phelixListProductDeleted[key_id] != undefined){
          $rootScope.phelixListProduct.push($rootScope.phelixListProductDeleted[key_id])
          let index_2 = $rootScope.phelix_exclude_ids.indexOf($rootScope.phelixListProductDeleted[key_id].Record_ID) ; 
          if(index_2 >= 0 )$rootScope.phelix_exclude_ids.splice(index_2, 1);
         }
      } catch (error) {
        console.error(error)
      }
    }
    
    setExcludeProductPhelixRecordIds = function (id) {
      try {
          return PhelixAlula.listLinkedProductIds({subproject_id:id},function (result) {
            result.forEach(element => {
              if(element.record_job_id != null && $rootScope.phelix_exclude_ids != undefined  && $rootScope.phelix_exclude_ids.indexOf(element.record_job_id)< 0 )$rootScope.phelix_exclude_ids.push(element.record_job_id)
            });
          })
      } catch (error) {
        console.error('error',error)
      }
      
    }

    setExcludeSubprojectPhelixRecordIds = function (id) {
      try {
          return PhelixAlula.listLinkedSeasonIdsPhelix({project_id:id},function (result) {
            return true;  // remove this line  when not need anymore to ( allow link the same phelix season to multiple subproject)
            result.forEach(element => {
             if(element.record_job_id != null && $rootScope.phelix_exclude_subproject_ids != undefined  && $rootScope.phelix_exclude_subproject_ids.indexOf(element.record_job_id)< 0)$rootScope.phelix_exclude_subproject_ids.push(element.record_job_id)
            });
          })
      } catch (error) {
        console.error('error',error)
      }
    }

    ctrl.formatParamsFilter = function (data) {
      return { condition: JSON.stringify(data) };
    }
    ctrl.refreshPhelixItemList = function (textq) {
      if (textq != '') {
        ctrl.textSearch = textq;
      }
      if (ctrl.textSearch != undefined && ctrl.textSearch.length > 2) {
        let params = { q: ctrl.textSearch };

      switch (ctrl.elementType) {
        case 'product':
        case 'feature':
          try {
              if(ctrl.isSingle){
                $rootScope.phelix_exclude_ids = [];
                $rootScope.phelixListProduct = [];
                $rootScope.phelix_limit_call_ep = false;
                $rootScope.phelix_limit_call_exclude_ids = false;
              }
                if($rootScope.phelix_exclude_ids.length == 0 && !$rootScope.phelix_limit_call_exclude_ids ){
                  promiseProduct = setExcludeProductPhelixRecordIds(ctrl.elementData.subproject_id);
                  $rootScope.phelix_limit_call_exclude_ids = true;
                }
                if($rootScope.phelixListProduct.length == 0 && !$rootScope.phelix_limit_call_ep ){
                        $rootScope.phelix_limit_call_ep = true;
                          promiseProduct.$promise.then(
                                                      function (result) {
                                                        let dataCond = angular.copy(ctrl.titleParams);
                                                        dataCond.phelix_exclude_ids = $rootScope.phelix_exclude_ids;
                                                        ctrl.phelixItemList =  PhelixAlula.advancedSearchTitles(params, ctrl.formatParamsFilter(dataCond));
                                                        $rootScope.phelixListProduct = ctrl.phelixItemList ;
                                                      }); 
                        }else{
                          ctrl.phelixItemList = $rootScope.phelixListProduct;
                        }
            } catch (error) {
              console.error('error',error)
            }
          break;
      
        case 'subproject':
              $rootScope.phelix_exclude_ids = [];
              $rootScope.phelix_exclude_subproject_ids = [];
              $rootScope.phelix_limit_call_ep = false;
              $rootScope.phelix_limit_call_exclude_ids = false;
              try {
                if($rootScope.phelix_exclude_subproject_ids.length == 0 && ctrl.elementData != undefined){
                  promiseSubP = setExcludeSubprojectPhelixRecordIds(ctrl.elementData.project_id);
                  promiseSubP.$promise.then(
                                            function (result) {
                                              let dataCondSubproject = angular.copy(ctrl.titleParams);
                                              dataCondSubproject.phelix_exclude_ids = $rootScope.phelix_exclude_subproject_ids;
                                              ctrl.phelixItemList = PhelixAlula.advancedSearchTitles(params, ctrl.formatParamsFilter(dataCondSubproject));
                                              $rootScope.phelixListProduct = [];
                                            });
                }else{ // case of first creation project and season
                  ctrl.phelixItemList = PhelixAlula.advancedSearchTitles(params, ctrl.formatParamsFilter(ctrl.titleParams));
                  $rootScope.phelixListProduct = [];
                }
                
              } catch (error) {
                console.error('error',error)
              }
          break;
      
        case 'project':
        default:
             ctrl.phelixItemList = PhelixAlula.advancedSearchTitles(params, ctrl.formatParamsFilter(ctrl.titleParams));                               
          break;
      }
      }
    };
    // // preload the filtred elements from Phelix API
    if(ctrl.titleParams.phelix_season_title && ctrl.elementType && (ctrl.elementType == 'subproject'|| ctrl.elementType == 'product' )){
       ctrl.refreshPhelixItemList(ctrl.titleParams.phelix_season_title)
    }else if((ctrl.elementType == 'project' || ctrl.elementType == 'feature') && ctrl.elementData != undefined && ctrl.elementData.title_phelix !=''){
      ctrl.refreshPhelixItemList(ctrl.elementData.title_phelix)
    }

    ctrl.update = function(id) {
      try {
        ctrl.isShowSaveTitle = true;
        if(ctrl.elementType == 'product'){
          addRemoveElementListProduct(id,ctrl.phelixItem);
        }
        if(ctrl.phelixItem.length > 1){  
          ctrl.phelixItem.splice(0, 1);
        }
        let tempSelectedData = (ctrl.phelixItem[0] != undefined ? ctrl.phelixItem[0]: null)
        ctrl.onUpdate({selectedItem: tempSelectedData});  // push the data to the parent controller
      } catch (error) {
        console.error('error',error)
      }
    };


    ctrl.doneEditing = function(element) {
      let data = {};
      if(ctrl.elementType == 'product' || ctrl.elementType == 'feature' ){
        data[element] = (ctrl.phelixItem[0] != undefined ? ctrl.phelixItem[0].Title : null) ;
        data['record_job_id'] = (ctrl.phelixItem[0] != undefined ? ctrl.phelixItem[0].Record_ID : null);
        ProductService.updateProduct({
          id: ctrl.elementData.id
        }, data, function(product) {
          Notification.success($rootScope._T["xidwkts7"]);
            ctrl.isShowSaveTitle = false;
        }, function(error) {
          Notification.error($rootScope._T["zrlc1k8e"]);
        });
       }
    };

    ctrl.unlinkWithPhelix = function(id) {
      ctrl.elementData.title_phelix = null;
      if(ctrl.phelixItem.length > 0){  
        ctrl.phelixItem.splice(0, 1);
      }
      ctrl.update(id); 
    };
  }

Lantern.component("modulePhelixApi", {
  templateUrl: "components/modulePhelixApi.html",
  controller: modulePhelixApi,
  bindings: {
    titleParams: "=",
    isSingle: '<', // pull data from  view which included the component 
    elementType: '<', // pull data from  view which included the component 
    elementData: '<', // pull data from  view which included the component 
    hideSaveButton: '<', // pull data from  view which included the component 
    onUpdate: '&'  // push the data to the parent controller
  },
});
