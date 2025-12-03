export interface FieldDefinition {
  id: string;
  name: string;
  length: number;
  color: string;
}

export interface ParseResult {
  segments: {
    fieldId: string;
    value: string;
    isOverflow?: boolean;
    isUnderflow?: boolean;
  }[];
  originalLine: string;
}

export enum ParsingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
