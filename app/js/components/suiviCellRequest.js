/**
 *  displaying requests in a cell
 *  directive managed by an object
 *  
 */

Lantern.component('suiviCellRequest', {
 
  // Binds the attibute data to the component controller.
  bindings: {
    action: '=',
    request: '=',
    cell: '=',
    products : '=',
    role : '='
  },
  controller: function($rootScope, $state, Request) {
    this.request.farmer_min_date = null;
    this.request.farmer_max_date = null;
    var farmerDates = [];

    this.request.ownFarmerbookings.forEach(f =>
    {
      if (f.is_wish != 0)
        farmerDates.push(f.day);
    });

    farmerDates.sort();

    if (farmerDates.length > 0)
    {
      this.request.farmer_min_date = moment(farmerDates[0]).toDate();
      this.request.farmer_max_date = moment(farmerDates[farmerDates.length - 1]).toDate();
    }

    if (this.request.metrics_start_date)
      this.request.metrics_start_date = moment(this.request.metrics_start_date).toDate();

    if (this.request.metrics_end_date)
      this.request.metrics_end_date = moment(this.request.metrics_end_date).toDate();

    this.summaryFarmerAudit = function(farmers) {
      let audits = [];
      angular.forEach(farmers, function(farmer) {
        if (audits.indexOf(farmer.audit) == -1) {
          audits.push(farmer.audit);
        }
      });
      return audits.join(', ');
    };
    this.summaryFarmerInge = function(farmers) {
      let inges = [];
      angular.forEach(farmers, function(farmer) {
        if (farmer.tech_writer != null) {
          var tech_name = farmer.tech_writer.person.firstname + " " + farmer.tech_writer.person.lastname;
          if (inges.indexOf(tech_name) == -1) {
            inges.push(tech_name);
          }
        }
      });
      return inges.join(', ');
    };

    this.openRequestPopup = function(request) {
        $state.go($rootScope.state.name, { requestId:request.id });
    }

    this.updateRequestMetricsDates = function()
    {
      var updateRequest = new Request();
      updateRequest.metrics_start_date = this.request.metrics_start_date ? moment(this.request.metrics_start_date).format("YYYY-MM-DD") : null;
      updateRequest.metrics_end_date = this.request.metrics_end_date ? moment(this.request.metrics_end_date).format("YYYY-MM-DD") : null;
      updateRequest.$update({requestId: this.request.id}, function () {});
      
      this.products.forEach(p => p.cells.forEach(c => c.requests.forEach(r => {
        if (r.id == this.request.id && r != this.request)
        {
          r.metrics_start_date = this.request.metrics_start_date; 
          r.metrics_end_date = this.request.metrics_end_date;
        }
      })));
    }

    this.removeRequestMetricsStartDate = function(event)
    {
      this.request.metrics_start_date = null;
      this.request.metrics_end_date = null;
      event.stopPropagation();
      this.updateRequestMetricsDates();
    }

    this.removeRequestMetricsEndDate = function(event)
    {
      this.request.metrics_end_date = null;
      event.stopPropagation();
      this.updateRequestMetricsDates();
    }

  },

  templateUrl: 'partials/Components/suiviCellRequest.html'
});