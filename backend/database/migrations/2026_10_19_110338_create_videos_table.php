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
        Schema::create('videos', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. vid-1, vid-2
            $table->string('youtube_id')->nullable();
            $table->string('title');
            $table->string('category')->default('all');
            $table->string('duration')->default('03:00');
            $table->unsignedInteger('duration_sec')->default(180);
            $table->string('views_display')->nullable();
            $table->unsignedBigInteger('views_base_count')->default(0);
            $table->decimal('rating', 5, 2)->default(99.0);
            $table->string('date_text')->default('Recently');
            $table->string('author')->default('Medical Team');
            $table->string('author_title')->nullable();
            $table->boolean('author_verified')->default(true);
            $table->text('description')->nullable();
            $table->json('key_points')->nullable();
            $table->string('animation_type')->default('shower-circles');
            $table->string('accent_color')->default('#ff9000');
            $table->string('icon')->default('🩺');
            $table->string('badge')->nullable();
            $table->string('video_src')->default('breast_cancer_awareness.mp4');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
