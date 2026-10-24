<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // The production database was first created by the legacy api/db.php, so the table may already exist.
        if (Schema::hasTable('video_views')) {
            return;
        }

        Schema::create('video_views', function (Blueprint $table) {
            $table->id();
            $table->string('video_id');
            $table->string('video_title');
            $table->string('video_src')->nullable();
            $table->string('ip_address', 45)->index(); // IPv4 & IPv6 support
            $table->text('user_agent')->nullable();
            $table->timestamp('viewed_at')->useCurrent()->index(); // Time and Date
            $table->timestamps();

            $table->index(['video_id', 'ip_address']);
            $table->index(['video_id', 'viewed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video_views');
    }
};
