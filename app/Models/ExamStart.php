<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;

class ExamStart extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'ip_address',
        'user_agent',
        'video_id',
        'consented',
        'started_at',
    ];

    protected $casts = [
        'consented' => 'integer',
        'started_at' => 'datetime',
    ];

    /**
     * Serialize timestamps as local SLST wall-clock time, as the admin dashboard expects.
     */
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }
}
