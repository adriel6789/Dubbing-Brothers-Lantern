function FarmerIdRequestPopup($rootScope, ProductService) {
    // originellement popup planification sans Vega
    // actuellement affiche uniquement les requetes pour copie et sélection
    let ctrl = this;

    ctrl.displayBookedRequests = function (request) {
        return true
      }    

    // si le famer associé request.isSelected = !request.isSelected;
    ctrl.manageSelection = function (request) {
        request.isSelected = !request.isSelected
    }

    ctrl.getFarmersToCopy = function(requests) {
        let stringToCopy = "";
        angular.forEach(requests, function(request) {
            if(request.farmer_id != null) stringToCopy += request.farmer_id + "\n";
        });
        return stringToCopy;
    };

    ctrl.setAlertCopy = function(isError) {
        if(isError)
            ctrl.setAlertMessage({message: $rootScope._T["oakgitt8"], isError:isError});
        else
            ctrl.setAlertMessage({message: $rootScope._T["7f9pjyhg"], isError:isError});
    };

    ctrl.productName = function(request) {
        return ProductService.getProductNameFromRequest(request);
    };

}

Lantern.component('farmerIdRequestPopup', {
    templateUrl: 'components/farmerIdRequestPopup.html',
    controller: FarmerIdRequestPopup,
    bindings: {
        requests: '<',
        setAlertMessage: '&',
        getSelectedRequests: '&',
        isAllRequestPlanned: '&',
        initSync: '&'
    }
});
