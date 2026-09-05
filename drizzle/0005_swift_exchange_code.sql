CREATE TABLE `admin_auth_exchange_codes` (
	`codeHash` varchar(64) NOT NULL,
	`githubId` varchar(32) NOT NULL,
	`login` varchar(255) NOT NULL,
	`name` text,
	`avatarUrl` text,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_auth_exchange_codes_codeHash` PRIMARY KEY(`codeHash`)
);
--> statement-breakpoint
CREATE INDEX `admin_auth_exchange_expires_idx` ON `admin_auth_exchange_codes` (`expiresAt`);