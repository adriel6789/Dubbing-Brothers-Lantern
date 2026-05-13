function ProjectCard($rootScope, $state, $filter, RequestService, $q, NotificationService, Notification, ClientService){
    let ctrl = this;
    let isShowStatus = false;
    ctrl.goToDetailRequest = function (requestId) {
        $state.go($state.current.name, {
            requestId:requestId
        });
    };

    ctrl.getFarmersToCopy = function(requests) {
        let stringToCopy = ""
        angular.forEach(requests, function(request) {
            if(request.farmer_id != null) stringToCopy += request.farmer_id + "\n"
        });
        return stringToCopy
    }

    ctrl.setAlertCopy = function() {
        Notification.success($rootScope._T["7f9pjyhg"])
    }

    ctrl.countRequest = function(requests) {
        return Object.keys(requests).length;
    };

    ClientService.getClients({}, function() {
        ctrl.clients = $rootScope.clientsLight
    }, ClientService.manageClientError)

    function setAlertMessage(messageString, isError) {
        isError?Notification.error(messageString):Notification.success(messageString);
    }

    ctrl.setShowStatus = (isShow) =>  isShowStatus = isShow;
    ctrl.getShowStatus = () => isShowStatus;

    ctrl.setStatusRequests = function(status, requestGroups) {
        angular.forEach(requestGroups, (requestGroup) => {
            let requestPromises = [];
            let isSendToTech = false;
            for(let i = 0; i < requestGroup.requests.length; i += 1){
                let request = requestGroup.requests[i];
                if(request.tech_writer_id != null && !isSendToTech) isSendToTech = true;
                requestPromises.push(RequestService.setStatusRequestDefer(status, request));
            }
            $q.all(requestPromises).then(function(requestPromises) {  
                let requests = requestPromises;
                let titleNotif = "";
                let services = "planning,production";
                if(isSendToTech) services += ",technicien";
                switch (status){
                    case "cancel":
                        titleNotif = $rootScope._T["p8tmmghz"]
                        sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["yp9tp27g"], $rootScope._T["p8tmmghz"], $filter, "cancel",$rootScope);
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
                setAlertMessage(titleNotif, false);
                ctrl.setShowStatus(false);
            }, function (error) {
                setAlertMessage($rootScope._T["o2u5kkvt"], true);
                console.error(error);
            })
        })
    };
}


Lantern.component('projectCard', {
    templateUrl: 'components/projectCard.html',
    controller: ProjectCard,
    bindings: {
        project: '<',
        requests: '<'
    }
});