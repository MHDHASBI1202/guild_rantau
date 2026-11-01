CREATE TABLE `spin_history` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`item_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `members` ADD `cosmetics` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `highest_level` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `spins_used` integer DEFAULT 0 NOT NULL;