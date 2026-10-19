<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-admin {--name= : Name of the admin} {--email= : Email address} {--password= : Admin password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or update an administrator account directly in the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Enter Administrator Name', 'Administrator');
        $email = $this->option('email') ?: $this->ask('Enter Administrator Email');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address provided.');
            return self::FAILURE;
        }

        $password = $this->option('password') ?: $this->secret('Enter Admin Password');

        if (empty($password) || strlen($password) < 6) {
            $this->error('Password must be at least 6 characters.');
            return self::FAILURE;
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->info("✓ Administrator [{$user->email}] successfully saved to the database (ID: {$user->id}).");
        return self::SUCCESS;
    }
}
