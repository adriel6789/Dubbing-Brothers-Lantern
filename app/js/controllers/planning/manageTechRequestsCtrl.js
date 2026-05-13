Lantern.controller('manageTechRequestsCtrl', ['$rootScope', '$scope', '$q', '$state', '$filter', 'ngDialog', 'Request',
  'RequestGroup', 'User', 'Farmer', '$location', 'Comment', 'RequestService', 'Notification', 'NotificationService','ApiRest', 'RoomService',
  function ($rootScope, $scope, $q, $state, $filter, ngDialog, Request,
    RequestGroup, User, Farmer, $location, Comment, RequestService, Notification, NotificationService, ApiRest, RoomService) {

    $scope.calculInProgress = 0;

    $scope.noteContainerToggle = false
    $scope.deleteNoteContainerToggle = false
    $scope.modifyNoteContainerToggle = false
    $scope.addNoteContainerToogle = false
    $scope.addNoteFormContainerToogle = false    
    RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
    var today = yyyy + '-' + mm + '-' + dd;
    $scope.today = today;

    function notSendBackFilter(request, index, array) {
      return (request.is_sent_back != 1);
    }

    const getClient = function (clientId) {
      return $rootScope.clients[clientId]
    }

    $scope.techSelected = {};
    $scope.requests = [];

    const getNote = function (id, date, done) {
      ApiRest.get('/farmerbookings/technote', 
      {id_technician: id, date: date}, 
      function (data) {
        const key = Object.keys(data)[0]
        return done(null, data[key])
      }, null, true)
    }

    const addNote = function (done) {
      ApiRest.post('/farmerbookings/notetechinfos', null,
      {id_technician: $scope.techSelected.id,
        date_note: moment($scope.datepicker).format('YYYY-MM-DD'),
        note: $scope.newNoteTechnician.contentNote
      }, 
      function (data) {
        return done(null, data)
      }, null, true)
    }  

    $scope.allTechs = null
    ApiRest.get('/requests/findtechnicians/', {
    }, function (data) {
      $scope.allTechs = data
    }, null, true)

    if ($rootScope.hasBase()) {
      // disable choice
    } else {
      $rootScope.getBase(function () {
        // enable choice quand les données sont récupérées
      })
      
    }

    const getSeances = function (techId, done) {
      ApiRest.get('/requests/sessions/attributed/tech/' + techId + '/', {
      }, function (data) {
        return done(null, data)
      }, null, true)      
    }

    function UserNotSpecified(){
      swal({
        title: $rootScope._T['t3mol7j8'],
        type: 'error',
        confirmButtonText: $rootScope._T['d32u2mga'],
        confirmButtonColor: '#3570E1'
      });
    }

    let idNoteTechnician;
    $scope.noteTechnicianIsFilterDate = false;
    $scope.selectedTechnician = null;
    $scope.newNoteTechnician = {contentNote:''}
    $scope.noteTechnician = {contentNote:''}

    $scope.farmers = []
    $scope.originalFarmers = []

    $scope.loadRequestsFromTech = function (selectedTechnician) {
      $scope.selectedTechnician = selectedTechnician
      if ($scope.noteTechnicianIsFilterDate === true && ($scope.datepicker === undefined || $scope.datepicker === '')) {
        swal({
          title: $rootScope._T['ypymo8l9'],
          type: 'error',
          confirmButtonText: $rootScope._T['d32u2mga'],
          confirmButtonColor: '#3570E1'
        })
        return
      } else if ($scope.selectedTechnician == null || $scope.selectedTechnician == undefined) {
        UserNotSpecified()
        return
      }
      $scope.farmers = []
      $scope.originalFarmers = $scope.farmers
      $scope.hasTech = true
      $scope.techSelected = selectedTechnician

      getSeances(selectedTechnician.id, function (error, data) {
        const farmersByModel1 = {}
        Object.keys(data.sessions).forEach(function (farmerId) {
          const key = data.sessions[farmerId].day + data.sessions[farmerId].start_time + data.sessions[farmerId].end_time + data.sessions[farmerId].audit + data.sessions[farmerId].action_type_id
          const product = {
            artistic_director: '',
            date_see_tech: data.sessions[farmerId].date_see_tech,
            date_send_tech: data.sessions[farmerId].date_send_tech,
            tech_reader_id: data.sessions[farmerId].tech_reader_id,
            reader: data.sessions[farmerId].tech_reader_id && $rootScope.allTechnicians && $rootScope.allTechnicians[data.sessions[farmerId].tech_reader_id] ? $rootScope.allTechnicians[data.sessions[farmerId].tech_reader_id].firstname + ' ' + $rootScope.allTechnicians[data.sessions[farmerId].tech_reader_id].lastname : '',
            tech_writer_id: data.sessions[farmerId].tech_writer_id,
            writer: data.sessions[farmerId].tech_writer_id && $rootScope.allTechnicians && $rootScope.allTechnicians[data.sessions[farmerId].tech_writer_id] ? $rootScope.allTechnicians[data.sessions[farmerId].tech_writer_id].firstname + ' ' + $rootScope.allTechnicians[data.sessions[farmerId].tech_writer_id].lastname : '',
            tech_editor_id: data.sessions[farmerId].tech_editor_id,
            editor: data.sessions[farmerId].tech_editor_id && $rootScope.allTechnicians && $rootScope.allTechnicians[data.sessions[farmerId].tech_editor_id] ? $rootScope.allTechnicians[data.sessions[farmerId].tech_editor_id].firstname + ' ' + $rootScope.allTechnicians[data.sessions[farmerId].tech_editor_id].lastname : '',
            request_id: data.sessions[farmerId].request_id,
            farmer_id: data.sessions[farmerId].farmer_id,
            product_name: $rootScope.getProductHumanDescription(data.products[data.sessions[farmerId].product_id]),
            etape: $rootScope.etapes[data.sessions[farmerId].etape_type_id].value,
            action: $rootScope.actions[data.sessions[farmerId].action_type_id].value
          }     
          if (farmersByModel1[key]) {
            farmersByModel1[key].products.push(product)
          } else {
            farmersByModel1[key] = {
              id: farmerId,
              day: data.sessions[farmerId].day,
              start_time: data.sessions[farmerId].start_time,
              end_time: data.sessions[farmerId].end_time,
              audit: data.sessions[farmerId].audit,
              action_type_id: data.sessions[farmerId].action_type_id,
              products:[product],
              client: getClient(data.products[data.sessions[farmerId].product_id].client_id),
              product_name: $rootScope.getProjectHumanDescription(data.products[data.sessions[farmerId].product_id])
            }

          }
        })
        $scope.farmers = Object.values(farmersByModel1)
        $scope.originalFarmers = $scope.farmers
      })
    }

    $scope.loadRequestsFromTechIfFilterDateIsOff = function() {
      $scope.noteContainerToggle = false
      $scope.addNoteFormContainerToogle = false
      $scope.modifyNoteContainerToggle = false
      if ($scope.noteTechnicianIsFilterDate == false){
        $scope.loadRequestsFromTech($scope.selectedTechnician);
      }
    }

    $('#panierTechDatepicker').datepicker({
          format: "yyyy-mm-dd",
          todayBtn: true,
          language: $rootScope._T['wt1hoy3c'],
          orientation: "top",
          multidateSeparator: " - ",
          calendarWeeks: true,
          todayHighlight: true
      })
      .on("changeDate", function() {
        if ($scope.selectedTechnician == null || $scope.selectedTechnician == undefined) {
          UserNotSpecified();
        } else {
          $scope.farmers = []
          $scope.originalFarmers.forEach(function (farmer) {
            if ($scope.datepicker && moment(farmer.day).format('YYYY-MM-DD') == $scope.datepicker) {
              $scope.farmers.push(farmer)
              $scope.noteContainerToggle = true
              getNote($scope.techSelected.id, $scope.datepicker, function (error, response) {
                if (response) {
                  idNoteTechnician = response.id
                  $scope.noteTechnician.contentNote = response.note
                  $scope.newNoteTechnician.contentNote = response.note
                  $scope.modifyNoteContainerToggle = true
                  $scope.addNoteFormContainerToogle = false
                  $scope.modifyNoteContainerToggle = false
                  $scope.deleteNoteContainerToggle = false
                } else {
                  $scope.addNoteFormContainerToogle = true
                  $scope.modifyNoteContainerToggle = false
                  $scope.deleteNoteContainerToggle = false                  
                  $scope.noteContainerToggle = false
                  $scope.noteTechnician.contentNote = ''
                  $scope.newNoteTechnician.contentNote = ''
                }
              })              
            }
          })
        }          
      });

    $('#colDate').hide();
    $('#sortByDates').click(function(){
      if($('#sortByDates').prop('checked') == true){
        $('#colUser').removeClass('col-md-6').addClass('col-md-4');
        $('#colInfos').removeClass('col-md-6').addClass('col-md-4');
        $('#colDate').show();
      }else{
        $('#colUser').removeClass('col-md-4').addClass('col-md-6');
        $('#colInfos').removeClass('col-md-4').addClass('col-md-6');
        $('#colDate').hide();
        $scope.datepicker = '';
      }
    });

    $scope.addTechnicianNote = function() {
      addNote(function (error, response) {
        idNoteTechnician = response.id
        $scope.noteTechnician.contentNote = $scope.newNoteTechnician.contentNote
        $scope.addNoteFormContainerToogle = false
        $scope.noteContainerToggle = true
      })
    }

    $scope.modifyTechnicianNote = function() {
      Farmer.postModifyNote({
        note: $scope.noteTechnician.contentNote,
        id: idNoteTechnician
      })
    }

    $scope.deleteTechnicianNote = function() {
      Farmer.postDeleteNote({
        id: idNoteTechnician
      });
    }

    $scope.openAddNote = function() {
      $scope.noteContainerToggle = false
      $scope.addNoteFormContainerToogle = true    
      // $("#addNoteContainer").css({"display":"none"});
      // $("#addNoteFormContainer").css({"display":"block"});
    }

    $scope.validateAddNote = function() {
      // $scope.loadRequestsFromTech($scope.selectedTechnician);
      // $("#inputNote").val("");
    }

    $scope.cancelAddNote = function() {
      $("#inputNote").val("");
    }

    $scope.closeAddNote = function() {
      $scope.noteContainerToggle = true
      $scope.addNoteFormContainerToogle = false          
     //  $("#addNoteContainer").css({"display":"block"});
     //  $("#addNoteFormContainer").css({"display":"none"});
    }

    $scope.openModifyNote = function() {
      $scope.noteContainerToggle = true
      $scope.noteContainerToggle = false
      $scope.addNoteFormContainerToogle = false  
      $scope.modifyNoteContainer = true
      $scope.modifyNoteContainerToggle = true

      // $("#noteContainer").css({"display":"none"});
      // $("#modifyNoteContainer").css({"display":"block"});
    }

    $scope.closeModifyNote = function() {
      $scope.noteContainerToggle = true
      $scope.modifyNoteContainerToggle = false          
      // $("#noteContainer").css({"display":"block"});
      // $("#modifyNoteContainer").css({"display":"none"});
    }

    $scope.openDeleteNote = function() {
      $scope.noteContainerToggle = false
      $scope.deleteNoteContainerToggle = true   

      // $("#noteContainer").css({"display":"none"});
      // $("#deleteNoteContainer").css({"display":"block"});
    }

    $scope.closeDeleteNote = function() {
      $scope.noteContainerToggle = true
      $scope.deleteNoteContainerToggle = false  

      // $("#noteContainer").css({"display":"block"});
      // $("#deleteNoteContainer").css({"display":"none"});
    }

    $scope.validateDeleteNote = function() {
      $scope.deleteNoteContainerToggle = false
      $scope.addNoteFormContainerToogle = true
      // $scope.loadRequestsFromTech($scope.selectedTechnician);
    }

    $scope.changeState = function (request) {
      $scope.requestOpen = request;
      request.show_more = !request.show_more;
      $scope.showMore = !$scope.showMore;
    };

    $scope.associateToAnotherTechnician = function (tech, farmer, product) {
      // oups, c'est à changer
      Notification.error('Désolé changement non pris en compte, les changements doivent être faits dans Vega');
    }

    // deprecated
    $scope.cancelTechRequest = function (farmer) {
      console.log('in manageTechRequestsCtrl.js cancelTechRequest is deprecated')
    }

    $scope.cancelTechRequest2 = function (farmer) {
      if ($rootScope.canDisplay(5)) {
        const data2send = { farmers: [] }
        data2send.farmers.push(farmer.id)
        ApiRest.post('/vrequests/remove/tech', null, data2send, function (response) {
          swal({
            title: 'The tech has been successfully removed from the session',
            type: 'success'
          })
          $scope.farmers.forEach(function (item, index, allFarmer) {
            if (farmer.id == item.id) {
              allFarmer.splice(index, 1);
            }
          })
          let day = moment(farmer.day).format("DD/MM/YYYY");
          let textLog = $rootScope._T["lz9x299x"] + " " + day + " " + $rootScope._T["ivgmyfts"] + " " + $scope.techSelected.firstname + " " + $scope.techSelected.lastname + " " + $rootScope._T["lijdwd8c"];
          newActivityLogRequest(new Comment(), $.cookie('user_id'), farmer.request_id, textLog)
        },
        function(error) {
          
        })
      }
    }
  }
]);
