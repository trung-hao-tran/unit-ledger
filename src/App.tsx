import { useState } from 'react';
import { RoomTable } from '@/components/room-table';
import { Toolbar } from '@/components/toolbar';
import { PreparationStage } from '@/components/preparation-stage';
import { CalculationStage } from '@/components/calculation-stage';
import { useRoomsStore } from '@/store/rooms';
import { useCalculationRoomsStore } from '@/store/calculation-rooms';
import type { Room } from '@/types';

type CalculationMode = 'none' | 'preparation' | 'calculation';

// const mockRooms: Room[] = [
//   { 
//     roomName: "A1", 
//     blockNumber: "A", 
//     roomNumber: 1, 
//     roomPrice: 3000, 
//     currentElectric: 100, 
//     currentWater: 50, 
//     previousElectric: 100, 
//     previousWater: 50, 
//     updatedAt: new Date().toISOString() 
//   },
//   { 
//     roomName: "A2", 
//     blockNumber: "A", 
//     roomNumber: 2, 
//     roomPrice: 3000, 
//     currentElectric: 150, 
//     currentWater: 60, 
//     previousElectric: 150, 
//     previousWater: 60, 
//     updatedAt: new Date().toISOString() 
//   },
//   { 
//     roomName: "B1", 
//     blockNumber: "B", 
//     roomNumber: 1, 
//     roomPrice: 3500, 
//     currentElectric: 200, 
//     currentWater: 70, 
//     previousElectric: 200, 
//     previousWater: 70, 
//     updatedAt: new Date().toISOString() 
//   },
//   { 
//     roomName: "B2", 
//     blockNumber: "B", 
//     roomNumber: 2, 
//     roomPrice: 3500, 
//     currentElectric: 250, 
//     currentWater: 80, 
//     previousElectric: 250, 
//     previousWater: 80, 
//     updatedAt: new Date().toISOString() 
//   },
// ];

function App() {
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('none');
  const { 
    rooms,
    // setRooms,
    updateRooms,
  } = useRoomsStore();

  const {
    setCalculationRooms,
    clearCalculation,
  } = useCalculationRoomsStore();

  // Initialize rooms with mock data
  // useEffect(() => {
  //   setRooms(mockRooms);
  // }, [setRooms]);

  const handlePreparationComplete = (selectedRooms: Room[]) => {
    setCalculationRooms(selectedRooms);
    setCalculationMode('calculation');
  };

  const handleSaveCalculations = (updatedRooms: Room[]) => {
    updateRooms(updatedRooms);
    setCalculationMode('none');
    clearCalculation();
  };

  const handleImport = () => {
    console.log('Import clicked');
  };

  const handleExport = () => {
    console.log('Export clicked');
  };

  const handlePrint = () => {

    console.log('Print clicked');
  };

  const renderContent = () => {
    switch (calculationMode) {
      case 'preparation':
        return (
          <PreparationStage
            rooms={rooms}
            onConfirm={handlePreparationComplete}
            onCancel={() => setCalculationMode('none')}
          />
        );
      case 'calculation':
        return (
          <CalculationStage
            onSave={handleSaveCalculations}
            onCancel={() => {
              setCalculationMode('none');
              clearCalculation();
            }}
          />
        );
      default:
        return <RoomTable rooms={rooms} />;
    }
  };

  return (
    <div className="min-h-screen w-full p-4">
      <div className="space-y-6">
        <Toolbar
          onImport={handleImport}
          onExport={handleExport}
          onPrint={handlePrint}
          isCalculating={calculationMode !== 'none'}
          onToggleCalculation={() => 
            setCalculationMode(prev => prev === 'none' ? 'preparation' : 'none')
          }
        />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
