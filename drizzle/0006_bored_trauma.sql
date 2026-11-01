CREATE TABLE `auth_challenges` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`nonce` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_challenges_expiry` ON `auth_challenges` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_sessions_expiry` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user` ON `auth_sessions` (`user_id`);