# Utility Cost Management Web App

A modern web application for managing utility costs and room data with a clean, professional interface.

## Features

- **Room Management**
  - Display rooms in a data table with details (room name, electric/water readings, price)
  - Search functionality for rooms by name, block number, or room number
  - Add new rooms with block number, room number, and price
  - Import/Export room data
  - Print functionality with custom template

- **UI/UX Design**
  - Mobile-compatible responsive design
  - Clean, professional look using shadcn/ui components
  - Tailwind CSS styling
  - Lucide icons for UI elements

## Tech Stack

- Vite + React + TypeScript
- shadcn/ui for components
- Tailwind CSS for styling
- Lucide icons for UI elements

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
  ├── components/      # React components
  │   ├── ui/         # shadcn/ui components
  │   └── room-table  # Room management components
  ├── lib/            # Utility functions
  ├── types/          # TypeScript interfaces
  └── App.tsx         # Main application component
```

## Data Types

```typescript
interface UtilCost {
  type: 'electric' | 'water' | 'garbage';
  price: number;
}

interface Room {
  blockNumber: number;
  roomNumber: number;
  roomName: string;
  currentElectric: number;
  currentWater: number;
  previousElectric: number;
  previousWater: number;
  roomPrice: number;
  updatedAt: string;
}
