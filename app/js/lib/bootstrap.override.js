$('.collapse').on('show.bs.collapse', function () {
	var ariaControls = $(this).attr('id');

	$('.btn-collapse[aria-controls=' + ariaControls + ']').addClass('rotate180');

	console.log($('.btn-collapse[aria-controls=' + ariaControls + ']'));
});

$('.collapse').on('hide.bs.collapse', function () {
	var ariaControls = $(this).attr('id');

	$('.btn-collapse[aria-controls=' + ariaControls + ']').removeClass('rotate180');
});
