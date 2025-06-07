-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2025 at 09:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `drainageinventory`
--

-- --------------------------------------------------------

--
-- Table structure for table `inspection_schedules`
--

CREATE TABLE `inspection_schedules` (
  `id` int(11) NOT NULL,
  `drainage_point_id` int(11) NOT NULL,
  `inspection_type` varchar(100) NOT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time DEFAULT NULL,
  `operator_id` int(11) DEFAULT NULL,
  `frequency` enum('One-time','Weekly','Monthly','Quarterly','Yearly') NOT NULL DEFAULT 'One-time',
  `next_inspection_date` date DEFAULT NULL,
  `status` enum('Scheduled','In Progress','Completed','Cancelled','Overdue') NOT NULL DEFAULT 'Scheduled',
  `priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  `description` text DEFAULT NULL,
  `inspection_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`inspection_checklist`)),
  `findings` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `images` text DEFAULT NULL,
  `completion_date` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inspection_schedules`
--

INSERT INTO `inspection_schedules` (`id`, `drainage_point_id`, `inspection_type`, `scheduled_date`, `scheduled_time`, `operator_id`, `frequency`, `next_inspection_date`, `status`, `priority`, `description`, `inspection_checklist`, `findings`, `recommendations`, `images`, `completion_date`, `created_by`, `created_at`, `updated_at`) VALUES
(3, 3, 'Emergency Inspection', '2025-06-05', NULL, NULL, 'One-time', NULL, 'Scheduled', 'Critical', 'Emergency inspection due to recent flood reports', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-04 04:57:19', '2025-06-04 04:57:19'),
(10, 1, 'Routine Inspection', '2025-06-07', '09:00:00', 7, 'One-time', NULL, 'Scheduled', 'Medium', 'Monthly routine inspection of main drainage point', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-07 12:12:39', '2025-06-07 12:12:39'),
(11, 2, 'Safety Inspection', '2025-06-08', '14:00:00', 7, 'One-time', NULL, 'Scheduled', 'High', 'Safety inspection following maintenance work', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-07 12:12:39', '2025-06-07 12:12:39'),
(12, 3, 'Post-Maintenance Inspection', '2025-06-09', '10:30:00', 7, 'One-time', NULL, 'Scheduled', 'High', 'Verify completion of recent repairs', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-07 12:12:39', '2025-06-07 12:12:39');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inspection_schedules`
--
ALTER TABLE `inspection_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drainage_point_id` (`drainage_point_id`),
  ADD KEY `idx_scheduled_date` (`scheduled_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_inspector_id` (`operator_id`),
  ADD KEY `fk_inspection_created_by` (`created_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inspection_schedules`
--
ALTER TABLE `inspection_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inspection_schedules`
--
ALTER TABLE `inspection_schedules`
  ADD CONSTRAINT `fk_inspection_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_inspection_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
