export interface Room {
  roomName: string;
  blockNumber: string;
  roomNumber: number;
  roomPrice: number;
  currentElectric: number;
  currentWater: number;
  previousElectric: number;
  previousWater: number;
  updatedAt: string;
}

export interface UtilityCostSet {
  id: number;
  name: string;
  electricityCost: number;
  waterCost: number;
  garbageCost: number;
}

export interface ExportData {
  rooms: Room[];
  utilityCosts: UtilityCostSet[];
  exportedAt: string;
  version: '1.0.0';
}

export interface BlockGroup {
  blockNumber: number;
  rooms: Room[];
  isAllSelected: boolean;
}

export interface PreparationStageProps {
  rooms: Room[];
  onConfirm: (selectedRooms: Room[]) => void;
  onCancel: () => void;
}

export interface CalculationFields {
  isSelected: boolean;
  newElectric: number;
  newWater: number;
}

export type CalculationRoom = Room & CalculationFields;

export interface DataSet {
  utilCosts: UtilityCostSet[];
  rooms: Room[];
  lastUpdated: string;
}

export interface CalculationState {
  isCalculating: boolean;
  selectedRooms: Set<string>;  
}

export interface ToolbarProps {
  onImport: () => void;
  onExport: () => void;
  onPrint: () => void;
  isCalculating: boolean;
  isPrinting: boolean;
  onToggleCalculation: () => void;
  calculationButtonClass?: string;
  printButtonClass?: string;
  printButtonText?: string;
}

export interface RoomTableProps {
  rooms: Room[];
}

export interface UtilityCostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  initialCosts?: UtilityCostSet[];
}

export interface CalculationStageProps {
  onSave: (updatedRooms: Room[]) => void;
  onCancel: () => void;
}

export type PrintingType = 'invoice' | 'total';

export interface PrintingOptions {
  types: {
    invoice: boolean;
    total: boolean;
    receivingSheet: boolean;
  };
  bottomUp: boolean;
  includeDate: boolean;
  selectedDate?: Date;
}

export interface PrintingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (options: {
    selectedRooms: Room[];
    selectedCostSet: UtilityCostSet;
    printingOptions: PrintingOptions;
  }) => void;
}

export interface PrintRoomData {
  roomPrice: number;
  roomName: string;
  blockNumber: string;
  roomNumber: number;
  previousElectric: number;
  currentElectric: number;
  previousWater: number;
  currentWater: number;
}

export interface PrintUtilityData {
  electricityCost: number;
  waterCost: number;
  garbageCost: number;
  printDate: Date;
  printTypes: {
    invoice: boolean;
    total: boolean;
    receivingSheet: boolean;
  };
  totalSheetOptions?: {
    bottomUp: boolean;
    includeDate: boolean;
  };
}

export interface PrintingData {
  rooms: PrintRoomData[];
  utility: PrintUtilityData;
}
