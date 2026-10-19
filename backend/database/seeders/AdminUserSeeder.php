<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Credentials are saved directly into the MySQL database.
     */
    public function run(): void
    {
        // Creates the primary administrator directly in the database
        User::firstOrCreate(
            ['email' => 'admin@checkhub.org'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('Admin@CheckHub2026!'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
