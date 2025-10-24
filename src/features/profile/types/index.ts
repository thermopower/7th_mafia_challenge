export type ProfileGender = 'male' | 'female';

export interface Profile {
  id: string;
  name: string;
  gender: ProfileGender;
  birthDate: string;
  birthTime: string | null;
  isLunar: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  name: string;
  gender: ProfileGender;
  birthDate: string;
  birthTime?: string;
  isLunar: boolean;
}

export interface ProfilesListData {
  profiles: Profile[];
  total: number;
  canAddMore: boolean;
}
