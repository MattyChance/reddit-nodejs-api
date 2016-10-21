SELECT 
    p.id as postId, 
    p.title as postTitle, 
    p.url as postURL, 
    p.createdAt as postCreatedDate, 
    p.updatedAt as postUpdatedAt, 
    u.id as userId, 
    u.username, 
    u.createdAt as userCreatedAt, 
    u.updatedAt as userUpdatedAt, 
    s.id as subId, 
    s.name as subName, 
    s.description as subDes, 
    s.createdAt as subCreatedAt, 
    s.updatedAt as subUpdatedAt
FROM posts p 
LEFT JOIN users u 
    ON p.userId = u.id 
LEFT JOIN subreddits s 
    ON p.subredditId = s.id