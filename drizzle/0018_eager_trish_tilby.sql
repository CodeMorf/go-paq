CREATE TABLE `route_expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`routeId` int NOT NULL,
	`driverUserId` int NOT NULL,
	`expenseType` enum('fuel','toll','parking','meal','other') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'DOP',
	`description` varchar(500) NOT NULL,
	`receiptUrl` text,
	`status` enum('submitted','approved','rejected','reimbursed') NOT NULL DEFAULT 'submitted',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `route_expenses_id` PRIMARY KEY(`id`)
);
