<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bring tables created by the legacy api/db.php in line with the Laravel models,
     * and add the exam_starts table that only the legacy API used to create.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('admin');
            }
            if (! Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable();
            }
            if (! Schema::hasColumn('users', 'remember_token')) {
                $table->rememberToken();
            }
        });

        if (! Schema::hasTable('exam_starts')) {
            Schema::create('exam_starts', function (Blueprint $table) {
                $table->id();
                $table->string('ip_address', 45)->index();
                $table->text('user_agent')->nullable();
                $table->string('video_id', 191)->nullable();
                $table->boolean('consented')->default(true);
                $table->timestamp('started_at')->useCurrent()->index();
            });
        }

        if (! Schema::hasColumn('videos', 'position')) {
            Schema::table('videos', function (Blueprint $table) {
                $table->unsignedSmallInteger('position')->default(0);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_starts');

        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    }
};
