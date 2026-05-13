Lantern.controller('MassUpdateDialogCtrl', ['$scope', '$rootScope', '$window', '$state', '$cookies', '$stateParams', '$filter', '$q', 'ngDialog',
 'Request', 'MediaItems', 'FileUploader', 'Attachments', 'Comment', 'NotificationService', 'Farmer', 'Notification','ValueListService',
  function ($scope, $rootScope, $window, $state, $cookies, $stateParams, $filter, $q, ngDialog,
     Request, MediaItems, FileUploader, Attachments, Comment, NotificationService, Farmer, Notification, ValueListService) {
    // page pour digitalmedia
    // existe dans app\js\controllers\technicien\requestsAutoTechListCtrl.js
    // Mais la fonction associée $scope.massUpdatePopup n'est jamais appelée
    //
    // templates html associés  
    // views/Dialog/MassUpdateSendBackDialog.html
    // views/Dialog/MassUpdateTakeRequestVolumeDialog.html
    // et app\js\controllers\production\myRequestsCtrl.js qui n'est plus utilisé nulle part
    // template html 
    // views/Dialog/MassUpdateUrgentDialog.html
    // views/Dialog/MassUpdateDateDesiredDialog.html
    // views/Dialog/MassUpdateCancelOnHoldDialog.html
    // appelé aussi de app/js/controllers/production/myRequestsCtrl.js qui n'est jamais appelé
    $scope.urgent = false;
    $scope.date_desired = "";
    $scope.send_back_btn_state = 0;
    $scope.delai_souhaite = "";
    $scope.selectedDates = [];
    $scope.show_tech = true;


    $scope.supports = ValueListService.getDigiMediaSupports()

    $scope.speeds = ValueListService.getSpeeds()

    // lisste différente des autres pages, est-ce que cette page est toujours utilisée ?
    $scope.layouts = [
      { id: "0", name: "Mono" },
      { id: "1", name: "2.0" },
      { id: "2", name: "5.1" },
      { id: "3", name: "5.1+2.0" },
      { id: "4", name: "7.1" },
      { id: "5", name: "ATMOS" }
    ];

    $scope.saveChange = function (object) {
      switch (object) {
        case 'urgent':
          var count = $scope.massRequestsToUpdate.length;
          $scope.massRequestsToUpdate.forEach(function (request) {
            var updateRequest = new Request();
            updateRequest.important = $scope.urgent;
            $rootScope.showLoading++;
            updateRequest.$update({
              requestId: request.id
            }, function () {
              $rootScope.showLoading--;
              request.important = $scope.urgent
              count--;
              if ($scope.urgent) {
                newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["pcodebge"])
              } else {
                newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["is4aq9ar"])
              }
              if (count == 0) {
                swal($rootScope._T["70jumwe9"], $rootScope._T["fthkiywk"], "success");
                var descNotif = "";
                if ($scope.urgent) {
                  descNotif = "Ces demandes ont été notées comme urgentes";
                } else {
                  descNotif = "Ces demandes ne sont plus urgentes";
                }
                sendStandardNotif(
                  new NotificationService(),
                  $scope.massRequestsToUpdate,
                  "planning",
                  "Demande(s) urgente(s)",
                  descNotif,
                  $filter,
                  "urgent",
                  $rootScope
                );
                ngDialog.closeAll();
              }
            });
          });
          break;
        case 'date_desired':
          var count = $scope.massRequestsToUpdate.length;
          var oldDatesStr = $scope.massRequestsToUpdate[0].delai_souhaite;
          $scope.massRequestsToUpdate.forEach(function (request) {
            var updateRequest = new Request();
            var date_desired_array = $scope.date_desired.split(" - ");
            var date_desired_timestamp_array = [];
            date_desired_array.forEach(function (date_desired) {
              var delai_souhaite_date = moment(date_desired, "DD MMM YYYY");
              date_desired_timestamp_array.push(delai_souhaite_date.valueOf());
            });
            updateRequest.delai_souhaite = date_desired_timestamp_array.join(',');
            var newDatesStr = date_desired_timestamp_array.join(',');
            $rootScope.showLoading++;
            updateRequest.$update({
              requestId: request.id
            }, function () {
              $rootScope.showLoading--;
              count--;
              if (count == 0) {
                swal($rootScope._T["70jumwe9"], $rootScope._T["dovqgev1"], "success");

                var newDates = [];
                if (date_desired_timestamp_array != null) {
                  angular.forEach(date_desired_timestamp_array, function (timestamp) {
                    var date = moment(timestamp);
                    newDates.push(date.format("DD/MM/YYYY"));
                  });
                }

                var oldDates = [];
                if (oldDatesStr != null) {
                  var oldDatesArray = oldDatesStr.split(',');
                  angular.forEach(oldDatesArray, function (timestamp) {
                    var date = moment(parseInt(timestamp));
                    oldDates.push(date.format("DD/MM/YYYY"));
                  });
                }

                var notifDesc = "Les dates souhaitées pour cette demande ont été modifées.<br/>" + "Nouvelles dates souhaitées : <br/>" + newDates.sort().join('<br/>') + "<br/>Anciennes dates : <br/>" + oldDates.sort().join("<br/>");

                angular.forEach($scope.massRequestsToUpdate, function (req) {
                  newActivityLogRequest(new Comment(), $.cookie('user_id'), req.id, $rootScope._T["lijsl5qn"], oldDates.sort().join(', '), newDates.sort().join(', '))
                })

                sendStandardNotif(
                  new NotificationService(),
                  $scope.massRequestsToUpdate,
                  "production,planning",
                  "Mise à jour des dates souhaitées",
                  newDates.sort().join(', '),
                  $filter,
                  "date_wishes",
                  $rootScope
                );

                ngDialog.closeAll();
                request.selectedDates = date_desired_timestamp_array

              }
            });
          });
          break;
        case 'take_requests':
          var checkDates = true;
          //Pas de vérification si une des demandes est pour le planning
          if ($scope.massRequestsToUpdate[0] != null && $scope.massRequestsToUpdate[0].planning_id == "digital-media") {
            checkDates = false;
          }

          if (($scope.start_date_plan == null || $scope.end_date_plan == null) && checkDates) {
            swal($rootScope._T["w3wv6dnn"], $rootScope._T["gvw72dm5"], "error");
          } else {
            var count = $scope.massRequestsToUpdate.length;
            $scope.massRequestsToUpdate.forEach(function (request) {
              var newRequest = new Request();
              newRequest.is_planned = true;
              newRequest.is_validated_for_tech = true;
              newRequest.date_send_tech = todaySQL;
              newRequest.planification_date = todaySQL;
              newRequest.tech_writer_id = $.cookie('user_id');
              newRequest.date_start = $scope.start_date_plan;
              newRequest.date_end = $scope.end_date_plan;
              newRequest.date_start_time = $scope.start_date_plan_time;
              newRequest.date_end_time = $scope.start_end_plan_time;
              newRequest.$update({
                requestId: request.id
              }, function (newRequest) {
                count--;
                if (count == 0) {
                  swal($rootScope._T["msmu9igu"], $rootScope._T["rs5am3lp"], "success");

                  var notifDesc = "Les demandes ont été prises : ";
                  if (newRequest.date_start != null && newRequest.date_end != null) {
                    notifDesc += "<br/>Date de début : " + newRequest.date_start + "<br/>Date de fin : " + newRequest.date_end;
                  }
                  notifDesc += "<br/>Par : " + newRequest.tech_writer_user.person.firstname + " " + newRequest.tech_writer_user.person.lastname;

                  angular.forEach($scope.massRequestsToUpdate, function (req) {
                    newActivityLogRequest(new Comment(), $.cookie('user_id'), req.id, $rootScope._T["aqychsu5"], newRequest.date_start, newRequest.date_end)
                  })

                  sendStandardNotif(
                    new NotificationService(),
                    $scope.massRequestsToUpdate,
                    "production",
                    "Prise des demandes",
                    notifDesc,
                    $filter,
                    "planification",
                    $rootScope
                  );
                  ngDialog.closeAll();
                }
              });
            });
          }
          break;
        case 'send_back':
          var count = $scope.massRequestsToUpdate.length;
          $scope.massRequestsToUpdate.forEach(function (request) {
            var updateRequest = new Request();
            updateRequest.is_done = 1;
            request.is_done = 1;
            if ($scope.send_back_btn_state == 2) {
              updateRequest.is_partial = 1;
              request.is_partial = 1;
            }
            updateRequest.is_not_done = 0;
            updateRequest.closing_date = todaySQL;
            //On casse automatiquement le groupe
            //updateRequest.in_group = 0;
            updateRequest.is_sent_back = 1;
            updateRequest.is_archived = 0;

            updateRequest.$update({
              requestId: request.id
            }, function () {
              count--;
              newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["3c3s4epd"])
              if (count == 0) {
                swal($rootScope._T["70jumwe9"], $rootScope._T["q970ntqh"], "success");
                var notif = $scope.setNotificationSendBack($scope.massRequestsToUpdate);

                notif.$save();
                ngDialog.closeAll();
              }
            });
          });
          break;
        case 'plan_requests':
          var count = $scope.massRequestsToUpdate.length;
          //Check des séances farmer

          var promises = [];
          var promises_check = [];
          $scope.massRequestsToUpdate.forEach(function (request) {
            if (request.isFarmerIdSelected) {              
              var aReq = Request.farmerUpdate({ actionId: request.farmer_id }, function () {
                var req = Farmer.checkFarmer({ farmer_id: request.farmer_id });
                promises_check.push(req.$promise);
              });
              promises.push(aReq.$promise);
            }
          });

          $q.all(promises).then(function (res) {
            $q.all(promises_check).then(function (results) {
              var willPlan = true;
              for (var i = 0; i < results.length; i++) {
                if (results[i].result != "success") {
                  willPlan = false;
                }
              }

              if (willPlan) {
                $scope.massRequestsToUpdate.forEach(function (request) {
                  if (request.isFarmerIdSelected) {
                    var newRequest = new Request();
                    newRequest.is_planned = true;
                    if (request.selectedDates === undefined) {
                      request.selectedDates = [];
                    }
                    newRequest.delai_souhaite = request.selectedDates.join(',');

                    //newRequest.delai_souhaite = $scope.delai_souhaite;
                    newRequest.info_for_planning = request.info_for_planning
                    //newRequest.is_validated_for_tech = true;
                    newRequest.planification_date = todaySQL;
                    //newRequest.tech_writer_id = $.cookie('user_id');
                    var updatedRequests = []
                    newRequest.$update({
                      requestId: request.id
                    }, function (reqUpdated) {
                      updatedRequests.push(reqUpdated);
                      count--;
                      newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["moan71y1"])
                      request.is_planned = 1
                      request.display = 0
                      request.selected = false
                      if (count == 0) {
                        $scope.plannings.forEach(function (planning) {
                          planning.requests.forEach(function (req) {
                            req.selected = false
                            angular.forEach(req.group, function (aRequest) {
                              aRequest.selected = false
                            })
                          });
                        });

                        var descNotif = "";
                        if ($scope.start_date_plan != null && $scope.end_date_plan != null) {
                          descNotif = "Planification aux dates suivantes : <br/>Date de début : " + $scope.start_date_plan + "<br/>Date de fin : " + $scope.end_date_plan;
                        } else {
                          descNotif = $rootScope._T["ja87xhlu"] + ' '
                          var descNotifDetail = ""
                          var isSameDate = true;
                          reqUpdated.ownFarmerbookings = objectInArray(reqUpdated.ownFarmerbookings);
                          if (reqUpdated.ownFarmerbookings != null && reqUpdated.ownFarmerbookings.length > 0) {
                            var selectedFarmer = reqUpdated.ownFarmerbookings;
                            for (var i = 0; i < selectedFarmer.length; i += 1) {
                              var momentDate = moment(selectedFarmer[i].day, "YYYY-MM-DD HH:mm:ss");

                              // console.log(selectedFarmer.length, request.selectedDates.length);
                              if (selectedFarmer.length == request.selectedDates.length) {
                                var farmerTimestamp = parseInt(moment(selectedFarmer[i].day).format('x'));
                                // console.log(request.selectedDates, farmerTimestamp, request.selectedDates.indexOf(farmerTimestamp));
                                if (request.selectedDates.indexOf(farmerTimestamp) == -1) {
                                  isSameDate = false;
                                }
                              } else {
                                isSameDate = false;
                              }
                              

                              if (momentDate.isValid()) {
                                var month = momentDate.format("MMM");
                                var day = {
                                  "day": momentDate.format("DD/MM/YY"),
                                  "audit": selectedFarmer[i].audit?selectedFarmer[i].audit:"<i>" + $rootScope._T["fj98qsz4"] + "</i>",
                                  "hours": selectedFarmer[i].start_time ? selectedFarmer[i].start_time + "-" + selectedFarmer[i].end_time : $rootScope._T["mjfmw3ik"]
                                };
                                day.ingenieur = "<i>" + $rootScope._T["fj98qsz4"] + "</i>" 
                                descNotifDetail += " " + day.day + " | " + $rootScope._T["h9ox64fe"] + " : " + day.audit + " | " + $rootScope._T["vxq0sr4l"] + " : " + day.hours + " | Tech : " + day.ingenieur + "<br/>"; 
                                
                              }
                            }
                          }

                          if (isSameDate) {
                            descNotif += $rootScope._T["bc8yp98f"]
                          } else {
                            descNotif += $rootScope._T["jxorhl5q"]
                          }

                          descNotif += descNotifDetail;
                        }

                        sendStandardNotif(
                          new NotificationService(),
                          $scope.massRequestsToUpdate,
                          "production",
                          $rootScope._T["kxq3ttb9"],
                          descNotif,
                          $filter,
                          "planification",
                          $rootScope
                        );


                        $rootScope.clearNotif();

                        ngDialog.closeAll({
                          id: getKeyGroup(updatedRequests[0]), key: getHashRequest(updatedRequests[0])
                        });
                      }
                    });
                  }
                });
            
              } else {
                swal({
                  title: $rootScope._T["tgcnytpo"],
                  text: $rootScope._T["xury56vw"],
                  type: "error",
                  showCancelButton: false,
                  confirmButtonColor: "#DD6B55",
                  confirmButtonText: "Ok",
                  closeOnConfirm: true
                });
              }

            })
          });

          break;
        case 'send_tech':
          var size = $scope.massRequestsToUpdate.length;
          var count = 0;
          $scope.massRequestsToUpdate.forEach(function (request) {
            // Requête individuelle sans farmer
            if (request.ownFarmerbookings.length == 0 && request.selected == 1) {
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
              }, function () {
                request.is_validated_for_tech = 1
                //request.selected = 0
                newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["tkw8vvlv"] + " " + $scope.tech_writer.name)
                count++;
                if (count == size) {
                  Notification.success($rootScope._T["wskw1rj4"]);
                  ngDialog.close();
                }
              }, function () {
                console.log('Error during updating internal request');
              });
            } else if (request.farmerEntities == null) { // Requête individuelle avec farmer
              angular.forEach(request.ownFarmerbookings, function (farmer) {
                if (farmer.selected == 1) {
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
                  }, function (returnFarmer) {
                    if (returnFarmer.error !== undefined) {
                      swal($rootScope._T["zjg4qcyi"], $rootScope._T["48f5n0ma"], "error");
                      Notification.error($rootScope._T["9doks60r"])
                      console.log('Error during updating single farmer');
                    } else {
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
                      }, function () {
                        newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["tkw8vvlv"] + " " + $scope.tech_writer.name)

                        count++;
                        if (count == size) {
                          var descNotif = $rootScope._T['bth1kjrl']
                          sendStandardNotif(
                            new NotificationService(),
                            $scope.massRequestsToUpdate,
                            "technicien",
                            $rootScope._T['tfjclj5o'],
                            descNotif,
                            $filter,
                            "send_farmer",
                            $rootScope
                          );
                          Notification.success($rootScope._T["cj0xqwfy"]);
                          ngDialog.close();
                        }
                      }, function (error) {
                        Notification.error($rootScope._T["9doks60r"])
                      });
                    }
                    
                  });
                }
              });
            } else if (request.farmerEntities != null) {
              angular.forEach(request.farmerEntities, function (farmerEntity) {
                if (farmerEntity.farmer.selected == 1) {
                  angular.forEach(farmerEntity.requests, function (request) {
                    angular.forEach(request.ownFarmerbookings, function (farmer) {
                      if (farmer.booking_id == farmerEntity.farmer.booking_id) {
                        //TODO send farmer !
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
                        }, function (returnFarmer) {
                          if (returnFarmer.error !== undefined) {
                            swal($rootScope._T["zjg4qcyi"], $rootScope._T["48f5n0ma"], "error");                            
                            Notification.error($rootScope._T["9doks60r"])
                            console.log('Error during updating single farmer');
                          } else {
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
                            }, function () {
                              newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["tkw8vvlv"] + " " + $scope.tech_writer.name)
                              count++;
                              if (count == size) {
                                var descNotif = $rootScope._T['bth1kjrl']
                                sendStandardNotif(
                                  new NotificationService(),
                                  $scope.massRequestsToUpdate,
                                  "technicien",
                                  $rootScope._T["kxq3ttb9"],
                                  descNotif,
                                  $filter,
                                  "planification",
                                  $rootScope
                                );
                                Notification.success($rootScope._T["cj0xqwfy"]);
                                ngDialog.close();
                              }
                            }, function () {
                              Notification.error($rootScope._T["9doks60r"])
                            });
                          }
                        });
                      }
                    })
                  });
                }
              });
            } else {
              console.log("Request type unknown");
            }
          });
          break;
        case "put_on_hold":
          var on_hold_requests = $filter('filter')($scope.massRequestsToUpdate, { 'on_hold': null })
          on_hold_requests = on_hold_requests.concat($filter('filter')($scope.massRequestsToUpdate, { 'on_hold': 0 }))
          var count = on_hold_requests.length
          if (count == 0) {
            ngDialog.closeAll();
          }
          on_hold_requests.forEach(function (aRequest) {
            var updateRequest = new Request()
            updateRequest.on_hold = true
            updateRequest.$update({
              requestId: aRequest.id
            }, function (request) {
              aRequest.on_hold = 1
              newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["sz8lmvdd"])
              var descNotif = $rootScope._T["sxwaeoub"]
              count--
              if (count == 0) {
                swal($rootScope._T["msmu9igu"], $rootScope._T["mdq3mfgp"], "success");
                sendStandardNotif(
                  new NotificationService(),
                  on_hold_requests,
                  "planning",
                  $rootScope._T["t0t3ypk6"],
                  descNotif,
                  $filter,
                  "on_hold",
                  $rootScope
                );
                ngDialog.closeAll();
              }
            })
          });
          break;
        case "not_put_on_hold":
          var on_hold_requests = $filter('filter')($scope.massRequestsToUpdate, { 'on_hold': 1 })
          var count = on_hold_requests.length
          if (count == 0) {
            ngDialog.closeAll();
          }
          on_hold_requests.forEach(function (aRequest) {
            var updateRequest = new Request()
            updateRequest.on_hold = false
            updateRequest.$update({
              requestId: aRequest.id
            }, function (request) {
              aRequest.on_hold = 0
              newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["otp2f1m5"])
              var descNotif = "La demande n'est plus en attente.";
              count--
              if (count == 0) {
                swal($rootScope._T["msmu9igu"], $rootScope._T["xctjz7zg"], "success");
                sendStandardNotif(
                  new NotificationService(),
                  on_hold_requests,
                  "planning",
                  $rootScope._T["uutsizwg"],
                  descNotif,
                  $filter,
                  "not_on_hold",
                  $rootScope
                );
                ngDialog.closeAll();
              }
            })
          });
          break;
        case "cancel_requests":
          swal({
            title: $rootScope._T["64bnsbpe"],
            text: $rootScope._T["uoftswh3"],
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: $rootScope._T["k4xkinc0"],
            closeOnConfirm: false
          }, function () {
            $scope.massRequestsToUpdate.forEach(function (aRequest) {
              var updateRequest = new Request()
              updateRequest.is_canceled = true
              updateRequest.is_done = true
              updateRequest.is_partial = false
              updateRequest.is_not_done = false
              updateRequest.is_sent_back = true

              updateRequest.$update({
                requestId: aRequest.id
              }, function (request) {
                swal($rootScope._T["glo3vnp3"], $rootScope._T["ywno9fml"], "success");
                aRequest.is_done = request.is_done
                aRequest.is_partial = request.is_partial
                aRequest.is_not_done = request.is_not_done
                aRequest.is_canceled = request.is_canceled
                aRequest.is_sent_back = request.is_sent_back

                newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["yp9tp27g"])
                if (request.tech_writer_id != null) {
                  var optNotif = "planning,technicien"
                } else {
                  var optNotif = "planning"
                }
                sendStandardNotif(
                  new NotificationService(),
                  $scope.massRequestsToUpdate,
                  optNotif,
                  $rootScope._T["yp9tp27g"],
                  $rootScope._T["8ou8izp2"],
                  $filter,
                  "cancel",
                  $rootScope
                );
                $state.reload();
                ngDialog.closeAll()

              })
            })
          });
          break;
        default:
          console.log('no object found to do the mass update');
          break;
      }
    }

    $scope.setNotificationSendBack = function (requests) {
      var notif = new NotificationService();

      requests = $filter('orderBy')(requests, "product.human_description");
      var request_ids = [];
      requests.forEach(function (aReq) {
        request_ids.push(aReq.id);
      });

      var request = requests[0];

      if (requests.length == 1) {
        notif.request_id = requests[0].id;
      } else {
        notif.request_ids = request_ids.join(",");
        notif.group = 1
      }

      var descs = [];
      requests.forEach(function (aReq) {
        descs.push(aReq.product.human_description);
      });
      var prefix = sharedStart(descs);
      notif.product_desc = request.product.human_description;
      var splitHumanDesc = request.product.human_description.split(" - ");
      for (var i = 1; i < requests.length; i++) {
        if (splitHumanDesc != null && splitHumanDesc.length == 3) {
          notif.product_desc += ", " + requests[i].product.human_description.substr(request.product.human_description.length - splitHumanDesc[2].length);
        } else {
          notif.product_desc += ", " + requests[i].product.human_description.substr(prefix.length);
        }
      }

      notif.services = "planning,production";
      notif.type = "home";
      notif.project_id = request.product.subproject.project.id;
      notif.subproject_id = request.product.subproject.id;
      notif.planning_id = request.planning_id;
      notif.archived = 0;
      notif.etape_action = request.action_type.etape_type.value + " - " + request.action_type.value;
      notif.subject = $rootScope._T["3fx1rq8a"]
      notif.description = $rootScope._T["xmq4mba0"]
      notif.description += $rootScope._T["ageoqhbl"] + ' ' + request.tech_writer_user.firstname + " " + request.tech_writer_user.lastname + " <br/>";
      notif.origin_user_id = $.cookie('user_id')

      if (request.is_partial == 1) {
        // A replanifier
        notif.replan = true;
        notif.description +=  $rootScope._T["6rypdonx"]
      } else if (request.is_not_done == 1) {
        // A replanifier
        notif.replan = true;
        notif.description += $rootScope._T["6rypdonx"]
      } else if (request.is_done == 1) {
        notif.is_done = true;
        notif.description += $rootScope._T["5me8mcty"] 
      }

      if (request.ownObservation.length > 0) {
        notif.description += $rootScope._T["lccbwbpx"]
      } else {
        notif.description += $rootScope._T["ahwl5mah"]
      }

      if (notif.has_return) {
        notif.description += $rootScope._T["v4qd5380"]
      } else {
        notif.description += $rootScope._T["dciov1sc"]
      }

      //Patch pour désactiver si la demande est avec retour, on ne l'a met pas en terminée
      if (notif.has_return && notif.is_done) {
        notif.is_done = null;
      }

      return notif;
    };

    $scope.addNewMediaItem = function (request) {
      request.itemsInRequest.push(new MediaItems())
    }

    $scope.editMediaItem = function (item, request, support) {
      if (support) {
        var selected = $filter('filter')($scope.supports, {
          support: item.support
        });
        item.nature = ($scope.supports && selected.length) ? selected[0].nature : 'Error';
      }
      if (item.id != null) {
        var upItem = new MediaItems();
        upItem = item;
        delete item.product
        upItem.$update({
          itemId: item.id
        });
      } else {
        item.origin = 'Interne';
        item.product_id = request.product_id;
        item.original_request_id = request.id;
        item.workflow = request.workflow.workflow_type.value;

        item.$save({}, function (itemSaved) {
          item = itemSaved;
          //request.itemsInRequest.push(itemSaved);
          //Mise à jour coté serveur
          var items = [];
          request.itemsInRequest.forEach(function (item) {
            items.push(item.id);
          });
          var requestToUpdate = new Request();
          requestToUpdate.media_items = items.toString();
          requestToUpdate.$update({
            requestId: request.id
          });

        });
      }

    };

    $scope.remove = function (item) {
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

    $scope.download = function (item) {
      $window.open(URL_API + "/attachments/download/" + item.formData[0].id + "?filesize=" + item.file.size + "&token=" + $.cookie('token'), '_blank');
    };

    $scope.addCommentOnReturn = function (aReturn) {
      var newComment = new Comment();
      newComment.text = aReturn.newComment;
      newComment.user_id = $.cookie('user_id');
      newComment.return_id = aReturn.id;
      newComment.context = "Détail demande";
      if (aReturn.newComment !== undefined) {
        newComment.$save(function () {
          aReturn.newComment = "";
          Return.get({
            id: aReturn.id
          }, function (updateReturn) {
            aReturn.ownComment = updateReturn.ownComment;
          });

        });
      }
    };

    $scope.count = function (objects) {
      //console.log(allReturns);
      var count = 0;
      angular.forEach(objects, function () {
        count++;
      });
      return count;
    };

    $scope.addCommentOnAllRequests = function (comment, show_tech) {
      $scope.countRequests = 0
      angular.forEach($scope.massRequestsToUpdate, function (request) {
        if(request.isFarmerIdSelected) {
          request.newComment = comment
          $scope.addCommentOnRequest(request, show_tech, true)
        }
      })
    }

    $scope.addCommentOnRequest = function (request, show_tech, mass_comment) {
      if (request.newComment != null && request.newComment.trim() != "") {
        var newComment = new Comment();
        newComment.text = request.newComment;
        newComment.user_id = $.cookie('user_id');
        newComment.request_id = request.id;
        newComment.show_tech = show_tech
        //newComment.context = "Gestion des retours";

        newComment.$save(function () {
          request.newComment = "";
          $scope.newComment = ""
          Request.get({
            requestId: request.id
          }, function (updateRequest) {
            request.ownComment = updateRequest.ownComment;

            var allComments = [];
            request.ownComment.forEach(function (comment) {
              var formatedString = "";
              formatedString += "<i>" + comment.user.firstname + " " + comment.user.lastname + "</i>";
              formatedString += " - (" + comment.date_creation + ")";
              formatedString += " : " + comment.text;
              allComments.push(formatedString);
            });


            if (mass_comment) {
              $scope.countRequests += 1
              if ($scope.countRequests == $scope.massRequestsToUpdate.length) {
                sendStandardNotif(
                  new NotificationService(),
                  $scope.massRequestsToUpdate,
                  "planning,production",
                  $rootScope._T['8m4tsidm'],
                  newComment.text,
                  $filter,
                  "comment",
                  $rootScope
                );
              }

            } else {
              sendStandardNotif(
                new NotificationService(),
                [request],
                "planning,production",
                $rootScope._T['8m4tsidm'],
                newComment.text,
                $filter,
                "comment",
                $rootScope
              );
            }
          });

        });

      }
    };

    $scope.saveDesiredTime = function (request) {
      var upRequest = new Request();
      if (request.selectedDates === undefined) {
        request.selectedDates = [];
      }
      upRequest.delai_souhaite = request.selectedDates.join(',');
      upRequest.$update({
        requestId: request.id
      })
    }

    $scope.selectFarmerSingle = function (mainFarmer, request) {
      // angular.forEach(request.ownFarmerbookings, function(farmer) {
      //   farmer.selected = 0;
      // });
      if (mainFarmer.is_selected != 1) {
        mainFarmer.selected == 1 ? mainFarmer.selected = 0 : mainFarmer.selected = 1;
        
      }
      

    };

    $scope.selectFarmerMultiple = function (entityFarmer, farmers) {
      // angular.forEach(farmers, function(entity) {
      //   entity.farmer.selected = 0;
      // });
      //console.log("id mul" + entityFarmer.farmer.id);
      if (entityFarmer.farmer.selected == 1) {
        entityFarmer.farmer.selected = 0;
      } else {
        entityFarmer.farmer.selected = 1;
      }
    };

    $scope.isAllFarmerSelected = function () {
      var allSelect = true;
      var foundFarmer = false;
      for (var i = 0; i < $scope.massRequestsToUpdate.length; i += 1) {
        var request = $scope.massRequestsToUpdate[i];
        if (request.ownFarmerbookings.length != 0) {
          for (var j = 0; j < request.ownFarmerbookings.length; j += 1) {
            if (request.ownFarmerbookings[j].selected == 1) {
              foundFarmer = true;
              break;
            }
          }
        }
      }

      return foundFarmer;
    }

    $scope.removeNewMediaItem = function (request, index) {
      request.itemsInRequest.splice(index, 1)
    }

    $scope.selectFarmerIdentical = function (farmer) {
      if (farmer.is_selected != 1) {
        farmer.selected = !farmer.selected;
        for (var i = 0; i < $scope.massRequestsToUpdate.length; i += 1) {
          var request = $scope.massRequestsToUpdate[i];
          if (request.ownFarmerbookings.length != 0) {
            for (var j = 0; j < request.ownFarmerbookings.length; j += 1) {
              var aFarmer = request.ownFarmerbookings[j];
              if (aFarmer.day == farmer.day && aFarmer.start_time == farmer.start_time && aFarmer.end_time == farmer.end_time && aFarmer.is_selected != 1) {
                aFarmer.selected = farmer.selected;
              }
            }
          }
        }
      }
      
    }


    $scope.showTechnicalSpecModal = function (techspec_id) {
      $scope.isProd = true;
      $scope.techspec_id = techspec_id
      ngDialog.open({
        template: 'views/Dialog/TechnicianTechnicalSpecDialog.html',
        className: 'ngdialog-theme-default dialogwidth80p',
        scope: $scope,
        controller: 'TechnicalSpecCtrl',
        closeByDocument: false
      });
    };

    $scope.changeVisibility = function(comment) {
      comment.show_tech = !comment.show_tech;
      var newComment = new Comment();
      newComment.show_tech = comment.show_tech;
      newComment.$update({
        id: comment.id
      }, function(data) {}, function(error) {});
    }

  }
]);
