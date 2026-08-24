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
