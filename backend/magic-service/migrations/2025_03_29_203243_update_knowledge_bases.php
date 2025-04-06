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
        Schema::rename('magic_flow_knowledge', 'knowledge_bases');
        // 修改表结构，添加新字段
        Schema::table('knowledge_bases', function (Blueprint $table) {
            $table->unsignedBigInteger('word_count')->default(0)->comment('字数统计');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('knowledge_bases', 'magic_flow_knowledge');
        Schema::table('knowledge_bases', function (Blueprint $table) {
            $table->dropColumn('word_count');
        });
    }
};
