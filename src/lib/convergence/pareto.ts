import { Airport, AIRPORTS, getAirportByCode } from "./airports";
import { FlightLeg, generateFlightOptions } from "./flightGraph";

export interface TravelerOrigin {
  id: string;
  name: string;
  originAirportCode: string;
  departureDate: string; // "YYYY-MM-DD"
}

export interface MemberFlightPlan {
  travelerId: string;
  travelerName: string;
  originAirport: Airport;
  flight: FlightLeg;
}

export interface ConvergenceDestination {
  destination: Airport;
  isParetoOptimal: boolean;
  paretoRank: number; // 1 = frontier
  compositeFairnessScore: number; // 0 - 100 scale (higher is fairer/better)
  
  // Metric 1: Price Disparity & Fairness
  totalCostUsd: number;
  averagePriceUsd: number;
  priceStandardDeviation: number;
  priceGiniCoefficient: number; // 0 = perfectly equal, 1 = maximum inequality
  priceRangeUsd: number; // max - min
  
  // Metric 2: Arrival Window Alignment
  earliestArrivalUtc: string;
  latestArrivalUtc: string;
  arrivalWindowMinutes: number; // gap between first and last member arrival
  
  // Metric 3: Aggregate Duration
  aggregateDurationMinutes: number;
  averageDurationMinutes: number;
  maxIndividualDurationMinutes: number;

  // Selected optimal flight combination for each traveler
  memberFlights: MemberFlightPlan[];
}

export interface OptimizationWeights {
  priceFairness: number;   // default ~0.40
  arrivalAlignment: number; // default ~0.35
  travelDuration: number;   // default ~0.25
}

/**
 * Calculates Gini Coefficient for a series of values (0 = identical, 1 = extreme disparity)
 */
export function calculateGiniCoefficient(values: number[]): number {
  if (values.length <= 1) return 0;
  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  if (sum === 0) return 0;

  let cumulativeDiff = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cumulativeDiff += Math.abs(sorted[i] - sorted[j]);
    }
  }

  const mean = sum / n;
  return Number((cumulativeDiff / (2 * n * n * mean)).toFixed(4));
}

/**
 * Calculates Standard Deviation of an array
 */
export function calculateStdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.round(Math.sqrt(variance));
}

/**
 * Finds the best combination of flights for a group to a candidate destination
 */
function evaluateDestinationCandidate(
  destination: Airport,
  travelers: TravelerOrigin[]
): ConvergenceDestination | null {
  // Discard destination if any traveler is already in that city
  if (travelers.some(t => t.originAirportCode.toUpperCase() === destination.code.toUpperCase())) {
    return null;
  }

  // For each traveler, generate flight options to this destination
  const travelerOptions: { traveler: TravelerOrigin; flights: FlightLeg[] }[] = [];
  for (const t of travelers) {
    const flights = generateFlightOptions(t.originAirportCode, destination.code, t.departureDate);
    if (flights.length === 0) return null; // No route available
    travelerOptions.push({ traveler: t, flights });
  }

  // Select the combination of flights that minimizes arrival window while keeping price low
  // Since each traveler has ~3 slots, evaluate the Cartesian product to pick the best synchronized flight combo
  let bestCombination: MemberFlightPlan[] | null = null;
  let bestArrivalWindow = Infinity;
  let bestCost = Infinity;

  // Simple recursive/iterative search through combination slots
  function searchCombos(idx: number, current: MemberFlightPlan[]) {
    if (idx === travelerOptions.length) {
      // Evaluate this combination
      const arrTimes = current.map(c => new Date(c.flight.arrivalTimeUtc).getTime());
      const minArr = Math.min(...arrTimes);
      const maxArr = Math.max(...arrTimes);
      const windowMin = Math.round((maxArr - minArr) / (1000 * 60));
      const totalCost = current.reduce((sum, c) => sum + c.flight.priceUsd, 0);

      // Objective heuristic for pairing: strongly prefer aligned arrivals (< 180 mins) then lower cost
      const combinedScore = windowMin * 1.5 + totalCost * 0.5;
      const currentBestScore = bestArrivalWindow * 1.5 + bestCost * 0.5;

      if (combinedScore < currentBestScore) {
        bestArrivalWindow = windowMin;
        bestCost = totalCost;
        bestCombination = [...current];
      }
      return;
    }

    const { traveler, flights } = travelerOptions[idx];
    const originAirport = getAirportByCode(traveler.originAirportCode) || destination;
    for (const fl of flights) {
      current.push({
        travelerId: traveler.id,
        travelerName: traveler.name,
        originAirport,
        flight: fl,
      });
      searchCombos(idx + 1, current);
      current.pop();
    }
  }

  searchCombos(0, []);

  const chosenPlan = bestCombination as MemberFlightPlan[] | null;
  if (!chosenPlan || chosenPlan.length === 0) {
    return null;
  }

  // Compute metrics for the selected best combination
  const prices = chosenPlan.map(m => m.flight.priceUsd);
  const durations = chosenPlan.map(m => m.flight.durationMinutes);
  const arrTimes = chosenPlan.map(m => new Date(m.flight.arrivalTimeUtc).getTime());

  const minArrMs = Math.min(...arrTimes);
  const maxArrMs = Math.max(...arrTimes);
  const earliestArrivalUtc = new Date(minArrMs).toISOString();
  const latestArrivalUtc = new Date(maxArrMs).toISOString();
  const arrivalWindowMinutes = Math.round((maxArrMs - minArrMs) / (1000 * 60));

  const totalCostUsd = prices.reduce((a, b) => a + b, 0);
  const averagePriceUsd = Math.round(totalCostUsd / prices.length);
  const priceStdDev = calculateStdDev(prices);
  const priceGini = calculateGiniCoefficient(prices);
  const priceRange = Math.max(...prices) - Math.min(...prices);

  const aggregateDuration = durations.reduce((a, b) => a + b, 0);
  const averageDuration = Math.round(aggregateDuration / durations.length);
  const maxDuration = Math.max(...durations);

  return {
    destination,
    isParetoOptimal: false,
    paretoRank: 1,
    compositeFairnessScore: 0,
    totalCostUsd,
    averagePriceUsd,
    priceStandardDeviation: priceStdDev,
    priceGiniCoefficient: priceGini,
    priceRangeUsd: priceRange,
    earliestArrivalUtc,
    latestArrivalUtc,
    arrivalWindowMinutes,
    aggregateDurationMinutes: aggregateDuration,
    averageDurationMinutes: averageDuration,
    maxIndividualDurationMinutes: maxDuration,
    memberFlights: chosenPlan,
  };
}

/**
 * Pareto Optimization Algorithm:
 * Evaluates candidate destinations across 3 objectives:
 * 1. Minimize Price Disparity (priceStandardDeviation / Gini)
 * 2. Minimize Arrival Window Delta (arrivalWindowMinutes)
 * 3. Minimize Aggregate Travel Duration (aggregateDurationMinutes)
 */
export function computeParetoConvergence(
  travelers: TravelerOrigin[],
  weights: OptimizationWeights = { priceFairness: 0.40, arrivalAlignment: 0.35, travelDuration: 0.25 }
): ConvergenceDestination[] {
  if (travelers.length < 2) {
    return [];
  }

  // Filter candidates: Major tier1 and tier2 international hubs
  const candidates: ConvergenceDestination[] = [];
  for (const airport of AIRPORTS) {
    const evaluated = evaluateDestinationCandidate(airport, travelers);
    if (evaluated) {
      candidates.push(evaluated);
    }
  }

  if (candidates.length === 0) return [];

  // Compute Pareto Dominance for each candidate
  // A dominates B iff A is <= B in all 3 objectives and < B in at least one
  for (let i = 0; i < candidates.length; i++) {
    let isDominated = false;
    const a = candidates[i];

    for (let j = 0; j < candidates.length; j++) {
      if (i === j) continue;
      const b = candidates[j];

      const bBetterOrEqual =
        b.priceStandardDeviation <= a.priceStandardDeviation &&
        b.arrivalWindowMinutes <= a.arrivalWindowMinutes &&
        b.aggregateDurationMinutes <= a.aggregateDurationMinutes;

      const bStrictlyBetter =
        b.priceStandardDeviation < a.priceStandardDeviation ||
        b.arrivalWindowMinutes < a.arrivalWindowMinutes ||
        b.aggregateDurationMinutes < a.aggregateDurationMinutes;

      if (bBetterOrEqual && bStrictlyBetter) {
        isDominated = true;
        break;
      }
    }

    candidates[i].isParetoOptimal = !isDominated;
    candidates[i].paretoRank = isDominated ? 2 : 1;
  }

  // Normalize metrics across candidates to compute a weighted fairness score (0 - 100)
  const minStdDev = Math.min(...candidates.map(c => c.priceStandardDeviation));
  const maxStdDev = Math.max(...candidates.map(c => c.priceStandardDeviation)) || 1;

  const minArrWindow = Math.min(...candidates.map(c => c.arrivalWindowMinutes));
  const maxArrWindow = Math.max(...candidates.map(c => c.arrivalWindowMinutes)) || 1;

  const minDuration = Math.min(...candidates.map(c => c.aggregateDurationMinutes));
  const maxDuration = Math.max(...candidates.map(c => c.aggregateDurationMinutes)) || 1;

  const totalWeight = weights.priceFairness + weights.arrivalAlignment + weights.travelDuration || 1;
  const wPrice = weights.priceFairness / totalWeight;
  const wArr = weights.arrivalAlignment / totalWeight;
  const wDur = weights.travelDuration / totalWeight;

  for (const c of candidates) {
    // Invert normalized metrics so 1.0 is best (lowest cost disparity, lowest arrival gap, lowest duration)
    const priceScore = maxStdDev === minStdDev ? 1 : 1 - ((c.priceStandardDeviation - minStdDev) / (maxStdDev - minStdDev));
    const arrivalScore = maxArrWindow === minArrWindow ? 1 : 1 - ((c.arrivalWindowMinutes - minArrWindow) / (maxArrWindow - minArrWindow));
    const durationScore = maxDuration === minDuration ? 1 : 1 - ((c.aggregateDurationMinutes - minDuration) / (maxDuration - minDuration));

    const paretoBonus = c.isParetoOptimal ? 10 : 0;
    const baseScore = (priceScore * wPrice + arrivalScore * wArr + durationScore * wDur) * 90;
    c.compositeFairnessScore = Math.min(100, Math.round(baseScore + paretoBonus));
  }

  // Sort: Pareto optimal first, then by composite fairness score descending
  return candidates.sort((a, b) => {
    if (a.isParetoOptimal !== b.isParetoOptimal) {
      return a.isParetoOptimal ? -1 : 1;
    }
    return b.compositeFairnessScore - a.compositeFairnessScore;
  });
}
