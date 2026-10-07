CREATE TABLE `billing` (
	`id` text PRIMARY KEY NOT NULL,
	`serial_number` integer NOT NULL,
	`customer_name` text NOT NULL,
	`vehicle_number` text NOT NULL,
	`vehicle_model` text NOT NULL,
	`service_type` text NOT NULL,
	`payment_mode` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	`partner_id` text REFERENCES partners(id)
);
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
CREATE UNIQUE INDEX `partners_username_unique` ON `partners` (`username`);
ALTER TABLE `employees` ADD `partner_id` text REFERENCES partners(id);
