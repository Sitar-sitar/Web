CREATE TABLE `translation_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedbackType` enum('mistranslation','improvement','other') NOT NULL,
	`locale` varchar(16) NOT NULL,
	`pagePath` varchar(255) NOT NULL,
	`originalText` text,
	`suggestedText` text NOT NULL,
	`notes` text,
	`status` enum('new','reviewed','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `translation_feedback_id` PRIMARY KEY(`id`)
);
