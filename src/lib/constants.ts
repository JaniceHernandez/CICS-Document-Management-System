/**
 * Official Institutional Constants for CICS DMS
 */

export const DOCUMENT_CATEGORIES = [
  { id: 'form', name: 'Form' },
  { id: 'guidelines', name: 'Guidelines' },
  { id: 'checklist', name: 'Checklist' },
  { id: 'policies', name: 'Policies' },
  { id: 'manuals', name: 'Manuals' },
  { id: 'syllabus', name: 'Syllabus' },
];

export const ACADEMIC_PROGRAMS = [
  { 
    id: 'blis', 
    shortCode: 'BLIS', 
    name: 'Bachelor of Library and Information Science' 
  },
  { 
    id: 'bscs', 
    shortCode: 'BSCS', 
    name: 'Bachelor of Science in Computer Science' 
  },
  { 
    id: 'bsemc-dat', 
    shortCode: 'BSEMC-DAT', 
    name: 'Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Digital Animation Technology' 
  },
  { 
    id: 'bsemc-gd', 
    shortCode: 'BSEMC-GD', 
    name: 'Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Game Development' 
  },
  { 
    id: 'bsit', 
    shortCode: 'BSIT', 
    name: 'Bachelor of Science in Information Technology' 
  },
  { 
    id: 'bsis', 
    shortCode: 'BSIS', 
    name: 'Bachelor of Science in Information System' 
  },
];

export const getCategoryName = (id: string) => 
  DOCUMENT_CATEGORIES.find(c => c.id === id)?.name || 'Requirement';

export const getProgramName = (id: string) => 
  ACADEMIC_PROGRAMS.find(p => p.id === id)?.name || 'Institutional';

export const getProgramCode = (id: string) => 
  ACADEMIC_PROGRAMS.find(p => p.id === id)?.shortCode || 'Global';
