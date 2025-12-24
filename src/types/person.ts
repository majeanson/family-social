export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  photo?: string;
  birthday?: string;
  notes?: string;
  email?: string;
  phone?: string;
  address?: Address;
  customFields: CustomField[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: "text" | "date" | "url" | "number";
}

export type PersonFormData = Omit<Person, "id" | "createdAt" | "updatedAt">;
