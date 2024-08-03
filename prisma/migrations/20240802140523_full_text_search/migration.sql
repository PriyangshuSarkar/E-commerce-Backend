-- CreateIndex
CREATE FULLTEXT INDEX `categories_name_idx` ON `categories`(`name`);

-- CreateIndex
CREATE FULLTEXT INDEX `products_name_description_idx` ON `products`(`name`, `description`);

-- CreateIndex
CREATE FULLTEXT INDEX `tags_name_idx` ON `tags`(`name`);
