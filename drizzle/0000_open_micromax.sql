CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`keyPrefix` varchar(24) NOT NULL,
	`secretHash` varchar(128) NOT NULL,
	`scopes` text NOT NULL,
	`revokedAt` timestamp,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`actorUserId` int,
	`category` enum('operational','financial','security','llm') NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(80),
	`resourceId` varchar(80),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`branchId` int,
	`warehouseId` int,
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
	`language` varchar(8) NOT NULL DEFAULT 'es',
	`timezone` varchar(80) NOT NULL DEFAULT 'America/Santo_Domingo',
	`activeServices` json,
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
	`restrictions` text,
	`status` enum('expected','received','inspected','stored','dispatched','delivered','incident','returned') NOT NULL DEFAULT 'expected',
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
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`role` varchar(48) NOT NULL,
	`resource` varchar(80) NOT NULL,
	`action` enum('view','create','edit','approve','assign','collect','refund','export','configure') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
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
CREATE TABLE `shipment_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`documentType` enum('label','invoice','customs','pod','incident','receipt') NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipment_documents_id` PRIMARY KEY(`id`)
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
	`origin` varchar(80) NOT NULL DEFAULT 'system',
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
	`assistedPurchaseStatus` enum('none','requested','quoted','approved','purchased','received','reconciled','rejected') NOT NULL DEFAULT 'none',
	`incidentStatus` enum('none','open','investigating','resolved','returned') NOT NULL DEFAULT 'none',
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
--> statement-breakpoint
CREATE TABLE `tracking_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int,
	`routeId` int,
	`driverUserId` int,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`accuracyMeters` decimal(8,2),
	`capturedAt` timestamp NOT NULL,
	`source` enum('driver','branch','system') NOT NULL DEFAULT 'driver',
	CONSTRAINT `tracking_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`code` varchar(40) NOT NULL,
	`address` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`)
);
