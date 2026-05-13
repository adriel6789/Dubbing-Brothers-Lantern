Lantern.filter('dateFormat', function() {
    return function(input) {
        return moment(input).format("DD/MM/YYYY");
    }
});

Lantern.filter('dateFormatShort', function() {
    return function(input) {
        return moment(input).format("DD/MM/YY");
    }
});

Lantern.filter('dateFormatShorter', function() {
    return function(input) {
        return moment(input).format("DD/MM");
    }
});
