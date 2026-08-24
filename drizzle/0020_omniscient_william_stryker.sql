CREATE TABLE `api_idempotency_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`apiKeyId` int NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`method` varchar(12) NOT NULL,
	`route` varchar(160) NOT NULL,
	`requestHash` varchar(64) NOT NULL,
	`responseStatus` int,
	`responseBody` json,
	`resourceType` varchar(64),
	`resourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `api_idempotency_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_idempotency_scope_key` UNIQUE(`organizationId`,`apiKeyId`,`idempotencyKey`)
);
