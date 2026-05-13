Lantern.controller('RequestDetailCtrl', ['$rootScope', '$scope', '$q', '$filter', '$cookies', '$location', '$stateParams', '$anchorScroll', 'ngDialog',
  'Record', 'Request', 'Product', 'MediaItems', 'RequestGroup', 'Comment', 'Attachments', 'User', 'Group', 'Client', 'Workflow',
  'FileUploader', '$window', 'Reportvi', 'Return', 'NotificationService', 'Notification', 'Session', '$timeout', '$state', 
  'RequestService', 'ReturnService', 'PersonsService', 'WorkflowHelperService','ValueListService', 'ClientService', 'Qc', '$http', 'RoomService',
  function ($rootScope, $scope, $q, $filter, $cookies, $location, $stateParams, $anchorScroll, ngDialog,
    Record, Request, Product, MediaItems, RequestGroup, Comment, Attachments, User, Group, Client, Workflow,
    FileUploader, $window, Reportvi, Return, NotificationService, Notification, Session, $timeout, $state, 
    RequestService, ReturnService, PersonsService, WorkflowHelperService, ValueListService, ClientService, Qc, $http, RoomService) {
    // page associée: app/views/production/requestDetail.html
    $scope.HourOptions = getHourOptions($rootScope.user_entity.person.branch_id)
    $scope.transformHourInI18nFormat = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)
    RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
    
    ClientService.getClients({}, function() {
      $scope.clients = $rootScope.clientsLight
    }, ClientService.manageClientError)
    PersonsService.getTechnicians(function (result) {
    }, PersonsService.manageTechniciansError)

    $scope.options = {
      'startingDay': 1,
      'initDate': new Date()
    }
    $timeout(function() {
      $scope.getPresetTimes = presetTimeBase(Session.branchId())
      $scope.method = new Request();
      $scope.uploader = [];
      $scope.dt;
      $scope.pj = [];
      $scope.selectedDates = [];
      $scope.originalDates = [];
      $scope.dateStartEnd = [];

      $scope.allDates = {
        day: null,
        start_time_h: null,
        start_time_m: null,
        end_time_h: null,
        end_time_m: null
      };

      $scope.isShowDatesDetails = true;
      $scope.showDatesDetails = function() {
        $scope.isShowDatesDetails = !$scope.isShowDatesDetails;
      }

      $scope.isDayPlanned = function(date) {
        let isPlanned = false;
        angular.forEach($scope.originalDates, function(originalDate) {
          if (originalDate.is_farmer && originalDate.day == date.day) {
            isPlanned = true;
            date.start_time_h = originalDate.start_time_h;
            date.start_time_m = originalDate.start_time_m;
            date.end_time_h = originalDate.end_time_h;
            date.end_time_m = originalDate.end_time_m;
          }
        });
        return isPlanned;
      }

      Return.getReturnActions({}, function(actions) {
        $scope.actions = actions
      })

      $scope.isDifferentWeek = function(date, previousDate) {
        return moment(date).format("w") != moment(previousDate).format("w");
      }

      $scope.changeDay = function(dt) {
        let day = moment(dt).format("YYYY-MM-DD HH:mm:ss");
        let dates = $filter('filter')($scope.dateStartEnd, {
          'day': day
        }, true);
        if (dates.length > 0) {
          let index = $scope.dateStartEnd.indexOf(dates[0]);
          $scope.dateStartEnd.splice(index, 1);
        } else {
          let data = {
            day: day,
            start_time_h: $scope.allDates.start_time_h,
            start_time_m: $scope.allDates.start_time_m,
            end_time_h: $scope.allDates.end_time_h,
            end_time_m: $scope.allDates.end_time_m,
            is_wish: true
          };
          $scope.dateStartEnd.push(data);
        }
      }

      $scope.setTime = function(date, preset) {      
        if (!$scope.isDayPlanned(date)) {
          setTimeDateWishByBranch(Session.branchId(), date, preset)
        }
        if (date.day == null) {
          $scope.setAllTimes(0);
        }
      }

      $scope.setAllTimes = function(i) {
        angular.forEach($scope.dateStartEnd, function(date) {
          if (!$scope.isDayPlanned(date)) {
            if (i == 1) {
              date.start_time_h = $scope.allDates.start_time_h;
            } else if (i == 2) {
              date.start_time_m = $scope.allDates.start_time_m;
            } else if (i == 3) {
              date.end_time_h = $scope.allDates.end_time_h;
            } else if (i == 4) {
              date.end_time_m = $scope.allDates.end_time_m;
            } else {
              date.start_time_h = $scope.allDates.start_time_h;
              date.start_time_m = $scope.allDates.start_time_m;
              date.end_time_h = $scope.allDates.end_time_h;
              date.end_time_m = $scope.allDates.end_time_m;
            }
          }
        });
      }

      $scope.role = Session.role();

      let simplemde = new SimpleMDE({
        autoDownloadFontAwesome: false,
        toolbar: ["bold", "italic", "strikethrough", "|", "heading-1", "heading-2", "heading-3", "|", "quote", "unordered-list", "ordered-list", "table", "horizontal-rule", "|", "guide"],
        spellChecker: false,
        status: false,
        placeholder: $rootScope._T['wa7kjuc5'],
        element: document.getElementById("infoForTech")
      });


      let toolbar = document.getElementsByClassName("editor-toolbar")[0];
      toolbar.style.display = "none";

      $scope.showEditInfoForTech = function() {
        if ($scope.mainRequest.info_for_tech == null || $scope.mainRequest.info_for_tech == "") {
          simplemde.value("");
        }
        $scope.showPanelInfoTech = 1;
        simplemde.togglePreview();
        toolbar.style.display = "";
      }

      $scope.showActivityLog = false
      $scope.changeShowActivity = function(show) {
        $scope.showActivityLog = show
      }

      $scope.url_api = URL_API;

      PersonsService.getArtisticDirectors(function(artisticDirectors) {
        $scope.artisticDirectors = artisticDirectors;
      });

      $scope.isShowSaveDirector = false;
      $scope.showSaveDirector = function() {
        $scope.isShowSaveDirector = true;
      }

      $scope.removeFromSelected = function(dt) {
        $scope.selectedDates.splice($scope.selectedDates.indexOf(dt), 1);
      }

      $scope.saveDesiredTime = function () {

        let objectDates = RequestService.setNewDesiredDate($scope.dateStartEnd, $scope.originalDates)
        if (objectDates.datesChanged) {
          let requestPromises = []
          requestPromises.push(RequestService.updateRequestDefer($scope.mainRequest.id, objectDates.requestData));

          $q.all(requestPromises).then(function(requestPromises) {
              RequestService.regroupDefer($scope.mainRequest.id);

              let services = "planning";
              // en enregistre les logs uniquement pour les planning auditorium
                if($scope.mainRequest.planning_id == "auditorium"){
                  let ObjectParams = {
                                planning_service: $scope.mainRequest.planning_id, // "auditorium"
                                client_id: $scope.mainRequest.product.subproject.project.client_id,
                                request_id: $scope.mainRequest.id,
                                user_id: Session.userId(),
                                project_id: $scope.mainRequest.project,
                                subproject: $scope.mainRequest.subproject,
                                product_id: $scope.mainRequest.product_id,
                                etape_id: $scope.mainRequest.etape_type_id,
                                action_id: $scope.mainRequest.action_type_id,
                                date_added: null,
                                date_removed: null,
                                type_product: $scope.mainRequest.product.description_id,
                                type_operation: null
                            };
                  // Verifier et enregistrer les logs
                  RequestService.checkIsPlanningAlert(objectDates,ObjectParams);
                }

              sendStandardNotif(new NotificationService(), [$scope.mainRequest], services, "Mise à jour des dates souhaitées", objectDates.descNotif, $filter, "date_wishes", $rootScope);
              Notification.success($rootScope._T["kl3bkk56"]);
              $state.reload();
          }, function (error) {
              Notification.error($rootScope._T["8onuneco"]);
          });
        }
      }

      function loadMainRequest(request) {
        $scope.mainRequest = request;
        $scope.keyGroup = getKeyGroup(request)

        $scope.hashRequest = getHashRequest(request)

        if (request.product.subproject.nature.name == "serie") {
          request.product.description = 'Épisode ' + request.product.episode_number;
        } else if (request.product.subproject.nature.name != "serie" && request.product.subproject.nature.name == "film") {
          request.product.description = request.product.description.value;
        } else {
          request.product.description = request.product.description_text;
        }


        if (request.parent_request_id != null) {
          $scope.parent_request = Request.get({
            requestId: request.parent_request_id
          });
        }

        $scope.mainRequest.ownReturn.forEach(function(aReturn) {
          Return.get({
            id: aReturn.id
          }, function(updateReturn) {
            aReturn.ownComment = updateReturn.ownComment;
          });
        });

        var itemsElements = [];

        if (request.media_items != null) {
          var itemsArray = request.media_items;
          itemsArray.forEach(function(item) {
            if (item != "") {
              var newItem = MediaItems.get({
                itemId: item
              }, function(i) {
                if (i.reference == 1) {
                  i.reference = true;
                } else {
                  i.reference = false;
                }
              });
              newItem.is_selected;
              itemsElements.push(newItem);
            }

          });
        }

        request.itemsInRequest = itemsElements;

        request.mediaItems = MediaItems.findbyproduct({
          product_id: request.product.id
        }, function(items) {
          request.mediaItems.forEach(function(item) {
            $scope.mainRequest.itemsInRequest.forEach(function(itemReq) {
              if (itemReq.id == item.id) {
                item.is_selected = 1;
              }
            });
          });
        });


        $scope.workflow = Workflow.get({
          workflowId: $scope.mainRequest.workflow_id
        }, function(workflow) {
          workflow.color = colorizeWorkflow(workflow);
          workflow.description = WorkflowHelperService.describeWorkflow(workflow);

          $scope.techspec_id = null;
          if (workflow.ownStepslist[0] != null) {
            angular.forEach(workflow.ownStepslist[0].ownStep, function(step) {
              if (step.action_type_id == request.action_type_id) {
                $scope.techspec_id = step.techspec_id;
              }
            });
          }
        });

        $scope.mainRequest.show_comments = true;

        if ($scope.mainRequest.tech_writer_id != null || $scope.mainRequest.action_type.planning == "volume") {
          $scope.show_tech = true
        } else {
          $scope.show_tech = false
        }

        Qc.getQcInfosByWorkflow({
          product_id: $scope.mainRequest.product_id,
          workflow_id: $scope.mainRequest.workflow_id,
        },function(qcs_export){
          $scope.qcs_export = qcs_export
        })

        function downloadLink( name, data, blobType, revoke ) {
          let blob = new Blob([data], { type: blobType});
          let url = URL.createObjectURL(blob);
          let a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.append(a);
          a.click();
          a.remove()
          if(revoke) {
            URL.revokeObjectURL(url);
          }
        }

        $scope.exportQC = function(nb_qc){
          var types_of_qc_to_export = []
          for(var i=0; i<=nb_qc; i++){
            if(document.getElementById("qcExport_"+i) != undefined && document.getElementById("qcExport_"+i) != null && document.getElementById("qcExport_"+i).checked == true){
              types_of_qc_to_export.push(document.getElementById("qcExport_"+i).name)
            }
          }
          Qc.getQcInfosByWorkflow({
            product_id: $scope.mainRequest.product.id,
            workflow_id: $scope.mainRequest.workflow.id
          }, function(qcsStatus){
            var product =$scope.mainRequest.product
            var workflow =$scope.mainRequest.workflow
              $scope.exportFunction(product, workflow, types_of_qc_to_export, qcsStatus);
              return false;
          })
        }

        let workflowLanguages
        let workflowTypeDoublages
        $scope.exportFunction = function (product, workflow, types_of_qc_to_export, qcsStatus){
          Return.getWorkflowLanguage({}, function(wl){
            workflowLanguages = wl
            Return.getWorkflowTypeDoublage({}, function(wtd){
              workflowTypeDoublages = wtd
              let project_name = product.subproject.project.name
              let subproject_name
              let product_name
              if(product.subproject.nature.name == "serie"){
                subproject_name = "Saison" + "_" + product.subproject.season
                product_name = "Episode"  + "_" + product.episode_number
              }else if(product.subproject.nature.name == "film"){
                subproject_name = "Film"
                product_name = product.description.value
              }else{
                subproject_name = "Saison" + "_" + product.subproject.season
                product_name = "Episode"  + "_" + product.episode_number
              }
              
              let language = $scope.mainRequest.workflow.language.value
              let type_doublage = $scope.mainRequest.workflow.doublage_type.value
              angular.forEach(workflowLanguages, function(workflowLanguage) {
                if(language == workflowLanguage.value){
                  language = workflowLanguage.qc_export_value
                }
              })
              angular.forEach(workflowTypeDoublages, function(workflowTypeDoublage) {
                if(type_doublage == workflowTypeDoublage.value){
                  type_doublage = workflowTypeDoublage.qc_export_value
                }
              })

              angular.forEach(types_of_qc_to_export, function(value, index) {
                let payload ={
                  product_id: product.id,
                  workflow_id: workflow.id,
                  types_of_qc_to_export: value,
                  qcsStatus: [qcsStatus[index]]
                }
                $http.post(URL_API + '/returns/qcinfos/qcexport', payload,{ responseType: 'arraybuffer' }).then(function (response) {
                  let filename = project_name + "_"+subproject_name + "_" + product_name + "_"+language + "_" + type_doublage + "_" + value + ".xls"
                    downloadLink(filename.replace(" ", "_"), response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true)
                })
                .catch(function (error) {
                  console.error('Error:', error);
                });
              })
            })
          })
        }


        angular.forEach($scope.mainRequest.ownFarmerbookings, function(farmer) {
          let date = {
            day: farmer.day,
            start_time: farmer.start_time,
            i18n_start_time: farmer.start_time,
            end_time: farmer.end_time,
            start_time_h: farmer.start_time ? parseInt(farmer.start_time.split('h')[0]) : null,
            start_time_m: farmer.start_time ? parseInt(farmer.start_time.split('h')[1]) : null,
            end_time_h: farmer.end_time ? parseInt(farmer.end_time.split('h')[0]) : null,
            end_time_m: farmer.end_time ? parseInt(farmer.end_time.split('h')[1]) : null,
            is_wish: farmer.is_wish ? parseInt(farmer.is_wish) : null,
            is_farmer: farmer.booking_id != null,
            vu: false
          }
          $scope.originalDates.push(date);
          if (farmer.is_wish == 1) {
            let timestamp = moment(farmer.day).format('x');
            $scope.selectedDates.push(parseInt(timestamp));
            let data = {
              day: farmer.day,
              start_time_h: farmer.start_time ? parseInt(farmer.start_time.split('h')[0]) : null,
              start_time_m: farmer.start_time ? parseInt(farmer.start_time.split('h')[1]) : null,
              end_time_h: farmer.end_time ? parseInt(farmer.end_time.split('h')[0]) : null,
              end_time_m: farmer.end_time ? parseInt(farmer.end_time.split('h')[1]) : null,
              is_wish: true
            };
            $scope.dateStartEnd.push(data);
          }
          farmer.description = ""
          if (farmer.tech_writer_id != null) {
            let writer = ''
            if ($rootScope.lanternTechniciansById && $rootScope.lanternTechniciansById[farmer.tech_writer_id]) {
              writer = $rootScope.lanternTechniciansById[farmer.tech_writer_id].firstname + ' ' + $rootScope.lanternTechniciansById[farmer.tech_writer_id].lastname
            }
            farmer.description += '<span class="glyphicon glyphicon-cog"></span> writer : ' + writer + '<br>'
          }
          if (farmer.tech_reader_id != null) {
            let reader = ''
            if ($rootScope.lanternTechniciansById && $rootScope.lanternTechniciansById[farmer.tech_reader_id]) {
              reader = $rootScope.lanternTechniciansById[farmer.tech_reader_id].firstname + ' ' + $rootScope.lanternTechniciansById[farmer.tech_reader_id].lastname
            }
            farmer.description += '<span class="glyphicon glyphicon-record"></span> reader : ' + reader + '<br>'
          }
          if (farmer.tech_editor_id != null) {
            let editor = ''
            if ($rootScope.lanternTechniciansById && $rootScope.lanternTechniciansById[farmer.tech_editor_id]) {
              editor = $rootScope.lanternTechniciansById[farmer.tech_editor_id].firstname + ' ' + $rootScope.lanternTechniciansById[farmer.tech_editor_id].lastname
            }
            farmer.description += '<span class="glyphicon glyphicon-film"></span> editor : ' + editor + '<br>'
          }
          // affichage du directeur artistique, doit rechercher le champ artistic_director_id et associer la personne correspondante
          // le directeur n'est pas souvent présent, dans ce cas on prend celui qui est indiqué dans la requets associée
          if (farmer.artistic_director_id != null && $rootScope.directors && $rootScope.directors[farmer.artistic_director_id]) {
            farmer.artistic_director = $rootScope.directors[$scope.mainRequest.product.subproject.artistic_director_id]
            const da = $rootScope.directors[farmer.artistic_director_id].firstname + ' ' + $rootScope.directors[farmer.artistic_director_id].lastname
            farmer.description += '<span class="glyphicon glyphicon-bullhorn"></span> ' + $rootScope._T['kup2m5xn'] + ' : ' + da
          } else {
            if ($rootScope.directors && $rootScope.directors[$scope.mainRequest.product.subproject.artistic_director_id]) {
              farmer.artistic_director = $rootScope.directors[$scope.mainRequest.product.subproject.artistic_director_id]
              const da = $rootScope.directors[$scope.mainRequest.product.subproject.artistic_director_id].firstname + ' ' + $rootScope.directors[$scope.mainRequest.product.subproject.artistic_director_id].lastname
              farmer.description += '<span class="glyphicon glyphicon-bullhorn"></span> ' + $rootScope._T['kup2m5xn'] + ' : ' + da
            }
          }
          if (farmer.stage_manager_id != null) {
            farmer.stage_manager = $rootScope.stageManagersById[farmer.stage_manager_id]
          }

          if (farmer.description == "") {
            farmer.description = $rootScope._T['cjm0dy4g']
          }
        })

        if ($scope.mainRequest.info_for_tech != null && $scope.mainRequest.info_for_tech != "") {
          simplemde.value($scope.mainRequest.info_for_tech);
        } else {
          simplemde.value($rootScope._T['wa7kjuc5']);
        }
        simplemde.togglePreview();

      }



    // see just below, ids come from table getReturnsSelected
    const actionsOnReturns = {
      1: ReturnService.doNothing,
      2: ReturnService.doNothing,
      3: ReturnService.doNothing,
      4: ReturnService.doNothing,
      5: ReturnService.doNothing,
      6: ReturnService.doNothing,
      7: ReturnService.notDone,
      8: ReturnService.toReview,
      9: ReturnService.toMix,
      10: ReturnService.doResolve
    }


    $scope.actionClick = function(action_id, returns, massive) {
      if (massive) {
        returns = $scope.getReturnsSelected(returns);
      }
      returns.forEach((areturn) => {
        if (areturn.action_id && areturn.action_id == action_id) {
          areturn.action_id = null
          areturn.is_ignored = true
        } else {
          areturn.action_id = action_id
          areturn.is_ignored = false
        }
      })
      
      actionsOnReturns[action_id](returns, action_id)
      Notification.success($rootScope._T["j2tnm5pu"]);
    }

      if ($stateParams.idGroup != null) {
        //Si c'est un groupe
        $scope.is_group = true;
        RequestGroup.get({
          id: $stateParams.idGroup
        }, function(data) {
          data.requests.forEach(function(d) {

            $scope.uploader[d.id] = new FileUploader();
            $scope.uploader[d.id].url = URL_API + "/attachments";
            $scope.uploader[d.id].headers = {
              'auth-token': $.cookie('token'),
              'app-code': Session.appCode(),
              'branch': $rootScope.user_entity.person.branch_id
            }
            $scope.uploader[d.id].autoUpload = true;
            $scope.uploader[d.id].onBeforeUploadItem = function(item) {
              item.formData.push({
                request_id: d.id
              });
            };
            $scope.uploader[d.id].onSuccessItem = function(item, response, status, headers) {
              item.formData[0] = {
                request_id: d.id,
                id: response.id,
                path: response.path
              };
            };

            Attachments.byRequestId({
              request_id: d.id
            }, function(a) {
              d.pj = a.length;
              a.forEach(function(item) {
                var file = new FileUploader.FileItem($scope.uploader[d.id], {
                  lastModifiedDate: new Date(),
                  name: item.original_name,
                  size: item.filesize
                });

                file.formData.push({
                  id: item.id,
                  path: item.path
                });
                file.progress = 100;
                file.isUploaded = true;
                file.isSuccess = true;

                $scope.uploader[d.id].queue.push(file);
              })
            });

            var filterReport = [{
              "name": "request_id",
              "value": d.id
            }];
            Reportvi.getReportVisBy({
              filters: [filterReport]
            }, function(reports) {
              d.report = reports[0];
            });

          });

          $scope.requests = data.requests;
          loadMainRequest(data.requests[0]);

          //Calcul de l'ID Farmer
          var farmerIds = [];
          data.requests.forEach(function(request) {
            farmerIds.push(request.farmer_id);
          });
          $scope.farmerGroupId = farmerIds.join(",");
        });
      } else {
        Request.get({
          requestId: $stateParams.id
        }, function(data) {
          $scope.uploader[data.id] = new FileUploader();
          $scope.uploader[data.id].url = URL_API + "/attachments";
          $scope.uploader[data.id].headers = {
            'auth-token': $.cookie('token'),
            'app-code': Session.appCode(),
            'branch': $rootScope.user_entity.person.branch_id
          }
          $scope.uploader[data.id].autoUpload = true;
          $scope.uploader[data.id].onBeforeUploadItem = function(item) {
            item.formData.push({
              request_id: data.id
            });
          };
          $scope.uploader[data.id].onSuccessItem = function(item, response, status, headers) {
            item.formData[0] = {
              request_id: data.id,
              id: response.id,
              path: response.path
            };
          };
          Attachments.byRequestId({
            request_id: data.id
          }, function(a) {
            data.pj = a.length;
            a.forEach(function(item) {
              var file = new FileUploader.FileItem($scope.uploader[data.id], {
                lastModifiedDate: new Date(),
                name: item.original_name,
                size: item.filesize
              });

              file.formData.push({
                id: item.id,
                path: item.path
              });
              file.progress = 100;
              file.isUploaded = true;
              file.isSuccess = true;

              $scope.uploader[data.id].queue.push(file);
            })
          });

          var filterReport = [{
            "name": "request_id",
            "value": data.id
          }];
          Reportvi.getReportVisBy({
            filters: [filterReport]
          }, function(reports) {
            if (reports[0] != null) {
              data.report = reports[0];
              data.report.bobines = {}
              data.report.bobines['Bobine 1'] = []
              angular.forEach(data.report.ownRapportviobservation, function(ob) {
                if (data.report.bobines['Bobine ' + ob.bobine] == null) {
                  data.report.bobines['Bobine ' + ob.bobine] = []
                }
                data.report.bobines['Bobine ' + ob.bobine].push(ob)
              })
              delete data.report.ownRapportviobservation
            }
          });

          $scope.requests = new Array(data);
          loadMainRequest(data);
        });
      }

      $scope.remove = function(item) {
        swal({
            title: $rootScope._T["9lpfa1ln"],
            text: $rootScope._T["8csqh78u"],
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: $rootScope._T["mnlbxblr"],
            closeOnConfirm: false
          },
          function() {
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

      $scope.download = function(item) {
        $window.open(URL_API + "/attachments/download/" + item.formData[0].id + "?filesize=" + item.file.size + "&token=" + $.cookie('token'), '_blank');
      };

      $scope.switchMainRequest = function(request) {
        loadMainRequest(request);
        $scope.show = false;
      };

      $scope.addCommentOnReturn = function(aReturn) {
        var newComment = new Comment();
        newComment.text = aReturn.newComment;
        newComment.user_id = $.cookie('user_id');
        newComment.return_id = aReturn.id;
        newComment.context = $rootScope._T['x04yv9b9']
        if (aReturn.newComment !== undefined) {
          newComment.$save(function() {
            aReturn.newComment = "";
            Return.get({
              id: aReturn.id
            }, function(updateReturn) {
              aReturn.ownComment = updateReturn.ownComment;
            });

          });
        }
      };

      $scope.doNothing = function(returns, massive) {
        ReturnService.doNothing(returns);
      };

      $scope.doResolve = function(returns, massive) {
        ReturnService.doResolve(returns);
      };

      $scope.toMix = function(returns, massive) {
        ReturnService.toMix(returns);
      };

      $scope.notDone = function(returns, massive) {
        ReturnService.notDone(returns);
      };

      $scope.toReview = function(returns, massive) {
        ReturnService.toReview(returns);
      };

      $scope.loadMediaItemsFromProject = function(product) {
        $scope.mainRequest.mediaItems = MediaItems.findbyproject({
          project_id: $scope.mainRequest.product.subproject.project_id
        }, function() {
          $scope.mainRequest.mediaItems.forEach(function(item) {
            item.description = ""
            if (item.layout != null) {
              item.description += $rootScope._T["ca31bm2s"] + ' ' + item.layout + '<br>'
            }
            if (item.speed_reception != null) {
              item.description += $rootScope._T["yi2d087p"] + ' ' + item.speed_reception + '<br>'
            }
            if (item.speed != null) {
              item.description += $rootScope._T["6xbo3r3a"] + ' ' + item.speed + '<br>'
            }
            if (item.origin != null) {
              item.description += $rootScope._T["4l0gx715"] + ' ' + item.origin
            }
            $scope.mainRequest.itemsInRequest.forEach(function(itemReq) {
              if (itemReq.id == item.id) {
                item.is_selected = 1;
              }
            });
          });
          $scope.itemsFromProduct = false;
          $scope.itemsFromProject = true;
          $scope.titleForAdd = $rootScope._T["jx6t2g5u"];
          ngDialog.open({
            template: 'views/Dialog/AddElementsToRequestDialog.html',
            className: 'ngdialog-theme-demand dialogwidth80p',
            scope: $scope,
            closeByDocument: false
          });
        });
      }

      $scope.loadMediaItemsFromProduct = function(request) {
        request.mediaItems = MediaItems.findbyproduct({
          product_id: request.product.id
        }, function(items) {
          request.mediaItems.forEach(function(item) {
            item.description = ""
            if (item.layout != null) {
              item.description += $rootScope._T["ca31bm2s"] + ' ' + item.layout + '<br>'
            }
            if (item.speed_reception != null) {
              item.description += $rootScope._T["yi2d087p"] + ' ' + item.speed_reception + '<br>'
            }
            if (item.speed != null) {
              item.description += $rootScope._T["6xbo3r3a"] + ' ' + item.speed + '<br>'
            }
            if (item.origin != null) {
              item.description += $rootScope._T["4l0gx715"] + ' ' + item.origin
            }
            $scope.mainRequest.itemsInRequest.forEach(function(itemReq) {
              if (itemReq.id == item.id) {
                item.is_selected = 1;
              }
            });
          });

          $scope.itemsFromProduct = true;
          $scope.itemsFromProject = false;
          $scope.titleForAdd = $rootScope._T["py9j6dg5"];

          ngDialog.open({
            template: 'views/Dialog/AddElementsToRequestDialog.html',
            className: 'ngdialog-theme-demand dialogwidth80p',
            scope: $scope,
            closeByDocument: false
          });
        });
      }

      $scope.refreshMediaItems = function() {
        Request.get({
          requestId: $stateParams.id
        }, function(request) {
          var itemsElements = [];
          if (request.media_items != null) {

            var itemsArray = request.media_items;
            itemsArray.forEach(function(item) {
              var newItem = MediaItems.get({
                itemId: item
              });
              itemsElements.push(newItem);
            });
          }
          $scope.mainRequest.itemsInRequest = itemsElements;
        })
      }


      $scope.addMediaItem = function(mediaItem, request) {
        //Check non présent
        var check = $filter('filter')(request.itemsInRequest, {
          id: mediaItem.id
        }, true);
        if (check == null || check.length == 0) {
          request.itemsInRequest.push(mediaItem);

          //Mise à jour coté serveur
          var items = [];
          request.itemsInRequest.forEach(function(item) {
            items.push(item.id);
          });
          var updateRequest = new Request();
          updateRequest.media_items = items.toString();
          updateRequest.$update({
            requestId: request.id
          }, function() {
            mediaItem.is_selected = true
          });
        }
      };

      $scope.removeMediaItem = function(request, itemToDelete) {
        //Mise à jour coté serveur
        var items = [],
          newItems = [];
        request.itemsInRequest.forEach(function(item) {
          if (item.id != itemToDelete.id) {
            items.push(item.id);
            newItems.push(item);
          }
        });

        request.itemsInRequest = newItems

        var updateRequest = new Request();
        if (items.length == 0) {
          updateRequest.media_items = null;
        } else {
          updateRequest.media_items = items.toString();
        }
        updateRequest.media_items = items.toString();
        updateRequest.$update({
          requestId: request.id
        }, function() {
          itemToDelete.is_selected = false
        });
      };

      function isInProductForm(value) {
        var find = false;
        $scope.masteringProductForm.forEach(function(form) {

          form.forEach(function(product) {

            if (product.name === value) {
              find = true;
              return find;
            }
          })
        });
        return find;
      }

      $scope.doneEditing = function(value) {
        if (value == "info_for_tech") {
          $scope.mainRequest.info_for_tech = simplemde.value();
        }
        var updatedRequest = new Request();
        if ($scope.mainRequest.action_type.form != null) {
          if (isInProductForm(value)) {
            updatedRequest = new Request();
            var res = value.split("_");

            var variable = value.substring(0, value.length - (res[res.length - 1].length + 1));

            updatedRequest[variable] = $scope.method[value];

            updatedRequest.$update({
              requestId: res[res.length - 1]
            }, function(data) {
              Notification.success($rootScope._T["zv55k240"]);
              if (value == "artistic_director_id") {
                $scope.isShowSaveDirector = false;
              } else if (value == "info_for_tech") {
                simplemde.togglePreview();
                toolbar.style.display = "none";
                $scope.showPanelInfoTech = 0;
              }
            }, function(data) {
              Notification.error($rootScope._T["8onuneco"]);
              return "Error " + data.status + " : " + data.statusText;
            });

          } else {
            $scope.requests.forEach(function(request) {
              var updatedRequest = new Request();
              updatedRequest[value] = $scope.mainRequest[value];
              updatedRequest.$update({
                requestId: request.id
              }, function(data) {
                Notification.success($rootScope._T["zv55k240"]);
                if (value == "artistic_director_id") {
                  $scope.isShowSaveDirector = false;
                } else if (value == "info_for_tech") {
                  simplemde.togglePreview();
                  toolbar.style.display = "none";
                  $scope.showPanelInfoTech = 0;
                }
                //Mettre un indicateur d'update
              }, function(data) {
                Notification.error($rootScope._T["8onuneco"]);
                return "Error " + data.status + " : " + data.statusText;
              });
            })
          }
        } else {
          $scope.requests.forEach(function(request) {
            updatedRequest = new Request();
            updatedRequest[value] = $scope.mainRequest[value];
            updatedRequest.$update({
              requestId: request.id
            }, function(data) {
              Notification.success($rootScope._T["zv55k240"]);
              if (value == "artistic_director_id") {
                $scope.isShowSaveDirector = false;
              } else if (value == "info_for_tech") {
                simplemde.togglePreview();
                toolbar.style.display = "none";
                $scope.showPanelInfoTech = 0;
              }
              //Mettre un indicateur d'update
            }, function(data) {
              Notification.error($rootScope._T["8onuneco"]);
              return "Error " + data.status + " : " + data.statusText;
            });
          });
        }

        if (value == "info_for_planning") {
          //Envoi de la notif
          sendStandardNotif(
            new NotificationService(), [$scope.mainRequest],
            "planning",
            $rootScope._T['t116j8ff'],
            updatedRequest[value],
            $filter,
            "update", $rootScope
          );
        } else if (value == "important") {
          if ($scope.mainRequest.important) {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["pcodebge"])
          } else {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["is4aq9ar"])
          }
        }

      };

      $scope.doneEditingSingle = function(element, value, id) {
        var updatedRequest = new Request();
        updatedRequest[element] = value;
        updatedRequest.$update({
          requestId: id
        }, function(data) {
          //Mettre un indicateur d'update
          Notification.success($rootScope._T["zv55k240"]);
        }, function(data) {
          Notification.error($rootScope._T["8onuneco"]);
          return "Error " + data.status + " : " + data.statusText;
        });
      };

      $scope.editMediaItemReference = function(item) {
        var upItem = new MediaItems();
        upItem.reference = item.reference;
        upItem.$update({
          itemId: item.id
        });
      };

      $scope.updateObject = function(object, value) {

        if ($scope.mainRequest.ref_object == "recording") {
          var updatedRecord = new Record();
          updatedRecord[value] = object[value];
          updatedRecord.$update({
            recordId: object.id
          }, function(data) {
            //Mettre un indicateur d'update
            Notification.success($rootScope._T["zv55k240"]);
          }, function(data) {
            return "Error " + data.status + " : " + data.statusText;
          });
        } else if ($scope.mainRequest.ref_object == "editing") {
          var updatedEditing = new Editing();
          updatedEditing[value] = object[value];
          updatedEditing.$update({
            editingId: object.id
          }, function(data) {
            //Mettre un indicateur d'update
            Notification.success($rootScope._T["zv55k240"]);
          }, function(data) {
            Notification.error($rootScope._T["8onuneco"]);
            return "Error " + data.status + " : " + data.statusText;
          });
        } else if ($scope.mainRequest.ref_object == "mixing") {
          var updatedMixage = new Mixage();
          updatedMixage[value] = object[value];
          updatedMixage.$update({
            id: object.id
          }, function(data) {
            //Mettre un indicateur d'update
            Notification.success($rootScope._T["zv55k240"]);
          }, function(data) {
            Notification.error($rootScope._T["8onuneco"]);
            return "Error " + data.status + " : " + data.statusText;
          });
        }

      };

      $scope.showReceiveItems = function(product_id) {
        $scope.itemsForProductId = product_id;
        ngDialog.open({
          template: 'views/Dialog/ShowReceiveElements.html',
          className: 'ngdialog-theme-default dialogwidth800',
          scope: $scope,
          controller: 'ShowReceiveElementsCtrl',
          closeByDocument: false
        });
      };

      $scope.cancelRequest = function() {
        swal({
          title: $rootScope._T["8c3a2tuc"],
          text: $rootScope._T["uoftswh3"],
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: $rootScope._T["sizirlv7"],
          closeOnConfirm: false
        }, function() {
          var updateRequest = new Request()
          updateRequest.is_canceled = true
          updateRequest.is_done = true
          updateRequest.is_partial = false
          updateRequest.is_not_done = false
          updateRequest.is_sent_back = true
          updateRequest.$update({
            requestId: $scope.mainRequest.id
          }, function(request) {
            swal($rootScope._T["glo3vnp3"], $rootScope._T["r013lmzq"], "success");
            $scope.mainRequest.is_done = request.is_done
            $scope.mainRequest.is_partial = request.is_partial
            $scope.mainRequest.is_not_done = request.is_not_done
            $scope.mainRequest.is_canceled = request.is_canceled
            $scope.mainRequest.is_sent_back = request.is_sent_back

            newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["yp9tp27g"])

            var descNotif = $rootScope._T['8ou8izp2']

            var optNotif = "planning";
            if (request.tech_writer_id != null) {
              optNotif = "planning,technicien"
            }

            sendStandardNotif(
              new NotificationService(), [$scope.mainRequest],
              optNotif,
              $rootScope._T["yp9tp27g"],
              descNotif,
              $filter,
              "cancel", $rootScope
            );

          })
        });
      };

      $scope.PutOnHold = function(hold) {
        var updateRequest = new Request()
        updateRequest.on_hold = $scope.mainRequest.on_hold
        updateRequest.$update({
          requestId: $scope.mainRequest.id
        }, function(request) {
          //  $scope.mainRequest.on_hold = request.on_hold
          if (request.on_hold == 1) {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["sz8lmvdd"])
            var descNotif = $rootScope._T["sxwaeoub"];
            sendStandardNotif(
              new NotificationService(), [$scope.mainRequest],
              "planning",
              $rootScope._T["t0t3ypk6"],
              descNotif,
              $filter,
              "on_hold", $rootScope
            );
          } else {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["otp2f1m5"])
            var descNotif = $rootScope._T["9hu9te4y"];
            sendStandardNotif(
              new NotificationService(), [$scope.mainRequest],
              "planning",
              $rootScope._T["uutsizwg"],
              descNotif,
              $filter,
              "not_on_hold", $rootScope
            );
          }
          Notification.success(descNotif);


        })
      };


      /**
       * Section Mastering
       */
      $scope.getRequests = function() {
        var deferred = $q.defer();
        if ($scope.usersMastering != null) {
          deferred.resolve();
          return deferred.promise;
        }
        var users = User.query(function(users) {
          var formattedUsers = [];
          users.forEach(function(user) {
            var t = {
              "id": user.id,
              "name": user.firstname + ' ' + user.lastname
            };

            formattedUsers.push(t);
          });
          $scope.usersMastering = formattedUsers;
        });
        var groups = Group.query(function(groups) {
          var formattedGroups = [];
          groups.forEach(function(group) {
            var t = {
              "id": group.id,
              "name": group.name
            };

            formattedGroups.push(t);
          });
          $scope.groupsMastering = formattedGroups;
        });

        var groupsInternal = Group.internal(function(groups) {
          var formattedGroups = [];
          groups.forEach(function(group) {
            var t = {
              "id": group.id,
              "name": group.name
            };

            formattedGroups.push(t);
          });
          $scope.groupsInternalMastering = formattedGroups;
        });

        var clients = Client.query(function(clients) {
          var formattedClients = [];
          clients.forEach(function(client) {
            var t = {
              "id": client.id,
              "name": client.name
            };

            formattedClients.push(t);
          });
          $scope.clientsMastering = formattedClients;
        });

        $q.all([users.$promise, groups.$promise, clients.$promise, groupsInternal.$promise]).then(function() {
          deferred.resolve();
        });

        return deferred.promise;
      };


      function formSwitch(data, product) {
        var options = [];
        if (data.type.view == "ui-select-global" || data.type.view == "ui-select-multiple") {
          switch (data.type.api) {
            case "clients":
              options = $scope.clientsMastering;
              break;
            case "users":
              options = $scope.usersMastering;
              break;
            case "groups":
              options = $scope.groupsMastering;
              break;
            case "groupsInternal":
              options = $scope.groupsInternalMastering;
              break;
            case "options":
              options = data.type.options;
              break;
            default:
              break;
          }
        }
        if (product != null) {
          var variable = data.name.substring(0, data.name.length - (product.id.length + 1));
          $scope.method[data.name] = product[variable];

        } else {
          if (data.type.view != "ui-select-multiple") {
            $scope.method[data.name] = $scope.mainRequest[data.name];
          }
        }
        if (options == '' && data.type.options != null) {
          return data.type.options;
        }
        return options;
      }
      $scope.levels = [{
        value: 1,
        text: $rootScope._T["eyk4c9a4"]
      }, {
        value: 2,
        text: $rootScope._T["n4z3y60g"]
      }, {
        value: 3,
        text: $rootScope._T["darnvdy7"]
      }, {
        value: 4,
        text: $rootScope._T["3h268ovu"]
      }];
      $scope.varispeeds = ValueListService.getVarispeeds()
      
      $scope.point_montages = [{
        value: 1,
        text: $rootScope._T["ekhm2hvz"]
      }, {
        value: 2,
        text: $rootScope._T["qtzew2os"]
      }, {
        value: 3,
        text: $rootScope._T["p5kn7mny"]
      }];

      $scope.showSelect = function(scope, errorRow) {
        var selected = [];

        if (errorRow) {
          selected = $filter('filter')(scope, {
            value: errorRow
          });
        }

        return selected.length ? selected[0].text : $rootScope._T["0mzut3vy"];
      };

      $scope.showTechnicalSpecModal = function() {
        $scope.isProd = true;
        ngDialog.open({
          template: 'views/Dialog/TechnicianTechnicalSpecDialog.html',
          className: 'ngdialog-theme-default dialogwidth80p',
          scope: $scope,
          controller: 'TechnicalSpecCtrl',
          closeByDocument: false
        });
      };

      $scope.count = function(objects) {
        var count = 0
        angular.forEach(objects, function() {
          count++
        });
        return count
      }


      $scope.addCommentOnRequest = function(request, show_tech) {
        if (request.newComment != null && request.newComment != "") {
          var newComment = new Comment();
          newComment.text = request.newComment;
          newComment.user_id = $.cookie('user_id');
          newComment.request_id = request.id;
          newComment.show_tech = show_tech

          newComment.$save(function() {
            request.newComment = "";
            Request.get({
              requestId: request.id
            }, function(updateRequest) {
              request.ownComment = updateRequest.ownComment;

              var allComments = [];
              request.ownComment.forEach(function(comment) {
                var formatedString = "";
                formatedString += "<i>" + comment.user.firstname + " " + comment.user.lastname + "</i>";
                formatedString += " - (" + comment.date_creation + ")";
                formatedString += " : " + comment.text;
                allComments.push(formatedString);
              });

              var descNotif = newComment.text;

              sendStandardNotif(
                new NotificationService(), [$scope.mainRequest],
                "planning,production",
                $rootScope._T['8m4tsidm'],
                descNotif,
                $filter,
                "comment", $rootScope
              );

              //Envoi d'une notif au technicien s'il est concerné
              if (show_tech && request.is_validated_for_tech == 1) {
                var descNotifTech = newComment.text;

                sendStandardNotif(
                  new NotificationService(), [$scope.mainRequest],
                  "technicien",
                  $rootScope._T['8m4tsidm'],
                  descNotifTech,
                  $filter,
                  "comment", $rootScope
                );
              }

            });

          });
        }
      };

      $scope.expandActivityLog = function() {
        var dialog = ngDialog.open({
          className: 'ngdialog-theme-default dialogwidth80p',
          template: 'views/Dialog/ActivityLogDialog.html',
          scope: $scope,
          closeByDocument: false
        });
      }

      $scope.setImportant = function() {
        if ($scope.mainRequest.important == 0 || $scope.mainRequest.important == false) {
          $scope.mainRequest.important = 1;
        } else {
          $scope.mainRequest.important = 0;
        }
      }

      var body = document.body,
        html = document.documentElement;

      $scope.height = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight) - 200;


      $scope.autoTakeRequest = function() {
      Request.get({
        requestId: $scope.mainRequest.id
      }, function(req) {
        if ($scope.user_id != null) {
          var newRequest = new Request();
          newRequest.is_planned = true;
          newRequest.is_validated_for_tech = true;
          newRequest.date_send_tech = todaySQL;
          newRequest.planification_date = todaySQL;
          newRequest.tech_writer_id = $scope.user_id;
          newRequest.$update({
            requestId: $scope.mainRequest.id
          }, function() {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["aqychsu5"])
              //alert('Demande planifiée...');
              //window.location.href = "#/requestsAutoTech";
            $location.path('/requestsTech/' + $scope.mainRequest.id);
          });
        } else {
          console.log("Error : tech id not set");
        }
      });
      };

    $scope.refreshFarmer = function(farmer_id) {
      Request.farmerUpdate({
        actionId: farmer_id
      }, function() {
        $state.reload();
      });
    }

    $scope.showCopyToast = function() {
      Notification.success($rootScope._T["e14fp8p9"]);
    }


     $scope.planRequest = function(farmer) {
      Request.get({
        requestId: $scope.mainRequest.id
      }, function(req) {
        if (req.is_planned == 1) {
          swal({
              title: $rootScope._T["tgcnytpo"],
              text: $rootScope._T["ua10kyhu"],
              type: "error",
              showCancelButton: false,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "OK",
              closeOnConfirm: true
            },
            function() {
              $state.reload();
            });

        } else {
          //Check si l'ID a bien été mis dans Farmer
          if ($scope.mainRequest.action_type.planning == 'farmer') {
            Farmer.checkFarmer({
              farmer_id: $scope.mainRequest.farmer_id
            }, function(check) {
              if (check.result == "success") {
                planRequestAction();
              } else {
                swal({
                  title: $rootScope._T["tgcnytpo"],
                  text: $rootScope._T["io959mt2"],
                  type: "error",
                  showCancelButton: false,
                  confirmButtonColor: "#DD6B55",
                  confirmButtonText: $rootScope._T["r2vheniw"],
                  closeOnConfirm: true
                });
              }
            });
          } else {
            planRequestAction();
          }
        }
      });
    };

    function planRequestAction() {
      if ($scope.is_group) {
        var count = 0;
        var total = $scope.requests.length;

        $scope.requests.forEach(function(request) {
          var newRequest = new Request();
          newRequest.is_planned = true;
          newRequest.planification_date = todaySQL;
          newRequest.is_done = 0
          newRequest.is_not_done = 0
          newRequest.is_in_progress = 0
          newRequest.is_sent_back = 0
          newRequest.$update({
            requestId: request.id
          }, function(request) {
            //alert('Demande planifiée...');
            $scope.notifPlanFarmer(request);
            count++;
            if (count == total) {
              $state.reload();
            }
          });
        });
      } else {
        var newRequest = new Request();
        newRequest.is_planned = true;
        newRequest.is_done = 0
        newRequest.is_not_done = 0
        newRequest.is_in_progress = 0
        newRequest.is_sent_back = 0
        newRequest.planification_date = todaySQL;
        newRequest.$update({
          requestId: $scope.mainRequest.id
        }, function(request) {
          //alert('Demande planifiée...');
          if ($scope.mainRequest.action_type.planning == 'farmer') {
            $scope.notifPlanFarmer(request);
          } else {
            $scope.notifPlanManual($scope.mainRequest['date_start'] + " " + $scope.mainRequest['date_start_time'], $scope.mainRequest['date_end'] + " " + $scope.mainRequest['date_end_time']);
          }

          $state.reload();
        });
      }
    }

    $scope.notifPlanFarmer = function() {
      Farmer.querybyrequestid({
        request_id: $scope.mainRequest.id
      }, function(farmers) {
        var date_start = null
        var date_end = null
        var audits = []
        angular.forEach(farmers, function(farmer) {
          if (date_start == null || date_start > farmer.day) {
            date_start = farmer.day
          }
          if (date_end == null || date_end < farmer.day) {
            date_end = farmer.day
          }
          if (farmer.audit != null && farmer.audit != "") {
            if (audits.indexOf(farmer.audit) == -1) {
              audits.push(farmer.audit)
            }
          }
        })

        var description = ""

        if (date_start != null) {
          description += "Du " + moment(date_start).format('DD/MM/YYYY')
          if (date_end != null) {
            description += " au " + moment(date_end).format('DD/MM/YYYY')
          }
          if (audits.length > 0) {
            angular.forEach(audits, function(audit) {
              description += ", " + audit
            })
          }
        }

        sendStandardNotif(
          new NotificationService(), [$scope.mainRequest],
          "production",
          $rootScope._T['60hibo7p'],
          description,
          $filter,
          "planification", $rootScope,
          getHashRequest($scope.mainRequest)
        );
      })

      newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["moan71y1"])
    }

     $scope.notifPlanManual = function(date_start, date_end) {
      sendStandardNotif(
        new NotificationService(), [$scope.mainRequest],
        "production",
        $rootScope._T["kxq3ttb9"],
        $rootScope._T['fs6442bb'] + date_start + $rootScope._T['68dba7lq'] + date_end,
        $filter,
        "planification", $rootScope,
        getHashRequest($scope.mainRequest)
      );

      newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["rmnadoyh"], date_start, date_end)
    }

    }, 10);

    $scope.changeRequestStatus = function (status) {
      RequestService.updateRequestStatus(status, $scope.mainRequest, function (request) {
        $scope.mainRequest.is_planned = request.is_planned
        $scope.mainRequest.is_done = request.is_done
        $scope.mainRequest.is_not_done = request.is_not_done
        $scope.mainRequest.is_sent_back = request.is_sent_back
        $scope.mainRequest.is_in_progress = request.is_in_progress
        $scope.mainRequest.is_finished = request.is_finished
        $scope.mainRequest.is_partial = request.is_partial
        $scope.mainRequest.is_validated_for_tech = request.is_validated_for_tech

        if (status == "unplanned") {
          var servicesToNotify = "production,planning";
          var role = Session.role();
          if ($rootScope.canDisplay(4)) {
            servicesToNotify = "production";
          }

          sendStandardNotif(
            new NotificationService(), [$scope.mainRequest],
            servicesToNotify,
            $rootScope._T["hribawnh"],
            $rootScope._T["fe285hfu"],
            $filter,
            "replanification", $rootScope
          );
        }
        Notification.success($rootScope._T["oxh2ore8"]);
      }, function (error) {
        Notification.error($rootScope._T["gznchsfg"] + " " + error);
      });
    }

    $scope.changeVisibility = function(comment) {
      comment.show_tech = !comment.show_tech;
      var newComment = new Comment();
      newComment.show_tech = comment.show_tech;
      newComment.$update({
        id: comment.id
      }, function(data) {
        Notification.success($rootScope._T["ard4p14f"]);
      }, function(error) {
        Notification.error($rootScope._T["l62pzlzk"]);
      });
    }

  }
]);
