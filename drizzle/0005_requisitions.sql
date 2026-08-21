CREATE TABLE `requisitions` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL UNIQUE,
	`account_id` text,
	`account_name` text DEFAULT '' NOT NULL,
	`deal_id` text,
	`role_title` text NOT NULL,
	`primary_skill` text DEFAULT '' NOT NULL,
	`required_skills` text DEFAULT '[]' NOT NULL,
	`positions` integer DEFAULT 1 NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`duration_months` integer,
	`budget_rate` real,
	`budget_currency` text DEFAULT 'AED' NOT NULL,
	`budget_rate_unit` text DEFAULT 'Per day' NOT NULL,
	`min_years` integer,
	`start_by` integer,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`job_description` text DEFAULT '' NOT NULL,
	`raised_by` text DEFAULT '' NOT NULL,
	`sales_owner` text DEFAULT '' NOT NULL,
	`ta_owner` text DEFAULT '' NOT NULL,
	`practice_head` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Raised' NOT NULL,
	`raised_at` integer NOT NULL,
	`acknowledged_at` integer,
	`acknowledged_by` text DEFAULT '' NOT NULL,
	`calibrated_at` integer,
	`calibration_notes` text DEFAULT '' NOT NULL,
	`calibration_participants` text DEFAULT '[]' NOT NULL,
	`resourcing_checked_at` integer,
	`resourcing_checked_by` text DEFAULT '' NOT NULL,
	`resourcing_outcome` text DEFAULT 'Not yet checked' NOT NULL,
	`resourcing_notes` text DEFAULT '' NOT NULL,
	`decision` text,
	`decision_at` integer,
	`decision_by` text DEFAULT '' NOT NULL,
	`decision_reason` text DEFAULT '' NOT NULL,
	`first_profile_at` integer,
	`closed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requisition_events` (
	`id` text PRIMARY KEY NOT NULL,
	`requisition_id` text NOT NULL,
	`kind` text NOT NULL,
	`from_status` text DEFAULT '' NOT NULL,
	`to_status` text DEFAULT '' NOT NULL,
	`actor` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requisitions_status_idx` ON `requisitions` (`status`);
--> statement-breakpoint
CREATE INDEX `requisitions_account_idx` ON `requisitions` (`account_id`);
--> statement-breakpoint
CREATE INDEX `requisition_events_req_idx` ON `requisition_events` (`requisition_id`);
