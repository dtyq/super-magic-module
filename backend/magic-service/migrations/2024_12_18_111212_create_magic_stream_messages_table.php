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
        Schema::create('magic_stream_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('app_message_id', 64)->comment('消息ID');
            $table->string('type')->comment('消息类型');
            $table->json('seq_message_ids')->nullable()->comment('消息ID序列');
            $table->mediumInteger('status')->default(1)->comment('消息状态 1-未结束 2-已结束');
            $table->json('content')->nullable()->comment('消息内容');
            $table->json('sequence_content')->nullable()->comment('存储队列消息内容');
            $table->string('organization_code', 32)->nullable()->comment('组织编码');
            $table->timestamps();
            $table->softDeletes();

            $table->unique('app_message_id');
            $table->index(['updated_at', 'deleted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('magic_stream_messages', function (Blueprint $table) {
        });
    }
};
