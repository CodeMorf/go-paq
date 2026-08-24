CREATE TABLE `tariff_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`originCountry` varchar(80) NOT NULL DEFAULT 'DO',
	`destinationCountry` varchar(80) NOT NULL DEFAULT 'DO',
	`originPostalPrefix` varchar(20),
	`destinationPostalPrefix` varchar(20),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tariff_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tariffs` ADD `zoneId` int;--> statement-breakpoint
ALTER TABLE `tariffs` ADD `fixedSurcharge` decimal(12,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `tariffs` ADD `discountPct` decimal(6,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `tariffs` ADD `taxPct` decimal(6,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `tariffs` ADD `volumetricDivisor` decimal(10,2) DEFAULT '5000' NOT NULL;