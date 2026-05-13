function FarmerbookingsTablePopup($rootScope, $scope, Farmer, Request, Comment, $q, ApiRest, NotificationService, $filter, PersonsService, RequestService, ngDialog) {
    let ctrl = this;
    ctrl.branch_id = $rootScope.user_entity.person.branch_id
    ctrl.is_song = false
    ctrl.artistic_director_id = null
    ctrl.DAByPerson = $rootScope.directors
    if (ctrl.request.action_type.name == 'enr_chansons' || ctrl.request.action_type.name == 'doublage_enr_belgique_chansons') {
      ctrl.is_song = true
    }
    ctrl.request.ownFarmerbookings.forEach((farmer) => {
      if (farmer.booking_id) {
        if (ctrl.request.action_type.name == 'enr_chansons' || ctrl.request.action_type.name == 'doublage_enr_belgique_chansons') {
          if (!farmer.song_director_id) {
            farmer.song_director_id = ctrl.request.product.subproject.song_director_id
            farmer.song_director = ctrl.request.product.subproject.song_director
          }
        } else {
          if (!farmer.artistic_director) {
            farmer.artistic_director_id = ctrl.request.product.subproject.artistic_director_id
            farmer.artistic_director = ctrl.DAByPerson[ctrl.request.product.subproject.artistic_director_id]
          }

        }
        
        if (!farmer.stage_manager) {
          farmer.stage_manager_id = ctrl.request.product.subproject.stage_manager_id
          farmer.stage_manager = $rootScope.stageManagersById[ctrl.request.product.subproject.stage_manager_id]
        }
      }
    })

    ctrl.transformHourInI18nFormat = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)
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
    ctrl.requests.forEach((request) => {
      requestList.push(request.id)
    })
    const farmerDA2update = {}
    ctrl.selectFarmerbookings = function (farmer) {
        if (farmer.booking_id !== null 
            && farmer.is_selected !== '1' 
            && $rootScope.canDisplay(7)
            ) 
        {
           
            farmer.selected = !farmer.selected;
            farmerDA2update[farmer.id] = farmer
            // app\components\selectTechRequestPopup.js is listening
            $rootScope.$broadcast('selectFarmer', [farmer, farmer.selected]);

            let requests = ctrl.getSelectedRequests(ctrl.requests);
            angular.forEach(requests, function (request) {
                for (let i = 0; i < request.ownFarmerbookings.length; i += 1) {
                    let farmerToSelect = request.ownFarmerbookings[i];
                    if (farmerToSelect.day === farmer.day &&
                        farmerToSelect.start_time === farmer.start_time &&
                        farmerToSelect.end_time === farmer.end_time &&
                        farmerToSelect.audit === farmer.audit) {
                        farmerToSelect.selected = farmer.selected;                    
                        break;
                    }
                }
            });
        }

    };
    ctrl.artisticDirectors = []
    PersonsService.getArtisticDirectors(function(directors) {
      ctrl.artisticDirectors = directors    

    }, function () {})
  

    ctrl.request.ownFarmerbookings.forEach((farmer) => {
      if (!farmer.song_director) {
        farmer.song_director = {firstname: null, lastname: null, id: null}
      }
      if (farmer.song_director_id) {
        farmer.song_director = ctrl.DAByPerson[farmer.song_director_id]
      }

    })

    ctrl.editDirector = function (farmer, type, is_song) {
      farmer.selected = true
      ctrl.request.ownFarmerbookings.forEach((farmer) => {
        if (farmer.selected) {
          farmerDA2update[farmer.id] = farmer
        }
      })
      farmer.selected = true
      let  editDialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/personEditDialog.html',
        width: '30%',
        scope: $scope,
        data: { farmer: farmer, is_song: is_song, artisticDirectors: ctrl.artisticDirectors, farmerDA2update: farmerDA2update, firstRequest: ctrl.requests[0], type: type, requestList: requestList },
        controller: 'personEditDialogCtrl',
        closeByDocument: true,
        closeByEscape: true
      });
      editDialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape") {
        }
      });

    }

    ctrl.editStageManager = function (farmer) {
      farmer.selected = true
      ctrl.request.ownFarmerbookings.forEach((farmer) => {
        if (farmer.selected) {
          farmerDA2update[farmer.id] = farmer
        }
      })
      farmer.selected = true
      let  editDialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/personEditDialog.html',
        width: '30%',
        scope: $scope,
        data: { farmer: farmer, is_song: false, artisticDirectors: ctrl.artisticDirectors, farmerDA2update: farmerDA2update, firstRequest: ctrl.requests[0], type: 'stage_manager_id', requestList: requestList },
        controller: 'personEditDialogCtrl',
        closeByDocument: true,
        closeByEscape: true
      });
      editDialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape") {
        }
      });

    }
    ctrl.canDisplayStageManager = function () {
      if (ctrl.branch_id == 2) {
        return true
      }
      return false
    }

    ctrl.canUpdateDa = false
    ctrl.showSelectNewDA = function () {
      if (!ctrl.noselect) {
        ctrl.canUpdateDa = !ctrl.canUpdateDa
        ctrl.canUpdateNewSongDA = false
      }
    }

    ctrl.canUpdateNewSongDA = false
    ctrl.showSelectNewSongDA = function () {
      if (!ctrl.noselect) {
        ctrl.canUpdateDa = false
        ctrl.canUpdateNewSongDA = !ctrl.canUpdateNewSongDA
      }
    }
    ctrl.canUpdateNewStageManger = false
    ctrl.showSelectNewStageManager = function () {
      if (!ctrl.noselect) {
        ctrl.canUpdateStageManager = false
        ctrl.canUpdateNewStageManger = !ctrl.canUpdateNewStageManager
      }
    }

    ctrl.saveDirector = function (farmer, da, type) {
      let id2send = 0
      const firstRequest = ctrl.requests[0]
      const listFarmers = []
      
      Object.keys(farmerDA2update).forEach((farmer_id) => {
        if (farmerDA2update[farmer_id].selected) {
          if (da) {
            if (type == 'artistic_director_id') {
              farmerDA2update[farmer_id].artistic_director_id = da.id
              farmerDA2update[farmer_id].artistic_director = da
              id2send = da.id
            }
            if (type == 'song_director_id') {
              farmer.song_director_id = da.id
              farmer.song_director = da
              id2send = da.id
            }
          } else {
            if (type == 'artistic_director_id') {
              farmerDA2update[farmer_id].artistic_director_id = firstRequest.artistic_director_id
              farmerDA2update[farmer_id].artistic_director = firstRequest.artistic_director
              id2send = 0
            }
            if (type == 'song_director_id') {
              farmer.song_director_id = firstRequest.song_director_id
              farmer.song_director = firstRequest.song_director
              id2send = 0
            }
            
          }

          listFarmers.push(farmer_id)
        }
      })
      RequestService.updateDAAndOther(type, id2send, listFarmers, requestList, 
        function (result) {
          ctrl.canUpdateDa = false
          ctrl.canUpdateNewSongDA = false
          
        }, 
        function (result) {
        })
    }
    ctrl.setDirector = function (farmer, da, type) {
      if (type == 'artistic_director_id') {
        farmer.artistic_director_id = da.id
        farmer.artistic_director = da
      }
      if (type == 'song_director_id') {
        farmer.song_director_id = da.id
        farmer.song_director = da
      }

    }

    // reecrit
    ctrl.cancelTechRequest = function (farmer) {
      console.log(' in farmerbookingsTablePopup.js remove request du panier des techs DEPRECATED')
    }

    ctrl.cancelTechRequest2 = function (farmer) {
      if ($rootScope.canDisplay(5)) {
        let day = ''
        let canceledTech = ''
        const data2send = { farmers: [] }
        if  (ctrl.manageSeveralProducts) {
          ctrl.getSelectedRequests(ctrl.requests).forEach(function (request) {
            request.ownFarmerbookings.forEach(function (selectedFarmer) {
              if (farmer.audit == selectedFarmer.audit && farmer.day == selectedFarmer.day && farmer.start_time == selectedFarmer.start_time && farmer.end_time == selectedFarmer.end_time) {
                data2send.farmers.push(selectedFarmer.id)
                day = farmer.day
                canceledTech = selectedFarmer.tech_writer_user.person.firstname + " " + selectedFarmer.tech_writer_user.person.lastname;
              }
            })
          })
        } else {
          data2send.farmers.push(farmer.id)
        }
        ApiRest.post('/vrequests/remove/tech', null, data2send, function (response) {
          let textLog = $rootScope._T["lz9x299x"] + " " + day + " " + $rootScope._T["ivgmyfts"] + " " + canceledTech + " " + $rootScope._T["lijdwd8c"]
          ctrl.getSelectedRequests(ctrl.requests).forEach(function (request) {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, textLog);
          })
          ctrl.setAlertMessage({ message: $rootScope._T["xhsx3h5x"], isError:false })
          ctrl.initPopup()
        },
        function(error) {
          ctrl.setAlertMessage({ message: 'problem tech not removed', isError:false });
        })
      }
    }

    // cancel only one date at a time, but one and more products/requests
    // Attention aux workflows
    ctrl.cancelBooking2 = function(farmer) {
      if ($rootScope.canDisplay(5)) {
        let day = ''
        const data2send = { farmers: [] }
        if  (ctrl.manageSeveralProducts) {
          ctrl.getSelectedRequests(ctrl.requests).forEach(function (request) {
            request.ownFarmerbookings.forEach(function (selectedFarmer) {
              if (farmer.audit == selectedFarmer.audit && farmer.day == selectedFarmer.day && farmer.start_time == selectedFarmer.start_time && farmer.end_time == selectedFarmer.end_time) {
                data2send.farmers.push(selectedFarmer.id)
                day = farmer.day
              }
            })
          })
        } else {
          data2send.farmers.push(farmer.id)
        }
        ApiRest.post('/vrequests/remove/product', null, data2send, function (response) { 
          let textLog = $rootScope._T["lz9x299x"] + " " + day + " " + $rootScope._T["fotidtc6"];
          const requestListForNotifs = []
          ctrl.getSelectedRequests(ctrl.requests).forEach(function (request) {
            requestListForNotifs.push(request)
            newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, textLog);
          })          
          $scope.$emit("seancesRemove", {'content': true})
          let services = "planning,production";
          sendStandardNotif(new NotificationService(), requestListForNotifs, services, $rootScope._T["yp9tp27g"] + ' (' + day + ')', $rootScope._T["p8tmmghz"], $filter, "cancel", $rootScope)
          ctrl.setAlertMessage({ message: 'Request cancelled', isError:false })
          ctrl.initPopup()
        },
        function(error) {
          console.log(error)
          ctrl.setAlertMessage({ message: 'problem: request not removed', isError:false });
        })
      }
    }

    // a réécrir et déplacer dans VRequests
    ctrl.cancelBooking = function(farmer) {
    }

    function checkIfAllFarmerSent(mainRequest, requests) {
        let mainFarmers = mainRequest.ownFarmerbookings;

        angular.forEach(mainFarmers, function (mainFarmer) {
            for(let i = 0; i < requests.length; i += 1) {
                let requestFarmers = requests[i].ownFarmerbookings;
                mainFarmer.isAllSent = true;
                for(let j = 0; i < requestFarmers.length; j += 1){
                    let farmer = requestFarmers[j];
                    if(farmer.is_selected) break;
                    if(farmer.day !== mainFarmer.day) break;
                    if(farmer.start_time !== mainFarmer.start_time) break;
                    if(farmer.end_time !== mainFarmer.end_time) break;
                    if(farmer.audit !== mainFarmer.audit) break;
                    mainFarmer.isAllSent = false;
                }
                if(!mainFarmer.isAllSent) break;
            }
        });
        return mainFarmers;
        
    }

    ctrl.isAllSent = function(mainFarmer) {
        let requests = ctrl.getSelectedRequests();
        let isAllSent = true;
        for(let i = 0; i < requests.length; i += 1) {
            let requestFarmers = requests[i].ownFarmerbookings;

            for(let j = 0; j < requestFarmers.length; j += 1){
                let farmer = requestFarmers[j];
                if(farmer == null) break;
                if(farmer.id === mainFarmer.id) continue;
                if(farmer.day !== mainFarmer.day) continue;
                if(farmer.start_time !== mainFarmer.start_time) continue;
                if(farmer.end_time !== mainFarmer.end_time) continue;
                if(farmer.audit !== mainFarmer.audit) continue;
                if(farmer.is_selected === true) break;
                if(mainFarmer.is_selected == true && farmer.is_selected == false)
                    isAllSent = false;
                else if(mainFarmer.is_selected == false && farmer.is_selected == true)
                    isAllSent = false;
               // isAllSent = mainFarmer.is_selected != farmer.is_selected;
                if(!isAllSent) return isAllSent;
            }
            if(!isAllSent) break;
        }
        return isAllSent
    };
    function init () {
        // let farmerChecked = checkIfAllFarmerSent(ctrl.request, ctrl.getSelectedRequests());
        // ctrl.request.ownFarmerbookings = farmerChecked;
        // console.log(ctrl.requests);
    }
    init();
    

}


Lantern.component('farmerbookingsTablePopup', {
    templateUrl: 'components/farmerbookingsTablePopup.html',
    controller: FarmerbookingsTablePopup,
    bindings: {
        farmers: '<',
        request: '<',
        requests: '<',
        userRole: '<',
        noselect: '<',
        isGroupHomogeneous: '&',
        getSelectedRequests: '&',
        setAlertMessage: '&',
        getRatioRooms: '&',
        initPopup: '&',
        manageSeveralProducts: '@'
    }
});
