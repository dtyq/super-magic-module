<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    private string $table = 'magic_super_agent_warm_pool_sandboxes';

    private string $index = 'idx_status_updated';

    public function up(): void
    {
        if (! Schema::hasTable($this->table)) {
            return;
        }

        Schema::table($this->table, function (Blueprint $table) {
            // Supports the refill circuit breaker (count `error` rows whose
            // updated_at is within the failure window) and the error-pod
            // cleanup pass (find `error` rows older than the retention TTL).
            // Both filter by status + updated_at, so this composite index lets
            // them seek instead of scanning the whole pool.
            $table->index(['status', 'updated_at'], $this->index);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable($this->table)) {
            return;
        }

        Schema::table($this->table, function (Blueprint $table) {
            $table->dropIndex($this->index);
        });
    }
};
