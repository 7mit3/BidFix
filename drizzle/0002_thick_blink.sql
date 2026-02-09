CREATE TABLE `saved_estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`system` varchar(64) NOT NULL,
	`systemLabel` varchar(256) NOT NULL,
	`notes` text,
	`data` text NOT NULL,
	`grandTotal` decimal(12,2),
	`roofArea` decimal(12,2),
	`createdBy` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_estimates_id` PRIMARY KEY(`id`)
);
