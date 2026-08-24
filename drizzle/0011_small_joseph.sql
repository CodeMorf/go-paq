CREATE TABLE `shipment_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`serviceType` enum('assisted_purchase','heavy_cargo','moving') NOT NULL,
	`quoteReference` varchar(160),
	`handlingNotes` text,
	`scheduledAt` timestamp,
	`requiresTwoPersonCrew` boolean NOT NULL DEFAULT false,
	`requiresSpecialVehicle` boolean NOT NULL DEFAULT false,
	`status` enum('requested','quoted','approved','scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipment_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `shipments` MODIFY COLUMN `serviceType` enum('local','national','international','assisted_purchase','heavy_cargo','moving') NOT NULL DEFAULT 'national';