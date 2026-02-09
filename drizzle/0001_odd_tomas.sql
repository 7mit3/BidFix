CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(128) NOT NULL,
	`oldPrice` decimal(10,2) NOT NULL,
	`newPrice` decimal(10,2) NOT NULL,
	`source` varchar(256),
	`changedBy` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(128) NOT NULL,
	`system` varchar(64) NOT NULL,
	`manufacturer` varchar(128) NOT NULL,
	`category` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`unit` varchar(64) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`defaultPrice` decimal(10,2) NOT NULL,
	`priceSource` varchar(256) DEFAULT 'Default',
	`notes` text,
	`lastPriceUpdate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_pricing_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `quote_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`system` varchar(64) NOT NULL,
	`distributor` varchar(256),
	`status` enum('draft','sent','received','applied') NOT NULL DEFAULT 'draft',
	`productCount` int DEFAULT 0,
	`totalValue` decimal(12,2),
	`createdBy` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quote_requests_id` PRIMARY KEY(`id`)
);
