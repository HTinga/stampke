import Dexie, { Table } from 'dexie';
import { Envelope, StampConfig, StampTemplate } from '../types';

export interface LocalDocument {
  id: string;
  name: string;
  type: string; // 'pdf' | 'docx'
  data: ArrayBuffer;
  createdAt: number;
}

export interface LocalStamp {
  id: string;
  name: string;
  config: StampConfig;
  svgPreview?: string;
  createdAt: number;
}

export class StampKEDatabase extends Dexie {
  documents!: Table<LocalDocument>;
  envelopes!: Table<Envelope>;
  stamps!: Table<LocalStamp>;

  constructor() {
    super('StampKEDatabase');
    this.version(1).stores({
      documents: 'id, name, type, createdAt',
      envelopes: 'id, title, status, createdAt, updatedAt',
      stamps: 'id, name, createdAt'
    });
  }
}

export const db = new StampKEDatabase();

// Helper functions for easy access
export const saveLocalDocument = async (doc: LocalDocument) => {
  return await db.documents.put(doc);
};

export const getLocalDocument = async (id: string) => {
  return await db.documents.get(id);
};

export const deleteLocalDocument = async (id: string) => {
  return await db.documents.delete(id);
};

export const listLocalDocuments = async () => {
  return await db.documents.orderBy('createdAt').reverse().toArray();
};

export const saveLocalStamp = async (stamp: LocalStamp) => {
  return await db.stamps.put(stamp);
};

export const listLocalStamps = async () => {
  return await db.stamps.orderBy('createdAt').reverse().toArray();
};

export const saveLocalEnvelope = async (envelope: Envelope) => {
  return await db.envelopes.put(envelope);
};

export const getLocalEnvelope = async (id: string) => {
  return await db.envelopes.get(id);
};

export const listLocalEnvelopes = async () => {
  return await db.envelopes.orderBy('createdAt').reverse().toArray();
};
