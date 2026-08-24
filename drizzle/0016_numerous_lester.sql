ALTER TABLE `packages` ADD `warehouseId` int;--> statement-breakpoint
ALTER TABLE `packages` ADD `parentPackageId` int;--> statement-breakpoint
ALTER TABLE `packages` ADD `packagingStatus` enum('standard','split_parent','split_child','repacked') DEFAULT 'standard' NOT NULL;