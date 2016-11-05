$(function(){
    $('.suggest').on('click', function(){
        var userInputURL = $('.userInputURL').val();
        $.get('/suggestTitle?url=' + userInputURL, function(data, status) {
            $('input').first().val(data);
            //console.log('jquery received:', data);
        });

    });
})();

