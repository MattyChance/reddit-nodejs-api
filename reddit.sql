-- This creates the users table. The username field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(60) NOT NULL, -- why 60??? ask me :)
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
);

-- This creates the posts table. The userId column references the id column of
-- users. If a user is deleted, the corresponding posts' userIds will be set NULL.
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(300) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`), -- why did we add this here? ask me :)
  CONSTRAINT `userId_input` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

-- This creates a subreddits table; 
CREATE TABLE `subreddits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL, --should be unique not null; change this
  `description` varchar(200) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
   PRIMARY KEY (`id`),
   UNIQUE KEY `unique_name` (`name`)
);

ALTER TABLE subreddits MODIFY name UNIQUE NOT NULL;

-- add a column subredditId into the table of posts
-- this column is related to subreddits table through the subredditId 
ALTER TABLE `posts` ADD column `subredditId` int;

ALTER TABLE `posts` ADD FOREIGN KEY (`subredditId`) REFERENCES `subreddits`(`id`);

-- create a table of many-to-many relationshop between users and posts
CREATE TABLE `votes` (
   `userId` INT NOT NULL,
   `postId` INT NOT NULL,
    PRIMARY KEY (`userId`, `postId`),
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
    FOREIGN KEY (`postId`) REFERENCES `posts` (`id`)
);

ALTER TABLE `votes` 
ADD COLUMN (`vote` TINYINT, `cretedAt` DATETIME, `updatedAt` DATETIME);

ALTER TABLE `votes` MODIFY `vote` TINYINT NOT NULL;

INSERT INTO `votes` SET `postId`=1, `userId`=1, `vote`=1 ON DUPLICATE KEY UPDATE `vote`=1;

Attention! i don't hv this  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`subredditId`) REFERENCES `subreddits` (`id`)
