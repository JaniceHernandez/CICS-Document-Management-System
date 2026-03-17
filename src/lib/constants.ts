
/**
 * Official Institutional Constants for CICS DMS
 * 
 * NOTE: Academic programs and document categories are now managed 
 * dynamically via Firestore System Settings. These constants 
 * are kept for fallback utility and type definitions.
 */

export const DOCUMENT_CATEGORIES: {id: string, name: string}[] = [];

export const ACADEMIC_PROGRAMS: {id: string, shortCode: string, name: string}[] = [];

/**
 * Utility functions for resolving names. 
 * Note: Components should prefer lookup from fetched collections.
 */
export const getCategoryName = (id: string) => 'Requirement';
export const getProgramName = (id: string) => 'Institutional';
export const getProgramCode = (id: string) => 'Global';
