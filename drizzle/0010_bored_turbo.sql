CREATE TABLE `cash_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`cashSessionId` int NOT NULL,
	`paymentId` int,
	`movementType` enum('collection','refund','adjustment','deposit') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`note` text,
	`actorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cash_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cash_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`branchId` int NOT NULL,
	`openedBy` int NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`openingAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`closingAmount` decimal(12,2),
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `cash_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`invoiceNumber` varchar(48) NOT NULL,
	`status` enum('draft','issued','paid','voided') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(12,2) NOT NULL,
	`tax` decimal(12,2) NOT NULL DEFAULT '0',
	`total` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'DOP',
	`issuedBy` int,
	`issuedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'DOP',
	`method` enum('cash','card','transfer','other') NOT NULL,
	`status` enum('pending','collected','voided','refunded') NOT NULL DEFAULT 'pending',
	`reference` varchar(160),
	`collectedBy` int,
	`collectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`paymentId` int NOT NULL,
	`receiptNumber` varchar(48) NOT NULL,
	`receiptUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `receipts_receiptNumber_unique` UNIQUE(`receiptNumber`)
);
