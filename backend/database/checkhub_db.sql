-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: localhost    Database: checkhub_db
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `checkhub_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `checkhub_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `checkhub_db`;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_10_19_110254_create_personal_access_tokens_table',1),(5,'2026_10_19_110338_create_videos_table',1),(6,'2026_10_19_110339_create_video_views_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'admin',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_views`
--

DROP TABLE IF EXISTS `video_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_views` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `video_id` varchar(255) NOT NULL,
  `video_title` varchar(255) NOT NULL,
  `video_src` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `video_views_video_id_ip_address_index` (`video_id`,`ip_address`),
  KEY `video_views_video_id_viewed_at_index` (`video_id`,`viewed_at`),
  KEY `video_views_ip_address_index` (`ip_address`),
  KEY `video_views_viewed_at_index` (`viewed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_views`
--

LOCK TABLES `video_views` WRITE;
/*!40000 ALTER TABLE `video_views` DISABLE KEYS */;
/*!40000 ALTER TABLE `video_views` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `videos` (
  `id` varchar(255) NOT NULL,
  `youtube_id` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL DEFAULT 'all',
  `duration` varchar(255) NOT NULL DEFAULT '03:00',
  `duration_sec` int(10) unsigned NOT NULL DEFAULT 180,
  `views_display` varchar(255) DEFAULT NULL,
  `views_base_count` bigint(20) unsigned NOT NULL DEFAULT 0,
  `rating` decimal(5,2) NOT NULL DEFAULT 99.00,
  `date_text` varchar(255) NOT NULL DEFAULT 'Recently',
  `author` varchar(255) NOT NULL DEFAULT 'Medical Team',
  `author_title` varchar(255) DEFAULT NULL,
  `author_verified` tinyint(1) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `key_points` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`key_points`)),
  `animation_type` varchar(255) NOT NULL DEFAULT 'shower-circles',
  `accent_color` varchar(255) NOT NULL DEFAULT '#7c1fb8',
  `icon` varchar(255) NOT NULL DEFAULT '?',
  `badge` varchar(255) DEFAULT NULL,
  `video_src` varchar(500) NOT NULL DEFAULT 'https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `videos`
--

LOCK TABLES `videos` WRITE;
/*!40000 ALTER TABLE `videos` DISABLE KEYS */;
INSERT INTO `videos` VALUES ('vid-1','8c2z6FDeAf8','Hands-On Action: Complete Shower Technique In 4K','self-exam','03:45',225,'2,491,200',2491200,99.40,'2 days ago','Dr. Angela Reed, M.D.','Breast Surgical Oncologist',1,'In this comprehensive guide, Dr. Reed demonstrates the circular palpation technique you can do while showering. Lathering with soap dramatically reduces friction, allowing your fingertips to detect minute tissue thickening and lumps that are harder to feel when dry.','[\"Use pads of 3 middle fingers (not tips) with overlapping circular dime-sized motions.\", \"Check with light pressure (near skin surface), medium (glandular layer), and deep pressure (chest wall).\", \"Sweep from the collarbone down to the bottom of the ribs, and armpit across to the breastbone.\", \"Shower monthly: around day 7 to 10 after your period starts when tissue is least swollen.\"]','shower-circles','#7c1fb8','🚿','ESSENTIAL ROUTINE','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-10','2GjPWEtvJSA','Under Pressure: Nipple Retraction & Discharge Warning','symptoms','04:45',285,'1,670,000',1670000,98.10,'1 week ago','Dr. Michael Sterling','Pathologist & Oncology Consultant',1,'A deep dive into ductal papillomas, Paget\'s disease of the breast, and ductal carcinoma. Learn why unilateral spontaneous bloody discharge or an inverted nipple that cannot be pulled out warrants an immediate ductogram or biopsy.','[\"Spontaneous discharge: Leaking without physical squeezing is the main indicator of concern.\", \"Color code: Clear or bloody discharge is more suspicious than milky, green, or yellow secretions.\", \"Paget\'s disease: Often mistaken for eczema, presenting as redness, flaking, or ulceration on the nipple.\", \"Sudden inversion: If a nipple that was previously erect turns inwards, retroareolar tissue must be evaluated.\"]','nipple-anatomy','#5b0f8d','🔍','SYMPTOM ALERT','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-11','8c2z6FDeAf8','Morning Routine: 3 Minutes That Could Save Your Life','self-exam','02:55',175,'5,300,100',5300100,99.90,'6 days ago','Maya Lin (Stage 1 Survivor) & Dr. Reed','Patient Advocate & Surgeon',1,'Maya found a tiny 1.2cm lump during her routine morning shower. Because she caught it at Stage 1, she required minimal treatment and has been cancer-free for 7 years. In this video, she walks through her monthly 3-minute habit.','[\"Set a recurring monthly alarm on your phone (e.g. the 10th of every month).\", \"Do not obsess or check every single day (hormonal daily fluctuations can create false panic).\", \"Once a month is the sweet spot for accurate baseline tracking.\", \"Over 80% of breast cancers are discovered by individuals themselves or their partners!\"]','routine-clock','#7c1fb8','⏰','SURVIVOR STORY','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-12','2GjPWEtvJSA','Young & Active: Why It Doesn\'t Only Happen To Older People','myths','08:15',495,'1,890,000',1890000,98.40,'2 weeks ago','Dr. Priya Nair, M.D.','Young Women\'s Breast Health Clinic',1,'More than 26,000 women under 45 are diagnosed with breast cancer each year in North America. Breast cancer in younger women tends to be discovered at later stages due to assumption of immunity. Here is what every person in their 20s and 30s must know.','[\"Dense breast tissue is common in younger individuals, making mammograms less sensitive; ultrasound/MRI may be required.\", \"Know your family tree: Maternal AND paternal history of breast or ovarian cancer matters.\", \"Genetic testing: Consider talking to a genetic counselor if multiple relatives had early-onset cancer.\", \"Advocate for yourself: If you feel a persistent lump and are told \'you are too young\', request an ultrasound.\"]','genetic-tree','#7c1fb8','🌱','UNDER 40 GUIDE','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-2','2GjPWEtvJSA','Two Round Objects You Should Be Looking At In The Mirror','symptoms','04:20',260,'3,812,400',3812400,99.80,'1 week ago','Prof. Catherine Vance','Chief of Radiology & Mammography',1,'Visual inspection in front of a mirror is step #1 of any clinical self-check. Many early tumors present visible skin retractions, dimpling (similar to the skin of an orange), or subtle nipple direction changes before they can even be felt by touch.','[\"Look with arms relaxed at your sides, then hands placed firmly on hips pushing shoulders forward.\", \"Inspect for any new asymmetry, swelling, bulging, or skin puckering.\", \"Raise both arms overhead: check if both breasts lift together smoothly or if an area tugs inward.\", \"Examine nipples for sudden retraction, inversion, scaling, or spontaneous fluid discharge.\"]','mirror-inspection','#7c1fb8','🪞','STEP 1 FOUNDATION','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-3','7ef2RF_9U4c','Caught Touching Themselves: Doctor Explains Proper Technique','self-exam','05:12',312,'1,940,000',1940000,98.90,'3 days ago','Dr. Marcus Chen, F.A.C.S.','Clinical Oncology Specialist',1,'Most people press haphazardly and miss the critical upper-outer quadrant where 50% of all breast cancers originate. Dr. Chen reviews the three proven palpation patterns: Vertical Strips, Circular Spiral, and Wedge Pattern.','[\"The Vertical Strip pattern is clinically proven to leave fewer missed zones.\", \"Start in the armpit and move downward in a straight line until below the breast, then shift over slightly and move upward.\", \"Pay extra attention to the \'Tail of Spence\' extending into the underarm.\", \"Never pick your fingers up completely; slide them smoothly to avoid gaps.\"]','grid-palpation','#7c1fb8','🩺','DOCTOR APPROVED','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-4','2GjPWEtvJSA','Hot & Heavy: 5 Warning Signs You Absolutely Cannot Ignore','symptoms','06:15',375,'4,150,800',4150800,99.10,'2 weeks ago','Dr. Elena Rostova','Preventative Medicine Director',1,'While 80% of investigated lumps are benign cysts or fibroadenomas, these 5 red flags demand immediate doctor evaluation: a rigid painless lump with irregular borders, skin dimpling, bloody discharge, newly inverted nipple, and persistent lymph node swelling.','[\"Rigid mass: Feels hard like a lemon seed or pebble, non-tender, and anchored to tissue.\", \"Peau d\'orange: Skin pores enlarge and mimic citrus peel due to blocked lymphatic drainage.\", \"Unilateral bloody or clear discharge without squeezing the nipple.\", \"Inflammatory signs: Warmth, rapid swelling, and pink/purple redness covering over a third of the breast.\"]','warning-zones','#5b0f8d','⚠️','CRITICAL KNOWLEDGE','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-5','8c2z6FDeAf8','Men Do It Too: The Taboo Nobody Ever Talks About','male-cancer','04:50',290,'1,120,400',1120400,98.70,'5 days ago','Robert Miller & Dr. Adams','Survivor & Urologic/Male Oncology Lead',1,'Every man has breast tissue behind the nipple and areola. Around 2,800 men are diagnosed with invasive breast cancer every year in the US alone. Because men do not suspect it, diagnoses often occur in late stages. Learn the male check in under 60 seconds.','[\"Symptoms in men most commonly appear as a firm, painless lump right beneath the nipple.\", \"Men with BRCA2 genetic mutations or Klinefelter syndrome have higher risk.\", \"Check for nipple inversion, crusting, or discharge.\", \"Early detection brings male breast cancer survival rates up to 96%.\"]','male-anatomy','#3b82f6','👨','MEN\'S HEALTH','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-6','7ef2RF_9U4c','First Time Experience: What Really Happens At A Mammogram','mammogram','07:30',450,'1,530,000',1530000,97.90,'1 month ago','Hannah Jacobs, RT(R)(M)','Lead Mammography Technologist',1,'Nervous about your first mammogram? We demystify the compression plates, radiation levels, timing tips to reduce discomfort, and 3D Tomosynthesis. Compression lasts only 10 to 15 seconds per view and can detect microcalcifications years before they are palpable.','[\"Schedule your mammogram for the week right after your period when breasts are least sensitive.\", \"Avoid deodorants, antiperspirants, powders, or lotions on the day of the exam (they can mimic calcifications).\", \"Modern 3D Tomosynthesis captures cross-sectional slices with very low radiation.\", \"General guideline: Annual or biennial mammograms starting at age 40 (or earlier with family history).\"]','mammogram-scan','#10b981','🏥','CLINICAL GUIDE','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-7','7ef2RF_9U4c','Deep Tissue Examination: Lying Down Position','self-exam','03:10',190,'890,200',890200,98.60,'3 weeks ago','Dr. Angela Reed, M.D.','Breast Surgical Oncologist',1,'Why lying down is essential: When standing, breast tissue falls toward the lower pole. When lying down, it flattens evenly against the ribcage wall, making deep nodules against the pectoralis muscle detectable that would otherwise remain hidden.','[\"Place a small pillow or folded towel under your right shoulder, placing right hand behind head.\", \"Use your left hand pads in a lawnmower or circular pattern with firm pressure.\", \"Switch sides and repeat with right hand on left breast.\", \"Gently compress the nipple between thumb and index finger to test for fluid discharge.\"]','lying-palpation','#7c1fb8','🛏️','POSITIONING','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-8','2GjPWEtvJSA','Myths Busted: Underwire Bras, Deodorant & Other Dangerous Lies','myths','05:40',340,'2,760,000',2760000,99.50,'2 weeks ago','Dr. Sarah Jenkins','Epidemiologist & Health Researcher',1,'Does underwire block lymph flow? Does aluminum in antiperspirant cause tumors? Can a breast injury cause cancer? Dr. Jenkins breaks down the peer-reviewed science that definitively debunked these persistent viral myths.','[\"Underwire bras do NOT cause breast cancer; rigorous epidemiological trials found zero association.\", \"Antiperspirants and deodorants have no verified causal link to breast carcinogenesis.\", \"Trauma or physical bruising to the breast does not produce tumors (though it can bring existing lumps to attention).\", \"Real proven risk factors: Age, genetic mutations (BRCA1/2), high breast density, alcohol intake, and family history.\"]','myths-facts','#7c1fb8','💡','SCIENCE FIRST','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08'),('vid-9','8c2z6FDeAf8','Hard vs Soft: How To Feel The Difference On Glandular Tissue','self-exam','04:05',245,'3,210,000',3210000,99.20,'4 days ago','Dr. Angela Reed, M.D.','Breast Health Specialist',1,'Healthy breasts naturally have lumps and texture, frequently described as feeling like peas in a soft beanbag or oatmeal. This video teaches tactile calibration: distinguishing benign hormonal lumpiness from an abnormal fixed nodule.','[\"Normal tissue: Uniform, soft, pliable, symmetrical between left and right sides.\", \"Benign cyst: Smooth, spherical, often mobile under fingers like a grape.\", \"Suspicious mass: Hard like a frozen pea or stone, uneven edges, painless, fixed to tissue.\", \"When in doubt, compare identical quadrants on both breasts. Asymmetry is what calls for evaluation.\"]','tactile-calibration','#7c1fb8','🧬','TACTILE TEST','https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4','2026-10-19 05:35:08','2026-10-19 05:35:08');
/*!40000 ALTER TABLE `videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-19 17:52:49
