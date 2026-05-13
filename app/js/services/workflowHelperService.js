Lantern.factory("WorkflowHelperService", ["$rootScope", 'ValueListService',
  function($rootScope, ValueListService) {
    const service = {}

    // added in uib-tooltip-html, tooltip
    service.describeWorkflow = workflow => {
      // workflow.color = colorizeWorkflow(workflow);
    let description = "";
    if (workflow.exploitation != null) {
      var fa = "";
      if (workflow.workflow_type_id == 1) {
        fa = "fa fa-microphone";
      } else if (workflow.workflow_type_id == 2) {
        fa = "fa fa-archive";
      } else {
        fa = "fa fa-briefcase";
      }
      if (workflow.workflow_type != null) {
        description +=
          '<span class="' +
          fa +
          '"></span> ' + $rootScope._T["2w7jtwr8"] + ' : ' +
          workflow.workflow_type.value +
          "<br/>";
      }
    }
    if (workflow.servicing_type != null) {
      description +=
        '<span class="glyphicon glyphicon-random"></span> ' + $rootScope._T["fa1lnlij"] + ' : ' +
        workflow.servicing_type.value +
        "<br/>";
    }
    if (workflow.diffuseur != null) {
      description +=
        '<span class="glyphicon glyphicon-user"></span> ' + $rootScope._T["irlv7lue"] + ' : ' +
        workflow.diffuseur.name +
        "<br/>";
    }
    if (workflow.resolution != null) {
      description +=
        '<span class="glyphicon glyphicon-fullscreen"></span> ' + $rootScope._T["wrctg8ou"] + ' : ' +
        workflow.resolution.value +
        "<br/>";
    }
    if (workflow.layout != null) {
      description +=
        '<span class="glyphicon glyphicon-sound-5-1"></span> ' + $rootScope._T["8izp2is4"] + ' : ' +
        workflow.layout.value +
        "<br/>";
    }
    if (
      workflow.dolbye != null &&
      workflow.dolbye == 1 &&
      workflow.workflow_type_id == 3
    ) {
      description +=
        '<span class="glyphicon glyphicon-fullscreen"></span> DolbyE : ';
      if (workflow.dolbye == 1) {
        description += "DolbyE";
      }
      description += "<br/>";
    }
    if (workflow.dynamic_process != null) {
      description +=
        '<span class="glyphicon glyphicon-headphones"></span> ' + $rootScope._T["0c1vz2jl"] + ' : ' +
        workflow.dynamic_process +
        "<br/>";
    }
    if (workflow.type_audio_process != null) {
      description +=
        '<span class="glyphicon glyphicon-headphones"></span> ' + $rootScope._T["iprheja8"] + ' : ' +
        workflow.type_audio_process +
        "<br/>";
    }
    if (workflow.subtitle != null) {
      description +=
        '<span class="glyphicon glyphicon-font"></span> ' + $rootScope._T["7xhlusz8"] + ' : ' +
        workflow.subtitle +
        "<br/>";
    }
    if (workflow.nature_subtitle != null) {
      description +=
        '<span class="glyphicon glyphicon-font"></span> ' + $rootScope._T["luewrctg"] + ' : ' +
        workflow.nature_subtitle +
        "<br/>";
    }
    if (workflow.projector_aspect != null) {
      description +=
        '<span class="glyphicon glyphicon-facetime-video"></span> ' + $rootScope._T["gknlq48m"] + ' : ' +
        workflow.projector_aspect +
        "<br/>";
    }
    if (workflow.dcp_standard != null) {
      description +=
        '<span class="glyphicon glyphicon-film"></span> ' + $rootScope._T["ov1sc0ni"] + ' : ' +
        workflow.dcp_standard +
        "<br/>";
    }
    if (workflow.exploitation != null) {
      description +=
        '<span class="c-icon c-icon-display"></span> ' + $rootScope._T["hbtvjrk1"] + ' : ' +
        workflow.exploitation.value +
        "<br/>";
    }
    if (workflow.language != null) {
      description +=
        '<span class="glyphicon glyphicon-flag"></span> ' + $rootScope._T["awbb7v9i"] + ' : ' +
        workflow.language.value +
        "<br/>";
    }
    if (workflow.prod_version != null) {
      description +=
        '<span class="glyphicon glyphicon-user"></span> ' + $rootScope._T["zb2ecoll"] + ' : ' +
        workflow.prod_version +
        "<br>";
    }
    if (workflow.speed != null) {
      description +=
        '<span class="c-icon c-icon-format"></span> ' + $rootScope._T["noa1wtgc"] + ' : ' +
        workflow.speed.value +
        "<br>";
    }

    if (workflow.format_mix != null) {
      description +=
        '<span class="c-icon c-icon-sound"></span> ' + $rootScope._T["vob2snrb"] + ' : ' +
        workflow.format_mix.value +
        "<br/>";
    }
    if (workflow.norme_mix != null) {
      description +=
        '<span class="c-icon c-icon-activity"></span> ' + $rootScope._T["w4ftlimj"] + ' : ' +
        workflow.norme_mix.value +
        "<br/>";
    }
    if (workflow.doublage_type != null) {
      description +=
        '<span class="glyphicon glyphicon-volume-up"></span> ' + $rootScope._T["ny77u59l"] + ' : ' +
        workflow.doublage_type.value +
        "<br/>";
    }
    if (workflow.dub_place != null) {
      description +=
        '<span class="c-icon c-icon-loc"></span> ' + $rootScope._T["nytpo4zw"] + ' : ' +
        workflow.dub_place;
    }
    if (workflow.main_location_id != null && $rootScope.mainLocationList[workflow.main_location_id]) {
      description +=
        '<span class="c-icon c-icon-loc"></span> ' + 'Main location' + ' : ' +
        $rootScope.mainLocationList[workflow.main_location_id].name
    }

    return description;
    }

    // colored bar of workflow
    service.describeBarWorkflowByIds = workflow => {
      // et si déjà fait, ne refait pas
      const workflowTypes = ValueListService.getWorkflowTypesById()
      workflow.language = $rootScope.languagesById[workflow.language_id]
      workflow.workflow_type = workflowTypes[workflow.doublage_type_id]
      workflow.speed = $rootScope.speedsById[workflow.speed_id]
      workflow.color = colorizeWorkflow(workflow)
      workflow.norme_mix = $rootScope.normesMixById[workflow.norme_mix_id]
      workflow.description = service.describeWorkflow(workflow);
      workflow.backgroundColor = "background-color: rgba("+ workflow.color.r + ","+ workflow.color.g +"," + workflow.color.b + "," + workflow.color.o + "); color: " + workflow.color.font
      workflow.workflowDetail =  workflowTypes[workflow.workflow_type_id].value 
      return workflow
    }

    // build colored bar
    service.buildWorkflowBar = workflow => {

    }
    return service
  }
])

angular.module('Lantern').directive('workflowReviewed', function ($rootScope, ValueListService, WorkflowHelperService) {
  return {
    templateUrl: 'partials/template/workflow.html',
    scope: {
      workflow: "=data",
      overflowhidden: "=",
      tooltiphidden: "="
    },
    link: function (scope) {
      scope.workflow.language = $rootScope.languagesById[scope.workflow.language_id]
      scope.workflow.speed = $rootScope.speedsById[scope.workflow.speed_id]
      scope.workflow.color = colorizeWorkflow(scope.workflow)
      scope.workflow.description = WorkflowHelperService.describeWorkflow(scope.workflow);
      scope.workflow.doublage_type = ValueListService.getWorkflowTypesById()[scope.workflow.doublage_type_id]
      scope.workflow.format_mix = ValueListService.getWorkflowMixById()[scope.workflow.format_mix_id]
      scope.workflow.norme_mix = $rootScope.normesMixById[scope.workflow.norme_mix_id]
      scope.workflow.exploitation = ValueListService.getExploitationTypesById()[scope.workflow.exploitation_id]
      scope.workflow.resolution = $rootScope.resolutionsById[scope.workflow.resolution_id]
    }
  }
})