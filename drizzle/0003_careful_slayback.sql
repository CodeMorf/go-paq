ALTER TABLE `memberships` ADD `warehouseId` int;--> statement-breakpoint
ALTER TABLE `organizations` ADD `language` varchar(8) DEFAULT 'it' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `activeServices` json;--> statement-breakpoint
ALTER TABLE `packages` ADD `restrictions` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `status` enum('expected','received','inspected','stored','dispatched','delivered','incident','returned') DEFAULT 'expected' NOT NULL;--> statement-breakpoint
ALTER TABLE `shipment_events` ADD `origin` varchar(80) DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `assistedPurchaseStatus` enum('none','requested','quoted','approved','purchased','received','reconciled','rejected') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `incidentStatus` enum('none','open','investigating','resolved','returned') DEFAULT 'none' NOT NULL;