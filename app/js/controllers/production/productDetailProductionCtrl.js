Lantern.controller('ProductDetailProductionCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Product', 'Workflow', 'Request', 'Observation', '$location', '$state', 'Session', 'ProductService', 'Notification', 'ContextualInfo', 'Attachments', '$window', 'CreateRequestService', 'PersonsService', 'RequestService', 'WorkflowHelperService', 'UsersService', 'FileUploader', 'HelperService',
  function($rootScope, $scope, $cookies, $stateParams, $filter, ngDialog, Product, Workflow, Request, Observation, $location, $state, Session, ProductService, Notification, ContextualInfo, Attachments, $window, CreateRequestService, PersonsService, RequestService, WorkflowHelperService, UsersService, FileUploader, HelperService) {
    // page associée app/views/production/productDetailProd.html
    $scope.searchFactoryUsers = [];
    $scope.factoryUsersOld = [];
    $scope.factoryUsers = [];
    $scope.transformHourInI18nFormat = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)
    $scope.getMomentFormatWithHour = getMomentFormatWithHour($rootScope.user_entity.person.branch_id)

    $scope.isDubxUploadInvalid = false;
    $scope.dubxUploaderFileItem = null;
    $scope.dubxUploader = new FileUploader({
      url: URL_API + `/erytmo/dubx`,
      headers: {
        'auth-token': Session.token(),
        'app-code': Session.appCode(),
        'branch': Session.branchId(),
      },
      filters: [
        {
          fn: function (item) {
            return item && item.name.split('.').pop() == 'dubx';
          },
        },
      ],
    });

    $scope.downloadDubxScript = function (dubx) {
      ProductService.downloadDubxScript({
        dubxId: dubx.id
      }, function(response) {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        let filename = HelperService.getFilenameFromResponse(response);
        if (!filename) {
          filename = `${$scope.product.human_description}${(dubx.reel ? "_R" + dubx.reel : "")}_${dubx.tag}${dubx.lang ? "_" + dubx.lang : ""}_${dubx.fps}.docx`;
          filename = filename.replace(/ /g, '_');
        }

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }, function(error) {
        Notification.error($rootScope._T["zrlc1k8e"]);
      });
    }

    $scope.dubxUploader.onAfterAddingFile = function (fileItem) {
      $scope.isDubxUploadInvalid = false;
      $scope.dubxUploaderFileItem = fileItem;
      $scope.showDubxTagsDialog();
    };
    $scope.dubxUploader.onWhenAddingFileFailed = function (file) {
      $scope.isDubxUploadInvalid = true;
      $scope.dubxUploaderFileItem = null;
    };

    $scope.getReelsCount = function(number_reel) {
      if (!number_reel)
        return 0;

      let m = number_reel.toString().match(/^\d{1,2}$/);
      return m ? +m[0] : 0;
    }

    $scope.showDubxTagsDialog = function () {
      const dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/dubxTagsDialog.html',
        scope: $scope,
        controller: 'DubxTagsDialogCtrl',
        closeByDocument: false,
      });

      dialog.closePromise.then(function (data) {
        $scope.dubxUploaderFileItem = null;
        $scope.dubxUploader.clearQueue();

        if (data.value != '$closeButton' && data.value != '$escape') {
          $state.reload();
        }
      });
    };

    $scope.role = Session.role();
    if ($stateParams.workflow_id != null) {
      $scope.specificWorkflowId = $stateParams.workflow_id;
    }
    $rootScope.showLoading++;
    Product.queryFalse({
      productId: $stateParams.id
    }, function(product) {
      $rootScope.showLoading--;
      var filtersRequest = [{
        "name": "product_id",
        "value": product.id
      }];

      $scope.factoryUsers = product.factory_access;
      angular.copy($scope.factoryUsers, $scope.factoryUsersOld);

      if (product.dubxes) {
        for (let dubx of product.dubxes) {
          if (dubx.detection_date)
            dubx.detectionDate = moment(dubx.detection_date).format("d MMM YYYY HH:mm");
          if (dubx.adaptation_date)
            dubx.adaptationDate = moment(dubx.adaptation_date).format("d MMM YYYY HH:mm");
        }
      }

      $scope.$watch('factoryUsers', function(nv, ov){
        if ($scope.factoryUsers.some(u => !$scope.factoryUsersOld.some(u2 => u.id == u2.id)) || $scope.factoryUsersOld.some(u => !$scope.factoryUsers.some(u2 => u.id == u2.id)))
        {
          var userIds = [];

          $scope.factoryUsers.forEach(user => userIds.push(user.id));
          ProductService.updateFactoryAccess({productId: $stateParams.id, userIds: userIds}, 
          function () {
            angular.copy($scope.factoryUsers, $scope.factoryUsersOld);
          }, function(error) {
            Notification.error(error);
          });
        }
      });

      $scope.requests = Request.getRequestsBy({
        filters: [filtersRequest]
      }, function(requests) {

        angular.forEach(requests, function(request) {
          let farmerbookings = objectInArray(request.ownFarmerbookings);
          let bookings = [];
          angular.forEach(farmerbookings, function(booking) {
            if (booking.booking_id != null) {
              bookings.push(booking);
            }
          });
          request.ownFarmerbookings = bookings;
          request.description_date = '';
          if (request.date_creation != null) {
            request.last_date = $rootScope._T["h59hzp19"] + ' ' + moment(request.date_creation).fromNow() + ', ' + $rootScope._T["z0t6p7pd"] + ' ' + moment(request.date_creation).format($scope.getMomentFormatWithHour());
            request.description_date += request.last_date + '<br>'
          }
          if (request.planification_date != null) {
            request.last_date = $rootScope._T["5dd4lerz"] + ' ' + moment(request.planification_date).fromNow() + ', ' + $rootScope._T["z0t6p7pd"] + ' ' + moment(request.planification_date).format($scope.getMomentFormatWithHour());
            request.description_date += request.last_date + '<br>'
          }
          if (request.closing_date != null) {
            request.last_date = $rootScope._T["46z910du"] + ' '  + moment(request.closing_date).fromNow() + ', ' + $rootScope._T["z0t6p7pd"] + ' ' + moment(request.closing_date).format($scope.getMomentFormatWithHour());
            request.description_date += request.last_date + '<br>'
          }
          if (request.is_canceled == 1) {
            request.last_date = $rootScope._T["yp9tp27g"]
            request.description_date += request.last_date + '<br>'
          }

          request.ownObservation = objectInArray(request.ownObservation)

          request.observations = [];
          request.workflow.color = colorizeWorkflow(request.workflow);


          //   Observation.querybyrequestid({request_id: value.id}, function (obs) {
          //       $rootScope.showLoading--;
          //       obs.forEach(function (ob) {
          //         ob.date_creation = moment(ob.date_creation).format("dddd Do MMMM YYYY")
          //           value.observations.push(ob);
          //       });
          //   });
        });
      });

      PersonsService.getArtisticDirectors(function(artisticDirectors) {
        $scope.artisticDirectors = artisticDirectors;
      });

      $scope.isShowSaveDirector = false;
      $scope.showSaveDirector = function() {
        $scope.isShowSaveDirector = true;
      }

      $scope.isShowSaveCoDirector = false;
      $scope.showSaveCoDirector = function() {
        $scope.isShowSaveCoDirector = true;
      }

      var isFirst = true;
      $scope.countWorkflow = 0;
      angular.forEach(product.sharedWorkflow, function(workflow, key) {
        workflow.color = colorizeWorkflow(workflow);

        workflow.description = WorkflowHelperService.describeWorkflow(workflow);
        if ($scope.specificWorkflowId != null && workflow.id == $scope.specificWorkflowId) {
          workflow.isSelected = true;
          $scope.selectedWorkflowId = workflow.id;
        } else if (!$scope.specificWorkflowId && isFirst) {
          workflow.isSelected = true;
          $scope.selectedWorkflowId = workflow.id;
          isFirst = false;
        } else {
          workflow.isSelected = false;
        }
        $scope.countWorkflow++;
      });

      if(product.number_reel) {
        product.number_reel = parseInt(product.number_reel);
      }
      if (product.air_date != null && product.air_date != "") {
        product.air_date = moment(product.air_date, "YYYY-MM-DD").format("DD/MM/YYYY");
      }
      product.ownContextualInfos = ContextualInfo.byProductId({
        product_id: product.id
      });

      product.ownAttachments = Attachments.byProductId({
        product_id: product.id
      });

      $scope.product = product;
    });


    $scope.popoverTrick = false;
    $scope.closePopover = function() {
      $scope.popoverTrick = !$scope.popoverTrick;
    }

    $scope.doneEditing = function(element) {
      var data = {};
      if (element == "air_date" && $scope.product[element] != "") {
        data[element] = moment($scope.product[element], validDateFormat, true).format("YYYY-MM-DD");
      } else {
        data[element] = $scope.product[element];
      }
      ProductService.updateProduct({
        id: $scope.product.id
      }, data, function(product) {
        Notification.success($rootScope._T["xidwkts7"]);
        if (element == "artistic_director_id") {
          $scope.isShowSaveDirector = false;
        }
        if (element == "co_artistic_director_id") {
          $scope.isShowSaveCoDirector = false;
        }
        if (element == "number_reel") {
          $scope.product.reels_count = $scope.getReelsCount($scope.product[element]);
        }
      }, function(error) {
        Notification.error($rootScope._T["zrlc1k8e"]);
      });
    };

    $scope.workflowSelected = function(workflow) {
      var show = false;
        angular.forEach($scope.product.sharedWorkflow, function(wf, key) {
          if (wf.id == workflow.id) {
            if (wf.isSelected) {
              show = true;
            }
          }
        });
      return show;
    };

    $scope.selectWorkflow = function(workflow) {
      angular.forEach($scope.product.sharedWorkflow, function(wf, key) {
        if (wf.id == workflow.id) {
          wf.isSelected = true;
          $scope.selectedWorkflowId = wf.id;
        } else {
          wf.isSelected = false;
        }
      });
      $scope.closePopover();
    };



    $scope.applyWorkflowFilter = function(workflow) {
      if (workflow.selectedWorkflow != 1) {
        angular.forEach($scope.product.sharedWorkflow, function(workflow) {
          workflow.selectedWorkflow = false;
        });

        workflow.selectedWorkflow = 1;
        $scope.selectedWorkflowFilter = workflow;


        var filtersRequest = [{
          "name": "workflow_id",
          "value": workflow.id
        }, {
          "name": "product_id",
          "value": $scope.product.id
        }];
        $scope.requests = Request.getRequestsBy({
          filters: [filtersRequest]
        });


      } else {
        workflow.selectedWorkflow = 0;
        $scope.selectedWorkflowFilter = null;
      }

    };

    $scope.editProduct = function() {

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/subprojectEditDialog.html',
        scope: $scope,
        controller: 'EditSubprojectDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function(data) {
        if (data.value != "$closeButton" && data.value != "$escape") {
          $state.reload();
        }
      });

    }

    $scope.returnContextInfo = function(name, selectedWorkflowId) {
      var info = {};
      var found = false;
      if ($scope.product != null && $scope.product.ownContextualInfos != null) {
        $scope.product.ownContextualInfos.forEach(function(contextinfo) {
          if (contextinfo.workflow_id == selectedWorkflowId && contextinfo.name == name && !found) {
            info = contextinfo;
            if (name == "ordre_diff") {
              info.value = parseInt(info.value);
            }
            found = true;
          }
        });
      }
      return info;
    };

    var validDateFormat = ["DD/MM/YYYY", "DD/MM/YY", "DD/M/YYYY", "DD/M/YY", "D/MM/YYYY", "D/MM/YY", "D/M/YYYY", "D/M/YY", "DD/MM", "DD/M", "D/MM", "D/M", "DD-MM-YYYY", "DD-MM-YY", "DD-M-YYYY", "DD-M-YY", "D-MM-YYYY", "D-MM-YY", "D-M-YYYY", "D-M-YY", "DD-MM", "DD-M", "D-MM", "D-M"];

    $scope.validateDate = function(data) {
      if (moment(data, validDateFormat, true).isValid() || data == "") {
        return true;
      } else {
        return $rootScope._T["n5ix7my4"]
      }
    }

    $scope.doneEditingContextual = function(context, element) {
      if (context.id != null && context.id != 0) {
        updatedContext = new ContextualInfo();
        updatedContext.value = context.value;
        if ((element == "due_date" || element == "sortie_france") && updatedContext.value != "") {
          updatedContext.value = moment(updatedContext.value, validDateFormat, true).format("DD/MM/YYYY");
        }
        updatedContext.$update({
          id: context.id
        }, function(data) {
          $scope.product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: $scope.product.id
          });
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      } else {
        newContext = new ContextualInfo();
        newContext.value = this.$data;
        if ((element == "due_date" || element == "sortie_france") && newContext.value != "") {
          newContext.value = moment(newContext.value, validDateFormat, true).format("DD/MM/YYYY");
        }
        newContext.name = element;
        newContext.product_id = $scope.product.id;
        newContext.workflow_id = $scope.selectedWorkflowId;
        newContext.$save({}, function(data) {
          //Récupération des infos contextuelles
          $scope.product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: $scope.product.id
          });
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      }
    };

    $scope.copyContextualInfo = function(element, workflow) {
      var value = $scope.returnContextInfo(element, $scope.selectedWorkflowId).value;
      var context = $scope.returnContextInfo(element, workflow.id);
      if (context.id != null && context.id != 0) {
        updatedContext = new ContextualInfo();
        updatedContext.value = value;
        updatedContext.$update({
          id: context.id
        }, function(data) {
          $scope.product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: $scope.product.id
          });
          Notification.success($rootScope._T["3w2ao4kz"]);
          $scope.closePopover();
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      } else {
        newContext = new ContextualInfo();
        newContext.value = value;
        newContext.name = element;
        newContext.product_id = $scope.product.id;
        newContext.workflow_id = workflow.id;
        newContext.$save({}, function(data) {
          $scope.product.ownContextualInfos = ContextualInfo.byProductId({
            product_id: $scope.product.id
          });
          Notification.success($rootScope._T["3w2ao4kz"]);
          $scope.closePopover();
        }, function(data) {
          return "Error " + data.status + " : " + data.statusText;
        });
      }
    }

    $scope.attachmentsOnWorkflow = function(selectedWorkflowId) {
      var allAttachments = [];
      if ($scope.product != null && $scope.product.ownAttachments != null) {
        $scope.product.ownAttachments.forEach(function(attachment) {
          if (attachment.workflow_id == selectedWorkflowId) {
            allAttachments.push(attachment);
          }
        });
      }
      return allAttachments;
    };

    $scope.download = function(attachment) {
      $window.open(URL_API + "/attachments/download/" + attachment.id + "?filesize=" + attachment.filesize + "&token=" + $.cookie('token'), '_blank');
    };

    $scope.workflowHasRequest = function() {
      var found = false;
      angular.forEach($scope.requests, function(request) {
        if (request.workflow.id == $scope.selectedWorkflowId) {
          found = true;
        }
      })
      return found;
    }

    $scope.newRequestFromProduct = function() {
      CreateRequestService.createRequestDialog($scope.product.id, $scope.selectedWorkflowId, null, null, null,null);
    }

    $scope.showBtnLink = function() {
      let count = 0;
      angular.forEach($scope.requests, function(request) {
        if (request.selected && request.workflow.id == $scope.selectedWorkflowId) {
          count++;
        }
      });
      return count > 1;
    }

    $scope.linkRequests = function() {
      let requestsToLink = [];
      angular.forEach($scope.requests, function(request) {
        if (request.selected && request.workflow.id == $scope.selectedWorkflowId) {
          requestsToLink.push(request.id);
          request.selected = false;
        }
      });
      let request_ids = requestsToLink.toString();
      RequestService.linkRequests({"request_ids": request_ids}, function(success) {
        Notification.success($rootScope._T["flko4ojd"]);
      }, function(error) {
        Notification.error($rootScope._T["lpi2kquw"]);
      });
    }

    $scope.searchUsers = function(text)
    {
      if (!text || text.trim() == "" || text.trim().length <= 2)
        $scope.searchFactoryUsers = [];
        else
        {
          UsersService.searchUser(
            {q: text.trim(), appCode: APP_CODE_FACTORY},
            function resolved(response) {
              $scope.searchFactoryUsers = response ? response : [];
            }, function rejected() {
            });
        }
    };
  }
]);
