CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`primary_skill` text DEFAULT '' NOT NULL,
	`oracle_skills` text DEFAULT '[]' NOT NULL,
	`years_experience` integer,
	`current_employer` text DEFAULT '' NOT NULL,
	`notice_period_days` integer,
	`available_from` integer,
	`expected_rate` real,
	`rate_currency` text DEFAULT 'AED' NOT NULL,
	`rate_unit` text DEFAULT 'Per day' NOT NULL,
	`work_authorisation` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'Inbound application' NOT NULL,
	`vendor_name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`owner_id` text,
	`communication_rating` text DEFAULT 'Not assessed' NOT NULL,
	`soft_skill_notes` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`resume_storage_key` text,
	`resume_filename` text,
	`resume_text` text DEFAULT '' NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `candidate_searches` (
	`id` text PRIMARY KEY NOT NULL,
	`searched_by` text DEFAULT '' NOT NULL,
	`query` text DEFAULT '' NOT NULL,
	`filters` text DEFAULT '{}' NOT NULL,
	`result_count` integer DEFAULT 0 NOT NULL,
	`requisition_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `candidates_status_idx` ON `candidates` (`status`);
--> statement-breakpoint
CREATE INDEX `candidates_primary_skill_idx` ON `candidates` (`primary_skill`);
--> statement-breakpoint
CREATE INDEX `candidates_email_idx` ON `candidates` (`email`);
--> statement-breakpoint
CREATE INDEX `candidate_searches_created_idx` ON `candidate_searches` (`created_at`);
--> statement-breakpoint
CREATE VIRTUAL TABLE `candidates_fts` USING fts5(
	candidate_id UNINDEXED,
	full_name,
	primary_skill,
	oracle_skills,
	summary,
	soft_skill_notes,
	tags,
	current_employer,
	resume_text,
	tokenize = 'porter unicode61'
);
--> statement-breakpoint
CREATE TRIGGER `candidates_fts_insert` AFTER INSERT ON `candidates` BEGIN
	INSERT INTO `candidates_fts` (candidate_id, full_name, primary_skill, oracle_skills, summary, soft_skill_notes, tags, current_employer, resume_text)
	VALUES (new.id, new.full_name, new.primary_skill, new.oracle_skills, new.summary, new.soft_skill_notes, new.tags, new.current_employer, new.resume_text);
END;
--> statement-breakpoint
CREATE TRIGGER `candidates_fts_delete` AFTER DELETE ON `candidates` BEGIN
	DELETE FROM `candidates_fts` WHERE candidate_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER `candidates_fts_update` AFTER UPDATE ON `candidates` BEGIN
	DELETE FROM `candidates_fts` WHERE candidate_id = old.id;
	INSERT INTO `candidates_fts` (candidate_id, full_name, primary_skill, oracle_skills, summary, soft_skill_notes, tags, current_employer, resume_text)
	VALUES (new.id, new.full_name, new.primary_skill, new.oracle_skills, new.summary, new.soft_skill_notes, new.tags, new.current_employer, new.resume_text);
END;
