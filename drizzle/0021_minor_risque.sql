CREATE TABLE `api_request_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`apiKeyId` int,
	`requestId` varchar(80) NOT NULL,
	`method` varchar(12) NOT NULL,
	`route` varchar(160) NOT NULL,
	`statusCode` int,
	`success` boolean NOT NULL DEFAULT false,
	`errorCode` varchar(80),
	`idempotencyKey` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_request_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_request_logs_request_id_key` UNIQUE(`requestId`)
);
