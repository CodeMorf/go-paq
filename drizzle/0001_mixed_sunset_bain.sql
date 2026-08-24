CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`code` varchar(32) NOT NULL,
	`city` varchar(120) NOT NULL,
	`address` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`branchId` int,
	`role` enum('owner','manager','support','finance','supervisor','warehouse','dispatcher','driver','customer') NOT NULL DEFAULT 'customer',
	`permissions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`legalName` varchar(220),
	`slug` varchar(100) NOT NULL,
	`country` varchar(80) NOT NULL DEFAULT 'DO',
	`currency` varchar(8) NOT NULL DEFAULT 'DOP',
	`timezone` varchar(80) NOT NULL DEFAULT 'America/Santo_Domingo',
	`status` enum('trial','active','suspended') NOT NULL DEFAULT 'trial',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`organizationId` int NOT NULL,
	`packageCode` varchar(48) NOT NULL,
	`description` text,
	`weightKg` decimal(9,3),
	`volumetricWeightKg` decimal(9,3),
	`lengthCm` decimal(8,2),
	`widthCm` decimal(8,2),
	`heightCm` decimal(8,2),
	`declaredValue` decimal(12,2),
	`locationCode` varchar(80),
	`barcodeValue` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `packages_packageCode_unique` UNIQUE(`packageCode`)
);
--> statement-breakpoint
CREATE TABLE `shipment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`actorUserId` int,
	`branchId` int,
	`eventType` varchar(80) NOT NULL,
	`previousStatus` varchar(80),
	`nextStatus` varchar(80),
	`note` text,
	`evidenceUrl` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipment_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipment_events_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int,
	`trackingCode` varchar(48) NOT NULL,
	`serviceType` enum('local','national','international','assisted_purchase','heavy_cargo') NOT NULL DEFAULT 'national',
	`commercialStatus` enum('draft','quoted','confirmed','cancelled','closed') NOT NULL DEFAULT 'draft',
	`physicalStatus` enum('expected','received','inspection','ready','in_transit','at_destination','out_for_delivery','delivered','incident','returned') NOT NULL DEFAULT 'expected',
	`transportStatus` enum('unassigned','assigned','route_active','completed') NOT NULL DEFAULT 'unassigned',
	`financialStatus` enum('unpaid','partial','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`senderName` varchar(180) NOT NULL,
	`recipientName` varchar(180) NOT NULL,
	`originAddress` text NOT NULL,
	`destinationAddress` text NOT NULL,
	`originCountry` varchar(80) NOT NULL DEFAULT 'DO',
	`destinationCountry` varchar(80) NOT NULL DEFAULT 'DO',
	`estimatedAmount` decimal(12,2),
	`currency` varchar(8) NOT NULL DEFAULT 'DOP',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipments_trackingCode_unique` UNIQUE(`trackingCode`)
);
