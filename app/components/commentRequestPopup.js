function CommentRequestPopup($rootScope, $filter, RequestService, $q, NotificationService){
    let ctrl = this;
    ctrl.saveComment = function(requests, comment, showTech) {
        if(showTech == null) showTech = false;
        let commentPromises = [];
        for(let i = 0; i < requests.length; i += 1){
            let request = requests[i];
            commentPromises.push(RequestService.saveNewComment(request.id, comment, showTech));
        }
        $q.all(commentPromises).then(function(commentPromises){
            let services = "planning,production";
            if(showTech) services += ",technicien";
            sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["8m4tsidm"], comment, $filter, "comment", $rootScope);
            ctrl.setAlertMessage({message: $rootScope._T["smy01l2w"], isError:false});
            angular.forEach(commentPromises, function (comment) {
                let request = $filter('filter')(requests, {id : comment.request_id}, true);
                if(request.length > 0 && request[0].ownComment != null) {
                    request[0].ownComment.push(comment);
                }
            });
        }, function (error) {
            ctrl.setAlertMessage({message: $rootScope._T["mi01ab8o"], isError:true});
            console.error(error);
        })
    };
}


Lantern.component('commentRequestPopup', {
    templateUrl: 'components/commentRequestPopup.html',
    controller: CommentRequestPopup,
    bindings: {
        requests: '<',
        setAlertMessage: '&',
        getSelectedRequests: '&'
    }
});