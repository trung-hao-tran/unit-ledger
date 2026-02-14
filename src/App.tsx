import { useState } from "react";
import { RoomTable } from "@/components/room-table";
import { Toolbar } from "@/components/toolbar";
import { PreparationStage } from "@/components/preparation-stage";
import { CalculationStage } from "@/components/calculation-stage";
import { PrintingStage } from "@/components/printing-stage";
import { Toaster } from "@/components/ui/toaster";
import { useRoomsStore } from "@/store/rooms";
import { useCalculationRoomsStore } from "@/store/calculation-rooms";
import { useSessionStore } from "@/store/session";
import { useCloudStore } from "@/store/cloud-store";
import type { Room, UtilityCostSet, PrintingOptions } from "@/types";
import { cn } from "@/lib/utils";

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

type CalculationMode = "none" | "preparation" | "calculation" | "printing";

function App() {
  const [calculationMode, setCalculationMode] =
    useState<CalculationMode>("none");
  const {
    rooms,
    // setRooms,
    updateRooms,
  } = useRoomsStore();

  const { setCalculationRooms, clearCalculation } = useCalculationRoomsStore();

  const handlePrint = (options: {
    selectedRooms: Room[];
    selectedCostSet: UtilityCostSet;
    printingOptions: PrintingOptions;
  }) => {
    // Implement printing logic here
    console.log("Printing with options:", options);
    setCalculationMode("none");
  };

  const handlePreparationComplete = (selectedRooms: Room[]) => {
    setCalculationRooms(selectedRooms);
    setCalculationMode("calculation");
  };

  const handleSaveCalculations = async (updatedRooms: Room[]) => {
    // Update rooms in the store
    updateRooms(updatedRooms);

    // Store the calculated rooms in session storage
    useSessionStore.getState().addCalculatedRooms(updatedRooms);

    // Save to cloud
    const cloudStore = useCloudStore.getState();
    if (cloudStore.cloudName) {
      await cloudStore.saveCurrentData();
    }

    // Reset UI state
    setCalculationMode("none");
    clearCalculation();
  };

  const handleImport = () => {
    console.log("Import clicked");
  };

  const handleExport = () => {
    console.log("Export clicked");
  };

  const handleToggleCalculation = () => {
    if (
      calculationMode === "preparation" ||
      calculationMode === "calculation"
    ) {
      setCalculationMode("none");
      clearCalculation();
    } else if (calculationMode === "none") {
      setCalculationMode("preparation");
    }
  };

  const handleTogglePrinting = () => {
    setCalculationMode((prev) => (prev === "printing" ? "none" : "printing"));
  };

  const renderContent = () => {
    switch (calculationMode) {
      case "preparation":
        return (
          <PreparationStage
            rooms={rooms}
            onConfirm={handlePreparationComplete}
            onCancel={() => setCalculationMode("none")}
          />
        );
      case "calculation":
        return (
          <CalculationStage
            onSave={handleSaveCalculations}
            onCancel={() => {
              setCalculationMode("none");
              clearCalculation();
            }}
          />
        );
      case "printing":
        return (
          <PrintingStage
            rooms={rooms}
            onPrint={handlePrint}
            onCancel={() => setCalculationMode("none")}
          />
        );
      default:
        return <RoomTable rooms={rooms} />;
    }
  };

  return (
    <div className="min-h-screen w-full overflow-hidden">
      <div className="flex flex-col w-full">
        <Toolbar
          onImport={handleImport}
          onExport={handleExport}
          onPrint={handleTogglePrinting}
          isCalculating={
            calculationMode === "preparation" ||
            calculationMode === "calculation"
          }
          isPrinting={calculationMode === "printing"}
          onToggleCalculation={handleToggleCalculation}
          calculationButtonClass={cn(
            "transition-colors",
            calculationMode === "preparation" ||
              calculationMode === "calculation"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600",
          )}
          printButtonClass={cn(
            "transition-colors",
            calculationMode === "printing"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600",
          )}
          printButtonText={
            calculationMode === "printing" ? "Exit Printing" : "Print"
          }
        />
        {renderContent()}
        <Toaster />
      </div>
      <span className="fixed bottom-1 right-2 text-xs text-muted-foreground/50">
        v{__APP_VERSION__}
      </span>
    </div>
  );
}

export default App;
