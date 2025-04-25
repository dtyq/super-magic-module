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
        // 修改表结构，添加新字段
        Schema::table('knowledge_bases', function (Blueprint $table) {
            // 检查是否已存在字段，避免重复添加
            if (! Schema::hasColumn('knowledge_bases', 'fragment_config')) {
                $table->string('fragment_config', 2000)->nullable()->comment('分段配置');
            }
            if (! Schema::hasColumn('knowledge_bases', 'embedding_config')) {
                $table->string('embedding_config', 2000)->nullable()->comment('嵌入配置');
            }
            if (! Schema::hasColumn('knowledge_bases', 'is_draft')) {
                $table->tinyInteger('is_draft')->default(0)->comment('是否为草稿');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('knowledge_bases', function (Blueprint $table) {
            // 检查是否已存在字段，避免重复删除
            if (Schema::hasColumn('knowledge_bases', 'fragment_config')) {
                $table->dropColumn('fragment_config');
            }
            if (Schema::hasColumn('knowledge_bases', 'embedding_config')) {
                $table->dropColumn('embedding_config');
            }
            if (Schema::hasColumn('knowledge_bases', 'is_draft')) {
                $table->dropColumn('is_draft');
            }
        });
    }
};
