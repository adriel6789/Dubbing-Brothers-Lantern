Lantern.controller('MetricsPreviewCtrl', ['$scope', 'TableauSuiviColumn', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location', 
	function($scope, TableauSuiviColumn, $rootScope, $anchorScroll, $http, $q, $state, $location) {
		$scope.selectedColumn = null;
		$scope.mouseStartDragX = null;
		$scope.mouseStartDragY = null;
		$scope.mouseDiffDragX = null;
		$scope.mouseDiffDragY = null;
		$scope.isMetricsColumnDraggedOverLastColumn = false;
		
		$scope.showLog = function(column)
		{
			console.log("Enter " + column.id);
		}

		$scope.startDrag = function(column, event)
		{
			$scope.selectedColumn = column;
			column.isDragging = true;
			$scope.mouseStartDragX = event.clientX;
			$scope.mouseStartDragY = event.clientY;
		}

		$scope.stopDrag = function()
		{
			if ($scope.isMetricsColumnDraggedOverLastColumn)
			{
				var lastPosition = 0;

				$scope.columns.forEach(c=>{
					if (c.show_in_metrics)
						lastPosition = Math.max(lastPosition, c.metrics_order);
				});

				$scope.changePosition($scope.selectedColumn, lastPosition + 1);		
			}
			else
			{
				var column = $scope.columns.find(column => column.isMetricsColumnDraggedOver);

				if (column != $scope.selectedColumn)
				{
					$scope.changePosition($scope.selectedColumn, column.metrics_order);
				}

			}

			$scope.clearDrag();
		}

		$scope.changePosition = function(column, position)
		{
			var tableauSuiviColumn = new TableauSuiviColumn();
			tableauSuiviColumn.columnId = column.id;
			tableauSuiviColumn.showInMetrics = 1;
			tableauSuiviColumn.metricsNewPosition = position;
			tableauSuiviColumn.$updateColumnMetricsDetails({}, function (data) {
		        data.columns.forEach(c => $scope.columns.find(c2 => c2.id == c.id).metrics_order = c.metrics_order);
				}, function (data) {
			});
		}

		$scope.clearDrag = function()
		{
			if ($scope.selectedColumn)
			{
				$scope.selectedColumn.isDragging = false;
				$scope.mouseDiffDragX = null;
				$scope.mouseDiffDragY = null;
				$scope.mouseStartDragX = null;
				$scope.mouseStartDragY = null;
				$scope.isMetricsColumnDraggedOverLastColumn = false;
				$scope.columns.forEach(column => column.isMetricsColumnDraggedOver = false);
				$scope.selectedColumn = null;
			}
		}

		$scope.updateSelectedColumnPosition = function(event)
		{
			if ($scope.selectedColumn)
			{
				$scope.mouseDiffDragX = event.clientX - $scope.mouseStartDragX;
				$scope.mouseDiffDragY = event.clientY - $scope.mouseStartDragY;
				var overColumn = null;

				$scope.columns.forEach(column =>
				{
					if (overColumn == null && column != $scope.selectedColumn && column.show_in_metrics)
					{
						var el = $("#preview_column_" + column.id);
						var x = el.offset().left;
						var y = el.offset().top;
						var width = el.outerWidth();
						var height = el.outerHeight();

						if (event.clientX >= x && event.clientY >= y && event.clientX < x + width && event.clientY <= y + height)
						{
							overColumn = column;
							column.isMetricsColumnDraggedOver = true;
						}
						else
							column.isMetricsColumnDraggedOver = false;
					}
					else column.isMetricsColumnDraggedOver = false;
				});

				if (!overColumn)
				{
					var el = $("#preview_column_last_column");
					var x = el.offset().left;
					var y = el.offset().top;
					var width = el.outerWidth();
					var height = el.outerHeight();

					if (event.clientX >= x && event.clientY >= y && event.clientX < x + width && event.clientY <= y + height)
					{
						$scope.isMetricsColumnDraggedOverLastColumn = true;
					}
					else
						$scope.isMetricsColumnDraggedOverLastColumn = false;
				}
			}
		}
	}
]);
