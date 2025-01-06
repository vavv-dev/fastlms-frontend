import 'yup';

declare module 'yup' {
  interface CustomSchemaMetadata {
    control?:
      | 'text'
      | 'checkbox'
      | 'select'
      | 'multiselect'
      | 'date'
      | 'datetime-local'
      | 'time'
      | 'number'
      | 'file'
      | 'password'
      | 'editor'
      | 'thumbnail';
    multiline?: boolean;
    helperText?: string;
    placeholderText?: string;
    tooltipText?: string;
    hidden?: boolean;
    grid?: number;
    options?: { label: string; value: string; disabled?: boolean }[];
    accept?: string;
    readOnly?: boolean;
    orderable?: boolean;
    max?: number;
    useArrayNewline?: boolean;
    disabled?: boolean;
  }

  interface SchemaRefDescription {
    meta?: CustomSchemaMetadata;
    label?: string;
  }
}
