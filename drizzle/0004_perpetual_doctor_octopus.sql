CREATE TABLE `manifests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int,
	`code` varchar(48) NOT NULL,
	`direction` enum('outbound','inbound','transfer') NOT NULL,
	`status` enum('open','sealed','in_transit','received','reconciled') NOT NULL DEFAULT 'open',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manifests_id` PRIMARY KEY(`id`),
	CONSTRAINT `manifests_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `pickups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int,
	`address` text NOT NULL,
	`contactName` varchar(160) NOT NULL,
	`windowStart` timestamp,
	`windowEnd` timestamp,
	`status` enum('requested','assigned','en_route','collected','failed','cancelled') NOT NULL DEFAULT 'requested',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pickups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_stops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`routeId` int NOT NULL,
	`shipmentId` int,
	`pickupId` int,
	`sequence` int NOT NULL,
	`address` text NOT NULL,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`status` enum('pending','arrived','completed','failed','skipped') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `route_stops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int,
	`code` varchar(48) NOT NULL,
	`driverUserId` int,
	`vehicleLabel` varchar(100),
	`status` enum('draft','assigned','active','closed') NOT NULL DEFAULT 'draft',
	`startedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routes_id` PRIMARY KEY(`id`),
	CONSTRAINT `routes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `tariffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`serviceType` varchar(48) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'DOP',
	`minAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`perKg` decimal(12,2) NOT NULL DEFAULT '0',
	`perKm` decimal(12,2) NOT NULL DEFAULT '0',
	`fuelSurchargePct` decimal(6,3) NOT NULL DEFAULT '0',
	`version` int NOT NULL DEFAULT 1,
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validUntil` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tariffs_id` PRIMARY KEY(`id`)
);
