CREATE TABLE `camp_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`wood` integer DEFAULT 0 NOT NULL,
	`herbs` integer DEFAULT 0 NOT NULL,
	`defense` integer DEFAULT 0 NOT NULL,
	`comfort` integer DEFAULT 0 NOT NULL,
	`exploration` integer DEFAULT 0 NOT NULL,
	`craft` integer DEFAULT 0 NOT NULL,
	`farm` integer DEFAULT 0 NOT NULL,
	`magic` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `world_events` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`action` text NOT NULL,
	`role` text NOT NULL,
	`amount` integer NOT NULL,
	`attempt_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `world_events_time` ON `world_events` (`created_at`);