CREATE TABLE `deal_states` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proof_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`access` text DEFAULT 'public' NOT NULL,
	`summary` text NOT NULL,
	`what_it_proves` text DEFAULT '' NOT NULL,
	`storage_key` text,
	`file_name` text,
	`file_size` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `radar_intakes` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`source_class` text NOT NULL,
	`storage_key` text,
	`file_name` text,
	`file_size` integer,
	`review_state` text DEFAULT 'stored' NOT NULL,
	`text_excerpt` text,
	`findings` text DEFAULT '[]' NOT NULL,
	`impact_snapshots` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL
);
