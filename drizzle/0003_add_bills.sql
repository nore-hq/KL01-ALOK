CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`bill_number` text NOT NULL,
	`customer_name` text NOT NULL,
	`vehicle_number` text NOT NULL,
	`vehicle_model` text NOT NULL,
	`service` text NOT NULL,
	`amount` real NOT NULL,
	`payment_mode` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bills_bill_number_unique` ON `bills` (`bill_number`);
