<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoView extends Model
{
    use HasFactory;

    protected $table = 'video_views';

    // viewed_at is the only timestamp; the production table has no created_at/updated_at.
    public $timestamps = false;

    protected $fillable = [
        'video_id',
        'video_title',
        'video_src',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    /**
     * Serialize timestamps as local SLST wall-clock time, as the admin dashboard expects.
     */
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class, 'video_id', 'id');
    }

    public function scopeSearchIp($query, ?string $ip)
    {
        if (! empty($ip)) {
            return $query->where('ip_address', 'LIKE', "%{$ip}%");
        }

        return $query;
    }

    public function scopeFilterVideo($query, ?string $videoId)
    {
        if (! empty($videoId) && $videoId !== 'all') {
            return $query->where('video_id', $videoId);
        }

        return $query;
    }

    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if (! empty($from)) {
            $query->whereDate('viewed_at', '>=', $from);
        }
        if (! empty($to)) {
            $query->whereDate('viewed_at', '<=', $to);
        }

        return $query;
    }
}
