CREATE TABLE `webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`endpointId` int NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`payloadHash` varchar(64) NOT NULL,
	`status` enum('pending','delivered','failed','exhausted') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`responseStatus` int,
	`lastError` varchar(500),
	`nextAttemptAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`secretCiphertext` text NOT NULL,
	`subscribedEvents` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
