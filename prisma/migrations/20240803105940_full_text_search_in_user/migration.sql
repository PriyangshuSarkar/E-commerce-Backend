-- CreateIndex
CREATE FULLTEXT INDEX `users_name_email_idx` ON `users`(`name`, `email`);
