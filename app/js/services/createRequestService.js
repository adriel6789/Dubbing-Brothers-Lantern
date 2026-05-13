'use strict';

/**
 *  script managing opening and closing popup to create requests
 * 
 */

/* Services */
Lantern.factory('CreateRequestService', ['ApiRest', 'Session', 'ngDialog', '$document',
  function(ApiRest, Session, ngDialog, $document) {
    const service = {}
    let page = 'createDemand/createDemand.html'
    let controller = 'CreateDemandCtrl'

    service.createRequestDialog = function(product_ids, workflow_ids, request_ids, return_ids, etape_action_id,reloadTable, workflow) {
      let data = {};
      data.product_ids = product_ids;
      data.workflow_ids = workflow_ids;
      data.request_ids = request_ids;
      data.return_ids = return_ids
      data.etape_action_id = etape_action_id
      data.workflow = workflow
      let dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '70%',
        height:'80%',
        data: data,
        template: page,
        controller: controller,
        closeByDocument: false
      });
      dialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          if (reloadTable) {
            reloadTable();
          } else {
            window.location.reload();
          }
        }
      });
    };

    return service;
  }
]);


Lantern.factory('AdvancedCreateDemandCtrl', ['ApiRest', 'Session', 'ngDialog', '$document',
  function(ApiRest, Session, ngDialog, $document) {
    const service = {}
    let page = 'createDemand/createDemand.html'
    let controller = 'AdvancedCreateDemandCtrl'

    service.createRequestDialog = function(product_ids, workflow_ids, request_ids, return_ids, etape_action_id,reloadTable) {
      let data = {};
      data.product_ids = product_ids;
      data.workflow_ids = workflow_ids;
      data.request_ids = request_ids;
      data.return_ids = return_ids
      data.etape_action_id = etape_action_id
      let dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        width: '70%',
        height:'80%',
        data: data,
        template: page,
        controller: controller,
        closeByDocument: false
      });
      dialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          if (reloadTable) {
            reloadTable();
          } else {
            window.location.reload();
          }
        }
      });
    };

    return service;
  }
]);
