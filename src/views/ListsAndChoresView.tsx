import React from 'react';
import { GroceriesView } from './GroceriesView';

/**
 * Legacy wrapper: Einkauf & Aufgaben was split into GroceriesView and CalendarView (Aufgaben & Belohnungen).
 */
export const ListsAndChoresView: React.FC = () => {
  return <GroceriesView />;
};
