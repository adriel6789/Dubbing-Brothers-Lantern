
function productsLinksPhelixApi($rootScope,Subproject,Notification,ProductService,ngDialog) {
    let ctrl = this;
    ctrl.isEnableSave = false;
    ctrl.data = null; // re init data to reload the ModulePhelixApi component 
    if(ctrl.subprojectId!= undefined){
      let params = { subprojectId: ctrl.subprojectId};
       ctrl.data =  Subproject.allProducts(params);
    }
    ctrl.allSave = function() {
      ctrl.isEnableSave = false;
      if(ctrl.data.ownProduct != undefined && ctrl.data.ownProduct.length >0 ){
        ctrl.data.ownProduct.forEach(product => {
          ctrl.saveProduct(product);
        });
         ngDialog.closeAll();
      }
    };

    ctrl.saveProduct = function (product) {
      let data = {title_phelix:product.title_phelix,record_job_id:product.record_job_id};
        ProductService.updateProduct({
          id: product.id
        }, data, function(product) {
          Notification.success($rootScope._T["xidwkts7"]);
        }, function(error) {
          Notification.error($rootScope._T["zrlc1k8e"]);
        });
    }

    ctrl.setProductInfoPhelix = function (product, phelix_data) {
      product.title_phelix= (phelix_data != undefined && phelix_data.Title != undefined ? phelix_data.Title : null);
      product.record_job_id= (phelix_data != undefined && phelix_data.Record_ID != undefined ? phelix_data.Record_ID : null);
      ctrl.isEnableSave = true;
    }
  }

Lantern.component("productsLinksPhelixApi", {
  templateUrl: "components/productsLinksPhelixApi.html",
  controller: productsLinksPhelixApi,
  bindings: {
    subprojectId: '<', // pull data from  view which included the component 
  },
});
