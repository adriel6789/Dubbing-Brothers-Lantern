function SearchIdPopup($document, $rootScope, $state){
    const ctrl = this;

    let show;

    ctrl.historicRequests = [];

    ctrl.setShowSearch = function(isShow) {
        show = isShow;
    };
    ctrl.isShow = function() {
        return show;
    };

    ctrl.goToRequestPopup = function (requestId, fromHistoric) {
        $state.go($state.current.name, {
            requestId: requestId
        });
        ctrl.historicRequests.push({id :ctrl.historicRequests.length, requestId : requestId});
        ctrl.setShowSearch(false);
        if(!fromHistoric) $rootScope.$apply();
    };

        /**
         * Handle keydown events.
         */
        function keydown(e) {
            if (e.keyCode === 32 && e.ctrlKey) {
                ctrl.setShowSearch(!ctrl.isShow());
                $rootScope.$apply();
            }
            if(ctrl.isShow() && e.keyCode === 13 ) {
                const request_id = (/([0-9]{1,6}$)/g).test(ctrl.requestId)?
                    (/([0-9]{1,6}$)/g).exec(ctrl.requestId)[0]:null;
                if(request_id !== null){
                    ctrl.goToRequestPopup(request_id);
                } else {
                    console.error("Id must be a number or a FarmerId !")
                }
            }
        }
        // Start listening to key typing.
        $document.on('keydown', keydown);
}


Lantern.component('searchIdPopup', {
    templateUrl: 'components/searchIdForPopup.html',
    controller: SearchIdPopup
});