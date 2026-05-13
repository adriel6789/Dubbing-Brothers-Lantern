
function requestPhelixApi($rootScope, PhelixAlula, Session, $localstorage) {
  let ctrl = this;
  ctrl.jobAlulaLinked = [];
  ctrl.jobsAlula = [];
  ctrl.listJobTypeFilter = [];
  ctrl.listJobConfigurationFilter = [];
  ctrl.selectedJobTypeFilter = [];
  ctrl.selectedJobConfigurationFilter = [];
  ctrl.textSearch = [];
  ctrl.listJobLinkedRequest = [];
  ctrl.selectedJobLinkedRequest = [];
  ctrl.setting = {
    enableSearch: true,
    showSelectAll: true,
    keyboardControls: true,
    showCheckAll: true,
    scrollable: true,
    idProp: "id",
    displayProp: "name",
    scrollableHeight: "300px",
  };
  ctrl.settingJobs = angular.copy(ctrl.setting);
  ctrl.settingJobs.idProp = "alula_job_id";

  ctrl.searchSelectTranslationTexts = {
    checkAll: $rootScope._T["466gs99c"],
    uncheckAll: $rootScope._T["m775bp4g"],
    searchPlaceholder: $rootScope._T["dnu9bvek"],
    buttonDefaultText: $rootScope._T["0fnnoz79"],
  };

ctrl.setlistAllJobFilters = function () {
  if (ctrl.listAllJobFilters.job_configurationList) {
    ctrl.listJobConfigurationFilter = ctrl.listAllJobFilters.job_configurationList;
  }
  if (ctrl.listAllJobFilters.job_typeList) {
    ctrl.listJobTypeFilter = ctrl.listAllJobFilters.job_typeList;
  }
};

if ( $localstorage.getObject("cache_listAllJobFilters") != undefined && $localstorage.getObject("cache_listAllJobFilters")) {
    ctrl.listAllJobFilters = $localstorage.getObject("cache_listAllJobFilters");
    ctrl.setlistAllJobFilters(); 
  }else{
    ctrl.listAllJobFilters = PhelixAlula.listJobFilters({},function () {
        $localstorage.setObject("cache_listAllJobFilters", ctrl.listAllJobFilters);  //store the data localy 
        ctrl.setlistAllJobFilters();
      }
    );
  }

 ctrl.listJobsIdsLinkedToRequest = function () {
  ctrl.listJobLinkedRequest = PhelixAlula.listLinkedAlulaJobsToRequest({request_id: ctrl.requestData.id },function () {});
 }
  ctrl.listJobsIdsLinkedToRequest(); 

  ctrl.formatParamsFilter = function () {
    let job_typeSelected = [];
    let job_configurationSelected = [];

    ctrl.selectedJobTypeFilter.forEach((element) => {
      job_typeSelected.push(element.id);
    });
    ctrl.selectedJobConfigurationFilter.forEach((element) => {
      job_configurationSelected.push(element.id);
    });
    return {condition: JSON.stringify({ 'job_typeSelected': job_typeSelected, 'job_configurationSelected':job_configurationSelected })};
  };
  
  ctrl.refreshjobsAlula = function (textq, request_id) {
    if(textq !=''){
      ctrl.textSearch[request_id] = textq;
    }
    if (ctrl.textSearch[request_id]!= undefined && ctrl.textSearch[request_id].length > 2) {
      let params = { q: ctrl.textSearch[request_id] };
      ctrl.jobsAlula[request_id] = PhelixAlula.advancedSearch( params, ctrl.formatParamsFilter());
    }
  };

  ctrl.saveLinkedJobIdsAlula = function (jobIds, requestId) {
    let data = { 'alulaJobIds' : JSON.stringify({ job_ids: jobIds })};
     PhelixAlula.addLinkedRequestAlulaJobs({ request_id: requestId, user_id: Session.userId() },data, function (response) {
       ctrl.jobAlulaLinked[requestId] = []; // reset values
       ctrl.listJobsIdsLinkedToRequest(); // refresh the list
     });
  };

  ctrl.extractJobIdsToUnlink = function () {
    let job_idsSelected = [];
    ctrl.selectedJobLinkedRequest.forEach((element) => {
      job_idsSelected.push(element.id);
    });
    return JSON.stringify({ job_ids: job_idsSelected });
  };

  ctrl.unlinkJobIdsAlula = function (requestId) {
     let params = {request_id: requestId, alulaJobIds: ctrl.extractJobIdsToUnlink()};
     PhelixAlula.removeLinkedRequestAlulaJobs(params, function (response) {
       ctrl.selectedJobLinkedRequest = []; // reset values
       ctrl.listJobsIdsLinkedToRequest(); // refresh the list
     });
  };

  ctrl.resetDatesLinkedJobIdsAlula = function (requestId) {
     let data = { alulaJobIds: ctrl.extractJobIdsToUnlink() };
     PhelixAlula.resetDatesLinkedRequestAlulaJobs({ request_id: requestId, user_id: Session.userId() },data, function (response) {
       ctrl.selectedJobLinkedRequest = []; // reset values
       ctrl.listJobsIdsLinkedToRequest(); // refresh the list
     });
  };

}

Lantern.component("requestPhelixApi", {
  templateUrl: "components/requestPhelixApi.html",
  controller: requestPhelixApi,
  bindings: {
    listJobs: "=", // push to the html component
    requestData: "=", // push to the html component
    allRequestsData: "=", // push to the html component
  },
});
