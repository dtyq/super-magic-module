<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('magic_recycle_bin')) {
            return;
        }

        Schema::table('magic_recycle_bin', function (Blueprint $table) {
            if (! Schema::hasIndex('magic_recycle_bin', 'idx_recycle_restore_lookup')) {
                $table->index(
                    ['resource_type', 'removed_at', 'resource_id', 'deleted_at', 'id'],
                    'idx_recycle_restore_lookup'
                );
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('magic_recycle_bin')) {
            return;
        }

        Schema::table('magic_recycle_bin', function (Blueprint $table) {
            if (Schema::hasIndex('magic_recycle_bin', 'idx_recycle_restore_lookup')) {
                $table->dropIndex('idx_recycle_restore_lookup');
            }
        });
    }
};
