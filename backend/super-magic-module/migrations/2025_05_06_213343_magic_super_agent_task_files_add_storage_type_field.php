<?php

use Hyperf\Database\Schema\Schema;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('magic_super_agent_task_files', function (Blueprint $table) {
            $table->string('storage_type', 32)->default('workspace')->comment('存储类型');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('magic_super_agent_task_files', function (Blueprint $table) {
            $table->dropColumn('storage_type');
        });
    }
};
