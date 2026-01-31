
export interface FinancialDataPoint {
  date: string;
  totalPatrimoine: number;
  livretA: number;
  livretJeune: number;
  compteTitres: number;
  perfCompteTitresEuro: number;
  perfCompteTitresPercent: number;
  pea: number;
  perfPeaEuro: number;
  perfPeaPercent: number;
  totalInvestissement: number;
  percentInvestissement: number;
  totalEpargne: number;
  percentEpargne: number;
}

export interface DashboardStats {
  currentTotal: number;
  lastMonthChange: number;
  investmentShare: number;
  savingsShare: number;
  bestPerformer: string;
}
