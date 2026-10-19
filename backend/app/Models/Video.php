<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Video extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'youtube_id',
        'title',
        'category',
        'duration',
        'duration_sec',
        'views_display',
        'views_base_count',
        'rating',
        'date_text',
        'author',
        'author_title',
        'author_verified',
        'description',
        'key_points',
        'animation_type',
        'accent_color',
        'icon',
        'badge',
        'video_src',
    ];

    protected $casts = [
        'key_points' => 'array',
        'author_verified' => 'boolean',
        'rating' => 'float',
        'duration_sec' => 'integer',
        'views_base_count' => 'integer',
    ];

    protected $appends = ['total_views', 'unique_ips_count'];

    public function views(): HasMany
    {
        return $this->hasMany(VideoView::class, 'video_id', 'id');
    }

    /**
     * Get dynamic total views (base seeded count + real recorded views in DB)
     */
    public function getTotalViewsAttribute(): int
    {
        return (int) $this->views_base_count + $this->views()->count();
    }

    /**
     * Get unique IP addresses count for this video
     */
    public function getUniqueIpsCountAttribute(): int
    {
        return $this->views()->distinct('ip_address')->count('ip_address');
    }
}
