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
        // 重命名表
        Schema::rename('magic_flow_knowledge_fragment', 'knowledge_base_fragments');

        // 修改表结构，添加新字段
        Schema::table('knowledge_base_fragments', function (Blueprint $table) {
            // 检查是否已存在字段，避免重复添加
            if (! Schema::hasColumn('knowledge_base_fragments', 'document_code')) {
                $table->string('document_code', 255)->default('')->comment('关联文档code')->index();
            }

            if (! Schema::hasColumn('knowledge_base_fragments', 'word_count')) {
                $table->unsignedBigInteger('word_count')->default(0)->comment('字数统计');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 移除添加的字段
        Schema::table('knowledge_base_fragments', function (Blueprint $table) {
            if (Schema::hasColumn('knowledge_base_fragments', 'document_code')) {
                $table->dropColumn('document_code');
            }

            if (Schema::hasColumn('knowledge_base_fragments', 'word_count')) {
                $table->dropColumn('word_count');
            }
        });

        // 恢复表名
        Schema::rename('knowledge_base_fragments', 'magic_flow_knowledge_fragment');
    }
};
