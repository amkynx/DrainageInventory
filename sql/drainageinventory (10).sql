-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 08, 2025 at 03:06 AM
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
-- Stand-in structure for view `active_sessions`
-- (See below for the actual view)
--
CREATE TABLE `active_sessions` (
`id` int(11)
,`user_id` int(11)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`email` varchar(255)
,`role` enum('Admin','Inspector','Operator','Viewer')
,`ip_address` varchar(45)
,`user_agent` text
,`last_activity` timestamp
,`expires_at` timestamp
,`session_created` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `drainage_lines`
--

CREATE TABLE `drainage_lines` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `geojson` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drainage_lines`
--

INSERT INTO `drainage_lines` (`id`, `name`, `geojson`) VALUES
(1, 'Bentayan Jln Bakri', '{\n  \"type\": \"FeatureCollection\",\n  \"name\": \"bentayan jln bakri\",\n  \"features\": [\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"sg bentayan - Jln Bakri\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5702392, 2.0511893, 0.0],\n          [102.570673, 2.0506694, 0.0],\n          [102.571305, 2.0499762, 0.0],\n          [102.5718345, 2.0494576, 0.0],\n          [102.5736611, 2.0488478, 0.0],\n          [102.5762359, 2.0486722, 0.0],\n          [102.5791864, 2.0485489, 0.0],\n          [102.6034007, 2.0473051, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"parit Jln Hj Hassan\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5736042, 2.0488673, 0.0],\n          [102.5737822, 2.048619, 0.0],\n          [102.5738009, 2.0483563, 0.0],\n          [102.5740665, 2.0478819, 0.0],\n          [102.5752601, 2.0458527, 0.0],\n          [102.5761184, 2.0446411, 0.0],\n          [102.579042, 2.0414513, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"jln pt setongkat\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.570395, 2.0626322, 0.0],\n          [102.5705022, 2.0628252, 0.0],\n          [102.5714142, 2.0638116, 0.0],\n          [102.5728626, 2.0645728, 0.0],\n          [102.5738711, 2.0648302, 0.0],\n          [102.5765855, 2.0656772, 0.0],\n          [102.5774653, 2.065956, 0.0],\n          [102.5799838, 2.0662964, 0.0],\n          [102.58265, 2.0666743, 0.0],\n          [102.5843263, 2.066878, 0.0],\n          [102.5958277, 2.066618, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"keliling hosptal\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5750112, 2.0578417, 0.0],\n          [102.5770711, 2.0575415, 0.0],\n          [102.578938, 2.0572091, 0.0],\n          [102.5784659, 2.0548718, 0.0],\n          [102.5758212, 2.0553381, 0.0],\n          [102.5751882, 2.0535851, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Jln Hj Muhammad\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5609801, 2.0702839, 0.0],\n          [102.5636409, 2.0719994, 0.0],\n          [102.5680236, 2.0745029, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Jalan ismail\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5624704, 2.0712274, 0.0],\n          [102.5643158, 2.0692062, 0.0],\n          [102.565577, 2.0676602, 0.0],\n          [102.5662877, 2.0669935, 0.0],\n          [102.5701449, 2.0652203, 0.0],\n          [102.571369, 2.0637963, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"kg sabak awor\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.564526, 2.0807357, 0.0],\n          [102.5645877, 2.0805588, 0.0],\n          [102.5661192, 2.0791998, 0.0],\n          [102.5663097, 2.0791301, 0.0],\n          [102.5667093, 2.07924, 0.0],\n          [102.5689757, 2.0810734, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"jln kimkee\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5808903, 2.0817339, 0.0],\n          [102.5824916, 2.0810638, 0.0],\n          [102.5851631, 2.0799756, 0.0],\n          [102.5872391, 2.0791554, 0.0],\n          [102.5890496, 2.0784718, 0.0],\n          [102.5915306, 2.0776248, 0.0],\n          [102.5943872, 2.0767832, 0.0],\n          [102.5958356, 2.0766223, 0.0],\n          [102.5973484, 2.0767805, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"jln pt buaya\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5973484, 2.0767805, 0.0],\n          [102.5982525, 2.0714277, 0.0],\n          [102.5984562, 2.0702708, 0.0],\n          [102.5985425, 2.0696524, 0.0],\n          [102.5986347, 2.0690555, 0.0],\n          [102.5984123, 2.0686744, 0.0],\n          [102.5981121, 2.0683168, 0.0],\n          [102.596665, 2.0674219, 0.0],\n          [102.5961769, 2.0670569, 0.0],\n          [102.5959603, 2.0668019, 0.0],\n          [102.5958277, 2.066618, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"jln salleh\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5808903, 2.0817339, 0.0],\n          [102.5746579, 2.0580233, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"parit Keroma\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5715792, 2.0045815, 0.0],\n          [102.5743258, 2.0072407, 0.0],\n          [102.5763858, 2.0095567, 0.0],\n          [102.578789, 2.011358, 0.0],\n          [102.5834934, 2.0169105, 0.0],\n          [102.5894578, 2.0226562, 0.0],\n          [102.6017176, 2.0318946, 0.0],\n          [102.6057399, 2.0338316, 0.0],\n          [102.6115763, 2.0363191, 0.0],\n          [102.6182711, 2.0372627, 0.0],\n          [102.6241379, 2.0365187, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Parit Sakai\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5660861, 2.0068547, 0.0],\n          [102.5689614, 2.0102429, 0.0],\n          [102.5705222, 2.0113907, 0.0],\n          [102.5718367, 2.0124302, 0.0],\n          [102.5750983, 2.0155611, 0.0],\n          [102.5771201, 2.0186314, 0.0],\n          [102.5788162, 2.0216782, 0.0],\n          [102.5806773, 2.0248679, 0.0],\n          [102.5832111, 2.0279978, 0.0],\n          [102.5856984, 2.0304006, 0.0],\n          [102.5882733, 2.0325021, 0.0],\n          [102.5900512, 2.0338951, 0.0],\n          [102.5926292, 2.0356115, 0.0],\n          [102.5946677, 2.0367051, 0.0],\n          [102.600569, 2.0386097, 0.0],\n          [102.6055897, 2.0404579, 0.0],\n          [102.6071775, 2.041187, 0.0],\n          [102.6095486, 2.0417338, 0.0],\n          [102.6114583, 2.0416694, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Parit haji Baki\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5534866, 2.0187602, 0.0],\n          [102.556319, 2.0209689, 0.0],\n          [102.5589369, 2.0244, 0.0],\n          [102.5608997, 2.0263136, 0.0],\n          [102.5674473, 2.0322911, 0.0],\n          [102.5695929, 2.0343863, 0.0],\n          [102.5722008, 2.037487, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Parit Khalidi\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5487761, 2.0238951, 0.0],\n          [102.550364, 2.0247957, 0.0],\n          [102.5520806, 2.0265327, 0.0],\n          [102.5546764, 2.029463, 0.0],\n          [102.5559187, 2.030875, 0.0],\n          [102.561359, 2.0369907, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Parit haji Long\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.545439, 2.0290602, 0.0],\n          [102.5456321, 2.0292961, 0.0],\n          [102.5484001, 2.0311188, 0.0],\n          [102.549237, 2.0313761, 0.0],\n          [102.5510823, 2.0327057, 0.0],\n          [102.5524127, 2.0333705, 0.0],\n          [102.5539148, 2.0339924, 0.0],\n          [102.5544509, 2.0342865, 0.0],\n          [102.5545706, 2.0343682, 0.0],\n          [102.5556462, 2.0348641, 0.0],\n          [102.5567298, 2.0353922, 0.0],\n          [102.5578995, 2.0360149, 0.0],\n          [102.5585996, 2.0364223, 0.0],\n          [102.5597799, 2.0371398, 0.0],\n          [102.5611323, 2.0380292, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Parit othman\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5629537, 2.0465707, 0.0],\n          [102.5631468, 2.0460132, 0.0],\n          [102.5634472, 2.0453538, 0.0],\n          [102.563694, 2.0443834, 0.0],\n          [102.5644437, 2.0422109, 0.0],\n          [102.5644879, 2.0420581, 0.0],\n          [102.5648083, 2.0410758, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Parit Perupok\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5603589, 2.0125633, 0.0],\n          [102.5655305, 2.0180295, 0.0],\n          [102.5682512, 2.0211984, 0.0],\n          [102.5712272, 2.0246848, 0.0],\n          [102.5733475, 2.0271562, 0.0],\n          [102.5748898, 2.0291224, 0.0],\n          [102.5760538, 2.0306905, 0.0],\n          [102.5774781, 2.0324998, 0.0],\n          [102.5775478, 2.0326124, 0.0],\n          [102.5785443, 2.0340452, 0.0],\n          [102.5821223, 2.0378059, 0.0],\n          [102.583273, 2.0388647, 0.0],\n          [102.5848314, 2.0402237, 0.0],\n          [102.5862717, 2.0414997, 0.0],\n          [102.5877818, 2.0428399, 0.0],\n          [102.5880661, 2.0429793, 0.0],\n          [102.5909401, 2.0438424, 0.0],\n          [102.5921042, 2.0442177, 0.0],\n          [102.5947019, 2.0440743, 0.0],\n          [102.5971159, 2.0439001, 0.0],\n          [102.5983229, 2.0438732, 0.0],\n          [102.6012143, 2.0440073, 0.0],\n          [102.6038268, 2.0438732, 0.0],\n          [102.6050981, 2.0437982, 0.0],\n          [102.6196625, 2.0429083, 0.0],\n          [102.6261857, 2.042801, 0.0],\n          [102.63096, 2.0424687, 0.0],\n          [102.6331809, 2.0421229, 0.0],\n          [102.6349645, 2.0418682, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Parit beting\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.5641238, 2.0665595, 0.0],\n          [102.5643813, 2.0667847, 0.0],\n          [102.5645851, 2.0670098, 0.0],\n          [102.5648319, 2.0674494, 0.0],\n          [102.564966, 2.0677389, 0.0],\n          [102.5652235, 2.0679426, 0.0],\n          [102.5657492, 2.0687065, 0.0],\n          [102.5672003, 2.0700387, 0.0],\n          [102.5684851, 2.0709099, 0.0],\n          [102.5708525, 2.0727407, 0.0],\n          [102.5735508, 2.0746706, 0.0],\n          [102.5738365, 2.0748676, 0.0],\n          [102.5750033, 2.0754011, 0.0],\n          [102.5794718, 2.0766635, 0.0]\n        ]\n      }\n    },\n    {\n      \"type\": \"Feature\",\n      \"properties\": { \"Name\": \"Sungai Terap\" },\n      \"geometry\": {\n        \"type\": \"LineString\",\n        \"coordinates\": [\n          [102.6028746, 2.0958478, 0.0],\n          [102.6058143, 2.093875, 0.0],\n          [102.6063937, 2.0932746, 0.0],\n          [102.6066941, 2.0923954, 0.0],\n          [102.6066512, 2.0906799, 0.0],\n          [102.606737, 2.0896721, 0.0],\n          [102.608239, 2.0873991, 0.0],\n          [102.6090544, 2.085705, 0.0],\n          [102.6099556, 2.0830675, 0.0],\n          [102.6109856, 2.0812662, 0.0],\n          [102.6116293, 2.0785215, 0.0],\n          [102.6124018, 2.0775351, 0.0],\n          [102.6212853, 2.0681856, 0.0],\n          [102.6227015, 2.0666846, 0.0],\n          [102.6258343, 2.0645402, 0.0],\n          [102.6266068, 2.0632965, 0.0],\n          [102.6309842, 2.0595652, 0.0],\n          [102.6345032, 2.0586646, 0.0],\n          [102.6379794, 2.0572922, 0.0],\n          [102.6405972, 2.0558769, 0.0],\n          [102.6427215, 2.0549763, 0.0],\n          [102.6472491, 2.0536467, 0.0]\n        ]\n      }\n    }\n  ]\n}\n');

-- --------------------------------------------------------

--
-- Table structure for table `drainage_points`
--

CREATE TABLE `drainage_points` (
  `id` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `depth` float NOT NULL,
  `invert_level` varchar(50) DEFAULT NULL,
  `reduced_level` varchar(50) DEFAULT NULL,
  `latitude` decimal(10,6) NOT NULL,
  `longitude` decimal(10,6) NOT NULL,
  `description` text DEFAULT NULL,
  `last_inspection` date DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `last_updated` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `last_operator_visit` timestamp NULL DEFAULT NULL,
  `operator_notes` text DEFAULT NULL,
  `maintenance_required` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drainage_points`
--

INSERT INTO `drainage_points` (`id`, `name`, `type`, `status`, `depth`, `invert_level`, `reduced_level`, `latitude`, `longitude`, `description`, `last_inspection`, `images`, `last_updated`, `created_by`, `updated_by`, `last_operator_visit`, `operator_notes`, `maintenance_required`) VALUES
('BB1', 'BB1 - Sg Bentayan', 'Concrete Drain', 'Good', 3.4, '-2.921', '2.179', 2.050527, 102.571481, 'No description provided', NULL, '[\"/DrainageInventory/uploads/68408c4e5b692_SURRRR.png\"]', '2025-06-04', NULL, NULL, NULL, NULL, 0),
('BB2', 'BB2 - Sg Bentayan', 'Concrete Drain', 'Good', 2.3, '-0.359', '2.259', 2.048882, 102.573746, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsZVtWgepVbiBSQx_SYgUbgvnYhWMLYi54Ni13KnReF8zIIy8veeJX46CFb2YFW-zZWWUVM28VAjsDLfp_Xt5IZLUpsumL7yHuxd4cESCYtmiGMjxiLDhYEvKqaChNMSVYge_PrWgL1vMQt0oRUbdZCGG-4vqeKExhu-UmPDyiTmc47MsGRUWG9a05Y7eluykggc3mvb5VE_sW9tOh6p6U0TJc5qJCLLbxHyaPDYVEKaj2yA7WDG9BU0fI?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuSVGpZOkO6kbJ-88-bXNEhRWCFWTydk9Hsgf6geTtYyimxE2A5_xtY_a3xs0UsgIORfEM76wylcVIR6K2TB5Se8OOjR6YGkdCQ1WKtjSKhdBdzhRUoSuJg6kHDmFw-TkNBJdnQ-NIXX7l3GFfyuJikJ0WdR7acby3_ZkHk0YfFO-hRHT-PPFLx0NRhvxD_WbhR3ri9O1YMnIqgsmpY2IdGo27awcVvwHF6wB-3qdxH50AvsjeyV11jp0U?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKthwo6ILtOnydDa0-i7eN9Y-jlq5z9f6z9BObY4KAFFdo_RZ3OvnMsJJlh-UC4-Txr8Vz3lEoTiSoRQ1pxOaZFV2CSL2oivugKo54wvi45pCD4dHJNeyR8yQzDmQ_hZyXUuryPkNwM4tirRMzVYNQIcaZFEyDJFUJYGFc21DEgFioPhUDhEqfChhHfzyI5l2BDD2YR8y4MwxoU44Q_2cA8ONPKkfb6z_yzP_HtqXDVnaEmZKStj3qRavSA?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('BB3', 'BB3 - Sg Bentayan', 'Concrete Drain', 'Good', 4.4, '0.483', '2.583', 2.048568, 102.578422, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtVDE01QsaPi2y9CdjYvwhAnID0gSguKmo2c7ivyhx-4w4ryoq9cEUaxQQuGq7TGeRZc3NRxLjq95fEZEGaFfksqBFTfbi9Ze1aeSSb60rHFXn4DUoAOI5dq8558qS-MBYrSdvAb-1NvHqOikTyMiuMKITTcSpg32whTUVp2M8XFk6ELMrnnel2EEp1jx1niFUewn_Pt9PuH_46oh1XNr24-ecyJihvYwyPuGHAiZnJMKN6vF1G5ty-21k?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuKnvTucIm-Yu54VsnbtCxd4w_tS6caDjxiCzd_nCzGIG9iENB7omXPoGtPDmaNGCZ2XiLDA6hzel5eH9XmaYcumJCF_oKQcHmUJubXLdRgNajsIgPix6TNq1QRHbxFsG4g-gGAmAby8qmJ3_ChyaoY0Pu3itRL8UydVd39ukRuMl0FVigiB5ZSF-iV0og27sR-IjY-FmZzSdEk3Zh2jbKmvT1rqwoBHEIKPFO0Joa2kpqugyjNLE69fVE?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKug9MpntJdLFxhvfkcle-QXMV1EnDPD00IygAipb_03AGtAm2_9eo5kRycKAA-3ldcxRARXcDrWT6uU-gewgHXoAv3zu_1-ZfYQ9gYRTWFKkRTFrCgpp2EOL28GrNh2OocNdj8oiMwQEmkQw0mGaVR5EoHyOcSAAjkmcStoZsv3X2dW__qcDGIujEi78KlupOwf9dZxTsHESL-HEvXj-e4wwo09gUyYLwrLj05N8eULUDcS1Y7yCTE86c8?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('BB4', 'BB4 - Sg Bentayan', 'Concrete Drain', 'Good', 1.1, '-2.069', '4.269', 2.048499, 102.581174, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvG591icGMmINZi0YNvxZFt_8Yeu0LwRYjneOslpaY4xCOt0rtlNFyeCQyF7wKQuaamp7HlCWRBRgc87Qe8GxDnf4DtCMOf_jBv9l37aS5Na7GC_oMbzJ1oYCf9WQDJ_illyfU1scXzss2qhG_K6CV97cpAwi0WjCbAut8EycHQ2ZBAgaMLf3GtFJ2DLx_F5XxhZbJgphkfd0abM4c9Rnli3MfwZmozxfmBoU2RPP0jqdZm13hvJ0_itx8?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKudkkG1BdwbJez27Xg_Wv5Fhxcos20YNjw_Bltg_cEEvN_Ew_ImkMjIzKOT66KtgZCZ9tx_tuUP8AXKaqW3QCFYu62quhNgNLmrhpFC0IbjNa59hYqFTbUP7DjMeNB5Bc0ZIV-w4PbGNaNKESg7rPDJC1gpL1l7l7uXwojl__Rmjz7JBvc831PZy7h2vJ1E5UiKnNz8HXbXs0_3q5mBMa7TzGv9Z1JFzYA_H2tJBCXUkILn9eTQsbRmpik?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtSbn1xhZL9Dvw6wkNeLkvcbsEunjF2aOyZ7SFb3gSPH7l_5mfKGquqkoZUlQe_22vOz-zPRvpkAYlqEw-IpkONcj4OoP2Dpk_CVLZ5KA0Hu5TAmue734IJ1L8MeAQAH_Gc411n7wn3U9-GjuIXN96rEiTUBcs--gqhOCdLr4qRwVxFCCQakt1pDWEpg3Sp4hV-69NjyKo1juGhaq92tSJy32_wW_AvBofGDZWQfJjicwcDURhtWTdjzG0?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('BB5', 'BB5 - Sg Bentayan', 'Concrete Drain', 'Good', 0.9, '1.185', '3.985', 2.048339, 102.588420, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuE6etAv7cfTrqoXaBW0g64x-VgP5U0b2LfcmYDuXxtS37cLbYCBj-YXinUvlJW9br0hchSM58fdxl8xvFTONCnYoGx4zB2WDyyhdiX8EVxOJBaKFYE0BT9mKVW5NptO3JV0fhOLBJXOWhDGgBnpIDVtN5GnClGQB9OMnlL8iZD_v_57sbdkZXaWSkb0UaWEFGWKEqI6ZbwH5vNHorRAadmR9dnHBvqMu5T-2H6J-rrgViVUNM389MfHKo?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtUdl-YwihLRikOoNLUnc2TTfNwTRyClACWY5b2hi3anCueGCfAa6FsdeO5U4Oi5Jtu73HdUExhaisA5hPpC8fmXJARtR4mbmVorbrt_8E8-inCywr3WCz1dZyBZsYtCUsY9igPQTrEqFxCrtPB5rdSJU1LoS_Wes-hzxanGQDDSRz-K9sdXqN9IpFMIqMdiXNvEtmiA60yrzgJpVksuHqm2gTHOYqOh6KvrjggGwgr28sNka9RDcyi2mU?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsi_iixDV7DZDpvpDTw5eIImF4buSF676egEB5UqPtiHgSz7v2CXEkmVlvNy-v9T9anV7z3pAYlAPYmw4rpLrAtAHaNBYCqMXdUrYpw9KvTdbJzV8gVlJEIsY6HhQahEk-Btc2v_5qwm9wF0UlDBqX_1xVnoIXuiUJjCpjhBJrSLFaZJpm52VmkB_oq92tmpXdJUikKUtsS_JZWF5xeP64cZobD7uQy0Nk1Tm3LbGe7NhpUak7GN0MROAk?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('BB6', 'BB6 - Sg Bentayan', 'Concrete Drain', 'Good', 3.5, '1.136', '3.136', 2.047850, 102.593966, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsPC7HEiq3y8yHrxYd78qgaItOuGaqBZpp_-oi_nUwR6ci8Cxk9msouVlGhjyU4AWMZl0jV1X33EajR8wNY7BQIhmMOQlrVdOVMLur8PWrnU35locFWCWzGUGCrNdk3MVmVLYux_8jTv2yyTU9X9Ml0CFMt4FhunzSn2EAeChoICV55s8VMJsslzEWcQZRgdABjyDUM1SUOdE_0_9uyfHk3FGkLVu9psfocOeF5U1b7mODWbpC3DiArRWg?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKunVLGM5W6h3ClF76QAgGT12I7ie3oGamG1GaPdtrOOPpWtqcBPaP3VfWIcnoVJyuK8fCsUOqTmptCkJevMwhE4AOIyBYKnrCtO7qpVqIOMB1s-z7BT74pONGWaMXlEhEywSu0jA3tsugcPWZudk1LoTAHf9xGkLvuxp2DqIasrPUxyhnWUy_3xigDRJE_2L-i1t5NnsClBiE_pR2NkzSkib7VeYH5au8rlZZah6GIdHxyjU3KV1a-jk4Y?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('BB7', 'BB7 - Sg Bentayan', 'Concrete Drain', 'Needs Maintenance', 0, 'N/A', 'N/A', 2.047305, 102.603401, 'No description provided', NULL, '[\"/DrainageInventory/uploads/68408dd5cb0e5_johanne-pold-jacobsen-oV3NeTurBa0-unsplash.jpg\"]', '2025-06-05', NULL, NULL, NULL, NULL, 0),
('HP1', 'HP1 - HospitalÂ', 'Concrete Drain', 'Good', 0.6, '1.713', '2.313', 2.057882, 102.574719, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsIMs3fl3jpSwkx6fHC9Or8Pz7iEtvCg-9J69UOeIjywQF3lLi_sTacu60lEtVFbpSITl2O-jnxHepOxfgzdDIH12-6b2VBsA5KJZN1DNYeH2LDaOiKq1OL1qToms7LMIkiKS8S66Pz2BgCoGloqMBn-hpDH2nV95-eNOA7PUblpNdbqtbRKW9TdsZ9vYlLgrCd3Jp8fbFxMQIpfSzIMopf81P-UwqPGpmsE2oIzSS0P91I3ulz3gu36tg?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsX-tg_11AedRmaOc94Qev6HCPKDFTs3Zf3JC3-lAgALWec0RoGQyfl_gWEgt3U4yvsYnjVCYPttnmRIt0V0RSWNSB0-qAEF6dJga-nunt5ZbZk7x9ic3-0fWzPnyk0Ng2sBXvMWJRB-9DwAuB8C_vvG9BJitXmZsV0FRFyNB56rzhY4DeSez7tewVqHi5WM85MGhH1XiR0QIXmEnmqzxtcUFAlOaIAVLDChEXfWGa5e5ctKDH9Uzm6aZM?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsjT2MDB1uphbDhDwUXtRjDy0RjwEQpsRRUU3ui8LS0ermuFQmU-h8Q4AGFKD1rhXI7Dq1qT0OLuAF-B9Wu8XCANuGiu7LidQlWhTDVSLLmHGTgEYQREGlrVbrJVE9NVf5y0bXOu678M2Zuh163XFLVesCzQUlRcW6TpRm9opTzZqTBNwQQjHSD3_FEnz_s6FakDM3VQoTyZRfsNcj3JK1-uknm8JDs-AMnNszhvEqhUwEzuZJiZXX-iTc?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuxnQlSPP9FVQhLmFjx4afSLoPN_UxnKuBgWCH1Kvdd0usarpyndR74olgUq4iQAx42tUL3wKLKzMhsX1DcpUm6bWLlxHX3uxda284HiSZ9H8uqtXqNetig_7Bpqx2G0dQKj_fH2GlQo9eaB_nWK-9ihZ6PYkh06J5OXOBE4CUry2iqSUu8ljAW0o5CRHXRQz97zSJ1bK-k_QPr0c3LQI2bAbjj4Qm9xHSD65r5WQ3sAzdbdViKS8G2mWQ?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtpdvpz3yMMB0jhOVptJXvB9dM9U1JiLztXGsqgXgUpoG1n-9FCHU_ko_Iv6lrW9zdlGb4K9FH4AzqxRir2zdmR28KKv7zFoU8jHWrG9ud3AZYjsv97byWqddbe5Gjt1RtnQ_yPsHwi_4zxIH0mVOhaAjeOTo_2wBVLZsKGxHZbD9ONqeT2kVQ642B3p86_-zPZR4TcUkTswfzUAVzSxk6JfXIGKeYI1UVkjVfRtq6VjtX_uYCHoyoFqVE?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvF-JI7cTZQudegBftMe37CeQlVOp3QzBRPjnk2L2hHiDJlHvuZu5jh4T6sYkx12c-RLjPY-VY6R8geknUn23McSEJZCLTCZtjbbUavH5o8j8RKE8A0iUcYIgmxc7SUyubCSdJuE1GboxKbPjiZAELH5zPf0g3rBEVpkRT0GesH1ZNIAdNKXQabfopH11_FkCmdOxBy7vkAu4JbSc9ROO4SmF6KN0_4MR62ERlIIj16qG795jegyhp-LPk?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('HP2', 'HP2 - HospitalÂ', 'Concrete Drain', 'Good', 1.1, '1.24', '2.34', 2.057750, 102.575628, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtzuEVZDhg2wzOLDgP6-nJKpbTvBgTzirz513AvYL4pnPO8JZxpz2zPyg5OToPjENSJEAi285XDAV35k6uiBPAtjf5rm_RvXzKBnTh_xtK_C0nZyRpjtad4v0etaqEyaapmRYT2mWgI6RxfE8cnprjA9akbHU72QiGsRIFtPomW5rlAVwlVMOol1j2N5JDQhXtK9_fY2yFZPOGyucPFWZoUD7SDDOD6h7Q5E9lrIF1_f0qXF8qF59jk0cE?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvjYSJXPle8Hyy0vXoC4BKuIU6UdZVtumSvDEsn2jUCkkbKkTsmPmA-20jMQB065hN-4a0TY2L_KmXMNCWFYfGpEZJJ1CZqKKeRqHgVajIp251oej2kZ0FVhLftFCfabTwJRTZMojf438vcbBGXwhixWctLdFCyJSFISO_1BJOGiVfHjBb_bjfzNY_MiTEOvlZAJ8iXww4IsEhJKl6Nte8PwPCD_mNuywPtt97xwxCbjb35DBurWwpN9Z0?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvSyRJufSRHEGqpIcrqhNb1UltnwPimPWQM7OWuAdRJTbeBKebxaTiMXHWZBMAUz_-cS__nl3GImsZZAyz-2_KvBmehTgYoLoh0ONnvATpQUz-nLUu3yYTgQCi_x3p1DC4El41RorECfxARZ8OVv36Hi7HZu7peZwuslE115wb7F0PgHpQ2iLQJIErJvuhSCRrhKY1G0TU_0ZJgWuEf3hqnQZrT2MWMoJZ4ze3u8RMFuzuDS2_Hz9r_UC8?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuL_LxrRZuEc7O9HYWqjvJ7GizzcErVbJxMhOKUATZHrw_xaw4Il9O6oL81wFuO03ESooMvsOcfPtF2vgUa9gn7DwMlLtqUp5Rm2tlhC1qe_ku_lNcEHVHR9AnbQgFo3k8K2ChirRV-JLUqatsitywHR2rDmTiErxJimDV8QLtbmkcybLTKAHa11Dmozun7TVpoAK6d0_GSlHj9opHITrjpUeXp5c9a-fHho7IIRmbKFhV2g37uspHB6as?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('HP3', 'HP3 - HospitalÂ', 'Concrete Drain', 'Good', 0, 'N/A', '2.204', 2.057696, 102.576691, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsdN1f579t6tiMUwHa0PaYa1i929eoDXBI8kXtDY8tLchjonj5TQBlRmnn-xIev1oxpOINGd91s7aIabJrY8zFMU9jDkAgO0bMGeoamuYGp3JxlPgY6ZT7b5FUuqThRWwQDO0fWYJsLAdqUaBqxwSaVU37ZWqZqKSkrSyJUmBJjq3-slJueGhyd1lhOqAkB5kxjkxB_dP30xLE-Fs8l65j8APGQc-Z5mJ2Of6UBfebthq_wibB_-XqFOmc?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtDZDO2AH0HhosSzu_XwMHj4z3Ic1UpqiuXWPJL34sH_-KatqhTXAI8q0-PonkGDjDDHX3psK4JKinaOdfAEKOOqLNchV8xBGZ6mx3r7lm6uma8bLLRgPENmEONxNonNanI1vvvKNARDIyjwPM_p_A5sFWAKLDwT3ucvAQgVkYWjTox_wFywQEsyPb5Nzshp-pE-eRGcODSQF-um6dPt5462dCb8NswEl8-B8SV0anhSzCctBfYkhCH7bo?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvQNMsScTNVu9uCBJPP11o4T-5UQnRUQ4amz_io4wo8EmtAiX98_Oeo5HGQnAoqlHZcQmKfbKCs9RwZdZjbwLoK9zpcs_j1DO78kqt2aJHLcKgI9Htx2v6xt9H1CK0u-gz1lqscKAz1pge_Zk4MXqJGc6bBESZNP4Yi0lqBxE7nz1qkbf2STGzu5D3753XfB_V8sEGW29_B_B4Aa0ASkjYOEdx_D6clYFDh3wDhfTgzmxjQA305Tmyg8TY?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('HP4', 'HP4 - HospitalÂ', 'Concrete Drain', 'Good', 0, 'N/A', '2.691', 2.057514, 102.576734, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvghfC6NYcwSbDKVUFPhdzVdbiiaR2nXs7OT4Kz-dWJy98Y9I-SRnKPP3Xv_0tRGizTVza0EVv8kVp5Z7d9hRzKTET8-AwU-Oa3P-kDZmtc8mF_bq7nFYuRtNNQanHDJTTPGC6bWNOhwYZEX1natAnoclr6qbdWUpg0YgoILM5SJqKetaGEJqUBBLMGnKjeVOJc0nATtuMqXg-zJLMr7O3dMF1d3FzzOG_FEC-zFD09AAyq5XsQz5ptv84?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('HP5', 'HP5 - HospitalÂ', 'Concrete Drain', 'Good', 0.6, '1.223', '1.823', 2.057273, 102.577885, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs4vZ2Cq_fIS_-_PV27tWMWAFqHZ0gSd4voO2AsYAbmN4TFRcST0eZ-zyAd8PjaSHiWovRfFfzYyXpJX2Gouo_CfdAwRWWf1FKfhUe_Y5vDBTo9RrotK4M6Lqk-W61KR8ZDLQxsXz44fIKaoC7YiKTQUd6-WXY1yJDa4xths7IfSbWCyF5ykBtIwr6EHq2130wfnvgC9XmAPpW_KmW70LzGaTqcEFVOWHjyDCtziZA7jLCsE-NI6NSwOJA?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKv4R4ZKyQto7tzrtuxjGwjFEmsL3RSoMdPWsnyOijVgZgEcldZTcTjB7DQrhOWyO_X_ieObfL1MU3-ZDoc4iMtNTTI2649otY77qzAhtlrmgw5vvgHBqpgLNnLuKXtfjBBwDZDMeGrsnid-1YNMiDVHh8am58cNG2yxQ-1f0LVl2A2dnc_-xN8pN7EOtbakLa5RM6claLMDIejg3AqWA4Bd-naULBTdgJx9uj-cdpA0jtLStQtxGkuBOFU?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('JS1', 'JS1 - jalan Salleh', 'Concrete Drain', 'Good', 1.7, '1.26', '2.96', 2.076724, 102.579533, 'No description provided', NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtkGLL5YFIRMzE8ZlGJJjdpvp5B4l3fxmJtCdzEDgxoCgNrWYXLbkTA4nGkLRKcwYlUq_Uk4RadGSEmZxVMRBAOHf8ybSm_k4uCzaJQ7fHkN4Gqf-24EtftdExxOY-c2gckvvgB7EyQWMOlkHZC3FPwYeF4z9NTMKSgfKPsHULgCX9dOVwZzt6ylP66BugDkMQ-vJEGbDHrjug0o6D_sztwqic6gAkqLyHMfm1CHbC8YKW1G7F5fd_g8PA?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs9XldI1f2TDvm9UUGesw7lwCSTRPkAbJD7V7pl3xzuSmdF0iyF6RfrdJFcE9YWY5_6e92SK-SMaqnc5ydBu-I5mx1dc7eQSebr6q4yPPGEGxChNBBZWCCD2r90o3sfXG6eJo_KWcjeh8cu0TayIYS1r5NtvMxVDHU1L19cMjPXVXAE0n0zESCjvNWGUsLW5OpwQWl8oMGsjSfy0r9O8VKMZlDy7nKPXwGhkmwYXPbDNd8VoQeMHZ7vFH4?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt8x8nRXxpezlXVrqw3KxEqZ7Scl7XU8mjZ7CCAA7vjtZG5tgWNv6nimEoNsYeijASj-JYyF8vU-IU6BKUxh6AyYtKWkorpLpqngWkxYRiKtPmzuPVAlsNfelIdH7Ea3UGa6kLVzO-A_2a_BuSQwI_KN4QCiId-kj-7F3FXmRh77sQgNstcU0XACbaMOrlU8CRP2OzeNJeoOJp6GxUOq9Uaa4AEASx8166wQmq3p-a6wogR4OtWE8H2jZQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsS6jG5tBntIGclDF9E0iuw32BSfWBmlSAxqEeqv-sgITd6d5q7nCbRts-OnyGY5pWejR0MsVFC0jN3hfavAfcwXUnBYO6vN_Tvn37boTsiZ6ejYonwwyX1i3KsP39iNlrrnB7EFOuxF485F2ZvKhbo-OBZVX9DG9MXvj3LU8lWg5Ox7l3NlkP9NRsJlDsvoKpW9u85RUh8On8ckA57hYBIvo9eGL6-sOwya3RT3u1Q_8GK3b2m6GMqS7M?authuser=0&fife=s16383\"', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('JS2', 'JS2 - jalan Salleh', 'Concrete Drain', 'Good', 1, '1.885', '2.885', 2.070812, 102.577999, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvRlmRpaqUf3wqOTPi0Tfb_FsH1HLODCkQVo-zhekZYy8K8HyGpW5LNQ7e0FEu26-tdqLs5Crszcqjs55aTjoFVHeIGedGqxWVr3khF399JQAUkEGeUwmXH7D4jS_HQchYQjWMjNIXAQWAse7CcbcBlm_BfYgZabBcsDcdceAQix5TI-oJKPktHf1omDPty_roce7IqSCDmTjyKIwfWdETPsCyO4StMHX9p-GH9nYkauR4t4oPifZTR9e4?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtJATKe6fSiwJ9p1-BjGQU8jCzkJ0r9yDe7zanmJAShDI4YuThXcHA0sqt8cAijcZM1BblLH0bbcEyyz-MA8uHCIHD4ErZQ6vZhwG1vAurKznwoRpsXmm8LliLQHBAHL_62Ujpnj4apCBNrtGXkUFj1I_C62IcxNxsieOIMNWgWaWhgovh313nrmCckuQ7M3n1WazyO0P2dpYbHuLz1rMF5FjMAS04KE_apCiP_IrGUxZqKf3RoIHevKTQ?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('JS3', 'JS3 - jalan Salleh', 'Concrete Drain', 'Good', 1.5, '0.812', '2.312', 2.065824, 102.576717, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKugezxoVEEX_Yt7LEQKF6VifBpvBdhAVPfiPwx7hpdTDvoX8A9ZAy34EwJOVVIf7uQq1KUsyu7QnV7ZL-8zG6M5b08LleQdaFReRqxFA8VQUnkr5kxTxDhYNvwMIqXThi_b_MoQZKb6-_ER5-0QO7uBjMBgIv3I5mNVap-A8zRol2MFCQjNErKHwHppilv2EIHyqhOy8qYPdHuW58W8xtZ3YrlHhBcR7KP1OXtrUrQE03PPQDsTm7uiqoU?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuU9vwEUenkRVEEZZZfbEP8j1ldZNZ5DSlz9B2aU6btvbJTdtBnWPQrs9BTmLasODiCvmvTkO5Qt_vkka3H0kyKth8c5o9ikmQ2gsNpNR7wtuGLIHOG43SMM37TGH9vtakXnR_N1C9VjMrLbWAgrkJDbHg-NWHJPkJDPjhtTS45HBqSZt2c2E3zNuqXDb838AQAvNutEV9gEvPQ63-ivkcVbawaPKYVHInfq2Iqq1OJxHR8Y1ApLeZHwaU?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsR1F6N_77oVcFiUbPVrb3dJweJGGpcCmkiDCta0jIiCcPcAQuzxY-FM4_ISrDa1qzFwJDxItVlARVLghP8k0Sok2iwsQCIGaDOEBVWszV5CfJDCBBX28YZnGMH1ba-Iq20uCRY7-sxYRKPgRigij61L7Q-QS1ERLdlwpg2k3VXQzw66IvzA4bmreuThqKPIq6gnMqyKRS3TqleSMhd9H7UEfBiK3E3GfAmmBigr3Km5fMiVZJpmA1HqNo?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsLRFRm_GURMZoE2tYCMb7OU_Io0-_tmgoURDDpdF1xnc6Ucq1DfQgDHC0EDMne3_d8BrdntcXhkVVbVdD-UuPOprS7PosAYXnwMOvqLX83lYacwTYPqYbCsjUIjVVyP0Raz_xTpwivLCTtuy-uVjPwhTH7xfCiCCm2oDfb7ohprTlo4JDasn3wobjolGOsdkwFzf6JLn6r1JExZ4P5zDlbI-uURgkwYytQKZWNjGGwsEzJAy5oWTyYR4w?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('JS4', 'JS4 - jalan Salleh', 'Concrete Drain', 'Good', 1.7, '0.911', '2.611', 2.061064, 102.575555, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtMgznmstuDw5hJDvfPuETy4jrF022FK9CjX2jl8o5RnGRPBtCv6e2KqHNTLVRo8ngUeNCKdNoXkwFDMMfUyNDXqQb9maCNCTNaGhVy5ywmL0afsVe-PXvAsikVcnTwXNAhgttubLlXyKxt80p1YZWvZuO7tf67rDKZdIknynjnS6Z3IXqdCeVg0nWF2eQUv9TXU3TGT0yZ_nqHR98R4fto2Hrtl4U_QtwNJeuDP9vKKZH4puYv_3S4ZWI?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt9uzvXAAykT5LNg9Y6suiXlfMSYp_TxDKFBH5mokSm6FlqN2xjUttnWlrpEq_X7D6H92Rcy4AiGMZ89WRHj7vPHI9jvuzI58l7xOFfg_63VAk_uMvitDwoHxpJp7Q3Fbe_DUx5UJLCxcroE0FNd7eEExbUhAlAm6Jr9dt-Gq9oZOiPH0xWIK_cKvky-jLowWFgrTv5h3WlE6zk0bhwt97LnlhjTM59u7FZrkjaDlEikg7HsvoU8_0iVf8?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PH1', 'PH1 - Hj Kadzi', 'Concrete Drain', 'Needs Maintenance', 1.8, '0.146', '1.946', 2.048300, 102.573836, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKut1-Odt4MqpqxZEmOvk76br9ViUt_ue2SehS-dYvfuQPPsRjwVq7rwp7wuQ-jneBtSE5sGiSLqno8yrI6V3S_ZA4lzV_8Cc5cVeU05lFAT0oSZVBmD5UZGD0aQq6IIYdA8oo8AB9YCjbxulpRhEjlqgIj0qm5-TgVPdXoTzYmiYQRmKjmZrkAVwpL_OwrSPHBK52qr0wPmJjL2qvzAHTxu46Sm8nfAijoVgXS4zOtGamMdh3RWxqFp-QA?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsRj_FwSMGnp2PChnQ1m39mgUltjlmnDgtHB6ykQYpvCMMuYpvVtlt3vldZNP1d5zTcBqR5iLo4GgA_meWifyF8-58dDWs0jPkzgQ0kfNUFy0c7iQ1lGljV_4n01NPvhy8CrzBRnD7JSUYYmr4hXHvUh-aghNL8hBiCqmkldZ8KO13zPPKKHXaF9iJbkWwMVmJrm9yDpMS-7_p0OWWqn6dOYWZTtJuz9G6Z_lfSEizs8iLjJF4lygfDHs8?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PH2', 'PH2 - Hj Kadzi', 'Concrete Drain', 'Good', 2.4, '0.754', '2.554', 2.046068, 102.575121, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsyql1hlRGPN3IDjeS-cgaVLts9dwheUS0_aUhVeK92XQHPYHPru49WgRs3wjAcC-IyDj8QcaTDeN5uk85-Mkd2TtkL6GA1XWszal8b64Ft__9YwVBdDTr-IJDlEzwLqLUz3TZbXH7qwl2I8Mp_qJmTkDSk-fkEREhQcKzmGSBO9LgKEL-Q7YsHljyZfMwSz83ebwBJwk_ZO5PoL3mfF1YrHEt2hikl-pIhJ_iLWGu8IHuvKyOoFAEBwnE?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvo7mEuH5iFrKjzl_k8HFV_EWj_mtqR6lCdV0og7aaqfazLcuhJ4eNpJ_7-r9jawbFlxrJIY6Yi8kzC91p9gxQu-_qYBVAG8aO6Pfp2mzkaOxSqJ0usHgntAujGRGHINmVUtHHBrnC-GEA_soy9V9L_K3UdbyL3StBbpAWBdDpzvMhcDTK8i926-sahxl5ajugw_F-q9lYpkoUmCMqHIteadgwH0OKjIrD8FkeT0bteQHVODw-hjBcHS4c?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PH3', 'PH3 - Hj Kadzi', 'Concrete Drain', 'Good', 0.9, '1.812', '2.712', 2.044310, 102.576479, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt5TmD5d8PNRtx1vXWhQay60RxAoDyNuWpQkDJDXwptOGedTZBimnxpRtT4u-WdofmzVyVumjttyZNvwAH4Wdn535z1tazvseZOAO4iPGZt0boFapNTDC7ye94f4UshHXAvw-_kwSjJ3e8ll0s6mwaz5BbNleV5_ux6Liv4JFtG1fPxIOzHSyuY9g8EKuV56ZrFPKWWByW7WDEPt_aCdx9GsW2BWPw3pR9oKw4BU85W761mt1rvCXOGTrU?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsmpkCei336s016UU3jPMUYm-60s0wjSrcKPJPLwUFxKDe3EIynN6B-0H8KJTNaZ_IrrZor2Mr4goLn3eNXD1wlyE-lns363frDAgyhlfvNNhS23CqI_3p4nLsDikAF4JWYKxUCZ0qVcEKgZyAUfeVOdYdhE3cDxPJ6SmR7jaGp0vZDMaQmssBLHJLL8xC31qvwOO8j2Npjt70qeOFabxh-BBNmtdXPHvuF68LlUSv3uU66zfGJn4sPyNE?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtGMdxDxRvhaQAGlkuwmDQgiwEOcPMDeiafRkc7mYmczzYwlkPbeHi5r7U0j2uh8m7Cy022RoSspEd_DKIdsTD1OsW8prDCZT-mktIPjfzIDQCDPZzHBvLspTLstJVEUqxzxefHqN74dMM_UOAc4ZOz5lcVZnZjEB5ZG7BZy3MHRAbGgxkTroGE4Xe2hhr1BkvUyiGJV8wlp1RJ1gMq9y20quAK7q3-Fy-eilS4PyWmxu-jnkUh3tbJdss?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs3jzRzk07YFWKEQrrLiEZPGkNP65dcnTU8OZOARdEKP2CrqOB_J49oddzeXW6tcQ1sDIxYEfl-r0pwz4_wowWa0qDhCcCOvp4oybZOx9_yxMjWNqSCibxnA280uNisj3LfVTpFidwp7MWkXkWyz-f-CDJg6wZoTvLHgMyYzEkRNIQgSwxnCB9NCaFT8UpjzIgF7FBrrVsYW3dL5OdDgd2FQpI9IFTK8WKEmHk-QXajgChN-9_2pzXT5AQ?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PH4', 'PH4 - Hj Kadzi', 'Concrete Drain', 'Good', 2.1, '1.929', '3.529', 2.041691, 102.578828, 'No description provided', NULL, NULL, '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PHBK1', 'PHBK 1 - jalan khalidi', 'Concrete Drain', 'Good', 0, '1.323', '2.843', 2.036991, 102.561359, 'No description provided', NULL, NULL, '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PHBK2', 'PHBK 2 - jalan khalidi', 'Concrete Drain', 'Good', 0, '1.293', '3.693', 2.030875, 102.555919, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuyf2dz_iPeFLQnPfxLmwY1dBYDgeLWMs9dQxPwehr75LQDf2gOfNOzRljCjfZ9wBEjJFVYRUfupsqWI9_fj-sihQ42jz_UBEm9N2c3y4jONzsb6eBNP655Mhprcw9-dR4PXZ-Ot35dSLWvGVMjFy2Q8_EfNI_8KRj1y_EhLBlqpdugMvPLw66zfBq6fwjJLzuBvVa68HQ76g?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PHBK3', 'PHBK 3 - jalan khalidi', 'Concrete Drain', 'Good', 0, '0.098', '2.148', 2.029463, 102.554676, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKv-RkR1ru6_-ratFjaOyjziwUtP0t3sXVqseT44oKWXvhgEbHfYpHEJ3M1f2NpWacwRjJAaxbzg0ouQ8bSyfZJJTyFynVK-qGWMQHwjTIEI9dc7AUlbGRQI4xWiE_E5R7VEfZKaOdDocDaKAmyj9W_a7UZM-drtNNIwxGHzQ5lc-K5Wv3qjG2k6M7cDhb1U9aNnzuVZAG1hrg?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PHL1', 'PHL 1 - Parit Haji Long', 'Concrete Drain', 'Critical', 1.85, '3.458', '5.308', 2.034287, 102.554451, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvB_a1m19ganw-BUipHmN1gY5xMJ2tnPNAIq6y8l0vLA50N9hOVuPUGDbFS3NOCQswRtT_u3DGysdCRRiTj1V36X3g-pvC1Wx9ZdgwAbU5XDGtJhqCBDVNIWGXK-AZXpPlVGeQXGJg84I4dEXB_MNnOESIZ0Y2l5NOueR4TDPwgNQdxMoGeOq85bAa6554XJBOkIP4Pbb72Cg?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsgB5xE_jSnirIw0FRTU4Tfb06DaXmtTLr99UtB_uihfPT3NFuUi3-fPyI5Xm_hesCQAD3rDRrzQN8lWxj0yjHTqirXmyTsVwGWw3jsMwnczW1_IeWWGcQwh4wHuAVMKvZVtiVFG1l3Br2ceyX7MjfHITOAbW3z2Ijy22MaekRi9NfbKz8m05ImcAob0qvcGhzLp27zSKrRQQ?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PHL2', 'PHL 2 - Parit Haji Long', 'Concrete Drain', 'Good', 1.2, '1.225', '2.425', 2.037140, 102.559780, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKviatRYH8x2CKergMcLcjgOsFe7Zo4X1JrhiyJD2zSG8HbblNyx5iGOEQ2EJjwl5PJu52__w9roZcM7TOS4_pQVcslzZG5aqmem652qmuZFesSYZTcDUb0lWPJlKsM3GaDmP-9r21Fj0BAXX4dZbeGyKACVVV_ICoWuB0c46kT_iddGrKemSUwLlw3Azv7KCvTZFUR12AokqQ?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtDI_u_x2pZnVRVOAZ1m4BEkLG7ylMft-igf_f3A_BsKVL-Awzdgwqc2RdG317gijU-Zkf89PrrIoK2K6w5fGhM1JMXlvjOzdtzXCWF4gQz66SKyrY3rGDz6Cm-gdjf6FnQeQv6YN2DBSpuP_t4VOdWENsa2W4W6mb0Qn0UGkw0xshprODQkpc5axRQjE44fTvQz4i2l1whjQ?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvxEb-SA_uWSnvN0vm9g6knQoef2uP1jg0WxjCUQx7PeyTQEKed-JhVy1PQPYiAcb7lQepp0DmyQu8rJo2k-AqTHJm_mum2Bq6qHaIogCppOHHKM6HjgwAnQsx5rl2DQriO99gTJOisvO66aNERI8eClxyJSRHlTgxll1qbo3Li2BiKC-S42N8Zw4DRev_bjSuDbDe6P-1Kyw?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvEkDrimXrdTczhl8swKx2BVBmXeo-NosBKjIN4USKMd2PsSREgs0awVUN_U6L6t43TnE4yqw6D8d96VYYDscsnfytbeHTcTRCElspOmgAqRmJ3o1gld_T4flP55zmIz0i-h99p55rl-d7LlVTQAD1Nj0svwUvXK4VZuDObSi5Yw9y-Td69Zb70twtltQb6A5SrWOB_ObclDQ?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PHL3', 'PHL 3 - Parit Haji Long', 'Concrete Drain', 'Needs Maintenance', 1.25, '1.851', '3.101', 2.038029, 102.561132, 'Sum', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvKXJurHQROFHXnK1dy8We3l9ZwDHvlE4eXn6RU7hVkbIrSl8ztEWKCuKfWgwMgFTKK26JCOLbrhL2-6Tx0SNfR8bYuttm_UwuLVuIIAS3YHf_2gkH_fXwU-NPl3t3LyH4x1Ba1gaMCldmjizibndghBcUC5sfEFR3EXL_2IpXPyNWCvvGAQHLkzZckoul6UGzLCAqBxrEfkg?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtrdskR8x4XcxidYJpYw6ZBPLknQHiBHyekPHhiZk5TsYIbAGcAVrCsGSUMxGHP3EsqabTGPx6b2mpoHkfXfaWmb3ggTqcRhcwZAAxYxskVZxWFyD0R8LdYJBILOWM-rhr6v8PQkjVguu8kPrlLW32yPPg5JKUzV2EyqtbUkWIeAtBXFn7f9_N23TohDP_DyRi3_QX5fsffag?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PintuAirParitKamaria', 'Pintu Air Parit Kamariah - Unknown', 'Concrete Drain', 'Good', 0, 'N/A', 'N/A', 2.048242, 102.553908, '', NULL, NULL, '2025-05-24', NULL, NULL, NULL, NULL, 0),
('PINTUAIRPTOTHMAN2', 'Pintu Air Pt Othman - Unknown', 'Concrete Drain', 'Good', 0, 'N/A', 'N/A', 2.046528, 102.562976, 'No description provided', NULL, NULL, '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PO01', 'PO 01 - Parit Othman', 'Concrete Drain', 'Good', 2.3, '0.095', '2.395', 2.046329, 102.563050, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKu1kKq7sA-hD6qtik61c6YdkkPndvEQMMS4bSeVApFEmVbzCr_fUjdiOE921wINtWB1uDXnNdnFNQaA_cHZYycQc1r-4QgoAo1d0hnpTzs37itilAYP7JmOhfAnki4OXj35jCCJ7uxwaYw58UH03OGWeJZGYmPL0QBCjjFi9BVsli3Z00j0mwIRo_51VtEhE9pBeLsKCD-5qg?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvUc58CJxpQfoC-FrFNOx9R3MHjNERklggurnIDx_6-qfnrxD4mTSARtxk_Mgdyjd5EKqVcMxrcmoZCE8uAXZ0QgwYdeCCBN01J15I4qTvoktzqnAzEl7hqz0YBVV4R6iCY6vZpvt_YEijb_BDE5WuQYd1ElFHv4jCWvfNYZD3pYoUdbtvcd9b9p_hoWgFhi9Niudo_Ulkyow?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsjkf6C-bt6IAzVg02-wvWb0dwv8s8ivkKmaRDmkFqFq56jMk2m5_17tFgWwqJPASS7Ku8QUIXnWeRRHatzqxHB4yNuZQeePEKuyi49CEmZqDaZeHB9IK4ZkdZe3oVZ5Zhu1qQCFfdH6TIs6UnfqwkPj7OITkHbKXbXJ-YYOBBHW6tdWZLn3FrGuuLoUOubxgq6WA2HbajVmg?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PO02', 'PO 02 - Parit Othman', 'Concrete Drain', 'Good', 2.6, '0.746', '3.346', 2.046023, 102.563186, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuqcaXJsYRF9XEfiFzd9EBXWsz2_uG7bfPI69avY88t1ZPDLrIX6lwA735azljegkKMRpEyJgGmFhoql1hQSOVxmlJQevJ5UcqyIXmARSRTBz6t7rPGmTXjG359cesbiIDL0JB7b4abRDntWPOGN3pyMyL-KRDhQwARFS5mGD7qlG97rTRHPzv9LiynQlUNlvocegLULuK2LQ?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtIVwW2aeQSoC40CSWQ1falMVPLK9mfS4Wxxt_Eb2JrfpIN_TAViz4thz369yL0oP2V3bLeY0NvdlcIhESWtlnN8ZVsOfmZ-tFzQguSkNrnVzobKhOoHTEf_EkRak6uyBl6JwXd1M8mXVT3svCWL0gHBIN2EJb8OBuYxNWy2yV4z1nPge--Eg6aa0cZRn0uK1crV_O1jyKkuA?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsT3nr6TvW6W1V4qNMfBnQh6Jq0ODnZRACCnlPoCWgIEu2obR9JO5TIRU1WQkgx3p7M70aHdgQTOD3UqA-gRvw9a1k_4Itguhl3QU6eSYBtjJbqb96lEZJDCjHTY9HZ5WzP9Tu2YdbhGg8NF6vgZar8D6yCeqwuYNyDeG3R9uRAlDXwZe4rPRNXgWIC0NIEotRuX4rmNXAawA?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PO03', 'PO 03 - Parit Othman', 'Concrete Drain', 'Good', 2.5, '0.59', '3.09', 2.044531, 102.563652, '', NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsuJ0uZalGHYyq6yepXOEk3m0uQ3_F6v1foJMNSjNBwGad8dXwiwWh0um_A6sORGVs9KiAELfIMu54_XTO5-82h08qkn1gyLaBw93pNXf1yLaEz3CoUu4__F18Un5vrZGI-yncCDwwBSokFIwbxU47XlaZ1cTqE6HFyvgPZac_CTCke2VZh1wAGMwzJoCNF4sh2tjo0qF4aGQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsrtzYSNqjdfRkyUjxp2HT75V2ySE0otZ7ZwFgAFnf7yPvRmb0tf-1KA1QwRoD3PhBAow_ZacPCdQAzgv_UcamzUyp76KI8SJCrE7lm_GdIjCzeHtowQfaqA8pWTp2WP-jNKI3kJga7TlmZCDiF02ltfYPWX5RnbyNyOEHYc9r00xD2J9eT38BRvESXpmLENp5CU2gj-dvXDQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsWTfst65txjDjsL-F9g-BkDgTULlqpVP98fr7-Wkp5lYQZnh9cUfMtCSJAstpMyyw9drk4Eim9gSZkG4jJvz68Rgdmp_LL6AAZv5V_VjJIeVH2UOlK0PvnQLUa6n86TC7qPQtrMJ92swYLIaj78imj4TBAG_HZUlaZoNeA1fVrOIG5fyCF9rp7vMLfanFDGLJjWFYgXiyZ7Q?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvoPuNfpvtZNUbppQ9TBphEI0S5Pw_HI8gCxbC7UT003IvJgb1JnTnKoUZBGswT48Q89YcwewwXBgp1xPJ1chjfKnfRWpTTI2crrWMQ87edm8KqLRfX3-c_qGI9Ev_jh_z5fSCrf9dU6ppa8j3SLCBKhS6uhv-eqwdVDgJzPhC5woGBk1xYyBYNhzWOV3Kam4SJh7HzudyI3Q?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuKsPtoM9GaLIlW0ECAB-r9pll--VwThk3YKcW5BRjnnvE70TeX0pvp1celuwfLZuMePY1p7QgmD-14Qs9poBtt-ALtX6ZPHIO6ShroNTo4dO9Z0bSnjRVd9ixWE2AnKhh_CSsabCHujasXQ9LtrjvOtYnC-MeWtIZCi3XYcpS911ZHpDb0frhnbxaOO9oNCGNvJkkeXrg1hQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKspZRGfpJG5YFXbbVFjCCQk6qefJLnCwJGfyURSQ1x_APSUTQDtYdzrHcvCyCMIrwDmI7WXZWmm43sxP-XdkBM7v7uC_OOcux0fDZ2hK2QA06xj9p161kXN_PF_g4ppoREwBB2jEkaG-2t73BYo8fcY1aUWpIfCw3s5VNSIYqGtadXwSFvLJDS8TIp79keKgEbbkzAcGSUrtg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtqSY0uWVnrtzwNWskKcd6cOSgjJrjVCu3qHZnw_sq2lceZiiyvWMKMXV-dg9v5NwzlPOcWji6vAeuY5FDucCz-ubFbAmdWWKSZ7Bkc9mVC4wrl9RAFUdY5px48Bu6VLZiNEE-7H2EFQ04S1pnKfX3Oe4_wK2HOonSIZdrzg4WmyRM4AggtH_Gnk_NeXE8WDXfA_u1xvSp1uw?authuser=0&fife=s16383\"', '2025-05-24', NULL, NULL, NULL, NULL, 0),
('PO04', 'PO 04 - Parit Othman', 'Concrete Drain', 'Needs Maintenance', 1.5, '1.201', '2.701', 2.041241, 102.564916, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuK4tBDPmbNL_SuTygYCdqw4-XfUu6zuBqTVUwz5_ujKJaXpCawISWEvIb_gvIKv9yM2TjhHFqhP4BwvZFD0D51F4f2AZIY_8rsVd4BO0th3OxlmHixwF2fzIEXAh_jXeFjO6CkWwDmsFksJWUwIBJjCzwI6K57Yd_qEVybls_jQTL7ISB96YRNfzIN9weFggN-nuPu9ZBgZQ?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKv_LgpupqBwD354HXIT3_av1ncnSIeNyRvl21nr8xzGkw8mLWjE6Ig45PdS8UIebKVg65zt5M21FmyiUD_lPOJ6BNmVFhsOBXn9uBCm8Z-OgE1YUWIW0Wib5VYPrPJzNAcemXxmohPUxxK3izXdBFn97t-il-f39hUs7jyEotuHw_9QIHXoNvFJ0tuNH0toElryVSWb_gWIoA?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuFRiS-WIwrMSiHp0EQVfkyErumDu2nqzEjhpOlHptTMQ08-zIIVoLHISN1dZdYNdxC-7q6IpKkLeWj-Foz80TQvjMitfr-DpnMTw5XhbcDq5h8H3xRN-K1uAg9qJCu435snEXl0CjDPliTAi5fEg0gCF0ODYmGDtIixZgLAKv-uvEUajHRz4jZsOorggHY_xWnEKchTCtApw?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsRV8E_vEtOMrxD423fWIQWH_BgrS8atuKXGmSnJIH9TcRWXAcqIrrKZ2vN0n5oH-GjuVeqhVqKd8WA-uJDwdsievlf_eHGyvnNbwRlh5SSHVwPsSCOAD9bn2xYhUNrbc75I8McGSN1wBGDaizqJZ9oiiavMpeXYOMWl7uIX327HtmpvpCeiiKbpDVkXFo7EKDEGnhH9lvqtg?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvPM2k8hq50teJkWTtlpFu1eTXXopFrAUIf1Wi9xp9Fu8GpWt5J5qPk1TL2_13d6t5PU5VMJv9ZfLT1RPkBwqD0rS8IxrgTB4roHF1DFRSfc5XUdIjdPxd0Nj4nCbKYfbBglVMjFDjLUmH_eDBdu0cM1hSLhany6E-UJp2N-TONugh9lcGIWWWqHLI-sW2KPpkDdb2cAXDqhA?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0),
('PO05', 'PO 05 - Parit Othman', 'Concrete Drain', 'Good', 2.25, 'N/A', 'N/A', 2.040921, 102.564849, 'No description provided', NULL, '[\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtGX6vD0lUmYj29iEAL270ERRGRETQ-4nZlwtwS9g8-P8u99TjEi0TDo7-X5sR6kIviDDK519E2eXaUDGF25K2HvFOHUSGAO2mdsaXJwJj3HCaBeXf8z4FMcJeFE1yXvZnVPWvCeHaU48PYutiLjDaHiWyapnIYtr6O4cNzXc1IAqEV0uEp7fBzdSTu2wbOaF7WGOfn0MHd4w?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKu7UYTNDuCwm5scqbJ55mgZIFOu8dQGnhOPtOAyvRxJnkP7TJqdyF-TkDt9J-X1iHkdEDova-mhCwV-9pBxuUg0hHqwbhjVWOmB5JVTnGARHICAGARC4xlxEHNxhVV40PNwE_BKZniO2EM1rQWimGTe9XRUSEEhou5Yf9UwwfCOVu58SFvOEaZwB8OhaLZTwOvlZOnm_M22pg?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt3UfSdm1LQGPsMQkvDmaHlq-ftTDvjYoJkWGUCo3oJP4k_tmxKy3U_JTJx9LmqEvdg1bAp8VGfNzjLO_nwHVgdJrmOMZuMpE3HX7pDzYU7a1adm1vAL_8s4kzOqaA7LSGvvin0HyrnIKDlLtZQlxNr5bEKUztnrVXGYmHQdbytv347RhL5kGY4HkuRrfuthKTuSllLoSb3xA?authuser=0&fife=s16383\",\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtPokc2Akv-z6I65WYNqAO1fg-I94IY_4tiPONs19di2aLTpN0BOo4zYb5yMsxXH_J9ESMZQnSXbOikQlRRZYeBIoyIsN5gKPtScKxFuQTBcYUmJ3nhgiwTlyMn1IcbcjBZPgQ4OZ4PdeJBij-Y8vPAXNCxDi3v96mVOkJC_mxKaXmTHDypjVYvvmKnNb83yJI7eIxJ6o0dLg?authuser=0&fife=s16383\"]', '2025-06-07', NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `drainage_points_backup`
--

CREATE TABLE `drainage_points_backup` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `depth` float NOT NULL,
  `invert_level` varchar(50) DEFAULT NULL,
  `reduced_level` varchar(50) DEFAULT NULL,
  `latitude` decimal(10,6) NOT NULL,
  `longitude` decimal(10,6) NOT NULL,
  `description` text DEFAULT NULL,
  `last_inspection` date DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `last_updated` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `new_id` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `drainage_points_backup`
--

INSERT INTO `drainage_points_backup` (`id`, `name`, `type`, `status`, `depth`, `invert_level`, `reduced_level`, `latitude`, `longitude`, `description`, `last_inspection`, `images`, `last_updated`, `created_by`, `updated_by`, `new_id`) VALUES
(1, 'PHBK 1 - jalan khalidi', 'Concrete Drain', '', 0, '1.323', '2.843', 2.036991, 102.561359, '', NULL, NULL, '2025-05-08', NULL, NULL, 'PHBK1'),
(2, 'PHBK 2 - jalan khalidi', 'Unknown', 'Unknown', 0, '1.293', '3.693', 2.030875, 102.555919, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuyf2dz_iPeFLQnPfxLmwY1dBYDgeLWMs9dQxPwehr75LQDf2gOfNOzRljCjfZ9wBEjJFVYRUfupsqWI9_fj-sihQ42jz_UBEm9N2c3y4jONzsb6eBNP655Mhprcw9-dR4PXZ-Ot35dSLWvGVMjFy2Q8_EfNI_8KRj1y_EhLBlqpdugMvPLw66zfBq6fwjJLzuBvVa68HQ76g?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PHBK2'),
(3, 'PHBK 3 - jalan khalidi', 'Unknown', 'Unknown', 0, '0.098', '2.148', 2.029463, 102.554676, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKv-RkR1ru6_-ratFjaOyjziwUtP0t3sXVqseT44oKWXvhgEbHfYpHEJ3M1f2NpWacwRjJAaxbzg0ouQ8bSyfZJJTyFynVK-qGWMQHwjTIEI9dc7AUlbGRQI4xWiE_E5R7VEfZKaOdDocDaKAmyj9W_a7UZM-drtNNIwxGHzQ5lc-K5Wv3qjG2k6M7cDhb1U9aNnzuVZAG1hrg?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PHBK3'),
(4, 'PO 01 - Parit Othman', 'Concrete Drain', 'Unknown', 2.3, '0.095', '2.395', 2.046329, 102.563050, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKu1kKq7sA-hD6qtik61c6YdkkPndvEQMMS4bSeVApFEmVbzCr_fUjdiOE921wINtWB1uDXnNdnFNQaA_cHZYycQc1r-4QgoAo1d0hnpTzs37itilAYP7JmOhfAnki4OXj35jCCJ7uxwaYw58UH03OGWeJZGYmPL0QBCjjFi9BVsli3Z00j0mwIRo_51VtEhE9pBeLsKCD-5qg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvUc58CJxpQfoC-FrFNOx9R3MHjNERklggurnIDx_6-qfnrxD4mTSARtxk_Mgdyjd5EKqVcMxrcmoZCE8uAXZ0QgwYdeCCBN01J15I4qTvoktzqnAzEl7hqz0YBVV4R6iCY6vZpvt_YEijb_BDE5WuQYd1ElFHv4jCWvfNYZD3pYoUdbtvcd9b9p_hoWgFhi9Niudo_Ulkyow?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsjkf6C-bt6IAzVg02-wvWb0dwv8s8ivkKmaRDmkFqFq56jMk2m5_17tFgWwqJPASS7Ku8QUIXnWeRRHatzqxHB4yNuZQeePEKuyi49CEmZqDaZeHB9IK4ZkdZe3oVZ5Zhu1qQCFfdH6TIs6UnfqwkPj7OITkHbKXbXJ-YYOBBHW6tdWZLn3FrGuuLoUOubxgq6WA2HbajVmg?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PO01'),
(5, 'PO 02 - Parit Othman', 'Concrete Drain', 'Unknown', 2.6, '0.746', '3.346', 2.046023, 102.563186, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuqcaXJsYRF9XEfiFzd9EBXWsz2_uG7bfPI69avY88t1ZPDLrIX6lwA735azljegkKMRpEyJgGmFhoql1hQSOVxmlJQevJ5UcqyIXmARSRTBz6t7rPGmTXjG359cesbiIDL0JB7b4abRDntWPOGN3pyMyL-KRDhQwARFS5mGD7qlG97rTRHPzv9LiynQlUNlvocegLULuK2LQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtIVwW2aeQSoC40CSWQ1falMVPLK9mfS4Wxxt_Eb2JrfpIN_TAViz4thz369yL0oP2V3bLeY0NvdlcIhESWtlnN8ZVsOfmZ-tFzQguSkNrnVzobKhOoHTEf_EkRak6uyBl6JwXd1M8mXVT3svCWL0gHBIN2EJb8OBuYxNWy2yV4z1nPge--Eg6aa0cZRn0uK1crV_O1jyKkuA?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsT3nr6TvW6W1V4qNMfBnQh6Jq0ODnZRACCnlPoCWgIEu2obR9JO5TIRU1WQkgx3p7M70aHdgQTOD3UqA-gRvw9a1k_4Itguhl3QU6eSYBtjJbqb96lEZJDCjHTY9HZ5WzP9Tu2YdbhGg8NF6vgZar8D6yCeqwuYNyDeG3R9uRAlDXwZe4rPRNXgWIC0NIEotRuX4rmNXAawA?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PO02'),
(6, 'PO 03 - Parit Othman', 'Concrete Drain', 'Good', 2.5, '0.59', '3.09', 2.044531, 102.563652, '', NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsuJ0uZalGHYyq6yepXOEk3m0uQ3_F6v1foJMNSjNBwGad8dXwiwWh0um_A6sORGVs9KiAELfIMu54_XTO5-82h08qkn1gyLaBw93pNXf1yLaEz3CoUu4__F18Un5vrZGI-yncCDwwBSokFIwbxU47XlaZ1cTqE6HFyvgPZac_CTCke2VZh1wAGMwzJoCNF4sh2tjo0qF4aGQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsrtzYSNqjdfRkyUjxp2HT75V2ySE0otZ7ZwFgAFnf7yPvRmb0tf-1KA1QwRoD3PhBAow_ZacPCdQAzgv_UcamzUyp76KI8SJCrE7lm_GdIjCzeHtowQfaqA8pWTp2WP-jNKI3kJga7TlmZCDiF02ltfYPWX5RnbyNyOEHYc9r00xD2J9eT38BRvESXpmLENp5CU2gj-dvXDQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsWTfst65txjDjsL-F9g-BkDgTULlqpVP98fr7-Wkp5lYQZnh9cUfMtCSJAstpMyyw9drk4Eim9gSZkG4jJvz68Rgdmp_LL6AAZv5V_VjJIeVH2UOlK0PvnQLUa6n86TC7qPQtrMJ92swYLIaj78imj4TBAG_HZUlaZoNeA1fVrOIG5fyCF9rp7vMLfanFDGLJjWFYgXiyZ7Q?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvoPuNfpvtZNUbppQ9TBphEI0S5Pw_HI8gCxbC7UT003IvJgb1JnTnKoUZBGswT48Q89YcwewwXBgp1xPJ1chjfKnfRWpTTI2crrWMQ87edm8KqLRfX3-c_qGI9Ev_jh_z5fSCrf9dU6ppa8j3SLCBKhS6uhv-eqwdVDgJzPhC5woGBk1xYyBYNhzWOV3Kam4SJh7HzudyI3Q?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuKsPtoM9GaLIlW0ECAB-r9pll--VwThk3YKcW5BRjnnvE70TeX0pvp1celuwfLZuMePY1p7QgmD-14Qs9poBtt-ALtX6ZPHIO6ShroNTo4dO9Z0bSnjRVd9ixWE2AnKhh_CSsabCHujasXQ9LtrjvOtYnC-MeWtIZCi3XYcpS911ZHpDb0frhnbxaOO9oNCGNvJkkeXrg1hQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKspZRGfpJG5YFXbbVFjCCQk6qefJLnCwJGfyURSQ1x_APSUTQDtYdzrHcvCyCMIrwDmI7WXZWmm43sxP-XdkBM7v7uC_OOcux0fDZ2hK2QA06xj9p161kXN_PF_g4ppoREwBB2jEkaG-2t73BYo8fcY1aUWpIfCw3s5VNSIYqGtadXwSFvLJDS8TIp79keKgEbbkzAcGSUrtg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtqSY0uWVnrtzwNWskKcd6cOSgjJrjVCu3qHZnw_sq2lceZiiyvWMKMXV-dg9v5NwzlPOcWji6vAeuY5FDucCz-ubFbAmdWWKSZ7Bkc9mVC4wrl9RAFUdY5px48Bu6VLZiNEE-7H2EFQ04S1pnKfX3Oe4_wK2HOonSIZdrzg4WmyRM4AggtH_Gnk_NeXE8WDXfA_u1xvSp1uw?authuser=0&fife=s16383\"', '2025-05-24', NULL, NULL, 'PO03'),
(7, 'PO 04 - Parit Othman', 'Concrete Drain', 'Unknown', 1.5, '1.201', '2.701', 2.041241, 102.564916, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuK4tBDPmbNL_SuTygYCdqw4-XfUu6zuBqTVUwz5_ujKJaXpCawISWEvIb_gvIKv9yM2TjhHFqhP4BwvZFD0D51F4f2AZIY_8rsVd4BO0th3OxlmHixwF2fzIEXAh_jXeFjO6CkWwDmsFksJWUwIBJjCzwI6K57Yd_qEVybls_jQTL7ISB96YRNfzIN9weFggN-nuPu9ZBgZQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKv_LgpupqBwD354HXIT3_av1ncnSIeNyRvl21nr8xzGkw8mLWjE6Ig45PdS8UIebKVg65zt5M21FmyiUD_lPOJ6BNmVFhsOBXn9uBCm8Z-OgE1YUWIW0Wib5VYPrPJzNAcemXxmohPUxxK3izXdBFn97t-il-f39hUs7jyEotuHw_9QIHXoNvFJ0tuNH0toElryVSWb_gWIoA?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuFRiS-WIwrMSiHp0EQVfkyErumDu2nqzEjhpOlHptTMQ08-zIIVoLHISN1dZdYNdxC-7q6IpKkLeWj-Foz80TQvjMitfr-DpnMTw5XhbcDq5h8H3xRN-K1uAg9qJCu435snEXl0CjDPliTAi5fEg0gCF0ODYmGDtIixZgLAKv-uvEUajHRz4jZsOorggHY_xWnEKchTCtApw?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsRV8E_vEtOMrxD423fWIQWH_BgrS8atuKXGmSnJIH9TcRWXAcqIrrKZ2vN0n5oH-GjuVeqhVqKd8WA-uJDwdsievlf_eHGyvnNbwRlh5SSHVwPsSCOAD9bn2xYhUNrbc75I8McGSN1wBGDaizqJZ9oiiavMpeXYOMWl7uIX327HtmpvpCeiiKbpDVkXFo7EKDEGnhH9lvqtg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvPM2k8hq50teJkWTtlpFu1eTXXopFrAUIf1Wi9xp9Fu8GpWt5J5qPk1TL2_13d6t5PU5VMJv9ZfLT1RPkBwqD0rS8IxrgTB4roHF1DFRSfc5XUdIjdPxd0Nj4nCbKYfbBglVMjFDjLUmH_eDBdu0cM1hSLhany6E-UJp2N-TONugh9lcGIWWWqHLI-sW2KPpkDdb2cAXDqhA?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PO04'),
(8, 'PO 05 - Parit Othman', 'Concrete Drain', 'Unknown', 2.25, NULL, NULL, 2.040921, 102.564849, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtGX6vD0lUmYj29iEAL270ERRGRETQ-4nZlwtwS9g8-P8u99TjEi0TDo7-X5sR6kIviDDK519E2eXaUDGF25K2HvFOHUSGAO2mdsaXJwJj3HCaBeXf8z4FMcJeFE1yXvZnVPWvCeHaU48PYutiLjDaHiWyapnIYtr6O4cNzXc1IAqEV0uEp7fBzdSTu2wbOaF7WGOfn0MHd4w?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKu7UYTNDuCwm5scqbJ55mgZIFOu8dQGnhOPtOAyvRxJnkP7TJqdyF-TkDt9J-X1iHkdEDova-mhCwV-9pBxuUg0hHqwbhjVWOmB5JVTnGARHICAGARC4xlxEHNxhVV40PNwE_BKZniO2EM1rQWimGTe9XRUSEEhou5Yf9UwwfCOVu58SFvOEaZwB8OhaLZTwOvlZOnm_M22pg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt3UfSdm1LQGPsMQkvDmaHlq-ftTDvjYoJkWGUCo3oJP4k_tmxKy3U_JTJx9LmqEvdg1bAp8VGfNzjLO_nwHVgdJrmOMZuMpE3HX7pDzYU7a1adm1vAL_8s4kzOqaA7LSGvvin0HyrnIKDlLtZQlxNr5bEKUztnrVXGYmHQdbytv347RhL5kGY4HkuRrfuthKTuSllLoSb3xA?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtPokc2Akv-z6I65WYNqAO1fg-I94IY_4tiPONs19di2aLTpN0BOo4zYb5yMsxXH_J9ESMZQnSXbOikQlRRZYeBIoyIsN5gKPtScKxFuQTBcYUmJ3nhgiwTlyMn1IcbcjBZPgQ4OZ4PdeJBij-Y8vPAXNCxDi3v96mVOkJC_mxKaXmTHDypjVYvvmKnNb83yJI7eIxJ6o0dLg?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PO05'),
(9, 'PHL 1 - Parit Haji Long', 'Concrete Drain', '', 1.85, '3.458', '5.308', 2.034287, 102.554451, '', NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvB_a1m19ganw-BUipHmN1gY5xMJ2tnPNAIq6y8l0vLA50N9hOVuPUGDbFS3NOCQswRtT_u3DGysdCRRiTj1V36X3g-pvC1Wx9ZdgwAbU5XDGtJhqCBDVNIWGXK-AZXpPlVGeQXGJg84I4dEXB_MNnOESIZ0Y2l5NOueR4TDPwgNQdxMoGeOq85bAa6554XJBOkIP4Pbb72Cg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsgB5xE_jSnirIw0FRTU4Tfb06DaXmtTLr99UtB_uihfPT3NFuUi3-fPyI5Xm_hesCQAD3rDRrzQN8lWxj0yjHTqirXmyTsVwGWw3jsMwnczW1_IeWWGcQwh4wHuAVMKvZVtiVFG1l3Br2ceyX7MjfHITOAbW3z2Ijy22MaekRi9NfbKz8m05ImcAob0qvcGhzLp27zSKrRQQ?authuser=0&fife=s16383\"', '2025-05-08', NULL, NULL, 'PHL1'),
(10, 'PHL 2 - Parit Haji Long', 'Concrete Drain', 'Unknown', 1.2, '1.225', '2.425', 2.037140, 102.559780, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKviatRYH8x2CKergMcLcjgOsFe7Zo4X1JrhiyJD2zSG8HbblNyx5iGOEQ2EJjwl5PJu52__w9roZcM7TOS4_pQVcslzZG5aqmem652qmuZFesSYZTcDUb0lWPJlKsM3GaDmP-9r21Fj0BAXX4dZbeGyKACVVV_ICoWuB0c46kT_iddGrKemSUwLlw3Azv7KCvTZFUR12AokqQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtDI_u_x2pZnVRVOAZ1m4BEkLG7ylMft-igf_f3A_BsKVL-Awzdgwqc2RdG317gijU-Zkf89PrrIoK2K6w5fGhM1JMXlvjOzdtzXCWF4gQz66SKyrY3rGDz6Cm-gdjf6FnQeQv6YN2DBSpuP_t4VOdWENsa2W4W6mb0Qn0UGkw0xshprODQkpc5axRQjE44fTvQz4i2l1whjQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvxEb-SA_uWSnvN0vm9g6knQoef2uP1jg0WxjCUQx7PeyTQEKed-JhVy1PQPYiAcb7lQepp0DmyQu8rJo2k-AqTHJm_mum2Bq6qHaIogCppOHHKM6HjgwAnQsx5rl2DQriO99gTJOisvO66aNERI8eClxyJSRHlTgxll1qbo3Li2BiKC-S42N8Zw4DRev_bjSuDbDe6P-1Kyw?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvEkDrimXrdTczhl8swKx2BVBmXeo-NosBKjIN4USKMd2PsSREgs0awVUN_U6L6t43TnE4yqw6D8d96VYYDscsnfytbeHTcTRCElspOmgAqRmJ3o1gld_T4flP55zmIz0i-h99p55rl-d7LlVTQAD1Nj0svwUvXK4VZuDObSi5Yw9y-Td69Zb70twtltQb6A5SrWOB_ObclDQ?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PHL2'),
(11, 'PHL 3 - Parit Haji Long', 'Concrete Drain', 'Unknown', 1.25, '1.851', '3.101', 2.038029, 102.561132, 'Sum', NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvKXJurHQROFHXnK1dy8We3l9ZwDHvlE4eXn6RU7hVkbIrSl8ztEWKCuKfWgwMgFTKK26JCOLbrhL2-6Tx0SNfR8bYuttm_UwuLVuIIAS3YHf_2gkH_fXwU-NPl3t3LyH4x1Ba1gaMCldmjizibndghBcUC5sfEFR3EXL_2IpXPyNWCvvGAQHLkzZckoul6UGzLCAqBxrEfkg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtrdskR8x4XcxidYJpYw6ZBPLknQHiBHyekPHhiZk5TsYIbAGcAVrCsGSUMxGHP3EsqabTGPx6b2mpoHkfXfaWmb3ggTqcRhcwZAAxYxskVZxWFyD0R8LdYJBILOWM-rhr6v8PQkjVguu8kPrlLW32yPPg5JKUzV2EyqtbUkWIeAtBXFn7f9_N23TohDP_DyRi3_QX5fsffag?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PHL3'),
(12, 'JS1 - jalan Salleh', 'Concrete Drain', 'Unknown', 1.7, '1.26', '2.96', 2.076724, 102.579533, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtkGLL5YFIRMzE8ZlGJJjdpvp5B4l3fxmJtCdzEDgxoCgNrWYXLbkTA4nGkLRKcwYlUq_Uk4RadGSEmZxVMRBAOHf8ybSm_k4uCzaJQ7fHkN4Gqf-24EtftdExxOY-c2gckvvgB7EyQWMOlkHZC3FPwYeF4z9NTMKSgfKPsHULgCX9dOVwZzt6ylP66BugDkMQ-vJEGbDHrjug0o6D_sztwqic6gAkqLyHMfm1CHbC8YKW1G7F5fd_g8PA?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs9XldI1f2TDvm9UUGesw7lwCSTRPkAbJD7V7pl3xzuSmdF0iyF6RfrdJFcE9YWY5_6e92SK-SMaqnc5ydBu-I5mx1dc7eQSebr6q4yPPGEGxChNBBZWCCD2r90o3sfXG6eJo_KWcjeh8cu0TayIYS1r5NtvMxVDHU1L19cMjPXVXAE0n0zESCjvNWGUsLW5OpwQWl8oMGsjSfy0r9O8VKMZlDy7nKPXwGhkmwYXPbDNd8VoQeMHZ7vFH4?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt8x8nRXxpezlXVrqw3KxEqZ7Scl7XU8mjZ7CCAA7vjtZG5tgWNv6nimEoNsYeijASj-JYyF8vU-IU6BKUxh6AyYtKWkorpLpqngWkxYRiKtPmzuPVAlsNfelIdH7Ea3UGa6kLVzO-A_2a_BuSQwI_KN4QCiId-kj-7F3FXmRh77sQgNstcU0XACbaMOrlU8CRP2OzeNJeoOJp6GxUOq9Uaa4AEASx8166wQmq3p-a6wogR4OtWE8H2jZQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsS6jG5tBntIGclDF9E0iuw32BSfWBmlSAxqEeqv-sgITd6d5q7nCbRts-OnyGY5pWejR0MsVFC0jN3hfavAfcwXUnBYO6vN_Tvn37boTsiZ6ejYonwwyX1i3KsP39iNlrrnB7EFOuxF485F2ZvKhbo-OBZVX9DG9MXvj3LU8lWg5Ox7l3NlkP9NRsJlDsvoKpW9u85RUh8On8ckA57hYBIvo9eGL6-sOwya3RT3u1Q_8GK3b2m6GMqS7M?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'JS1'),
(13, 'JS2 - jalan Salleh', 'Concrete Drain', 'Unknown', 1, '1.885', '2.885', 2.070812, 102.577999, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvRlmRpaqUf3wqOTPi0Tfb_FsH1HLODCkQVo-zhekZYy8K8HyGpW5LNQ7e0FEu26-tdqLs5Crszcqjs55aTjoFVHeIGedGqxWVr3khF399JQAUkEGeUwmXH7D4jS_HQchYQjWMjNIXAQWAse7CcbcBlm_BfYgZabBcsDcdceAQix5TI-oJKPktHf1omDPty_roce7IqSCDmTjyKIwfWdETPsCyO4StMHX9p-GH9nYkauR4t4oPifZTR9e4?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtJATKe6fSiwJ9p1-BjGQU8jCzkJ0r9yDe7zanmJAShDI4YuThXcHA0sqt8cAijcZM1BblLH0bbcEyyz-MA8uHCIHD4ErZQ6vZhwG1vAurKznwoRpsXmm8LliLQHBAHL_62Ujpnj4apCBNrtGXkUFj1I_C62IcxNxsieOIMNWgWaWhgovh313nrmCckuQ7M3n1WazyO0P2dpYbHuLz1rMF5FjMAS04KE_apCiP_IrGUxZqKf3RoIHevKTQ?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'JS2'),
(14, 'JS3 - jalan Salleh', 'Concrete Drain', 'Unknown', 1.5, '0.812', '2.312', 2.065824, 102.576717, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKugezxoVEEX_Yt7LEQKF6VifBpvBdhAVPfiPwx7hpdTDvoX8A9ZAy34EwJOVVIf7uQq1KUsyu7QnV7ZL-8zG6M5b08LleQdaFReRqxFA8VQUnkr5kxTxDhYNvwMIqXThi_b_MoQZKb6-_ER5-0QO7uBjMBgIv3I5mNVap-A8zRol2MFCQjNErKHwHppilv2EIHyqhOy8qYPdHuW58W8xtZ3YrlHhBcR7KP1OXtrUrQE03PPQDsTm7uiqoU?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuU9vwEUenkRVEEZZZfbEP8j1ldZNZ5DSlz9B2aU6btvbJTdtBnWPQrs9BTmLasODiCvmvTkO5Qt_vkka3H0kyKth8c5o9ikmQ2gsNpNR7wtuGLIHOG43SMM37TGH9vtakXnR_N1C9VjMrLbWAgrkJDbHg-NWHJPkJDPjhtTS45HBqSZt2c2E3zNuqXDb838AQAvNutEV9gEvPQ63-ivkcVbawaPKYVHInfq2Iqq1OJxHR8Y1ApLeZHwaU?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsR1F6N_77oVcFiUbPVrb3dJweJGGpcCmkiDCta0jIiCcPcAQuzxY-FM4_ISrDa1qzFwJDxItVlARVLghP8k0Sok2iwsQCIGaDOEBVWszV5CfJDCBBX28YZnGMH1ba-Iq20uCRY7-sxYRKPgRigij61L7Q-QS1ERLdlwpg2k3VXQzw66IvzA4bmreuThqKPIq6gnMqyKRS3TqleSMhd9H7UEfBiK3E3GfAmmBigr3Km5fMiVZJpmA1HqNo?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsLRFRm_GURMZoE2tYCMb7OU_Io0-_tmgoURDDpdF1xnc6Ucq1DfQgDHC0EDMne3_d8BrdntcXhkVVbVdD-UuPOprS7PosAYXnwMOvqLX83lYacwTYPqYbCsjUIjVVyP0Raz_xTpwivLCTtuy-uVjPwhTH7xfCiCCm2oDfb7ohprTlo4JDasn3wobjolGOsdkwFzf6JLn6r1JExZ4P5zDlbI-uURgkwYytQKZWNjGGwsEzJAy5oWTyYR4w?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'JS3'),
(15, 'JS4 - jalan Salleh', 'Concrete Drain', 'Unknown', 1.7, '0.911', '2.611', 2.061064, 102.575555, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtMgznmstuDw5hJDvfPuETy4jrF022FK9CjX2jl8o5RnGRPBtCv6e2KqHNTLVRo8ngUeNCKdNoXkwFDMMfUyNDXqQb9maCNCTNaGhVy5ywmL0afsVe-PXvAsikVcnTwXNAhgttubLlXyKxt80p1YZWvZuO7tf67rDKZdIknynjnS6Z3IXqdCeVg0nWF2eQUv9TXU3TGT0yZ_nqHR98R4fto2Hrtl4U_QtwNJeuDP9vKKZH4puYv_3S4ZWI?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt9uzvXAAykT5LNg9Y6suiXlfMSYp_TxDKFBH5mokSm6FlqN2xjUttnWlrpEq_X7D6H92Rcy4AiGMZ89WRHj7vPHI9jvuzI58l7xOFfg_63VAk_uMvitDwoHxpJp7Q3Fbe_DUx5UJLCxcroE0FNd7eEExbUhAlAm6Jr9dt-Gq9oZOiPH0xWIK_cKvky-jLowWFgrTv5h3WlE6zk0bhwt97LnlhjTM59u7FZrkjaDlEikg7HsvoU8_0iVf8?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'JS4'),
(16, 'HP1 - HospitalÂ ', 'Concrete Drain', 'Unknown', 0.6, '1.713', '2.313', 2.057882, 102.574719, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsIMs3fl3jpSwkx6fHC9Or8Pz7iEtvCg-9J69UOeIjywQF3lLi_sTacu60lEtVFbpSITl2O-jnxHepOxfgzdDIH12-6b2VBsA5KJZN1DNYeH2LDaOiKq1OL1qToms7LMIkiKS8S66Pz2BgCoGloqMBn-hpDH2nV95-eNOA7PUblpNdbqtbRKW9TdsZ9vYlLgrCd3Jp8fbFxMQIpfSzIMopf81P-UwqPGpmsE2oIzSS0P91I3ulz3gu36tg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsX-tg_11AedRmaOc94Qev6HCPKDFTs3Zf3JC3-lAgALWec0RoGQyfl_gWEgt3U4yvsYnjVCYPttnmRIt0V0RSWNSB0-qAEF6dJga-nunt5ZbZk7x9ic3-0fWzPnyk0Ng2sBXvMWJRB-9DwAuB8C_vvG9BJitXmZsV0FRFyNB56rzhY4DeSez7tewVqHi5WM85MGhH1XiR0QIXmEnmqzxtcUFAlOaIAVLDChEXfWGa5e5ctKDH9Uzm6aZM?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsjT2MDB1uphbDhDwUXtRjDy0RjwEQpsRRUU3ui8LS0ermuFQmU-h8Q4AGFKD1rhXI7Dq1qT0OLuAF-B9Wu8XCANuGiu7LidQlWhTDVSLLmHGTgEYQREGlrVbrJVE9NVf5y0bXOu678M2Zuh163XFLVesCzQUlRcW6TpRm9opTzZqTBNwQQjHSD3_FEnz_s6FakDM3VQoTyZRfsNcj3JK1-uknm8JDs-AMnNszhvEqhUwEzuZJiZXX-iTc?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuxnQlSPP9FVQhLmFjx4afSLoPN_UxnKuBgWCH1Kvdd0usarpyndR74olgUq4iQAx42tUL3wKLKzMhsX1DcpUm6bWLlxHX3uxda284HiSZ9H8uqtXqNetig_7Bpqx2G0dQKj_fH2GlQo9eaB_nWK-9ihZ6PYkh06J5OXOBE4CUry2iqSUu8ljAW0o5CRHXRQz97zSJ1bK-k_QPr0c3LQI2bAbjj4Qm9xHSD65r5WQ3sAzdbdViKS8G2mWQ?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtpdvpz3yMMB0jhOVptJXvB9dM9U1JiLztXGsqgXgUpoG1n-9FCHU_ko_Iv6lrW9zdlGb4K9FH4AzqxRir2zdmR28KKv7zFoU8jHWrG9ud3AZYjsv97byWqddbe5Gjt1RtnQ_yPsHwi_4zxIH0mVOhaAjeOTo_2wBVLZsKGxHZbD9ONqeT2kVQ642B3p86_-zPZR4TcUkTswfzUAVzSxk6JfXIGKeYI1UVkjVfRtq6VjtX_uYCHoyoFqVE?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvF-JI7cTZQudegBftMe37CeQlVOp3QzBRPjnk2L2hHiDJlHvuZu5jh4T6sYkx12c-RLjPY-VY6R8geknUn23McSEJZCLTCZtjbbUavH5o8j8RKE8A0iUcYIgmxc7SUyubCSdJuE1GboxKbPjiZAELH5zPf0g3rBEVpkRT0GesH1ZNIAdNKXQabfopH11_FkCmdOxBy7vkAu4JbSc9ROO4SmF6KN0_4MR62ERlIIj16qG795jegyhp-LPk?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'HP1'),
(17, 'HP2 - HospitalÂ ', 'Concrete Drain', 'Unknown', 1.1, '1.24', '2.34', 2.057750, 102.575628, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtzuEVZDhg2wzOLDgP6-nJKpbTvBgTzirz513AvYL4pnPO8JZxpz2zPyg5OToPjENSJEAi285XDAV35k6uiBPAtjf5rm_RvXzKBnTh_xtK_C0nZyRpjtad4v0etaqEyaapmRYT2mWgI6RxfE8cnprjA9akbHU72QiGsRIFtPomW5rlAVwlVMOol1j2N5JDQhXtK9_fY2yFZPOGyucPFWZoUD7SDDOD6h7Q5E9lrIF1_f0qXF8qF59jk0cE?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvjYSJXPle8Hyy0vXoC4BKuIU6UdZVtumSvDEsn2jUCkkbKkTsmPmA-20jMQB065hN-4a0TY2L_KmXMNCWFYfGpEZJJ1CZqKKeRqHgVajIp251oej2kZ0FVhLftFCfabTwJRTZMojf438vcbBGXwhixWctLdFCyJSFISO_1BJOGiVfHjBb_bjfzNY_MiTEOvlZAJ8iXww4IsEhJKl6Nte8PwPCD_mNuywPtt97xwxCbjb35DBurWwpN9Z0?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvSyRJufSRHEGqpIcrqhNb1UltnwPimPWQM7OWuAdRJTbeBKebxaTiMXHWZBMAUz_-cS__nl3GImsZZAyz-2_KvBmehTgYoLoh0ONnvATpQUz-nLUu3yYTgQCi_x3p1DC4El41RorECfxARZ8OVv36Hi7HZu7peZwuslE115wb7F0PgHpQ2iLQJIErJvuhSCRrhKY1G0TU_0ZJgWuEf3hqnQZrT2MWMoJZ4ze3u8RMFuzuDS2_Hz9r_UC8?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuL_LxrRZuEc7O9HYWqjvJ7GizzcErVbJxMhOKUATZHrw_xaw4Il9O6oL81wFuO03ESooMvsOcfPtF2vgUa9gn7DwMlLtqUp5Rm2tlhC1qe_ku_lNcEHVHR9AnbQgFo3k8K2ChirRV-JLUqatsitywHR2rDmTiErxJimDV8QLtbmkcybLTKAHa11Dmozun7TVpoAK6d0_GSlHj9opHITrjpUeXp5c9a-fHho7IIRmbKFhV2g37uspHB6as?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'HP2'),
(18, 'HP3 - HospitalÂ ', 'Concrete Drain', 'Unknown', 0, NULL, '2.204', 2.057696, 102.576691, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsdN1f579t6tiMUwHa0PaYa1i929eoDXBI8kXtDY8tLchjonj5TQBlRmnn-xIev1oxpOINGd91s7aIabJrY8zFMU9jDkAgO0bMGeoamuYGp3JxlPgY6ZT7b5FUuqThRWwQDO0fWYJsLAdqUaBqxwSaVU37ZWqZqKSkrSyJUmBJjq3-slJueGhyd1lhOqAkB5kxjkxB_dP30xLE-Fs8l65j8APGQc-Z5mJ2Of6UBfebthq_wibB_-XqFOmc?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtDZDO2AH0HhosSzu_XwMHj4z3Ic1UpqiuXWPJL34sH_-KatqhTXAI8q0-PonkGDjDDHX3psK4JKinaOdfAEKOOqLNchV8xBGZ6mx3r7lm6uma8bLLRgPENmEONxNonNanI1vvvKNARDIyjwPM_p_A5sFWAKLDwT3ucvAQgVkYWjTox_wFywQEsyPb5Nzshp-pE-eRGcODSQF-um6dPt5462dCb8NswEl8-B8SV0anhSzCctBfYkhCH7bo?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvQNMsScTNVu9uCBJPP11o4T-5UQnRUQ4amz_io4wo8EmtAiX98_Oeo5HGQnAoqlHZcQmKfbKCs9RwZdZjbwLoK9zpcs_j1DO78kqt2aJHLcKgI9Htx2v6xt9H1CK0u-gz1lqscKAz1pge_Zk4MXqJGc6bBESZNP4Yi0lqBxE7nz1qkbf2STGzu5D3753XfB_V8sEGW29_B_B4Aa0ASkjYOEdx_D6clYFDh3wDhfTgzmxjQA305Tmyg8TY?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'HP3'),
(19, 'HP4 - HospitalÂ ', 'Concrete Drain', 'Unknown', 0, NULL, '2.691', 2.057514, 102.576734, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuf12xw4GiRmu75z4Wuh-r5W9pcqH_ZVLeFgjuJPE9A_GUa7vvQV0C9egty2jMz8py811bpmfJN8gSx5Yi9uvIaPSqZtoLN6Lq3k-dDUC0uDnDxMyA-PeMUErrY8BMxL5lC-j_ECEZMHgMsxsmCLe5K6CGWc7lf7nI0KzIql1g92PJrHS7MR6qZHvfym57VGtG5YGvjiVr8WiT8gCZq6WeDfsp8Biq-QnJo_GM3rwqrZgsxBLoWaPY2L5U?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKu78wQAr-DbSZIlr7p83pLDvw8SR2CLAjVPfmIuF5IFAwWE0es7b0Tweg0oeV60omGxQyHhD4snHBfhtEgNaut9gNutbynQL8hCc9dmC1nwi_fK_m3lOWZ-tbGYFemDFeVG4KsYeQXvXtxwDyfn2eiaFGNGertuyrqDeMKTdc-YAsZ3Mwl-j2zBUQiOf6SGsNsRt41gymIVCwmRKtIUG5Sn6WI-XF-8TXZL86LPkAbBkyc61DvjIwq7tvw?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsbHN3HxBOGCSQSKQhcOZMDrkHqetI5Gu70O3cEJxHxQzHLYE8PLAgFXwYCQlO7YR0Y3wELRfw9Qdlt-AlKcFgZT1RCK-s4mqMlpFykvJb8jIs8u-sOgm9RdzfOuqrCla18vPXPnWFbE57-4OHx2mRpwxjHZzgivvrG2MdnDm2qOINunK62A1XGJ-k2L80WrW_jra0WsycHBCxsbogvffh0SUP1dF1mVAGwjoiWGR4zzF88F10q1Hc3ikw?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs8_VO3CIVEt9whffNLBQm-E4wxswVmpf0D7MZh-o2fwaXrBaX-BIUSlyk_aZ0ijb7NlXM8G150TICSxkF9O3lBlmVbtA3pt2KqAmhsLCB27CJ9w2JnKPUudf5SS1zUJBw4YnEc-ISGM2GMue0Q14ZIX6WTPicNLzSYRfDUSZThr3Xkp2tZ0LT1CWAAjMkLq4PVkyh92z_ueGoLHihcgN81Jd8FMi1UM8P4AbeJFroGMbIvjcw0qhymFyc?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsbGbtVoVdKCdV2veSmFIGS4bRDSXrmCqC3_CH00sSo93UP8nzDkjzmy9hLxJIKiNozIHT0Pw4NVhY4cKIPrIyez5c2zhVgA9Pu8lppNuGMOJjJNZMj7Gmf0F8tpYuWR-AzdOmz1QzHsRiuGjPMBxDX6F4cU-2R-x4VB8XidVcGT07SVozt_sU0AqSoiuNI1TmEAIPW_KelrSCWDNn1d66_a60HdHps49gqrZfbc9lKnj0fWGs_dS8zaWY?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvghfC6NYcwSbDKVUFPhdzVdbiiaR2nXs7OT4Kz-dWJy98Y9I-SRnKPP3Xv_0tRGizTVza0EVv8kVp5Z7d9hRzKTET8-AwU-Oa3P-kDZmtc8mF_bq7nFYuRtNNQanHDJTTPGC6bWNOhwYZEX1natAnoclr6qbdWUpg0YgoILM5SJqKetaGEJqUBBLMGnKjeVOJc0nATtuMqXg-zJLMr7O3dMF1d3FzzOG_FEC-zFD09AAyq5XsQz5ptv84?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'HP4'),
(20, 'HP5 - HospitalÂ ', 'Concrete Drain', 'Unknown', 0.6, '1.223', '1.823', 2.057273, 102.577885, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs4vZ2Cq_fIS_-_PV27tWMWAFqHZ0gSd4voO2AsYAbmN4TFRcST0eZ-zyAd8PjaSHiWovRfFfzYyXpJX2Gouo_CfdAwRWWf1FKfhUe_Y5vDBTo9RrotK4M6Lqk-W61KR8ZDLQxsXz44fIKaoC7YiKTQUd6-WXY1yJDa4xths7IfSbWCyF5ykBtIwr6EHq2130wfnvgC9XmAPpW_KmW70LzGaTqcEFVOWHjyDCtziZA7jLCsE-NI6NSwOJA?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKv4R4ZKyQto7tzrtuxjGwjFEmsL3RSoMdPWsnyOijVgZgEcldZTcTjB7DQrhOWyO_X_ieObfL1MU3-ZDoc4iMtNTTI2649otY77qzAhtlrmgw5vvgHBqpgLNnLuKXtfjBBwDZDMeGrsnid-1YNMiDVHh8am58cNG2yxQ-1f0LVl2A2dnc_-xN8pN7EOtbakLa5RM6claLMDIejg3AqWA4Bd-naULBTdgJx9uj-cdpA0jtLStQtxGkuBOFU?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'HP5'),
(21, 'PH1 - Hj Kadzi', 'Concrete Drain', 'Unknown', 1.8, '0.146', '1.946', 2.048300, 102.573836, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKut1-Odt4MqpqxZEmOvk76br9ViUt_ue2SehS-dYvfuQPPsRjwVq7rwp7wuQ-jneBtSE5sGiSLqno8yrI6V3S_ZA4lzV_8Cc5cVeU05lFAT0oSZVBmD5UZGD0aQq6IIYdA8oo8AB9YCjbxulpRhEjlqgIj0qm5-TgVPdXoTzYmiYQRmKjmZrkAVwpL_OwrSPHBK52qr0wPmJjL2qvzAHTxu46Sm8nfAijoVgXS4zOtGamMdh3RWxqFp-QA?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsRj_FwSMGnp2PChnQ1m39mgUltjlmnDgtHB6ykQYpvCMMuYpvVtlt3vldZNP1d5zTcBqR5iLo4GgA_meWifyF8-58dDWs0jPkzgQ0kfNUFy0c7iQ1lGljV_4n01NPvhy8CrzBRnD7JSUYYmr4hXHvUh-aghNL8hBiCqmkldZ8KO13zPPKKHXaF9iJbkWwMVmJrm9yDpMS-7_p0OWWqn6dOYWZTtJuz9G6Z_lfSEizs8iLjJF4lygfDHs8?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PH1'),
(22, 'PH2 - Hj Kadzi', 'Concrete Drain', 'Unknown', 2.4, '0.754', '2.554', 2.046068, 102.575121, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsyql1hlRGPN3IDjeS-cgaVLts9dwheUS0_aUhVeK92XQHPYHPru49WgRs3wjAcC-IyDj8QcaTDeN5uk85-Mkd2TtkL6GA1XWszal8b64Ft__9YwVBdDTr-IJDlEzwLqLUz3TZbXH7qwl2I8Mp_qJmTkDSk-fkEREhQcKzmGSBO9LgKEL-Q7YsHljyZfMwSz83ebwBJwk_ZO5PoL3mfF1YrHEt2hikl-pIhJ_iLWGu8IHuvKyOoFAEBwnE?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvo7mEuH5iFrKjzl_k8HFV_EWj_mtqR6lCdV0og7aaqfazLcuhJ4eNpJ_7-r9jawbFlxrJIY6Yi8kzC91p9gxQu-_qYBVAG8aO6Pfp2mzkaOxSqJ0usHgntAujGRGHINmVUtHHBrnC-GEA_soy9V9L_K3UdbyL3StBbpAWBdDpzvMhcDTK8i926-sahxl5ajugw_F-q9lYpkoUmCMqHIteadgwH0OKjIrD8FkeT0bteQHVODw-hjBcHS4c?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PH2'),
(23, 'PH3 - Hj Kadzi', 'Concrete Drain', 'Unknown', 0.9, '1.812', '2.712', 2.044310, 102.576479, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt5TmD5d8PNRtx1vXWhQay60RxAoDyNuWpQkDJDXwptOGedTZBimnxpRtT4u-WdofmzVyVumjttyZNvwAH4Wdn535z1tazvseZOAO4iPGZt0boFapNTDC7ye94f4UshHXAvw-_kwSjJ3e8ll0s6mwaz5BbNleV5_ux6Liv4JFtG1fPxIOzHSyuY9g8EKuV56ZrFPKWWByW7WDEPt_aCdx9GsW2BWPw3pR9oKw4BU85W761mt1rvCXOGTrU?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsmpkCei336s016UU3jPMUYm-60s0wjSrcKPJPLwUFxKDe3EIynN6B-0H8KJTNaZ_IrrZor2Mr4goLn3eNXD1wlyE-lns363frDAgyhlfvNNhS23CqI_3p4nLsDikAF4JWYKxUCZ0qVcEKgZyAUfeVOdYdhE3cDxPJ6SmR7jaGp0vZDMaQmssBLHJLL8xC31qvwOO8j2Npjt70qeOFabxh-BBNmtdXPHvuF68LlUSv3uU66zfGJn4sPyNE?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtGMdxDxRvhaQAGlkuwmDQgiwEOcPMDeiafRkc7mYmczzYwlkPbeHi5r7U0j2uh8m7Cy022RoSspEd_DKIdsTD1OsW8prDCZT-mktIPjfzIDQCDPZzHBvLspTLstJVEUqxzxefHqN74dMM_UOAc4ZOz5lcVZnZjEB5ZG7BZy3MHRAbGgxkTroGE4Xe2hhr1BkvUyiGJV8wlp1RJ1gMq9y20quAK7q3-Fy-eilS4PyWmxu-jnkUh3tbJdss?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs3jzRzk07YFWKEQrrLiEZPGkNP65dcnTU8OZOARdEKP2CrqOB_J49oddzeXW6tcQ1sDIxYEfl-r0pwz4_wowWa0qDhCcCOvp4oybZOx9_yxMjWNqSCibxnA280uNisj3LfVTpFidwp7MWkXkWyz-f-CDJg6wZoTvLHgMyYzEkRNIQgSwxnCB9NCaFT8UpjzIgF7FBrrVsYW3dL5OdDgd2FQpI9IFTK8WKEmHk-QXajgChN-9_2pzXT5AQ?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'PH3'),
(24, 'PH4 - Hj Kadzi', 'Concrete Drain', 'Unknown', 2.1, '1.929', '3.529', 2.041691, 102.578828, NULL, NULL, NULL, '2025-05-07', NULL, NULL, 'PH4'),
(25, 'BB1 - Sg Bentayan', 'Concrete Drain', 'Unknown', 3.4, '-2.921', '2.179', 2.050527, 102.571481, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKulk3o05PXu3aICgQWQGDtw0LQBVF7X8MtSKg-MDEfydWL8dwsbpK4d3p45n9rlI6hTIX5xmNioyV9rCt1Dt51hyz8XBUlCvVAilO4sQv4QotEN3zf83CvpGTqRTicyy-HC1wB01KMOEgmw3CeW48WDpiEufOAHKSOMgC9DigdZ4NWuE5dYPcOOYuAr3hfaOYgNF_w2gxCpgt73G3VdWaxmmYA2KOvy-RupIuR_FGCZwxUnviWszuBxhBw?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt3nXFDNWW_lNvnlbYwyoUf0y-TmBg4fnT3FUwPMDHHwsn_nVh2v36zmpE0neMlYeAo6a1edParVC8hds-jq99fQLoyMJLz9SH4ySR_6vDW4HTUaScHYIWxXdzAYL_6yiwrudLxeoqZcAV_cHp9TsLMtNtmkpsD6-eHDG_pA_oBzXFyJOEyQhA6QAs85_npJReVKQE9Jj6HQsjl-MFc6jSxO9yxF4z7nfxeZoCR092A3J8r25vGSN60H1A?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKt5Y9a8dlFCBIubRIlRzAGWe7Raq3lwgBPqSh3Tu-ebQoUJTZujY7rI5-dJ8Jk2IsYRtJp-OElNtzUKoogWrF_yZbxFa90CMLz-q00txmElGUrMxFam6BAHg7XluasqofJk2hHT0HAJaPt5YswQieOMLTrHUmq9MwPwjUUM89ABJUqpPA_nG7PRjWK-pqVbtVOpIpvtltnfITCQVTlZ22Nak7ZGTdysTtCGWeCCW9AiqDNxnOgLmWoSMSw?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKs-7rcN2ajX7iUQy38U7ePs9MbAyv21ezHK3TTkMP35GZpk0IOJYs6VtqJ1Uc5RWQnIOZt5rPNKCGoalx0Gaj_QPAU59-AgXtRNrsTPXGMriugxtK7lN1pvK8PVK74HGdW8j8peJMafOyaCWLRg8aJK0hyY16rBkf4kndScDJvQ53PwXUr3PnsGUJWe63JX6HOgyWDhsPNOfi0GryWfAVb3hgWWchCPc9l7Ou8NSHKA8MlCWSq4-8gB6HA?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'BB1'),
(26, 'BB2 - Sg Bentayan', 'Concrete Drain', 'Unknown', 2.3, '-0.359', '2.259', 2.048882, 102.573746, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsZVtWgepVbiBSQx_SYgUbgvnYhWMLYi54Ni13KnReF8zIIy8veeJX46CFb2YFW-zZWWUVM28VAjsDLfp_Xt5IZLUpsumL7yHuxd4cESCYtmiGMjxiLDhYEvKqaChNMSVYge_PrWgL1vMQt0oRUbdZCGG-4vqeKExhu-UmPDyiTmc47MsGRUWG9a05Y7eluykggc3mvb5VE_sW9tOh6p6U0TJc5qJCLLbxHyaPDYVEKaj2yA7WDG9BU0fI?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuSVGpZOkO6kbJ-88-bXNEhRWCFWTydk9Hsgf6geTtYyimxE2A5_xtY_a3xs0UsgIORfEM76wylcVIR6K2TB5Se8OOjR6YGkdCQ1WKtjSKhdBdzhRUoSuJg6kHDmFw-TkNBJdnQ-NIXX7l3GFfyuJikJ0WdR7acby3_ZkHk0YfFO-hRHT-PPFLx0NRhvxD_WbhR3ri9O1YMnIqgsmpY2IdGo27awcVvwHF6wB-3qdxH50AvsjeyV11jp0U?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKthwo6ILtOnydDa0-i7eN9Y-jlq5z9f6z9BObY4KAFFdo_RZ3OvnMsJJlh-UC4-Txr8Vz3lEoTiSoRQ1pxOaZFV2CSL2oivugKo54wvi45pCD4dHJNeyR8yQzDmQ_hZyXUuryPkNwM4tirRMzVYNQIcaZFEyDJFUJYGFc21DEgFioPhUDhEqfChhHfzyI5l2BDD2YR8y4MwxoU44Q_2cA8ONPKkfb6z_yzP_HtqXDVnaEmZKStj3qRavSA?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'BB2'),
(27, 'BB3 - Sg Bentayan', 'Concrete Drain', 'Unknown', 4.4, '0.483', '2.583', 2.048568, 102.578422, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtVDE01QsaPi2y9CdjYvwhAnID0gSguKmo2c7ivyhx-4w4ryoq9cEUaxQQuGq7TGeRZc3NRxLjq95fEZEGaFfksqBFTfbi9Ze1aeSSb60rHFXn4DUoAOI5dq8558qS-MBYrSdvAb-1NvHqOikTyMiuMKITTcSpg32whTUVp2M8XFk6ELMrnnel2EEp1jx1niFUewn_Pt9PuH_46oh1XNr24-ecyJihvYwyPuGHAiZnJMKN6vF1G5ty-21k?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuKnvTucIm-Yu54VsnbtCxd4w_tS6caDjxiCzd_nCzGIG9iENB7omXPoGtPDmaNGCZ2XiLDA6hzel5eH9XmaYcumJCF_oKQcHmUJubXLdRgNajsIgPix6TNq1QRHbxFsG4g-gGAmAby8qmJ3_ChyaoY0Pu3itRL8UydVd39ukRuMl0FVigiB5ZSF-iV0og27sR-IjY-FmZzSdEk3Zh2jbKmvT1rqwoBHEIKPFO0Joa2kpqugyjNLE69fVE?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKug9MpntJdLFxhvfkcle-QXMV1EnDPD00IygAipb_03AGtAm2_9eo5kRycKAA-3ldcxRARXcDrWT6uU-gewgHXoAv3zu_1-ZfYQ9gYRTWFKkRTFrCgpp2EOL28GrNh2OocNdj8oiMwQEmkQw0mGaVR5EoHyOcSAAjkmcStoZsv3X2dW__qcDGIujEi78KlupOwf9dZxTsHESL-HEvXj-e4wwo09gUyYLwrLj05N8eULUDcS1Y7yCTE86c8?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'BB3'),
(28, 'BB4 - Sg Bentayan', 'Concrete Drain', 'Unknown', 1.1, '-2.069', '4.269', 2.048499, 102.581174, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKvG591icGMmINZi0YNvxZFt_8Yeu0LwRYjneOslpaY4xCOt0rtlNFyeCQyF7wKQuaamp7HlCWRBRgc87Qe8GxDnf4DtCMOf_jBv9l37aS5Na7GC_oMbzJ1oYCf9WQDJ_illyfU1scXzss2qhG_K6CV97cpAwi0WjCbAut8EycHQ2ZBAgaMLf3GtFJ2DLx_F5XxhZbJgphkfd0abM4c9Rnli3MfwZmozxfmBoU2RPP0jqdZm13hvJ0_itx8?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKudkkG1BdwbJez27Xg_Wv5Fhxcos20YNjw_Bltg_cEEvN_Ew_ImkMjIzKOT66KtgZCZ9tx_tuUP8AXKaqW3QCFYu62quhNgNLmrhpFC0IbjNa59hYqFTbUP7DjMeNB5Bc0ZIV-w4PbGNaNKESg7rPDJC1gpL1l7l7uXwojl__Rmjz7JBvc831PZy7h2vJ1E5UiKnNz8HXbXs0_3q5mBMa7TzGv9Z1JFzYA_H2tJBCXUkILn9eTQsbRmpik?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtSbn1xhZL9Dvw6wkNeLkvcbsEunjF2aOyZ7SFb3gSPH7l_5mfKGquqkoZUlQe_22vOz-zPRvpkAYlqEw-IpkONcj4OoP2Dpk_CVLZ5KA0Hu5TAmue734IJ1L8MeAQAH_Gc411n7wn3U9-GjuIXN96rEiTUBcs--gqhOCdLr4qRwVxFCCQakt1pDWEpg3Sp4hV-69NjyKo1juGhaq92tSJy32_wW_AvBofGDZWQfJjicwcDURhtWTdjzG0?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'BB4'),
(29, 'BB5 - Sg Bentayan', 'Concrete Drain', 'Unknown', 0.9, '1.185', '3.985', 2.048339, 102.588420, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKuE6etAv7cfTrqoXaBW0g64x-VgP5U0b2LfcmYDuXxtS37cLbYCBj-YXinUvlJW9br0hchSM58fdxl8xvFTONCnYoGx4zB2WDyyhdiX8EVxOJBaKFYE0BT9mKVW5NptO3JV0fhOLBJXOWhDGgBnpIDVtN5GnClGQB9OMnlL8iZD_v_57sbdkZXaWSkb0UaWEFGWKEqI6ZbwH5vNHorRAadmR9dnHBvqMu5T-2H6J-rrgViVUNM389MfHKo?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKtUdl-YwihLRikOoNLUnc2TTfNwTRyClACWY5b2hi3anCueGCfAa6FsdeO5U4Oi5Jtu73HdUExhaisA5hPpC8fmXJARtR4mbmVorbrt_8E8-inCywr3WCz1dZyBZsYtCUsY9igPQTrEqFxCrtPB5rdSJU1LoS_Wes-hzxanGQDDSRz-K9sdXqN9IpFMIqMdiXNvEtmiA60yrzgJpVksuHqm2gTHOYqOh6KvrjggGwgr28sNka9RDcyi2mU?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsi_iixDV7DZDpvpDTw5eIImF4buSF676egEB5UqPtiHgSz7v2CXEkmVlvNy-v9T9anV7z3pAYlAPYmw4rpLrAtAHaNBYCqMXdUrYpw9KvTdbJzV8gVlJEIsY6HhQahEk-Btc2v_5qwm9wF0UlDBqX_1xVnoIXuiUJjCpjhBJrSLFaZJpm52VmkB_oq92tmpXdJUikKUtsS_JZWF5xeP64cZobD7uQy0Nk1Tm3LbGe7NhpUak7GN0MROAk?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'BB5'),
(30, 'BB6 - Sg Bentayan', 'Concrete Drain', 'Unknown', 3.5, '1.136', '3.136', 2.047850, 102.593966, NULL, NULL, '\"https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKsPC7HEiq3y8yHrxYd78qgaItOuGaqBZpp_-oi_nUwR6ci8Cxk9msouVlGhjyU4AWMZl0jV1X33EajR8wNY7BQIhmMOQlrVdOVMLur8PWrnU35locFWCWzGUGCrNdk3MVmVLYux_8jTv2yyTU9X9Ml0CFMt4FhunzSn2EAeChoICV55s8VMJsslzEWcQZRgdABjyDUM1SUOdE_0_9uyfHk3FGkLVu9psfocOeF5U1b7mODWbpC3DiArRWg?authuser=0&fife=s16383 https://mymaps.usercontent.google.com/hostedimage/m/*/3ADbDBKunVLGM5W6h3ClF76QAgGT12I7ie3oGamG1GaPdtrOOPpWtqcBPaP3VfWIcnoVJyuK8fCsUOqTmptCkJevMwhE4AOIyBYKnrCtO7qpVqIOMB1s-z7BT74pONGWaMXlEhEywSu0jA3tsugcPWZudk1LoTAHf9xGkLvuxp2DqIasrPUxyhnWUy_3xigDRJE_2L-i1t5NnsClBiE_pR2NkzSkib7VeYH5au8rlZZah6GIdHxyjU3KV1a-jk4Y?authuser=0&fife=s16383\"', '2025-05-07', NULL, NULL, 'BB6'),
(31, 'BB7 - Sg Bentayan', 'Concrete Drain', 'Good', 0, 'N/A', 'N/A', 2.047305, 102.603401, 'No description provided', NULL, '\"https://www.google.com/urlsa=i&url=https%3A%2F%2Fwww.penangtraveltips.com%2Fmalaysia%2Fjohor%2Fmuar%2Fsungaibentayan.htm&psig=AOvVaw36FJAWtmD2JWn8tgM7MS40&ust=1746698619716000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCJjmssqNkY0DFQAAAAAdAAAAABAE\"', '2025-06-03', NULL, NULL, 'BB7'),
(32, 'Pintu Air Parit Kamariah - Unknown', 'Concrete Drain', 'Good', 0, 'N/A', 'N/A', 2.048242, 102.553908, '', NULL, NULL, '2025-05-24', NULL, NULL, 'PintuAirParitKamaria'),
(33, 'Pintu Air Pt Othman - Unknown', 'Unknown', 'Unknown', 0, NULL, NULL, 2.046528, 102.562976, NULL, NULL, NULL, '2025-05-07', NULL, NULL, 'PintuAirPtOthman');

-- --------------------------------------------------------

--
-- Table structure for table `flood_prone_areas`
--

CREATE TABLE `flood_prone_areas` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `risk_level` varchar(50) NOT NULL,
  `last_flood` date DEFAULT NULL,
  `coordinates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`coordinates`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `flood_prone_areas`
--

INSERT INTO `flood_prone_areas` (`id`, `name`, `risk_level`, `last_flood`, `coordinates`) VALUES
(1, 'Junction 5 Area', 'High', '2023-01-15', '[{\"lat\":2.0508,\"lng\":102.5689},{\"lat\":2.053,\"lng\":102.57},{\"lat\":2.052,\"lng\":102.572},{\"lat\":2.05,\"lng\":102.571}]'),
(2, 'Lowland Region', 'Medium', '2022-12-05', '[{\"lat\":2.045,\"lng\":102.565},{\"lat\":2.047,\"lng\":102.567},{\"lat\":2.046,\"lng\":102.569},{\"lat\":2.044,\"lng\":102.567}]');

-- --------------------------------------------------------

--
-- Table structure for table `flood_reports`
--

CREATE TABLE `flood_reports` (
  `id` int(11) NOT NULL,
  `location` varchar(255) NOT NULL,
  `latitude` decimal(10,6) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  `severity` varchar(50) NOT NULL,
  `water_depth` float DEFAULT 0,
  `description` text DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `images` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `timestamp` datetime DEFAULT current_timestamp(),
  `assigned_to` int(11) DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `flood_reports`
--

INSERT INTO `flood_reports` (`id`, `location`, `latitude`, `longitude`, `severity`, `water_depth`, `description`, `contact`, `images`, `status`, `admin_notes`, `created_at`, `updated_at`, `timestamp`, `assigned_to`, `resolved_by`) VALUES
(2, '2.028596, 102.599087', 2.028596, 102.599087, 'Minor', 2, '2', '123', '', 'pending', NULL, '2025-06-03 16:29:27', '2025-06-03 16:29:27', '2025-05-20 01:07:29', NULL, NULL),
(3, '2.046098, 102.605782', 2.046098, 102.605782, 'Minor', 1, '1', '123', '', 'pending', NULL, '2025-06-03 16:29:27', '2025-06-03 16:29:27', '2025-05-20 01:08:10', NULL, NULL),
(4, '2.033229, 102.621059', 2.033229, 102.621059, 'Moderate', 2, '12', '123', '', 'pending', NULL, '2025-06-03 16:29:27', '2025-06-03 16:29:27', '2025-05-20 01:16:07', NULL, NULL),
(5, '2.061288, 102.607412', 2.061288, 102.607412, 'Minor', 3, '123', '123456', '', 'resolved', NULL, '2025-06-03 16:29:27', '2025-06-03 16:47:03', '2025-05-23 10:05:29', NULL, NULL),
(6, 'Test Location - Debug Tool', 2.046098, 102.605782, 'Minor', 5, 'This is a test flood report from the debug tool.', 'Debug Tool Test', '', 'pending', NULL, '2025-06-03 16:46:34', '2025-06-03 16:46:34', '2025-06-04 00:46:34', NULL, NULL),
(7, '2.029170, 102.545400', 2.029170, 102.545400, 'Minor', 2, 'banjir', '0127969166', '', 'investigating', NULL, '2025-06-03 16:47:46', '2025-06-08 00:48:18', '2025-06-04 00:47:46', NULL, NULL),
(8, '2.024839, 102.548962', 2.024839, 102.548962, 'Moderate', 2, '123', '123', '', 'pending', NULL, '2025-06-03 21:17:14', '2025-06-03 21:17:14', '2025-06-04 05:17:14', NULL, NULL),
(9, '2.036333, 102.624321', 2.036333, 102.624321, 'Moderate', 4, 'banjir', '0127969166', '', 'closed', NULL, '2025-06-06 19:41:46', '2025-06-07 12:23:00', '2025-06-07 03:41:46', NULL, NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `flood_reports_summary`
-- (See below for the actual view)
--
CREATE TABLE `flood_reports_summary` (
`id` int(11)
,`location` varchar(255)
,`severity` varchar(50)
,`water_depth` float
,`status` varchar(50)
,`timestamp` datetime
,`urgency` varchar(8)
,`time_category` varchar(5)
);

-- --------------------------------------------------------

--
-- Table structure for table `inspection_schedules`
--

CREATE TABLE `inspection_schedules` (
  `id` int(11) NOT NULL,
  `schedule_number` varchar(20) DEFAULT NULL,
  `drainage_point_id` varchar(20) NOT NULL,
  `inspection_type` varchar(100) NOT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` varchar(10) DEFAULT NULL,
  `operator_id` int(11) DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'Medium',
  `frequency` varchar(20) DEFAULT 'One-time',
  `next_inspection_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `inspection_checklist` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('Scheduled','In Progress','Completed','Cancelled','Overdue') DEFAULT 'Scheduled',
  `findings` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `completion_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inspection_schedules`
--

INSERT INTO `inspection_schedules` (`id`, `schedule_number`, `drainage_point_id`, `inspection_type`, `scheduled_date`, `scheduled_time`, `operator_id`, `priority`, `frequency`, `next_inspection_date`, `description`, `inspection_checklist`, `created_by`, `created_at`, `updated_at`, `status`, `findings`, `recommendations`, `completion_date`) VALUES
(7, 'IS2025060007', 'BB7', 'Routine Inspection', '2025-06-14', '09:00', 8, 'Low', 'One-time', NULL, '', '[\"Structural integrity assessment\"]', 1, '2025-06-07 20:17:05', '2025-06-07 23:48:33', 'Scheduled', '', '', NULL),
(8, 'IS2025060008', 'BB7', 'Routine Inspection', '2025-06-14', '09:00', 7, 'Medium', 'One-time', NULL, '', '[\"Structural integrity assessment\"]', 1, '2025-06-07 21:50:46', '2025-06-07 23:48:33', 'Scheduled', '', '', NULL),
(9, 'IS2025060009', 'PHL1', 'Safety Inspection', '2025-06-14', '09:00', 2, 'Low', 'Weekly', '2025-06-21', '', '[\"Water flow assessment\"]', 1, '2025-06-07 21:59:20', '2025-06-07 23:48:33', 'Scheduled', '', '', NULL),
(11, 'IS2025060011', 'JS1', 'Safety Inspection', '2025-06-14', '09:00', 7, 'Medium', 'One-time', NULL, '', '[\"Structural integrity assessment\"]', 1, '2025-06-07 23:25:00', '2025-06-07 23:48:33', 'Scheduled', NULL, NULL, NULL),
(12, 'IS2025060012', 'JS2', 'Post-Maintenance Inspection', '2025-06-15', '\'09:00\'', 7, 'Medium', 'One-time', NULL, '', NULL, NULL, '2025-06-08 00:01:20', '2025-06-08 00:01:20', 'Scheduled', NULL, NULL, NULL),
(13, 'IS2025060013', 'BB5', 'Safety Inspection', '2025-06-15', '09:00', 0, 'Medium', 'One-time', NULL, '7', NULL, NULL, '2025-06-08 00:02:59', '2025-06-08 00:02:59', 'Scheduled', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_requests`
--

CREATE TABLE `maintenance_requests` (
  `id` int(11) NOT NULL,
  `request_number` varchar(20) NOT NULL,
  `drainage_point_id` varchar(20) NOT NULL,
  `request_type` varchar(100) NOT NULL,
  `inspection_type` varchar(100) DEFAULT NULL,
  `priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  `description` text NOT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `status` enum('Pending','Approved','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `scheduled_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `findings` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `condition_rating` enum('Excellent','Good','Fair','Poor','Critical') DEFAULT NULL,
  `inspection_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `images` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completion_percentage` int(3) DEFAULT 0,
  `actual_hours_worked` decimal(6,2) DEFAULT 0.00,
  `materials_used` text DEFAULT NULL,
  `work_start_date` datetime DEFAULT NULL,
  `last_progress_update` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `maintenance_requests`
--

INSERT INTO `maintenance_requests` (`id`, `request_number`, `drainage_point_id`, `request_type`, `inspection_type`, `priority`, `description`, `requested_by`, `assigned_to`, `estimated_cost`, `status`, `scheduled_date`, `completion_date`, `findings`, `recommendations`, `condition_rating`, `inspection_date`, `notes`, `images`, `created_at`, `updated_at`, `completion_percentage`, `actual_hours_worked`, `materials_used`, `work_start_date`, `last_progress_update`) VALUES
(18, 'MR2025060001', 'BB6', 'Replacement', NULL, 'Medium', 'q', 2, 8, 0.01, 'Pending', '2025-06-09', NULL, NULL, NULL, NULL, NULL, '', NULL, '2025-06-08 00:25:11', '2025-06-08 00:25:11', 0, 0.00, NULL, NULL, NULL),
(19, 'MR2025060002', 'BB7', 'Repair', NULL, 'Medium', '1', 2, 8, 0.01, 'Pending', '2025-06-09', NULL, NULL, NULL, NULL, NULL, '', NULL, '2025-06-08 00:38:07', '2025-06-08 00:38:07', 0, 0.00, NULL, NULL, NULL),
(20, 'MR2025060003', 'JS2', 'Upgrade', NULL, 'Medium', 'dadsada', 2, 7, 23.00, 'Pending', '2025-06-09', NULL, NULL, NULL, NULL, NULL, '', NULL, '2025-06-08 00:38:42', '2025-06-08 00:38:42', 0, 0.00, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `operator_activity_log`
--

CREATE TABLE `operator_activity_log` (
  `id` int(11) NOT NULL,
  `operator_id` int(11) NOT NULL,
  `task_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `operator_issue_reports`
--

CREATE TABLE `operator_issue_reports` (
  `id` int(11) NOT NULL,
  `operator_id` int(11) NOT NULL,
  `location` varchar(255) NOT NULL,
  `drainage_point_id` varchar(20) DEFAULT NULL,
  `issue_type` enum('Blockage','Structural Damage','Equipment Failure','Safety Hazard','Environmental','Other') NOT NULL,
  `priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  `description` text NOT NULL,
  `images` text DEFAULT NULL,
  `status` enum('Open','Acknowledged','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
  `assigned_to` int(11) DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `operator_issue_reports`
--

INSERT INTO `operator_issue_reports` (`id`, `operator_id`, `location`, `drainage_point_id`, `issue_type`, `priority`, `description`, `images`, `status`, `assigned_to`, `resolution_notes`, `resolved_at`, `created_at`, `updated_at`) VALUES
(1, 8, 'PO03 - Parit Othman', 'PO03', 'Blockage', 'High', 'Large debris blocking drainage flow after recent storm', NULL, 'Open', NULL, NULL, NULL, '2025-06-04 19:39:42', '2025-06-04 19:39:42'),
(2, 8, 'BB7 - Sg Bentayan', 'BB7', 'Structural Damage', 'Medium', 'Minor cracks observed in concrete wall', NULL, 'Acknowledged', NULL, NULL, NULL, '2025-06-04 19:39:42', '2025-06-04 19:39:42'),
(3, 8, 'HP2 - Hospital', 'HP2', 'Safety Hazard', 'Critical', 'Loose grating poses safety risk to pedestrians', NULL, 'In Progress', NULL, NULL, NULL, '2025-06-04 19:39:42', '2025-06-04 19:39:42');

-- --------------------------------------------------------

--
-- Table structure for table `operator_notifications`
--

CREATE TABLE `operator_notifications` (
  `id` int(11) NOT NULL,
  `operator_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','success','danger') NOT NULL DEFAULT 'info',
  `related_type` enum('task','issue','general','system') NOT NULL DEFAULT 'general',
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `operator_notifications`
--

INSERT INTO `operator_notifications` (`id`, `operator_id`, `title`, `message`, `type`, `related_type`, `related_id`, `is_read`, `read_at`, `expires_at`, `created_at`) VALUES
(1, 8, 'High Priority Task Due', 'Drainage cleaning at PO03 is scheduled for today', 'warning', 'task', 1, 0, NULL, NULL, '2025-06-04 19:40:00'),
(2, 8, 'New Issue Report Acknowledged', 'Your safety hazard report at HP2 has been acknowledged by supervisor', 'success', 'issue', 3, 0, NULL, NULL, '2025-06-04 19:40:00'),
(3, 8, 'Weather Alert', 'Heavy rain expected tomorrow. Check all critical drainage points', 'info', 'general', NULL, 0, NULL, NULL, '2025-06-04 19:40:00');

-- --------------------------------------------------------

--
-- Table structure for table `operator_performance_metrics`
--

CREATE TABLE `operator_performance_metrics` (
  `id` int(11) NOT NULL,
  `operator_id` int(11) NOT NULL,
  `metric_date` date NOT NULL,
  `tasks_completed` int(11) DEFAULT 0,
  `tasks_on_time` int(11) DEFAULT 0,
  `total_hours_worked` decimal(6,2) DEFAULT 0.00,
  `efficiency_score` decimal(5,2) DEFAULT 0.00,
  `quality_rating` decimal(3,2) DEFAULT 0.00,
  `issues_reported` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `operator_performance_view`
-- (See below for the actual view)
--
CREATE TABLE `operator_performance_view` (
`operator_id` int(11)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`total_completed_tasks` bigint(21)
,`on_time_completion_rate` decimal(7,4)
,`avg_completion_delay_days` decimal(10,4)
,`total_hours_worked` decimal(28,2)
,`issues_reported` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `operator_preferences`
--

CREATE TABLE `operator_preferences` (
  `id` int(11) NOT NULL,
  `operator_id` int(11) NOT NULL,
  `notification_email` tinyint(1) DEFAULT 1,
  `notification_sms` tinyint(1) DEFAULT 0,
  `dashboard_layout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dashboard_layout`)),
  `map_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`map_preferences`)),
  `work_schedule` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`work_schedule`)),
  `timezone` varchar(50) DEFAULT 'Asia/Kuala_Lumpur',
  `language` varchar(10) DEFAULT 'en',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `operator_preferences`
--

INSERT INTO `operator_preferences` (`id`, `operator_id`, `notification_email`, `notification_sms`, `dashboard_layout`, `map_preferences`, `work_schedule`, `timezone`, `language`, `created_at`, `updated_at`) VALUES
(1, 8, 1, 0, '{\"widgets\": [\"tasks\", \"schedule\", \"notifications\"], \"theme\": \"light\"}', NULL, NULL, 'Asia/Kuala_Lumpur', 'en', '2025-06-04 19:40:00', '2025-06-04 19:40:00');

-- --------------------------------------------------------

--
-- Stand-in structure for view `operator_tasks`
-- (See below for the actual view)
--
CREATE TABLE `operator_tasks` (
`id` int(11)
,`drainage_point_id` varchar(20)
,`drainage_point_name` varchar(255)
,`latitude` decimal(10,6)
,`longitude` decimal(10,6)
,`task_type` varchar(100)
,`task_category` varchar(11)
,`description` mediumtext
,`priority` varchar(20)
,`status` varchar(11)
,`scheduled_date` date
,`completion_date` date
,`operator_id` int(11)
,`created_at` timestamp
,`updated_at` timestamp
,`findings` mediumtext
,`recommendations` mediumtext
,`condition_rating` enum('Excellent','Good','Fair','Poor','Critical')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `operator_task_summary`
-- (See below for the actual view)
--
CREATE TABLE `operator_task_summary` (
`operator_id` int(11)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`total_tasks` bigint(21)
,`pending_tasks` decimal(22,0)
,`in_progress_tasks` decimal(22,0)
,`completed_tasks` decimal(22,0)
,`high_priority_tasks` decimal(22,0)
,`overdue_tasks` decimal(22,0)
,`avg_completion_percentage` decimal(14,4)
);

-- --------------------------------------------------------

--
-- Table structure for table `operator_work_logs`
--

CREATE TABLE `operator_work_logs` (
  `id` int(11) NOT NULL,
  `operator_id` int(11) NOT NULL,
  `task_category` enum('Maintenance','Inspection') DEFAULT 'Maintenance',
  `task_id` int(11) NOT NULL,
  `work_description` text NOT NULL,
  `hours_worked` decimal(4,2) DEFAULT 0.00,
  `materials_used` text DEFAULT NULL,
  `completion_percentage` int(3) DEFAULT 0,
  `images` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `work_date` date NOT NULL DEFAULT curdate(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `recent_login_attempts`
-- (See below for the actual view)
--
CREATE TABLE `recent_login_attempts` (
`id` int(11)
,`user_id` int(11)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`email` varchar(255)
,`ip_address` varchar(45)
,`success` tinyint(1)
,`reason` varchar(255)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `security_settings`
--

CREATE TABLE `security_settings` (
  `id` int(11) NOT NULL,
  `setting_name` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `security_settings`
--

INSERT INTO `security_settings` (`id`, `setting_name`, `setting_value`, `description`, `updated_by`, `updated_at`) VALUES
(1, 'max_login_attempts', '5', 'Maximum login attempts before account lockout', NULL, '2025-06-03 18:16:43'),
(2, 'lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)', NULL, '2025-06-03 18:16:43'),
(3, 'session_timeout', '3600', 'Session timeout in seconds (1 hour)', NULL, '2025-06-03 18:16:43'),
(4, 'password_min_length', '8', 'Minimum password length', NULL, '2025-06-03 18:16:43'),
(5, 'password_require_uppercase', '1', 'Require uppercase letters in password', NULL, '2025-06-03 18:16:43'),
(6, 'password_require_lowercase', '1', 'Require lowercase letters in password', NULL, '2025-06-03 18:16:43'),
(7, 'password_require_numbers', '1', 'Require numbers in password', NULL, '2025-06-03 18:16:43'),
(8, 'password_require_symbols', '0', 'Require special symbols in password', NULL, '2025-06-03 18:16:43'),
(9, 'force_password_change_days', '90', 'Force password change after X days (0 = disabled)', NULL, '2025-06-03 18:16:43'),
(10, 'enable_two_factor', '0', 'Enable two-factor authentication', NULL, '2025-06-03 18:16:43'),
(11, 'remember_me_duration', '2592000', 'Remember me duration in seconds (30 days)', NULL, '2025-06-03 18:16:43');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Inspector','Operator','Viewer') NOT NULL DEFAULT 'Viewer',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `failed_login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `role`, `status`, `last_login`, `created_at`, `updated_at`, `created_by`, `profile_image`, `email_verified`, `failed_login_attempts`, `locked_until`) VALUES
(2, 'Amar', 'SHARMILEE', 'amar@a.com', '01157109109', '$2y$10$yTqMvgJQk6zHNwG5LXEz2OIuVF.ndKQgowoChUuAFK/hhLyZCU6jK', 'Admin', 'Active', '2025-06-08 00:22:53', '2025-06-03 18:08:43', '2025-06-08 00:22:53', NULL, NULL, 1, 0, NULL),
(7, 'Ali', 'Samad', 'ali@a.com', '0134532678', '$2y$10$BcjY9ydIuXB1T7PhACQN4ewijakBU2aiqUWLTbmqKPQvwawS5SCiS', 'Operator', 'Active', '2025-06-07 12:15:47', '2025-06-04 10:04:42', '2025-06-07 12:15:47', NULL, NULL, 1, 0, NULL),
(8, 'Abu', 'Samad', 'abu@a.com', '0142661321', '$2y$10$mbdz7jqCXwSlFtwG8ARmTeJJmwSvpLRrcvdJC6I0tpitI8B07BXaq', 'Operator', 'Active', '2025-06-07 12:30:32', '2025-06-04 10:05:30', '2025-06-07 12:30:32', NULL, NULL, 1, 0, NULL);

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `users_audit_trigger` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO user_activity_log (user_id, action, description, ip_address)
        VALUES (NEW.id, 'status_change', 
                CONCAT('Status changed from ', OLD.status, ' to ', NEW.status),
                '127.0.0.1');
    END IF;
    
    IF OLD.role != NEW.role THEN
        INSERT INTO user_activity_log (user_id, action, description, ip_address)
        VALUES (NEW.id, 'role_change', 
                CONCAT('Role changed from ', OLD.role, ' to ', NEW.role),
                '127.0.0.1');
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_activity_log`
--

CREATE TABLE `user_activity_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_activity_log`
--

INSERT INTO `user_activity_log` (`id`, `user_id`, `action`, `description`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, NULL, 'user_created', 'New user created: Amar SHARMILEE', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-03 18:08:43'),
(2, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-03 18:52:17'),
(3, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-03 21:23:29'),
(4, NULL, 'status_change', 'Status changed from Active to Inactive', '127.0.0.1', NULL, '2025-06-04 04:38:18'),
(5, NULL, 'user_updated', 'User updated: John Inspector', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 04:38:19'),
(6, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:03:06'),
(7, NULL, 'user_created', 'New user created: Ali Samad', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:04:42'),
(8, NULL, 'user_created', 'New user created: Abu abu@samad', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:05:30'),
(9, NULL, 'user_deleted', 'User deleted: John Inspector', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:05:51'),
(10, NULL, 'user_deleted', 'User deleted: Sarah Operator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:06:00'),
(11, NULL, 'user_deleted', 'User deleted: Mike Viewer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:06:10'),
(12, NULL, 'user_deleted', 'User deleted: System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:06:18'),
(13, NULL, 'user_updated', 'User updated: Abu abu@samad', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-04 10:06:29'),
(14, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:05:29'),
(15, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:05:45'),
(16, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:06:46'),
(17, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:08:13'),
(18, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:08:54'),
(19, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:09:17'),
(20, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:18:47'),
(21, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:20:01'),
(22, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:29:21'),
(23, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-05 21:39:22'),
(24, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:28:59'),
(25, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:29:19'),
(26, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:30:41'),
(27, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:31:00'),
(28, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:31:20'),
(29, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:32:08'),
(30, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:32:43'),
(31, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:48:01'),
(32, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:52:11'),
(33, 8, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:55:55'),
(34, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 07:56:04'),
(35, 8, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 08:47:33'),
(36, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 08:47:46'),
(37, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 08:57:23'),
(38, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 08:57:30'),
(39, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 09:04:46'),
(40, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:21:54'),
(41, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:22:07'),
(42, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:35:49'),
(43, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:37:32'),
(44, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:52:14'),
(45, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:52:34'),
(46, 2, 'failed_login', 'Failed login attempt for: amar@a.com', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:53:46'),
(47, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:53:50'),
(48, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 17:59:23'),
(49, 2, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:00:28'),
(50, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:00:41'),
(51, 8, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:01:11'),
(52, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:01:25'),
(53, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:29:17'),
(54, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:29:29'),
(55, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:29:36'),
(56, 8, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:31:10'),
(57, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:31:17'),
(58, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:34:57'),
(59, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:35:04'),
(60, 8, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:35:24'),
(61, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:35:32'),
(62, 2, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:37:06'),
(63, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:37:17'),
(64, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:38:32'),
(65, 8, 'failed_login', 'Failed login attempt for: abu@a.com', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:38:40'),
(66, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:38:43'),
(67, 8, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:39:21'),
(68, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-06-06 18:55:14'),
(69, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 11:34:13'),
(70, 2, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 11:35:59'),
(71, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 11:36:06'),
(72, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 11:36:23'),
(73, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 11:40:00'),
(74, 7, 'role_change', 'Role changed from Inspector to Operator', '127.0.0.1', NULL, '2025-06-07 11:58:33'),
(75, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 12:15:42'),
(76, 7, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 12:15:47'),
(77, 7, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 12:21:51'),
(78, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 12:21:56'),
(79, 2, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 12:30:27'),
(80, 8, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 12:30:32'),
(81, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 16:24:45'),
(82, 2, 'successful_login', 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0', '2025-06-07 20:37:48'),
(83, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-07 21:38:32'),
(84, 2, 'logout', 'User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-08 00:16:35'),
(85, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-08 00:16:41'),
(86, 2, 'successful_login', 'User logged in successfully', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36', '2025-06-08 00:22:53');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permission` varchar(100) NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT 1,
  `granted_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT (current_timestamp() + interval 24 hour),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `remember_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `active_sessions`
--
DROP TABLE IF EXISTS `active_sessions`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active_sessions`  AS SELECT `s`.`id` AS `id`, `s`.`user_id` AS `user_id`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`email` AS `email`, `u`.`role` AS `role`, `s`.`ip_address` AS `ip_address`, `s`.`user_agent` AS `user_agent`, `s`.`last_activity` AS `last_activity`, `s`.`expires_at` AS `expires_at`, `s`.`created_at` AS `session_created` FROM (`user_sessions` `s` join `users` `u` on(`s`.`user_id` = `u`.`id`)) WHERE `s`.`expires_at` > current_timestamp() ORDER BY `s`.`last_activity` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `flood_reports_summary`
--
DROP TABLE IF EXISTS `flood_reports_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `flood_reports_summary`  AS SELECT `flood_reports`.`id` AS `id`, `flood_reports`.`location` AS `location`, `flood_reports`.`severity` AS `severity`, `flood_reports`.`water_depth` AS `water_depth`, `flood_reports`.`status` AS `status`, `flood_reports`.`timestamp` AS `timestamp`, CASE WHEN `flood_reports`.`severity` = 'Extreme' OR `flood_reports`.`water_depth` > 30 THEN 'critical' WHEN `flood_reports`.`severity` = 'Severe' OR `flood_reports`.`water_depth` > 20 THEN 'high' WHEN `flood_reports`.`severity` = 'Moderate' OR `flood_reports`.`water_depth` > 10 THEN 'medium' ELSE 'low' END AS `urgency`, CASE WHEN `flood_reports`.`timestamp` >= current_timestamp() - interval 1 day THEN 'today' WHEN `flood_reports`.`timestamp` >= current_timestamp() - interval 7 day THEN 'week' WHEN `flood_reports`.`timestamp` >= current_timestamp() - interval 30 day THEN 'month' ELSE 'older' END AS `time_category` FROM `flood_reports` ORDER BY `flood_reports`.`timestamp` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `operator_performance_view`
--
DROP TABLE IF EXISTS `operator_performance_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `operator_performance_view`  AS SELECT `u`.`id` AS `operator_id`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, count(`mr`.`id`) AS `total_completed_tasks`, avg(case when `mr`.`completion_date` <= `mr`.`scheduled_date` then 1 else 0 end) * 100 AS `on_time_completion_rate`, avg(to_days(`mr`.`completion_date`) - to_days(`mr`.`scheduled_date`)) AS `avg_completion_delay_days`, sum(`mr`.`actual_hours_worked`) AS `total_hours_worked`, count(`oir`.`id`) AS `issues_reported` FROM ((`users` `u` left join `maintenance_requests` `mr` on(`u`.`id` = `mr`.`assigned_to` and `mr`.`status` = 'Completed')) left join `operator_issue_reports` `oir` on(`u`.`id` = `oir`.`operator_id`)) WHERE `u`.`role` = 'Operator' AND `u`.`status` = 'Active' GROUP BY `u`.`id`, `u`.`first_name`, `u`.`last_name` ;

-- --------------------------------------------------------

--
-- Structure for view `operator_tasks`
--
DROP TABLE IF EXISTS `operator_tasks`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `operator_tasks`  AS SELECT `mr`.`id` AS `id`, `mr`.`drainage_point_id` AS `drainage_point_id`, `dp`.`name` AS `drainage_point_name`, `dp`.`latitude` AS `latitude`, `dp`.`longitude` AS `longitude`, `mr`.`request_type` AS `task_type`, 'Maintenance' AS `task_category`, `mr`.`description` AS `description`, `mr`.`priority` AS `priority`, `mr`.`status` AS `status`, `mr`.`scheduled_date` AS `scheduled_date`, `mr`.`completion_date` AS `completion_date`, `mr`.`assigned_to` AS `operator_id`, `mr`.`created_at` AS `created_at`, `mr`.`updated_at` AS `updated_at`, `mr`.`findings` AS `findings`, `mr`.`recommendations` AS `recommendations`, `mr`.`condition_rating` AS `condition_rating` FROM (`maintenance_requests` `mr` left join `drainage_points_backup` `dp` on(`mr`.`drainage_point_id` = `dp`.`id`)) WHERE `mr`.`assigned_to` is not nullunion allselect `ins`.`id` AS `id`,`ins`.`drainage_point_id` AS `drainage_point_id`,`dp`.`name` AS `drainage_point_name`,`dp`.`latitude` AS `latitude`,`dp`.`longitude` AS `longitude`,`ins`.`inspection_type` AS `task_type`,'Inspection' AS `task_category`,`ins`.`description` AS `description`,`ins`.`priority` AS `priority`,`ins`.`status` AS `status`,`ins`.`scheduled_date` AS `scheduled_date`,`ins`.`completion_date` AS `completion_date`,`ins`.`operator_id` AS `operator_id`,`ins`.`created_at` AS `created_at`,`ins`.`updated_at` AS `updated_at`,`ins`.`findings` AS `findings`,`ins`.`recommendations` AS `recommendations`,NULL AS `condition_rating` from (`inspection_schedules` `ins` left join `drainage_points_backup` `dp` on(`ins`.`drainage_point_id` = `dp`.`id`)) where `ins`.`operator_id` is not null  ;

-- --------------------------------------------------------

--
-- Structure for view `operator_task_summary`
--
DROP TABLE IF EXISTS `operator_task_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `operator_task_summary`  AS SELECT `u`.`id` AS `operator_id`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, count(`mr`.`id`) AS `total_tasks`, sum(case when `mr`.`status` = 'Pending' then 1 else 0 end) AS `pending_tasks`, sum(case when `mr`.`status` = 'In Progress' then 1 else 0 end) AS `in_progress_tasks`, sum(case when `mr`.`status` = 'Completed' then 1 else 0 end) AS `completed_tasks`, sum(case when `mr`.`priority` in ('High','Critical') and `mr`.`status` <> 'Completed' then 1 else 0 end) AS `high_priority_tasks`, sum(case when `mr`.`scheduled_date` < curdate() and `mr`.`status` not in ('Completed','Cancelled') then 1 else 0 end) AS `overdue_tasks`, avg(`mr`.`completion_percentage`) AS `avg_completion_percentage` FROM (`users` `u` left join `maintenance_requests` `mr` on(`u`.`id` = `mr`.`assigned_to`)) WHERE `u`.`role` = 'Operator' AND `u`.`status` = 'Active' GROUP BY `u`.`id`, `u`.`first_name`, `u`.`last_name` ;

-- --------------------------------------------------------

--
-- Structure for view `recent_login_attempts`
--
DROP TABLE IF EXISTS `recent_login_attempts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `recent_login_attempts`  AS SELECT `la`.`id` AS `id`, `la`.`user_id` AS `user_id`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `la`.`email` AS `email`, `la`.`ip_address` AS `ip_address`, `la`.`success` AS `success`, `la`.`reason` AS `reason`, `la`.`created_at` AS `created_at` FROM (`login_attempts` `la` left join `users` `u` on(`la`.`user_id` = `u`.`id`)) WHERE `la`.`created_at` > current_timestamp() - interval 24 hour ORDER BY `la`.`created_at` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `drainage_lines`
--
ALTER TABLE `drainage_lines`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `drainage_points`
--
ALTER TABLE `drainage_points`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `drainage_points_backup`
--
ALTER TABLE `drainage_points_backup`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_drainage_points_created_by` (`created_by`),
  ADD KEY `fk_drainage_points_updated_by` (`updated_by`);

--
-- Indexes for table `flood_prone_areas`
--
ALTER TABLE `flood_prone_areas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `flood_reports`
--
ALTER TABLE `flood_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flood_reports_status` (`status`),
  ADD KEY `idx_flood_reports_severity` (`severity`),
  ADD KEY `idx_flood_reports_timestamp` (`timestamp`),
  ADD KEY `idx_flood_reports_created_at` (`created_at`),
  ADD KEY `fk_flood_reports_assigned_to` (`assigned_to`),
  ADD KEY `fk_flood_reports_resolved_by` (`resolved_by`);

--
-- Indexes for table `inspection_schedules`
--
ALTER TABLE `inspection_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_schedule_number` (`schedule_number`),
  ADD KEY `fk_inspection_drainage_point` (`drainage_point_id`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ip_address` (`ip_address`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_success` (`success`),
  ADD KEY `fk_login_attempts_user_id` (`user_id`);

--
-- Indexes for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_request_number` (`request_number`),
  ADD KEY `idx_drainage_point_id` (`drainage_point_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_scheduled_date` (`scheduled_date`),
  ADD KEY `fk_maintenance_requested_by` (`requested_by`),
  ADD KEY `fk_maintenance_assigned_to` (`assigned_to`),
  ADD KEY `idx_maintenance_assigned_status` (`assigned_to`,`status`),
  ADD KEY `idx_maintenance_scheduled_date` (`scheduled_date`),
  ADD KEY `idx_maintenance_priority_status` (`priority`,`status`);

--
-- Indexes for table `operator_activity_log`
--
ALTER TABLE `operator_activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_operator_id` (`operator_id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `operator_issue_reports`
--
ALTER TABLE `operator_issue_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_operator_id` (`operator_id`),
  ADD KEY `idx_drainage_point_id` (`drainage_point_id`),
  ADD KEY `idx_issue_type` (`issue_type`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `fk_issue_assigned_to` (`assigned_to`);

--
-- Indexes for table `operator_notifications`
--
ALTER TABLE `operator_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_operator_id` (`operator_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_related_type` (`related_type`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `operator_performance_metrics`
--
ALTER TABLE `operator_performance_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_operator_date` (`operator_id`,`metric_date`),
  ADD KEY `idx_operator_id` (`operator_id`),
  ADD KEY `idx_metric_date` (`metric_date`);

--
-- Indexes for table `operator_preferences`
--
ALTER TABLE `operator_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_operator_prefs` (`operator_id`);

--
-- Indexes for table `operator_work_logs`
--
ALTER TABLE `operator_work_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_operator_id` (`operator_id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_work_date` (`work_date`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_used` (`used`);

--
-- Indexes for table `security_settings`
--
ALTER TABLE `security_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_name` (`setting_name`),
  ADD KEY `fk_security_settings_updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `fk_created_by` (`created_by`),
  ADD KEY `idx_status_role` (`status`,`role`),
  ADD KEY `idx_last_login` (`last_login`),
  ADD KEY `idx_failed_attempts` (`failed_login_attempts`),
  ADD KEY `idx_locked_until` (`locked_until`);

--
-- Indexes for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_permission` (`user_id`,`permission`),
  ADD KEY `idx_permission` (`permission`),
  ADD KEY `fk_granted_by` (`granted_by`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_remember_token` (`remember_token`),
  ADD KEY `idx_user_expires` (`user_id`,`expires_at`),
  ADD KEY `idx_last_activity` (`last_activity`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `drainage_lines`
--
ALTER TABLE `drainage_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `flood_prone_areas`
--
ALTER TABLE `flood_prone_areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `flood_reports`
--
ALTER TABLE `flood_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `inspection_schedules`
--
ALTER TABLE `inspection_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `operator_activity_log`
--
ALTER TABLE `operator_activity_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `operator_issue_reports`
--
ALTER TABLE `operator_issue_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `operator_notifications`
--
ALTER TABLE `operator_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `operator_performance_metrics`
--
ALTER TABLE `operator_performance_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `operator_preferences`
--
ALTER TABLE `operator_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `operator_work_logs`
--
ALTER TABLE `operator_work_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `security_settings`
--
ALTER TABLE `security_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `flood_reports`
--
ALTER TABLE `flood_reports`
  ADD CONSTRAINT `fk_flood_reports_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_flood_reports_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inspection_schedules`
--
ALTER TABLE `inspection_schedules`
  ADD CONSTRAINT `fk_inspection_drainage_point` FOREIGN KEY (`drainage_point_id`) REFERENCES `drainage_points` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD CONSTRAINT `fk_login_attempts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `maintenance_requests`
--
ALTER TABLE `maintenance_requests`
  ADD CONSTRAINT `fk_maintenance_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_maintenance_drainage_point` FOREIGN KEY (`drainage_point_id`) REFERENCES `drainage_points` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_maintenance_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `operator_activity_log`
--
ALTER TABLE `operator_activity_log`
  ADD CONSTRAINT `fk_activity_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `operator_issue_reports`
--
ALTER TABLE `operator_issue_reports`
  ADD CONSTRAINT `fk_issue_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_issue_drainage_point` FOREIGN KEY (`drainage_point_id`) REFERENCES `drainage_points` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_issue_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `operator_notifications`
--
ALTER TABLE `operator_notifications`
  ADD CONSTRAINT `fk_notification_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `operator_performance_metrics`
--
ALTER TABLE `operator_performance_metrics`
  ADD CONSTRAINT `fk_metrics_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `operator_preferences`
--
ALTER TABLE `operator_preferences`
  ADD CONSTRAINT `fk_preferences_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `operator_work_logs`
--
ALTER TABLE `operator_work_logs`
  ADD CONSTRAINT `fk_worklog_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_worklog_task` FOREIGN KEY (`task_id`) REFERENCES `maintenance_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_password_reset_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `security_settings`
--
ALTER TABLE `security_settings`
  ADD CONSTRAINT `fk_security_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_activity_log`
--
ALTER TABLE `user_activity_log`
  ADD CONSTRAINT `fk_activity_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `fk_permissions_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_permissions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
