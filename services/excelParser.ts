
import * as XLSX from 'xlsx';
import { FinancialDataPoint } from '../types';

/**
 * Convertit un numéro de série Excel ou une valeur brute en chaîne DD/MM/YYYY
 */
const formatExcelDate = (val: any): string => {
  if (val === undefined || val === null) return "";
  
  // Cas d'un numéro de série Excel (ex: 45809)
  if (typeof val === 'number') {
    // Excel commence le 30/12/1899 pour son calcul de date (bug historique Lotus 1-2-3)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Si c'est déjà une chaîne, on tente de la renvoyer ou on la nettoie
  return val.toString();
};

export const parseExcelFile = async (file: File): Promise<FinancialDataPoint[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // On récupère les données brutes sans transformation de type auto pour gérer les dates manuellement
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });

        if (jsonData.length < 14) {
          throw new Error("Format de fichier invalide : Gustave attend au moins 14 lignes de données.");
        }

        const headers = jsonData[0]; 
        const dataPoints: FinancialDataPoint[] = [];

        const parseCurrency = (val: any): number => {
          if (val === undefined || val === null || val === 'X' || val === '-') return 0;
          if (typeof val === 'number') return val;
          const cleaned = val.toString().replace(/\s/g, '').replace(',', '.').replace('€', '').replace('%', '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        // On parcourt les colonnes à partir de la deuxième (index 1)
        for (let col = 1; col < headers.length; col++) {
          const rawDate = headers[col];
          if (!rawDate) continue;

          dataPoints.push({
            date: formatExcelDate(rawDate),
            totalPatrimoine: parseCurrency(jsonData[1][col]),
            livretA: parseCurrency(jsonData[2][col]),
            livretJeune: parseCurrency(jsonData[3][col]),
            compteTitres: parseCurrency(jsonData[4][col]),
            perfCompteTitresEuro: parseCurrency(jsonData[5][col]),
            perfCompteTitresPercent: parseCurrency(jsonData[6][col]),
            pea: parseCurrency(jsonData[7][col]),
            perfPeaEuro: parseCurrency(jsonData[8][col]),
            perfPeaPercent: parseCurrency(jsonData[9][col]),
            totalInvestissement: parseCurrency(jsonData[10][col]),
            percentInvestissement: parseCurrency(jsonData[11][col]),
            totalEpargne: parseCurrency(jsonData[12][col]),
            percentEpargne: parseCurrency(jsonData[13][col]),
          });
        }

        // On inverse pour avoir l'ordre chronologique si besoin, mais ici on respecte l'ordre du fichier
        // S'ils sont décroissants dans l'Excel, on les inverse pour le graphique
        resolve(dataPoints.reverse());
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const getDemoData = (): FinancialDataPoint[] => {
  return [
    {
      date: "01/06/2025",
      totalPatrimoine: 7039.76,
      livretA: 5389.75,
      livretJeune: 1600.17,
      compteTitres: 49.84,
      perfCompteTitresEuro: 0,
      perfCompteTitresPercent: 0,
      pea: 0,
      perfPeaEuro: 0,
      perfPeaPercent: 0,
      totalInvestissement: 49.84,
      percentInvestissement: 0.71,
      totalEpargne: 6989.92,
      percentEpargne: 99.29
    },
    {
      date: "01/07/2025",
      totalPatrimoine: 7045.70,
      livretA: 5389.75,
      livretJeune: 1600.17,
      compteTitres: 52.80,
      perfCompteTitresEuro: 2.98,
      perfCompteTitresPercent: 0.48,
      pea: 0,
      perfPeaEuro: 0,
      perfPeaPercent: 0,
      totalInvestissement: 55.78,
      percentInvestissement: 0.79,
      totalEpargne: 6989.92,
      percentEpargne: 99.21
    },
    {
      date: "01/01/2026",
      totalPatrimoine: 7506.12,
      livretA: 5389.75,
      livretJeune: 1600.17,
      compteTitres: 474.75,
      perfCompteTitresEuro: 41.38,
      perfCompteTitresPercent: 6.62,
      pea: 0,
      perfPeaEuro: 0,
      perfPeaPercent: 0,
      totalInvestissement: 516.20,
      percentInvestissement: 6.88,
      totalEpargne: 6989.92,
      percentEpargne: 93.12
    }
  ];
};
