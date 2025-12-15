export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  fieldKey: string;
  label: string;
  required: boolean;
  order: number;
  type: "text" | "date" | "email" | "phone" | "photo" | "textarea";
}

export const DEFAULT_FORM_FIELDS: Omit<FormField, "id">[] = [
  { fieldKey: "firstName", label: "First Name", required: true, order: 0, type: "text" },
  { fieldKey: "lastName", label: "Last Name", required: true, order: 1, type: "text" },
  { fieldKey: "nickname", label: "Nickname", required: false, order: 2, type: "text" },
  { fieldKey: "birthday", label: "Birthday", required: false, order: 3, type: "date" },
  { fieldKey: "email", label: "Email", required: false, order: 4, type: "email" },
  { fieldKey: "phone", label: "Phone", required: false, order: 5, type: "phone" },
  { fieldKey: "photo", label: "Photo", required: false, order: 6, type: "photo" },
  { fieldKey: "notes", label: "Notes", required: false, order: 7, type: "textarea" },
];
