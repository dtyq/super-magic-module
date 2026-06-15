<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Application\SuperAgent\Service;

use Dtyq\SuperMagic\Application\SuperAgent\Service\WarmPoolSandboxAppService;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\WarmPoolSandboxEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\WarmPoolSandboxDomainService;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Gateway\Constant\SandboxStatus;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Gateway\Result\BatchStatusResult;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Gateway\Result\GatewayResult;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\SandboxOS\Gateway\SandboxGatewayInterface;
use Hyperf\Logger\LoggerFactory;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

/**
 * Unit tests for {@see WarmPoolSandboxAppService}.
 *
 * Covers:
 *   - {@see WarmPoolSandboxAppService::reconcileClaimedDeadPods()} — the
 *     "claimed in DB but pod already reaped by the gateway" path that keeps
 *     dead-pod `claimed` rows from piling up forever.
 *   - {@see WarmPoolSandboxAppService::refill()} — the circuit breaker that
 *     stops creating into an unhealthy cluster, and the failed-create path
 *     that marks the row `error` and immediately tears down the leaked pod.
 *   - {@see WarmPoolSandboxAppService::cleanupErrorPods()} — the backstop
 *     that reaps aged `error` tombstones and their pods.
 *
 * @internal
 */
class WarmPoolSandboxAppServiceTest extends TestCase
{
    public function testReconcileReturnsEmptyWhenNoClaimedRows(): void
    {
        $domain = $this->createMock(WarmPoolSandboxDomainService::class);
        $domain->expects($this->once())
            ->method('listClaimedForReconcile')
            ->willReturn([]);
        $domain->expects($this->never())->method('deleteEntry');

        $gateway = $this->createMock(SandboxGatewayInterface::class);
        $gateway->expects($this->never())->method('getBatchSandboxStatus');

        $service = $this->makeService($domain, $gateway);

        $result = $service->reconcileClaimedDeadPods(50, 15);

        $this->assertSame(['scanned' => 0, 'reclaimed' => 0], $result);
    }

    public function testReconcileDeletesOnlyRowsGatewayReportsGone(): void
    {
        $running = $this->entity(101, 'running-sandbox');
        $gone = $this->entity(202, 'gone-sandbox');
        $exited = $this->entity(303, 'exited-sandbox');
        $unknown = $this->entity(404, 'unknown-sandbox');

        $domain = $this->createMock(WarmPoolSandboxDomainService::class);
        $domain->method('listClaimedForReconcile')
            ->willReturn([$running, $gone, $exited, $unknown]);
        // Only the two explicitly-gone pods are reclaimed; Running and an
        // absent/unknown status are left untouched.
        $deleted = [];
        $domain->method('deleteEntry')->willReturnCallback(function (int $id) use (&$deleted) {
            $deleted[] = $id;
        });

        $batch = $this->createMock(BatchStatusResult::class);
        $batch->method('isSuccess')->willReturn(true);
        $batch->method('getStatusMap')->willReturn([
            'running-sandbox' => SandboxStatus::RUNNING,
            'gone-sandbox' => SandboxStatus::NOT_FOUND,
            'exited-sandbox' => SandboxStatus::EXITED,
            // 'unknown-sandbox' deliberately absent -> inconclusive -> keep.
        ]);

        $gateway = $this->createMock(SandboxGatewayInterface::class);
        $gateway->expects($this->once())
            ->method('getBatchSandboxStatus')
            ->with(['running-sandbox', 'gone-sandbox', 'exited-sandbox', 'unknown-sandbox'])
            ->willReturn($batch);

        $service = $this->makeService($domain, $gateway);

        $result = $service->reconcileClaimedDeadPods(50, 15);

        $this->assertSame(['scanned' => 4, 'reclaimed' => 2], $result);
        $this->assertSame([202, 303], $deleted);
    }

    public function testReconcileSkipsWhenGatewayReturnsError(): void
    {
        $gone = $this->entity(202, 'gone-sandbox');

        $domain = $this->createMock(WarmPoolSandboxDomainService::class);
        $domain->method('listClaimedForReconcile')->willReturn([$gone]);
        // Gateway error is inconclusive: never delete, so active sessions are
        // never wiped by a flaky gateway.
        $domain->expects($this->never())->method('deleteEntry');

        $batch = $this->createMock(BatchStatusResult::class);
        $batch->method('isSuccess')->willReturn(false);
        $batch->method('getCode')->willReturn(500);
        $batch->method('getMessage')->willReturn('boom');

        $gateway = $this->createMock(SandboxGatewayInterface::class);
        $gateway->method('getBatchSandboxStatus')->willReturn($batch);

        $service = $this->makeService($domain, $gateway);

        $result = $service->reconcileClaimedDeadPods(50, 15);

        $this->assertSame(1, $result['scanned']);
        $this->assertSame(0, $result['reclaimed']);
        $this->assertSame('gateway_error', $result['skipped']);
    }

    public function testRefillSkipsWhenCircuitBreakerOpen(): void
    {
        $domain = $this->createMock(WarmPoolSandboxDomainService::class);
        // Two recent-error probes: the window count (trips threshold) and the
        // cooldown count (a fresh failure -> stay fully open, no probe).
        $domain->method('countRecentErrors')->willReturn(1000);
        // Breaker is open BEFORE image resolution, so nothing downstream runs.
        $domain->expects($this->never())->method('countAvailableForImage');
        $domain->expects($this->never())->method('recordCreating');

        $gateway = $this->createMock(SandboxGatewayInterface::class);
        // The whole point: an open breaker never asks the gateway to create.
        $gateway->expects($this->never())->method('createWarmPoolSandbox');
        $gateway->expects($this->never())->method('getLatestImages');

        $service = $this->makeService($domain, $gateway);

        $result = $service->refill(10);

        $this->assertSame('circuit_open', $result['skipped']);
        $this->assertSame(0, $result['created']);
    }

    public function testRefillMarksErrorAndDeletesPodOnCreateFailure(): void
    {
        $domain = $this->createMock(WarmPoolSandboxDomainService::class);
        // Breaker closed.
        $domain->method('countRecentErrors')->willReturn(0);
        $domain->method('countAvailableForImage')->willReturn(0);
        // Record-ahead returns a row with an id so the failure path can mark it.
        $recorded = $this->entity(7001, 'wp-fail');
        $domain->method('recordCreating')->willReturn($recorded);

        // Each failed create must: (a) flip the row to error, (b) never mark ready.
        $markedError = [];
        $domain->method('markError')->willReturnCallback(function (int $id) use (&$markedError) {
            $markedError[] = $id;
        });
        $domain->expects($this->never())->method('markReady');

        $gateway = $this->createMock(SandboxGatewayInterface::class);
        $gateway->method('getLatestImages')->willReturn([
            'agent_image' => 'agent:1',
            'agfs_image' => 'agfs:1',
        ]);
        $gateway->method('createWarmPoolSandbox')->willReturn(GatewayResult::error('disk pressure'));
        // The leaked pod must be torn down immediately on each failure.
        $deleted = [];
        $gateway->method('deleteSandbox')->willReturnCallback(function (string $sandboxId) use (&$deleted) {
            $deleted[] = $sandboxId;
            return GatewayResult::success();
        });

        $service = $this->makeService($domain, $gateway);

        $result = $service->refill(10);

        $this->assertSame(0, $result['created']);
        // Default max_consecutive_failures = 3, so the burst aborts after 3
        // back-to-back failures rather than firing all 5 slots.
        $this->assertCount(3, $markedError);
        $this->assertCount(3, $deleted);
        // The deleted pod id is the locally-generated sandbox_id passed to the
        // gateway, so just assert it's a non-empty id rather than a fixed value.
        $this->assertNotSame('', $deleted[0]);
    }

    public function testCleanupErrorPodsDeletesPodAndRow(): void
    {
        $row = $this->entity(8001, 'wp-error');

        $domain = $this->createMock(WarmPoolSandboxDomainService::class);
        $domain->method('listErrorForCleanup')->willReturn([$row]);
        $domain->expects($this->once())->method('deleteEntry')->with(8001);

        $gateway = $this->createMock(SandboxGatewayInterface::class);
        $gateway->expects($this->once())
            ->method('deleteSandbox')
            ->with('wp-error')
            ->willReturn(GatewayResult::success());

        $service = $this->makeService($domain, $gateway);

        $result = $service->cleanupErrorPods(15, 100);

        $this->assertSame(['scanned' => 1, 'deleted' => 1], $result);
    }

    public function testCleanupErrorPodsDisabledWhenRetentionNonPositive(): void
    {
        $domain = $this->createMock(WarmPoolSandboxDomainService::class);
        $domain->expects($this->never())->method('listErrorForCleanup');

        $gateway = $this->createMock(SandboxGatewayInterface::class);
        $gateway->expects($this->never())->method('deleteSandbox');

        $service = $this->makeService($domain, $gateway);

        $result = $service->cleanupErrorPods(0, 100);

        $this->assertSame('disabled', $result['skipped']);
        $this->assertSame(0, $result['deleted']);
    }

    private function makeService(
        WarmPoolSandboxDomainService $domain,
        SandboxGatewayInterface $gateway
    ): WarmPoolSandboxAppService {
        $loggerFactory = $this->createMock(LoggerFactory::class);
        $loggerFactory->method('get')->willReturn(new NullLogger());

        return new WarmPoolSandboxAppService($domain, $gateway, $loggerFactory);
    }

    private function entity(int $id, string $sandboxId): WarmPoolSandboxEntity
    {
        $entity = new WarmPoolSandboxEntity();
        $entity->setId($id);
        $entity->setSandboxId($sandboxId);
        return $entity;
    }
}
