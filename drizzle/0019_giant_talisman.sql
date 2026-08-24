CREATE TABLE `customer_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(80) NOT NULL,
	`recipientName` varchar(180) NOT NULL,
	`phone` varchar(40),
	`addressLine1` varchar(240) NOT NULL,
	`addressLine2` varchar(240),
	`city` varchar(120) NOT NULL,
	`province` varchar(120) NOT NULL,
	`country` varchar(80) NOT NULL DEFAULT 'DO',
	`postalCode` varchar(24),
	`deliveryInstructions` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`relationship` varchar(80),
	`phone` varchar(40),
	`email` varchar(320),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`customerType` enum('individual','business') NOT NULL DEFAULT 'individual',
	`legalName` varchar(220),
	`phone` varchar(40),
	`taxId` varchar(80),
	`preferredLanguage` varchar(8) NOT NULL DEFAULT 'es',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`shipmentId` int,
	`subject` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`category` enum('shipment','billing','pickup','delivery','account','other') NOT NULL DEFAULT 'other',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`status` enum('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
	`resolution` text,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
