
function productManagers ($rootScope, ApiRest){
    let rest = {};
    let ctrl = this;
    rest.getChargeProd = function (project_id, paramReferent, done) {
        ApiRest.get('/users/findFavoriteUsers/bons-travaux-auto/charge_prod/'+project_id+paramReferent,{},
        function (response) {
        return done(response)
        }, 
        function (error) {return done([])}

        );
    }

    getChargeProd = function(data_subproject) {
        let project = data_subproject.project
        let subproject_id = data_subproject.id;
        let is_referent = 1;
        let paramReferent = "?subproject_id="+subproject_id+'&is_referent='+is_referent ;
        if ( $rootScope.chargeprod[subproject_id] ) {
            ctrl.chargeprod = $rootScope.chargeprod[subproject_id]
        } else {
            rest.getChargeProd(project.id,paramReferent,function (users) {
                if (!$rootScope.chargeprod[subproject_id]) $rootScope.chargeprod[subproject_id] = []
                    ctrl.chargeprod = []
                    users.forEach(function (user) {
                    ctrl.chargeprod.push(user)
                    $rootScope.chargeprod[subproject_id].push(user)
                })
            });
        }
    }
    let project = this.projectData; //retrieve the data from the html component 
    if(project != undefined){
        getChargeProd(project); 
    }else console.warn("project is undefined");
}

Lantern.component('productManagers', {
  templateUrl: 'components/productManagers.html',
  controller: productManagers,
  bindings: {
    pmanagers: '=', // push to the html component 
    projectData: '<' // get from the html component 
  }
  
});