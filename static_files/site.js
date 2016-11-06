var $ = $;
$(function(){
    $('.suggest').on('click', function(){
        var userInputURL = $('.userInputURL').val();
        
        $.get('/suggestTitle?url=' + userInputURL, function(data, status) {
            $('input').first().val(data.title);
            //console.log('jquery received:', data);
            console.log(status);
        });
    });
    
    $('.vote-btn').on('click', function() {
        var postId = $(this).data('postid');
        var vote = $(this).data('direction');
        var newVoteScore;
        
        $.post('/vote', {postId: postId, vote: vote}, function(data, status) {
            newVoteScore = data.newScore;
            changeScore(newVoteScore, postId);
        });
    });
});

function changeScore (score, postId) {
    $('#'+postId).html(score);
}




