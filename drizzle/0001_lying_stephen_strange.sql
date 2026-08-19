CREATE TABLE `deal_access` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_level` text DEFAULT 'view' NOT NULL,
	`shared_at` integer NOT NULL,
	`shared_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `responsibilities` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`assigned_by` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sod_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`rule` text NOT NULL,
	`description` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sod_rules_rule_unique` ON `sod_rules` (`rule`);--> statement-breakpoint
CREATE TABLE `sod_violations` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`severity` text NOT NULL,
	`details` text NOT NULL,
	`resolved_at` integer,
	`detected_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_email_unique` ON `team_members` (`email`);