Lantern.controller('ManageReturnsCtrl', ['$scope','Session', '$rootScope', '$filter', '$cookies', '$state', '$stateParams', '$location', 'Comment', 'Return', 'Product', 'PersonsService', 
'User', 'ReturnService', '$interval', 'Notification', 'CreateRequestService', 'ngDialog', 'WorkflowHelperService', 'HelperService', 'Qc','$http', 'ProductService',
  function ($scope, Session, $rootScope, $filter, $cookies, $state, $stateParams, $location, Comment, Return, Product, PersonsService, 
    User, ReturnService, $interval, Notification, CreateRequestService, ngDialog, WorkflowHelperService, HelperService, Qc, $http, ProductService) {
    $scope.screenerProduct = null;
    $scope.screenerProducts = [];
    let sbranches = Session.userBranches() ? Session.userBranches() : [];

    $scope.screenerBranches = [];
    $scope.screener_branch_name = null;
    sbranches.forEach((sbranch) => {
      let branch = {};
      branch.id = sbranch.id;
      branch.value = sbranch.name;
      $scope.screenerBranches.push(branch)
    })
    $scope.screenerBranch = {'id' : $scope.screenerBranches[0].id, value: $scope.screenerBranches[0].value};

    $scope.commentsForSelect = []
    $scope.qcAtmos = []
    $scope.qc51 = []
    $scope.qc20 = []
    $scope.severityForSelect = []
    $scope.channelsForSelect = []

    $scope.actualWorkflow;

    let dynamicOriginHashCorrespondance = {}
    let dynamicOriginHash = {}
    $scope.dynamicOrigin = {}

    let dynamicOriginHashWithDate = {}
    $scope.dynamicOriginWithDate = {}

    Qc.getQcInfos({
    }, function(qcInfos) {
      $scope.qcInfos = qcInfos
      angular.forEach($scope.qcInfos.qc_values_channels, function(value) {
        $scope.channelsForSelect.push(value.name)
      })
      angular.forEach($scope.qcInfos.qc_values_severity, function(value) {
        $scope.severityForSelect.push(value.name)
      })
    })  


    // all qc values
    Qc.getQcInfos({
    }, function(qcInfos) {
      $scope.qcInfos = qcInfos
      angular.forEach($scope.qcInfos.qc_values_comments, function(value) {
        $scope.commentsForSelect.push(value.name)
      })
    })
    if ($state.params.workflow_id != null) {
      $scope.actualWorkflow = $state.params.workflow_id
    }
    

    const retrieveInformationsOnProductFromServer = function () {
      $scope.qcAtmos = []
      $scope.qc51 = []
      $scope.qc20 = []
      dynamicOriginHash = {}
      $scope.dynamicOrigin = {}
      dynamicOriginHashWithDate = {}
      $scope.dynamicOriginWithDate = {}
      $scope.screener_branch_name = '';

      ProductService.getProduct({
        id: $stateParams.id
      }, 
      function(product) {
        $scope.product = product
        product.human_description = product.human_description.replace('Season', $rootScope._T["6vwtywcc"]).replace('Episode', $rootScope._T["m3iyfpjn"])
        $scope.product.returns = [];

        if (product.screener_product) {
          product.screener_name = HelperService.getScreenerFullProductName(product.screener_product);
          sbranches.forEach((branch) => {
            if (branch.id == product.screener_product.branch_id) {
              product.screener_branch_name = branch.name;
            }
          })
        } 

        let isFirst = true
        let requestReturns = []
        angular.forEach($scope.product.sharedWorkflow, function(workflow) {
          if ($state.params.workflow_id != null && workflow.id == $state.params.workflow_id) {
            workflow.isSelected = true;
            $scope.selectedWorkflowLanguageValue  = workflow.language.value;
            $scope.selectedWorkflowLanguageId = workflow.language_id;
            $scope.selectedWorkflowDoublageTypeId = workflow.doublage_type_id;
            $scope.selectedWorkflowId = workflow.id;
            // $scope.actualWorkflow =  workflow.id
          } else if (!$state.params.workflow_id && isFirst) {
            workflow.isSelected = true;
            $scope.selectedWorkflowId = workflow.id;
            $scope.actualWorkflow =  workflow.id
            isFirst = false;
          } else {
            workflow.isSelected = false;
          }

          workflow.color = colorizeWorkflow(workflow);

          workflow.description = WorkflowHelperService.describeWorkflow(workflow);

          workflow.returns = []
          requestReturns.push({ wid: workflow.id, pid: $stateParams.id })
          workflow.hideResolved = false;
        })
        retrieveWorkflowsInformationFromServer(requestReturns)

        $scope.getScreenerComments();

      },
      function () {})


    } // fin retrieveInformationsOnProductFromServer

    const retrieveWorkflowsInformationFromServer = function (requestReturns) {
      ReturnService.getAllReturnsForAProduct(requestReturns, function (result) {
        $scope.product.sharedWorkflow.forEach((workflow) => {
          let allReturns = result[workflow.id]
          allReturns.forEach((aReturn) => {
            if (!aReturn.type_correction) {
              aReturn.type_correction = "";
            }
            if (!aReturn.origin) {
              aReturn.origin = "";
            }
            aReturn.originWithDate = aReturn.origin
            
            if (aReturn.origin == "QC Atmos" || aReturn.origin == "QC 5.1" || aReturn.origin == "QC 20") {
              if (aReturn.qcqclog && aReturn.qcqclog.date) {
                dynamicOriginHashCorrespondance[aReturn.origin + ' ' + aReturn.qcqclog.date] = { qc_id:  aReturn.qcqclog.qc_id, origin: aReturn.origin }
                dynamicOriginHash[aReturn.origin + ' ' + aReturn.qcqclog.date] = aReturn.origin + ' ' + aReturn.qcqclog.date
                dynamicOriginHashWithDate[aReturn.origin + ' ' + aReturn.qcqclog.date] = aReturn.origin + ' ' + aReturn.qcqclog.date
                aReturn.originWithDate = aReturn.origin + ' ' + aReturn.qcqclog.date
              }
              if (!aReturn.qcqclog) {
                aReturn.originWithDate = aReturn.origin + ' '
                dynamicOriginHashWithDate[aReturn.origin + ' '] = aReturn.origin + ' '
              }
              
              
              if (aReturn.qctechnicalissues) {
                aReturn.severity = aReturn.qctechnicalissues.severity
                aReturn.qc_id = aReturn.qctechnicalissues.qc_id
                aReturn.qctechnicalissues.origin = aReturn.origin
                if (aReturn.origin == "QC Atmos") {
                  $scope.qcAtmos.push(aReturn.qctechnicalissues)
                } else if (aReturn.origin == "QC 5.1") {
                  $scope.qc51.push(aReturn.qctechnicalissues)
                } else if (aReturn.origin == "QC 20") {
                  $scope.qc20.push(aReturn.qctechnicalissues)
                }
              }
            }
          })
          workflow.returns = allReturns
        })
        $scope.dynamicOrigin = dynamicOriginHash
        $scope.dynamicOriginWithDate = dynamicOriginHashWithDate

      }, function () {})      
    }
    retrieveInformationsOnProductFromServer()

    // page des chargés de prod, ne peuvent que exporter le fichier de qc pour le partager
    // start qc export funcions
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
    
    $scope.exportQCInfos = function(workflow) {
      $scope.actualWorkflow = workflow.id
      Qc.getQcInfosByWorkflow({
        product_id: $scope.product.id,
        workflow_id: $scope.actualWorkflow
      }, function(qcsStatus){
        $scope.qcsStatus = qcsStatus
      })
      ngDialog.open({
        template: 'views/Dialog/exportQcDialog.html',
        scope: $scope,
        closeByDocument: false
      });
    }


  $scope.exportQC = function(nb_qc){
    const types_of_qc_to_export = []
    for (let i=0; i<=nb_qc; i++) {
      if (document.getElementById("qcExport_"+i) != undefined && document.getElementById("qcExport_"+i) != null && document.getElementById("qcExport_"+i).checked == true) {
        types_of_qc_to_export.push($scope.qcsStatus[i])
      }
    }
    Qc.getQcInfosByWorkflow({
      product_id: $scope.product.id,
      workflow_id: $scope.actualWorkflow
    }, function(qcsStatus){
        $scope.exportFunction($scope.product, types_of_qc_to_export, qcsStatus);
        return false;
    })
  }

  let workflowLanguages
  let workflowTypeDoublages
  $scope.exportFunction = function (product, types_of_qc_to_export, qcsStatus){
    Return.getWorkflowLanguage({}, function(wl){
      workflowLanguages = wl
      Return.getWorkflowTypeDoublage({}, function(wtd){
        workflowTypeDoublages = wtd
          let project_name = product.subproject.project.name
          let subproject_name
          let product_name
          if (product.subproject.nature.name == "serie"){
            subproject_name = "Season" + "_" + product.subproject.season
            product_name = "Episode"  + "_" + product.episode_number
          } else {
            subproject_name = product.subproject.nature.value
            if (product.description) {
              product_name = product.description.value
            } else {
              product_name = product.description_text
            }
          }
          let language = $scope.selectedWorkflowLanguageValue
          let type_doublage = $scope.selectedWorkflowDoublageTypeId 
          
          angular.forEach(workflowLanguages, function(workflowLanguage) {
            if (language == workflowLanguage.value){
              language = workflowLanguage.qc_export_value
            }
          })
          // problem le nom est avec des espaces et vaut mieux eviter dans les noms de fichier, même si ce n'est plus trop grave maintenant
          angular.forEach(workflowTypeDoublages, function(workflowTypeDoublage) {
            if (type_doublage == workflowTypeDoublage.id) {
              type_doublage = workflowTypeDoublage.qc_export_value
            }
          })
          angular.forEach(types_of_qc_to_export, function(element, index) {
            const payload = {
              product_id: product.id,
              request_id: types_of_qc_to_export[index].request_id,
              workflow_id: $scope.actualWorkflow,
              types_of_qc_to_export: types_of_qc_to_export[index].type_qc,
              qcsStatus: [types_of_qc_to_export[index]]
            }
            let qc_type_status_cleaned = element.type_qc.replaceAll('.','_')
            // Les joies de l'asynchrone, les demandes sont envoyées en même temps, un truc à tuer le serveur !!!!
            $http.post(URL_API + '/returns/qcinfos/qcexport', payload,{ responseType: 'arraybuffer' }).then(function (response) {
              let filename = project_name + "_"+ subproject_name + "_" + product_name + "_" + language + "_" + type_doublage + "_" + qc_type_status_cleaned + "_" + element.status + ".xls"
                downloadLink(filename.replace(" ", "_"), response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true)
              })
              .catch(function (error) {
                console.error('Error:', error);
              })
          })
       })
     })
  }

  // end qc export functions

    $scope.updateScreenerProduct = function(product) {
      if (product && (!$scope.product.screener_product || product.screener_product_id != $scope.product.screener_product.screener_product_id)) {
          Product.linkScreenerProducts(
            {
              productId: $scope.product.id,
              screenerProductId: product.screener_product_id,
              branchId: $scope.screenerBranch.id,
            },
            function resolved(response) {
              $scope.product.screener_product = product;
              $scope.product.screener_name = product.name;
              $scope.product.screener_branch_name = $scope.screener_branch_name;
              $scope.screenerProduct = null;
              $scope.screenerProducts = [];
              $scope.getScreenerComments();
            }, function rejected() {
            });
      }
    }

    $scope.setScreenerBranch = function (branch) {
      if (branch.id != $scope.screenerBranch.id) {
        swal({
          title: $rootScope._T["2fzg2ozj"],
          text:  '',
          type: "warning",
          showCancelButton: true,
          confirmButtonText: $rootScope._T["w7redrmn"],
          cancelButtonText: $rootScope._T["adoyhyi2"],
          closeOnConfirm: true,
        }, function(isConfirm) {  
          if (isConfirm) {
            $scope.screenerBranch.id = branch.id
            $scope.screenerBranch.value = branch.value
            var setBranchTimer =  $interval(function () {
              $interval.cancel(setBranchTimer);
        
            }, 1000);
          }
        });
      }
    }

    $scope.getScreenerComments = function() 
    {
      if ($scope.product.screener_product)
        Product.getScreenerComments(
          {
            lanternProductId: $scope.product.id,
            branchId: $scope.screenerBranch.id,
          },
          function resolved(response) {

            $scope.product.sharedWorkflow.forEach(w =>
            {

             if (w.workflow_type.name == 'doublage')
              {
                let returns = {};

                response.comments.forEach(c =>
                {
                  let ret = new Return();
                  ret.tc_in = c.tc_in;
                  ret.tc_out = null;
                  ret.tc_global = c.tc_in == null ? 1 : null;
                  ret.comment = c.comment !== null ? c.comment.trim() : "";
                  ret.screener_comment_id = c.id;
                  ret.type = [];
                  ret.type.name = "Screener";
                  ret.product_id = $scope.product.id;
                  ret.workflow_id = w.id;
                  ret.origin = "Client";
                  ret.person_name = c.lastname + " " + c.firstname;
                  ret.person_id = c.person_id;

                  if (c.audio_lang)
                  {
                    let audioKey = $rootScope._T["xqxiumwk"] + " - " + c.audio_lang;

                    if (!returns[audioKey])
                      returns[audioKey] = [];

                    returns[audioKey].push(ret);
                  }

                  if (c.subtitle_lang)
                  {
                    let subtitleKey = $rootScope._T["7xhlusz8"] + " - " + c.subtitle_lang;

                    if (!returns[subtitleKey])
                      returns[subtitleKey] = [];

                    returns[subtitleKey].push(ret);
                  }

                  if (!c.audio_lang && !c.subtitle_lang)
                  {

                    let lang = $rootScope._T["qpjw4i4r"];

                    if (!returns[lang])
                      returns[lang] = [];

                    returns[lang].push(ret);
                  }
                });

                let langs = Object.keys(returns);
                w.selectedScreenerLang = langs.length > 0 ? langs[0] : null;
                w.screenerLangs = langs;
                w.myReturns = returns;
              }
            });
            
          }, function rejected() {
          });
        else
          $scope.product.sharedWorkflow.forEach(w => {
            w.selectedScreenerLang = [];
            w.screenerLangs = null;
            w.myReturns = [];
          });
    }

    $scope.changeScreenerSelectedLang = function(workflow, lang)
    {
      workflow.selectedScreenerLang = lang;
    }

    $scope.deassociateScreenerProduct = function()
    {
      swal({
        title: $rootScope._T["f67n2fx1"],
        text: "",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: $rootScope._T["mnlbxblr"],
        closeOnConfirm: true
      },
        function () {
          Product.deleteScreenerProductLink(
          {
              lanternProductId: $scope.product.id,
              screenerProductId: $scope.product.screener_product.screener_product_id,
              branchId: $scope.screenerBranch.id,
          },
          function resolved(response) {
            $scope.product.screener_product = null;
            $scope.product.screener_name = null;
            $scope.product.screener_branch_name = null;
            $scope.getScreenerComments();
          }, function rejected() {
          });
        });
    }

    $scope.searchScreenerProducts = function(str)
    {
      if (!str || str.trim() == "" || str.trim().length <= 2)
        $scope.screenerProducts = [];
        else
        {
          Product.searchScreenerProducts(
            {q: str.trim(), branchId: $scope.screenerBranch.id},
            function resolved(response) {
              $scope.screenerProducts = response ? response : [];

              $scope.screenerProducts.forEach(p =>
              {
                p.name = HelperService.getScreenerFullProductName(p);
              });

              $scope.screener_branch_name = $scope.screenerBranch.value

            }, function rejected() {
            });
        }
    }

    Return.getReturnActions({}, function(actions) {
      $scope.actions = actions
    })

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

    $scope.checkTCOut = function (aRet) {
      if (aRet.tc_in && !aRet.tc_out) {
        aRet.tc_out = aRet.tc_in
      }
    }

    $scope.fillTCin = function (aRet) {
      if (aRet.tc_in) {
        const splitted = aRet.tc_in.split(':')
        if (splitted.length == 3) {
          aRet.tc_in += ':00'
        }
      }
    }
    $scope.fillTCout = function (aRet) {
      if (aRet.tc_out) {
        const splitted = aRet.tc_out.split(':')
        if (splitted.length == 3) {
          aRet.tc_out += ':00'
        }
      }
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

    //            Ajout de nouveaux retours
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
      name: $rootScope._T["i5tk31xb"],
      elements: [
        $rootScope._T["ymxw6n6p"],
        $rootScope._T["if1alzc2"],
        $rootScope._T["hi74twhh"]
      ]
    }, {
      name: $rootScope._T["ri4arulz"],
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
    $scope.myReturns = [];
    $scope.addReturns = function(product_id, workflow) {
      let lang = $rootScope._T["qpjw4i4r"];

      if (workflow.myReturns == null) {
        workflow.myReturns = {};
      }

      if (!workflow.myReturns[lang]) {
        workflow.myReturns[lang] = [];
      }

      let ret = new Return();
      ret.product_id = product_id;
      ret.workflow_id = workflow.id;
      ret.user_id = $.cookie('user_id');
      ret.origin = "Client";
      workflow.myReturns[lang].push(ret);

      if (!workflow.screenerLangs)
          workflow.screenerLangs = [];

      if (workflow.screenerLangs.indexOf(lang) == -1)
          workflow.screenerLangs.push(lang)

      workflow.selectedScreenerLang = lang;
    };

    $scope.deleteThisRet = function(indexRet, workflow) {

      let myRet = workflow.myReturns[workflow.selectedScreenerLang][indexRet];
      workflow.myReturns[workflow.selectedScreenerLang].splice(indexRet, 1);
      if (myRet.id != null)
        myRet.$delete({
          id: myRet.id
        });
    };
 
    $scope.deleteReturn = function(aReturn) {
      
      swal({
        title: $rootScope._T["8ggwt2ug"],
        text: $rootScope._T["l2exdiv9"],
        type: "warning",
        showCancelButton: true,
        confirmButtonText: $rootScope._T["w7redrmn"],
        cancelButtonText: $rootScope._T["adoyhyi2"],
        closeOnConfirm: true
      }, function() {
        aReturn.$delete({
          id: aReturn.id
        });
        $state.reload();
      });
    };

    $scope.deleteSelectedReturns = function(returns) {
      swal({
        title: $rootScope._T["xi0fesih"],
        text: $rootScope._T["mk1syw68"],
        type: "warning",
        showCancelButton: true,
        confirmButtonText: $rootScope._T["w7redrmn"],
        cancelButtonText: $rootScope._T["adoyhyi2"],
        closeOnConfirm: true
      }, function() {
        returns = $scope.getReturnsSelected(returns);
        returns.forEach(function(aReturn) {
          let returnObject = new Return(aReturn)
          returnObject.$delete({
            id: returnObject.id
          });
        })
        $state.reload();
      });
    };



    $scope.errors = {}

    $scope.publishRet = function(workflow) {
      $scope.actualWorkflowComplete = workflow
      
      $scope.errors = {}
      let lengthMyReturns= workflow.myReturns[workflow.selectedScreenerLang].length;
      let returnCountSaved = 0;
      let someErrors = false
      workflow.myReturns[workflow.selectedScreenerLang].forEach(function(aRet, index) {
        if (aRet.origin && dynamicOriginHashCorrespondance[aRet.origin]) {
          let origin = dynamicOriginHashCorrespondance[aRet.origin].origin
          let qc_id = dynamicOriginHashCorrespondance[aRet.origin].qc_id
          aRet.origin = origin
          aRet.qc_id = qc_id
        }
        if (aRet.comment.match(/\[/)) {
          aRet.comment = ''
        }
        if (!aRet.typeElement) {
          $scope.errors.tc = $rootScope._T["lmwlyuq5"] + ' required'
          someErrors = true
        } else {
          aRet.type = aRet.typeElement.value
          if (aRet.comment) {
            if (aRet.comment.match(/:/)) {
              const commentSplitted = aRet.comment.split(':')
              commentSplitted[0] = commentSplitted[0].replaceAll(/\s*$/g, '')
              if ($scope.returnTypesHash[commentSplitted[0]]) {
                aRet.element = commentSplitted[0]
              }
            }

          } else {
            $scope.errors.comments = $rootScope._T["y43zftwq"] + ' comments'
            someErrors = true
          }

        }
        if (!aRet.tc_global) {
          if (!aRet.tc_in) {
            $scope.errors.tc = $rootScope._T["y43zftwq"] + ' tc_in'
            someErrors = true
          }
          if (aRet.tc_in && !aRet.tc_out) {
            $scope.errors.tc = $rootScope._T["y43zftwq"] + ' tc_out'
            someErrors = true
          }
        }
        if (aRet.comment) {
          if (aRet.comment.match(/:/)) {
            const commentSplitted = aRet.comment.split(':')
            commentSplitted[0] = commentSplitted[0].replaceAll(/\s*$/g, '')
            if ($scope.returnTypesHash[commentSplitted[0]]) {
              aRet.element = commentSplitted[0]
            }
          } else {
            if (aRet.origin != 'Client') {
              $scope.errors.comments = $rootScope._T["y43zftwq"] + ' comment 1'
              someErrors = true
            }
          }
        } else {
          if (aRet.origin != 'Client') {
            $scope.errors.comments = $rootScope._T["y43zftwq"] + ' comment 2'
            someErrors = true
          }
        }
        if (aRet.origin != 'Client') {
          if (!aRet.channel) {
            $scope.errors.channel = $rootScope._T["y43zftwq"] + ' channel'
            someErrors = true
          }
          if (!aRet.severity) {
            $scope.errors.severity = $rootScope._T["y43zftwq"] + ' severity'
            someErrors = true
          }
        }
        // retour screener aucun contrôle
        if (aRet.screener_comment_id) {
          someErrors = false
        }
        if (!someErrors) {
          if (aRet.typeElement) {
            aRet.type = aRet.typeElement.value
          }
          if (typeof aRet.type == 'object') {
            aRet.type = null
          }
          delete aRet.typeElement;
          let returnObject = new Return(aRet)
          returnObject.$save({}, function() {
            returnCountSaved++;
            // une seule demande en retour, c'est sage :)
            if (returnCountSaved == lengthMyReturns) {
              let requestReturns = []

              workflow.returns = [];
              const filters = [{
                "name": "workflow_id",
                "value": workflow.id
              }, {
                "name": "product_id",
                "value": $stateParams.id
              }];

              ReturnService.getReturnsBy({filters: [filters]},
                function (returns) {
                  angular.forEach(returns, function(aReturn) {
                    objectInArray(aReturn.ownComment)
                    if(!aReturn.type_correction) {
                      aReturn.type_correction = "";
                    }
                    if(!aReturn.origin) {
                      aReturn.origin = "";
                    }
                  })
                  workflow.returns = returns
                  $scope.selectWorkflow(workflow)
                },
                function () {}
              )

            }
            $scope.canActiveComments = false
          });
          workflow.myReturns[workflow.selectedScreenerLang] = []
          
          $scope.getScreenerComments();
        }
      });
    };

    $scope.addCommentOnReturn = function(aReturn) {
      let newComment = new Comment();
      newComment.text = aReturn.newComment;
      newComment.user_id = $.cookie('user_id');
      newComment.return_id = aReturn.id;
      newComment.context = $rootScope._T["hmvhq73h"]

      newComment.$save(function() {
        aReturn.newComment = "";
        Return.get({
          id: aReturn.id
        }, function(updateReturn) {
          Notification.success($rootScope._T["qx8ugeza"]);
          aReturn.ownComment = updateReturn.ownComment;
          aReturn.showSubmitComment = false;
        }, function() {
          Notification.error($rootScope._T["zrlc1k8e"]);
        });

      });
    };

    $scope.addTypeCorrectionOnReturn = function(aReturn) {
      let updatedReturn = new Return();
      updatedReturn.type_correction = aReturn.type_correction;
      updatedReturn.type_correction_comment = aReturn.type_correction_comment;
      updatedReturn.$update({
        value: {"id": aReturn.id}
      }, function(data) {
        Notification.success($rootScope._T["7ugmkq2a"]);
        aReturn.showSubmitTypeCorrection = false;
      }, function(data) {
        Notification.error($rootScope._T["zrlc1k8e"]);
        return "Error " + data.status + " : " + data.statusText;
      });
    }

    $scope.addProdReturn = function(aReturn) {
      let updatedReturn = new Return();
      updatedReturn.prod_comment = aReturn.prod_comment;
      if(aReturn.return_of_return) {
        updatedReturn.return_of_return = 1;
        updatedReturn.return_of_return_value = aReturn.return_of_return_value;
      } else {
        updatedReturn.return_of_return = null;
        updatedReturn.return_of_return_value = null;
      }
      updatedReturn.$update({
        value: {"id": aReturn.id}
      }, function(data) {
        Notification.success($rootScope._T["pbrudd7m"]);
        aReturn.showSubmitProdReturn = false;
      }, function(data) {
        Notification.error($rootScope._T["zrlc1k8e"]);
        return "Error " + data.status + " : " + data.statusText;
      });
    }

    $scope.newRequestFromReturn = function(workflow) {
      let returnsSelected = $filter('filter')(workflow.returns, {
        selected: true
      });
      let count = 0;
      let size = returnsSelected.length;
      if (returnsSelected.length != 0) {
        let allReturnsId = [];
        returnsSelected.forEach(
          function(aReturn, index) {
            //Stocker l'ID du retour
            allReturnsId.push(aReturn.id);
            count++;
            if (count == size) {
              CreateRequestService.createRequestDialog($scope.product.id, workflow.id, null, allReturnsId.join(), null,null, workflow);
            }

          }
        )

      }
    };

    /**
     *  Manage popup to add return to request, page is opened apart from suiviprod.
     *  BUT  when popup is closed, all is reloaded (window.location.reload()) and cleaned
     *    Not good idea, page must be just reloaded and then closed
     */

    $scope.addReturnsToRequest = function(workflow) {
      let returnsSelected = $filter('filter')(workflow.returns, {
        selected: true
      });

      if (returnsSelected.length != 0) {
        let allReturnsId = [];
        returnsSelected.forEach(function(aReturn, index) {
          allReturnsId.push(aReturn.id);
        });
        $scope.workflow = workflow;
        $scope.allReturnsId = allReturnsId.join();

        let dialog = ngDialog.open({
          className: 'ngdialog-theme-demand popup',
          width: '80%',
          scope: $scope,
          template: 'views/Dialog/addReturnsToRequestDialog.html',
          controller: 'AddReturnsToRequestDialogCtrl',
          closeByDocument: false
        });
        dialog.closePromise.then(function(data) {
          if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
            window.location.reload();
          }
        });
      }

    }
    // Extraire les users depuis la liste myReturns
    // abandonné
    const extractUserList = function(importJson){
      let listUser = [];
        if (importJson != null) {
            importJson.forEach(function(aReturn) {
                    if(listUser.indexOf(aReturn.user) !== -1){
                      return true;
                  } else{
                      listUser.push(aReturn.user)
                  }
            });
        }
      return listUser;
    }


    $scope.canActiveComments = false
    $scope.selectReturnType = function (ti, $select) {
      $scope.canActiveComments = true
    }
    $scope.canEnableComment = function () {
      if ($scope.canActiveComments) {
        return false
      }
      return true
    }

    // fonctions de la page html
    $scope.selectAll = function(workflow) {
      let returns
      if (workflow.filterOrigin) {
        if (workflow.filterOrigin.match(/\d{4}-\d{2}-\d{1}/)) {
          returns = $filter('filter')(workflow.returns, {
            originWithDate : workflow.filterOrigin,
            type_correction: workflow.filterTypeCorrection
          });
        } else {
          returns = $filter('filter')(workflow.returns, {
            origin: workflow.filterOrigin,
            type_correction: workflow.filterTypeCorrection
          });
        }
      } else {
        returns = $filter('filter')(workflow.returns, {
          origin: workflow.filterOrigin,
          type_correction: workflow.filterTypeCorrection
        });
      }

      returns = $filter('magicFilterReturnUsername')(returns, workflow.filterAuthor);
      returns = $filter('filterReturnsResolved')(returns, workflow.hideResolved);
      returns = $filter('filterReturnsAction')(returns, workflow.filterAction);
      returns.forEach(function(aReturn) {
        aReturn.selected = workflow.master;
      });
    };

    $scope.cancelSelect = function(workflow) {
      workflow.master = false;
      workflow.returns.forEach(function(aReturn) {
        aReturn.selected = false;
      });
    }

    $scope.getReturnsSelected = function(returns) {
      let returnsSelected = $filter('filter')(returns, {
        selected: true
      });

      return returnsSelected;
    }

    $scope.isReturnSelected = function(returns) {
      return $scope.getReturnsSelected(returns).length > 0
    };

    $scope.countReturns = function(allReturns) {
      let count = 0;
      allReturns.forEach(function(aReturn) {
        if (aReturn.is_ignored != 1 && aReturn.is_resolved != 1) {
          count++;
        }
      });
      return count;
    };

    $scope.count = function(objects) {
      let count = 0;
      angular.forEach(objects, function() {
        count++;
      });
      return count;
    };

    $scope.doneEditing = function(value, aReturn) {
      if (value == "tc_in" && aReturn.tc_in != null && aReturn.tc_in.length == 8) {
        aReturn.tc_in += ":00";
      }
      if (value == "tc_out" && aReturn.tc_out != null && aReturn.tc_out.length == 8) {
        aReturn.tc_out += ":00";
      }
      let updatedReturn = new Return();
      updatedReturn[value] = aReturn[value];
      updatedReturn.$update({
        value: {"id": aReturn.id}
      }, function(data) {
        Notification.success($rootScope._T["y9n4h1dc"]);
      }, function(data) {
        return "Error " + data.status + " : " + data.statusText;
      });
    };

    $scope.exportReturns = function(idExportable) {

      let header = '<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">';
      let blob = new Blob([header + document.getElementById(idExportable).innerHTML], {
        type: "data:application/vnd.ms-excel;charset=UTF-8"
      });

      saveAs(blob, $scope.product.human_description + ".xls");
    };

    $scope.selectWorkflow = function(workflow) {
      $scope.actualWorkflow = workflow.id
      $scope.selectedWorkflowLanguageValue  = workflow.language.value;
      $scope.selectedWorkflowLanguageId = workflow.language_id;
      $scope.selectedWorkflowDoublageTypeId = workflow.doublage_type_id;
      angular.forEach($scope.product.sharedWorkflow, function(wf, key) {
        if (wf.id == workflow.id) {
          $scope.selectedWorkflowId = workflow.id;
          wf.isSelected = true;
          $scope.selectedWorkflowId = workflow.id;
        } else {
          wf.isSelected = false;
        }
      });
      // refait liste des origines
      dynamicOriginHash = {}
      $scope.dynamicOrigin = {}
      dynamicOriginHashWithDate = {}
      $scope.dynamicOriginWithDate = {}
      let allReturns = workflow.returns
      allReturns.forEach((aReturn) => {
        aReturn.originWithDate = aReturn.origin
        if (workflow.id == aReturn.workflow_id) {
          if (aReturn.origin == "QC Atmos" || aReturn.origin == "QC 5.1" || aReturn.origin == "QC 20") {
            if (aReturn.qcqclog && aReturn.qcqclog.date) {
              dynamicOriginHashCorrespondance[aReturn.origin + ' ' + aReturn.qcqclog.date] = { qc_id:  aReturn.qcqclog.qc_id, origin: aReturn.origin }
              dynamicOriginHash[aReturn.origin + ' ' + aReturn.qcqclog.date] = aReturn.origin + ' ' + aReturn.qcqclog.date
              dynamicOriginHashWithDate[aReturn.origin + ' ' + aReturn.qcqclog.date] = aReturn.origin + ' ' + aReturn.qcqclog.date
              aReturn.originWithDate = aReturn.origin + ' ' + aReturn.qcqclog.date
            }
            if (!aReturn.qcqclog) {
              aReturn.originWithDate = aReturn.origin + ' '
              dynamicOriginHashWithDate[aReturn.origin + ' '] = aReturn.origin + ' '
            }
          }
        }
      })
      $scope.dynamicOrigin = dynamicOriginHash
      $scope.dynamicOriginWithDate = dynamicOriginHashWithDate
    };

    $scope.validateTC = function(data) {
      if (data.match(/\d{2}:\d{2}:\d{2}(:\d{2})?/) || data == "") {
        return true;
      } else {
        return "Timecode format hh:mm:ss:ii ou hh:mm:ss";
      }
    }

    $scope.typesCommentForSelect= []
    $scope.typesReturnForSelect = [];
    $scope.returnTypesHash = {}
      Return.getReturnType({
      }, function(type_return) {
        $scope.return_types = type_return

        angular.forEach($scope.return_types.return_type_categorie, function(categorie) {
          $scope.typesCommentForSelect.push(categorie)
          $scope.typesReturnForSelect.push(categorie)
          angular.forEach($scope.return_types.return_type, function(type) {
            $scope.returnTypesHash[type.value] = true
            if (categorie.id == type.return_type_categorie_id){
              let typeReturn = {};
              typeReturn.type = categorie.value;
              typeReturn.element = type.value;
              $scope.typesCommentForSelect.push(typeReturn)
            }
          });
        });
      });

  }
]);
