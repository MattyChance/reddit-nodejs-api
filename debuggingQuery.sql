SELECT posts.id as post_id
, posts.title as post_title
, posts.url as post_url
, users.id as user_id
, users.username as username
, subreddits.id as subreddit_id
, subreddits.name as subreddit_name
, subreddits.description as subreddit_description
, SUM(votes.vote) as vote_score 
, COUNT(votes.vote) as total_vote
, SUM(votes.vote > 0) as num_upvote
, SUM(votes.vote < 0) as num_downvote
, COUNT(votes.vote) * SUM(votes.vote > 0) DIV SUM(votes.vote < 0) as controversial_a
, COUNT(votes.vote) * SUM(votes.vote < 0) DIV SUM(votes.vote > 0) as controversial_b
, (votes.vote / TIMESTAMPDIFF(MINUTE, posts.createdAt, NOW())) AS hotness 
from posts
LEFT JOIN users on users.id = posts.userId 
LEFT JOIN subreddits on subreddits.id = posts.subredditId
LEFT JOIN votes on votes.postId = posts.id
GROUP BY posts.id
ORDER BY hotness DESC

SELECT CASE WHEN SUM(votes.vote > 0) < SUM(votes.vote < 0) THEN votes.vote * SUM(votes.vote > 0) DIV SUM(votes.vote < 0)
            WHEN SUM(votes.vote > 0) > SUM(votes.vote < 0) THEN votes.vote * SUM(votes.vote < 0) DIV SUM(votes.vote > 0)
       END
       FROM votes
