Lantern.controller('requestGroupCtrl',['$rootScope', '$filter', '$scope', '$stateParams', 'ApiRest', '$timeout', 
'RequestService', 'FileUploader', 'Session', 'Request', 'ProductService', 'Comment', 'Attachments', '$window', 
'Reportvi', 'ngDialog', 'Workflow', 'ReturnService', 'PersonsService', 'PhelixAlula', 
'dataSync','localUpdates', '$document','RoomService', 'ClientService', 'Valuelist', 'MediaItems',
function($rootScope, $filter, $scope, $stateParams, ApiRest, $timeout, RequestService, FileUploader, Session,
     Request, ProductService, Comment, Attachments, $window, Reportvi, ngDialog, Workflow, ReturnService, 
     PersonsService, PhelixAlula,
     dataSync, localUpdates, $document, RoomService, ClientService, Valuelist, MediaItems) {
        function newForm (event) {
            if (!$rootScope.canDisplay(5)) {
                // only admin and planning :)
                return
            }
            if (event.altKey && event.ctrlKey) {
                $scope.specialRequestForm = false
                event.preventDefault()
            }
            if (event.shiftKey && event.ctrlKey) {
                $scope.specialRequestForm = true
                event.preventDefault()
            }            
        }
        $document.on('keydown', newForm)
        $scope.specialRequestForm = false
        if ($rootScope.canDisplay(5)) {
            $scope.specialRequestForm = true
        }
        
        if (!$rootScope.workflowByEtapes) {
            $rootScope.workflowByEtapes = {}
        }
        
        if (!$rootScope.etapesWorkflowDoublage) {
            Valuelist.getEtapeActionByWorkflow({workflow_type_id:1}, function(etapes){
                $rootScope.etapesWorkflowDoublage = etapes
                etapes.forEach((etape) => {
                    $rootScope.workflowByEtapes[etape.name] = etape
                })
            })
        }
        const requestList = []
        
        /**
         * Variable declaration
         */
        let rest = {};
        let service = {};
        let loading;
        let alertMessage = {};
        let expand;
        let notFarmer;
        let uploader = [];
        let errorLoading;
        let mainRequestId;
        let artisticDirectors = [];
        let isShowSaveDirector;
        let allSimplemde = [];
        let allContributors;
        let contributors = []   // hash of all contributors
        // let directors = []

        let PhelixCondition = {};
            PhelixCondition = { job_type: ['Dub']};
        $scope.jobsAlula = {};
        $scope.jobAlulaLinked = {}
        $scope.rightPanelToggle = true    // if at least one of the request is planned, this variable becomes true
        
        $scope.requestsWithoutRoom = null;
        ClientService.getClients({}, function() {
            $scope.clients = $rootScope.clientsLight
          }, ClientService.manageClientError)

        // get 
        const getPossibleRequests = function (data) {

            ApiRest.post('/vrequests/without/room/', null, data, function(response) {
                if  (response && typeof response === 'object') {
                    if (Array.isArray(response)) {
                        $scope.requestsWithoutRoom = response
                    }
                }
            }, 
            function(error){
                service.setErrorLoading(true);
            })            
        }

        $scope.getRequestsWithoutRoom = function () {
            return $scope.requestsWithoutRoom 
        }

        // pas sûr que ce soit utile, permet de différencier les boutons individuel du bouton global, pas le temps d'aller plus loin
        $scope.manageSeveralProducts = function () {
            return true
        }

        $scope.chosenTechnicians = { writer: null, reader: null }
        PersonsService.getArtisticDirectors(function(directors) {
            artisticDirectors = directors    
            $scope.artisticDirectors = directors    

        }, function () {})
        $scope.DAByPerson = $rootScope.directors

        // load automatically
        const contributorsAdded = {}
        PersonsService.getTechnicians(function (result) {
            Object.keys(result).forEach((techId) => {
                contributors.push({
                    id: techId, 
                    lastname: result[techId].lastname, 
                    firstname: result[techId].firstname, 
                    type: 70,
                    fullname : result[techId].firstname + ' ' + result[techId].lastname
                })
                contributorsAdded[result[techId]] = true
            })
            PersonsService.getContributors(function(contributorsFound) {
                allContributors = contributorsFound
                Object.keys(contributorsFound).forEach(
                    function (id) {
                        if (contributorsFound[id].app_role_id != 64 && !contributorsAdded[id]) {
                            contributors.push({
                                id: id, 
                                lastname: contributorsFound[id].lastname, 
                                firstname: contributorsFound[id].firstname, 
                                type: contributorsFound[id].app_role_id,
                                fullname : contributorsFound[id].firstname + ' '+ contributorsFound[id].lastname})
                        }
                    }
                )
              }, PersonsService.manageContributorError)
          }, PersonsService.manageTechniciansError)

        let stages = []
        // get branch_id
        RoomService.getRoomsForABranch(function (rooms) {
            Object.keys(rooms).forEach((roomId) => {
                if (rooms[roomId].location && rooms[roomId].activity != 'indispo' && rooms[roomId].activity != 'waiting' ) {
                    stages.push({name: rooms[roomId].name, place: rooms[roomId].location, id: rooms[roomId].id})
                }
            })
            $scope.stages = stages
        }, RoomService.manageRoomError)

        $scope.projectMediaItems = []
        service.getProjectMediaItems = () => {
            let request = $scope.requests[0];
            MediaItems.findbyproject({
              project_id: request.project
            }, function(response) {
                $scope.projectMediaItems = getItemsDescription(response);
            });
        }

        $scope.popupElementsProject = function (request) {
            $scope.currentRequest = request
            let dialogElementsProject = ngDialog.open({
                className: 'ngdialog-theme-default',
                template: 'views/Dialog/listElementsProjects.html',
                width: '100%',
                scope: $scope,
                data: {  },
                closeByDocument: true,
                closeByEscape: true
              });
        }


        /**
         * Fonctions appelant des évènements correspondant aux services
         */
        $scope.getSeason = function (subproject) {
            if (subproject && subproject.nature && subproject.nature.name === 'serie') {
                return ' - S' + subproject.season
            }
        }

        service.setLoading = (isLoading) => { loading = isLoading };
        service.getLoading = () => loading;

        service.getUrlAPI = () => URL_API;

        service.getUserRole = () => Session.role();

        service.getProductName = (request) => ProductService.getProductNameFromRequest(request);

        service.setExpand = (isExpand) => { expand = isExpand };
        service.getExpand = () => expand;

        $scope.setRightPanelToggle = function () {
            if (!$rootScope.canDisplay(5)) {
                $scope.rightPanelToggle = false
            } else {
                $scope.rightPanelToggle = !$scope.rightPanelToggle
            }
        }
        $scope.getRightPanelToggle = () => {
            return $scope.rightPanelToggle
        }
        
        service.setNotFarmer = (isNotFarmer) => { notFarmer = isNotFarmer };
        service.getNotFarmer = () => notFarmer;

        service.isAllRequestPlanned = 
                function (requests) {
                if (StatusBookGroupHomogeneity & 1) {
                    return true
                }
                // !($filter('filter')(requests, {'is_planned' : "0"}).length > 0 || $filter('filter')(requests, {'is_not_done' : "1"}).length > 0 )
                }

        service.getErrorLoading = () => errorLoading;
        service.setErrorLoading = (isError) => { errorLoading = isError; service.setLoading(false); };

        // mainRequestId == request id in url param
        service.setMainRequestId = (requestId) => mainRequestId = requestId;
        service.getMainRequestId = () => mainRequestId;
        service.getMainRequest = (requests) => requests != null ? requests[0] : service.setErrorLoading(true);

        service.getArtisticDirectors = function () {
            return artisticDirectors
        }

        service.getContributors = function () {
            return contributors
        }  

        // Object and not an array, by user_id
        // be careful artistic director are stored by person_id
        service.getAllContributors = function () {
            return allContributors
        }  
        
        // utilise du bitwise, opérateurs de bits
        // 1 réservé, 2 pas réesrvé, 3 les deux donc pas homogène
        let StatusBookGroupHomogeneity = 0
        $scope.isGroupHomogeneous = function () {
            return StatusBookGroupHomogeneity === 3 ? false : true
        }

        const hasBooking = function (ownFarmerbookings) {
            let isBooked = false
            ownFarmerbookings.forEach(function (ownFarmerbooking) {
                Object.keys(ownFarmerbooking).forEach(function (field) {
                    if (field === 'booking_id' && ownFarmerbooking[field]) {
                        isBooked = true
                    }
                })
            })
            StatusBookGroupHomogeneity |= isBooked ? 1 : 2
            return isBooked
        }

        const workflowsSearched = {}
        const workflowsFound = {}
        service.getUrlAPI = () => URL_API;
        // 
        service.setGroupRequests = function(requests) {
            let requestsToReturn = objectInArray(requests);
            let allRequests = {}
            for (let i = 0; i < requestsToReturn.length; i++) {
                workflowsFound[requestsToReturn[i].workflow_id] = requestsToReturn[i]
                allRequests[requestsToReturn[i].id] = requestsToReturn[i]
                requestsToReturn[i].isBooked = hasBooking(requestsToReturn[i].ownFarmerbookings)
                requestsToReturn[i].isSelected = true
               service.setUploader(requestsToReturn[i].id)
            }
            Object.keys(workflowsFound).forEach((workflow_id) => {
                service.getTechnicalSpec(workflowsFound[workflow_id])
            })
            RequestService.getAllDataRelatedtoRequest(Object.keys(allRequests), function (responses) {
                Object.keys(allRequests).forEach((request_id) => {
                    let response = responses[request_id]
                    service.setAttachmentsUploader(response.attachments)
                    allRequests[request_id].product.media_items = service.setMediaItemsByRequest(allRequests[request_id], response.mediaItems);
                    allRequests[request_id].product.media_items_selected = $filter('filter')(allRequests[request_id].product.media_items, {selected : true});
                    let reports = response.reportsvis
                    let report = null
                    if (reports[0] != null) {
                        report = reports[0];
                        report.bobines = {};
                        report.bobines['Bobine 1'] = [];
                        angular.forEach(report.ownRapportviobservation, function(ob) {
                            if (report.bobines['Bobine ' + ob.bobine] == null) {
                                report.bobines['Bobine ' + ob.bobine] = []
                            }
                            report.bobines['Bobine ' + ob.bobine].push(ob)
                        });
                        delete report.ownRapportviobservation;
                        allRequests[request_id].report = report;
    
                    }
                    if (workflowsSearched[allRequests[request_id].workflow_id]) {
                        const instancedManageGottenWorkflow = manageGottenWorkflow(allRequests[request_id])
                        instancedManageGottenWorkflow(workflowsSearched[allRequests[request_id].workflow_id])
                    }
                })
            }, function () {})
            return requestsToReturn
        }

        service.getSelectedRequests = (requests) => $filter('filter')(requests, {isSelected : true}, 1)

        service.getAlertMessage = () => alertMessage;
        service.setAlertMessage = function(messageString, isError) {
            alertMessage.message = messageString;
            alertMessage.isError = isError;
            alertMessage.showPopup = true;
            $timeout(function(){
                alertMessage.showPopup = false
            }, 10000);
        };

        service.setGeneralRemark = function(requestToUpdate) {
            let elementId = "infoForTech" + requestToUpdate.id;
            let contentString = allSimplemde[elementId].value();
            let requestData = { info_for_tech:contentString };
            RequestService.updateRequestDefer(requestToUpdate.id, requestData).then(function (request) {
                service.setAlertMessage($rootScope._T["c6md11vs"], false);
                requestToUpdate.info_for_tech = request.info_for_tech;
                allSimplemde[elementId].togglePreview();
                let toolbar = document.getElementById("productDetail"+requestToUpdate.id).getElementsByClassName("editor-toolbar")[0];
                toolbar.style.display = "none";
            }, function (error) {
                service.setAlertMessage($rootScope._T["kic01tuy"], true);
                console.error(error);
            });
        };

        service.setShowSaveDirector = (value) => isShowSaveDirector = value;
        service.getShowSaveDirector = () => isShowSaveDirector;

        service.getHeightOfRow = function(requestId) {
            if(service.getExpand()){
                let element = angular.element(document.querySelector('#productDetail'+requestId));
                let height = element[0].offsetHeight;
                if(height < 300) height = 300;
                return height;
            }
        };


        service.getUploader = (requestId) => uploader[requestId];
        service.setUploader = function(requestId) {
            uploader[requestId] = new FileUploader();
            uploader[requestId].url = URL_API + "/attachments";
            uploader[requestId].headers = { 
                    'auth-token': $.cookie('token'),
                    'app-code': Session.appCode(),
                    'branch': $rootScope.user_entity.person.branch_id
                }
            uploader[requestId].autoUpload = true;
            uploader[requestId].onBeforeUploadItem = function(item) {
                item.formData.push({
                    request_id: requestId
                });
            };
            uploader[requestId].onSuccessItem = function(item, response) {
                item.formData[0] = {
                    request_id: requestId,
                    id: response.id,
                    path: response.path
                };
            }
        };

        service.downloadAttachments = (item) => $window.open(URL_API + "/attachments/download/" + item.formData[0].id + "?filesize=" + item.file.size + "&token=" + $.cookie('token'), '_blank');
        service.setAttachmentsUploader = function(attachments) {
            angular.forEach(attachments, function (attachment) {
                let uploaderRequest = service.getUploader(attachment.request_id);
                let file = new FileUploader.FileItem(
                    uploaderRequest,
                    {
                        lastModifiedDate: new Date(),
                        name: attachment.original_name,
                        size: attachment.filesize
                    });
                file.formData.push({
                    id: attachment.id,
                    path: attachment.path
                });
                file.progress = 100;
                file.isUploaded = true;
                file.isSuccess = true;
                uploaderRequest.queue.push(file);
            });
        };

        service.setMediaItemsByRequest = function(request, mediaItems) {
            if (request.media_items == null) {
                request.media_items = [];
            }
            for(let i = 0; i < mediaItems.length; i += 1){
                mediaItems[i].selected = request.media_items.indexOf(mediaItems[i].id) > -1;
            }
            
            return mediaItems;
        };

        service.setMediaItemToRequest = function(request, mediaItem) {
            let index = request.media_items.indexOf(mediaItem.id);
            index > -1 ? request.media_items.splice(index, 1) : request.media_items.push(mediaItem.id);

            RequestService.updateRequestDefer(request.id, {'media_items': request.media_items.filter(item => item).join(',')}).then(function () {
                service.setAlertMessage($rootScope._T["72ziogna"], false);
            }, function (error) {
                service.setAlertMessage($rootScope._T["kcnhr4t3"], true);
                console.error(error);
            });
        };

        service.setVisibilityComment = function(comment) {
            comment.show_tech = !comment.show_tech;
            let newComment = new Comment();
            newComment.show_tech = comment.show_tech;
            newComment.$update({
                id: comment.id
            }, function(data) {}, function(error) {});
        };

        service.removeItem = function(item) {
            swal({
                    title: $rootScope._T["9lpfa1ln"],
                    text: $rootScope._T["8csqh78u"],
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: $rootScope._T["mnlbxblr"],
                    closeOnConfirm: false
                },
                function () {
                    Attachments.delete({
                        id: item.formData[0].id
                    });
                    item.remove();
                    swal({
                        title: $rootScope._T["dt8uc6cm"],
                        text: $rootScope._T["vla0lzco"],
                        type: "success"
                    });
                });
        };

        service.getViReport = function(request) {
            let report = null;
            let filterReport = [{
                "name": "request_id",
                "value": request.id
            }];
            Reportvi.getReportVisBy({
                filters: [filterReport]
            }, function(reports) {
                if (reports[0] != null) {
                    report = reports[0];
                    report.bobines = {};
                    report.bobines['Bobine 1'] = [];
                    angular.forEach(report.ownRapportviobservation, function(ob) {
                        if (report.bobines['Bobine ' + ob.bobine] == null) {
                            report.bobines['Bobine ' + ob.bobine] = []
                        }
                        report.bobines['Bobine ' + ob.bobine].push(ob)
                    });
                    delete report.ownRapportviobservation;
                    request.report = report;
                    return report;

                }
            });
        };

        service.showTechnicalSpecModal = function(techSpecId) {
            $scope.techspec_id = techSpecId;
            $scope.isProd = true;
            ngDialog.open({
                template: 'views/Dialog/TechnicianTechnicalSpecDialog.html',
                className: 'ngdialog-theme-default dialogwidth80p',
                scope: $scope,
                controller: 'TechnicalSpecCtrl',
                closeByDocument: false
            });
        };

        const manageGottenWorkflow = function (currentRequest) {
            const request = currentRequest
            return function (workflow) {
                workflowsSearched[request.workflow_id] = workflow
                if (!workflow  && request) {
                    console.log(request.workflow_id)
                }
                if (workflow && !workflow.ownStepslist && request) {
                    console.log(workflow)
                }
                request.techspec_id = null;
                if (workflow && workflow.ownStepslist && workflow.ownStepslist[0] != null) {
                    angular.forEach(workflow.ownStepslist[0].ownStep, function (step) {
                        if (step.action_type_id === request.action_type_id) {
                            request.techspec_id = step.techspec_id;
                        }
                    });
                }
            }
        }
        service.getTechnicalSpec = function(request) {
            const instancedManageGottenWorkflow = manageGottenWorkflow(request)
            if (workflowsSearched[request.workflow_id]) {
                instancedManageGottenWorkflow(workflowsSearched[request.workflow_id])
            } else {
                Workflow.get({
                    workflowId: request.workflow_id
                }, function (workflow) {
                    instancedManageGottenWorkflow(workflow)
                })
            }
        }


        // SimpleMDE  is a markdown editor
        service.setSimpleMDE = function() {
          $timeout(function() {
            angular.forEach($scope.requests, function(request) {
              let elementId = "infoForTech" + request.id;
              let simplemde = new SimpleMDE({
                autoDownloadFontAwesome: false,
                toolbar: ["bold", "italic", "strikethrough", "|", "heading-1", "heading-2", "heading-3", "|", "quote", "unordered-list", "ordered-list", "table", "horizontal-rule", "|", "guide"],
                spellChecker: false,
                status: false,
                placeholder: $rootScope._T["wa7kjuc5"],
                element: document.getElementById(elementId)
              });
              if (request.info_for_tech != null && request.info_for_tech != "") {
                simplemde.value(request.info_for_tech);
              } else {
                simplemde.value($rootScope._T["wa7kjuc5"]);
              }
              simplemde.togglePreview();
              let toolbar = document.getElementById("productDetail"+request.id).getElementsByClassName("editor-toolbar")[0];
              toolbar.style.display = "none";
              allSimplemde[elementId] = simplemde;
            });
          }, 10);
        }

        service.showEditInfoForTech = function(request) {
          service.setExpand(true);
          let elementId = "infoForTech" + request.id;
          if (request.info_for_tech == null || request.info_for_tech == "") {
            allSimplemde[elementId].value("");
          }
          allSimplemde[elementId].togglePreview();
          let toolbar = document.getElementById("productDetail"+request.id).getElementsByClassName("editor-toolbar")[0];
          toolbar.style.display = "";
        }

        service.countBookings = function(request) {
          let count = 0;
          angular.forEach(request.ownFarmerbookings, function(booking) {
            if ((booking.is_wish == 1 && (request.is_planned == false || request.is_not_done == true)) || booking.booking_id != null) {
              count++;
            }
          });
          return count;
        }



        service.getItemIndexInRequestAndProduct = (request, mediaItem) => {
          let index = -1;
          if (request.media_items) {
            for (let i = 0; i < request.media_items.length; ++i) {
              if (request.media_items[i] == mediaItem.id) {
                index = i;
                break;
              }
            }
          }
          return index;
        }

        var seancesSendOrRemove = {'content': false};
        var i = 0;
        $scope.$on('seancesSend', function(event, data) {    
            var seancesSend = data.content;
            if(seancesSend == true){
                seancesSendOrRemove.content = true;
            }
        });
        var j = 0;
        $scope.$on('seancesRemove', function(event, data) {
            var seancesRemove = data.content;
            if(seancesRemove == true){
                seancesSendOrRemove.content = true;
            }
        });

        $scope.hideSendSeances = function() {
            $rootScope.$emit("seancesSendOrRemove", seancesSendOrRemove);
        } 

        /**
         * Fonctions pour l'accès REST API
         */
        $scope.is_song = false
        $scope.stage_manager = false
        $scope.artistic_director = {}
        rest.getRequest = function(requestId, done) {
            // list of date to get from booking to check if a range of date is available
            const date2check = {}
            let base = null //données de base pour rechercher les réservations proches
            ApiRest.get('/requests/requestsbyhash/' + requestId, {}, function(requests) {

                if (requests.length === 0) {
                    service.setAlertMessage($rootScope._T["yfueledo"], true);
                    service.setErrorLoading(true);
                } else {
                    // store dates and check if there is booking in Vega (booking service)
                    $scope.requests = service.setGroupRequests(requests)
                    const firstRequest = requests[0]
                    if (firstRequest.action_type.name == 'enr_chansons' || firstRequest.action_type.name == 'doublage_enr_belgique_chansons') {
                        $scope.song_director = $scope.DAByPerson[firstRequest.product.subproject.song_director_id]
                        $scope.is_song = true
                    } else {
                        $scope.artistic_director = $scope.DAByPerson[firstRequest.product.subproject.artistic_director_id]
                    }
                    if (firstRequest.product.subproject.stage_manager_id) {
                        $scope.stage_manager = $rootScope.stageManagersById[firstRequest.product.subproject.stage_manager_id]

                    }

                    $scope.salles = { salle1: 1 }
                
                    service.setSimpleMDE();
                    service.setLoading(false);
                    requests.forEach(
                        function (request) {
                            // et le stage manager pour les allemands

                            if (request.is_planned && request.is_planned == 0) {
                                $scope.rightPanelToggle = false // display planning panel mis à false 20220503 raison du comportement non documentée :)
                            } else {
                                $scope.rightPanelToggle = false
                            }
                            request.ownFarmerbookings.forEach(
                                function (farmer) {
                                    if (!$scope.farmers[farmer.id]) {
                                        $scope.farmers[farmer.id] = {}
                                    }
                                    // $scope.chosenTechnicians
                                    $scope.chosenTechnicians.reader = farmer.tech_reader_id
                                    $scope.chosenTechnicians.writer = farmer.tech_writer_id
                                    let compareDate = new Date(farmer.day).getTime()
                                    let endDate
                                    let startDate
                                    let endUnixTime
                                    let startUnixTime
                                    if (farmer.end_time) {
                                        endDate = farmer.day.replace('00:00:00',farmer.end_time.replace('h',':') + ':00')
                                        endUnixTime = new Date(endDate).getTime()
                                    }
                                    if (farmer.start_time) {
                                        startDate = farmer.day.replace('00:00:00',farmer.start_time.replace('h',':') + ':00')
                                        compareDate = new Date(startDate).getTime()
                                        startUnixTime = new Date(startDate).getTime()
                                    }
                                    const now = new Date().getTime()
                                    if (compareDate >= now) {
                                        // if the date is in the past, we skipped it
                                        date2check[farmer.day] = {'start': startDate, 'end': endDate }
                                    }
                                    if (endUnixTime < startUnixTime) {
                                        $scope.farmers[farmer.id].nextDay = '(lendemain)';
                                    } else {
                                        $scope.farmers[farmer.id].nextDay = ''
                                    }
                                    if (!base) {
                                        base = {
                                            day: farmer.day,
                                            start_time: farmer.start_time, 
                                            end_time: farmer.end_time, 
                                            action_id: request.action_type_id,
                                            request_id: request.id
                                        }
                                    }

                                }
                            )
                        }
                    )
                    return done(null, date2check, base)
                }
            }, function(error){
                service.setErrorLoading(true)
                return done('error')
            })
            
        };

        //** get  */

        rest.getAttachments = function(requestId) {
            
          ApiRest.get('/attachments/byrequestid', {'request_id' : requestId}, function (attachments) {
            service.setAttachmentsUploader(attachments);
          })
        };

        rest.getMediaItemOfProduct = function(request) {
            ApiRest.get('/mediaitems/findbyproduct',{'product_id' : request.product.id},function(mediaItems){
                request.product.media_items = service.setMediaItemsByRequest(request, mediaItems);
                request.product.media_items_selected = $filter('filter')(request.product.media_items, {selected : true});
            });
        };

        rest.getBookingRoomOccupied = function(datelist) {
            // list of date to get from booking to check if a range of date is available
            const date2check = {}
            const params = {
                dates: datelist,
                'type': 'room',
                'branch_id': $rootScope.user_entity.person.branch_id
            }
            ApiRest.post('/booking/check/dates/action', null, params, function(response) {
                Object.keys(response).forEach(
                    function (day) {
                        $scope.rooms[day] = response[day]
                    }
                )
            }, function(error){
                service.setErrorLoading(true);
            });
        };



        /**
         * Fonctions du scope
         */
        
        $scope.rooms = {}
        $scope.productName = (request) => service.getProductName(request);
        $scope.getSelectedRequests = (requests) => service.getSelectedRequests(requests);
        $scope.setExpand = (isExpand) => service.setExpand(isExpand);
        $scope.getExpand = () => service.getExpand();
        $scope.setNotFarmer = (isNotFarmer) => service.setNotFarmer(isNotFarmer);
        $scope.getNotFarmer = () => service.getNotFarmer();
        $scope.setGeneralRemark = (request) => service.setGeneralRemark(request);
        $scope.setAlertMessage = (messageString, isError) => service.setAlertMessage(messageString, isError);
        $scope.getAlertMessage = () => service.getAlertMessage();
        $scope.getMainRequest = () => service.getMainRequest($scope.requests);
        $scope.getLoading =  () => service.getLoading();
        $scope.getHeightOfRow = (requestId) => service.getHeightOfRow(requestId);
        $scope.getUploader = (requestId) => service.getUploader(requestId);
        $scope.setMediaItemToRequest = (request, mediaItem) => service.setMediaItemToRequest(request, mediaItem);
        $scope.getUserRole = () => service.getUserRole();
        $scope.init = () => init();
        $scope.isAllRequestPlanned = (requests) => service.isAllRequestPlanned(requests);
        $scope.getErrorLoading = () => service.getErrorLoading();
        $scope.getMainRequestId = () =>service.getMainRequestId();
        $scope.changeVisibility = (comment) => service.setVisibilityComment(comment);
        $scope.remove =  (item) => service.removeItem(item);
        $scope.download =  (item) => service.downloadAttachments(item);
        $scope.showTechnicalSpecModal = (techSpecId) => service.showTechnicalSpecModal(techSpecId);
        $scope.getUrlAPI = () => service.getUrlAPI();
        $scope.doNothing = (returns) => ReturnService.doNothing(returns);
        $scope.doResolve = (returns) => ReturnService.doResolve(returns);
        $scope.toMix = (returns) => ReturnService.toMix(returns);
        $scope.notDone = (returns) => ReturnService.notDone(returns);
        $scope.toReview = (returns) => ReturnService.toReview(returns);
        
        $scope.getArtisticDirectors = () => service.getArtisticDirectors()
        
        $scope.getContributors = () => service.getContributors()

        $scope.setShowSaveDirector = (value) => { 
            service.setShowSaveDirector(value)
        }
        $scope.getShowSaveDirector = () => service.getShowSaveDirector();
        $scope.showEditInfoForTech = request => service.showEditInfoForTech(request);
        $scope.countBookings = bookings => service.countBookings(bookings);
        $scope.getItemIndexInRequestAndProduct = service.getItemIndexInRequestAndProduct;
        $scope.getProjectMediaItems = service.getProjectMediaItems;

        

        // hash des farmers avec des notions supplémentaires, utilisé dans les composants
        $scope.farmers = {}

        /** since 2020/02, table is cached, so refreshing requires to clean the cache */
        $scope.cleanTable = function () {
            request = $scope.requests[0];
            dataSync.stopSynchro();
            delete($rootScope.subprojects[request.subproject])
        }
        
        /**
         * Calendrier n'est affiché que si aucune demande n'est planifiée
         * envoi au tech n'est affiché que si au moins une demande est planifiée
         */
        $scope.displayTech = function () {
            // angular.forEach($scope.requests, function(request) {
        }
        $scope.displayCalendar = function () {
            // angular.forEach($scope.requests, function(request) {
        }        

        /**
         * Fonctions locales au controleur
         */

         // recherche sur l'API Pheli-Alula pour rattacher les demandes Lantern avec  Alula
        $scope.refreshjobsAlula = function(textq,request_id,action_type_id = null){
            let params = { q:textq };
            if(action_type_id == 3){
                params.condition = JSON.stringify(PhelixCondition);
            }
            if(textq.length >2){
                $scope.jobsAlula[request_id] = PhelixAlula.search(params);
            }
        }

        $scope.updateLinkedJobIdAlula = function(jobID,request_id,action){
            var updateRequest = new Request();
            if(action =='save'){
                updateRequest.alula_job_id = jobID;
            }else{
                updateRequest.alula_job_id = null;
            }
            updateRequest.phelix_date_synchronized = null;
            updateRequest.update_job_alula = true;
            updateRequest.$update({requestId: request_id}, function (response) {
                angular.forEach($scope.requests, function (request) {
                    if(request.id == request_id){
                        request.alula_job_id = response.alula_job_id;
                        request.phelix_date_synchronized = response.phelix_date_synchronized;
                    }
                });
            });
        }

        // return nb of room used/ total of rooms
        $scope.getRatioRooms = function (day) {
            const nbRooms = $rootScope.Rooms.length
            if ($scope.rooms[day]) {
                const nbToday = Object.keys($scope.rooms[day]).length
                return nbToday + '/' +  nbRooms
            } else {
                return nbRooms + '/' + nbRooms
            }
        }

        function init() {
            service.setErrorLoading(false);
            service.setLoading(true);
            service.setExpand(false);
            service.setNotFarmer(true);
            service.setShowSaveDirector(false);
            service.setMainRequestId($stateParams.requestId)
            
            // get requests by hash
            rest.getRequest(service.getMainRequestId(), function (error, dates2check, base) {
                // displaying room occupation on the left part of the popup
                // check date in future
                rest.getBookingRoomOccupied(dates2check)
                // 
                const data = {}
                if (base) {
                    getPossibleRequests(base)            
                }
                service.getProjectMediaItems()
            });

        }
        init();
        
        // 

  }]);
