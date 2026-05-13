// DEPRECATED ce controller n'est plus utilisé du tout 20210309
Lantern.controller('TechnicienAttributionDialogCtrl', ['$rootScope', '$scope', '$filter', 'ngDialog', 'Request', 'Farmer', 'User', 'Comment','Session',
  function($rootScope, $scope, $filter, ngDialog, Request, Farmer, User, Comment, Session) {

    if ($rootScope.canDisplay(7)) {
      const branchId = Session.branchId()
      $scope.allTechs = User.findbypermission({ // DEPRECATED
        app_code: 'bons-travaux-auto',
        level: 'technicien',
        branch: branchId
      }, function() {
        $scope.allTechs.forEach(function(tech) {
          if (tech.person != null) {
            tech.name = tech.person.firstname + " " + tech.person.lastname;
          } else {
            //TEMP FIX
            tech.name = tech.firstname + " " + tech.lastname;
          }
        });


        $scope.autoSelectUser();
      });


      $scope.selectTechWriter = function(item, model) {
        $scope.tech_writer = item;
      };

      $scope.selectTechReader = function(item, model) {
        $scope.tech_reader = item;
      };


      $scope.autoSelectUser = function() {

        var farmerInge = null;

        if($scope.requestToSend != null){

      } else if($scope.farmersToSend != null){

      } else if($scope.requestsToSend == null){
        console.error("No request or farmers for autoSelect");
      }

        if (farmerInge != null) {
          var searchInge = $filter('filter')($scope.allTechs, {
            farmer_name: farmerInge
          });
          if (searchInge.length > 0) {
            $scope.tech_writer = searchInge[0];
          } else {
            console.info("No Inge found");
          }
        } 

      };

      $scope.sendRequestsFarmer = function() {
        var count = 0;
        var size = $scope.requestsToSend.length;
        if ($scope.selectedFarmer != null) {
          angular.forEach($scope.selectedFarmer, function(selectFarmer) {
            var farmer_booking_id = selectFarmer.booking_id;
            $scope.requestsToSend.forEach(function(request) {
              angular.forEach(request.ownFarmerbookings, function(farmer) {
                if (farmer.booking_id == farmer_booking_id) {
                  var updateFarmer = new Farmer();
                  updateFarmer.is_selected = 1;
                  updateFarmer.date_send_tech = todaySQL;
                  if ($scope.tech_reader != null) {
                    updateFarmer.tech_reader_id = $scope.tech_reader.id;
                  } else {
                    updateFarmer.tech_reader_id = null;
                  }
                  if ($scope.tech_writer != null) {
                    updateFarmer.tech_writer_id = $scope.tech_writer.id;
                  } else {
                    updateFarmer.tech_writer_id = null;
                  }
                  //console.log(updateFarmer);
                  updateFarmer.$directUpdate({
                    id: farmer.id
                  }, function(returnFarmer) {
                    farmer.selected = 0
                    farmer.is_selected = returnFarmer.is_selected
                    farmer.date_send_tech = returnFarmer.date_send_tech
                    farmer.tech_writer_user = returnFarmer.tech_writer_user

                    var newRequest = new Request();
                    newRequest.is_validated_for_tech = 1;
                    newRequest.date_send_tech = todaySQL;
                    if ($scope.tech_reader != null) {
                      newRequest.tech_reader_id = $scope.tech_reader.id;
                    } else {
                      newRequest.tech_reader_id = null;
                    }
                    if ($scope.tech_writer != null) {
                      newRequest.tech_writer_id = $scope.tech_writer.id;
                    } else {
                      newRequest.tech_writer_id = null;
                    }
                    newRequest.$update({
                      requestId: request.id
                  }, function(aRequest) {
                      if(request.display) {
                          request.lastFarmerbooking = null
                            angular.forEach(request.ownFarmerbookings, function(aFarmer) {
                              if (request.lastFarmerbooking == null && aFarmer.is_selected != 1  && farmer.id != aFarmer.id) {
                                request.lastFarmerbooking = aFarmer;
                              }
                            });
                      }
                      newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["tkw8vvlv"] + " " + $scope.tech_writer.name)
                      count++;
                      if (count == size) {
                        //swal({   title: "Envoi effectué",   text: "La séance a bien été envoyée, félicitations !", type: "success",  timer: 1000});
                      //  swal("Envoi effectué","La séance a bien été envoyée, félicitations !", "success")
                        ngDialog.close();
                      }
                    });
                  }, function() {
                    console.log('Error during updating farmer');
                  });
                }
              });
            });
          })

        } else {
          console.log("No Farmer selected");
          console.log($scope.selectedFarmer);
        }
      };

      $scope.sendRequestsInternal = function() {
        var requests = []
        if($scope.requestToSend != null) {
          requests = [$scope.requestToSend]
        } else {
          requests = $scope.requestsToSend;
        }
        angular.forEach(requests, function(request) {
          var newRequest = new Request();
          newRequest.is_validated_for_tech = 1;
          newRequest.date_send_tech = todaySQL;
          if ($scope.tech_reader != null) {
            newRequest.tech_reader_id = $scope.tech_reader.id;
          } else {
            newRequest.tech_reader_id = null;
          }
          if ($scope.tech_writer != null) {
            newRequest.tech_writer_id = $scope.tech_writer.id;
          } else {
            newRequest.tech_writer_id = null;
          }
          newRequest.$update({
            requestId: request.id
          }, function() {
            request.is_validated_for_tech = 1
            newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["tkw8vvlv"] + " " + $scope.tech_writer.name)
            //swal({   title: "Envoi effectué",   text: "La demande a bien été envoyée, félicitations !", type: "success",  timer: 1000});

            //swal("Envoi effectué","La demande a bien été envoyée, félicitations !", "success")
            ngDialog.close();
          });
        })
      };

      $scope.sendRequestFarmer = function() {
        var request = $scope.requestToSend;
        //console.log(request);
        //console.log($scope.selectedFarmer);
        //var found = false;
        if ($scope.selectedFarmer != null && request != null) {
          angular.forEach($scope.selectedFarmer, function(farmerSelect) {
            var found = false
            angular.forEach(request.ownFarmerbookings, function(farmer) {
              if (farmer.id == farmerSelect.id && !found) {
                found = true;
                var updateFarmer = new Farmer();
                updateFarmer.is_selected = 1;
                updateFarmer.date_send_tech = todaySQL;
                if ($scope.tech_reader != null) {
                  updateFarmer.tech_reader_id = $scope.tech_reader.id;
                } else {
                  updateFarmer.tech_reader_id = null;
                }
                if ($scope.tech_writer != null) {
                  updateFarmer.tech_writer_id = $scope.tech_writer.id;
                } else {
                  updateFarmer.tech_writer_id = null;
                }
                updateFarmer.$directUpdate({
                  id: farmer.id
                }, function(returnFarmer) {
                  farmer.selected = 0
                  farmer.is_selected = returnFarmer.is_selected
                  farmer.date_send_tech = returnFarmer.date_send_tech
                  farmer.tech_writer_user = returnFarmer.tech_writer_user

                  var newRequest = new Request();
                  newRequest.is_validated_for_tech = 1;
                  newRequest.date_send_tech = todaySQL;
                  if ($scope.tech_reader != null) {
                    newRequest.tech_reader_id = $scope.tech_reader.id;
                  } else {
                    newRequest.tech_reader_id = null;
                  }
                  if ($scope.tech_writer != null) {
                    newRequest.tech_writer_id = $scope.tech_writer.id;
                  } else {
                    newRequest.tech_writer_id = null;
                  }
                  newRequest.$update({
                    requestId: request.id
                }, function(aRequest) {
                    request.lastFarmerbooking = null
                      angular.forEach(request.ownFarmerbookings, function(aFarmer) {
                        if (request.lastFarmerbooking == null && aFarmer.is_selected != 1  && farmer.id != aFarmer.id) {
                          request.lastFarmerbooking = aFarmer;
                        }
                      });
                    newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["tkw8vvlv"] + " " + $scope.tech_writer.name)
                    //swal("Envoi effectué","La séance a bien été envoyé, félicitations !", "success")
                    //swal({   title: "Envoi effectué",   text: "La séance a bien été envoyée, félicitations !", type: "success",   timer: 1000});

                      ngDialog.close();

                  });
                }, function() {
                  console.log('Error during updating farmer');
                });
              }
            })

          });

        } else {
          console.log("No Farmer selected or request null");
          console.log($scope.selectedFarmer);
        }
      };
        $scope.selectedFarmer = []
      $scope.selectFarmer = function(farmer, requests) {
        if ($scope.requestToSend != null) {
          // angular.forEach($scope.requestToSend.ownFarmerbookings, function(farmer) {
          //   farmer.selected = 0;
          // });
        } else if ($scope.farmersToSend != null) {
          // angular.forEach($scope.farmersToSend, function(farm) {
          //   farm.farmer.selected = 0;
          // });
          $scope.requestsToSend = requests;
        } else {
          console.log("No farmers or request");
        }
        if (farmer.selected == 1) {
          farmer.selected = 0
          $scope.selectedFarmer.splice($scope.selectedFarmer.indexOf(farmer), 1);

        } else {
          farmer.selected = 1
          $scope.selectedFarmer.push(farmer);

        }
        console.log($scope.selectedFarmer);

      };

    } else {
      alert($rootScope._T["t5hjtmmv"]);
      //history.go(-1);
    }


  }
]);
