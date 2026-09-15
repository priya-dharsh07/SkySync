import { 
  ChaosConfig, 
  EscrowHold, 
  GroupMemberSession, 
  InventoryLock, 
  SagaExecutionResult, 
  SagaLogEntry, 
  SagaStepName, 
  StepState 
} from "./types";
import { lockManager } from "./lockManager";

export class SagaOrchestrator {
  private sessionId: string;
  private members: GroupMemberSession[];
  private chaos: ChaosConfig;
  private logs: SagaLogEntry[] = [];
  private steps: Record<SagaStepName, {
    state: StepState;
    startedAt?: string;
    completedAt?: string;
    description: string;
  }>;
  private escrowHolds: EscrowHold[] = [];
  private inventoryLocks: InventoryLock[] = [];

  constructor(sessionId: string, members: GroupMemberSession[], chaos?: ChaosConfig) {
    this.sessionId = sessionId;
    this.members = JSON.parse(JSON.stringify(members)); // clone
    this.chaos = chaos || { simulateFailure: false };

    this.steps = {
      ACQUIRE_LOCKS: {
        state: "IDLE",
        description: "Acquire distributed Redis TTL locks on all seats to prevent race conditions",
      },
      AUTHORIZE_ESCROW: {
        state: "IDLE",
        description: "Two-phase pre-authorization hold on all member payment methods (Zero initial capture)",
      },
      VERIFY_INVENTORY: {
        state: "IDLE",
        description: "Simultaneous GDS inventory audit and fare consistency verification across airlines",
      },
      EXECUTE_CHECKOUT: {
        state: "IDLE",
        description: "Synchronous multi-airline ticket issuance across distinct flight networks",
      },
      CONFIRM_CAPTURE: {
        state: "IDLE",
        description: "Atomic payment capture: Finalize escrow holds simultaneously upon 100% group success",
      },
    };
  }

  private addLog(
    step: SagaStepName | "COMPENSATION" | "INITIALIZATION",
    level: "INFO" | "WARN" | "ERROR" | "SUCCESS",
    message: string,
    details?: Record<string, unknown>
  ) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      step,
      level,
      message,
      details,
    });
  }

  /**
   * Main entry point to execute the Transactional Saga
   */
  async execute(): Promise<SagaExecutionResult> {
    this.addLog("INITIALIZATION", "INFO", `Starting Distributed Saga Orchestrator for Group Session [${this.sessionId}] with ${this.members.length} travelers`);

    const completedSteps: SagaStepName[] = [];

    try {
      // -------------------------------------------------------------
      // STEP 1: ACQUIRE DISTRIBUTED LOCKS
      // -------------------------------------------------------------
      await this.runStep("ACQUIRE_LOCKS", async () => {
        this.addLog("ACQUIRE_LOCKS", "INFO", `Attempting to acquire distributed locks for ${this.members.length} traveler seats (TTL: 300s)`);

        for (const member of this.members) {
          const lockKey = `lock:flight:${member.flight.id}:seat:${member.selectedSeat}`;
          const acquired = await lockManager.acquireLock(lockKey, `${this.sessionId}:${member.id}`, 300);

          if (!acquired) {
            throw new Error(`Seat collision: Seat ${member.selectedSeat} on flight ${member.flight.flightNumber} is temporarily held by another transaction.`);
          }

          const lock: InventoryLock = {
            lockKey,
            flightId: member.flight.id,
            travelerId: member.id,
            seatId: member.selectedSeat,
            status: "LOCKED",
            expiresAt: new Date(Date.now() + 300 * 1000).toISOString(),
            acquiredAt: new Date().toISOString(),
          };
          this.inventoryLocks.push(lock);
          member.ticketStatus = "LOCKED";

          this.addLog("ACQUIRE_LOCKS", "SUCCESS", `Lock secured for ${member.name} (${member.flight.airlineCode} ${member.flight.flightNumber} - Seat ${member.selectedSeat})`);
        }
      });
      completedSteps.push("ACQUIRE_LOCKS");

      // -------------------------------------------------------------
      // STEP 2: AUTHORIZE TWO-PHASE ESCROW HOLDS
      // -------------------------------------------------------------
      await this.runStep("AUTHORIZE_ESCROW", async () => {
        this.addLog("AUTHORIZE_ESCROW", "INFO", "Initiating two-phase escrow authorization holds (no money captured yet)");

        for (const member of this.members) {
          // Check chaos injection for card decline
          if (this.chaos.simulateFailure && this.chaos.failureStep === "AUTHORIZE_ESCROW" && 
             (!this.chaos.targetTravelerId || this.chaos.targetTravelerId === member.id)) {
            throw new Error(`Escrow Hold Failed: Bank authorization declined for ${member.name} (Simulated Chaos: ${this.chaos.failureType || "CARD_DECLINED"})`);
          }

          const authId = `auth_hold_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
          const hold: EscrowHold = {
            memberId: member.id,
            memberName: member.name,
            amountUsd: member.flight.priceUsd,
            authorizationId: authId,
            status: "AUTHORIZED",
            authorizedAt: new Date().toISOString(),
          };
          this.escrowHolds.push(hold);
          member.escrowStatus = "HOLD_PLACED";

          this.addLog("AUTHORIZE_ESCROW", "SUCCESS", `Pre-auth escrow hold placed for ${member.name}: $${member.flight.priceUsd} (AuthId: ${authId})`);
        }
      });
      completedSteps.push("AUTHORIZE_ESCROW");

      // -------------------------------------------------------------
      // STEP 3: CONCURRENT INVENTORY & FARE VERIFICATION
      // -------------------------------------------------------------
      await this.runStep("VERIFY_INVENTORY", async () => {
        this.addLog("VERIFY_INVENTORY", "INFO", "Auditing live GDS inventory and price stability across partner airlines");

        for (const member of this.members) {
          // Chaos injection trigger
          if (this.chaos.simulateFailure && (this.chaos.failureStep === "VERIFY_INVENTORY" || !this.chaos.failureStep)) {
            if (!this.chaos.targetTravelerId || this.chaos.targetTravelerId === member.id) {
              const reason = this.chaos.failureType === "PRICE_SURGE" 
                ? `Sudden dynamic price surge detected on ${member.flight.airline} (${member.flight.flightNumber}): fare increased by $140 above guaranteed lock.`
                : `Inventory Depleted: Last seat on ${member.flight.airline} (${member.flight.flightNumber}) was claimed in concurrent GDS batch.`;
              throw new Error(reason);
            }
          }

          this.addLog("VERIFY_INVENTORY", "SUCCESS", `Verified: ${member.flight.airline} ${member.flight.flightNumber} inventory intact, fare locked at $${member.flight.priceUsd}`);
        }
      });
      completedSteps.push("VERIFY_INVENTORY");

      // -------------------------------------------------------------
      // STEP 4: SYNCHRONOUS TICKET ISSUANCE
      // -------------------------------------------------------------
      await this.runStep("EXECUTE_CHECKOUT", async () => {
        this.addLog("EXECUTE_CHECKOUT", "INFO", "Dispatching simultaneous ticket issuance orders to airline reservation systems");

        for (const member of this.members) {
          if (this.chaos.simulateFailure && this.chaos.failureStep === "EXECUTE_CHECKOUT" &&
             (!this.chaos.targetTravelerId || this.chaos.targetTravelerId === member.id)) {
            throw new Error(`Airline System Timeout: ${member.flight.airline} failed to acknowledge booking ticket within threshold.`);
          }

          const ticketNum = `ETKT-${member.flight.airlineCode}-${Math.floor(100000 + Math.random() * 900000)}`;
          member.ticketStatus = "ISSUED";
          member.eTicketNumber = ticketNum;

          this.addLog("EXECUTE_CHECKOUT", "SUCCESS", `E-Ticket issued for ${member.name}: ${ticketNum} (${member.flight.flightNumber}, Seat ${member.selectedSeat})`);
        }
      });
      completedSteps.push("EXECUTE_CHECKOUT");

      // -------------------------------------------------------------
      // STEP 5: ATOMIC PAYMENT CAPTURE
      // -------------------------------------------------------------
      await this.runStep("CONFIRM_CAPTURE", async () => {
        this.addLog("CONFIRM_CAPTURE", "INFO", "All group members successfully ticketed. Capturing escrow holds in one atomic batch.");

        for (const hold of this.escrowHolds) {
          hold.status = "CAPTURED";
          hold.capturedAt = new Date().toISOString();
        }

        for (const member of this.members) {
          member.escrowStatus = "CAPTURED";
        }

        const totalCaptured = this.escrowHolds.reduce((sum, h) => sum + h.amountUsd, 0);
        this.addLog("CONFIRM_CAPTURE", "SUCCESS", `Atomic capture complete. Total group settlement: $${totalCaptured}. Zero stragglers, zero partial failure.`);
      });
      completedSteps.push("CONFIRM_CAPTURE");

      return {
        sessionId: this.sessionId,
        status: "CONFIRMED",
        isAtomicSuccess: true,
        totalMembers: this.members.length,
        totalCapturedUsd: this.escrowHolds.reduce((s, h) => s + h.amountUsd, 0),
        totalRefundedVoidedUsd: 0,
        completedSteps,
        steps: this.steps,
        logs: this.logs,
        members: this.members,
      };

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown saga failure";
      const failedStep = Object.keys(this.steps).find(
        (key) => this.steps[key as SagaStepName].state === "FAILED"
      ) as SagaStepName | undefined;

      this.addLog("COMPENSATION", "ERROR", `SAGA EXECUTION HALTED due to: ${errorMsg}`);
      
      // Execute Compensating Rollback Transactions
      const compensationResult = await this.executeCompensation(errorMsg);

      return {
        sessionId: this.sessionId,
        status: "ROLLED_BACK",
        isAtomicSuccess: false,
        totalMembers: this.members.length,
        totalCapturedUsd: 0,
        totalRefundedVoidedUsd: compensationResult.totalVoidedUsd,
        completedSteps,
        failedStep,
        failureReason: errorMsg,
        compensationSummary: {
          holdsVoided: compensationResult.holdsVoided,
          locksReleased: compensationResult.locksReleased,
          financialLiabilityZero: true,
        },
        steps: this.steps,
        logs: this.logs,
        members: this.members,
      };
    }
  }

  /**
   * Helper to run an individual Saga step with timing and error isolation
   */
  private async runStep(stepName: SagaStepName, fn: () => Promise<void>) {
    this.steps[stepName].state = "IN_PROGRESS";
    this.steps[stepName].startedAt = new Date().toISOString();

    try {
      await fn();
      this.steps[stepName].state = "COMPLETED";
      this.steps[stepName].completedAt = new Date().toISOString();
    } catch (err) {
      this.steps[stepName].state = "FAILED";
      this.steps[stepName].completedAt = new Date().toISOString();
      throw err;
    }
  }

  /**
   * Compensating Rollback Transaction Cascade
   * Voids escrow holds, releases temporary locks, reverses issued tickets
   */
  private async executeCompensation(reason: string): Promise<{ holdsVoided: number; locksReleased: number; totalVoidedUsd: number }> {
    this.addLog("COMPENSATION", "WARN", `TRIGGERING COMPENSATING TRANSACTIONS: ${reason}`);

    let holdsVoided = 0;
    let totalVoidedUsd = 0;

    // 1. VOID ESCROW HOLDS (Zero charge, immediate authorization cancellation)
    for (const hold of this.escrowHolds) {
      if (hold.status === "AUTHORIZED") {
        hold.status = "VOIDED";
        hold.voidedAt = new Date().toISOString();
        holdsVoided++;
        totalVoidedUsd += hold.amountUsd;
        this.addLog("COMPENSATION", "SUCCESS", `Compensating Action: Pre-auth hold [${hold.authorizationId}] for ${hold.memberName} ($${hold.amountUsd}) VOIDED with zero penalty.`);
      }
    }

    for (const member of this.members) {
      member.escrowStatus = "VOIDED_REFUNDED";
    }

    // 2. RELEASE INVENTORY LOCKS
    let locksReleased = 0;
    for (const lock of this.inventoryLocks) {
      await lockManager.releaseLock(lock.lockKey, `${this.sessionId}:${lock.travelerId}`);
      lock.status = "RELEASED";
      locksReleased++;
    }
    await lockManager.releaseAllForSession(this.sessionId);
    this.addLog("COMPENSATION", "SUCCESS", `Compensating Action: Released ${locksReleased} temporary seat holds back to airline inventory pool.`);

    // 3. CANCEL ANY PARTIAL TICKETS
    for (const member of this.members) {
      if (member.ticketStatus === "ISSUED" || member.ticketStatus === "LOCKED") {
        member.ticketStatus = "RELEASED";
        this.addLog("COMPENSATION", "INFO", `Compensating Action: Voided tentative ticket for ${member.name} (${member.flight.airlineCode} ${member.flight.flightNumber})`);
      }
    }

    // Mark steps status
    for (const key of Object.keys(this.steps) as SagaStepName[]) {
      if (this.steps[key].state === "COMPLETED" || this.steps[key].state === "FAILED") {
        this.steps[key].state = "ROLLED_BACK";
      }
    }

    this.addLog("COMPENSATION", "SUCCESS", `ROLLBACK COMPLETE. Zero financial liability incurred. No members left stranded.`);

    return {
      holdsVoided,
      locksReleased,
      totalVoidedUsd,
    };
  }
}
