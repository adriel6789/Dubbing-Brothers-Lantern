function StatusRequestPopup($rootScope, $filter, RequestService, $q, NotificationService, Session){
    let ctrl = this;
    // on ne peut PAS relancer des requetes qui ont encore des sessions actives dans le futur
    const lookingForPlannedSessions = function (farmers) {
        let canBeUnplanned = true
        farmers.forEach(function (farmer) {
            if (farmer.booking_id != '' && new Date(farmer.day).getTime() > new Date().getTime()) {
                canBeUnplanned = false
            }
        })
        return canBeUnplanned
    }

    ctrl.setStatusRequests = function(status, requests) {
        let requestPromises = [];
        let isSendToTech = false;
        if(status == 'on_hold'){
            swal($rootScope._T["208tm169"], $rootScope._T["b8h61zgq"]);
        }
        
        for(let i = 0; i < requests.length; i += 1){
            let request = requests[i];
            if(request.tech_writer_id != null && !isSendToTech) isSendToTech = true;
            requestPromises.push(RequestService.setStatusRequestDefer(status, request));
        }

        $q.all(requestPromises).then(function(requestPromises){
            let titleNotif = "";
            let services = "planning,production";
            if(isSendToTech) services += ",technicien";
            switch (status){
                case "cancel":
                    titleNotif = $rootScope._T["p8tmmghz"];
                    sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["yp9tp27g"], $rootScope._T["p8tmmghz"], $filter, "cancel", $rootScope);
                    break;
                case "unplanned":
                    titleNotif = $rootScope._T["gapuijwn"];
                    sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["hribawnh"], $rootScope._T["gapuijwn"], $filter, "replanification", $rootScope);
                    break;
                case "on_hold":
                    titleNotif = $rootScope._T["208tm169"];
                    sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["t0t3ypk6"], $rootScope._T["208tm169"], $filter, "on_hold", $rootScope);
                    break;
                case "not_on_hold":
                    titleNotif = $rootScope._T["rnao0xmj"];
                    sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["uutsizwg"], $rootScope._T["rnao0xmj"], $filter, "not_on_hold", $rootScope);
                    break;
                case "important":
                    titleNotif = $rootScope._T["0nis89uu"];
                    break;
                case "not_important":
                    titleNotif = $rootScope._T["jzswyjsa"];
                    break;
                case "finished":
                    titleNotif = $rootScope._T["ml2wen5e"];
                    break;
            }

            angular.forEach(requestPromises, function (requestPromise) {
                let request = $filter('filter')(requests, {id : requestPromise.id}, true);
                if(request.length > 0) {
                    request[0].is_canceled = requestPromise.is_canceled;
                    request[0].important = requestPromise.important;
                    request[0].on_hold = requestPromise.on_hold;
                    request[0].is_planned = requestPromise.is_planned;
                    request[0].is_done = requestPromise.is_done;
                    request[0].is_not_done = requestPromise.is_not_done;
                    request[0].is_sent_back = requestPromise.is_sent_back;
                    request[0].is_in_progress = requestPromise.is_in_progress;
                    request[0].is_finished = requestPromise.is_finished;
                    request[0].is_partial = requestPromise.is_partial;
                    request[0].is_validated_for_tech = requestPromise.is_validated_for_tech;
                }
            });
            ctrl.setAlertMessage({message:titleNotif, isError:false});
            if ($rootScope.canDisplay(5)) {
                ctrl.initPopup();
            }
        }, function (error) {
            ctrl.setAlertMessage({message: $rootScope._T["o2u5kkvt"], isError:true});
            console.error(error);
        })
    };
}


Lantern.component('statusRequestPopup', {
    templateUrl: 'components/statusRequestPopup.html',
    controller: StatusRequestPopup,
    bindings: {
        requests: '<',
        userRole: '<',
        setAlertMessage: '&',
        getSelectedRequests: '&',
        initPopup: '&'
    }
});
