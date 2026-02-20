'use client';

import { collection, doc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export type ActionType = 'LOGIN' | 'DOCUMENT_DOWNLOAD' | 'DOCUMENT_UPLOAD' | 'DOCUMENT_EDIT' | 'DOCUMENT_DELETE' | 'USER_BLOCKED' | 'INQUIRY_SUBMITTED';

export function logActivity(
  firestore: Firestore,
  userId: string,
  actionType: ActionType,
  details: string,
  documentId?: string,
  affectedUserId?: string
) {
  const colRef = collection(firestore, 'activityLogs');
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    userId,
    actionType,
    timestamp,
    details,
    ...(documentId && { documentId }),
    ...(affectedUserId && { affectedUserId }),
    id: doc(colRef).id, // Generate ID client-side
  };

  addDocumentNonBlocking(colRef, logEntry);
}
