# Unit Ledger - Utility Cost Management System

A comprehensive web application for managing utility costs, room data, and billing for property managers. Built with modern web technologies for a seamless user experience.

[Try Unit ledger here](https://trung-hao-tran.github.io/unit-ledger/)

## Features

### Room Management
- **Interactive Data Table**: View, sort, and filter rooms with powerful data table functionality
- **Room Operations**: Add, edit, and delete rooms with an intuitive interface
- **Block Organization**: Group rooms by blocks/buildings for better organization

### Utility Management
- **Utility Readings**: Track electricity and water meter readings over time
- **Calculation Mode**: Easily update utility readings for multiple rooms in batch
- **Historical Data**: Maintain previous readings for comparison and billing

### Billing & Printing
- **Custom Invoices**: Generate professional invoices for tenants
- **Bulk Printing**: Print multiple invoices, total sheets, or receiving sheets at once
- **Customizable Templates**: Adjust printing options to suit your needs

### Data Management
- **Import/Export**: Easily import and export data as JSON files
- **Cloud Storage**: Save and load data from Supabase cloud storage
- **Session Storage**: Temporarily store calculated rooms for quick access

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: shadcn/ui for beautiful, accessible components
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Zustand for simple, efficient state management
- **Cloud Storage**: Supabase for serverless cloud storage
- **Table Management**: TanStack Table v8 for powerful data tables with sorting and filtering
- **Icons**: Lucide and Radix icons for consistent UI elements

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/trung-hao-tran/unit-ledger.git
cd unit-ledger
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Usage Guide

### Room Management
- Use the main table to view all rooms
- Click column headers to sort by any field
- Use the search box to filter rooms by name
- Use the block dropdown to filter by building/block

### Calculation Mode
1. Click "Thêm điện nước tháng mới" to enter calculation mode
2. Select rooms to update in the preparation stage
3. Enter new utility readings in the calculation stage
4. Save to update the database

### Cloud Storage
1. Enter a cloud name in the input field
2. Click "Lưu" to save current data to the cloud
3. Click "Tải" to load data from the cloud

### Printing
1. Click "In" to enter printing mode
2. Select rooms to include in the printout
3. Choose utility cost set to apply
4. Select printing options (invoice, total sheet, receiving sheet)
5. Click "In" to generate and download PDFs

## Project Structure

```
src/
  ├── components/      # React components
  │   ├── ui/          # shadcn/ui components
  │   └── ...          # Application-specific components
  ├── lib/             # Utility functions and services
  │   ├── cloud-storage.ts  # Supabase integration
  │   └── pdf-generator.ts  # PDF generation utilities
  ├── store/           # Zustand state management
  │   ├── rooms.ts     # Room data store
  │   ├── cloud-store.ts    # Cloud storage state
  │   └── ...          # Other state stores
  ├── types/           # TypeScript type definitions
  └── App.tsx          # Main application component
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [TanStack Table](https://tanstack.com/table/v8) for the powerful table functionality
- [Supabase](https://supabase.com/) for the backend storage solution

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
