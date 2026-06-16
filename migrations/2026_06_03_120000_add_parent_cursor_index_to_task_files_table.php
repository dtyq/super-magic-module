<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use Hyperf\Database\Migrations\Migration;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Schema\Schema;

return new class extends Migration {
    private string $indexName = 'idx_project_parent_storage_sort_file';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tableName = 'magic_super_agent_task_files';
        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            // Composite index for the project attachments V2 cursor query:
            // WHERE project_id = ? AND parent_id = ? AND storage_type = ? ORDER BY sort, file_id.
            // Covers equality filters, the ORDER BY and the keyset cursor predicate
            // (sort > ? OR (sort = ? AND file_id > ?)) so MySQL avoids filesort.
            if (! Schema::hasIndex($tableName, $this->indexName)) {
                $table->index(
                    ['project_id', 'parent_id', 'storage_type', 'sort', 'file_id'],
                    $this->indexName
                );
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
