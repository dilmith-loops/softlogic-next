<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Create the initial administrator from ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD.
     * Skipped when no password is configured, so no default credentials ever ship.
     */
    public function run(): void
    {
        $password = env('ADMIN_INITIAL_PASSWORD');

        if (! $password) {
            $this->command?->warn('ADMIN_INITIAL_PASSWORD not set; skipping admin seeding (use php artisan app:create-admin).');

            return;
        }

        User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@softlogic.lk')],
            [
                'name' => 'System Administrator',
                'password' => $password,
                'role' => 'admin',
            ]
        );
    }
}
