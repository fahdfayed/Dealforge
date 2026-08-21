CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`requisition_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`candidate_name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Prepared' NOT NULL,
	`submitted_at` integer,
	`submitted_by` text DEFAULT '' NOT NULL,
	`resume_storage_key` text,
	`resume_filename` text,
	`tailoring_notes` text DEFAULT '' NOT NULL,
	`rate_offered` real,
	`rate_currency` text DEFAULT 'AED' NOT NULL,
	`rate_unit` text DEFAULT 'Per day' NOT NULL,
	`client_feedback_at` integer,
	`client_feedback_notes` text DEFAULT '' NOT NULL,
	`rejection_reason` text,
	`email_thread_ref` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`stage` text NOT NULL,
	`interviewer` text DEFAULT '' NOT NULL,
	`interviewed_at` integer NOT NULL,
	`recommendation` text NOT NULL,
	`ratings` text DEFAULT '{}' NOT NULL,
	`strengths` text DEFAULT '[]' NOT NULL,
	`concerns` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`recorded_by` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `submissions_req_idx` ON `submissions` (`requisition_id`);
--> statement-breakpoint
CREATE INDEX `submissions_candidate_idx` ON `submissions` (`candidate_id`);
--> statement-breakpoint
CREATE INDEX `submissions_status_idx` ON `submissions` (`status`);
--> statement-breakpoint
CREATE INDEX `interview_feedback_submission_idx` ON `interview_feedback` (`submission_id`);
