export interface AddAddressRequest {
  lineOne: string;
  lineTwo?: string;
  city: string;
  country: string;
  pincode: string;
  phone: string;
}

export interface UpdateAddressRequest {
  lineOne?: string;
  lineTwo?: string;
  city?: string;
  country?: string;
  pincode?: string;
  phone?: string;
}
