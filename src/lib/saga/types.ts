import { FlightLeg } from "../convergence/flightGraph";
import { Airport } from "../convergence/airports";

export type SagaStepName = 
  | "ACQUIRE_LOCKS"
  | "AUTHORIZE_ESCROW"
  | "VERIFY_INVENTORY"
  | "EXECUTE_CHECKOUT"
  | "CONFIRM_CAPTURE";

export type StepState = "IDLE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "COMPENSATING" | "ROLLED_BACK";

export type SagaStatus = 
  | "INITIALIZED"
  | "IN_PROGRESS"
  | "CONFIRMED"
  | "ROLLING_BACK"
  | "ROLLED_BACK"
  | "FAILED";

export interface SagaLogEntry {
  timestamp: string;
  step: SagaStepName | "COMPENSATION" | "INITIALIZATION";
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
  details?: Record<string, unknown>;
}

export interface EscrowHold {
  memberId: string;
  memberName: string;
  amountUsd: number;
  authorizationId: string;
  status: "PENDING" | "AUTHORIZED" | "CAPTURED" | "VOIDED";
  authorizedAt?: string;
  capturedAt?: string;
  voidedAt?: string;
}

export interface InventoryLock {
  lockKey: string;
  flightId: string;
  travelerId: string;
  seatId: string;
  status: "LOCKED" | "RELEASED" | "TICKETED";
  expiresAt: string;
  acquiredAt: string;
}

export interface GroupMemberSession {
  id: string;
  name: string;
  email: string;
  originAirport: Airport;
  flight: FlightLeg;
  selectedSeat: string;
  escrowStatus: "UNAUTHORIZED" | "HOLD_PLACED" | "CAPTURED" | "VOIDED_REFUNDED";
  ticketStatus: "UNISSUED" | "LOCKED" | "ISSUED" | "RELEASED";
  eTicketNumber?: string;
}

export interface ChaosConfig {
  simulateFailure: boolean;
  failureStep?: SagaStepName;
  targetTravelerId?: string;
  failureType?: "PRICE_SURGE" | "INVENTORY_DEPLETED" | "CARD_DECLINED" | "AIRLINE_TIMEOUT";
}

export interface SagaExecutionResult {
  sessionId: string;
  status: SagaStatus;
  isAtomicSuccess: boolean;
  totalMembers: number;
  totalCapturedUsd: number;
  totalRefundedVoidedUsd: number;
  completedSteps: SagaStepName[];
  failedStep?: SagaStepName;
  failureReason?: string;
  compensationSummary?: {
    holdsVoided: number;
    locksReleased: number;
    financialLiabilityZero: boolean;
  };
  steps: Record<SagaStepName, {
    state: StepState;
    startedAt?: string;
    completedAt?: string;
    description: string;
  }>;
  logs: SagaLogEntry[];
  members: GroupMemberSession[];
}
