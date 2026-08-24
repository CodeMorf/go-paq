CREATE TABLE `delivery_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`routeStopId` int,
	`attemptNumber` int NOT NULL,
	`status` enum('failed','rescheduled','completed') NOT NULL,
	`reason` varchar(160) NOT NULL,
	`note` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`attemptedBy` int,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipment_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`shipmentId` int NOT NULL,
	`packageId` int,
	`type` enum('damage','address','recipient_unavailable','customs','other','return_requested') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','investigating','resolved','returned') NOT NULL DEFAULT 'open',
	`description` text NOT NULL,
	`resolution` text,
	`reportedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipment_incidents_id` PRIMARY KEY(`id`)
);
