CREATE TABLE `consolidation_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`consolidationId` int NOT NULL,
	`packageId` int NOT NULL,
	`sequence` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consolidations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`code` varchar(48) NOT NULL,
	`fromBranchId` int,
	`toBranchId` int,
	`status` enum('open','sealed','in_transit','received','reconciled') NOT NULL DEFAULT 'open',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consolidations_id` PRIMARY KEY(`id`),
	CONSTRAINT `consolidations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`packageId` int NOT NULL,
	`warehouseId` int,
	`movementType` enum('received','inspected','putaway','transfer_out','transfer_in','dispatch','adjustment') NOT NULL,
	`fromLocation` varchar(80),
	`toLocation` varchar(80),
	`note` text,
	`actorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
