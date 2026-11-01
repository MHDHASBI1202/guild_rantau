CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`color` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`wood` integer DEFAULT 0 NOT NULL,
	`herbs` integer DEFAULT 0 NOT NULL,
	`last_action` integer DEFAULT 0 NOT NULL,
	`activity` text DEFAULT 'Tiba di kamp' NOT NULL,
	`joined_at` integer NOT NULL,
	`bed` text NOT NULL
);
