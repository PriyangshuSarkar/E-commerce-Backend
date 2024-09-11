/*
  Warnings:

  - The values [PROCESSING,SHIPPED,DELIVERED] on the enum `orders_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `orders` MODIFY `status` ENUM('PENDING', 'ORDERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('MASTER', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER';
