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
