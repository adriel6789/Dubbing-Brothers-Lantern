'use strict';

/* Services */

var bonsServices = angular.module('bonsServices', ['ngResource']);

var token = $.cookie('token')
var app_code = $.cookie('app_code')
let branchId = 1

bonsServices.factory('Project', ['$resource', 'Session',
  function($resource, Session) {
    branchId = Session.branchId();
    return $resource(URL_API + '/projects/:projectId', {}, {
      queryTrue: {
        method: 'GET',
        params: {
          projectId: ''
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryFalse: {
        method: 'GET',
        params: {
          projectId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        headers: {
          branch: branchId
        },        
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          projectId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          projectId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      search: {
        method: 'GET',
        params: {
          projectId: 'search'
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);


bonsServices.factory('Subproject', ['$resource',
  function($resource) {
    return $resource(URL_API + '/subprojects/:id', {}, {
      get: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      saveMetricsLabel: {
        method: 'POST',
        params: {
          id: 'savemetricslabel'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      allProducts: {
        method: 'GET',
        params: {
          id: 'allproducts'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);


bonsServices.factory('Record', ['$resource',
  function($resource) {
    return $resource(URL_API + '/recordings/:recordId', {}, {
      queryTrue: {
        method: 'GET',
        params: {
          recordId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryFalse: {
        method: 'GET',
        params: {
          recordId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          recordId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          recordId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getRecordBy: {
        method: 'GET',
        params: {
          recordId: 'recordsby' + '?filter_name=' + '@filter_name' + '&filter_value=' + '@filter_value'
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Editing', ['$resource',
  function($resource) {
    return $resource(URL_API + '/editings/:editingId', {}, {
      queryTrue: {
        method: 'GET',
        params: {
          editingId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryFalse: {
        method: 'GET',
        params: {
          editingId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          editingId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          editingId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getEditingsBy: {
        method: 'GET',
        params: {
          editingId: 'editingsby' + '?filter_name=' + '@filter_name' + '&filter_value=' + '@filter_value'
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);


bonsServices.factory('Product', ['$resource',
  function($resource) {
    return $resource(URL_API + '/products/:productId', {}, {
      queryTrue: {
        method: 'GET',
        params: {
          productId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryFalse: {
        method: 'GET',
        params: {
          productId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      searchScreenerProducts: {
        method: 'GET',
        params: {
          productId: 'search-screener-products'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      linkScreenerProducts: {
        method: 'POST',
        params: {
          productId: 'link-screener-product'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      deleteScreenerProductLink: {
        method: 'DELETE',
        params: {
          productId: 'link-screener-product'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getScreenerComments: {
        method: 'GET',
        params: {
          productId: 'screener-comments'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          productId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          productId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);


bonsServices.factory('NotificationService', ['$resource',
  function($resource) {
    return $resource(URL_API + '/Notifs/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      deleteByCommonId: {
        method: 'DELETE',
        params: {
          id: 'bycommonid.json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      archivedNotifsByUser: { method: 'PUT', params: { id: 'archivedfinishedandinprogress' }, headers: { 'Content-Type': 'application/json' },
        isArray: true, cache: false, timeout: -1
      },
      count: {
        method: 'GET',
        params: {
          id: 'count'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getNotifsBy: {
        method: 'GET',
        params: {
          id: 'notifsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getNotifsHomeBy: {
        method: 'GET',
        params: {
          id: 'notifshomeby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getNotifsStandardBy: {
        method: 'GET',
        params: {
          id: 'notifsstandardby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      distributeMailMiseDispo: {
        method: 'GET',
        params: {
          id: 'distributemailmisedispo'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('User', ['$resource',
  function($resource) {
    return $resource(URL_API + '/users/:userId', {}, {
      get: {
        method: 'GET',
        params: {
          userId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getCurrentUserDetails: {
        method: 'GET',
        params: {
          userId: 'currentuserdetails'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },      
      checkPermissionId: {
        method: 'GET',
        params: {
          userId: 'checkpermissionid'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },      
      query: {
        method: 'GET',
        params: {
          userId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          userId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          userId: 'currentuser'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      findbypermission: {
        method: 'GET',
        params: {
          userId: 'findbypermission'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },      
      findMetricsClientUsers: {
        method: 'GET',
        params: {
        	userId: 'findmetricsclientusers'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      findMetricsUsers: {
        method: 'GET',
        params: {
        	userId: 'findmetricsusers'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      saveMetricsUsers: {
        method: 'POST',
        params: {
        	userId: 'savemetricsusers'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
    });
  }
]);

bonsServices.factory('Valuelist', ['$resource','Session',
  function($resource, Session) {
    branchId = Session.branchId();
    return $resource(URL_API + '/valuelists/:tableName', {}, {
      query: {
        method: 'GET',
        params: {
          tableName: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getActionTypesByEtape: {
        method: 'GET',
        params: {
          tableName: 'action_types_by_etape'
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getEtapeTypes: {
        method: 'GET',
        params: {
          tableName: 'etape_types'
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getEtapeActionByWorkflow: {
        method: 'GET',
        params: {
          tableName: 'ActionsByEtape'
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
    });
  }
]);

bonsServices.factory('Observation', ['$resource',
  function($resource) {
    return $resource(URL_API + '/observations/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      querybyrequestid: {
        method: 'GET',
        params: {
          id: 'observationsbyrequestid' + '?request_id=' + '@request_id'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      querybyuuid: {
        method: 'GET',
        params: {
          id: 'observationsbyuuid'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Return', ['$resource',
  function($resource) {
    return $resource(URL_API + '/returns/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      querybyrequestid: {
        method: 'GET',
        params: {
          id: 'returnsbyrequestid' + '?request_id=' + '@request_id'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      querybyproductid: {
        method: 'GET',
        params: {
          id: 'returnsbyproductid' + '?product_id=' + '@product_id'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      querybyworkflowid: {
        method: 'GET',
        params: {
          id: 'returnsbyworkflowid' + '?workflow_id=' + '@workflow_id' + '&product_id=' + '@product_id'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          id: 'create'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'POST',
        params: {
          value: ''
        },        
        params: {
          id: 'update'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getReturnActions: {
        method: 'GET',
        params: {
          id: 'returnactions'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getWorkflowLanguage: {
        method: 'GET',
        params: {
          id: 'workflowlanguage'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getWorkflowTypeDoublage: {
        method: 'GET',
        params: {
          id: 'workflowtypedoublage'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getReturnType: {
        method: 'GET',
        params: {
          id: 'returntype'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      productsWithReturn: {
        method: 'GET',
        params: {
          id: 'productswithreturn'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      subProjectsWithReturn: {
        method: 'GET',
        params: {
          id: 'subprojectswithreturn'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getReturnsBy: {
        method: 'GET',
        params: {
          id: 'returnsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Qc', ['$resource',
  function($resource) {
    return $resource(URL_API + '/returns/qcinfos/:values', {}, {
      getQcInfos:{
        method: 'GET',
        params: {
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getQcValues:{
        method: 'GET',
        params: {
          values: 'values'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getQcSeverity:{
        method: 'GET',
        params: {
          values: 'severity'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getTechWriterName:{
        method: 'GET',
        params: {
          values: 'techwriterid'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getQcId:{
        method: 'GET',
        params: {
          values: 'qcid'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getQcInfosTc:{                  
        method: 'GET',
        params: {
          values: 'qcinfostc'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getQcInfosByWorkflow:{                  
        method: 'GET',
        params: {
          values: 'qcinfosbyworkflow'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },getQcExport:{                  
        method: 'GET',
        params: {
          values: 'qcexport'
        },
        response: function (response) {
          // Get the instance from the response object
          var instance = response.resource;
          return instance;
        },
        responseType: 'arraybuffer',
        transformResponse: [],
        transformRequest: [],
        isArray: false,
        cache: false,
        timeout: -1
      }, 
      getQcLogValues:{                  
        method: 'POST',
        params: {
          values: 'getqclogvalues'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      postQcInfos: {
        method: 'POST',
        params: {
          values: 'postqcinfos'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postQcModifyInfos: {
        method: 'POST',
        params: {
          values: 'postqcmodifyinfos'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postQc: {
        method: 'POST',
        params: {
          values: 'postqc'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postQcInfosId: {
        method: 'POST',
        params: {
          values: 'postqcinfosid'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postQcTechnicalIssues: {
        method: 'POST',
        params: {
          values: 'postqctechnicalissues'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postQcAssetDetails: {
        method: 'POST',
        params: {
          values: 'postqcassetdetails'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      postModifyAssetDetails: {
        method: 'POST',
        params: {
          values: 'postmodifyassetdetails'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postFinalizeQC: {
        method: 'POST',
        params: {
          values: 'postfinalizeqc'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postModifyTi: {
        method: 'POST',
        params: {
          values: 'postmodifyti'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      deleteTi: {
        method: 'POST',
        params: {
          values: 'deleteti'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
    })
  }]
)

//TODO : à supprimer
bonsServices.factory('Return_Comment', ['$resource',
  function($resource) {
    return $resource(URL_API + '/returns/:id/:action', {}, {
      addcomment: {
        method: 'POST',
        params: {
          action: 'addcomment'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Comment', ['$resource',
  function($resource) {
    return $resource(URL_API + '/comments/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);



bonsServices.factory('Request', ['$resource','Session',
  function($resource, Session) {
    branchId = Session.branchId()
    return $resource(URL_API + '/requests/:requestId/:action/:actionId', {}, {
      query: {
        method: 'GET',
        params: {
          requestId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      saveDebugFinished: {
        method: 'POST',
        params: {
          requestId: 'debug_r_finished'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      saveDebugFinishedReturns: {
        method: 'POST',
        params: {
          requestId: 'debug_r_finished_with_returns'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      saveDebugProgress: {
        method: 'POST',
        params: {
          requestId: 'debug_r_in_progress'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      saveDebugNotdone: {
        method: 'POST',
        params: {
          requestId: 'debug_r_not_done'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          requestId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          requestId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getRequestsBy: {
        method: 'GET',
        params: {
          requestId: 'requestsby'
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getRequestsPlannedBy: {
        method: 'GET',
        params: {
          requestId: 'plannedrequestby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getRequestsPlannedCountBy: {
        method: 'GET',
        params: {
          requestId: 'plannedrequestby',
          count: true
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getRequestsCount:  {
        method:   'GET',
         params:  {
          requestId:   'requestsby',
           count: true
        },
         isArray:  false,
        cache: false,
        timeout: -1
      },
       
      replanRequest: {
        method: 'GET',
        params: {
          action: 'replan'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      farmerUpdate: {
        method: 'GET',
        params: {
          action: 'farmerupdate'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      countRequests: {
        method: 'GET',
        params: {
          action: 'countrequestsbyplanning'
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getHolydays: {
        method: 'GET',
        params: {
          action: 'holydays'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      adminCheckRequestsStatus: {
        method: 'GET',
        params: {
          requestId: 'checkRequestStatusError',
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);


bonsServices.factory('Farmer', ['$resource',
  function($resource) {
    return $resource(URL_API + '/farmerbookings/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      querybyrequestid: {
        method: 'GET',
        params: {
          id: 'bookingsbyrequestid'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postNoteTechInfos: {
        method: 'POST',
        params: {
          id: 'notetechinfos'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postDeleteNote: {
        method: 'POST',
        params: {
          id: 'deletenote'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postModifyNote: {
        method: 'POST',
        params: {
          id: 'modifynote'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postTechDayNotes: {
        method: 'POST',
        params: {
          id: 'techdaynotes'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getTechNote: {
        method: 'GET',
        params: {
          id: 'technote'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getTechDayNote: {
        method: 'GET',
        params: {
          id: 'techdaynote'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: 'byrequestid' + '?request_id=' + '@request_id'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      directUpdate: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getFarmersBy: {
        method: 'GET',
        params: {
          id: 'farmersby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getAudits: {
        method: 'GET',
        params: {
          id: 'audits'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getPrevisioFarmersBy: {
        method: 'GET',
        params: {
          id: 'previsiofarmersby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getIntercoFarmersBy: {
        method: 'GET',
        params: {
          id: 'intercofarmersby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getSonodiFacturations: {
        method: 'GET',
        params: {
          id: 'sonodifacturations'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      checkFarmer: {
        method: 'GET',
        params: {
          id: 'checkfarmer'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Mixage', ['$resource',
  function($resource) {
    return $resource(URL_API + '/mixings/:id', {}, {
      queryTrue: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryFalse: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getMixingsBy: {
        method: 'GET',
        params: {
          id: 'mixingsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Workflow', ['$resource',
  function($resource) {
    return $resource(URL_API + '/workflows/:workflowId', {}, {
      query: {
        method: 'GET',
        params: {
          workflowId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          workflowId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          workflowId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'findWorkflowOnProduct': {
        method: 'GET',
        params: {
          workflowId: 'find_workflow_on_product'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('MediaItems', ['$resource',
  function($resource) {
    return $resource(URL_API + '/mediaitems/:itemId', {}, {
      query: {
        method: 'GET',
        params: {
          itemId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          itemId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          itemId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      mediasealsecuritycode: {
        method: 'GET',
        params: {
          itemId: 'mediasealsecuritycode'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      findbyproduct: {
        method: 'GET',
        params: {
          itemId: 'findbyproduct'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      findbyproject: {
        method: 'GET',
        params: {
          itemId: 'findbyproject'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      findbyorigin: {
        method: 'GET',
        params: {
          itemId: 'findbyoriginandproduct' + '?origin=' + '@origin' + '&product_id=' + '@product_id'
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('RequestGroup', ['$resource',
  function($resource) {
    return $resource(URL_API + '/requestgroups/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryRequests: {
        method: 'GET',
        params: {
          id: 'allRequests'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getAllRequestsBy: {
        method: 'GET',
        params: {
          id: 'allrequestsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getAllRequestsPlannedBy: {
        method: 'GET',
        params: {
          id: 'allrequestsplannedby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getAllRequestsPlannedCountBy: {
        method: 'GET',
        params: {
          id: 'allrequestsplannedby',
          count: true
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      getAllRequestsCount:  {
        method:   'GET',
         params:  {
          id:   'allrequestsby',
           count:   'true'
        },
         isArray:  false,
        cache: false,
        timeout: -1
      },
      findGroupByRequestId: {
        method: 'GET',
        params: {
          id: 'findgroupbyrequestid'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Attachments', ['$resource',
  function($resource) {
    return $resource(URL_API + '/attachments/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      byRequestId: {
        method: 'GET',
        params: {
          id: 'byrequestid?'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      byProductId: {
        method: 'GET',
        params: {
          id: 'byproductid?'
        },
        isArray: true,
        cache: false,
        timeout: -1
      }, //Params : product_id
      byProducts: {
        method: 'GET',
        params: {
          id: 'allbyproductid'
        },
        isArray: false
      }, //Params : products         
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      postCopy: {
        method: 'POST',
        params: {
          id: 'copyattachment'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }, //Params : product_id
    });
  }
]);

bonsServices.factory('Client', ['$resource','Session',
  function($resource, Session) {
    branchId = Session.branchId()
    return $resource(URL_API + '/clients/:clientId', {}, {
      query: {
        method: 'GET',
        params: {
          clientId: ''
        },
        headers: {
          branch: branchId
        },        
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryById: {
        method: 'GET',
        params: {
          clientId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        headers: {
          branch: branchId
        },        
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          clientId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          clientId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      search: {
        method: 'GET',
        params: {
          clientId: 'search'
        },
        headers: {
          branch: branchId
        },        
        isArray: false,
        cache: false,
        timeout: -1
      },
      getClientsBy: {
        method: 'GET',
        params: {
          clientId: 'clientsby'
        },
        headers: {
          branch: branchId
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('PhelixAlula', ['$resource',
  function($resource) {
    return $resource(URL_API + '/requestdemands/:qname', {}, {
      query: {
        method: 'GET',
        params: {
          qname: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      listLinkedProductIds:{
        method: 'GET',
        params: {
          qname: 'listlinkedproductidstoPhelix'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      listLinkedSeasonIdsPhelix:{
        method: 'GET',
        params: {
          qname: 'listLinkedSeasonIdsToPhelix'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      search: {
        method: 'GET',
        params: {
          qname: 'alulajobsorders'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      listJobFilters: {
        method: "GET",
        params: {
          qname: "listconfigfilterphelix",
        },
        isArray: false,
        cache: false,
        timeout: -1,
      },
      advancedSearch: {
          method: "POST",
          headers: {
          'Content-Type': 'application/json'
          },
          params: {
            qname: "AlulaSearchJobsV2",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        addLinkedRequestAlulaJobs: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            qname: "linkedAlulaJobsToRequest",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        resetDatesLinkedRequestAlulaJobs: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            qname: "resetDatesAlulaJobs",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        removeLinkedRequestAlulaJobs: {
          method: "DELETE",
          // headers: {
          //   "Content-Type": "application/json",
          // },
          params: {
            qname: "linkedAlulaJobsToRequest",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        listLinkedAlulaJobsToRequest: {
          method: "GET",
          params: {
            qname: "listLinkedAlulaJobsToRequest",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        advancedSearchTitles: {
            method: "POST",
            headers: {
            'Content-Type': 'application/json'
            },
            params: {
              qname: "SearchTitlesPhelix",
            },
            isArray: true,
            cache: false,
            timeout: -1,
          },
         listMatchingJoblinesPhelix: {
          method: "GET",
          params: {
            qname: "listMatchingWorkflowJoblinesPhelix",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
         listAllJoblinesPhelix: {
          method: "GET",
          params: {
            qname: "allJoblinesPhelix",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        IsRequestIdLinkedPhelixJoblines: {
          method: "GET",
          params: {
            qname: "CheckRequestIdLinkedPhelixJoblines",
          },
          isArray: false,
          cache: false,
          timeout: -1,
        },
        saveDBLinkedPhelixJoblines: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            qname: "saveLinkedPhelixJoblines",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        updatePhelixJoblinesfieldsAuto: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            qname: "PhelixJoblinesAuto",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        saveCatchupRequestIdLinkedPhelixJoblines: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            qname: "CatchupRequestIdLinkedPhelixJoblines",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
        updatePhelixJoblinesEDDManually: {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            qname: "PhelixJoblinesEDDManually",
          },
          isArray: true,
          cache: false,
          timeout: -1,
        },
      }
    );
  }
]);

bonsServices.factory('Group', ['$resource',
  function($resource) {
    return $resource(URL_API + '/groups/:groupId', {}, {
      query: {
        method: 'GET',
        params: {
          groupId: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          groupId: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          groupId: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      search: {
        method: 'GET',
        params: {
          groupId: 'search'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      internal: {
        method: 'GET',
        params: {
          groupId: 'internal'
        },
        isArray: true,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Favorite', ['$resource',
  function($resource) {
    return $resource(URL_API + '/favorites/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryByFilters: {
        method: 'GET',
        params: {
          id: 'favoritesby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      saveFavoriteSubproject: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          id: 'FavoriteSubproject'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      removeReferentProjectOrSubproject: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          id: 'RemoveAllReferentProjectOrSubproject'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      queryReferentProject: {
        method: 'GET',
        params: {
          id: 'referentProjectSubproject'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
    });
  }
]);

bonsServices.factory('TechnicalSpec', ['$resource',
  function($resource) {
    return $resource(URL_API + '/technicalspecs/:id/:param2', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      queryBy: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      queryByFilters: {
        method: 'GET',
        params: {
          id: 'specsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      copy: {
        method: 'GET',
        params: {
          id: 'copy'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('TechnicalSpecInput', ['$resource',
  function($resource) {
    return $resource(URL_API + '/technicalspecsinputs/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getSpecInputBy: {
        method: 'GET',
        params: {
          id: 'specsinputsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('TechnicalSpecOutput', ['$resource',
  function($resource) {
    return $resource(URL_API + '/technicalspecsoutputs/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getSpecOutputBy: {
        method: 'GET',
        params: {
          id: 'specsoutputsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('StepsList', ['$resource',
  function($resource) {
    return $resource(URL_API + '/stepslists/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getStepsListBy: {
        method: 'GET',
        params: {
          id: 'stepsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Step', ['$resource',
  function($resource) {
    return $resource(URL_API + '/steps/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getStepsBy: {
        method: 'GET',
        params: {
          id: 'stepsby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('Reportvi', ['$resource',
  function($resource) {
    return $resource(URL_API + '/rapportsvis/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      getReportVisBy: {
        method: 'GET',
        params: {
          id: 'rapportsvisby'
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('ReportviObservation', ['$resource',
  function($resource) {
    return $resource(URL_API + '/rapportsvis/observation/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true,
        cache: false,
        timeout: -1
      },
      save: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('ContextualInfo', ['$resource',

  function($resource) {
    return $resource(URL_API + '/contextualinfos/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true
      },
      byProductId: {
        method: 'GET',
        params: {
          id: 'byproductid'
        },
        isArray: true
      }, //Params : product_id
      byProducts: {
        method: 'GET',
        params: {
          id: 'allbyproductid'
        },
        isArray: false
      }, //Params : products      
      byWorkflowId: {
        method: 'GET',
        params: {
          id: 'byworkflowid'
        },
        isArray: true
      }, //Params : workflow_id, product_id
      getContextualInfosBy: {
        method: 'GET',
        params: {
          id: 'contextualinfosby'
        },
        isArray: true
      },
      save: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      }
    });
  }
]);

bonsServices.factory('MetricsTemplate', ['$resource',
  function($resource) {
    return $resource(URL_API + '/metricstemplate/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true
      },
      post: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: true
      },
      getTemplatesList: {
        method: 'GET',
        params: {
          id: 'templateslist'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: true
      },
      getTemplatesListAllClients: {
        method: 'GET',
        params: {
          id: 'templateslistallclients'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: true
      },
      getTemplate: {
        method: 'GET',
        params: {
          id: 'loadtemplate'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: true
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      }
    });
  }
]);

bonsServices.factory('TableauSuivi', ['$resource',
  function($resource) {
    return $resource(URL_API + '/tableausuivis/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true
      },
      save: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      }
    });
  }
]);

bonsServices.factory('TableauSuiviCell', ['$resource',
  function($resource) {
    return $resource(URL_API + '/tableausuivicells/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true
      },
      getByProduct: {
        method: 'GET',
        params: {
          id: 'byproduct'
        },
        isArray: true
      },
      importClientNumbers: {
        method: 'POST',
        params: {
          id: 'importclientnumbers'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: true
      },
      save: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      }
    });
  }
]);

bonsServices.factory('TableauSuiviCellValues', ['$resource',
  function($resource) {
    return $resource(URL_API + '/tableausuivicellvalues/:id', {}, {
      save: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      }
    });
  }
]);

bonsServices.factory('TableauSuiviColumn', ['$resource',
  function($resource) {
    return $resource(URL_API + '/tableausuivicolumns/:id', {}, {
      save: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      },
      'delete': {
        method: 'DELETE',
        params: {
          id: ''
        },
        isArray: false
      },
      saveAllMetricsLabels: {
        method: 'POST',
        params: {
          id: 'saveallmetricslabels'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      },
      updateColumnMetricsDetails: {
        method: 'POST',
        params: {
          id: 'updatecolumnmetricsdetails'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.factory('TableauSuiviUserPref', ['$resource',
  function($resource) {
    return $resource(URL_API + '/tableausuiviuserpref/:id', {}, {
      query: {
        method: 'GET',
        params: {
          id: ''
        },
        isArray: true
      },
      save: {
        method: 'POST',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      },
      update: {
        method: 'PUT',
        params: {
          id: ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false
      }
    });
  }
]);

bonsServices.factory('MediaSealSecurityVersion', ['$resource',
  function($resource) {
    return $resource(URL_API + '/valuelists/mediasealsecurityversions', {}, {
      query: {
        method: 'GET',
        isArray: false
      },
      save: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        isArray: false,
        cache: false,
        timeout: -1
      }
    });
  }
]);

bonsServices.service('sharedServices', function ($rootScope, PhelixAlula, Notification) {
  /**
    * update fields EDD / Workability/ Status  on phelix side 
  */
  this.launchUpdatePhelixJoblinesFields = function(request, responseUpdated){
       try {
              let requiredWorkflowValues = [  request.product.record_job_id,
                                              request.id, // request_id
                                              request.workflow.doublage_type_id, 
                                              request.workflow.workflow_type_id,
                                              request.workflow.format_mix_id, 
                                              request.user_id,
                                              request.product.subproject.project.client_id,
                                              request.action_type_id
                                              ];
                  
            let is_valid_workflow_values_phelix = $rootScope.check_valid_workflow_values_phelix(requiredWorkflowValues,request.workflow.workflow_type_id, request.workflow.doublage_type_id,request.workflow.format_mix_id,request.product.subproject.project.client_id,request.action_type_id);
            if(is_valid_workflow_values_phelix && responseUpdated.is_done){  
                    let data = { request_id:request.id, }
                    PhelixAlula.updatePhelixJoblinesfieldsAuto({},data, function (response) {
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
                        }
                      },function (error) {
                          Notification.error($rootScope._T["7mzovc61"]);
                        console.error(error)
                      });
            }
          }catch(error){
            console.error(error);
          }
  }
});

