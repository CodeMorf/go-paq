ALTER TABLE `pickups` ADD `evidenceUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `pickups` ADD `failureReason` varchar(500);--> statement-breakpoint
ALTER TABLE `pickups` ADD `statusChangedAt` timestamp;--> statement-breakpoint
ALTER TABLE `pickups` ADD `statusChangedBy` int;