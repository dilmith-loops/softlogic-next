<?php

namespace Database\Seeders;

use App\Models\Video;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class VideoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('seeders/videos_data.json');
        if (!File::exists($jsonPath)) {
            return;
        }

        $videos = json_decode(File::get($jsonPath), true);

        foreach ($videos as $vid) {
            Video::updateOrCreate(
                ['id' => $vid['id']],
                [
                    'youtube_id' => $vid['youtubeId'] ?? null,
                    'title' => $vid['title'],
                    'category' => $vid['category'] ?? 'all',
                    'duration' => $vid['duration'] ?? '03:00',
                    'duration_sec' => $vid['durationSec'] ?? 180,
                    'views_display' => $vid['views'] ?? '1,000,000',
                    'views_base_count' => $vid['viewsCount'] ?? 1000000,
                    'rating' => $vid['rating'] ?? 98.5,
                    'date_text' => $vid['date'] ?? 'Recently',
                    'author' => $vid['author'] ?? 'Dr. Specialist',
                    'author_title' => $vid['authorTitle'] ?? 'Medical Professional',
                    'author_verified' => $vid['authorVerified'] ?? true,
                    'description' => $vid['description'] ?? '',
                    'key_points' => $vid['keyPoints'] ?? [],
                    'animation_type' => $vid['animationType'] ?? 'shower-circles',
                    'accent_color' => $vid['accentColor'] ?? '#7c1fb8',
                    'icon' => $vid['icon'] ?? '🩺',
                    'badge' => $vid['badge'] ?? null,
                    'video_src' => $vid['videoSrc'] ?? 'https://res.cloudinary.com/mouwqzwi/video/upload/v1792471928/Softlogic_Life_breast_cancer_awareness_month_campaign_V17_EDIT_OPTION_01_rrakxk.mp4',
                ]
            );
        }
    }
}
