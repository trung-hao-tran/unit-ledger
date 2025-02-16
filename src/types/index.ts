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

export interface UtilCost {
  type: 'electric' | 'water' | 'garbage';
  price: number;
}

export interface ExportData {
  rooms: Room[];
  utilityCosts: UtilCost[];
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
  utilCosts: UtilCost[];
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
  onToggleCalculation: () => void;
}

export interface RoomTableProps {
  rooms: Room[];
}

export interface UtilityCostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  initialCosts?: UtilCost[];
}

export interface CalculationStageProps {
  onSave: (updatedRooms: Room[]) => void;
  onCancel: () => void;
}
