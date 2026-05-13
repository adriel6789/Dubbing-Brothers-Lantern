function selectProductManagers ($rootScope, User, Favorite ){
    let ctrl = this;
    ctrl.selectedPerson = [];
    
    if(ctrl.elementId){
      ctrl.referentProject = Favorite.queryReferentProject({
        type: ctrl.elementType,
        idReferent: ctrl.elementId,
      }, function() {
        ctrl.referentProject.forEach(function(userReferent,key) {
          ctrl.selectedPerson.push(userReferent.user_id)
        });
      });
    }

    
    ctrl.users = User.findbypermission({
      app_code: 'bons-travaux-auto',
      level: 'charge_prod',
      branch_id: branchId
    }, function() {
      ctrl.users.forEach(function(user) {
        if (user.person != null) {
          user.name = user.person.firstname + " " + user.person.lastname;
        } else {
          user.name = user.firstname + " " + user.lastname;
        }
      });
    });

    ctrl.update = function() {
      if(ctrl.singleItem && ctrl.selectedPerson.length > 1){  // force the ui-select to set a single element
        ctrl.selectedPerson.splice(0, 1);
      }
         ctrl.onUpdate({selectedItem:ctrl.selectedPerson});  // push the data to the parent controller
    };
   
}

Lantern.component('selectProductManagers', {
  templateUrl: 'components/selectProductManagers.html',
  controller: selectProductManagers,
  bindings: {
    listpmanager: '=', // push to the html component 
    elementId: '<', // pull data from  view which included the component 
    singleItem: '<', // pull data from  view which included the component 
    elementType: '<', // pull data from  view which included the component 
    onUpdate: '&'  // push the data to the parent controller
  }
  
});