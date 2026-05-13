Lantern.controller('RequestDetailTechnicienCtrl', ['$rootScope', '$scope', '$q', '$filter', '$cookies', '$state', '$stateParams', 'ngDialog',
  'Request', 'Observation', 'Return', 'Comment', 'MediaItems', 'RequestGroup', 'Farmer', 'Attachments', 'User', 'Group', 'Client', 'Workflow', 'FileUploader',
  '$window', 'NotificationService', 'Reportvi', 'ReportviObservation', '$location', 'Session', 'ReturnService', 'DynamicFormService', 'WorkflowHelperService',
  'ValueListService', 'ClientService', 'Qc', 'ContextualInfo', 'PhelixAlula', 'Notification', '$http', 'ProjectsService', 'SubProjectsService',
  function($rootScope, $scope, $q, $filter, $cookies, $state, $stateParams, ngDialog,
    Request, Observation, Return, Comment, MediaItems, RequestGroup, Farmer, Attachments, User, Group, Client, Workflow, FileUploader,
    $window, NotificationService, Reportvi, ReportviObservation, $location, Session, ReturnService, DynamicFormService, WorkflowHelperService,
    ValueListService, ClientService, Qc, ContextualInfo, PhelixAlula, Notification, $http, ProjectsService, SubProjectsService) {
    // accessible à partir de app/js/controllers/technicien/requestsValidatedListCtrl.js, vue technicien

    $scope.qc = {}
    $scope.return_button = false
    $scope.return_types = []
    $scope.qc_type = ""
    $scope.projectName = null
    $scope.channelsForSelect = []
    $scope.assetTypeForSelect = []
    $scope.audioLanguageForSelect = []
    $scope.categoryForSelect = []
    $scope.commentsForSelect = []
    $scope.configForSelect = []
    $scope.qcTypeForSelect = []
    $scope.severityForSelect = []
    $scope.waiveWeasonForSelect = []
    $scope.ti_failed
    $scope.techWriterInfos
    let typeOfQC

    // récupération des données générales, values et autres

    function waitForVariableDefined(callback) {
      if ($rootScope.user_entity && $rootScope.user_entity.person) {
        callback();
      } else {
        const unwatch = $rootScope.$watch('user_entity', function (newVal) {
          if (newVal) {
            unwatch(); // Stop watching once the variable is defined
            callback(newVal);
          }
        })
      }
    }
    let role = null
    function checkUserState () {
      waitForVariableDefined(function () {
        ClientService.getClients({}, function() {
          $scope.clients = $rootScope.clientsLight
        }, ClientService.manageClientError)
        role = Session.role();
    
        $scope.canDisplay = $rootScope.canDisplay
        $scope.branch_id = Session.branchId()
        $scope.uploader = []

        $scope.uploader[0] = new FileUploader();
        $scope.uploader[0].url = URL_API + "/returns/returnprotools.json/";
        $scope.uploader[0].headers = {
          'auth-token': $.cookie('token'),
          'app-code': Session.appCode(),
          'branch': $rootScope.user_entity.person.branch_id
        }
        $scope.uploader[0].autoUpload = true;
        Qc.getQcInfos({
        }, function(qcInfos) {
          $scope.qcInfos = qcInfos
          angular.forEach($scope.qcInfos.qc_values_channels, function(value) {
            $scope.channelsForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_asset_type, function(value) {
            $scope.assetTypeForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_audio_language, function(value) {
            $scope.audioLanguageForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_category, function(value) {
            $scope.categoryForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_comments, function(value) {
            $scope.commentsForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_config, function(value) {
            $scope.configForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_qc_type, function(value) {
            $scope.qcTypeForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_severity, function(value) {
            $scope.severityForSelect.push(value.name)
          })
          angular.forEach($scope.qcInfos.qc_values_waive_weason, function(value) {
            $scope.waiveWeasonForSelect.push(value.name)
          })
        })  

      });
    }

    checkUserState()

    $scope.typesCommentForSelect= []
    $scope.typesReturnForSelect = []
    Return.getReturnType({
    }, function(type_return) {
      $scope.return_types = type_return

      angular.forEach($scope.return_types.return_type_categorie, function(categorie) {
        $scope.typesCommentForSelect.push(categorie)
        $scope.typesReturnForSelect.push(categorie)
        
        angular.forEach($scope.return_types.return_type, function(type) {
          if (categorie.id == type.return_type_categorie_id) {
            let typeReturn = {};
            typeReturn.type = categorie.value;
            typeReturn.element = type.value;
            typeReturn.category = type.return_type_categorie_id;
            $scope.typesCommentForSelect.push(typeReturn);
          }
        })
      })
    })

    $scope.typesReturn = [{
      name: $rootScope._T["7s4ix0jn"],
      elements: [
        "VO - VI",
        $rootScope._T["jbvlkr9w"],
        $rootScope._T["dvkj94dz"],
        $rootScope._T["eyhrixk4"],
        "Rytmo"
      ]
    }, {
      name: $rootScope._T["clnzm01e"],
      elements: [
        "VO",
        "VI",
        "Enr",
        $rootScope._T["dvkj94dz"],
        "Rytmo"
      ]
    }, {
      name: $rootScope._T["qu38uxv9"],
      elements: [
        $rootScope._T["s2vv4f07"],
        $rootScope._T["m7n25p45"],
        $rootScope._T["mech9o5r"]
      ]
    }, {
      name: "Mix",
      elements: [
        $rootScope._T["hovn3kic"],
        $rootScope._T["9yonx6b0"],
        $rootScope._T["7fk2i32j"],
        $rootScope._T["lj14q27u"],
        $rootScope._T["3c36t67o"],
        $rootScope._T["iunpaxq3"],
        $rootScope._T["u55dytio"]
      ]
    }];

    $scope.supports = ValueListService.getDigiMediaSupports()

    $scope.speeds = ValueListService.getSpeeds()

    // pas ou plus utilisé
    $scope.lol = ValueListService.getSpeeds()

    $scope.layouts = ValueListService.getVarispeeds()    

    const qcItemsConcerned = {
      fabric_qc_atmos: true, 
      fabric_qc_5_1: true, 
      fabric_qc_20: true
    }
    

    $scope.canAddQCReturn = function () {
      if ($scope.mainRequest && $scope.mainRequest.action_type && qcItemsConcerned[$scope.mainRequest.action_type.name]) {
        return true
      }
      return false
    }

    const qcItemsExportConcerned = {
      fabric_safety_standard: true, 
      fabric_Package_PDS: true
    }

    $scope.canExportQC = function () {
      if ($scope.mainRequest && $scope.mainRequest.action_type && qcItemsExportConcerned[$scope.mainRequest.action_type.name]) {
        return true
      }
      return false
    }

    // fin récupération des values

    let dynamicForm = DynamicFormService.getFormData();

    $scope.role = role;
    $scope.url_api = URL_API;

    $scope.check_user_id = $.cookie('user_id');

    $scope.method = new Request();
    $scope.observationRows = [];

    $scope.showAddNewElements = false

    $scope.showAddNewElementsFn = function() {
      $scope.showAddNewElements = true
    }

    $scope.canActiveComments = false
    $scope.selectReturnType = function (ti, $select) {
      ti.return_element_type = { element: $select.selected.value, type: '' }
      $scope.canActiveComments = true
    }
    $scope.canEnableComment = function () {
      if ($scope.canActiveComments) {
        return false
      }
      return true
    }

    $scope.lastTypeElement = null;
    $scope.saveLastTypeElement = function(type_element) {
      $scope.canActiveComments = true
      $scope.lastTypeElement = type_element;
    }

    function returnIsQc(request) {
      return ["QC 5.1", "QC Atmos", "QC 20"].includes(request.origin)
    }

    // debut et fin de programme pour calculer le TRT, la dernière valeur est un nombre d'images
    // fomart hh:mm:ss:ii où ii est sur 2 chiffres
    function timecodeDiff(tc1, tc2) {
      let tc1array = tc1.toString().match(/(\d{2})/g)
      let tc2array = tc2.toString().match(/(\d{2})/g)
      const tc1nbImage = tc1array.pop()
      const tc2nbImage = tc2array.pop()

      let tc1Time = tc1array.join(':')
      let tc2Time = tc2array.join(':')
      const t1 = new Date('1970-01-01 ' + tc1Time)
      const t2 = new Date('1970-01-01 ' + tc2Time)
      const diffMinute = t2 - t1;
      let ss = pad(Math.floor(diffMinute / 1000) % 60, 2, 0)
      let mm = pad(Math.floor(diffMinute / 1000 / 60) % 60, 2, 0)
      let hh = pad(Math.floor(diffMinute / 1000 / 60 / 60), 2, 0)
      
      let diffImages = tc1nbImage - tc2nbImage
      if (diffImages < 0) {
        diffImages = tc2nbImage - tc1nbImage
      }
      diffImages = pad(diffImages, 2, 0)
      diffTc = hh + ':'+ mm + ':' + ss + ':' + diffImages
      return diffTc
    }

    // fonction de chargement des éléments appelé à la fin de Request.get
    // appelé dans $scope.switchMainRequest
    // appelé dans $scope.deleteThisObs
    function loadMainRequest(request) {
      $scope.mainRequest = request;
      $scope.projectName = ProjectsService.getName($scope.mainRequest.product.subproject.project)
      $scope.subProjectName = SubProjectsService.getName($scope.mainRequest.product.subproject)
      // contextual_info_value
      $scope.mainRequest.qcReturns = request.ownReturn.filter(item => {
        return returnIsQc(item)
      });
      var noQC = []
      $scope.mainRequest.ownReturn.forEach(function(retour) {
          if (retour.origin != "QC 5.1" && retour.origin != "QC Atmos" &&
           retour.origin != "QC 20"){
            noQC.push(retour)
          }
      })
      $scope.mainRequest.ownReturn = noQC
      $scope.mainRequest.techIssues = []
      $scope.qcid = []
      $scope.mainRequest.qcReturns.forEach(function(qc) {
        $scope.qcid.push(qc.id)
      });
      ContextualInfo.byProductId({
        product_id: $scope.mainRequest.product_id
      }, function (result) {
        result.forEach(function(value) {
          if(value.workflow_id == $scope.mainRequest.workflow_id && value.name == "title_vf"){
            $scope.mainRequest.contextual_info_value = value.value
          }
        })
      })
      if (request.product.subproject.nature.name == "serie") {
        request.product.description = $rootScope._T['m3iyfpjn'] + ' ' + request.product.episode_number;
      } else if (request.product.subproject.nature.name != "serie" && request.product.subproject.nature.name == "film") {
        request.product.description = request.product.description.value;
      } else {
        request.product.description = request.product.description_text;
      }
      let qcSubProject = ""
      if ($scope.mainRequest.product.subproject.nature.name == 'serie') {
        qcSubProject += $scope.mainRequest.product.subproject.season
      } else {
        qcSubProject += $scope.mainRequest.product.subproject.nature.value
      }

      request.product.active = false;

      if (request.parent_request_id != null) {
        $scope.parent_request = Request.get({
          requestId: request.parent_request_id
        });
      }
      if (request.action_type.form != null) {
        showSelectedTypeMastering(request.action_type.form);
      }

      var itemsElements = [];
      if (request.media_items != null) {
        var itemsArray = request.media_items;
        itemsArray.forEach(function(item) {
          var newItem = MediaItems.get({
            itemId: item
          }, function(i) {
            if (i.reference == 1) {
              i.reference = true;
            } else {
              i.reference = false;
            }
          });
          itemsElements.push(newItem);
        });
      }
      request.itemsInRequest = itemsElements;
      request.mediaItems = MediaItems.findbyproduct({
        product_id: request.product.id
      });

      $scope.product = $scope.mainRequest.product;
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
      $scope.product.active = true;

      $scope.decryptedCode = null;

      $scope.myObservations = Observation.querybyrequestid({
        request_id: $scope.mainRequest.id
      });

      var filterReport = [{
        "name": "request_id",
        "value": $scope.mainRequest.id
      }];
      Reportvi.getReportVisBy({
        filters: [filterReport]
      }, function(reports) {
        if (reports[0] == null) {
          $scope.report = new Reportvi();
          $scope.report.request_id = $scope.mainRequest.id;
          $scope.report.$save(function(report) {
            $scope.report.bobines = {}
            $scope.report.bobines['Bobine 1'] = []
            $scope.addRow((countObjects($scope.report.bobines)))

          });
        } else {
          $scope.report = reports[0];
          $scope.report.bobines = {}
          $scope.report.bobines['Bobine 1'] = []
          angular.forEach($scope.report.ownRapportviobservation, function(obs) {
            var ob = new ReportviObservation();
            angular.copy(obs, ob);
            if ($scope.report.bobines['Bobine ' + ob.bobine] == null) {
              $scope.report.bobines['Bobine ' + ob.bobine] = []
            }
            $scope.report.bobines['Bobine ' + ob.bobine].push(ob)
              //$scope.observationRows.push(ob);
          })
          delete $scope.report.ownRapportviobservation
        }
      });

      $scope.isReadOnly = false;

      var user_id = $.cookie('user_id');
      if ($scope.mainRequest.tech_writer_id == user_id) {
        $scope.isReadOnly = false
        $scope.tech_role = "writer";
      } else if ($scope.mainRequest.tech_reader_id == user_id) {
        $scope.tech_role = "reader";
        $scope.isReadOnly = true;
      } else {
        $scope.isReadOnly = true
        $scope.tech_role = null;
      }

      if ($stateParams.farmer != null) {
        let farmer = $filter('filter')($scope.mainRequest.ownFarmerbookings, {
          'id': $stateParams.farmer,
          'tech_writer_id': user_id
        }, true);
        if (farmer.length > 0) {
          $scope.isReadOnly = false
          $scope.tech_role = "writer"
        }

        farmer = $filter('filter')($scope.mainRequest.ownFarmerbookings, {
          'id': $stateParams.farmer
        }, true);
        if (farmer.length > 0) {
          $scope.currentFarmer.artistic_director_id = farmer[0].artistic_director_id;
          $scope.currentFarmer.artistic_director = farmer[0].artistic_director;
        }
      }

      if ($rootScope.canDisplay(1)) {
        $scope.isReadOnly = false
      }

      if ($stateParams.farmer == null) {
        if ($scope.mainRequest.is_sent_back == 1 && $scope.mainRequest.ownFarmerbookings.length == 0) { // demande interne et rendue
          $scope.isReadOnly = true;
        } else if ($scope.mainRequest.ownFarmerbookings.length > 0) { // demande farmer sans farmer_id
          $scope.isReadOnly = false;
        }
      }
      $scope.mainRequest.show_comments = true;
      $scope.countMyReturns = $scope.mainRequest.ownReturn.length;
      $scope.countMyReturnsQC = $scope.mainRequest.qcReturns.length;
      let simplemde = new SimpleMDE({
        autoDownloadFontAwesome: false,
        toolbar: false,
        spellChecker: false,
        status: false,
        placeholder: $rootScope._T["wa7kjuc5"],
        element: document.getElementById("infoForTech")
      });
      if ($scope.mainRequest.info_for_tech != null && $scope.mainRequest.info_for_tech != "") {
        simplemde.value($scope.mainRequest.info_for_tech);
      } else {
        simplemde.value($rootScope._T["wa7kjuc5"]);
      }
      simplemde.togglePreview();
      if($scope.mainRequest.action_type.id == "241"){
        typeOfQC = "Atmos"
      }else if ($scope.mainRequest.action_type.id  == "242"){
        typeOfQC = "51"
      }else if($scope.mainRequest.action_type.id  == "250"){
        typeOfQC = "20"
      }

      Qc.getQcInfosByWorkflow({
        product_id: $scope.mainRequest.product_id,
        workflow_id: $scope.mainRequest.workflow_id,
      },function(qcs_export){
        $scope.qcs_export = qcs_export
      })

      Qc.getTechWriterName({
        techwriterid: $scope.mainRequest.tech_writer_id
      }, function(techWriterInfos){
        $scope.techWriterInfos = techWriterInfos
        if (techWriterInfos.firstname != undefined || techWriterInfos.lastname != undefined) {
          $scope.operator = techWriterInfos.firstname + " " + techWriterInfos.lastname   
        } else {
          $scope.operator = null
        }

        let frame_rate
        if ($scope.mainRequest.workflow.speed) {
          frame_rate = $scope.mainRequest.workflow.speed.value
        }
        let qcSubProject = ''
        if ($scope.mainRequest.product.subproject.nature.name == 'serie') {
          qcSubProject += 'season ' + $scope.mainRequest.product.subproject.season
        } else {
          qcSubProject += $scope.mainRequest.product.subproject.nature.value
        }
        $scope.qc = {
          program_informations : {
            title : $scope.projectName,
            project_id : $scope.mainRequest.product.subproject.project.id,
            version_content : qcSubProject,
            episode_name : $scope.subProjectName,
            episode : $scope.mainRequest.product.description,
            language_config_langue : $scope.mainRequest.workflow.language.value,
            language_config_format_mix: typeOfQC,
            language_config_type_doublage: $scope.mainRequest.workflow.doublage_type.value
          },
          qc_log : {
            date : null,
            operator : $scope.operator,
            qc_type : null,
            status : null,
            operator_comments : null,
            branch_id : $scope.mainRequest.product.subproject.project.branch_id,
          },
          technical_information : {
            program_start : null,
            program_end : null,
            frame_rate : frame_rate,
            trt : null,
            video_start : null,
            video_end : null,
            sync_pop : null,
            ffoa : null,
            first_frame_of_audio_modulation : null,
            lfoa : null,
          }
        }
      })
    }
    if ($stateParams.farmer != null) {
      $scope.currentFarmer = Farmer.get({
        id: $stateParams.farmer
      });
    }
    Return.getReturnActions({}, function(actions) {
      $scope.actions = actions
    })
    // fin fonction de chargement

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


    $scope.exportQCInfos = function(workflow){
      $scope.actualWorkflow = workflow.id
      Qc.getQcInfosByWorkflow({
        product_id: $scope.product.id,
        workflow_id: $scope.actualWorkflow
      }, function(qcsStatus){
        $scope.qcsStatus = qcsStatus
      })
    }
    // export qc
    $scope.exportQC = function(nb_qc){
      var types_of_qc_to_export = []
      for(var i=0; i<=nb_qc; i++){
        if(document.getElementById("qcExport_"+i) != undefined && document.getElementById("qcExport_"+i) != null && document.getElementById("qcExport_"+i).checked == true){
          types_of_qc_to_export.push($scope.qcsStatus[i])
        }
      }
      Qc.getQcInfosByWorkflow({
        product_id: $scope.mainRequest.product.id,
        workflow_id: $scope.mainRequest.workflow.id
      }, function(qcsStatus) {
        $scope.qcsStatus = qcsStatus
        let product = $scope.mainRequest.product
        let workflow = $scope.mainRequest.workflow
          $scope.exportFunction(product, workflow, types_of_qc_to_export, qcsStatus);
          return false;
      })
    }

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
            subproject_name = "Season" + "_" + product.subproject.season
            product_name = "Episode"  + "_" + product.episode_number
          } else {
            subproject_name = product.subproject.nature.value
            if (product.description) {
              if (product.description.value) {
                product_name = product.description.value
              } else {
                product_name = product.description
              }
            } else {
              product_name = product.description_text
            }
          }
          
          let language = $scope.mainRequest.workflow.language.value
          let type_doublage = $scope.mainRequest.workflow.doublage_type.value
          angular.forEach(workflowLanguages, function(workflowLanguage) {
            if (language == workflowLanguage.value) {
              language = workflowLanguage.qc_export_value
            }
          })
          angular.forEach(workflowTypeDoublages, function(workflowTypeDoublage) {
            if (type_doublage == workflowTypeDoublage.value) {
              type_doublage = workflowTypeDoublage.qc_export_value
            }
          })
          angular.forEach(types_of_qc_to_export, function(element, index) {
            let payload = {
              product_id: product.id,
              request_id: types_of_qc_to_export[index].request_id,
              workflow_id: workflow.id,
              types_of_qc_to_export: types_of_qc_to_export[index].type_qc,
              qcsStatus: [types_of_qc_to_export[index]]
            }
            let qc_type_status_cleaned = element.type_qc.replaceAll('.','_')
            $http.post(URL_API + '/returns/qcinfos/qcexport', payload,{ responseType: 'arraybuffer' }).then(function (response) {
              let filename = project_name + "_"+ subproject_name + "_" + product_name + "_"+ language + "_" + type_doublage + "_" + qc_type_status_cleaned + ".xls"
                downloadLink(filename.replace(" ", "_"), response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true)
            })
            .catch(function (error) {
              console.error('Error:', error);
            });
          })
        })
      })
    }

    // fin export qc

    // téléchargement de fichier

    $scope.uploader[0].onBeforeUploadItem = function(item) {
    };
    $scope.uploader[0].onSuccessItem = function(item, response, status, headers) {
      var importJson = angular.fromJson(response, true);
      if (importJson != null) {
        importJson.forEach(function(aReturn) {
          var ret = new Return();
          ret.product_id = $scope.mainRequest.product.id;
          ret.request_id = $scope.mainRequest.id;
          ret.user_id = $.cookie('user_id');
          ret.is_protools = true;
          ret.tc_in = aReturn.tc_in;
          ret.tc_out = aReturn.tc_out;
          ret.comment = aReturn.comment;
          $scope.mainRequest.myReturns.push(ret);
        });
      }
    };
    // fin téléchargement de fichier


    Request.get({
      requestId: $stateParams.id
    }, function(data) {
      $scope.uploader[data.id] = new FileUploader();
      $scope.uploader[data.id].url = URL_API + "/attachments.json/";
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
      if (data.action_type.form == null) {
        var itemsElements = [];
        if (data.media_items != null) {
          var itemsArray = data.media_items;
          itemsArray.forEach(function(item) {
            var newItem = MediaItems.get({
              itemId: item
            });
            itemsElements.push(newItem);
          });
        }
        data.itemsInRequest = itemsElements;
      }

      $scope.requests = new Array(data);

      data.myReturns = Return.querybyrequestid({
        request_id: data.id
      });

      loadMainRequest(data);
    });

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

    $scope.upload = function(item, request_id) {
      item.formData.push({
        request_id: request_id
      });
      item.upload();
      item.onSuccess = function(response, status, headers) {
        item.formData.push({
          id: response.id
        });

      };

    };

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
            //Mettre un indicateur d'update
          }, function(data) {
            return "Error " + data.status + " : " + data.statusText;
          });

        } else {
          $scope.requests.forEach(function(request) {

            var updatedRequest = new Request();
            updatedRequest[value] = $scope.method[value];
            updatedRequest.$update({
              requestId: request.id
            }, function(data) {
              //Mettre un indicateur d'update
            }, function(data) {
              return "Error " + data.status + " : " + data.statusText;
            });
          })
        }
      } else {
        //if ($scope.product[value]) {
        $scope.requests.forEach(function(request) {
          updatedRequest = new Request();
          updatedRequest[value] = $scope.mainRequest[value];
          updatedRequest.$update({
            requestId: request.id
          }, function(data) {
            //Mettre un indicateur d'update
          }, function(data) {
            return "Error " + data.status + " : " + data.statusText;
          });
        });

      }

      //}
    };

    $scope.doneEditingSingle = function(element, value, id) {
      var updatedRequest = new Request();
      updatedRequest[element] = value;
      updatedRequest.$update({
        requestId: id
      }, function(data) {
        //Mettre un indicateur d'update
      }, function(data) {
        return "Error " + data.status + " : " + data.statusText;
      });
    };

    $scope.validateFarmerRequest = function() {
      ngDialog.open({
        template: 'views/Dialog/FarmerRequestValidated.html',
        scope: $scope,
        controller: 'FarmerRequestValidatedDialog',
        closeByDocument: false
      });
    };

    $scope.validateRequest = function() {
      ngDialog.open({
        template: 'views/Dialog/InternalRequestValidated.html',
        scope: $scope,
        width: '500px',
        controller: 'InternalRequestValidatedDialog',
        closeByDocument: false
      });
    };

    function handlePhelixRequest(request) {
      swal({
              title: $rootScope._T["3s7y421d"],
              text: $rootScope._T["mq93d9nv"],
              type: "info",
              showCancelButton: false,
              showConfirmButton: false, // Hide the confirm button initially
          });
        PhelixAlula.saveCatchupRequestIdLinkedPhelixJoblines({}, { request_id: request.id }, function (response) {
            try {
            if (response &&
                response[0] &&
                response[0][0] &&
                response[0][0].request_id !== undefined) {
                Notification.success($rootScope._T["9scual91"]);
                swal.close();
                $scope.openPopupValidateRequestVolume();
            }else{
                swal({
                    title: $rootScope._T["cl5e5z49"],
                    text: $rootScope._T["n8iw0kd8"],
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: $rootScope._T["w7redrmn"],
                    cancelButtonText: $rootScope._T["adoyhyi2"],
                    closeOnConfirm: true
                },function() {
                    swal.close();
                     $scope.openPopupValidateRequestVolume();
                });
            }
            } catch (error) {
            console.error(error);
            }
        }, function (error) {
            console.error(error);
        });
    }

    $scope.validateRequestVolume = function() {
       if ($scope.mainRequest.action_type_id == 461) {
         handlePhelixRequest($scope.mainRequest);
       }else{
         $scope.openPopupValidateRequestVolume();
       }
    }

    $scope.openPopupValidateRequestVolume = function() {
      $scope.validateVolume = true;
      ngDialog.open({
        template: 'views/Dialog/InternalRequestValidated.html',
        width: '500px',
        scope: $scope,
        controller: 'InternalRequestValidatedDialog',
        closeByDocument: false
      });
    }

    $scope.$watch('mainRequest.user_rating', function(rating) {
      if (rating != "" && rating != null) {
        $scope.showUpdateRating = true;
      }
    });

    $scope.updateRating = function() {
      var newRequest = new Request();
      newRequest.user_rating = $scope.mainRequest.user_rating;

      newRequest.$update({
        requestId: $scope.mainRequest.id
      }, function() {
        $scope.showUpdateRating = false;
      });
    };


    $scope.addObservations = function() {

      var observ = new Observation();
      $scope.myObservations.push(observ);
    };

    $scope.publishObs = function() {

      $scope.myObservations.forEach(function(aObs) {
        if ($scope.is_group) {
          var uuid = createUUID();
          $scope.requests.forEach(function(request) {
            aObs.uuid = uuid;
            var obsCopy = angular.copy(aObs);
            obsCopy.request_id = request.id;
            obsCopy.$save({}, function(response) {
              aObs.id = response.id;
            });
          });
        } else {
          aObs.request_id = $scope.mainRequest.id;
          aObs.$save({}, function(response) {
            aObs.id = response.id;
          });
        }
      });
    };


    $scope.deleteThisObs = function(indexObs) {
      if (confirm($rootScope._T["55k240la"])) {
        if ($scope.is_group && $scope.myObservations[indexObs].uuid != null) {
          var obsToDelete = Observation.querybyuuid({
            uuid: $scope.myObservations[indexObs].uuid
          }, function() {
            var count = 0;
            var total = obsToDelete.length;
            obsToDelete.forEach(function(obs) {
              Observation.delete({
                id: obs.id
              }, function() {
                count++;
                if (count == total) {
                  loadMainRequest($scope.mainRequest);
                }
              });
            });
          });
        } else {
          var myObs = $scope.myObservations[indexObs];
          $scope.myObservations.splice(indexObs, 1);
          if (myObs.id != null) {
            myObs.$delete({
              id: myObs.id
            });
          }
        }
      }
    };

    $scope.canPublishObs = function() {
      var result = false;
      if ($scope.myObservations != null) {
        $scope.myObservations.forEach(function(obs) {
          if (obs.id == null) {
            result = true;
            return result;
          }
        });
      }
      return result;
    };

    $scope.addReturns = function(request) {
      var ret = new Return();
      ret.product_id = request.product.id;
      ret.request_id = request.id;
      ret.user_id = $.cookie('user_id');
      if (request.myReturns == null) {
        request.myReturns = [];
      }
      request.myReturns.push(ret);
    };

    $scope.deleteThisRet = function(ret, index, p) {
      if (ret.id != null) {
        Return.delete({
          id: ret.id
        }, function() {
          p.myReturns.splice(index, 1);
        })
      } else {
        p.myReturns.splice(index, 1);
      }
    };

    $scope.checkTypeElementReturn = function(p) {
      let error = false;
      p.myReturns.forEach(function(aRet) {
        if (aRet.id == null) {

          if (aRet.type_element == undefined || aRet.type_element == null) {
            if (!aRet.is_protools) {
              error = true
              $scope.errorTypeElementReturn = true
            }
          }

        }
      });
      return !error;
    }    

    $scope.publishRet = function(p) {
      let error = false 
      if ($scope.checkTypeElementReturn(p)) {
        $scope.errorTypeElementReturn = false
        p.myReturns.forEach(function(aRet) {
          if (aRet.id == null) {
            aRet.request_id = p.id;
            aRet.workflow_id = $scope.workflow.id;
            if (!aRet.tc_global && aRet.tc_in == null && aRet.tc_out == null) {
              aRet.tc_global = true
            } else if (aRet.tc_global) {
              aRet.tc_in = null;
              aRet.tc_out = null;
            } else {
              if (aRet.tc_in != null && aRet.tc_in.length == 9) {
                aRet.tc_in += "00";
              }
              if (aRet.tc_out != null && aRet.tc_out.length == 9) {
                aRet.tc_out += "00";
              }
            }
            aRet.origin = "Interne";
            if (!aRet.is_protools) {
              if (aRet.comment) {
                if (aRet.comment.match(/\[/)) {
                  aRet.comment = ''
                }
                if (aRet.comment.match(/:/)) {
                  const splitted = aRet.comment.split(/:/)
                  aRet.element = splitted[0]
                } else {
                  error = true
                }
              } else {
                error = true
              }
            }
            if (!error) { 
              if (aRet.type_element) {
                aRet.type = aRet.type_element.value;
              }
              delete aRet.type_element;
              aRet.$save({}, function() {
                Return.querybyrequestid({
                  request_id: p.id
                }, function (response) {
                  $scope.mainRequest.ownReturn.push( response.pop())
                })
                $scope.countMyReturns++;
              });
            } else {
              $scope.errorTypeElementReturn = true
            }
          }
        });

      } else {
        $scope.errorTypeElementReturn = true;
      }


    };

    $scope.canPublishReturns = function(p) {
      var result = false;
      if (p != null && p.myReturns != null) {
        p.myReturns.forEach(function(aReturn) {
          if (aReturn.id == null) {
            result = true;
            return result;
          }
        });
      }
      return result;
    };

    $scope.addCommentOnReturn = function(aReturn) {
      var newComment = new Comment();
      newComment.text = aReturn.newComment;
      newComment.user_id = $.cookie('user_id');
      newComment.return_id = aReturn.id;
      newComment.context = $scope.mainRequest.action_type.etape_type.value + " - " + $scope.mainRequest.action_type.value;

      newComment.$save(function() {
        aReturn.newComment = "";
        Return.get({
          id: aReturn.id
        }, function(updateReturn) {
          aReturn.ownComment = updateReturn.ownComment;
        });
      });
    };

    $scope.showReceiveItems = function(product_id) {
      //$scope.itemsForProductId = product_id;
      ngDialog.open({
        template: 'views/Dialog/ShowReceiveElements.html',
        className: 'ngdialog-theme-default dialogwidth80p',
        scope: $scope,
        controller: 'ShowReceiveElementsCtrl',
        closeByDocument: false
      });
    };

    $scope.showTechnicalSpecModal = function(product_id) {
      $scope.isTechnician = true;
      ngDialog.open({
        template: 'views/Dialog/TechnicianTechnicalSpecDialog.html',
        className: 'ngdialog-theme-default dialogwidth80p',
        scope: $scope,
        controller: 'TechnicalSpecCtrl',
        closeByDocument: false
      });
    };

    $scope.newItem = new MediaItems();
    $scope.newMediasItems = [];

    $scope.selectSupportNewElement = function(item, model) {
      $scope.newItem.nature = item.nature;
    };

    $scope.createItem = function(item, object, index) {
      item.origin = 'Interne';
      item.product_id = object.product.id;
      item.original_request_id = $scope.mainRequest.id;
      item.workflow = $scope.workflow.workflow_type.value;
      if (item.nature == "Audio" && item.layout != undefined) {
        item.layout = item.layout.join("+");
      }

      $scope.newMediasItems.push(item);
      $scope.newItem = new MediaItems();

      //Publication automatique des éléments
      //Desactivé pour l'instant
      //$scope.publishNewMediaItems(object);
    };

    $scope.publishNewMediaItems = function(request, index) {
      $scope.newMediasItems.forEach(function(mediaItem) {
        mediaItem.$save({}, function(itemSaved) {
          request.itemsInRequest.push(itemSaved);
          //Mise à jour coté serveur
          var items = [];
          request.itemsInRequest.forEach(function(item) {
            items.push(item.id);
          });
          var requestToUpdate = new Request();
          requestToUpdate.media_items = items.toString();
          requestToUpdate.$update({
            requestId: request.id
          }, function() {
            $scope.newMediasItems = [];
          });

        });
      });
    };

    $scope.removeNewItem = function(index) {
      $scope.newMediasItems.splice(index, 1);
    };

    $scope.updateReport = function(report, request) {
      var updateRequest = new Request();
      updateRequest.report = report;
      updateRequest.$update({
        requestId: request.id
      });
    };

    function createUUID() {
      // http://www.ietf.org/rfc/rfc4122.txt
      var s = [];
      var hexDigits = "0123456789abcdef";
      for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = "-";

      var uuid = s.join("");
      return uuid;
    }

    $scope.displayButtonAddReturn = true
    $scope.displayButtonPublish = false
    $scope.canPublishQcReturns = function(p) {
      if (!$scope.displayButtonAddReturn) {
        return $scope.displayButtonPublish
      }
      let result = false
      if (p != null && p.qcReturns != null) {
        p.qcReturns.forEach(function(aReturn) {
          if (String(aReturn.id).includes('tmp')) {
            result = true;
            return result
          }
        });
      }
      return result;
    }
    
    $scope.canDisplayButtonAddReturn = function () {
      if ($scope.isReadOnly) {
        return false
      }
      return $scope.displayButtonAddReturn
    }

    // qc function for the html page
    $scope.addQcReturns = function(request) {
      $scope.displayButtonAddReturn = false
      $scope.displayButtonPublish = true
      $scope.return_button = true
      var ret = new Return();
      ret.id = 'tmp-' + Math.floor(Math.random() * 1000000) 
      ret.product_id = request.product.id;
      ret.request_id = request.id;
      ret.tc_global = false
      ret.user_id = $.cookie('user_id');
      if (request.qcReturns == null) {
        request.qcReturns = [];
      }

      let techIssue = {
        tc_in : null,
        tc_out : null,
        channel : null,
        category : null,
        comments : null,
        severity : null,
        status : null,
        notes : null,
        qc_id : null,
        return_id: ret.id
      }
      if (request.techIssues == null) {
        request.techIssues = [];
      }
      request.techIssues.push(techIssue);
      request.qcReturns.push(ret)
    };

    $scope.deleteThisQcRet = function(ret, index, p) {
      if (ret.id != null) {
        Return.delete({
          id: ret.id
        }, function() {
          p.qcReturns.splice(index, 1);
        })
      } else {
        p.qcReturns.splice(index, 1);
      }
      // $scope.return_button = false
    };

    $scope.checkQcReturn = function(p, techIssue) {
      
      p.qcReturns.forEach(function(aRet) {
        let bIsNewReturn = String(aRet.id).includes('tmp');
        if (bIsNewReturn) {
          if (aRet.type == undefined || aRet.type == null) {
            $scope.error.push("type_return");
          }
          if (!aRet.tc_global && aRet.tc_in == null && aRet.tc_out == null) {
              $scope.error.push("TC");
          }
          if (aRet.tc_in && !aRet.tc_out) {
            $scope.error.push("TC");
          }
        }
      });

      if (techIssue.severity == null) {
        $scope.error.push("severity");
      }
      if (techIssue.channel == null) {
        $scope.error.push("channel");
      }
      return $scope.error.length == 0;
    }

    $scope.publishQcRet = function(request) {
      let yesWeCanSaveNewQCReturns = true
      
      const newQCReturns = []
      let someErrors = false
      $scope.error = []
      request.qcReturns.forEach((aReturn) => {
        let newReturn  = String(aReturn.id).includes('tmp')
        if (newReturn) {
          let techIssue = request.techIssues.find(item => { return item.return_id === aReturn.id })

          aReturn.request_id = request.id;
          aReturn.workflow_id = $scope.workflow.id;
          if (!aReturn.tc_global && (!aReturn.tc_in || !aReturn.tc_out)) {
            aReturn.tc_global = false
            aReturn.tc_in = null
            aReturn.tc_out = null
          } else if (aReturn.tc_global) {
            aReturn.tc_in = $scope.qc.technical_information.program_start
            aReturn.tc_out = $scope.qc.technical_information.program_end
          } else {
            if (aReturn.tc_in != null && aReturn.tc_in.length == 9) {
              aReturn.tc_in += "00";
              aReturn.tc_global == false
            }
            if (aReturn.tc_out != null && aReturn.tc_out.length == 9) {
              aReturn.tc_out += "00";
              aReturn.tc_global == false
            }
          }
          aReturn.type = null;
          if (aReturn.type_element) {
            if (aReturn.type_element.value) { 
              aReturn.type = aReturn.type_element.value
            }

          } else {
            someErrors = true
            $scope.error.push("type_return")
          }
          if (aReturn.comment) {
            if (aReturn.comment.match(/:/)) {
              const commentSplitted = aReturn.comment.split(':')
              if (commentSplitted[1] == '') {
              } else {
                aReturn.element = commentSplitted[0]
              }
            } else {
              someErrors = true
              $scope.error.push("comments")
            }

          } else {
            someErrors = true
            $scope.error.push("comments")
          }          
          if ($scope.checkQcReturn(request, techIssue) && !someErrors) {
            aReturn.origin = request.action_type.value
            techIssue.tc_in = aReturn.tc_in
            techIssue.tc_out = aReturn.tc_out
            techIssue.comments = aReturn.comment
            techIssue.qc_id = $scope.qcExist.qc.id
            delete aReturn.type_element
            newQCReturns.push({ ret: aReturn, ti: techIssue })
          } else {
            yesWeCanSaveNewQCReturns = false
          }
        }

      })
      if (yesWeCanSaveNewQCReturns) {
        ReturnService.postNewQcReturn(newQCReturns, 
          function (responses) {
            request.qcReturns.forEach((aReturn, index) => {
              let newReturn  = String(aReturn.id).includes('tmp')
              let response = responses.find(item => { return item.original_id === aReturn.id })
              if (newReturn && response) {
                request.qcReturns[index].id = response.ret.id
              }
            })
            $scope.qcValues(request.id)
            $scope.countMyReturnsQC = $scope.mainRequest.qcReturns.length
            $scope.displayButtonAddReturn = true
            $scope.canActiveComments = false
            $scope.error = []
          },
          function () {
  
          })
      }


    }

    // to delete
    $scope.publishQcRet2 = function(p) {
      $scope.return_button = false
      // publie un retour
      //p = mainrequest
      var qcRetInfos = {};
      p.qcReturns.forEach(function(aRet) {
        let bIsNewReturn  = String(aRet.id).includes('tmp');
        let techIssue = p.techIssues.find(item => { return item.return_id === aRet.id })
        if (bIsNewReturn) {
          aRet.request_id = p.id;
          aRet.workflow_id = $scope.workflow.id;
          if (!aRet.tc_global && !aRet.tc_in && !aRet.tc_out) {
            // bi
            aRet.tc_global = false
            aRet.tc_in = null
            aRet.tc_out = null
          } else if (aRet.tc_global) {
            aRet.tc_in = $scope.qc.technical_information.program_start
            aRet.tc_out = $scope.qc.technical_information.program_end
          } else {
            if (aRet.tc_in != null && aRet.tc_in.length == 9) {
              aRet.tc_in += "00";
              aRet.tc_global == false
            }
            if (aRet.tc_out != null && aRet.tc_out.length == 9) {
              aRet.tc_out += "00";
              aRet.tc_global == false
            }
          }
          aRet.type = null;
          if (aRet.type_element.type) aRet.type = aRet.type_element.type
          
          aRet.element = null; 
          if (aRet.type_element.element) aRet.element = aRet.type_element.element
          if ($scope.checkQcReturn(p, techIssue)) {
            delete aRet.type_element;
            aRet.origin = $scope.mainRequest.action_type.value;
            delete aRet.id;
            delete techIssue.return_id;
            aRet.$save({}, function() {
              $scope.return_button = false

              techIssue.tc_in = aRet.tc_in
              techIssue.tc_out = aRet.tc_out
              techIssue.return_id = aRet.id
              techIssue.comments = aRet.comment
                Qc.getQcId({
                  request_id: p.id
                }, function(qcId){
                  techIssue.qc_id = qcId.id
                  Qc.postQcTechnicalIssues(techIssue, function() {
                    // et remet à jour
                    Qc.getQcValues({
                      request_id: p.id
                    }, function(qc){
                      angular.forEach(qc.technical_issues, function(ti) {
                        if(ti.tc_in == null){
                          ti.tc_in = qc.technical_information.program_start
                        }
                        if(ti.tc_out == null){
                          ti.tc_out = qc.technical_information.program_end
                        }
                        if(ti.status == "failed"){
                          $scope.ti_failed = true;
                        }else{
                          $scope.ti_failed = false;
                        }
                        angular.forEach(qc.return, function(ret) {
                          if(ti.return_id == ret.id){
                            ti.return_element_type = {element: ret.type, type: ret.type, value: ret.type }
                          }
                        })
                      })
                      $scope.qcExist.technical_issues = qc.technical_issues
                      $scope.qcExist.return = qc.return
                                
                    })
                    p.qcReturns = Return.querybyrequestid({
                      request_id: p.id
                    });
                  })
                })

              $scope.countMyReturns++;
              $scope.countMyReturnsQC++;
            });
          }
        }
      })
    };   




    $scope.publishQcInfos = function(qc) {
      $scope.errors.qc_log = {
        qc_type: false
      }
      $scope.errors.technical_information  = {
        program_start: false, 
        program_end: false, 
        video_start: false, 
        video_end: false, 
        ffoa: false, 
        first_frame_of_audio_modulation: false, 
        lfoa: false,
      }

      qcRetInfos = $scope.qc
      let hasError = false
      angular.forEach($scope.qc.technical_information, function(techInfo, name) {

        if (name != "frame_rate" && name != "trt") {
          if (techInfo != null) {
            for (var i = 0; i < techInfo.length; i++) {
              if (i === 2 || i === 5 || i === 8) {
                techInfo = techInfo.substring(0, i) + ":" + techInfo.substring(i, techInfo.length);
                $scope.qc.technical_information[name] = techInfo
              }
            }
          }
        }
        if (!techInfo && $scope.errors.technical_information.hasOwnProperty(name)) {
          $scope.errors.technical_information[name] = $rootScope._T["y43zftwq"]
          hasError = true
        }
      })
      qcRetInfos.technical_information.trt = timecodeDiff(qcRetInfos.technical_information.program_start, qcRetInfos.technical_information.program_end)
      if (!qcRetInfos.qc_log.qc_type) {
        $scope.errors.qc_log.qc_type = $rootScope._T["y43zftwq"]
        hasError = true
      }

      if (!hasError) {
        Qc.postQcInfos(qcRetInfos, function(values) {
          qcinfos = {
            qc_infos : {
              program_informations_id : values.program_informations.id,
              qc_log_id : values.qc_log.id,
              technical_informations_id : values.technical_information.id,
              request_id : $scope.mainRequest.id
            }
          }
          Qc.postQc(qcinfos, function(qc){
            Qc.postQcInfosId(qc)
            postAssets = JSON.parse(JSON.stringify($scope.assets))
            angular.forEach(postAssets, function(asset) {
              asset.qc_id = qc.id
              asset.date_received = moment(new Date(asset.date_received)).format("YYYY-MM-DD");
              if(asset.date_received == "1970-01-01" || asset.date_received == "Invalid date"){
                asset.date_received = null
              }
            })
  
            Qc.postQcAssetDetails(postAssets, function() {
              let deferred = $q.defer();
  
              Qc.getQcValues({
                request_id: $scope.mainRequest.id
              }, function(qc){
                angular.forEach(qc.technical_issues, function(ti) {
                  if(ti.status == "failed"){
                    $scope.ti_failed = true;
                  }else{
                    $scope.ti_failed = false;
                  }
                })
                $scope.fixAssetDate(qc)
                deferred.resolve(qc);
                $scope.qcExist = qc
                $scope.qc = qc  
              }, function(error){
                deferred.reject(error);
              })
              return deferred.promise;
            })
          })
        })
      }


    }




    /**
     * Section Mastering
     * abandonné ou pas terminé (note phv du 20210430)
     */

    $scope.editMediaItemReference = function(item) {
      var upItem = new MediaItems();
      upItem.reference = item.reference;
      upItem.$update({
        itemId: item.id
      });
    };


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

    $scope.masteringReturnFields = [];

    function showSelectedTypeMastering(item) {
      var type;
      dynamicForm.forEach(function(form) {
        if (form.id == item) {
          type = form;
        }
      });

      $scope.masteringGeneralForm = [];
      $scope.masteringProductForm = [];
      var promise = $scope.getRequests();
      promise.then(function() {

        type.generalForm.forEach(function(data) {
          data.type.options = formSwitch(data, null);
          //$scope.masteringGeneralForm.push(data);

        });
        if (type.productForm != null) {
          $scope.requests.forEach(function(product) {

            var temp = [];
            type.productForm.forEach(function(element) {
              var temporary = {};
              angular.copy(element, temporary);

              temporary.name = element.name + "_" + product.id;
              if (product.product.episode_number != null) {
                temporary.text = product.product.episode_number;
              } else {
                temporary.text = product.product.description_text;

              }

              temporary.type.options = formSwitch(temporary, product);

              temp.push(temporary);


            });
            $scope.masteringProductForm.push(temp);
          });
        }

        $scope.masteringGeneralForm = type.generalForm;

      });

      $scope.masteringGeneralForm.forEach(function(data) {
        if (data.type.view == "ui-select-multiple") {
          $scope.method[data.name] = data.type.options;
        }
      });
    }

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

        if (data.type.view == "ui-select-multiple") {
          if ($scope.mainRequest[data.name] != null) {
            var res = [];
            var ids = $scope.mainRequest[data.name].split(',');
            ids.forEach(function(id) {
              options.forEach(function(opt) {
                if (id == opt.id) {
                  res.push(opt.name);
                }
              })
            });
            $scope.method[data.name] = res.join(' - ');
          } else {
            $scope.method[data.name] = null;
          }
        } else {
          options.forEach(function(opt) {
            if (opt.id == product[variable]) {
              $scope.method[data.name] = opt.name;
              return true;
            }
          });
        }
        if ($scope.method[data.name] == null) {
          $scope.method[data.name] = product[variable];
        }
      } else {
        if (data.type.view == "ui-select-multiple") {
          var res = [];
          if ($scope.mainRequest[data.name] != null) {
            var ids = $scope.mainRequest[data.name].split(',');
            ids.forEach(function(id) {
              options.forEach(function(opt) {
                if (id == opt.id) {
                  res.push(opt.name);
                }
              })
            });
            $scope.method[data.name] = res.join(' - ');
          } else $scope.method[data.name] = null;
        } else {
          options.forEach(function(opt) {
            if (opt.id == $scope.mainRequest[data.name]) {
              $scope.method[data.name] = opt.name;
              return true;
            }
          });
        }
        if ($scope.method[data.name] == null) {
          $scope.method[data.name] = $scope.mainRequest[data.name];
        }
      }
      if (options == '' && data.type.options != null) {
        return data.type.options;
      }
      return options;
    }
    //      $scope.report.errorRows = [];
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
    $scope.varispeeds = [{
      value: 1,
      text: '23.98 -> 24 (+0.1%)'
    }, {
      value: 2,
      text: '24 -> 25 (+4.17%)'
    }, {
      value: 3,
      text: '23.98 -> 25 (+4.27%)'
    }, {
      value: 4,
      text: '24 -> 23.98 (-0.1%)'
    }, {
      value: 5,
      text: '25 -> 24 (-4%)'
    }, {
      value: 6,
      text: '25 -> 23.98 (-4.1%)'
    }];
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

    $scope.updateReport = function() {
      var bobines = $scope.report.bobines
      delete $scope.report.bobines
      if ($scope.report.id != null) {
        $scope.report.$update({
          id: $scope.report.id
        }, function(report) {
          report.bobines = bobines
          $scope.report = report
        });
      } else {
        $scope.report.request_id = $scope.mainRequest.id;
        $scope.report.$save({}, function(report) {
          report.bobines = bobines
          $scope.report = report
        });
      }
    }

    $scope.updateReportLevel = function(newLevel, levelString) {
      if ($scope.report.level != newLevel) {
        $scope.report.level = newLevel;
        $scope.updateReport();
      }
    }


    $scope.updateReportObservation = function(obs) {
      if (!isNaN(parseInt(obs.tc_in)) && obs.tc_in.length == 8) {
        var str = obs.tc_in.substring(0, 2);
        str += ":" + obs.tc_in.substring(2, 4);
        str += ":" + obs.tc_in.substring(4, 6);
        str += ":" + obs.tc_in.substring(6, 8);
        obs.tc_in = str;
      }
      if (!isNaN(parseInt(obs.tc_out)) && obs.tc_out.length == 8) {
        var str = obs.tc_out.substring(0, 2);
        str += ":" + obs.tc_out.substring(2, 4);
        str += ":" + obs.tc_out.substring(4, 6);
        str += ":" + obs.tc_out.substring(6, 8);
        obs.tc_out = str;
      }
      obs.$update({
        id: obs.id
      });
    };


    $scope.activePillReport = 0
    $scope.addBobine = function() {
      $scope.report.bobines['Bobine ' + (countObjects($scope.report.bobines) + 1)] = []
      $scope.activePillReport = countObjects($scope.report.bobines)
      $scope.addRow((countObjects($scope.report.bobines)))
    }

    $scope.addRow = function(bobine) {

      $scope.inserted = new ReportviObservation();
      $scope.inserted.rapportvi_id = $scope.report.id;
      $scope.inserted.bobine = bobine
      $scope.inserted.$save(function(response) {
        $scope.inserted.id = response.id;
        $scope.report.bobines['Bobine ' + bobine].push(response)
          //$scope.observationRows.push($scope.inserted);
      });
    };


    $scope.removeRow = function(obs) {


      swal({
          title: $rootScope._T["ervp7bai"],
          text: $rootScope._T["5igyysmn"],
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: $rootScope._T["mnlbxblr"],
          closeOnConfirm: true
        },
        function() {
          var obsTemp = angular.copy(obs)
          obsTemp.$delete({
            id: obs.id
          }, function() {
            $scope.report.bobines['Bobine ' + obs.bobine].splice($scope.report.bobines['Bobine ' + obs.bobine].indexOf(obs), 1);
            if ($scope.report.bobines['Bobine ' + obs.bobine].length == 0) {
              delete $scope.report.bobines['Bobine ' + obs.bobine]
            }
          });
        });
    };
    $scope.showSelect = function(scope, errorRow) {
      var selected = [];

      if (errorRow) {
        selected = $filter('filter')(scope, {
          value: errorRow
        });
      }

      return selected.length ? selected[0].text : $rootScope._T["0mzut3vy"];
    };

    $scope.checkTC = function(data, index, tc) {
      if (tc == 'tc_in' || (tc == "tc_out" && data != null)) {
        if (data != null) {
          var s1 = data.match(/\d{2}\:\d{2}\:\d{2}:\d{2}/);
          if (s1 == null) {
            if (isNaN(parseInt(data)) || data.length != 8) {
              return "Timecode must be 00:00:00:00 ou 00000000";
            }
          }
        } else {
          return "Cannot be void";
        }
      }
    };

    $scope.editMediaItem = function(item, support) {
      if (support) {
        var selected = $filter('filter')($scope.supports, {
          support: item.support
        });
        item.nature = ($scope.supports && selected.length) ? selected[0].nature : 'Error';
      }
      var upItem = new MediaItems();
      upItem = item;
      upItem.$update({
        itemId: item.id
      });
    };

    $scope.addCommentOnRequest = function(request) {
      if (request.newComment != null && request.newComment != "") {
        var newComment = new Comment();
        newComment.text = request.newComment;
        newComment.user_id = $.cookie('user_id');
        newComment.request_id = request.id;
        newComment.show_tech = true

        //newComment.context = "Gestion des retours";

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

          });

        });
      }
    };

    $scope.addCommentOnReturn = function(aReturn) {
      var newComment = new Comment();
      newComment.text = aReturn.newComment;
      newComment.user_id = $.cookie('user_id');
      newComment.return_id = aReturn.id;
      newComment.context = "Tech";
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

    $scope.count = function(objects) {
      var count = 0
      angular.forEach(objects, function() {
        count++
      })
      return count
    }

    // jamais utilisé 20210427
    $scope.sendNotif = function(request, title, description, service, field, subject) {
      var notif = new NotificationService();
      notif.services = service;
      notif.title = title;
      notif.description = description;
      notif.request_id = request.id;
      notif.project_id = request.product.subproject.project_id;
      notif.subproject_id = request.product.subproject.id;
      notif.subject = subject;
      notif.product_desc = request.product.human_description;
      notif.common_id = request.id + "_" + field;
      notif.etape_action = request.action_type.etape_type.value + " " + request.action_type.value;
      notif.type = "standard";
      notif.$save();
    };

    $scope.expandActivityLog = function() {
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-default dialogwidth80p',
        template: 'views/Dialog/ActivityLogDialog.html',
        scope: $scope,
        closeByDocument: false
      });
    }

    $scope.showCodeSecurity = function(mediaitem_id) {
        $scope.decryptedCode = null;
        
        decryptedCode = MediaItems.mediasealsecuritycode({
          mediaitemId: mediaitem_id
        }, function(response) {
          $scope.decryptedCode = response.decryptCode;
        });

    }

    $scope.assets = []
    $scope.assetTemplate = {
      "audio_language" : null,
      "config" : null,
      "asset_type" : null,
      "version" : null,
      "date_received" : null,
      "filename" : null,
      "lkfs" : null,
      "tp" : null,
      "qc_id" : null
    }

    $scope.addAsset = function(request_id) {
      $scope.asset = angular.copy($scope.assetTemplate);
      $scope.assets.push($scope.asset)
    }

    $scope.delAsset = function(key) {
      $scope.assets.splice(key, 1)
    }

    $scope.modifyAsset = function(qc) {
      postAssets = JSON.parse(JSON.stringify($scope.assets))
      angular.forEach(postAssets, function(asset) {
        delete asset.id
        asset.date_received = moment(new Date(asset.date_received)).format("YYYY-MM-DD");
        if(asset.date_received == "1970-01-01" || asset.date_received == "Invalid date"){
          asset.date_received = null
        }
      })
      Qc.getQcId({
        request_id: $scope.mainRequest.id
      }, function(qcId){
        Qc.postModifyAssetDetails({
          qc_id: qcId.id,
          assets: postAssets
        })
      })
    }

    $scope.finalizeQC = function(qc_id, request_id){
      swal({
        title: $rootScope._T["5ygcxbsu"],
        text: 'Really ? Absolument ? without any regret ?',
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "So, let's go",
        closeOnConfirm: true
      },
        function(){
          Qc.postFinalizeQC({
            qc_id: qc_id
          }, function(){
            Qc.getQcValues({
              request_id: request_id
            }, function(qc){
              angular.forEach(qc.technical_issues, function(ti) {
                if(ti.status == "failed"){
                  $scope.ti_failed = true;
                }else{
                  $scope.ti_failed = false;
                }
              })
              $scope.fixAssetDate(qc)
              $scope.qcExist = qc
              $scope.qc = qc
              var qcInformations = document.getElementById("qcInformations");
              var qcAssets = document.getElementById("qcAssets");
              if($scope.qcExist.qc.validate == 1){
                qcInformations.querySelectorAll("input").forEach(i => i.setAttribute("readonly", ""));
                qcAssets.querySelectorAll("input").forEach(i => i.setAttribute("readonly", ""));
              }
            })
          })
        });
    }

    // qc technical informations
    $scope.modifyTi = function(id, return_id, tc_in, tc_out, channel, return_element_type, comments, severity, request_id){
      const commentSplitted = comments.split(':')
      Qc.postModifyTi({
        id: id,
        return_id: return_id,
        tc_in: tc_in,
        tc_out: tc_out,
        channel: channel,
        type: return_element_type.element,
        element: commentSplitted[0],
        comments: comments,
        severity: severity
      }, function(){
          Qc.getQcValues({
            request_id: request_id
          }, function(qc){
            angular.forEach(qc.technical_issues, function(ti) {
              if(ti.tc_in == null){
                ti.tc_in = qc.technical_information.program_start
              }
              if(ti.tc_out == null){
                ti.tc_out = qc.technical_information.program_end
              }
              if(ti.status == "failed"){
                $scope.ti_failed = true;
              }else{
                $scope.ti_failed = false;
              }
              angular.forEach(qc.return, function(ret) {
                if(ti.return_id == ret.id){
                  ti.return_element_type = {element: ret.type, type: ret.type, value: ret.type}
                }
              })
            })
            $scope.qcExist = qc
          })
      })
    }

    $scope.delTi = function(key, return_id, request_id) {
      Qc.deleteTi({
        id_ti: key,
        return_id: return_id
      }, function(){
        Qc.getQcValues({
          request_id: request_id
        }, function(qc){
          angular.forEach(qc.technical_issues, function(ti) {
            if(ti.tc_in == null){
              ti.tc_in = qc.technical_information.program_start
            }
            if(ti.tc_out == null){
              ti.tc_out = qc.technical_information.program_end
            }
            if(ti.status == "failed"){
              $scope.ti_failed = true
            }else{
              $scope.ti_failed = false;
            }
            angular.forEach(qc.return, function(ret) {
              if(ti.return_id == ret.id){
                ti.return_element_type = {element: ret.type, type: ret.type, value: ret.type }
              }
            })
          })
          $scope.qcExist = qc
        })
        
      })
    }

    $scope.qcValues = function(request_id) {
      Qc.getQcValues({
        request_id: request_id
      }, function(qc){
        if (qc.qc_exist == 'false') {
          if ($scope.techWriterInfos.firstname != undefined || $scope.techWriterInfos.lastname != undefined) {
            $scope.operator = $scope.techWriterInfos.firstname + " " + $scope.techWriterInfos.lastname   
          } else {
            $scope.operator = null
          }
          let frame_rate
          if ($scope.mainRequest.workflow.speed) {
            frame_rate = $scope.mainRequest.workflow.speed.value
          }
          let qcSubProject = ''
          if ($scope.mainRequest.product.subproject.nature.name == 'serie') {
            qcSubProject += 'season ' + $scope.mainRequest.product.subproject.season
          } else {
            qcSubProject += $scope.mainRequest.product.subproject.nature.value
          }
          $scope.qc = {
            program_informations : {
              title : $scope.projectName,
              project_id : $scope.mainRequest.product.subproject.project.id,
              version_content : qcSubProject,
              episode_name : $scope.subProjectName,
              episode : $scope.mainRequest.product.description,
              language_config_langue : $scope.mainRequest.workflow.language.value,
              language_config_format_mix: typeOfQC,
              language_config_type_doublage: $scope.mainRequest.workflow.doublage_type.value
            },
            qc_log : {
              date : null,
              operator : $scope.operator,
              qc_type : null,
              status : null,
              operator_comments : null,
              branch_id : $scope.mainRequest.product.subproject.project.branch_id,
            },
            technical_information : {
              program_start : null,
              program_end : null,
              frame_rate : frame_rate,
              trt : null,
              video_start : null,
              video_end : null,
              sync_pop : null,
              ffoa : null,
              first_frame_of_audio_modulation : null,
              lfoa : null,
            }
          }
        } else {

          angular.forEach(qc.technical_issues, function(ti) {
            if (ti.tc_in == null) {
              ti.tc_in = qc.technical_information.program_start
            }
            if (ti.tc_out == null) {
              ti.tc_out = qc.technical_information.program_end
            }
            if (ti.status == "failed") {
              $scope.ti_failed = true;
            } else {
              $scope.ti_failed = false;
            }
            ti.return_element_type = { element: qc.return[ti.return_id].type }
          })
          $scope.fixAssetDate(qc)
          angular.forEach(qc.asset_details, function(asset) {
            if(moment(new Date(asset.date_received)).format("YYYY-MM-DD") == "1970-01-01"){
              delete asset.date_received
            }
          })

          $scope.qcExist = qc
          $scope.qc = qc
          let qcSubProject = ''
          if ($scope.mainRequest.product.subproject.nature.name == 'serie') {
            qcSubProject += 'season ' + $scope.mainRequest.product.subproject.season
          } else {
            qcSubProject += $scope.mainRequest.product.subproject.nature.value
          }
          $scope.qc.program_informations.version_content = qcSubProject

          $scope.assets = []
          angular.forEach(qc.asset_details, function(asset) {
            $scope.assets.push(asset)
          })
          var qcInformations = document.getElementById("qcInformations");
          var qcAssets = document.getElementById("qcAssets");
          if($scope.qcExist.qc.validate == 1){
            qcInformations.querySelectorAll("input").forEach(i => i.setAttribute("readonly", ""));
            qcAssets.querySelectorAll("input").forEach(i => i.setAttribute("readonly", ""));
          }
        }
      })
    }
    $scope.errors  = {}

    $scope.errors.qc_log = {
      qc_type: false
    }
    $scope.errors.technical_information  = {
      program_start: false, 
      program_end: false, 
      video_start: false, 
      video_end: false, 
      frame_rate: false,
      trt: false,
      ffoa: false, 
      first_frame_of_audio_modulation: false, 
      lfoa: false,
    }

    $scope.qcModifyInfos = function(qc){
      $scope.errors.qc_log = {
        qc_type: false
      }
      $scope.errors.technical_information  = {
        program_start: false, 
        program_end: false, 
        video_start: false, 
        video_end: false, 
        frame_rate: false,
        trt: false,
        ffoa: false, 
        first_frame_of_audio_modulation: false, 
        lfoa: false,
      }
      Qc.getQcId({
        request_id: $scope.mainRequest.id
      }, function(qcId) {
        let hasError = false
        angular.forEach(qc.technical_information, function(techInfo, name) {
          if (!techInfo && $scope.errors.technical_information.hasOwnProperty(name)) {
            $scope.errors.technical_information[name] = $rootScope._T["y43zftwq"]
            hasError = true
          }
          if (name != "frame_rate" && name != "trt" && name != "qc_id" && name != "id") {
            if(techInfo != null && techInfo.includes(":") == false){
              for (var i = 0; i < techInfo.length; i++) {
                if (i === 2 || i === 5 || i === 8) {
                  techInfo = techInfo.substring(0, i) + ":" + techInfo.substring(i, techInfo.length);
                  qc.technical_information[name] = techInfo
                }
              }
            }
          }
        })
        if (!qc.qc_log.qc_type) {
          $scope.errors.qc_log.qc_type =  $rootScope._T["y43zftwq"]
          hasError = true
        }
        qcModifyInfos = qc
        // program_start, program_end video_start video_end ffoa first_frame_of_audio_modulation lfoa
        qcModifyInfos.technical_information.trt = timecodeDiff(qcModifyInfos.technical_information.program_start, qcModifyInfos.technical_information.program_end)
        qcModifyInfos.technical_information.qc_id = qcId.id
        qcModifyInfos.technical_information.id = $scope.qcExist.technical_information.id
        qcModifyInfos.program_informations.qc_id = qcId.id
        qcModifyInfos.program_informations.id = $scope.qcExist.program_informations.id
        qcModifyInfos.qc_log.qc_id = qcId.id
        qcModifyInfos.qc_log.id = $scope.qcExist.qc_log.id
        if (!hasError) {
          Qc.postQcModifyInfos(qcModifyInfos, function(values){})
          $scope.modifyAsset(qc)
        } else {
          return
        }
        
      })
    }

    $scope.fixAssetDate = function(qc){
      angular.forEach(qc.asset_details , function(asset) {
        asset.date_received = new Date(asset.date_received);
      })
    }
  }
]);
