CREATE TABLE `lookup_analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`game` enum('hsr','genshin','zzz') NOT NULL,
	`cacheHit` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lookup_analytics_events_id` PRIMARY KEY(`id`)
);
