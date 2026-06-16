<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('magic_recycle_bin')) {
            return;
        }

        Schema::table('magic_recycle_bin', function (Blueprint $table) {
            if (! Schema::hasColumn('magic_recycle_bin', 'removed_at')) {
                $table->timestamp('removed_at')->nullable()->after('retain_days')
                    ->comment('从回收站删除/清空的时间，NULL表示仍在回收站展示');
            }
            if (! Schema::hasColumn('magic_recycle_bin', 'removed_by')) {
                $table->string('removed_by', 128)->nullable()->after('removed_at')
                    ->comment('从回收站删除/清空的操作人ID');
            }
            if (! Schema::hasColumn('magic_recycle_bin', 'purged_at')) {
                $table->timestamp('purged_at')->nullable()->after('removed_by')
                    ->comment('资源被后台任务物理清理完成的时间');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
